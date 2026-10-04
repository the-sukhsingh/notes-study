"use client";

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive,
  FileCode,
  Layers,
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

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStatus(`Reading "${file.name}" locally on device...`);

      let extractionResult;
      const isPdf = file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        setProcessingStatus('Extracting selectable text from PDF...');
        extractionResult = await extractFromPdfFile(file);
      } else {
        setProcessingStatus('Parsing document sections...');
        extractionResult = await extractFromTextFile(file);
      }

      setProcessingStatus('Segmenting concepts and identifying topics...');
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Title & Introduction */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Study From My Notes
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Transform your own PDFs, lecture handouts, and revision sheets into an interactive revision experience. 100% on-device AI for honest recall, practice quizzes, and explanations.
        </p>
      </div>

      {/* Main Upload Dropzone & Quick Paste */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`md:col-span-2 relative p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
            dragActive 
              ? 'border-foreground bg-neutral-50 dark:bg-neutral-900 scale-[0.99]' 
              : 'border-border bg-neutral-50/40 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600'
          }`}
        >
          {isProcessing ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-foreground">{processingStatus}</p>
              <p className="text-xs text-muted-foreground">Running locally on your device...</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-background border border-border shadow-xs text-foreground mb-3">
                <Upload className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Import Study Material</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Drag and drop your PDF or notes here, or browse files on your computer.
              </p>

              <div className="flex items-center gap-3 mt-4">
                <label className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer active-press">
                  Browse PDF or Text File
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
                  className="px-4 py-2 border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-medium text-foreground transition-colors active-press"
                >
                  Paste Notes Text
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Files are processed locally. No uploads to cloud servers.</span>
              </div>
            </>
          )}
        </div>

        {/* Quick-Start Guide Card */}
        <div className="p-6 border border-border rounded-2xl bg-background flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              The Learning Journey
            </div>
            <h2 className="text-sm font-semibold text-foreground">How it helps you learn:</h2>
            <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-mono text-foreground font-semibold">1.</span>
                <span>Extracts your topics and preserves original page references.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-foreground font-semibold">2.</span>
                <span>Generates active recall flashcards & assessment quizzes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-foreground font-semibold">3.</span>
                <span>Answers questions with verbatim citations from your notes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-foreground font-semibold">4.</span>
                <span>Tracks missed concepts for targeted revision.</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-border/80 text-[11px] text-muted-foreground">
            Scanned or handwritten pages may require clear typography for best OCR results.
          </div>
        </div>
      </div>

      {/* Preloaded Sample Study Notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Or try pre-loaded sample notes
          </h2>
          <span className="text-xs text-muted-foreground">Ready to test immediately</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              className="p-4 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-medium text-foreground">
                    {sample.pageCount} Pages • {sample.wordCount} Words
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-foreground line-clamp-1">
                  {sample.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {sample.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    // Check if already in documents, if not add it
                    const existing = documents.find(d => d.id === sample.id);
                    if (!existing) onSaveDocument(sample);
                    onSelectDocument(sample.id);
                  }}
                  className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 active-press"
                >
                  Open Study Space
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Study Library */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Your Notes Library</h2>
            <p className="text-xs text-muted-foreground">
              {documents.length} document{documents.length === 1 ? '' : 's'} available on this computer
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/20">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No documents in your library yet. Import a PDF above to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  activeDocId === doc.id
                    ? 'border-foreground bg-neutral-50/80 dark:bg-neutral-900/80 ring-1 ring-foreground/20'
                    : 'border-border bg-background hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1">
                      {doc.processingQuality.status === 'clean' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Clean
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Warnings
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                    {doc.fileName}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span>{doc.pageCount} page{doc.pageCount === 1 ? '' : 's'}</span>
                    <span>•</span>
                    <span>{doc.wordCount} words</span>
                    <span>•</span>
                    <span>{doc.topics.length} topics</span>
                  </div>

                  <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className="px-3 py-1.5 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity active-press"
                    >
                      Study
                    </button>
                    <button
                      type="button"
                      onClick={() => onInspectDocument(doc)}
                      className="px-2.5 py-1.5 border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground rounded-lg transition-colors"
                    >
                      Inspect
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove "${doc.title}" from your library?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paste Notes Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form 
            onSubmit={handlePasteSubmit}
            className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Paste Study Notes</h2>
              <button 
                type="button" 
                onClick={() => setShowPasteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Molecular Biology Exam Review"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Notes Content</label>
                  <span className="text-[11px] text-muted-foreground">Separate pages with [Page X] or ---</span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste your lecture notes, textbook passages, or revision bullets here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 active-press"
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
