"use client";

import React from 'react';
import { 
  BookOpen, 
  Settings, 
  Library
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
  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-neutral-200/40 dark:border-neutral-800/40 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Clean Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Study Notes
            </span>
          </button>

          {activeDocument && (
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-muted-foreground/30 select-none">/</span>
              <button
                type="button"
                onClick={onOpenLibrary}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Library
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Quiet local AI badge, Library, Settings, Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Privacy & AI Engine Status Badge */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Configure Local Model & Privacy"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-foreground">
              Local AI
            </span>
            <span className="text-muted-foreground/40 hidden md:inline">•</span>
            <span className="text-[11px] text-muted-foreground font-mono hidden md:inline">
              {settings.provider === 'ollama' ? settings.ollamaModel : 'On-Device'}
            </span>
          </button>

          {activeDocument && (
            <ColoredButton
              color="neutral"
              size="sm"
              onClick={onOpenLibrary}
              className="hidden sm:inline-flex"
            >
              <Library className="w-3.5 h-3.5" />
              Library
            </ColoredButton>
          )}

          <button
            type="button"
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
