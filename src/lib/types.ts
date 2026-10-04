export type SourceType = 'pdf' | 'text' | 'image' | 'sample';

export interface PageContent {
  pageNumber: number;
  text: string;
  confidence: number; // 0 to 100
  wordCount: number;
  hasWarnings?: boolean;
  warningDetails?: string;
}

export interface ProcessingQuality {
  status: 'clean' | 'warnings' | 'low-confidence';
  flags: string[];
  emptyPages: number[];
  ocrUsed: boolean;
  rawCharacterCount: number;
}

export interface Chunk {
  id: string;
  pageNumber: number;
  topicId?: string;
  text: string;
  keywords: string[];
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  pageReferences: number[];
  keyTerms: string[];
  chunkIds: string[];
}

export interface DocumentSource {
  id: string;
  title: string;
  fileName: string;
  fileType: SourceType;
  fileSize: number;
  uploadedAt: string;
  pageCount: number;
  wordCount: number;
  pages: PageContent[];
  topics: Topic[];
  chunks: Chunk[];
  summary: string;
  processingQuality: ProcessingQuality;
  isUserEdited?: boolean;
}

export type FlashcardType = 'concept' | 'term' | 'question' | 'process' | 'contrast';
export type SpacedRepetitionRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  docId: string;
  topicId?: string;
  front: string;
  back: string;
  cardType: FlashcardType;
  sourcePage: number;
  sourcePassage: string;
  difficulty?: SpacedRepetitionRating;
  reps: number;
  intervalDays: number;
  lastReviewed?: string;
  nextReview?: string;
  isUserEdited?: boolean;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface QuizQuestion {
  id: string;
  docId: string;
  topicId?: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple-choice
  correctAnswer: string | number | boolean;
  explanation: string;
  sourcePage: number;
  sourcePassage: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAttempt {
  questionId: string;
  userAnswer: string | number | boolean | null;
  isCorrect: boolean;
  sourcePage: number;
}

export interface QuizSession {
  id: string;
  docId: string;
  docTitle: string;
  topicId?: string;
  date: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  attempts: QuizAttempt[];
  missedQuestionIds: string[];
}

export interface AskAnswer {
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  groundedInNotes: boolean;
  references: {
    pageNumber: number;
    passage: string;
    score: number;
  }[];
  generalContextNote?: string;
}

export type ExplanationStyle = 
  | 'simple' 
  | 'step-by-step' 
  | 'analogy' 
  | 'compare' 
  | 'exam' 
  | 'socratic';

export interface ConceptExplanation {
  topic: string;
  style: ExplanationStyle;
  content: string;
  sourcePage: number;
  sourcePassage: string;
  groundedInNotes: boolean;
  followUpQuestions?: string[];
}

export interface RevisionItem {
  id: string;
  docId: string;
  topicId?: string;
  topicTitle: string;
  reason: string;
  itemType: 'quiz-retry' | 'flashcard-due' | 'concept-review';
  question?: QuizQuestion;
  flashcard?: Flashcard;
  sourcePage: number;
  dueStatus: 'urgent' | 'due' | 'recommended';
}

export type AIProvider = 'ollama' | 'builtin' | 'custom-openai';

export interface AISettings {
  provider: AIProvider;
  ollamaEndpoint: string;
  ollamaModel: string;
  customEndpoint: string;
  customApiKey: string;
  customModel: string;
  temperature: number;
}
