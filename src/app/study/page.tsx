"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { StudySpace } from '@/components/StudySpace';
import { ModelSettingsModal } from '@/components/ModelSettingsModal';
import { InspectionModal } from '@/components/InspectionModal';
import { DocumentSource, AISettings } from '@/lib/types';
import { 
  getDocuments, 
  saveDocument, 
  getActiveDocId, 
  setActiveDocId,
  getAISettings,
  saveAISettings
} from '@/lib/storage';
import { DEFAULT_AI_SETTINGS } from '@/lib/aiEngine';
import { SAMPLE_DOCUMENTS } from '@/lib/sampleNotes';

export default function StudyPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSource[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentSource | null>(null);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const docs = getDocuments();
    setDocuments(docs);
    setSettings(getAISettings());

    const savedDocId = getActiveDocId();
    if (savedDocId) {
      const match = docs.find(d => d.id === savedDocId);
      if (match) {
        setActiveDoc(match);
        return;
      }
    }

    if (docs.length > 0) {
      setActiveDoc(docs[0]);
      setActiveDocId(docs[0].id);
    } else {
      // If no documents exist at all, go to library on home page
      router.push('/');
    }
  }, [router]);

  const handleSelectDocument = (docId: string) => {
    setActiveDocId(docId);
    const found = documents.find(d => d.id === docId);
    if (found) {
      setActiveDoc(found);
    }
  };

  const handleUpdateDocument = (updatedDoc: DocumentSource) => {
    saveDocument(updatedDoc);
    const updatedDocs = getDocuments();
    setDocuments(updatedDocs);
    if (activeDoc?.id === updatedDoc.id) {
      setActiveDoc(updatedDoc);
    }
  };

  const handleSaveSettings = (newSettings: AISettings) => {
    saveAISettings(newSettings);
    setSettings(newSettings);
  };

  const handleDataReset = () => {
    const freshDocs = getDocuments();
    setDocuments(freshDocs);
    if (freshDocs.length > 0) {
      setActiveDoc(freshDocs[0]);
      setActiveDocId(freshDocs[0].id);
    } else {
      router.push('/');
    }
  };

  if (!mounted || !activeDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Loading study workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <Header
        documents={documents}
        activeDocument={activeDoc}
        onSelectDocument={handleSelectDocument}
        onOpenLibrary={() => router.push('/')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />

      <StudySpace
        document={activeDoc}
        settings={settings}
        onInspectDocument={() => setIsInspectOpen(true)}
        onUpdateDocument={handleUpdateDocument}
      />

      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataReset={handleDataReset}
      />

      <InspectionModal
        isOpen={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
        document={activeDoc}
        onUpdateDocument={handleUpdateDocument}
      />
    </div>
  );
}
