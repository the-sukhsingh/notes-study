"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  RefreshCw,
  Lightbulb,
  ListOrdered,
  Scale,
  GraduationCap,
  MessageSquare
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

  const stylesList: { id: ExplanationStyle; label: string; icon: any; desc: string }[] = [
    { id: 'simple', label: 'Simple Language', icon: Lightbulb, desc: 'Feynman technique: plain, intuitive words' },
    { id: 'step-by-step', label: 'Step by Step', icon: ListOrdered, desc: 'Sequential cause-and-effect progression' },
    { id: 'analogy', label: 'Practical Analogy', icon: Sparkles, desc: 'Relatable real-world metaphor' },
    { id: 'compare', label: 'Compare & Contrast', icon: Scale, desc: 'Differences between related concepts' },
    { id: 'exam', label: 'Exam Model Answer', icon: GraduationCap, desc: 'Structured for grading mark schemes' },
    { id: 'socratic', label: 'Check My Understanding', icon: MessageSquare, desc: 'Socratic questions to test recall' }
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
    <div className="flex flex-col space-y-6">
      {/* Configuration Header */}
      <div className="p-5 rounded-2xl bg-background border border-border space-y-5 shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Explain My Notes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a topic or type any concept to generate a grounded explanation from your material.
          </p>
        </div>

        {/* Topic Selector / Custom Input */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-foreground">Select a Topic from Notes</label>
          <div className="flex flex-wrap gap-2">
            {document.topics.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTopic(t.title);
                  setCustomConcept('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selectedTopic === t.title && !customConcept
                    ? 'border-foreground bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border-border bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-neutral-400 text-foreground'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <input
              type="text"
              placeholder="Or type a specific term or question from your notes..."
              value={customConcept}
              onChange={(e) => setCustomConcept(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        </div>

        {/* Style Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Choose Explanation Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stylesList.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedStyle(id)}
                className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  selectedStyle === id
                    ? 'border-foreground bg-neutral-50 dark:bg-neutral-900 ring-1 ring-foreground/20'
                    : 'border-border bg-background hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                  <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground line-clamp-1">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            AI grounded in {document.title}
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 active-press shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Explanation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanation Result Output */}
      {explanation ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-background border border-border space-y-6 shadow-xs select-text">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{explanation.topic}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-muted-foreground capitalize">
                  {explanation.style.replace('-', ' ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grounded explanation from your uploaded notes
              </p>
            </div>

            {/* Jump to Page Reference */}
            <button
              type="button"
              onClick={() => onJumpToPage(explanation.sourcePage)}
              className="px-3 py-1.5 rounded-lg border border-border bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Jump to Page {explanation.sourcePage}
            </button>
          </div>

          {/* Formatted Content */}
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-foreground">
            {explanation.content}
          </div>

          {/* Grounding Source Passage Excerpt */}
          <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/70 border border-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Verbatim Source Note (Page {explanation.sourcePage}):</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed italic">
              "{explanation.sourcePassage.slice(0, 280)}..."
            </p>
          </div>

          {/* Socratic Follow-Up Questions */}
          {explanation.followUpQuestions && explanation.followUpQuestions.length > 0 && (
            <div className="p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
              <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Check Your Recall:
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {explanation.followUpQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-900/30 text-xs text-muted-foreground">
          Choose a topic and style above to generate your first explanation.
        </div>
      )}
    </div>
  );
}
