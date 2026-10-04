import { 
  DocumentSource, 
  Flashcard, 
  QuizSession, 
  RevisionItem, 
  AISettings, 
  SpacedRepetitionRating 
} from './types';
import { SAMPLE_DOCUMENTS } from './sampleNotes';
import { DEFAULT_AI_SETTINGS } from './aiEngine';

const KEYS = {
  DOCUMENTS: 'study_notes_documents_v1',
  ACTIVE_DOC_ID: 'study_notes_active_doc_id_v1',
  FLASHCARDS: 'study_notes_flashcards_v1',
  QUIZ_SESSIONS: 'study_notes_quiz_sessions_v1',
  AI_SETTINGS: 'study_notes_ai_settings_v1',
};

/**
 * Returns all saved documents, seeding with sample documents if first visit.
 */
export function getDocuments(): DocumentSource[] {
  if (typeof window === 'undefined') return SAMPLE_DOCUMENTS;

  try {
    const raw = localStorage.getItem(KEYS.DOCUMENTS);
    if (!raw) {
      // First time initialization: seed sample documents
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(SAMPLE_DOCUMENTS));
      return SAMPLE_DOCUMENTS;
    }
    const docs = JSON.parse(raw);
    return Array.isArray(docs) ? docs : SAMPLE_DOCUMENTS;
  } catch (err) {
    console.error('Failed to read documents from storage:', err);
    return SAMPLE_DOCUMENTS;
  }
}

export function saveDocument(doc: DocumentSource): void {
  if (typeof window === 'undefined') return;
  const docs = getDocuments();
  const existingIdx = docs.findIndex(d => d.id === doc.id);
  
  if (existingIdx >= 0) {
    docs[existingIdx] = doc;
  } else {
    docs.unshift(doc);
  }
  
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  setActiveDocId(doc.id);
}

export function deleteDocument(docId: string): void {
  if (typeof window === 'undefined') return;
  const docs = getDocuments().filter(d => d.id !== docId);
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));

  // Also remove related flashcards and quiz sessions
  const cards = getAllFlashcards().filter(c => c.docId !== docId);
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(cards));

  const sessions = getQuizSessions().filter(s => s.docId !== docId);
  localStorage.setItem(KEYS.QUIZ_SESSIONS, JSON.stringify(sessions));

  // If deleted doc was active, clear or switch
  if (getActiveDocId() === docId) {
    const nextDoc = docs[0];
    if (nextDoc) {
      setActiveDocId(nextDoc.id);
    } else {
      localStorage.removeItem(KEYS.ACTIVE_DOC_ID);
    }
  }
}

export function getActiveDocId(): string | null {
  if (typeof window === 'undefined') return SAMPLE_DOCUMENTS[0].id;
  const saved = localStorage.getItem(KEYS.ACTIVE_DOC_ID);
  if (saved) return saved;

  const docs = getDocuments();
  return docs.length > 0 ? docs[0].id : null;
}

export function setActiveDocId(docId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.ACTIVE_DOC_ID, docId);
}

// -------------------------------------------------------------
// Flashcards Storage & Spaced Repetition Logic
// -------------------------------------------------------------

export function getAllFlashcards(): Flashcard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.FLASHCARDS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read flashcards:', err);
    return [];
  }
}

export function getFlashcardsForDoc(docId: string): Flashcard[] {
  return getAllFlashcards().filter(c => c.docId === docId);
}

export function saveFlashcardsForDoc(docId: string, newCards: Flashcard[]): void {
  if (typeof window === 'undefined') return;
  const all = getAllFlashcards();
  // Keep cards belonging to other docs
  const otherCards = all.filter(c => c.docId !== docId);
  
  // Merge: update existing cards, append new ones
  const existingMap = new Map(all.filter(c => c.docId === docId).map(c => [c.id, c]));
  newCards.forEach(nc => {
    existingMap.set(nc.id, nc);
  });

  const merged = [...otherCards, ...Array.from(existingMap.values())];
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(merged));
}

export function updateFlashcard(card: Flashcard): void {
  if (typeof window === 'undefined') return;
  const all = getAllFlashcards();
  const idx = all.findIndex(c => c.id === card.id);
  if (idx >= 0) {
    all[idx] = card;
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(all));
  }
}

export function addFlashcard(card: Flashcard): void {
  if (typeof window === 'undefined') return;
  const all = getAllFlashcards();
  const exists = all.some(c => c.id === card.id);
  if (!exists) {
    all.push(card);
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(all));
  } else {
    updateFlashcard(card);
  }
}

export function addFlashcards(cards: Flashcard[]): void {
  if (typeof window === 'undefined') return;
  const all = getAllFlashcards();
  const existingMap = new Map(all.map(c => [c.id, c]));
  cards.forEach(c => existingMap.set(c.id, c));
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(Array.from(existingMap.values())));
}

export function deleteFlashcard(cardId: string): void {
  if (typeof window === 'undefined') return;
  const all = getAllFlashcards().filter(c => c.id !== cardId);
  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(all));
}

export function rateFlashcard(cardId: string, rating: SpacedRepetitionRating): Flashcard | null {
  if (typeof window === 'undefined') return null;
  const all = getAllFlashcards();
  const card = all.find(c => c.id === cardId);
  if (!card) return null;

  // Simple, effective spaced repetition scheduling
  const now = new Date();
  card.lastReviewed = now.toISOString();
  card.difficulty = rating;
  card.reps = (card.reps || 0) + 1;

  if (rating === 'again') {
    card.intervalDays = 1;
  } else if (rating === 'hard') {
    card.intervalDays = Math.max(1, Math.round(card.intervalDays * 1.2));
  } else if (rating === 'good') {
    card.intervalDays = Math.max(2, Math.round(card.intervalDays * 2));
  } else if (rating === 'easy') {
    card.intervalDays = Math.max(4, Math.round(card.intervalDays * 3));
  }

  const nextDate = new Date(now.getTime() + card.intervalDays * 24 * 60 * 60 * 1000);
  card.nextReview = nextDate.toISOString();

  localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(all));
  return card;
}

// -------------------------------------------------------------
// Quiz Session History
// -------------------------------------------------------------

export function getQuizSessions(docId?: string): QuizSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.QUIZ_SESSIONS);
    const sessions: QuizSession[] = raw ? JSON.parse(raw) : [];
    return docId ? sessions.filter(s => s.docId === docId) : sessions;
  } catch (err) {
    console.error('Failed to read quiz sessions:', err);
    return [];
  }
}

export function saveQuizSession(session: QuizSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getQuizSessions();
  sessions.unshift(session);
  // Keep last 50 sessions
  localStorage.setItem(KEYS.QUIZ_SESSIONS, JSON.stringify(sessions.slice(0, 50)));
}

// -------------------------------------------------------------
// Smart Revision Queue (Personalized learning based on history)
// -------------------------------------------------------------

export function getRevisionItems(docId: string, doc: DocumentSource): RevisionItem[] {
  const items: RevisionItem[] = [];
  const sessions = getQuizSessions(docId);
  const flashcards = getFlashcardsForDoc(docId);
  const now = new Date().getTime();

  // 1. Check for missed quiz questions from recent sessions
  const missedQuestionMap = new Map<string, { count: number; page: number; topic?: string }>();
  for (const session of sessions.slice(0, 5)) {
    for (const attempt of session.attempts) {
      if (!attempt.isCorrect) {
        const existing = missedQuestionMap.get(attempt.questionId) || { count: 0, page: attempt.sourcePage };
        existing.count++;
        missedQuestionMap.set(attempt.questionId, existing);
      }
    }
  }

  // 2. Identify topics where the student struggled
  if (missedQuestionMap.size > 0) {
    const topicsMissed = new Set<string>();
    missedQuestionMap.forEach((val, qId) => {
      const relatedTopic = doc.topics.find(t => t.pageReferences.includes(val.page)) || doc.topics[0];
      const title = relatedTopic ? relatedTopic.title : `Page ${val.page}`;
      
      if (!topicsMissed.has(title)) {
        topicsMissed.add(title);
        items.push({
          id: `rev-quiz-${qId}`,
          docId,
          topicId: relatedTopic?.id,
          topicTitle: title,
          reason: `You missed questions on this topic in recent practice sessions.`,
          itemType: 'quiz-retry',
          sourcePage: val.page,
          dueStatus: 'urgent'
        });
      }
    });
  }

  // 3. Check for flashcards needing review (Again, Hard, or Overdue)
  for (const card of flashcards) {
    if (card.difficulty === 'again') {
      items.push({
        id: `rev-card-again-${card.id}`,
        docId,
        topicId: card.topicId,
        topicTitle: card.front.slice(0, 45) + (card.front.length > 45 ? '...' : ''),
        reason: `Marked "Again" during last flashcard study session.`,
        itemType: 'flashcard-due',
        flashcard: card,
        sourcePage: card.sourcePage,
        dueStatus: 'urgent'
      });
    } else if (card.nextReview && new Date(card.nextReview).getTime() < now) {
      items.push({
        id: `rev-card-due-${card.id}`,
        docId,
        topicId: card.topicId,
        topicTitle: card.front.slice(0, 45) + (card.front.length > 45 ? '...' : ''),
        reason: `Spaced repetition interval due for review today.`,
        itemType: 'flashcard-due',
        flashcard: card,
        sourcePage: card.sourcePage,
        dueStatus: 'due'
      });
    }
  }

  // 4. If no review items exist yet, suggest a baseline review of first topic
  if (items.length === 0 && doc.topics.length > 0) {
    items.push({
      id: `rev-starter-${doc.topics[0].id}`,
      docId,
      topicId: doc.topics[0].id,
      topicTitle: doc.topics[0].title,
      reason: `Start with this foundational topic to test your recall.`,
      itemType: 'concept-review',
      sourcePage: doc.topics[0].pageReferences[0] || 1,
      dueStatus: 'recommended'
    });
  }

  return items;
}

// -------------------------------------------------------------
// AI Settings Persistence
// -------------------------------------------------------------

export function getAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.AI_SETTINGS);
    return raw ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) } : DEFAULT_AI_SETTINGS;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.AI_SETTINGS, JSON.stringify(settings));
}

// -------------------------------------------------------------
// Backup & Complete Purge Controls
// -------------------------------------------------------------

export function exportBackupJson(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    documents: getDocuments(),
    flashcards: getAllFlashcards(),
    quizSessions: getQuizSessions(),
    aiSettings: getAISettings()
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.documents && Array.isArray(data.documents)) {
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data.documents));
    }
    if (data.flashcards && Array.isArray(data.flashcards)) {
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(data.flashcards));
    }
    if (data.quizSessions && Array.isArray(data.quizSessions)) {
      localStorage.setItem(KEYS.QUIZ_SESSIONS, JSON.stringify(data.quizSessions));
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup:', e);
    return false;
  }
}

export function purgeAllUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.DOCUMENTS);
  localStorage.removeItem(KEYS.ACTIVE_DOC_ID);
  localStorage.removeItem(KEYS.FLASHCARDS);
  localStorage.removeItem(KEYS.QUIZ_SESSIONS);
}
