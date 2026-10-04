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
  FileText
} from 'lucide-react';
import { DocumentSource, AISettings } from '@/lib/types';
import { SourceReaderMode } from './modes/SourceReaderMode';
import { ExplainMode } from './modes/ExplainMode';
import { AskMode } from './modes/AskMode';
import { FlashcardsMode } from './modes/FlashcardsMode';
import { QuizMode } from './modes/QuizMode';
import { SmartRevisionMode } from './modes/SmartRevisionMode';

export type StudyMode = 'source' | 'explain' | 'ask' | 'flashcards' | 'quiz' | 'revision';

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
  const [activeMode, setActiveMode] = useState<StudyMode>('source');
  const [activePage, setActivePage] = useState<number>(1);
  const [explainInitialConcept, setExplainInitialConcept] = useState<string | undefined>(undefined);

  const handleJumpToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
    setActiveMode('source');
  };

  const handleExplainPassage = (passage: string, page: number) => {
    setExplainInitialConcept(passage.slice(0, 100));
    setActiveMode('explain');
  };

  const modes: { id: StudyMode; label: string; icon: any }[] = [
    { id: 'source', label: 'Source', icon: FileText },
    { id: 'explain', label: 'Explain', icon: Sparkles },
    { id: 'ask', label: 'Ask Notes', icon: HelpCircle },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: CheckSquare },
    { id: 'revision', label: 'Smart Revision', icon: RotateCcw }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Top Header & Mode Navigation */}
      <div className="space-y-4">
        {/* Document Title & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {document.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{document.fileName}</span>
              <span>•</span>
              <span>{document.pageCount} pages</span>
              <span>•</span>
              <span>{document.wordCount} words</span>
            </div>
          </div>

          {/* Quick inspect text action */}
          <button
            type="button"
            onClick={onInspectDocument}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto active-press"
          >
            <FileSearch className="w-3.5 h-3.5" />
            Inspect extracted text
          </button>
        </div>

        {/* Minimal Mode Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 border-b border-neutral-100 dark:border-neutral-800/80 -mx-1 px-1">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveMode(id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 active-press ${
                activeMode === id
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Sleek Table of Contents Outline */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">
              <span>Outline</span>
              <span className="font-mono text-[10px]">{document.topics.length}</span>
            </div>

            <nav className="space-y-0.5">
              {document.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleJumpToPage(t.pageReferences[0] || 1)}
                  className="w-full text-left py-2 px-2.5 -mx-2.5 rounded-xl hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 transition-colors group block text-xs"
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-medium text-foreground group-hover:underline truncate">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">
                      p. {t.pageReferences.join(', ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {t.summary}
                  </p>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right Column: Active Study Canvas */}
        <main className="lg:col-span-9 min-h-[500px]">
          {activeMode === 'source' && (
            <SourceReaderMode
              document={document}
              activePageNumber={activePage}
              onPageChange={setActivePage}
              onExplainPassage={handleExplainPassage}
            />
          )}

          {activeMode === 'explain' && (
            <ExplainMode
              document={document}
              settings={settings}
              onJumpToPage={handleJumpToPage}
              initialConcept={explainInitialConcept}
            />
          )}

          {activeMode === 'ask' && (
            <AskMode
              document={document}
              settings={settings}
              onJumpToPage={handleJumpToPage}
            />
          )}

          {activeMode === 'flashcards' && (
            <FlashcardsMode
              document={document}
              settings={settings}
              onJumpToPage={handleJumpToPage}
            />
          )}

          {activeMode === 'quiz' && (
            <QuizMode
              document={document}
              settings={settings}
              onJumpToPage={handleJumpToPage}
            />
          )}

          {activeMode === 'revision' && (
            <SmartRevisionMode
              document={document}
              onLaunchTopicQuiz={() => setActiveMode('quiz')}
              onLaunchFlashcards={() => setActiveMode('flashcards')}
              onJumpToPage={handleJumpToPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
