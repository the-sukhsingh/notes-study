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
    <div className="flex flex-col justify-between max-w-2xl mx-auto h-full space-y-4 select-none">
      {/* Overview Stat Chips - Borderless & Clean */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="p-3.5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/40 space-y-0.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/70">
            Focus Areas
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-foreground">
            {revisionItems.length}
          </div>
          <p className="text-[10px] text-muted-foreground/60">Topics to review</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/40 space-y-0.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/70">
            Due Cards
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-foreground">
            {flashcardStats.needsReview}
          </div>
          <p className="text-[10px] text-muted-foreground/60">Low recall score</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/40 space-y-0.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/70">
            Quizzes Taken
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-foreground">
            {recentSessions.length}
          </div>
          <p className="text-[10px] text-muted-foreground/60">Completed sessions</p>
        </div>
      </div>

      {/* Recommended Practice Areas */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Adaptive Revision Queue
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLaunchFlashcards()}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Layers className="w-3 h-3" />
              All Cards
            </button>
            <span className="text-muted-foreground/30">•</span>
            <button
              type="button"
              onClick={() => onLaunchTopicQuiz()}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3 h-3" />
              All Quiz
            </button>
          </div>
        </div>

        {revisionItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl">
            No weak spots detected yet! Take a quiz or study flashcards to establish recall telemetry.
          </div>
        ) : (
          <div className="space-y-1.5">
            {revisionItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-neutral-100/40 dark:bg-neutral-800/30 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {item.topicTitle}
                    </span>
                    {item.dueStatus === 'urgent' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToPage(item.sourcePage)}
                    className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 transition-colors cursor-pointer"
                  >
                    p.{item.sourcePage}
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

      {/* Recent Sessions Brief */}
      {recentSessions.length > 0 && (
        <div className="space-y-1.5 pt-2 shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Recent Scores
          </span>

          <div className="grid grid-cols-2 gap-2">
            {recentSessions.slice(0, 2).map((session) => (
              <div
                key={session.id}
                className="py-2 px-3 rounded-xl bg-neutral-100/40 dark:bg-neutral-800/30 flex items-center justify-between text-xs"
              >
                <span className="font-mono font-medium text-foreground tabular-nums">
                  Score: {session.scorePercentage}%
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {session.correctCount}/{session.totalQuestions}
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
