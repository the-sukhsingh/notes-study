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
  ShieldCheck,
  AlertTriangle,
  Menu,
  X
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [explainInitialConcept, setExplainInitialConcept] = useState<string | undefined>(undefined);

  // Jump to specific page and switch to source reader
  const handleJumpToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
    setActiveMode('source');
  };

  const handleExplainPassage = (passage: string, page: number) => {
    setExplainInitialConcept(passage.slice(0, 100));
    setActiveMode('explain');
  };

  const modes: { id: StudyMode; label: string; icon: any }[] = [
    { id: 'source', label: 'Source Notes', icon: FileText },
    { id: 'explain', label: 'Explain', icon: Sparkles },
    { id: 'ask', label: 'Ask Notes', icon: HelpCircle },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: CheckSquare },
    { id: 'revision', label: 'Smart Revision', icon: RotateCcw }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header / Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-mono">{document.fileName}</span>
            <span>•</span>
            <span>{document.pageCount} pages</span>
            <span>•</span>
            <span>{document.wordCount} words</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {document.title}
          </h1>
        </div>

        {/* Mode Selector Tabs (Apple segmented control style) */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 border border-border/70 rounded-2xl overflow-x-auto max-w-full">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveMode(id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 active-press ${
                activeMode === id
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Outline & Document Overview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quality Banner & Inspector Button */}
          <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-900/60 border border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Extraction Status</span>
              {document.processingQuality.status === 'clean' ? (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Clean
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Inspection Needed
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onInspectDocument}
              className="w-full py-1.5 px-3 rounded-xl border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-1.5 active-press"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Inspect & Edit Extracted Text
            </button>
          </div>

          {/* Topic Outline Navigator */}
          <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Topic Outline</span>
              <span className="text-muted-foreground text-[11px] font-mono">
                {document.topics.length} topics
              </span>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {document.topics.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => handleJumpToPage(t.pageReferences[0] || 1)}
                  className="p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors text-xs group"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-medium text-foreground group-hover:underline line-clamp-1">
                      {t.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      P. {t.pageReferences.join(', ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {t.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Column: Active Study Mode */}
        <div className="lg:col-span-3">
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
        </div>
      </div>
    </div>
  );
}
