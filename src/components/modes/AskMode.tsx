"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
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

  // Suggested prompt chips derived from topics and key terms
  const suggestedQueries = [
    `What are the core principles of ${document.topics[0]?.title || 'this topic'}?`,
    `How does the mechanism work on Page 1?`,
    `What conditions or formulas are specified in the notes?`,
    `Why is this concept important according to the document?`
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
    <div className="flex flex-col space-y-6">
      {/* Question Input Card */}
      <div className="p-5 rounded-2xl bg-background border border-border space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Ask My Notes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask any question. Answers are strictly grounded in your uploaded notes with verbatim citations.
          </p>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="e.g. What is the difference between BFS and DFS? or What is the formula for PED?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-neutral-50/50 dark:bg-neutral-900/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2.5 bg-foreground text-background text-xs font-medium rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5 active-press"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Ask Notes
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground">Try asking:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleAsk(sq);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] border border-border/80 bg-neutral-50 dark:bg-neutral-900 text-muted-foreground hover:text-foreground hover:border-neutral-400 transition-colors text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answer Output */}
      {answer ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-background border border-border space-y-6 shadow-xs select-text">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Answer to:</span>
              <span className="text-xs text-muted-foreground italic">"{answer.question}"</span>
            </div>

            <div className="flex items-center gap-1.5">
              {answer.confidence === 'high' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> High Confidence
                </span>
              ) : answer.confidence === 'medium' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Medium Match
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Limited Evidence
                </span>
              )}
            </div>
          </div>

          {/* Answer Text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
            {answer.answer}
          </div>

          {/* Supporting Evidence References */}
          {answer.references && answer.references.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Supporting Source References ({answer.references.length})
                </span>
                <span className="text-[11px] text-muted-foreground">Click to jump into document</span>
              </div>

              <div className="space-y-2">
                {answer.references.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/70 bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">Page {ref.pageNumber}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Relevance Match: {(ref.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed italic line-clamp-2">
                        "{ref.passage}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJumpToPage(ref.pageNumber)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-foreground transition-colors shrink-0 flex items-center gap-1 active-press"
                    >
                      <BookOpen className="w-3 h-3" />
                      View Page {ref.pageNumber}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!answer.groundedInNotes && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Honest AI notice: To prevent hallucinations, the app will not guess answers that cannot be supported by your study material.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-900/30 text-xs text-muted-foreground">
          Type a question above or click one of the suggestions to query your notes.
        </div>
      )}
    </div>
  );
}
