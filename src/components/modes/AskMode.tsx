"use client";

import React, { useState } from 'react';
import { 
  Send, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { DocumentSource, AskAnswer, AISettings } from '@/lib/types';
import { askNotesQuestion } from '@/lib/aiEngine';

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

  const suggestedQueries = [
    `What are the core principles of ${document.topics[0]?.title || 'this topic'}?`,
    `How does the mechanism work on Page 1?`,
    `What formulas or conditions are specified in the notes?`
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await askNotesQuestion(q, document, settings);
      setAnswer(res);
    } catch (err) {
      console.error('Ask error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Question Form */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Ask My Notes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Grounded Q&A. Answers cite verbatim passages with exact page numbers.
          </p>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a question about your notes..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-85 disabled:opacity-40 transition-opacity flex items-center gap-1.5 active-press shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask
          </button>
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
      {answer ? (
        <article className="max-w-[70ch] space-y-8 select-text pt-2">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {answer.question}
            </h3>

            <div className="text-[11px] font-mono text-muted-foreground shrink-0">
              {answer.confidence === 'high' ? (
                <span className="text-emerald-600 dark:text-emerald-400">High match</span>
              ) : (
                <span>Evidence limited</span>
              )}
            </div>
          </div>

          {/* Answer Text */}
          <div className="text-[16px] leading-[1.75] whitespace-pre-wrap font-sans text-foreground/90">
            {answer.answer}
          </div>

          {/* References */}
          {answer.references && answer.references.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
                Supporting References ({answer.references.length})
              </span>

              <div className="space-y-3">
                {answer.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onJumpToPage(ref.pageNumber)}
                        className="font-mono text-foreground hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Page {ref.pageNumber}
                      </button>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {(ref.score * 100).toFixed(0)}% match
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono leading-relaxed italic line-clamp-2">
                      "{ref.passage}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Type a question above to retrieve answers grounded in your material.
        </div>
      )}
    </div>
  );
}
