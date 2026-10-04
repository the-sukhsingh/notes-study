"use client";

import React, { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { DocumentSource } from '@/lib/types';

interface SourceReaderModeProps {
  document: DocumentSource;
  activePageNumber: number;
  onPageChange: (page: number) => void;
  onExplainPassage?: (passage: string, page: number) => void;
}

export function SourceReaderMode({
  document,
  activePageNumber,
  onPageChange,
  onExplainPassage
}: SourceReaderModeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const currentPage = document.pages.find(p => p.pageNumber === activePageNumber) || document.pages[0];
  const totalPages = document.pages.length;

  const handleCopyPage = () => {
    if (currentPage) {
      navigator.clipboard.writeText(currentPage.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const query = searchQuery.trim();
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200/80 dark:bg-amber-800/60 text-foreground px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-8 select-text">
      {/* Sleek, borderless top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search within page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Page Switcher & Copy */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-mono text-muted-foreground">
            <button
              type="button"
              disabled={activePageNumber <= 1}
              onClick={() => onPageChange(Math.max(1, activePageNumber - 1))}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-1 text-foreground font-medium">
              {activePageNumber} <span className="text-muted-foreground/60">/ {totalPages}</span>
            </span>
            <button
              type="button"
              disabled={activePageNumber >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, activePageNumber + 1))}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPage}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Copy page text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Pristine Reading Canvas */}
      <article className="max-w-[70ch] mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 font-mono">
          <span>Page {currentPage.pageNumber}</span>
          <span>{currentPage.wordCount} words</span>
        </div>

        <div className="text-base sm:text-[17px] leading-[1.7] whitespace-pre-wrap font-sans text-foreground/90 tracking-[-0.01em]">
          {renderHighlightedText(currentPage.text)}
        </div>
      </article>

      {/* Bottom Explainer Prompt */}
      {onExplainPassage && (
        <div className="max-w-[70ch] mx-auto pt-6 text-right">
          <button
            type="button"
            onClick={() => onExplainPassage(currentPage.text.slice(0, 180), currentPage.pageNumber)}
            className="text-xs font-medium text-foreground hover:opacity-75 inline-flex items-center gap-1.5 transition-opacity active-press"
          >
            <Sparkles className="w-3.5 h-3.5 text-foreground/80" />
            Explain this page with AI →
          </button>
        </div>
      )}
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
