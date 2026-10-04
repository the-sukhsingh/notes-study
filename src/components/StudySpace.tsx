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
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Bot
} from 'lucide-react';
import { DocumentSource, AISettings, Flashcard } from '@/lib/types';
import { addFlashcard, getFlashcardsForDoc } from '@/lib/storage';
import { SourceReaderMode } from './modes/SourceReaderMode';
import { ExplainMode } from './modes/ExplainMode';
import { AskChatbotSidebar } from './modes/AskChatbotSidebar';
import { FlashcardsMode } from './modes/FlashcardsMode';
import { QuizMode } from './modes/QuizMode';
import { SmartRevisionMode } from './modes/SmartRevisionMode';
import { FocusModal } from './custom/FocusModal';
import { ColoredButton } from './custom/colored-button';

export type FocusModalType = 'flashcards' | 'quiz' | 'revision' | 'explain' | null;

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
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [selectedTopicForFocus, setSelectedTopicForFocus] = useState<string | undefined>(undefined);
  const [explainInitialConcept, setExplainInitialConcept] = useState<string | undefined>(undefined);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotInitialQuery, setChatbotInitialQuery] = useState<string | undefined>(undefined);

  const handleJumpToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
  };

  const handleExplainPassage = (passage: string, page: number) => {
    setExplainInitialConcept(passage.slice(0, 140));
    setActiveFocusModal('explain');
  };

  const handleAskPassage = (passage: string, page: number) => {
    setChatbotInitialQuery(`Can you explain this excerpt from Page ${page}: "${passage.slice(0, 150)}..."?`);
    setIsChatbotOpen(true);
  };

  const handleCreateCardFromPassage = (passage: string, page: number) => {
    const newCard: Flashcard = {
      id: `passage-card-${Date.now()}`,
      docId: document.id,
      front: `Key Concept (Page ${page}):`,
      back: passage,
      cardType: 'concept',
      sourcePage: page,
      sourcePassage: passage,
      reps: 0,
      intervalDays: 1,
      isUserEdited: true
    };
    addFlashcard(newCard);
    setActiveFocusModal('flashcards');
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

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-16 space-y-6">
        {/* ─── Resumely-style Master Anchor Header Card ─── */}
        <section className="group relative rounded-[28px] bg-gradient-to-b from-card/90 to-card/40 dark:from-card/40 dark:to-card/10 p-5 sm:p-6 transition-all duration-200 shadow-xs overflow-hidden outline-1 outline-neutral-200/60 dark:outline-neutral-800/60">
          <div className="absolute inset-0 blur-2xl pointer-events-none">
            <span className="size-80 rounded-full bg-violet-200/40 dark:bg-violet-400/15 inline-flex absolute -left-5 -translate-y-1/2" />
            <span className="size-80 rounded-full bg-emerald-200/40 dark:bg-emerald-400/10 inline-flex absolute -right-5 -translate-y-1/3" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div>
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                  {document.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">
                  {document.fileName} • Private local workspace
                </p>
              </div>

              {/* Structured Stat Chips matching Resumely style */}
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/90">
                  <strong className="text-foreground font-semibold font-mono">{document.pageCount}</strong>
                  <span className="text-muted-foreground">pages</span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/90">
                  <strong className="text-foreground font-semibold font-mono">{document.wordCount.toLocaleString()}</strong>
                  <span className="text-muted-foreground">words</span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/90">
                  <strong className="text-foreground font-semibold font-mono">{document.topics.length}</strong>
                  <span className="text-muted-foreground">topics</span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/90">
                  <strong className="text-foreground font-semibold font-mono">{getFlashcardsForDoc(document.id).length || 6}</strong>
                  <span className="text-muted-foreground">cards</span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <button
                  type="button"
                  onClick={onInspectDocument}
                  className="hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer text-muted-foreground text-[11px] underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700"
                >
                  <FileSearch className="w-3 h-3" />
                  Raw Text
                </button>
              </div>
            </div>

            {/* Calm Learning Tool Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
              <ColoredButton
                color="indigo"
                size="default"
                onClick={() => {
                  setSelectedTopicForFocus(undefined);
                  setActiveFocusModal('flashcards');
                }}
                title="Launch Flashcards Recall Session"
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
                title="Launch Interactive Quiz"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Take Quiz
              </ColoredButton>

              <ColoredButton
                color="amber"
                size="default"
                onClick={() => setActiveFocusModal('revision')}
                title="Open Smart Revision"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Revision
              </ColoredButton>

              <ColoredButton
                color={isChatbotOpen ? "cyan" : "neutral"}
                size="default"
                onClick={() => setIsChatbotOpen((prev) => !prev)}
                title="Ask Notes Chatbot"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Ask Notes
              </ColoredButton>
            </div>
          </div>
        </section>

        {/* Clean, Tranquil Reading Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quiet, Minimalist Table of Contents / Outline */}
          {isOutlineVisible && (
            <aside className="lg:col-span-3 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                  <span className="font-mono text-[11px] uppercase tracking-wider">Outline ({document.topics.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsOutlineVisible(false)}
                    className="p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Collapse Outline (Zen Reading Mode)"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
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
                            p.{t.pageReferences.join(', ')}
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
          )}

          {/* Right Column: Serene Document Reading Canvas */}
          <div className={`${isOutlineVisible ? 'lg:col-span-9' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} space-y-2 transition-all`}>
            {!isOutlineVisible && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOutlineVisible(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer font-mono"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                  Show Outline
                </button>
              </div>
            )}
            <section className="min-h-[550px] p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xs">
              <SourceReaderMode
                document={document}
                activePageNumber={activePage}
                onPageChange={setActivePage}
                onExplainPassage={handleExplainPassage}
                onAskPassage={handleAskPassage}
                onCreateCardFromPassage={handleCreateCardFromPassage}
              />
            </section>
          </div>
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
        icon={<Layers className="w-4 h-4 text-indigo-500" />}
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
        icon={<CheckSquare className="w-4 h-4 text-emerald-500" />}
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
        icon={<Sparkles className="w-4 h-4 text-amber-500" />}
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

      {/* 4. Ask Notes Right-Side Slide-Over Chatbot */}
      <AskChatbotSidebar
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        document={document}
        settings={settings}
        onJumpToPage={(p) => setActivePage(p)}
        initialQuery={chatbotInitialQuery}
        onClearInitialQuery={() => setChatbotInitialQuery(undefined)}
      />

      {/* 5. Concept Explainer Focus Modal */}
      <FocusModal
        isOpen={activeFocusModal === 'explain'}
        onClose={() => setActiveFocusModal(null)}
        title="Concept Explainer"
        subtitle="Feynman technique, analogies, and structured summaries"
        icon={<HelpCircle className="w-4 h-4 text-purple-500" />}
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
