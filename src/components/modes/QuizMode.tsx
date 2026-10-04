"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import { DocumentSource, QuizQuestion, QuizSession, QuizAttempt, AISettings } from '@/lib/types';
import { generateQuiz } from '@/lib/aiEngine';
import { saveQuizSession } from '@/lib/storage';

interface QuizModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
  presetQuestions?: QuizQuestion[];
}

export function QuizMode({
  document,
  settings,
  onJumpToPage,
  presetQuestions
}: QuizModeProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(presetQuestions || []);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
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

  const currentQ = questions[currentQIndex];
  const isCurrentChecked = currentQ ? !!submittedAnswers[currentQ.id] : false;
  const isCurrentCorrect = currentQ && isCurrentChecked
    ? String(selectedAnswers[currentQ.id]).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase()
    : false;

  return (
    <div className="space-y-12">
      {/* Top Toolbar */}
      {!isFinished && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none"
            >
              <option value="all">All Topics ({document.topics.length})</option>
              {document.topics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={8}>8 Questions</option>
            </select>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerateQuiz()}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors active-press"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            New Quiz
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          Formulating questions and explanations...
        </div>
      ) : isFinished ? (
        /* Final Results */
        <div className="max-w-2xl mx-auto space-y-10 pt-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Quiz Results
            </h2>
            <div className="text-sm font-mono text-muted-foreground">
              Score: <span className="text-foreground font-semibold">
                {questions.filter(q => String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()).length} / {questions.length}
              </span>
              <span className="mx-2">•</span>
              <span>
                {Math.round((questions.filter(q => String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()).length / questions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-6">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
              Questions Review
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                return (
                  <div key={q.id} className="space-y-1.5 text-xs py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span className="font-mono text-muted-foreground">{idx + 1}.</span>
                        <span>{q.question}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onJumpToPage(q.sourcePage)}
                        className="text-[11px] font-mono text-muted-foreground hover:underline shrink-0"
                      >
                        Page {q.sourcePage}
                      </button>
                    </div>

                    <div className="pl-5 space-y-1 text-muted-foreground">
                      <p>
                        Your answer: <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>{String(userAns || 'None')}</span>
                        {!isCorrect && (
                          <span> • Correct: <span className="text-foreground font-medium">{String(q.correctAnswer)}</span></span>
                        )}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground/80 italic">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
            <button
              type="button"
              onClick={() => handleGenerateQuiz()}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Start New Quiz
            </button>

            {questions.some(q => String(selectedAnswers[q.id]).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()) && (
              <button
                type="button"
                onClick={handleRetryMissed}
                className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-85 transition-opacity active-press flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Missed Questions
              </button>
            )}
          </div>
        </div>
      ) : currentQ ? (
        /* Active Question Display (No cards, no borders) */
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>
              Question {currentQIndex + 1} <span className="opacity-50">/ {questions.length}</span>
            </span>

            <button
              type="button"
              onClick={() => onJumpToPage(currentQ.sourcePage)}
              className="hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Page {currentQ.sourcePage}
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-1">
            {(currentQ.options || ['True', 'False']).map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              const isCorrectOpt = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

              let rowClass = 'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 text-foreground';
              if (isSelected && !isCurrentChecked) {
                rowClass = 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium';
              } else if (isCurrentChecked) {
                if (isCorrectOpt) {
                  rowClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                } else if (isSelected && !isCorrectOpt) {
                  rowClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                } else {
                  rowClass = 'opacity-40 text-muted-foreground';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isCurrentChecked}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left py-3 px-4 -mx-4 rounded-2xl text-xs transition-colors flex items-center justify-between ${rowClass}`}
                >
                  <span className="leading-relaxed">{opt}</span>
                  {isCurrentChecked && isCorrectOpt && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isCurrentChecked && isSelected && !isCorrectOpt && (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isCurrentChecked && (
            <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-1 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-foreground">
                {isCurrentCorrect ? 'Correct' : `Incorrect — Answer: ${String(currentQ.correctAnswer)}`}
              </span>
              <p className="text-muted-foreground font-mono text-[11px] leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next / Check action */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Previous
            </button>

            {!isCurrentChecked ? (
              <button
                type="button"
                disabled={selectedAnswers[currentQ.id] === undefined}
                onClick={() => handleCheckAnswer(currentQ.id)}
                className="px-5 py-2 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-85 disabled:opacity-40 transition-opacity active-press"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-85 transition-opacity active-press flex items-center gap-1.5"
              >
                {currentQIndex === questions.length - 1 ? 'View Results' : 'Next Question'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-muted-foreground">
          No quiz active. Click "New Quiz" above to begin.
        </div>
      )}
    </div>
  );
}
