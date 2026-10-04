"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles,
  HelpCircle,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { DocumentSource } from '@/lib/types';
import { ColoredButton } from '@/components/custom/colored-button';

interface SourceReaderModeProps {
  document: DocumentSource;
  activePageNumber: number;
  onPageChange: (page: number) => void;
  onExplainPassage?: (passage: string, page: number) => void;
  onAskPassage?: (passage: string, page: number) => void;
  onCreateCardFromPassage?: (passage: string, page: number) => void;
}

export function SourceReaderMode({
  document,
  activePageNumber,
  onPageChange,
  onExplainPassage,
  onAskPassage,
  onCreateCardFromPassage
}: SourceReaderModeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  const currentPage = document.pages.find(p => p.pageNumber === activePageNumber) || document.pages[0];
  const totalPages = document.pages.length;

  const handleCopyPage = () => {
    if (currentPage) {
      navigator.clipboard.writeText(currentPage.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Keyboard navigation for page turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (typeof window !== 'undefined' ? window.document.activeElement?.tagName || '' : '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowRight' && activePageNumber < totalPages) {
        onPageChange(activePageNumber + 1);
      } else if (e.key === 'ArrowLeft' && activePageNumber > 1) {
        onPageChange(activePageNumber - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePageNumber, totalPages, onPageChange]);

  // Floating Contextual Toolbar for Selected Text
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !articleRef.current) {
        setSelectedText('');
        setSelectionCoords(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setSelectedText('');
        setSelectionCoords(null);
        return;
      }

      // Check if selection is inside articleRef
      if (!articleRef.current.contains(selection.anchorNode)) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    };

    window.document.addEventListener('mouseup', handleSelection);
    window.document.addEventListener('keyup', handleSelection);

    return () => {
      window.document.removeEventListener('mouseup', handleSelection);
      window.document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const query = searchQuery.trim();
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200/90 dark:bg-amber-800/70 text-foreground px-1 py-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 select-text relative">
      {/* Top Reading Progress Line */}
      <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-500/80 dark:bg-amber-400/80 transition-all duration-300"
          style={{ width: `${(activePageNumber / totalPages) * 100}%` }}
        />
      </div>

      {/* Sleek, borderless top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
        {/* Search within document */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search within page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl text-foreground focus:outline-none border border-neutral-200/50 dark:border-neutral-700/50 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Page Switcher & Typography Options */}
        <div className="flex items-center gap-3 text-xs">
          {/* Font Size Toggle */}
          <button
            type="button"
            onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
            className="px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-mono transition-colors cursor-pointer"
            title="Toggle Reading Font Size"
          >
            {fontSize === 'normal' ? 'Aa +' : 'Aa -'}
          </button>

          {/* Page Switcher */}
          <div className="flex items-center gap-1 font-mono text-muted-foreground bg-neutral-100/70 dark:bg-neutral-800/60 px-2 py-1 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
            <button
              type="button"
              disabled={activePageNumber <= 1}
              onClick={() => onPageChange(Math.max(1, activePageNumber - 1))}
              className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous page (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-foreground font-medium text-xs">
              {activePageNumber} <span className="opacity-50">/ {totalPages}</span>
            </span>
            <button
              type="button"
              disabled={activePageNumber >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, activePageNumber + 1))}
              className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
              title="Next page (Right Arrow)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPage}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Copy page text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Pristine Reading Canvas */}
      <article 
        ref={articleRef}
        className="max-w-[70ch] mx-auto space-y-6 pt-2"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 font-mono">
          <span>Page {currentPage.pageNumber}</span>
          <span>{currentPage.wordCount} words</span>
        </div>

        <div 
          className={`leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 tracking-[-0.01em] transition-all ${
            fontSize === 'large' 
              ? 'text-lg sm:text-xl leading-[1.8]' 
              : 'text-base sm:text-[17px] leading-[1.72]'
          }`}
        >
          {renderHighlightedText(currentPage.text)}
        </div>
      </article>

      {/* Floating Selection Tooltip */}
      {selectedText && selectionCoords && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
          className="z-50 flex items-center gap-1.5 p-1 rounded-xl bg-background/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        >
          {onExplainPassage && (
            <ColoredButton
              color="purple"
              size="xs"
              onClick={() => {
                onExplainPassage(selectedText, activePageNumber);
                setSelectedText('');
                setSelectionCoords(null);
              }}
            >
              <Sparkles className="w-3 h-3" />
              Explain
            </ColoredButton>
          )}

          {onAskPassage && (
            <ColoredButton
              color="cyan"
              size="xs"
              onClick={() => {
                onAskPassage(selectedText, activePageNumber);
                setSelectedText('');
                setSelectionCoords(null);
              }}
            >
              <HelpCircle className="w-3 h-3" />
              Ask
            </ColoredButton>
          )}

          {onCreateCardFromPassage && (
            <ColoredButton
              color="indigo"
              size="xs"
              onClick={() => {
                onCreateCardFromPassage(selectedText, activePageNumber);
                setSelectedText('');
                setSelectionCoords(null);
              }}
            >
              <Layers className="w-3 h-3" />
              Make Card
            </ColoredButton>
          )}
        </div>
      )}

      {/* Bottom Explainer Prompt */}
      {onExplainPassage && (
        <div className="max-w-[70ch] mx-auto pt-6 text-right border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground">
            Tip: Highlight any sentence to explain, ask, or create flashcards.
          </span>
          <button
            type="button"
            onClick={() => onExplainPassage(currentPage.text.slice(0, 180), currentPage.pageNumber)}
            className="text-xs font-medium text-foreground hover:opacity-75 inline-flex items-center gap-1.5 transition-opacity cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Explain this whole page →
          </button>
        </div>
      )}
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default SourceReaderMode;
