"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  Plus, 
  Settings, 
  Library, 
  FileText
} from 'lucide-react';
import { DocumentSource, AISettings } from '@/lib/types';
import { ModeToggle as ThemeToggle } from './theme/ThemeToggle';
import { ColoredButton } from './custom/colored-button';

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
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-15 flex items-center justify-between gap-4">
        {/* Brand & Document Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity shrink-0 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Study Notes
            </span>
          </button>

          <span className="text-muted-foreground/30 text-xs hidden sm:inline select-none">/</span>

          {/* Seamless Document Switcher Dropdown */}
          <div className="relative min-w-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-xs font-medium text-foreground transition-colors max-w-[200px] sm:max-w-xs truncate cursor-pointer"
            >
              <span className="truncate text-foreground/90 font-medium">
                {activeDocument ? activeDocument.title : 'All Notes'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground/70 shrink-0 ml-0.5" />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-2 w-76 rounded-2xl bg-background/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 shadow-2xl z-40 py-2 animate-in fade-in duration-100 text-xs border border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="px-3.5 py-1.5 text-[10px] font-mono tracking-wider text-muted-foreground/80 uppercase">
                    Your Course Materials ({documents.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 px-1.5">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(doc.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer ${
                          activeDocument?.id === doc.id ? 'bg-neutral-100/70 dark:bg-neutral-800/60 font-medium' : ''
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-foreground text-xs">{doc.title}</p>
                          <p className="text-[10px] text-muted-foreground/70 font-mono">{doc.pageCount} pages • {doc.wordCount.toLocaleString()} words</p>
                        </div>
                        {activeDocument?.id === doc.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 px-1.5">
                    <button
                      onClick={() => {
                        onOpenLibrary();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-foreground hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      Import New Notes
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Actions: Local badge, Library, Settings, Theme */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Privacy & AI Engine Status Badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Configure Local Model & Privacy"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground text-[11px] hidden sm:inline">
              100% Local
            </span>
            <span className="text-muted-foreground/40 hidden sm:inline">•</span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {settings.provider === 'ollama' ? settings.ollamaModel : 'On-Device AI'}
            </span>
          </button>

          <ColoredButton
            color="neutral"
            size="sm"
            onClick={onOpenLibrary}
            className="hidden sm:inline-flex"
          >
            <Library className="w-3.5 h-3.5" />
            Library
          </ColoredButton>

          <button
            onClick={onOpenSettings}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Settings & Privacy"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default Header;
