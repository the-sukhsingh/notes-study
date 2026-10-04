"use client";

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Edit3, 
  Eye, 
  FileSearch,
  CheckCircle2
} from 'lucide-react';
import { DocumentSource, PageContent } from '@/lib/types';
import { ColoredButton } from './custom/colored-button';
import { FocusModal } from './custom/FocusModal';

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
    <FocusModal
      isOpen={isOpen}
      onClose={onClose}
      title="Extracted Notes Inspection"
      subtitle={document.fileName}
      icon={<FileSearch className="w-4 h-4 text-amber-500" />}
      badge={
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
          Raw OCR / Text
        </span>
      }
      color="amber"
      maxWidth="max-w-3xl"
      headerActions={
        <div className="flex items-center gap-2">
          <ColoredButton
            color="neutral"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Preview' : 'Edit Text'}</span>
          </ColoredButton>

          {isEditing && (
            <ColoredButton
              color="emerald"
              size="sm"
              onClick={handleSaveChanges}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </ColoredButton>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-mono">
          <span>Page {currentPage.pageNumber} of {totalPages} • {currentPage.wordCount} words</span>
          <span>Confidence: {currentPage.confidence}%</span>
        </div>
      }
    >
      <div className="space-y-4">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Document text updated and re-indexed successfully.</span>
          </div>
        )}

        {/* Page Switcher */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-neutral-100/60 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-2">
            <button
              disabled={currentPageIdx <= 0}
              onClick={() => setCurrentPageIdx(prev => prev - 1)}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-foreground font-medium">
              Page {currentPage.pageNumber} of {totalPages}
            </span>
            <button
              disabled={currentPageIdx >= totalPages - 1}
              onClick={() => setCurrentPageIdx(prev => prev + 1)}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
              title="Next Page"
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
              className="w-full p-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-amber-400"
              placeholder="Page text content..."
            />
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/50 font-sans text-sm leading-relaxed text-foreground/90 max-h-[50vh] overflow-y-auto whitespace-pre-wrap select-text no-scrollbar">
              {currentPage.text}
            </div>
          )}
        </div>
      </div>
    </FocusModal>
  );
}

export default InspectionModal;
