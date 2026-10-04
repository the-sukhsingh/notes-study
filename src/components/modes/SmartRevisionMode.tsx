"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2,
  AlertCircle,
  Layers,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { DocumentSource, RevisionItem, QuizSession } from '@/lib/types';
import { getRevisionItems, getQuizSessions, getFlashcardsForDoc } from '@/lib/storage';
import { ColoredButton } from '@/components/custom/colored-button';

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
    const items = getRevisionItems(document.id, document);
    setRevisionItems(items);

    const sessions = getQuizSessions(document.id);
    setRecentSessions(sessions.slice(0, 4));

    const cards = getFlashcardsForDoc(document.id);
    const needsReview = cards.filter(c => c.difficulty === 'again' || c.difficulty === 'hard').length;
    setFlashcardStats({ total: cards.length, needsReview });
  }, [document.id]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Overview Stat Chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            Focus Areas
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {revisionItems.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Topics needing review</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            Due Cards
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {flashcardStats.needsReview}
          </div>
          <p className="text-[11px] text-muted-foreground">Low recall confidence</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            Quizzes Taken
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {recentSessions.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Recent test sessions</p>
        </div>
      </div>

      {/* Recommended Practice Areas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
            Recommended Practice Queue
          </span>
          <div className="flex items-center gap-2">
            <ColoredButton
              color="indigo"
              size="xs"
              onClick={() => onLaunchFlashcards()}
            >
              <Layers className="w-3 h-3" />
              All Cards
            </ColoredButton>
            <ColoredButton
              color="emerald"
              size="xs"
              onClick={() => onLaunchTopicQuiz()}
            >
              <CheckSquare className="w-3 h-3" />
              All Quiz
            </ColoredButton>
          </div>
        </div>

        {revisionItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
            No weak spots detected yet! Take a quiz or study flashcards to establish recall telemetry.
          </div>
        ) : (
          <div className="space-y-2">
            {revisionItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.topicTitle}
                    </span>
                    {item.dueStatus === 'urgent' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToPage(item.sourcePage)}
                    className="text-xs font-mono text-muted-foreground hover:text-foreground hover:underline px-1.5 py-1"
                  >
                    p. {item.sourcePage}
                  </button>

                  <ColoredButton
                    color="amber"
                    size="sm"
                    onClick={() => onLaunchTopicQuiz(item.topicId)}
                  >
                    Quiz <ArrowRight className="w-3 h-3" />
                  </ColoredButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Quiz Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
            Recent Quizzes
          </span>

          <div className="space-y-1.5">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-2.5 px-3 rounded-lg bg-neutral-100/40 dark:bg-neutral-800/30 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground">
                    Score: {session.scorePercentage}%
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {session.correctCount} of {session.totalQuestions} correct ({session.missedQuestionIds.length} missed)
                  </p>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartRevisionMode;
