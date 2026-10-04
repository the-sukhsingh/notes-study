"use client";

import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { DocumentSource } from '@/lib/types';
import { 
  extractFromPdfFile, 
  extractFromTextFile, 
  processRawText, 
  createDocumentFromPages 
} from '@/lib/extractor';
import { SAMPLE_DOCUMENTS } from '@/lib/sampleNotes';

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
  const [dragActive, setDragActive] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStatus(`Reading "${file.name}" on device...`);

      let extractionResult;
      const isPdf = file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        setProcessingStatus('Extracting text and preserving page numbers...');
        extractionResult = await extractFromPdfFile(file);
      } else {
        setProcessingStatus('Parsing document content...');
        extractionResult = await extractFromTextFile(file);
      }

      setProcessingStatus('Structuring topics and outline...');
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
      alert('Could not process this file. Please verify it is a valid PDF or text document.');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.fileName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Editorial Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Study Library
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Transform your own course material into an interactive active-recall revision session. 100% on-device AI. No external tracking, no cloud telemetry.
        </p>
      </div>

      {/* Sleek Minimal Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative py-12 px-8 rounded-3xl transition-all flex flex-col items-center justify-center text-center ${
          dragActive
            ? 'bg-neutral-100/90 dark:bg-neutral-800/80 scale-[0.99]'
            : 'bg-neutral-50/70 dark:bg-neutral-900/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
        }`}
      >
        {isProcessing ? (
          <div className="py-4 flex flex-col items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-foreground">{processingStatus}</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-foreground">
                Drop your notes or textbook here
              </h2>
              <p className="text-xs text-muted-foreground">
                PDFs, text files, or markdown notes are extracted locally
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <label className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-85 transition-opacity cursor-pointer active-press">
                Choose Document
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-4 py-2 rounded-full text-xs font-medium text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/80 transition-colors active-press"
              >
                Paste Text
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pre-Loaded Sample Notes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground/80">
            Sample Study Sources
          </span>
          <span className="text-[11px] text-muted-foreground">Ready for instant practice</span>
        </div>

        <div className="space-y-1">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                const existing = documents.find(d => d.id === sample.id);
                if (!existing) onSaveDocument(sample);
                onSelectDocument(sample.id);
              }}
              className="py-3 px-4 -mx-4 rounded-2xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground group-hover:underline truncate">
                    {sample.title}
                  </h3>
                  <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                    {sample.pageCount} pages
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {sample.summary}
                </p>
              </div>

              <span className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                Start Studying <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Notes Library */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Your Documents</h2>
            <p className="text-xs text-muted-foreground">
              {documents.length} document{documents.length === 1 ? '' : 's'} saved on this device
            </p>
          </div>

          {documents.length > 3 && (
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter notes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-neutral-100/50 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none"
              />
            </div>
          )}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No notes found. Upload a file above or pick one of the sample courses.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="py-4 px-3 -mx-3 rounded-2xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors flex items-center justify-between gap-4 group"
              >
                <div 
                  onClick={() => onSelectDocument(doc.id)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground group-hover:underline truncate">
                      {doc.title}
                    </span>
                    {doc.processingQuality.status === 'clean' ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Clean extraction" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Warnings detected" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{doc.pageCount} page{doc.pageCount === 1 ? '' : 's'}</span>
                    <span>•</span>
                    <span>{doc.wordCount} words</span>
                    <span>•</span>
                    <span>{doc.topics.length} topics</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectDocument(doc.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-full hover:opacity-85 transition-opacity active-press"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectDocument(doc)}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors active-press"
                  >
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove "${doc.title}"?`)) onDeleteDocument(doc.id);
                    }}
                    className="p-1.5 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <form 
            onSubmit={handlePasteSubmit}
            className="w-full max-w-xl bg-background rounded-3xl p-6 space-y-5 animate-in fade-in duration-100 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Paste Study Notes</h2>
              <button 
                type="button" 
                onClick={() => setShowPasteModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                required
                placeholder="Title (e.g. Molecular Biology Review)"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 rounded-xl text-foreground focus:outline-none"
              />

              <textarea
                required
                rows={8}
                placeholder="Paste your study notes or textbook extract here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 rounded-xl text-foreground focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-foreground text-background rounded-full hover:opacity-85 active-press"
              >
                Process Notes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
