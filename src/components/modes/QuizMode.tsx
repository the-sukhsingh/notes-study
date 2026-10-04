"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  AlertCircle,
  RefreshCw,
  SlidersHorizontal
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

  // Configuration options
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Load initial quiz if none provided
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
    if (submittedAnswers[qId]) return; // locked once checked
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
      // Complete Quiz
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
    <div className="flex flex-col space-y-6">
      {/* Quiz Top Toolbar */}
      {!isFinished && (
        <div className="p-4 rounded-2xl bg-background border border-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-border rounded-xl text-foreground focus:outline-none"
            >
              <option value="all">All Topics ({document.topics.length})</option>
              {document.topics.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-border rounded-xl text-foreground focus:outline-none"
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
            className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-1.5 active-press"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            New Quiz
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-foreground">Generating questions and plausible distractors from notes...</p>
        </div>
      ) : isFinished ? (
        /* Quiz Finished Summary */
        <div className="p-8 sm:p-10 rounded-3xl bg-background border border-border space-y-8 shadow-xs select-text">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-foreground mx-auto flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">Quiz Completed</h2>
            
            {/* Score pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-foreground font-mono text-sm">
              <span>Score:</span>
              <span className="font-bold">
                {questions.filter(q => String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()).length} / {questions.length}
              </span>
              <span>•</span>
              <span>
                {Math.round((questions.filter(q => String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()).length / questions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Breakdown of missed questions */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">Detailed Question Review</h3>
            
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                return (
                  <div 
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect 
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/20' 
                        : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span>Question {idx + 1}: {q.question}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onJumpToPage(q.sourcePage)}
                        className="text-[11px] text-muted-foreground hover:text-foreground shrink-0 underline flex items-center gap-1"
                      >
                        Page {q.sourcePage}
                      </button>
                    </div>

                    <div className="pl-6 space-y-1 text-muted-foreground">
                      <div>
                        Your answer: <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-700 dark:text-rose-400 font-medium'}>{String(userAns || 'No answer selected')}</span>
                      </div>
                      {!isCorrect && (
                        <div>
                          Correct answer: <span className="text-foreground font-medium">{String(q.correctAnswer)}</span>
                        </div>
                      )}
                      <p className="italic pt-1 font-mono text-[11px] text-foreground/80">
                        Explanation: {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => handleGenerateQuiz()}
              className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Start New Quiz
            </button>

            {questions.some(q => String(selectedAnswers[q.id]).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()) && (
              <button
                type="button"
                onClick={handleRetryMissed}
                className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity active-press flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Missed Questions Only
              </button>
            )}
          </div>
        </div>
      ) : currentQ ? (
        /* Active Single Question View */
        <div className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs select-text">
          {/* Progress header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-border/60">
            <span>
              Question <span className="font-semibold text-foreground">{currentQIndex + 1}</span> of {questions.length}
            </span>
            <button
              type="button"
              onClick={() => onJumpToPage(currentQ.sourcePage)}
              className="hover:text-foreground hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Source: Page {currentQ.sourcePage}
            </button>
          </div>

          {/* Question Text */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {(currentQ.options || ['True', 'False']).map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              const isCorrectOpt = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

              let optClasses = 'border-border bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-neutral-400 text-foreground';
              
              if (isSelected && !isCurrentChecked) {
                optClasses = 'border-foreground bg-neutral-100 dark:bg-neutral-800 ring-1 ring-foreground/20 text-foreground font-medium';
              } else if (isCurrentChecked) {
                if (isCorrectOpt) {
                  optClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                } else if (isSelected && !isCorrectOpt) {
                  optClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                } else {
                  optClasses = 'border-border opacity-50 text-muted-foreground';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isCurrentChecked}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optClasses}`}
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

          {/* Verbatim Explanation after check */}
          {isCurrentChecked && (
            <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-in fade-in duration-200 ${
              isCurrentCorrect 
                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200' 
                : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="font-semibold flex items-center gap-1.5">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Incorrect. Correct answer: {String(currentQ.correctAnswer)}
                  </>
                )}
              </div>
              <p className="leading-relaxed text-foreground/80 font-mono text-[11px] pt-1">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Previous
            </button>

            {!isCurrentChecked ? (
              <button
                type="button"
                disabled={selectedAnswers[currentQ.id] === undefined}
                onClick={() => handleCheckAnswer(currentQ.id)}
                className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity active-press"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded-xl hover:opacity-90 transition-opacity active-press flex items-center gap-1.5"
              >
                {currentQIndex === questions.length - 1 ? 'View Final Results' : 'Next Question'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
          No questions generated yet. Click "New Quiz" above to start.
        </div>
      )}
    </div>
  );
}
