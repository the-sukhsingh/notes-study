"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Settings, 
  Library,
  ChevronDown,
  Check,
  FileText,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { DocumentSource, AISettings } from '@/lib/types';
import { ModeToggle as ThemeToggle } from './theme/ThemeToggle';
import { ColoredButton } from './custom/colored-button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  documents: DocumentSource[];
  activeDocument: DocumentSource | null;
  onSelectDocument: (docId: string) => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  settings: AISettings;
}

export function Header({
  documents,
  activeDocument,
  onSelectDocument,
  onOpenLibrary,
  onOpenSettings,
  settings
}: HeaderProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close switcher on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    if (switcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [switcherOpen]);

  // Close switcher on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && switcherOpen) {
        setSwitcherOpen(false);
      }
    };
    if (switcherOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [switcherOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800/60 transition-colors">
      {/* Subtle top edge ambient sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 dark:via-indigo-400/20 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4">
        {/* ========================================================================= */}
        {/* LEFT: Brand & Contextual Breadcrumb Switcher */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Brand Mark & Title */}
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2 text-foreground group cursor-pointer shrink-0 select-none active:scale-[0.98] transition-transform"
            title="Study Notes Library"
          >
            <div className="size-7 sm:size-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 p-[1px] shadow-xs group-hover:shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="size-full rounded-[11px] bg-neutral-900/90 dark:bg-neutral-950 flex items-center justify-center text-amber-300">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                StudyNotes
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                Local
              </span>
            </div>
          </button>

          {/* Contextual Path & Quick Document Switcher */}
          {activeDocument ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0" ref={switcherRef}>
              <span className="text-muted-foreground/30 font-light select-none">/</span>

              {/* Library Quick Return */}
              <button
                type="button"
                onClick={onOpenLibrary}
                className="hidden md:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-850"
                title="Return to Notes Library"
              >
                <Library className="size-3" />
                <span>Library</span>
              </button>

              <span className="text-muted-foreground/30 font-light select-none hidden md:inline">/</span>

              {/* Active Document Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSwitcherOpen(!switcherOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer max-w-[150px] sm:max-w-[220px] md:max-w-[280px]",
                    switcherOpen
                      ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-foreground shadow-2xs"
                      : "bg-neutral-100/50 dark:bg-neutral-900/50 border-neutral-200/60 dark:border-neutral-800/60 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700"
                  )}
                  title="Switch study notes"
                  aria-expanded={switcherOpen}
                >
                  {activeDocument.fileType === 'pdf' ? (
                    <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  )}
                  <span className="truncate">{activeDocument.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0 hidden sm:inline">
                    {activeDocument.pageCount}p
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform shrink-0",
                      switcherOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Document Switcher Floating Menu */}
                {switcherOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 sm:w-80 rounded-2xl bg-popover/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.7)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 border-b border-neutral-200/50 dark:border-neutral-800/50 mb-1">
                      <span>Switch Note</span>
                      <span>{documents.length} in library</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                      {documents.map((doc) => {
                        const isCurrent = doc.id === activeDocument.id;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              onSelectDocument(doc.id);
                              setSwitcherOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left",
                              isCurrent
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium"
                                : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {doc.fileType === 'pdf' ? (
                                <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              ) : (
                                <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-xs">{doc.title}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">
                                  {doc.pageCount} pages • {doc.topics.length} topics
                                </p>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800/50">
                      <button
                        type="button"
                        onClick={() => {
                          setSwitcherOpen(false);
                          onOpenLibrary();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <Library className="w-3 h-3" />
                        <span>Open Complete Library</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-850"
              title="Open Notes Library"
            >
              <Layers className="size-3 text-indigo-500" />
              <span className="font-mono text-[11px]">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: Privacy / Local AI Engine status, Quick Actions, Theme */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Privacy & AI Engine Status Badge */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 text-xs text-foreground transition-all cursor-pointer shadow-2xs group active:scale-[0.97]"
            title="Configure Local Model & Privacy (100% On-Device)"
          >
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Local AI
            </span>
            <span className="text-muted-foreground/30 hidden md:inline">•</span>
            <span className="text-[10px] text-muted-foreground font-mono hidden md:inline truncate max-w-[100px]">
              {settings.provider === 'ollama' ? settings.ollamaModel : 'On-Device NLP'}
            </span>
          </button>

          {/* Library Link (when currently in Study Mode) */}
          {activeDocument && (
            <ColoredButton
              color="neutral"
              size="sm"
              onClick={onOpenLibrary}
              className="rounded-xl hidden sm:inline-flex"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Library</span>
            </ColoredButton>
          )}

          {/* Settings & Privacy Action Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xs transition-all active:scale-[0.96] cursor-pointer group"
            title="Settings & Privacy"
            aria-label="Settings"
          >
            <Settings className="size-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>

          {/* Theme Mode Switcher */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;
