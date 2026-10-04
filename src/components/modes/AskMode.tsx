"use client";

import React, { useState } from 'react';
import { 
  Send, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { DocumentSource, AskAnswer, AISettings, Flashcard } from '@/lib/types';
import { askNotesQuestion } from '@/lib/aiEngine';
import { addFlashcard } from '@/lib/storage';
import { ColoredButton } from '@/components/custom/colored-button';

interface AskModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
}

export function AskMode({
  document,
  settings,
  onJumpToPage
}: AskModeProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [isSavedAsCard, setIsSavedAsCard] = useState(false);

  const suggestedQueries = [
    `What are the core principles of ${document.topics[0]?.title || 'this topic'}?`,
    `How does the mechanism work on Page 1?`,
    `What key formulas or definitions are specified in the notes?`
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    setIsSavedAsCard(false);
    try {
      const res = await askNotesQuestion(q, document, settings);
      setAnswer(res);
    } catch (err) {
      console.error('Ask error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsFlashcard = () => {
    if (!answer) return;
    const newCard: Flashcard = {
      id: `ask-card-${Date.now()}`,
      docId: document.id,
      front: answer.question,
      back: answer.answer,
      cardType: 'question',
      sourcePage: answer.references[0]?.pageNumber || 1,
      sourcePassage: answer.references[0]?.passage || '',
      reps: 0,
      intervalDays: 1,
      isUserEdited: true
    };
    addFlashcard(newCard);
    setIsSavedAsCard(true);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Question Form */}
      <div className="space-y-3">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask anything about your notes..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl text-foreground focus:outline-none border border-neutral-200/60 dark:border-neutral-700/60 placeholder:text-muted-foreground/60"
          />
          <ColoredButton
            type="submit"
            color="cyan"
            size="lg"
            disabled={loading || !question.trim()}
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask
          </ColoredButton>
        </form>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-muted-foreground/70">Suggestions:</span>
          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Output */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>Analyzing document text and synthesizing answer...</span>
        </div>
      ) : answer ? (
        <article className="space-y-6 select-text pt-2 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {answer.question}
            </h3>

            <div className="text-[11px] font-mono shrink-0">
              {answer.confidence === 'high' ? (
                <span className="text-emerald-600 dark:text-emerald-400">Verified Match</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Evidence Partial</span>
              )}
            </div>
          </div>

          {/* Answer Text */}
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
            {answer.answer}
          </div>

          {/* Quick Action to Save as Flashcard */}
          <div className="flex items-center justify-end pt-1">
            <ColoredButton
              color={isSavedAsCard ? "emerald" : "indigo"}
              size="sm"
              disabled={isSavedAsCard}
              onClick={handleSaveAsFlashcard}
            >
              {isSavedAsCard ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved to Flashcards!
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  Save as Flashcard
                </>
              )}
            </ColoredButton>
          </div>

          {/* References */}
          {answer.references && answer.references.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
                Supporting References ({answer.references.length})
              </span>

              <div className="space-y-2">
                {answer.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onJumpToPage(ref.pageNumber)}
                        className="font-medium text-foreground hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        Page {ref.pageNumber}
                      </button>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {Math.round(ref.score * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "{ref.passage}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : null}
    </div>
  );
}

export default AskMode;
