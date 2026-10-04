"use client";

import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Check, 
  X,
  Volume2,
  RefreshCw,
  Layers
} from 'lucide-react';
import { DocumentSource, Flashcard, SpacedRepetitionRating, AISettings } from '@/lib/types';
import { generateFlashcards } from '@/lib/aiEngine';
import { 
  getFlashcardsForDoc, 
  saveFlashcardsForDoc, 
  updateFlashcard, 
  deleteFlashcard, 
  rateFlashcard 
} from '@/lib/storage';

interface FlashcardsModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
}

export function FlashcardsMode({
  document,
  settings,
  onJumpToPage
}: FlashcardsModeProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [cardCount, setCardCount] = useState<number>(6);

  // Edit / Add modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Load existing flashcards for this document on mount
  useEffect(() => {
    const stored = getFlashcardsForDoc(document.id);
    if (stored.length > 0) {
      setCards(stored);
    } else {
      // Auto-generate initial set if none exist
      handleGenerateCards(6);
    }
  }, [document.id]);

  const handleGenerateCards = async (count = cardCount) => {
    setGenerating(true);
    try {
      const topicId = selectedTopicId === 'all' ? undefined : selectedTopicId;
      const newCards = await generateFlashcards(document, topicId, count, settings);
      setCards(newCards);
      saveFlashcardsForDoc(document.id, newCards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (e) {
      console.error('Failed to generate flashcards:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleRate = (rating: SpacedRepetitionRating) => {
    const current = cards[currentIndex];
    if (!current) return;

    const updated = rateFlashcard(current.id, rating);
    if (updated) {
      const copy = [...cards];
      copy[currentIndex] = updated;
      setCards(copy);
    }

    // Advance to next card
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsFlipped(false);
      // Completed deck cycle
    }
  };

  const handleSaveCardModal = (card: Flashcard) => {
    updateFlashcard(card);
    const updatedCards = cards.map(c => c.id === card.id ? card : c);
    setCards(updatedCards);
    setEditModalOpen(false);
  };

  const handleCreateNewCard = () => {
    const newCard: Flashcard = {
      id: `custom-card-${Date.now()}`,
      docId: document.id,
      front: '',
      back: '',
      cardType: 'concept',
      sourcePage: 1,
      sourcePassage: '',
      reps: 0,
      intervalDays: 1,
      isUserEdited: true
    };
    setEditingCard(newCard);
    setEditModalOpen(true);
  };

  const handleDeleteCurrentCard = () => {
    const current = cards[currentIndex];
    if (!current) return;
    if (confirm('Delete this flashcard?')) {
      deleteFlashcard(current.id);
      const remaining = cards.filter(c => c.id !== current.id);
      setCards(remaining);
      if (currentIndex >= remaining.length) {
        setCurrentIndex(Math.max(0, remaining.length - 1));
      }
      setIsFlipped(false);
    }
  };

  // Keyboard navigation: Space to flip, 1-4 for ratings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editModalOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev - 1);
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, cards.length, editModalOpen]);

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Deck Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-background border border-border shadow-xs">
        <div className="flex items-center gap-2">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-border rounded-xl text-foreground focus:outline-none"
          >
            <option value="all">All Topics ({document.topics.length})</option>
            {document.topics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerateCards()}
            className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-1.5 active-press"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            Regenerate Deck
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewCard}
            className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>
        </div>
      </div>

      {/* Main Flashcard Practice Area */}
      {generating ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-foreground">Extracting active recall flashcards from your notes...</p>
        </div>
      ) : cards.length > 0 && currentCard ? (
        <div className="flex flex-col items-center space-y-4">
          {/* Progress Indicator */}
          <div className="w-full max-w-xl flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Card <span className="font-semibold text-foreground">{currentIndex + 1}</span> of {cards.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="capitalize text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                {currentCard.cardType}
              </span>
              {currentCard.reps > 0 && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  Reviewed {currentCard.reps}x
                </span>
              )}
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-xl h-80 sm:h-96 perspective-1000 cursor-pointer select-none group"
          >
            <div 
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden p-8 sm:p-10 rounded-3xl bg-background border border-border shadow-md flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider font-semibold text-[10px]">Front • Question</span>
                  <span className="text-[11px]">Click or press Space to flip</span>
                </div>

                <div className="text-center my-auto px-4">
                  <h3 className="text-lg sm:text-xl font-medium tracking-tight text-foreground leading-snug">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToPage(currentCard.sourcePage);
                    }}
                    className="flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Source: Page {currentCard.sourcePage}
                  </button>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCard(currentCard);
                        setEditModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCurrentCard}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-8 sm:p-10 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-border shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider font-semibold text-[10px] text-indigo-600 dark:text-indigo-400">
                    Back • Answer
                  </span>
                  <span className="text-[11px]">Click or press Space to flip back</span>
                </div>

                <div className="my-auto px-4 overflow-y-auto max-h-48 text-center">
                  <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToPage(currentCard.sourcePage);
                    }}
                    className="flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Verified from Page {currentCard.sourcePage}
                  </button>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCard(currentCard);
                        setEditModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Buttons (Spaced Repetition: Again, Hard, Good, Easy) */}
          <div className="w-full max-w-xl space-y-2 pt-2">
            {isFlipped ? (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className="p-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Again</span>
                  <span className="text-[10px] opacity-75 font-mono">1d [Key 1]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Hard</span>
                  <span className="text-[10px] opacity-75 font-mono">2d [Key 2]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className="p-2.5 rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Good</span>
                  <span className="text-[10px] opacity-75 font-mono">4d [Key 3]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Easy</span>
                  <span className="text-[10px] opacity-75 font-mono">7d [Key 4]</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground font-medium text-xs rounded-xl transition-colors active-press"
              >
                Reveal Answer (Space)
              </button>
            )}

            {/* Bottom Nav arrows */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }}
                className="flex items-center gap-1 hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-[11px] font-mono">
                Shortcuts: Space to flip • Left/Right to browse
              </span>

              <button
                type="button"
                disabled={currentIndex >= cards.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
                }}
                className="flex items-center gap-1 hover:text-foreground disabled:opacity-30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
          No flashcards yet. Click "Regenerate Deck" or "Add Card" above.
        </div>
      )}

      {/* Edit / Add Modal */}
      {editModalOpen && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Edit Flashcard</h3>
              <button 
                type="button" 
                onClick={() => setEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Front (Question or Concept)</label>
                <textarea
                  rows={3}
                  value={editingCard.front}
                  onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Back (Answer or Definition)</label>
                <textarea
                  rows={4}
                  value={editingCard.back}
                  onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <label className="font-medium text-foreground">Source Page Number</label>
                  <input
                    type="number"
                    min={1}
                    max={document.pageCount}
                    value={editingCard.sourcePage}
                    onChange={(e) => setEditingCard({ ...editingCard, sourcePage: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-background border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3 py-1.5 border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCardModal(editingCard)}
                className="px-4 py-1.5 bg-foreground text-background rounded-lg hover:opacity-90 active-press font-medium"
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
