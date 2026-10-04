"use client";

import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Edit3, 
  Eye 
} from 'lucide-react';
import { DocumentSource, PageContent } from '@/lib/types';

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
        className="w-full max-w-3xl bg-background rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-white/10"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
          <div>
            <h2 className="text-base font-semibold text-foreground">Extracted Notes Inspection</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{document.fileName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Preview' : 'Edit Text'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-foreground text-background hover:opacity-85 transition-opacity active-press"
              >
                Save
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page metadata */}
        {currentPage && (
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Page {currentPage.pageNumber} of {totalPages}</span>
            <span>{currentPage.wordCount} words • Confidence: {currentPage.confidence}%</span>
          </div>
        )}

        {/* Content Viewer / Editor */}
        <div>
          {isEditing ? (
            <textarea
              value={currentPage?.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-80 p-4 text-xs font-mono bg-neutral-50/70 dark:bg-neutral-900/60 rounded-2xl text-foreground focus:outline-none leading-relaxed resize-none"
            />
          ) : (
            <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-2xl max-h-96 overflow-y-auto text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground select-text">
              {currentPage?.text || 'No text extracted.'}
            </div>
          )}

          {saveSuccess && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-2">
              ✓ Page corrections saved successfully.
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              type="button"
              disabled={currentPageIdx === 0}
              onClick={() => setCurrentPageIdx(prev => Math.max(0, prev - 1))}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{currentPageIdx + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPageIdx >= totalPages - 1}
              onClick={() => setCurrentPageIdx(prev => Math.min(totalPages - 1, prev + 1))}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
