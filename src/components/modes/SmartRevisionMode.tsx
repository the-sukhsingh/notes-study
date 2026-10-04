"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2 
} from 'lucide-react';
import { DocumentSource, RevisionItem, QuizSession } from '@/lib/types';
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
    const items = getRevisionItems(document.id, document);
    setRevisionItems(items);

    const sessions = getQuizSessions(document.id);
    setRecentSessions(sessions.slice(0, 4));

    const cards = getFlashcardsForDoc(document.id);
    const needsReview = cards.filter(c => c.difficulty === 'again' || c.difficulty === 'hard').length;
    setFlashcardStats({ total: cards.length, needsReview });
  }, [document.id]);

  return (
    <div className="space-y-12 max-w-2xl mx-auto">
      {/* Overview */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Smart Revision
        </h2>
        <p className="text-xs text-muted-foreground">
          Personalized practice queue generated from your quiz mistakes and flashcard recall scores.
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-3">
          <span>{revisionItems.length} topics flagged</span>
          <span>•</span>
          <span>{flashcardStats.needsReview} cards need practice</span>
          <span>•</span>
          <span>{recentSessions.length} past quizzes</span>
        </div>
      </div>

      {/* Suggested Focus Areas */}
      <div className="space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
          Recommended Topics
        </span>

        {revisionItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No weak spots flagged yet. Complete a quiz or study flashcards to generate insights.
          </div>
        ) : (
          <div className="space-y-2">
            {revisionItems.map((item) => (
              <div
                key={item.id}
                className="py-3 px-4 -mx-4 rounded-2xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground group-hover:underline truncate">
                      {item.topicTitle}
                    </span>
                    {item.dueStatus === 'urgent' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToPage(item.sourcePage)}
                    className="text-xs font-mono text-muted-foreground hover:underline"
                  >
                    p. {item.sourcePage}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchTopicQuiz(item.topicId)}
                    className="text-xs font-medium text-foreground inline-flex items-center gap-1 hover:opacity-75 active-press"
                  >
                    Practice <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past History */}
      {recentSessions.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-neutral-100 dark:border-neutral-800/60">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
            Recent Practice Sessions
          </span>

          <div className="space-y-1">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-foreground">
                    Quiz Score: {session.scorePercentage}%
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {session.correctCount} of {session.totalQuestions} correct ({session.missedQuestionIds.length} missed)
                  </p>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(session.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
