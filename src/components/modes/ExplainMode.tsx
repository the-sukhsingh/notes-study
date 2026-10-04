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
import { ColoredButton } from '@/components/custom/colored-button';

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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Configuration Section */}
      <div className="space-y-4">
        {/* Topic Selector Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
            Select Topic or Concept
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
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedTopic === t.title && !customConcept
                    ? 'bg-purple-600 text-white font-medium shadow-xs'
                    : 'bg-neutral-100/70 dark:bg-neutral-800/60 text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
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
              className="w-full px-3.5 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground/70">
            Explanation Style
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stylesList.map(({ id, label, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedStyle(id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  selectedStyle === id
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium'
                    : 'bg-neutral-100/70 dark:bg-neutral-800/60 text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
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
          <ColoredButton
            color="purple"
            size="lg"
            disabled={loading}
            onClick={handleGenerate}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Concept...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Explain Concept
              </>
            )}
          </ColoredButton>
        </div>
      </div>

      {/* Explanation Output */}
      {explanation && (
        <article className="space-y-6 select-text pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 animate-in fade-in duration-150">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {explanation.topic}
            </h3>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="capitalize">{explanation.style} style</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => onJumpToPage(explanation.sourcePage)}
                className="hover:text-foreground hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3 text-purple-500" />
                Page {explanation.sourcePage}
              </button>
            </div>
          </div>

          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
            {explanation.content}
          </div>

          {explanation.followUpQuestions && explanation.followUpQuestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
                Self-Test & Follow-up Questions
              </span>
              <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-foreground/80 marker:text-purple-400">
                {explanation.followUpQuestions.map((point: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.sourcePassage && (
            <div className="p-3.5 rounded-xl bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Document Quote
              </span>
              <p className="italic text-muted-foreground">
                "{explanation.sourcePassage}"
              </p>
            </div>
          )}
        </article>
      )}
    </div>
  );
}

export default ExplainMode;
