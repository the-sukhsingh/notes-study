"use client";

import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Edit3, 
  Eye,
  FileSearch
} from 'lucide-react';
import { DocumentSource, PageContent } from '@/lib/types';
import { ColoredButton } from './custom/colored-button';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentSource;
  onUpdateDocument: (doc: DocumentSource) => void;
}

export function InspectionModal({
  isOpen,
  onClose,
  document,
  onUpdateDocument
}: InspectionModalProps) {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPages, setEditedPages] = useState<PageContent[]>(document.pages);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPage = editedPages[currentPageIdx] || editedPages[0];
  const totalPages = editedPages.length;

  const handleTextChange = (newText: string) => {
    const updated = [...editedPages];
    const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    updated[currentPageIdx] = {
      ...updated[currentPageIdx],
      text: newText,
      wordCount: words,
      confidence: 100
    };
    setEditedPages(updated);
  };

  const handleSaveChanges = () => {
    const totalWords = editedPages.reduce((acc, p) => acc + p.wordCount, 0);
    const updatedDoc: DocumentSource = {
      ...document,
      pages: editedPages,
      wordCount: totalWords,
      isUserEdited: true
    };
    onUpdateDocument(updatedDoc);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-100">
      <div 
        className="w-full max-w-3xl bg-background/95 dark:bg-neutral-900/95 backdrop-blur-2xl ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.7)] rounded-[28px] p-6 sm:p-7 space-y-6 max-h-[88vh] overflow-y-auto no-scrollbar text-foreground"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div>
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-foreground">Extracted Notes Inspection</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{document.fileName}</p>
          </div>

          <div className="flex items-center gap-2">
            <ColoredButton
              color="neutral"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Preview' : 'Edit Text'}
            </ColoredButton>

            {isEditing && (
              <ColoredButton
                color="emerald"
                size="sm"
                onClick={handleSaveChanges}
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </ColoredButton>
            )}

            <button 
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>Document text updated and re-indexed successfully.</span>
          </div>
        )}

        {/* Page Switcher */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-neutral-100/60 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-2">
            <button
              disabled={currentPageIdx <= 0}
              onClick={() => setCurrentPageIdx(prev => prev - 1)}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-foreground font-medium">
              Page {currentPage.pageNumber} of {totalPages}
            </span>
            <button
              disabled={currentPageIdx >= totalPages - 1}
              onClick={() => setCurrentPageIdx(prev => prev + 1)}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>{currentPage.wordCount} words</span>
            <span>Confidence: {currentPage.confidence}%</span>
          </div>
        </div>

        {/* Content Viewer / Editor */}
        <div className="space-y-2">
          {isEditing ? (
            <textarea
              rows={14}
              value={currentPage.text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full p-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 font-mono text-xs leading-relaxed text-foreground focus:outline-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/50 font-sans text-sm leading-relaxed text-foreground/90 max-h-[50vh] overflow-y-auto whitespace-pre-wrap select-text">
              {currentPage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InspectionModal;
