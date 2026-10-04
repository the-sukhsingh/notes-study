"use client";

import React, { useState } from 'react';
import { 
  X, 
  FileSearch, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Edit3, 
  Eye,
  ChevronLeft,
  ChevronRight
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
      confidence: 100 // manually verified
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground">
              <FileSearch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold leading-tight text-foreground">Inspect Extracted Notes</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-mono">
                  {document.fileName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Verify extraction fidelity and correct any OCR or parsing errors</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quality Audit Bar */}
        <div className="px-6 py-3 bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-border text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Quality Status:</span>
            {document.processingQuality.status === 'clean' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clean text extraction
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Extraction warnings
              </span>
            )}
            <span className="text-muted-foreground/60">•</span>
            <span className="text-muted-foreground font-mono">Total {document.wordCount} words</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isEditing
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground'
              }`}
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Preview Mode' : 'Edit Text'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1.5 active-press"
              >
                <Save className="w-3.5 h-3.5" />
                Save Corrections
              </button>
            )}
          </div>
        </div>

        {/* Page Viewer & Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Page metadata & warnings */}
          {currentPage && (
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">Page {currentPage.pageNumber}</span>
                <span className="text-muted-foreground">{currentPage.wordCount} words</span>
                <span className="text-muted-foreground">Confidence: {currentPage.confidence}%</span>
              </div>
              {currentPage.hasWarnings && (
                <div className="text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {currentPage.warningDetails || 'Low text density'}
                </div>
              )}
            </div>
          )}

          {/* Text editor or viewer */}
          {isEditing ? (
            <textarea
              value={currentPage?.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-80 p-4 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed resize-none"
              placeholder="Page text content..."
            />
          ) : (
            <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/50 border border-border/60 rounded-xl max-h-96 overflow-y-auto text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground select-text">
              {currentPage?.text || 'No text extracted for this page.'}
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Document text updated successfully! Your revisions are now active across quizzes and Q&A.
            </div>
          )}
        </div>

        {/* Footer with page navigation */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPageIdx === 0}
              onClick={() => setCurrentPageIdx(prev => Math.max(0, prev - 1))}
              className="p-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">
              Page {currentPageIdx + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPageIdx >= totalPages - 1}
              onClick={() => setCurrentPageIdx(prev => Math.min(totalPages - 1, prev + 1))}
              className="p-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
