"use client";

import React, { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { DocumentSource } from '@/lib/types';

interface SourceReaderModeProps {
  document: DocumentSource;
  activePageNumber: number;
  onPageChange: (page: number) => void;
  onExplainPassage?: (passage: string, page: number) => void;
  onAskPassage?: (passage: string, page: number) => void;
}

export function SourceReaderMode({
  document,
  activePageNumber,
  onPageChange,
  onExplainPassage,
  onAskPassage
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

  // Highlight search terms inside text
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) {
      return text;
    }
    const query = searchQuery.trim();
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-800 text-foreground px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Controls: Search, Page Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/80 border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search within document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activePageNumber <= 1}
            onClick={() => onPageChange(Math.max(1, activePageNumber - 1))}
            className="p-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-medium text-foreground px-1">
            Page {activePageNumber} of {totalPages}
          </span>

          <button
            type="button"
            disabled={activePageNumber >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, activePageNumber + 1))}
            className="p-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCopyPage}
            className="ml-2 p-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy page text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Reader Page View */}
      <div className="flex-1 bg-background border border-border rounded-2xl p-6 sm:p-8 overflow-y-auto shadow-xs select-text">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-border/60">
            <span className="font-mono">{document.fileName} • Page {currentPage.pageNumber}</span>
            <span>{currentPage.wordCount} words</span>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/95">
            {renderHighlightedText(currentPage.text)}
          </div>
        </div>
      </div>

      {/* Bottom Context Helpers */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <span>Original notes remain the reference point for all generated questions and explanations.</span>
        {onExplainPassage && (
          <button
            onClick={() => onExplainPassage(currentPage.text.slice(0, 180), currentPage.pageNumber)}
            className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 active-press"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Explain this page
          </button>
        )}
      </div>
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
