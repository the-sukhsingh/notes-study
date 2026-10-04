"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  RefreshCw,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { DocumentSource, QuizQuestion, QuizSession, QuizAttempt, AISettings, Flashcard } from '@/lib/types';
import { generateQuiz } from '@/lib/aiEngine';
import { saveQuizSession, addFlashcards } from '@/lib/storage';
import { ColoredButton } from '@/components/custom/colored-button';
import { Layers } from 'lucide-react';

interface QuizModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
  presetQuestions?: QuizQuestion[];
  presetTopicId?: string;
  onLaunchFlashcards?: (topicId?: string) => void;
}

export function QuizMode({
  document,
  settings,
  onJumpToPage,
  presetQuestions,
  presetTopicId,
  onLaunchFlashcards
}: QuizModeProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(presetQuestions || []);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [convertedCardsCount, setConvertedCardsCount] = useState<number | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(presetTopicId || 'all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    if (presetQuestions && presetQuestions.length > 0) {
      setQuestions(presetQuestions);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setIsFinished(false);
    } else {
      handleGenerateQuiz();
    }
  }, [document.id, presetQuestions]);

  useEffect(() => {
    if (presetTopicId) {
      setSelectedTopicId(presetTopicId);
    }
  }, [presetTopicId]);

  const handleGenerateQuiz = async (retryQuestions?: QuizQuestion[]) => {
    if (retryQuestions && retryQuestions.length > 0) {
      setQuestions(retryQuestions);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setIsFinished(false);
      return;
    }

    setLoading(true);
    try {
      const topicId = selectedTopicId === 'all' ? undefined : selectedTopicId;
      const res = await generateQuiz(document, topicId, questionCount, difficulty, settings);
      setQuestions(res);
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setIsFinished(false);
    } catch (e) {
      console.error('Quiz generation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, option: any) => {
    if (submittedAnswers[qId]) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleCheckAnswer = (qId: string) => {
    if (selectedAnswers[qId] === undefined) return;
    setSubmittedAnswers(prev => ({ ...prev, [qId]: true }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const attempts: QuizAttempt[] = questions.map(q => {
      const userAns = selectedAnswers[q.id];
      const isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      return {
        questionId: q.id,
        userAnswer: userAns ?? null,
        isCorrect,
        sourcePage: q.sourcePage
      };
    });

    const correctCount = attempts.filter(a => a.isCorrect).length;
    const missedIds = attempts.filter(a => !a.isCorrect).map(a => a.questionId);

    const session: QuizSession = {
      id: `quiz-session-${Date.now()}`,
      docId: document.id,
      docTitle: document.title,
      topicId: selectedTopicId === 'all' ? undefined : selectedTopicId,
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctCount,
      scorePercentage: Math.round((correctCount / questions.length) * 100),
      attempts,
      missedQuestionIds: missedIds
    };

    saveQuizSession(session);
    setIsFinished(true);
  };

  const handleRetryMissed = () => {
    const missedQuestions = questions.filter(q => {
      const userAns = selectedAnswers[q.id];
      return String(userAns).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase();
    });

    if (missedQuestions.length > 0) {
      handleGenerateQuiz(missedQuestions);
    }
  };

  const handleCreateCardsFromMissed = () => {
    const missed = questions.filter(q => {
      const userAns = selectedAnswers[q.id];
      return String(userAns).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase();
    });
    if (missed.length === 0) return;

    const newCards: Flashcard[] = missed.map(q => ({
      id: `quiz-card-${q.id}-${Date.now()}`,
      docId: document.id,
      topicId: q.topicId,
      front: q.question,
      back: `Correct: ${q.correctAnswer}\n\n${q.explanation}`,
      cardType: 'question',
      sourcePage: q.sourcePage,
      sourcePassage: q.sourcePassage,
      reps: 0,
      intervalDays: 1,
      difficulty: 'again'
    }));

    addFlashcards(newCards);
    setConvertedCardsCount(newCards.length);
  };

  const currentQ = questions[currentQIndex];
  const isCurrentChecked = currentQ ? !!submittedAnswers[currentQ.id] : false;
  const currentUserAns = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isCurrentCorrect = currentQ && isCurrentChecked 
    ? String(currentUserAns).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase()
    : false;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Quiz Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-lg text-foreground focus:outline-none border border-neutral-200/50 dark:border-neutral-700/50"
          >
            <option value="all">All Topics ({document.topics.length})</option>
            {document.topics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            disabled={loading}
            className="px-2.5 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-lg text-foreground focus:outline-none border border-neutral-200/50 dark:border-neutral-700/50"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <ColoredButton
          color="emerald"
          size="sm"
          disabled={loading}
          onClick={() => handleGenerateQuiz()}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          New Quiz
        </ColoredButton>
      </div>

      {loading ? (
        <div className="py-28 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Generating quiz questions from your notes...</span>
        </div>
      ) : isFinished ? (
        /* Quiz Finished Overview */
        <div className="py-8 space-y-8 text-center animate-in fade-in duration-200">
          <div className="space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Quiz Completed!
            </h3>
            {(() => {
              const correct = questions.filter(q => 
                String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
              ).length;
              const pct = Math.round((correct / questions.length) * 100);
              return (
                <div className="space-y-1">
                  <div className="text-4xl font-bold font-mono tracking-tight text-foreground">
                    {pct}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {correct} of {questions.length} questions correct
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {questions.some(q => String(selectedAnswers[q.id]).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()) && (
              <>
                <ColoredButton
                  color="emerald"
                  size="lg"
                  onClick={handleRetryMissed}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Missed Questions
                </ColoredButton>

                <ColoredButton
                  color="indigo"
                  size="lg"
                  disabled={convertedCardsCount !== null}
                  onClick={handleCreateCardsFromMissed}
                >
                  <Layers className="w-4 h-4" />
                  {convertedCardsCount !== null
                    ? `Added ${convertedCardsCount} to Flashcards!`
                    : 'Convert Missed to Flashcards'}
                </ColoredButton>
              </>
            )}

            <ColoredButton
              color="neutral"
              size="lg"
              onClick={() => {
                setConvertedCardsCount(null);
                handleGenerateQuiz();
              }}
            >
              Take Another Quiz
            </ColoredButton>
          </div>
        </div>
      ) : questions.length > 0 && currentQ ? (
        /* Question Answering View */
        <div className="space-y-6">
          {/* Question Header & Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="font-medium text-foreground">
              Question {currentQIndex + 1} <span className="opacity-50">/ {questions.length}</span>
            </span>

            <button
              type="button"
              onClick={() => onJumpToPage(currentQ.sourcePage)}
              className="hover:text-foreground flex items-center gap-1 text-[11px]"
            >
              <BookOpen className="w-3 h-3" />
              Source Page {currentQ.sourcePage}
            </button>
          </div>

          {/* Progress track */}
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Prompt */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
              {currentQ.type === 'multiple-choice' ? 'Multiple Choice' : 'True / False'}
            </span>
            <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {(currentQ.options || []).map((option, idx) => {
              const isSelected = currentUserAns === option;
              let optionStyle = "bg-neutral-100/50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/60 dark:border-neutral-700/60";

              if (isCurrentChecked) {
                const isCorrectOption = String(option).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();
                if (isCorrectOption) {
                  optionStyle = "bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-medium";
                } else if (isSelected && !isCurrentCorrect) {
                  optionStyle = "bg-rose-100/80 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200";
                } else {
                  optionStyle = "opacity-50 border-transparent";
                }
              } else if (isSelected) {
                optionStyle = "bg-neutral-200/80 dark:bg-neutral-700/80 border-neutral-400 dark:border-neutral-500 font-medium";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isCurrentChecked}
                  onClick={() => handleSelectOption(currentQ.id, option)}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-neutral-200/60 dark:bg-neutral-700/60 text-xs font-mono flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isCurrentChecked && (
                    <div>
                      {String(option).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase() ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box when checked */}
          {isCurrentChecked && (
            <div className={`p-4 rounded-xl text-xs space-y-2 animate-in fade-in duration-150 ${
              isCurrentCorrect 
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span>{isCurrentCorrect ? 'Correct!' : 'Incorrect'}</span>
                <span className="font-mono text-[11px]">Cited: Page {currentQ.sourcePage}</span>
              </div>
              <p className="leading-relaxed opacity-90">{currentQ.explanation}</p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground font-mono">
              {currentUserAns === undefined && !isCurrentChecked ? 'Select an answer to continue' : ''}
            </span>

            <div>
              {!isCurrentChecked ? (
                <ColoredButton
                  color="emerald"
                  size="lg"
                  disabled={currentUserAns === undefined}
                  onClick={() => handleCheckAnswer(currentQ.id)}
                >
                  Check Answer
                </ColoredButton>
              ) : (
                <ColoredButton
                  color="indigo"
                  size="lg"
                  onClick={handleNext}
                >
                  {currentQIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    'View Quiz Results'
                  )}
                </ColoredButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <p className="text-sm text-muted-foreground">No questions found for this topic.</p>
          <ColoredButton color="emerald" onClick={() => handleGenerateQuiz()}>
            Generate Questions
          </ColoredButton>
        </div>
      )}
    </div>
  );
}

export default QuizMode;
