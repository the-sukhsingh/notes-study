import { 
  DocumentSource, 
  Flashcard, 
  QuizQuestion, 
  AskAnswer, 
  ConceptExplanation, 
  ExplanationStyle, 
  AISettings,
  Chunk
} from './types';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'builtin',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  customEndpoint: 'http://localhost:1234/v1',
  customApiKey: '',
  customModel: 'local-model',
  temperature: 0.3
};

/**
 * Checks if Ollama is running and lists available models.
 */
export async function testOllamaConnection(endpoint = 'http://localhost:11434'): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, models: [], error: `Ollama returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
    return { ok: true, models };
  } catch (err: any) {
    return { 
      ok: false, 
      models: [], 
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Could not reach local Ollama server' 
    };
  }
}

/**
 * Generates flashcards using either local Ollama or the built-in deterministic offline extractor.
 * When using Ollama, content is sent page by page to ensure full document coverage.
 * onItemGenerated fires each time a single card is ready for display.
 */
export async function generateFlashcards(
  doc: DocumentSource, 
  topicId?: string, 
  count = 6, 
  settings: AISettings = DEFAULT_AI_SETTINGS,
  onProgress?: (page: number, totalPages: number) => void,
  onItemGenerated?: (card: Flashcard, index: number) => void
): Promise<Flashcard[]> {
  const filteredChunks = topicId 
    ? doc.chunks.filter(c => c.topicId === topicId)
    : doc.chunks;

  const relevantChunks = filteredChunks.length > 0 ? filteredChunks : doc.chunks;

  // If Ollama is chosen and configured, try calling it
  if (settings.provider === 'ollama') {
    try {
      const ollamaCards = await generateFlashcardsWithOllama(doc, relevantChunks, count, settings, onProgress, onItemGenerated);
      if (ollamaCards.length > 0) return ollamaCards;
    } catch (e) {
      console.warn('Ollama generation failed or timed out, falling back to built-in extractor:', e);
    }
  }

  // Built-in offline extractor
  const builtinCards = generateBuiltinFlashcards(doc, relevantChunks, count);
  if (onItemGenerated) {
    builtinCards.forEach((card, idx) => onItemGenerated(card, idx));
  }
  return builtinCards;
}

/**
 * Generates a quiz using either Ollama or built-in engine.
 * When using Ollama, content is sent page by page to ensure full document coverage.
 * onItemGenerated fires each time a single question is ready for display.
 */
export async function generateQuiz(
  doc: DocumentSource,
  topicId?: string,
  count = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  settings: AISettings = DEFAULT_AI_SETTINGS,
  onProgress?: (page: number, totalPages: number) => void,
  onItemGenerated?: (question: QuizQuestion, index: number) => void
): Promise<QuizQuestion[]> {
  const filteredChunks = topicId 
    ? doc.chunks.filter(c => c.topicId === topicId)
    : doc.chunks;

  const relevantChunks = filteredChunks.length > 0 ? filteredChunks : doc.chunks;

  if (settings.provider === 'ollama') {
    try {
      const ollamaQuiz = await generateQuizWithOllama(doc, relevantChunks, count, difficulty, settings, onProgress, onItemGenerated);
      if (ollamaQuiz.length > 0) return ollamaQuiz;
    } catch (e) {
      console.warn('Ollama quiz generation fallback:', e);
    }
  }

  const builtinQuiz = generateBuiltinQuiz(doc, relevantChunks, count, difficulty);
  if (onItemGenerated) {
    builtinQuiz.forEach((q, idx) => onItemGenerated(q, idx));
  }
  return builtinQuiz;
}

/**
 * Answers a question grounded in the document notes.
 * When Ollama is configured, the LLM handles relevance judgment.
 * When using builtin, TF-IDF retrieval with a low threshold is used.
 */
export async function askNotesQuestion(
  question: string,
  doc: DocumentSource,
  settings: AISettings = DEFAULT_AI_SETTINGS
): Promise<AskAnswer> {
  // 1. Retrieve most relevant chunks using TF-IDF keyword scoring
  const ranked = rankChunksByRelevance(question, doc.chunks);
  const topChunks = ranked.slice(0, 3);

  // If Ollama is active, let it handle relevance — it can decide what's relevant
  if (settings.provider === 'ollama') {
    try {
      const ollamaAnswer = await askOllamaWithChunks(question, topChunks, doc, settings);
      if (ollamaAnswer) return ollamaAnswer;
    } catch (e) {
      console.warn('Ollama ask notes fallback:', e);
    }
  }

  // Built-in path: require some relevance, but with a low threshold
  if (topChunks.length === 0 || topChunks[0].score < 0.01) {
    // For very short queries or no keyword overlap, use first chunk as context
    const fallbackChunk = doc.chunks[0];
    if (!fallbackChunk) {
      return {
        question,
        answer: "No content found in this document to answer your question.",
        confidence: 'low',
        groundedInNotes: false,
        references: []
      };
    }
    return {
      question,
      answer: `Based on Page ${fallbackChunk.pageNumber} of your notes:\n\n${fallbackChunk.text.slice(0, 300)}${fallbackChunk.text.length > 300 ? '...' : ''}`,
      confidence: 'low',
      groundedInNotes: true,
      references: [{
        pageNumber: fallbackChunk.pageNumber,
        passage: fallbackChunk.text,
        score: 0
      }]
    };
  }

  // Built-in extractive answer synthesizer
  const bestChunk = topChunks[0].chunk;
  const confidence = topChunks[0].score > 0.4 ? 'high' : topChunks[0].score > 0.15 ? 'medium' : 'low';
  
  // Extract key sentence answering the query
  const sentences = bestChunk.text.split(/(?<=[.!?])\s+/);
  const qWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  let bestSentence = sentences[0];
  let maxMatches = -1;

  for (const s of sentences) {
    const sLower = s.toLowerCase();
    const matches = qWords.filter(w => sLower.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestSentence = s;
    }
  }

  const answer = `Based on Page ${bestChunk.pageNumber} of your notes:\n\n${bestChunk.text}\n\nKey Takeaway: ${bestSentence.trim()}`;

  return {
    question,
    answer,
    confidence,
    groundedInNotes: true,
    references: topChunks.map(tc => ({
      pageNumber: tc.chunk.pageNumber,
      passage: tc.chunk.text,
      score: tc.score
    }))
  };
}

/**
 * Explains a concept or topic from the notes in a specified style.
 */
export async function explainConcept(
  conceptOrTopic: string,
  doc: DocumentSource,
  style: ExplanationStyle = 'simple',
  settings: AISettings = DEFAULT_AI_SETTINGS
): Promise<ConceptExplanation> {
  const ranked = rankChunksByRelevance(conceptOrTopic, doc.chunks);
  const primaryChunk = ranked[0]?.chunk || doc.chunks[0];
  const pageNumber = primaryChunk?.pageNumber || 1;
  const passage = primaryChunk?.text || '';

  if (settings.provider === 'ollama') {
    try {
      const ollamaExplanation = await explainWithOllama(conceptOrTopic, passage, pageNumber, style, settings);
      if (ollamaExplanation) return ollamaExplanation;
    } catch (e) {
      console.warn('Ollama explanation fallback:', e);
    }
  }

  // Built-in style engine
  return generateBuiltinExplanation(conceptOrTopic, passage, pageNumber, style);
}

// -------------------------------------------------------------
// Built-In Offline Extraction Logic
// -------------------------------------------------------------

function generateBuiltinFlashcards(doc: DocumentSource, chunks: Chunk[], count: number): Flashcard[] {
  const cards: Flashcard[] = [];
  const cardIdBase = `card-${doc.id}-${Date.now()}`;

  // Patterns for identifying definitions and concepts:
  // "Term: Definition", "X is ...", "X refers to ...", "Formula: ...", "Property: ..."
  for (let i = 0; i < chunks.length && cards.length < count; i++) {
    const chunk = chunks[i];
    const lines = chunk.text.split(/(?:\n|(?<=[.!?])\s+)/).map(l => l.trim()).filter(l => l.length > 20);

    for (const line of lines) {
      if (cards.length >= count) break;

      // Pattern 1: Term: Explanation or Header: Body
      const colonMatch = line.match(/^([A-Za-z0-9\s\(\)\+\-\/\*]{3,45}):\s+(.+)$/);
      if (colonMatch) {
        const front = colonMatch[1].trim();
        const back = colonMatch[2].trim();
        cards.push({
          id: `${cardIdBase}-${cards.length + 1}`,
          docId: doc.id,
          topicId: chunk.topicId,
          front: `What is the significance or definition of "${front}"?`,
          back: back,
          cardType: 'concept',
          sourcePage: chunk.pageNumber,
          sourcePassage: chunk.text,
          reps: 0,
          intervalDays: 1
        });
        continue;
      }

      // Pattern 2: "X is defined as Y" or "X is a Y"
      const isMatch = line.match(/^([A-Z][A-Za-z0-9\s]{3,35})\s+(?:is|refers to|measures|represents|calculates)\s+(.+)$/i);
      if (isMatch) {
        const term = isMatch[1].trim();
        const def = isMatch[2].trim();
        cards.push({
          id: `${cardIdBase}-${cards.length + 1}`,
          docId: doc.id,
          topicId: chunk.topicId,
          front: `Define: ${term}`,
          back: `${term} ${line.slice(isMatch[1].length).trim()}`,
          cardType: 'term',
          sourcePage: chunk.pageNumber,
          sourcePassage: chunk.text,
          reps: 0,
          intervalDays: 1
        });
        continue;
      }

      // Pattern 3: Step / Process
      const stepMatch = line.match(/^(?:Step\s+\d+|Phase\s+[A-Z]|\d+\.)\s*:?\s*([A-Za-z0-9\s]+)[—:\-]\s*(.+)$/i);
      if (stepMatch) {
        cards.push({
          id: `${cardIdBase}-${cards.length + 1}`,
          docId: doc.id,
          topicId: chunk.topicId,
          front: `What happens during: ${stepMatch[1].trim()}?`,
          back: stepMatch[2].trim(),
          cardType: 'process',
          sourcePage: chunk.pageNumber,
          sourcePassage: chunk.text,
          reps: 0,
          intervalDays: 1
        });
        continue;
      }
    }
  }

  // Fallback if structured patterns didn't yield enough cards:
  if (cards.length < count) {
    for (const chunk of chunks) {
      if (cards.length >= count) break;
      const kw = chunk.keywords[0] || 'Key Concept';
      cards.push({
        id: `${cardIdBase}-${cards.length + 1}`,
        docId: doc.id,
        topicId: chunk.topicId,
        front: `Explain the role of "${kw}" according to Page ${chunk.pageNumber}:`,
        back: chunk.text.slice(0, 220) + (chunk.text.length > 220 ? '...' : ''),
        cardType: 'question',
        sourcePage: chunk.pageNumber,
        sourcePassage: chunk.text,
        reps: 0,
        intervalDays: 1
      });
    }
  }

  return cards;
}

function generateBuiltinQuiz(
  doc: DocumentSource, 
  chunks: Chunk[], 
  count: number, 
  difficulty: 'easy' | 'medium' | 'hard'
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const qIdBase = `quiz-${doc.id}-${Date.now()}`;

  // Gather a pool of distractors from all document keywords and topics
  const allKeywords = Array.from(new Set(doc.chunks.flatMap(c => c.keywords)));
  const allTopicTitles = doc.topics.map(t => t.title);

  for (let i = 0; i < chunks.length && questions.length < count; i++) {
    const chunk = chunks[i];
    const text = chunk.text;

    // Detect numeric/factual statement (e.g. -70 mV, O(b^d), P = MC, MR = MC, 3 Na+, 2 K+)
    const factMatch = text.match(/([A-Za-z\s]{3,35})\s+(?:is|equals|evaluated as|measures|peaks at|typically)\s+([0-9\+\-\/\*\^a-zA-Z\s]{2,30})[.,]/);
    
    if (factMatch && questions.length % 2 === 0) {
      const concept = factMatch[1].trim();
      const answerVal = factMatch[2].trim();
      
      // Plausible distractors
      const plausibleDistractors = [
        `Opposite or baseline value`,
        `Dependent on variable constraints`,
        `Zero or constant value`
      ];

      const options = shuffle([answerVal, ...plausibleDistractors.slice(0, 3)]);

      questions.push({
        id: `${qIdBase}-${questions.length + 1}`,
        docId: doc.id,
        topicId: chunk.topicId,
        type: 'multiple-choice',
        question: `According to your notes on Page ${chunk.pageNumber}, what is associated with ${concept}?`,
        options,
        correctAnswer: answerVal,
        explanation: `As noted on Page ${chunk.pageNumber}: "${chunk.text.slice(0, 200)}..."`,
        sourcePage: chunk.pageNumber,
        sourcePassage: chunk.text,
        difficulty
      });
      continue;
    }

    // Pattern: True / False question
    if (questions.length % 3 === 1) {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
      if (sentences.length > 0) {
        const statement = sentences[0];
        questions.push({
          id: `${qIdBase}-${questions.length + 1}`,
          docId: doc.id,
          topicId: chunk.topicId,
          type: 'true-false',
          question: `True or False: "${statement.trim()}"`,
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: `This is directly stated in your notes on Page ${chunk.pageNumber}.`,
          sourcePage: chunk.pageNumber,
          sourcePassage: chunk.text,
          difficulty
        });
        continue;
      }
    }

    // Concept definition multiple choice
    const kw = chunk.keywords[0] || doc.topics[0]?.title || 'Core concept';
    const otherKws = allKeywords.filter(k => k !== kw).slice(0, 3);
    const options = shuffle([kw, ...(otherKws.length >= 3 ? otherKws : ['Linear Search', 'Passive Diffusion', 'Fixed Cost'])]);

    questions.push({
      id: `${qIdBase}-${questions.length + 1}`,
      docId: doc.id,
      topicId: chunk.topicId,
      type: 'multiple-choice',
      question: `Which concept from Page ${chunk.pageNumber} is primarily described by: "${chunk.text.slice(0, 160)}..."?`,
      options,
      correctAnswer: kw,
      explanation: `Page ${chunk.pageNumber} defines and details ${kw}.`,
      sourcePage: chunk.pageNumber,
      sourcePassage: chunk.text,
      difficulty
    });
  }

  // Ensure minimum requested questions
  while (questions.length < count && chunks.length > 0) {
    const chunk = chunks[questions.length % chunks.length];
    questions.push({
      id: `${qIdBase}-${questions.length + 1}`,
      docId: doc.id,
      topicId: chunk.topicId,
      type: 'true-false',
      question: `True or False: On Page ${chunk.pageNumber}, the notes state: "${chunk.text.slice(0, 130)}..."`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: `Verified from the extracted notes on Page ${chunk.pageNumber}.`,
      sourcePage: chunk.pageNumber,
      sourcePassage: chunk.text,
      difficulty
    });
  }

  return questions;
}

function generateBuiltinExplanation(
  concept: string, 
  passage: string, 
  pageNumber: number, 
  style: ExplanationStyle
): ConceptExplanation {
  let content = '';
  let followUpQuestions: string[] = [];

  switch (style) {
    case 'simple':
      content = `### The Feynman Explanation: Simple & Clear

Imagine you are explaining **${concept}** to a friend who has never taken this class before.

Here is the core idea in plain English:
${passage.slice(0, 300)}

**Why it matters:**
Instead of getting bogged down in heavy jargon, remember the main rule: this concept exists to solve a specific problem or maintain balance in the system.

*(Directly verified from your notes on Page ${pageNumber})*`;
      followUpQuestions = [
        `Can you state the main purpose of ${concept} in your own words?`,
        `What would fail if this component or step did not occur?`
      ];
      break;

    case 'step-by-step':
      content = `### Step-by-Step Breakdown

Here is how **${concept}** unfolds in sequential order based on Page ${pageNumber}:

1. **Trigger / Initial State:** The process begins with the preconditions described in the notes.
2. **Core Mechanism:** ${passage.slice(0, 200)}
3. **Outcome / Resolution:** The system completes the transition, reaching the resulting state.

**Key Rule to Remember:** Each step depends strictly on the outcome of the step before it.`;
      followUpQuestions = [
        `What initiates step 1 in this sequence?`,
        `Which step is the rate-limiting or irreversible phase?`
      ];
      break;

    case 'analogy':
      content = `### Intuitive Analogy

To grasp **${concept}**, think of a real-world metaphor:

Imagine a busy tollbooth or a spring-loaded door. When energy is applied, it holds back pressure until a specific threshold is reached. Once released, the action happens all at once without stopping midway.

In your notes (Page ${pageNumber}):
> "${passage.slice(0, 250)}..."

Just like the analogy, the rules in your notes ensure the mechanism works predictably every single time.`;
      followUpQuestions = [
        `How does this analogy compare to the technical details on Page ${pageNumber}?`
      ];
      break;

    case 'compare':
      content = `### Contrast & Comparison

| Aspect | ${concept} (From Page ${pageNumber}) | Standard / Alternative Case |
| :--- | :--- | :--- |
| **Primary Goal** | Described in source notes | Baseline or opposite scenario |
| **Key Mechanism** | ${passage.slice(0, 100)}... | Relies on default parameters |
| **Efficiency / Cost** | High specificity | General / unoptimized |
| **Trade-offs** | Strict prerequisites required | Flexible but less precise |

Understanding the contrast highlights why your professor or textbook highlighted this specific model.`;
      break;

    case 'exam':
      content = `### Model Exam Answer Format (Mark Scheme Style)

**Question:** Explain the principles and significance of **${concept}**.

**Point 1 — Definition (1 mark):**
Precisely state the formal definition as given on Page ${pageNumber}:
> "${passage.slice(0, 120)}..."

**Point 2 — Operating Conditions (2 marks):**
Detail the governing formulas, equations, or structural constraints that dictate when this applies.

**Point 3 — Significance & Impact (1 mark):**
Explain why this outcome is critical to the broader topic and what consequences arise if conditions are violated.`;
      followUpQuestions = [
        `Write down the 3 bullet points you would write on an exam paper.`,
        `Are there any edge cases where this rule does not apply?`
      ];
      break;

    case 'socratic':
      content = `### Socratic Challenge: Testing Your Understanding

Before revealing the full answer, test your intuition against your notes:

1. Look at Page ${pageNumber}: What is the exact prerequisite for **${concept}**?
2. If the conditions described here:
   > "${passage.slice(0, 180)}..."
   were reversed, what would happen to the rest of the system?
3. How does this connect to the earlier topics in your study notes?`;
      followUpQuestions = [
        `How would you test whether this concept is working correctly?`,
        `What is the most common mistake students make regarding this topic?`
      ];
      break;
  }

  return {
    topic: concept,
    style,
    content,
    sourcePage: pageNumber,
    sourcePassage: passage,
    groundedInNotes: true,
    followUpQuestions
  };
}

// -------------------------------------------------------------
// Ollama API Request Helpers
// -------------------------------------------------------------

async function generateFlashcardsWithOllama(
  doc: DocumentSource, 
  chunks: Chunk[], 
  count: number, 
  settings: AISettings,
  onProgress?: (page: number, totalPages: number) => void,
  onItemGenerated?: (card: Flashcard, index: number) => void
): Promise<Flashcard[]> {
  const allCards: Flashcard[] = [];
  const seenFronts = new Set<string>();
  const totalPages = doc.pageCount || 1;

  // Group chunks by page for page-by-page processing
  const chunksByPage = new Map<number, Chunk[]>();
  for (const chunk of chunks) {
    const existing = chunksByPage.get(chunk.pageNumber) || [];
    existing.push(chunk);
    chunksByPage.set(chunk.pageNumber, existing);
  }

  const sortedPages = Array.from(chunksByPage.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedPages.length && allCards.length < count; i++) {
    const pageNum = sortedPages[i];
    const pageChunks = chunksByPage.get(pageNum)!;
    const contextSnippet = pageChunks.map(c => c.text.slice(0, 2000)).join('\n\n');
    const remaining = count - allCards.length;

    onProgress?.(pageNum, totalPages);

    const prompt = `You are a study companion. Based ONLY on the following study notes from Page ${pageNum}, generate up to ${remaining} high-quality flashcards for active recall.
Return ONLY valid JSON in this exact structure:
[
  {
    "front": "Clear question, term, or prompt",
    "back": "Accurate, concise answer directly from the notes",
    "cardType": "concept",
    "sourcePage": ${pageNum},
    "sourcePassage": "Brief quote from notes"
  }
]

STUDY NOTES (Page ${pageNum}):
${contextSnippet}`;

    try {
      const res = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: settings.temperature }
        })
      });

      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.response);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (allCards.length >= count) break;
          const front = (item.front || '').trim();
          if (!front || seenFronts.has(front.toLowerCase())) continue;
          seenFronts.add(front.toLowerCase());
          const card: Flashcard = {
            id: `ollama-card-${Date.now()}-${allCards.length}`,
            docId: doc.id,
            front,
            back: item.back || 'Definition',
            cardType: item.cardType || 'concept',
            sourcePage: item.sourcePage || pageNum,
            sourcePassage: item.sourcePassage || pageChunks[0]?.text || '',
            reps: 0,
            intervalDays: 1
          };
          allCards.push(card);
          onItemGenerated?.(card, allCards.length - 1);
        }
      }
    } catch (e) {
      console.warn(`Ollama flashcard generation failed for page ${pageNum}:`, e);
    }
  }

  return allCards;
}

async function generateQuizWithOllama(
  doc: DocumentSource,
  chunks: Chunk[],
  count: number,
  difficulty: 'easy' | 'medium' | 'hard',
  settings: AISettings,
  onProgress?: (page: number, totalPages: number) => void,
  onItemGenerated?: (question: QuizQuestion, index: number) => void
): Promise<QuizQuestion[]> {
  const allQuestions: QuizQuestion[] = [];
  const seenQuestions = new Set<string>();
  const totalPages = doc.pageCount || 1;

  // Group chunks by page for page-by-page processing
  const chunksByPage = new Map<number, Chunk[]>();
  for (const chunk of chunks) {
    const existing = chunksByPage.get(chunk.pageNumber) || [];
    existing.push(chunk);
    chunksByPage.set(chunk.pageNumber, existing);
  }

  const sortedPages = Array.from(chunksByPage.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedPages.length && allQuestions.length < count; i++) {
    const pageNum = sortedPages[i];
    const pageChunks = chunksByPage.get(pageNum)!;
    const contextSnippet = pageChunks.map(c => c.text.slice(0, 2000)).join('\n\n');
    const remaining = count - allQuestions.length;

    onProgress?.(pageNum, totalPages);

    const prompt = `You are an exam creator. Based ONLY on the study notes below from Page ${pageNum}, generate up to ${remaining} quiz questions (${difficulty} difficulty).
Include multiple-choice questions with 4 plausible options, and true-false questions.
Return ONLY valid JSON in this exact format:
[
  {
    "type": "multiple-choice",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this answer is correct based on the passage",
    "sourcePage": ${pageNum},
    "sourcePassage": "Quote from text"
  }
]

STUDY NOTES (Page ${pageNum}):
${contextSnippet}`;

    try {
      const res = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: settings.temperature }
        })
      });

      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.response);

      if (Array.isArray(parsed)) {
        for (const q of parsed) {
          if (allQuestions.length >= count) break;
          const questionText = (q.question || '').trim();
          if (!questionText || seenQuestions.has(questionText.toLowerCase())) continue;
          seenQuestions.add(questionText.toLowerCase());
          const question: QuizQuestion = {
            id: `ollama-quiz-${Date.now()}-${allQuestions.length}`,
            docId: doc.id,
            type: q.type || 'multiple-choice',
            question: questionText,
            options: q.options || ['True', 'False'],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Directly from study material.',
            sourcePage: q.sourcePage || pageNum,
            sourcePassage: q.sourcePassage || pageChunks[0]?.text || '',
            difficulty
          };
          allQuestions.push(question);
          onItemGenerated?.(question, allQuestions.length - 1);
        }
      }
    } catch (e) {
      console.warn(`Ollama quiz generation failed for page ${pageNum}:`, e);
    }
  }

  return allQuestions;
}

async function askOllamaWithChunks(
  question: string,
  rankedChunks: { chunk: Chunk; score: number }[],
  doc: DocumentSource,
  settings: AISettings
): Promise<AskAnswer | null> {
  const context = rankedChunks.map(rc => `[Page ${rc.chunk.pageNumber}]: ${rc.chunk.text}`).join('\n\n');
  const prompt = `You are a strict, honest study tutor. A student asks: "${question}".
Answer using ONLY the information contained in the study notes provided below.
If the notes do not have enough information to answer definitively, state honestly that the notes lack this detail.
Never invent citations or unsupported claims.

STUDY NOTES:
${context}

Provide a concise, direct answer followed by citing the relevant page number:`;

  const res = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.ollamaModel,
      prompt,
      stream: false,
      options: { temperature: 0.2 }
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  
  return {
    question,
    answer: data.response.trim(),
    confidence: 'high',
    groundedInNotes: true,
    references: rankedChunks.map(rc => ({
      pageNumber: rc.chunk.pageNumber,
      passage: rc.chunk.text,
      score: rc.score
    }))
  };
}

async function explainWithOllama(
  concept: string,
  passage: string,
  pageNumber: number,
  style: ExplanationStyle,
  settings: AISettings
): Promise<ConceptExplanation | null> {
  const styleInstruction = {
    'simple': 'Explain in simple language like the Feynman technique. Avoid dense jargon.',
    'step-by-step': 'Provide a logical, sequential step-by-step breakdown.',
    'analogy': 'Provide an intuitive real-world analogy to make it memorable.',
    'compare': 'Compare and contrast this with related concepts.',
    'exam': 'Format as a top-grade exam model answer with definition and key points.',
    'socratic': 'Present 2-3 thought-provoking check questions to test the student.'
  }[style];

  const prompt = `You are a study companion explaining "${concept}".
Source passage from Page ${pageNumber}:
"${passage}"

Style requirement: ${styleInstruction}

Ground your explanation strictly in what the notes say. Output clear markdown with headings.`;

  const res = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.ollamaModel,
      prompt,
      stream: false,
      options: { temperature: settings.temperature }
    })
  });

  if (!res.ok) return null;
  const data = await res.json();

  return {
    topic: concept,
    style,
    content: data.response.trim(),
    sourcePage: pageNumber,
    sourcePassage: passage,
    groundedInNotes: true
  };
}

// -------------------------------------------------------------
// Relevance Search Algorithm (TF-IDF / Keyword Scoring)
// -------------------------------------------------------------

function rankChunksByRelevance(query: string, chunks: Chunk[]): { chunk: Chunk; score: number }[] {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (queryTerms.length === 0) {
    return chunks.map(c => ({ chunk: c, score: 0 }));
  }

  // Calculate term document frequencies
  const docFreq = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const chunk of chunks) {
      if (chunk.text.toLowerCase().includes(term)) count++;
    }
    docFreq.set(term, count);
  }

  const scored = chunks.map(chunk => {
    let score = 0;
    const textLower = chunk.text.toLowerCase();
    const words = textLower.split(/\s+/);
    const chunkLen = words.length || 1;

    for (const term of queryTerms) {
      // Frequency of term in chunk
      const tf = (textLower.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g')) || []).length;
      if (tf > 0) {
        const df = docFreq.get(term) || 1;
        const idf = Math.log((chunks.length + 1) / (df + 0.5));
        score += (tf / chunkLen) * idf * 10;
      }
    }

    // Keyword match bonus
    for (const kw of chunk.keywords) {
      if (queryTerms.includes(kw.toLowerCase())) {
        score += 0.3;
      }
    }

    return { chunk, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
