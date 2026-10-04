"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { LibraryView } from '@/components/LibraryView';
import { StudySpace } from '@/components/StudySpace';
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
  const [documents, setDocuments] = useState<DocumentSource[]>(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocState] = useState<string | null>(SAMPLE_DOCUMENTS[0].id);
  const [view, setView] = useState<'study' | 'library'>('study');
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<DocumentSource | null>(null);

  useEffect(() => {
    const docs = getDocuments();
    setDocuments(docs);

    const activeId = getActiveDocId();
    if (activeId && docs.some(d => d.id === activeId)) {
      setActiveDocState(activeId);
      setView('study');
    } else if (docs.length > 0) {
      setActiveDocState(docs[0].id);
      setView('study');
    } else {
      setView('library');
    }

    setSettings(getAISettings());
  }, []);

  const handleSelectDocument = (docId: string) => {
    setActiveDocState(docId);
    setActiveDocId(docId);
    setView('study');
  };

  const handleSaveDocument = (doc: DocumentSource) => {
    saveDocument(doc);
    const updatedDocs = getDocuments();
    setDocuments(updatedDocs);
    setActiveDocState(doc.id);
    setView('study');
  };

  const handleDeleteDocument = (docId: string) => {
    deleteDocument(docId);
    const updatedDocs = getDocuments();
    setDocuments(updatedDocs);
    if (activeDocId === docId) {
      if (updatedDocs.length > 0) {
        setActiveDocState(updatedDocs[0].id);
      } else {
        setActiveDocState(null);
        setView('library');
      }
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
    if (freshDocs.length > 0) {
      setActiveDocState(freshDocs[0].id);
    } else {
      setActiveDocState(null);
      setView('library');
    }
  };

  const handleOpenInspect = (doc?: DocumentSource) => {
    const targetDoc = doc || activeDocument;
    if (targetDoc) {
      setInspectingDoc(targetDoc);
      setIsInspectOpen(true);
    }
  };
  const activeDocument = documents.find(d => d.id === activeDocId) || null;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header
        documents={documents}
        activeDocument={activeDocument}
        onSelectDocument={handleSelectDocument}
        onOpenLibrary={() => setView('library')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />

      <main className="flex-1">
        {view === 'library' || !activeDocument ? (
          <LibraryView
            documents={documents}
            activeDocId={activeDocId}
            onSelectDocument={handleSelectDocument}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
            onInspectDocument={handleOpenInspect}
          />
        ) : (
          <StudySpace
            document={activeDocument}
            settings={settings}
            onInspectDocument={() => handleOpenInspect(activeDocument)}
            onUpdateDocument={handleUpdateDocument}
          />
        )}
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
