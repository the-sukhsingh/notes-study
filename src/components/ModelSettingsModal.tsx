"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  Trash2, 
  Terminal,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { AISettings } from '@/lib/types';
import { testOllamaConnection } from '@/lib/aiEngine';
import { exportBackupJson, importBackupJson, purgeAllUserData } from '@/lib/storage';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
  onDataReset: () => void;
}

export function ModelSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataReset
}: ModelSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [testingConnection, setTestingConnection] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    tested: boolean;
    ok: boolean;
    models: string[];
    error?: string;
  }>({
    tested: false,
    ok: false,
    models: []
  });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleTestOllama = async () => {
    setTestingConnection(true);
    const res = await testOllamaConnection(localSettings.ollamaEndpoint);
    setTestingConnection(false);
    setOllamaStatus({
      tested: true,
      ok: res.ok,
      models: res.models,
      error: res.error
    });
    if (res.ok && res.models.length > 0 && !res.models.includes(localSettings.ollamaModel)) {
      setLocalSettings(prev => ({ ...prev, ollamaModel: res.models[0] }));
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleExport = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJson(content);
        if (success) {
          alert('Study data successfully restored from backup.');
          onDataReset();
          onClose();
        } else {
          alert('Failed to parse backup file. Please ensure it is a valid JSON backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePurge = () => {
    if (confirm('Are you sure you want to delete all saved notes, flashcards, and quiz history? This cannot be undone.')) {
      purgeAllUserData();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-100">
      <div 
        className="w-full max-w-lg bg-background rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-white/10"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Local Model & Privacy</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Control how AI runs on your personal device</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="text-xs leading-relaxed text-muted-foreground bg-neutral-100/50 dark:bg-neutral-800/40 p-4 rounded-2xl">
          <span className="font-semibold text-foreground">100% Local-First:</span> All study materials, extracted text, and AI responses remain strictly on your machine.
        </div>

        {/* Engine Switcher */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Intelligence Engine
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'builtin' }))}
              className={`p-3.5 text-left rounded-2xl text-xs transition-colors flex flex-col justify-between ${
                localSettings.provider === 'builtin'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium'
                  : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-foreground mb-1">Built-in Engine</div>
              <p className="text-[11px] leading-relaxed opacity-75">
                Zero setup. Instant extractive NLP running inside your browser.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'ollama' }))}
              className={`p-3.5 text-left rounded-2xl text-xs transition-colors flex flex-col justify-between ${
                localSettings.provider === 'ollama'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium'
                  : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-foreground mb-1">Ollama Runtime</div>
              <p className="text-[11px] leading-relaxed opacity-75">
                Local open weights (Llama 3.2, Mistral, Phi-3, Qwen).
              </p>
            </button>
          </div>
        </div>

        {/* Ollama options */}
        {localSettings.provider === 'ollama' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-mono">Server Endpoint</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localSettings.ollamaEndpoint}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaEndpoint: e.target.value }))}
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-xl text-foreground focus:outline-none font-mono"
                  placeholder="http://localhost:11434"
                />
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={testingConnection}
                  className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors active-press"
                >
                  <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {ollamaStatus.tested && (
              <div className="text-xs text-muted-foreground font-mono">
                {ollamaStatus.ok ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Connected to Ollama ({ollamaStatus.models.length} models found)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Could not reach Ollama: {ollamaStatus.error}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-mono">Model Name</label>
              <input
                type="text"
                value={localSettings.ollamaModel}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-xl text-foreground font-mono focus:outline-none"
                placeholder="llama3.2"
              />
            </div>
          </div>
        )}

        {/* Data Management */}
        <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Storage & Backup
          </span>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium text-foreground flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup
            </button>

            <label className="px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import Backup
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handlePurge}
              className="px-3 py-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors font-medium ml-auto flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium bg-foreground text-background rounded-full hover:opacity-85 transition-opacity active-press"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
