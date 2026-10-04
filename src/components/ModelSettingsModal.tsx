"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-foreground">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight text-foreground">Local Model & Privacy</h2>
              <p className="text-xs text-muted-foreground">Control how AI runs on your personal device</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Privacy Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-neutral-600 dark:text-neutral-400 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">100% Local-First Privacy:</span> All PDF extraction, flashcards, quizzes, and learning history stay on your computer. No notes or telemetry are sent to cloud AI servers.
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              AI Intelligence Engine
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Built-in Heuristics */}
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'builtin' }))}
                className={`p-3.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  localSettings.provider === 'builtin'
                    ? 'border-foreground bg-neutral-50 dark:bg-neutral-900 ring-1 ring-foreground'
                    : 'border-border hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">Built-in Local Engine</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                    Zero Setup
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Fast, deterministic extractive NLP. Runs completely inside your browser with instant responses. No downloads or Ollama required.
                </p>
              </button>

              {/* Ollama Runtime */}
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, provider: 'ollama' }))}
                className={`p-3.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  localSettings.provider === 'ollama'
                    ? 'border-foreground bg-neutral-50 dark:bg-neutral-900 ring-1 ring-foreground'
                    : 'border-border hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">Ollama Local Model</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-foreground font-medium">
                    Open Weights
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Connects to open-weight models (Llama 3.2, Mistral, Phi-3, Qwen) running locally on your hardware via Ollama.
                </p>
              </button>
            </div>
          </div>

          {/* Ollama Configuration Section */}
          {localSettings.provider === 'ollama' && (
            <div className="p-4 rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Ollama Server Endpoint</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localSettings.ollamaEndpoint}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaEndpoint: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
                    placeholder="http://localhost:11434"
                  />
                  <button
                    type="button"
                    onClick={handleTestOllama}
                    disabled={testingConnection}
                    className="px-3 py-1.5 text-xs font-medium border border-border bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                    Test Link
                  </button>
                </div>
              </div>

              {/* Test Status feedback */}
              {ollamaStatus.tested && (
                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  ollamaStatus.ok 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}>
                  {ollamaStatus.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {ollamaStatus.ok ? (
                      <div>
                        <span className="font-semibold">Connected to Ollama!</span> Found {ollamaStatus.models.length} installed model(s).
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold">Could not reach Ollama:</span> {ollamaStatus.error || 'Server not responding'}. Check that Ollama is running in your terminal.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Model Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Active Model</label>
                {ollamaStatus.models.length > 0 ? (
                  <select
                    value={localSettings.ollamaModel}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    {ollamaStatus.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={localSettings.ollamaModel}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground font-mono"
                    placeholder="llama3.2"
                  />
                )}
              </div>

              {/* Quick CLI tip */}
              <div className="p-2.5 rounded-lg bg-background border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span>Quick terminal start: <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-foreground">ollama run llama3.2</code></span>
              </div>
            </div>
          )}

          {/* Backup & Data Management */}
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Data & Storage Controls
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export Backup (JSON)
              </button>

              <label className="px-3 py-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Import Backup
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport} 
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={handlePurge}
                className="px-3 py-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1.5 font-medium ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset All Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium bg-foreground text-background hover:opacity-90 rounded-lg transition-opacity active-press"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
