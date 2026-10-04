"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  CheckSquare, 
  RotateCcw, 
  FileSearch, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { DocumentSource, AISettings } from '@/lib/types';
import { SourceReaderMode } from './modes/SourceReaderMode';
import { ExplainMode } from './modes/ExplainMode';
import { AskMode } from './modes/AskMode';
import { FlashcardsMode } from './modes/FlashcardsMode';
import { QuizMode } from './modes/QuizMode';
import { SmartRevisionMode } from './modes/SmartRevisionMode';
import { FocusModal } from './custom/FocusModal';
import { ColoredButton } from './custom/colored-button';

export type FocusModalType = 'flashcards' | 'quiz' | 'revision' | 'ask' | 'explain' | null;

interface StudySpaceProps {
  document: DocumentSource;
  settings: AISettings;
  onInspectDocument: () => void;
  onUpdateDocument: (doc: DocumentSource) => void;
}

export function StudySpace({
  document,
  settings,
  onInspectDocument,
  onUpdateDocument
}: StudySpaceProps) {
  const [activePage, setActivePage] = useState<number>(1);
  const [activeFocusModal, setActiveFocusModal] = useState<FocusModalType>(null);
  const [selectedTopicForFocus, setSelectedTopicForFocus] = useState<string | undefined>(undefined);
  const [explainInitialConcept, setExplainInitialConcept] = useState<string | undefined>(undefined);

  const handleJumpToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
  };

  const handleExplainPassage = (passage: string, page: number) => {
    setExplainInitialConcept(passage.slice(0, 120));
    setActiveFocusModal('explain');
  };

  const handleLaunchTopicQuiz = (topicId?: string) => {
    setSelectedTopicForFocus(topicId);
    setActiveFocusModal('quiz');
  };

  const handleLaunchTopicFlashcards = (topicId?: string) => {
    setSelectedTopicForFocus(topicId);
    setActiveFocusModal('flashcards');
  };

  return (
    <div className="relative min-h-screen">
      {/* Subtle, soft ambient background inspired by resumely */}
      <div className="pointer-events-none fixed inset-0 noise opacity-40 bg-primary/5 dark:opacity-25" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-20 space-y-8">
        {/* Document Header & Focus Mode Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
                {document.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="truncate max-w-xs">{document.fileName}</span>
              <span>•</span>
              <span>{document.pageCount} pages</span>
              <span>•</span>
              <span>{document.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <button
                type="button"
                onClick={onInspectDocument}
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer text-muted-foreground underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700"
              >
                <FileSearch className="w-3 h-3" />
                Raw Text
              </button>
            </div>
          </div>

          {/* Calm Focus Mode Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ColoredButton
              color="indigo"
              size="default"
              onClick={() => {
                setSelectedTopicForFocus(undefined);
                setActiveFocusModal('flashcards');
              }}
              title="Launch Flashcards Focus Session"
            >
              <Layers className="w-3.5 h-3.5" />
              Flashcards
            </ColoredButton>

            <ColoredButton
              color="emerald"
              size="default"
              onClick={() => {
                setSelectedTopicForFocus(undefined);
                setActiveFocusModal('quiz');
              }}
              title="Launch Interactive Quiz Session"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Take Quiz
            </ColoredButton>

            <ColoredButton
              color="amber"
              size="default"
              onClick={() => setActiveFocusModal('revision')}
              title="Smart Revision Queue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Smart Revision
            </ColoredButton>

            <ColoredButton
              color="cyan"
              size="default"
              onClick={() => setActiveFocusModal('ask')}
              title="Ask Notes Questions"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Ask Notes
            </ColoredButton>

            <ColoredButton
              color="purple"
              size="default"
              onClick={() => {
                setExplainInitialConcept(undefined);
                setActiveFocusModal('explain');
              }}
              title="Explain Concept"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Explain
            </ColoredButton>
          </div>
        </div>

        {/* Clean, Tranquil Reading Layout (No cluttered split dashboards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quiet, Minimalist Table of Contents / Outline */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground/80 uppercase tracking-wider font-semibold">
                <span>Outline</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  {document.topics.length} topics
                </span>
              </div>

              <nav className="space-y-1">
                {document.topics.map((t) => {
                  const targetPage = t.pageReferences[0] || 1;
                  const isCurrent = activePage === targetPage;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleJumpToPage(targetPage)}
                      className={`w-full text-left py-2 px-3 rounded-xl transition-all group block text-xs cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-200/70 dark:bg-neutral-800/80 font-medium text-foreground'
                          : 'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="group-hover:underline truncate">
                          {t.title}
                        </span>
                        <span className="text-[10px] font-mono opacity-60 shrink-0">
                          p. {t.pageReferences.join(', ')}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-75 line-clamp-1 mt-0.5 font-normal">
                        {t.summary}
                      </p>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Column: Serene Document Reading Canvas */}
          <section className="lg:col-span-9 min-h-[550px] p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xs">
            <SourceReaderMode
              document={document}
              activePageNumber={activePage}
              onPageChange={setActivePage}
              onExplainPassage={handleExplainPassage}
            />
          </section>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FOCUS MODALS WITH ANIMATED WEBGL CALM SHADER BACKDROP */}
      {/* ========================================================================= */}

      {/* 1. Flashcards Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'flashcards'}
        onClose={() => setActiveFocusModal(null)}
        title="Flashcards Focus Session"
        subtitle={`${document.title} • Leitner Spaced Repetition`}
        color="indigo"
        maxWidth="max-w-2xl"
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300">
            Focus Mode
          </span>
        }
      >
        <FlashcardsMode
          document={document}
          settings={settings}
          onJumpToPage={(p) => {
            setActivePage(p);
            setActiveFocusModal(null);
          }}
          presetTopicId={selectedTopicForFocus}
          onLaunchQuiz={handleLaunchTopicQuiz}
        />
      </FocusModal>

      {/* 2. Quiz Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'quiz'}
        onClose={() => setActiveFocusModal(null)}
        title="Interactive Quiz Session"
        subtitle={`${document.title} • Verified against source text`}
        color="emerald"
        maxWidth="max-w-2xl"
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
            Focus Mode
          </span>
        }
      >
        <QuizMode
          document={document}
          settings={settings}
          onJumpToPage={(p) => {
            setActivePage(p);
            setActiveFocusModal(null);
          }}
          presetTopicId={selectedTopicForFocus}
          onLaunchFlashcards={handleLaunchTopicFlashcards}
        />
      </FocusModal>

      {/* 3. Smart Revision Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'revision'}
        onClose={() => setActiveFocusModal(null)}
        title="Smart Revision Queue"
        subtitle="Priority drills based on your past mistakes and recall telemetry"
        color="amber"
        maxWidth="max-w-2xl"
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
            Telemetry
          </span>
        }
      >
        <SmartRevisionMode
          document={document}
          onLaunchTopicQuiz={handleLaunchTopicQuiz}
          onLaunchFlashcards={handleLaunchTopicFlashcards}
          onJumpToPage={(p) => {
            setActivePage(p);
            setActiveFocusModal(null);
          }}
        />
      </FocusModal>

      {/* 4. Ask Notes Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'ask'}
        onClose={() => setActiveFocusModal(null)}
        title="Ask My Notes"
        subtitle="Grounded Q&A with exact quote references"
        color="cyan"
        maxWidth="max-w-2xl"
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300">
            Grounded Q&A
          </span>
        }
      >
        <AskMode
          document={document}
          settings={settings}
          onJumpToPage={(p) => {
            setActivePage(p);
            setActiveFocusModal(null);
          }}
        />
      </FocusModal>

      {/* 5. Concept Explainer Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'explain'}
        onClose={() => setActiveFocusModal(null)}
        title="Concept Explainer"
        subtitle="Feynman technique, analogies, and structured summaries"
        color="purple"
        maxWidth="max-w-2xl"
        badge={
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300">
            Feynman Mode
          </span>
        }
      >
        <ExplainMode
          document={document}
          settings={settings}
          onJumpToPage={(p) => {
            setActivePage(p);
            setActiveFocusModal(null);
          }}
          initialConcept={explainInitialConcept}
        />
      </FocusModal>
    </div>
  );
}

export default StudySpace;
