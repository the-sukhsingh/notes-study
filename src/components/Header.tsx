"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  ChevronDown, 
  Plus, 
  Settings, 
  Library, 
  FileText,
  Sparkles
} from 'lucide-react';
import { DocumentSource, AISettings } from '@/lib/types';
import { ModeToggle as ThemeToggle } from './theme/ThemeToggle';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Doc Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline">
              Study From My Notes
            </span>
          </button>

          <span className="text-muted-foreground/40 hidden sm:inline">/</span>

          {/* Document Switcher Dropdown */}
          <div className="relative min-w-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-neutral-50/60 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-foreground transition-colors max-w-[200px] sm:max-w-xs truncate"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {activeDocument ? activeDocument.title : 'Select Notes'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0 ml-0.5" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl bg-background border border-border shadow-lg z-40 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Study Library ({documents.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(doc.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                          activeDocument?.id === doc.id ? 'bg-neutral-100/80 dark:bg-neutral-800/80 font-medium' : ''
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-foreground">{doc.title}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.pageCount} pages • {doc.wordCount} words</p>
                        </div>
                        {activeDocument?.id === doc.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => {
                        onOpenLibrary();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Import or Switch Material
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: AI Runtime Pill, Theme, Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Privacy & AI Engine Status Badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] text-muted-foreground transition-colors active-press"
            title="Configure Local Model & Privacy"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground hidden md:inline">
              100% Local
            </span>
            <span className="text-muted-foreground/60 hidden md:inline">•</span>
            <span className="truncate max-w-[100px]">
              {settings.provider === 'ollama' ? `Ollama (${settings.ollamaModel})` : 'Built-in Engine'}
            </span>
          </button>

          <button
            onClick={onOpenLibrary}
            className="p-2 rounded-lg border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground transition-colors"
            title="Library"
            aria-label="Library"
          >
            <Library className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground transition-colors"
            title="Settings & Privacy"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="pl-1 border-l border-border/80">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
