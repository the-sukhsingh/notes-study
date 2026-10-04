"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { LibraryView } from '@/components/LibraryView';
import { ModelSettingsModal } from '@/components/ModelSettingsModal';
import { InspectionModal } from '@/components/InspectionModal';
import { DocumentSource, AISettings } from '@/lib/types';
import { 
  getDocuments, 
  saveDocument, 
  deleteDocument, 
  getActiveDocId, 
  setActiveDocId,
  getAISettings,
  saveAISettings
} from '@/lib/storage';
import { DEFAULT_AI_SETTINGS } from '@/lib/aiEngine';
import { SAMPLE_DOCUMENTS } from '@/lib/sampleNotes';

export default function Home() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSource[]>(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocState] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<DocumentSource | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const docs = getDocuments();
    setDocuments(docs);
    setActiveDocState(getActiveDocId());
    setSettings(getAISettings());
  }, []);

  const handleSelectDocument = (docId: string) => {
    setActiveDocState(docId);
    setActiveDocId(docId);
    router.push('/study');
  };

  const handleSaveDocument = (doc: DocumentSource) => {
    saveDocument(doc);
    setActiveDocId(doc.id);
    router.push('/study');
  };

  const handleDeleteDocument = (docId: string) => {
    deleteDocument(docId);
    const updatedDocs = getDocuments();
    setDocuments(updatedDocs);
    if (activeDocId === docId) {
      const nextId = updatedDocs[0]?.id || null;
      setActiveDocState(nextId);
      if (nextId) setActiveDocId(nextId);
    }
  };

  const handleUpdateDocument = (updatedDoc: DocumentSource) => {
    saveDocument(updatedDoc);
    const updatedDocs = getDocuments();
    setDocuments(updatedDocs);
    if (inspectingDoc?.id === updatedDoc.id) {
      setInspectingDoc(updatedDoc);
    }
  };

  const handleSaveSettings = (newSettings: AISettings) => {
    saveAISettings(newSettings);
    setSettings(newSettings);
  };

  const handleDataReset = () => {
    const freshDocs = getDocuments();
    setDocuments(freshDocs);
    const firstId = freshDocs[0]?.id || null;
    setActiveDocState(firstId);
    if (firstId) setActiveDocId(firstId);
  };

  const handleOpenInspect = (doc?: DocumentSource) => {
    if (doc) {
      setInspectingDoc(doc);
      setIsInspectOpen(true);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans transition-colors selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <Header
        documents={documents}
        activeDocument={null}
        onSelectDocument={handleSelectDocument}
        onOpenLibrary={() => {}}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />

      <main className="flex-1">
        <LibraryView
          documents={documents}
          activeDocId={activeDocId}
          onSelectDocument={handleSelectDocument}
          onSaveDocument={handleSaveDocument}
          onDeleteDocument={handleDeleteDocument}
          onInspectDocument={handleOpenInspect}
        />
      </main>

      {/* Model & Privacy Settings Modal */}
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataReset={handleDataReset}
      />

      {/* Raw Extraction Inspector Modal */}
      {inspectingDoc && (
        <InspectionModal
          isOpen={isInspectOpen}
          onClose={() => {
            setIsInspectOpen(false);
            setInspectingDoc(null);
          }}
          document={inspectingDoc}
          onUpdateDocument={handleUpdateDocument}
        />
      )}
    </div>
  );
}
