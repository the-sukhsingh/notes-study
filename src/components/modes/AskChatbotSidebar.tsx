"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Layers, 
  Check, 
  X, 
  RefreshCw, 
  BookOpen, 
  FileText,
  CornerDownLeft,
  Bot
} from 'lucide-react';
import { DocumentSource, AISettings, Flashcard } from '@/lib/types';
import { askNotesQuestion } from '@/lib/aiEngine';
import { addFlashcard } from '@/lib/storage';
import { ColoredButton } from '@/components/custom/colored-button';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  references?: { pageNumber: number; passage: string }[];
  confidence?: 'high' | 'medium' | 'low';
  isSavedAsCard?: boolean;
}

interface AskChatbotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export function AskChatbotSidebar({
  isOpen,
  onClose,
  document,
  settings,
  onJumpToPage,
  initialQuery,
  onClearInitialQuery
}: AskChatbotSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Suggested queries derived from document topics
  const suggestedQueries = [
    `What are the core concepts in ${document.topics[0]?.title || 'these notes'}?`,
    `Summarize key principles on Page 1`,
    `What definitions or formulas are highlighted?`
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle initialQuery if passed (e.g. from text highlight "Ask" toolbar)
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [isOpen, initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await askNotesQuestion(q, document, settings);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.answer,
        timestamp: new Date(),
        references: res.references,
        confidence: res.confidence,
        isSavedAsCard: false
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chatbot ask error:', err);
      const errorMessage: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, I encountered an issue analyzing the notes for this question. Please try again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = (messageId: string, questionText: string, answerText: string, page: number, passage: string) => {
    const newCard: Flashcard = {
      id: `chat-card-${Date.now()}`,
      docId: document.id,
      front: questionText,
      back: answerText,
      cardType: 'question',
      sourcePage: page || 1,
      sourcePassage: passage || '',
      reps: 0,
      intervalDays: 1,
      isUserEdited: true
    };
    addFlashcard(newCard);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isSavedAsCard: true } : m))
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed backdrop overlay on mobile / tablet */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-Side Chatbot Drawer */}
      <aside 
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-background/95 dark:bg-neutral-900/95 backdrop-blur-xl border-l border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-right"
        role="dialog"
        aria-label="Ask Notes Chatbot"
      >
        {/* Header Banner */}
        <div className="relative px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-gradient-to-b from-card/80 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
              <Bot className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Ask My Notes
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50">
                  Grounded
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                {document.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          {/* Welcome Greeting */}
          <div className="p-4 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200/40 dark:border-neutral-700/40 space-y-2">
            <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Ask anything about this document
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every answer is verified against your local document notes with page citations. You can click citations to jump directly to the text.
            </p>
          </div>

          {/* Messages List */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const prevUserQuestion = idx > 0 && messages[idx - 1].role === 'user' 
              ? messages[idx - 1].text 
              : 'Study Q&A';

            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in duration-200`}
              >
                <div 
                  className={`max-w-[88%] text-xs rounded-2xl p-3.5 leading-relaxed ${
                    isUser
                      ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 font-medium rounded-br-xs'
                      : 'bg-neutral-100/80 dark:bg-neutral-800/70 text-foreground border border-neutral-200/60 dark:border-neutral-700/60 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant References & Citation Chips */}
                  {!isUser && msg.references && msg.references.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-1.5">
                      <div className="text-[10px] uppercase font-mono text-muted-foreground/80 tracking-wider">
                        Document Citations:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.references.map((ref, rIdx) => (
                          <button
                            key={rIdx}
                            type="button"
                            onClick={() => onJumpToPage(ref.pageNumber)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-100/70 hover:bg-cyan-200 dark:bg-cyan-950/70 dark:hover:bg-cyan-900/80 text-cyan-900 dark:text-cyan-200 border border-cyan-200/60 dark:border-cyan-800/60 transition-colors cursor-pointer"
                            title={ref.passage ? `"${ref.passage.slice(0, 100)}..."` : undefined}
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            Page {ref.pageNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant Save as Flashcard Action */}
                {!isUser && (
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      type="button"
                      disabled={msg.isSavedAsCard}
                      onClick={() => 
                        handleSaveCard(
                          msg.id, 
                          prevUserQuestion, 
                          msg.text, 
                          msg.references?.[0]?.pageNumber || 1, 
                          msg.references?.[0]?.passage || ''
                        )
                      }
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60"
                    >
                      {msg.isSavedAsCard ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Card Saved</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3 h-3 text-indigo-500" />
                          <span>Save as Card</span>
                        </>
                      )}
                    </button>
                    {msg.confidence && (
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {msg.confidence === 'high' ? '• Exact Match' : '• Synthesized'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {loading && (
            <div className="flex items-start space-y-1">
              <div className="max-w-[85%] rounded-2xl rounded-bl-xs p-3.5 bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-xs flex items-center gap-2.5 text-muted-foreground animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-500 shrink-0" />
                <span>Reading notes & synthesizing answer...</span>
              </div>
            </div>
          )}

          {/* Suggested Queries if few messages */}
          {messages.length === 0 && !loading && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-mono text-muted-foreground">Suggested questions:</p>
              <div className="space-y-1.5">
                {suggestedQueries.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sq)}
                    className="w-full text-left p-2.5 rounded-xl text-xs bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 text-foreground/90 border border-neutral-200/50 dark:border-neutral-700/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{sq}</span>
                    <CornerDownLeft className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-neutral-200/70 dark:border-neutral-800/70 bg-card/60 backdrop-blur-md shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question about your notes..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 text-xs bg-neutral-100/80 dark:bg-neutral-800/70 rounded-xl text-foreground focus:outline-none border border-neutral-200/60 dark:border-neutral-700/60 placeholder:text-muted-foreground/60 transition-colors"
            />
            <ColoredButton
              type="submit"
              color="cyan"
              size="default"
              disabled={loading || !inputQuery.trim()}
              className="px-3 shrink-0"
              aria-label="Send query"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </ColoredButton>
          </form>

          <p className="mt-2 text-[10px] text-center text-muted-foreground/70 font-mono">
            Local-first AI • Answers grounded strictly in your document
          </p>
        </div>
      </aside>
    </>
  );
}
