"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  RefreshCw
} from 'lucide-react';
import { DocumentSource, ExplanationStyle, ConceptExplanation, AISettings } from '@/lib/types';
import { explainConcept } from '@/lib/aiEngine';

interface ExplainModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
  initialConcept?: string;
}

export function ExplainMode({
  document,
  settings,
  onJumpToPage,
  initialConcept
}: ExplainModeProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialConcept || document.topics[0]?.title || 'Core concepts'
  );
  const [customConcept, setCustomConcept] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<ExplanationStyle>('simple');
  const [explanation, setExplanation] = useState<ConceptExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  const stylesList: { id: ExplanationStyle; label: string; desc: string }[] = [
    { id: 'simple', label: 'Simple', desc: 'Feynman technique' },
    { id: 'step-by-step', label: 'Step by step', desc: 'Sequential cause & effect' },
    { id: 'analogy', label: 'Analogy', desc: 'Intuitive metaphor' },
    { id: 'compare', label: 'Compare', desc: 'Contrast differences' },
    { id: 'exam', label: 'Exam answer', desc: 'Structured mark scheme' },
    { id: 'socratic', label: 'Check recall', desc: 'Socratic questions' }
  ];

  const handleGenerate = async () => {
    const target = customConcept.trim() || selectedTopic;
    if (!target) return;

    setLoading(true);
    try {
      const res = await explainConcept(target, document, selectedStyle, settings);
      setExplanation(res);
    } catch (err) {
      console.error('Explanation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Configuration Section (No cards, no borders) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Explain My Notes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Grounded conceptual explanations tailored to your revision style.
          </p>
        </div>

        {/* Topic Selector Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
            Select Topic
          </span>
          <div className="flex flex-wrap gap-1.5">
            {document.topics.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTopic(t.title);
                  setCustomConcept('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors active-press ${
                  selectedTopic === t.title && !customConcept
                    ? 'bg-foreground text-background font-medium'
                    : 'bg-neutral-100/60 dark:bg-neutral-800/50 text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-700/60'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="text"
              placeholder="Or type a specific term from your notes..."
              value={customConcept}
              onChange={(e) => setCustomConcept(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-neutral-100/50 dark:bg-neutral-800/40 rounded-full text-foreground focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
            Pedagogical Style
          </span>
          <div className="flex flex-wrap gap-2">
            {stylesList.map(({ id, label, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedStyle(id)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all active-press ${
                  selectedStyle === id
                    ? 'bg-foreground text-background font-medium'
                    : 'bg-neutral-100/60 dark:bg-neutral-800/50 text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-700/60'
                }`}
                title={desc}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="px-5 py-2 bg-foreground text-background text-xs font-medium rounded-full hover:opacity-85 disabled:opacity-40 transition-opacity flex items-center gap-2 active-press"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synthesizing explanation...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Explain
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanation Result Output */}
      {explanation ? (
        <article className="max-w-[70ch] space-y-8 select-text pt-4">
          <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {explanation.topic}
            </h3>

            <button
              type="button"
              onClick={() => onJumpToPage(explanation.sourcePage)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Page {explanation.sourcePage}
            </button>
          </div>

          {/* Formatted Content */}
          <div className="text-[16px] leading-[1.75] whitespace-pre-wrap font-sans text-foreground/90">
            {explanation.content}
          </div>

          {/* Source Excerpt */}
          <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Source Excerpt (Page {explanation.sourcePage})
            </span>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed italic">
              "{explanation.sourcePassage.slice(0, 240)}..."
            </p>
          </div>

          {/* Socratic Questions */}
          {explanation.followUpQuestions && explanation.followUpQuestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                Check your understanding:
              </span>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {explanation.followUpQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-foreground font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ) : (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Select a topic and style above to view a grounded explanation.
        </div>
      )}
    </div>
  );
}
