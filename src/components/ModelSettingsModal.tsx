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
import { ColoredButton } from './custom/colored-button';

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
        className="w-full max-w-lg bg-background/95 dark:bg-neutral-900/95 backdrop-blur-2xl ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.7)] rounded-[28px] p-6 sm:p-7 space-y-6 max-h-[88vh] overflow-y-auto no-scrollbar text-foreground"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div>
            <h2 className="text-base font-semibold text-foreground">Local Model & Privacy</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Control how AI runs on your personal device</p>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="text-xs leading-relaxed text-muted-foreground bg-neutral-100/60 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
          <span className="font-semibold text-foreground">100% Local-First:</span> All study materials, extracted notes, and AI synthesis remain strictly on your machine.
        </div>

        {/* Engine Switcher */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
            Intelligence Engine
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'builtin' }))}
              className={`p-3.5 text-left rounded-xl text-xs transition-all flex flex-col justify-between border cursor-pointer ${
                localSettings.provider === 'builtin'
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-foreground font-medium shadow-xs'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-850 border-neutral-200/60 dark:border-neutral-800/60 text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-foreground mb-1">Built-in Engine</div>
              <p className="text-[11px] leading-relaxed opacity-75">
                Zero setup required. Instant heuristic NLP running in-browser.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'ollama' }))}
              className={`p-3.5 text-left rounded-xl text-xs transition-all flex flex-col justify-between border cursor-pointer ${
                localSettings.provider === 'ollama'
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-foreground font-medium shadow-xs'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-850 border-neutral-200/60 dark:border-neutral-800/60 text-muted-foreground'
              }`}
            >
              <div className="font-semibold text-foreground mb-1">Ollama Runtime</div>
              <p className="text-[11px] leading-relaxed opacity-75">
                Connects to local LLM models (Llama 3.2, Mistral, Qwen).
              </p>
            </button>
          </div>
        </div>

        {/* Ollama options */}
        {localSettings.provider === 'ollama' && (
          <div className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-mono">Server Endpoint</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localSettings.ollamaEndpoint}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaEndpoint: e.target.value }))}
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none font-mono"
                  placeholder="http://localhost:11434"
                />
                <ColoredButton
                  color="neutral"
                  size="sm"
                  onClick={handleTestOllama}
                  disabled={testingConnection}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  Test
                </ColoredButton>
              </div>
            </div>

            {ollamaStatus.tested && (
              <div className="text-xs font-mono">
                {ollamaStatus.ok ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Connected to Ollama ({ollamaStatus.models.length} models detected)
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">
                    Could not reach Ollama: {ollamaStatus.error}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-mono">Model Name</label>
              <input
                type="text"
                value={localSettings.ollamaModel}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-foreground font-mono focus:outline-none"
                placeholder="llama3.2"
              />
            </div>
          </div>
        )}

        {/* Data Backup & Reset */}
        <div className="space-y-3 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
            Data Backup & Privacy
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <ColoredButton
              color="neutral"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup
            </ColoredButton>

            <label className="cursor-pointer">
              <ColoredButton
                asChild
                color="neutral"
                size="sm"
              >
                <span>
                  <Upload className="w-3.5 h-3.5" />
                  Import Backup
                </span>
              </ColoredButton>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <ColoredButton
              color="rose"
              size="sm"
              onClick={handlePurge}
              className="ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset All Data
            </ColoredButton>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <ColoredButton
            color="neutral"
            size="default"
            onClick={onClose}
          >
            Cancel
          </ColoredButton>
          <ColoredButton
            color="amber"
            size="default"
            onClick={handleSave}
          >
            Save Settings
          </ColoredButton>
        </div>
      </div>
    </div>
  );
}

export default ModelSettingsModal;
