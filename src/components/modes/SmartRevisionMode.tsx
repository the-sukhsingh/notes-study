"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  History, 
  Layers, 
  BrainCircuit,
  Trophy
} from 'lucide-react';
import { DocumentSource, RevisionItem, QuizSession, Flashcard } from '@/lib/types';
import { getRevisionItems, getQuizSessions, getFlashcardsForDoc } from '@/lib/storage';

interface SmartRevisionModeProps {
  document: DocumentSource;
  onLaunchTopicQuiz: (topicId?: string) => void;
  onLaunchFlashcards: (topicId?: string) => void;
  onJumpToPage: (page: number) => void;
}

export function SmartRevisionMode({
  document,
  onLaunchTopicQuiz,
  onLaunchFlashcards,
  onJumpToPage
}: SmartRevisionModeProps) {
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<QuizSession[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<{ total: number; needsReview: number }>({
    total: 0,
    needsReview: 0
  });

  useEffect(() => {
    // Load recommendations from storage
    const items = getRevisionItems(document.id, document);
    setRevisionItems(items);

    const sessions = getQuizSessions(document.id);
    setRecentSessions(sessions.slice(0, 4));

    const cards = getFlashcardsForDoc(document.id);
    const needsReview = cards.filter(c => c.difficulty === 'again' || c.difficulty === 'hard').length;
    setFlashcardStats({ total: cards.length, needsReview });
  }, [document.id]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-background border border-border space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
          Personalized Study Queue
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Smart Revision Suggestions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Targeted practice queue calculated from your past quiz results and flashcard memory ratings.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-border/70 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
            <span className="text-muted-foreground">Items Requiring Review</span>
            <div className="text-lg font-bold text-foreground mt-0.5">{revisionItems.length}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
            <span className="text-muted-foreground">Flashcards Needing Work</span>
            <div className="text-lg font-bold text-foreground mt-0.5">
              {flashcardStats.needsReview} <span className="text-xs font-normal text-muted-foreground">/ {flashcardStats.total}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
            <span className="text-muted-foreground">Recent Practice Quizzes</span>
            <div className="text-lg font-bold text-foreground mt-0.5">{recentSessions.length}</div>
          </div>
        </div>
      </div>

      {/* Suggested Focus Areas */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Recommended Topics to Revisit
        </h3>

        {revisionItems.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            No weak areas flagged yet! Take a quiz or study flashcards to generate revision insights.
          </div>
        ) : (
          <div className="space-y-2.5">
            {revisionItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border bg-background hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.topicTitle}</span>
                    {item.dueStatus === 'urgent' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        Needs Practice
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToPage(item.sourcePage)}
                    className="px-2.5 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    title="View notes page"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Page {item.sourcePage}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchTopicQuiz(item.topicId)}
                    className="px-3 py-1.5 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity active-press flex items-center gap-1"
                  >
                    Practice Quiz
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Practice History */}
      {recentSessions.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Past Practice History
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-border/80 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    Quiz Score: {session.scorePercentage}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(session.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{session.correctCount} of {session.totalQuestions} questions correct</span>
                  <span>{session.missedQuestionIds.length} missed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
