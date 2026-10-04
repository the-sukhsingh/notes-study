"use client";

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  FileCode,
  Sparkles,
  Search,
  BookOpen,
  Layers,
  CheckSquare,
  Clock,
  Plus
} from 'lucide-react';
import { DocumentSource } from '@/lib/types';
import { 
  extractFromPdfFile, 
  extractFromTextFile, 
  processRawText, 
  createDocumentFromPages 
} from '@/lib/extractor';
import { SAMPLE_DOCUMENTS } from '@/lib/sampleNotes';
import { getFlashcardsForDoc } from '@/lib/storage';
import { ColoredButton } from './custom/colored-button';

interface LibraryViewProps {
  documents: DocumentSource[];
  activeDocId: string | null;
  onSelectDocument: (docId: string) => void;
  onSaveDocument: (doc: DocumentSource) => void;
  onDeleteDocument: (docId: string) => void;
  onInspectDocument: (doc: DocumentSource) => void;
}

export function LibraryView({
  documents,
  activeDocId,
  onSelectDocument,
  onSaveDocument,
  onDeleteDocument,
  onInspectDocument
}: LibraryViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStatus(`Reading "${file.name}" locally on-device...`);

      let extractionResult;
      const isPdf = file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        setProcessingStatus('Extracting text and preserving page numbers...');
        extractionResult = await extractFromPdfFile(file);
      } else {
        setProcessingStatus('Parsing document content...');
        extractionResult = await extractFromTextFile(file);
      }

      setProcessingStatus('Structuring outline, flashcards, and quizzes...');
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      const newDoc = createDocumentFromPages(
        cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        file.name,
        isPdf ? 'pdf' : 'text',
        file.size,
        extractionResult.pages,
        extractionResult.quality
      );

      onSaveDocument(newDoc);
      setIsProcessing(false);
      onSelectDocument(newDoc.id);
    } catch (err: any) {
      console.error('Extraction error:', err);
      alert('Could not process this file. Please ensure it is a readable text or PDF document.');
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    setProcessingStatus('Analyzing pasted notes and structuring topics...');

    const title = pastedTitle.trim() || 'Custom Study Notes';
    const result = processRawText(pastedText, title);
    
    const newDoc = createDocumentFromPages(
      title,
      `${title.toLowerCase().replace(/\s+/g, '_')}.txt`,
      'text',
      pastedText.length,
      result.pages,
      result.quality
    );

    onSaveDocument(newDoc);
    setIsProcessing(false);
    setShowPasteModal(false);
    setPastedTitle('');
    setPastedText('');
    onSelectDocument(newDoc.id);
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.fileName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="relative min-h-screen">
      {/* Subtle ambient noise background */}
      <div className="pointer-events-none fixed inset-0 noise opacity-40 bg-primary/5 dark:opacity-25" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-24 space-y-10">
        {/* Header & Main Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Study Library
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Import course materials, lecture slides, or textbook chapters. All AI synthesis runs entirely private on your device.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <ColoredButton
              color="amber"
              size="lg"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Import PDF / Notes
            </ColoredButton>

            <ColoredButton
              color="neutral"
              size="lg"
              disabled={isProcessing}
              onClick={() => setShowPasteModal(true)}
            >
              <FileText className="w-4 h-4" />
              Paste Text
            </ColoredButton>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
            <span className="font-medium">{processingStatus}</span>
          </div>
        )}

        {/* Search Bar & Document Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents by title or filename..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl text-foreground border border-neutral-200/60 dark:border-neutral-700/60 focus:outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
          </div>
        </div>

        {/* Document Version List (Inspired by ResumeVersionList) */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="py-20 text-center space-y-4 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-dashed border-neutral-200 dark:border-neutral-800">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No documents found</p>
                <p className="text-xs text-muted-foreground">Upload a PDF or paste notes to start studying.</p>
              </div>
              <ColoredButton
                color="amber"
                size="default"
                onClick={() => fileInputRef.current?.click()}
              >
                Import Course Material
              </ColoredButton>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              return (
                <div
                  key={doc.id}
                  className={`group relative p-5 rounded-2xl bg-white/70 dark:bg-neutral-900/50 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive 
                      ? 'border-amber-300/80 dark:border-amber-700/80 shadow-xs' 
                      : 'border-neutral-200/70 dark:border-neutral-800/70 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  {/* Left: Document Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        onClick={() => onSelectDocument(doc.id)}
                        className="font-medium text-base text-foreground hover:underline cursor-pointer truncate"
                      >
                        {doc.title}
                      </h3>
                      <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {doc.fileType.toUpperCase()}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                          Active Workspace
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>{doc.fileName}</span>
                      <span>•</span>
                      <span>{doc.pageCount} pages</span>
                      <span>•</span>
                      <span>{doc.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-500" />
                        {doc.topics.length} topics
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        {getFlashcardsForDoc(doc.id).length || 6} cards
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => onInspectDocument(doc)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Inspect extracted raw text"
                    >
                      Raw Text
                    </button>

                    <ColoredButton
                      color="amber"
                      size="sm"
                      onClick={() => onSelectDocument(doc.id)}
                    >
                      Study Notes
                      <ArrowRight className="w-3.5 h-3.5" />
                    </ColoredButton>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${doc.title}" from your library?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Paste Notes Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-background rounded-2xl p-6 space-y-4 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Paste Study Notes
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handlePasteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Microeconomics Lecture 3: Market Failures"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Content (Raw Notes / Syllabus)</label>
                <textarea
                  rows={8}
                  placeholder="Paste your course notes or lecture slides transcript here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <ColoredButton
                  color="neutral"
                  size="default"
                  onClick={() => setShowPasteModal(false)}
                >
                  Cancel
                </ColoredButton>
                <ColoredButton
                  type="submit"
                  color="amber"
                  size="default"
                >
                  Create Document & Structure
                </ColoredButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryView;
