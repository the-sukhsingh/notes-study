"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash2, 
  BookOpen, 
  RefreshCw 
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  useEffect(() => {
    const stored = getFlashcardsForDoc(document.id);
    if (stored.length > 0) {
      setCards(stored);
    } else {
      handleGenerateCards(6);
    }
  }, [document.id]);

  const handleGenerateCards = async (count = 6) => {
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

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 100);
    } else {
      setIsFlipped(false);
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
    <div className="space-y-12">
      {/* Top Deck Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-100/60 dark:bg-neutral-800/50 rounded-full text-foreground focus:outline-none"
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
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors active-press"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>

        <button
          type="button"
          onClick={handleCreateNewCard}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors active-press"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Card
        </button>
      </div>

      {/* Main Recall Arena (No cards, no borders, pure typography) */}
      {generating ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          Extracting recall cards from notes...
        </div>
      ) : cards.length > 0 && currentCard ? (
        <div className="space-y-10 max-w-2xl mx-auto">
          {/* Progress & Card Details */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>
              {currentIndex + 1} <span className="opacity-50">/ {cards.length}</span>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onJumpToPage(currentCard.sourcePage)}
                className="hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                Page {currentCard.sourcePage}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingCard(currentCard);
                  setEditModalOpen(true);
                }}
                className="hover:text-foreground"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentCard}
                className="hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Question / Prompt Display */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="py-12 px-6 rounded-3xl hover:bg-neutral-100/40 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer text-center select-none space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
                {!isFlipped ? 'Prompt (Click or Space to reveal)' : 'Answer'}
              </span>

              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-snug">
                {currentCard.front}
              </h3>
            </div>

            {isFlipped && (
              <div className="pt-6 animate-in fade-in duration-150 space-y-2 border-t border-neutral-100 dark:border-neutral-800/60">
                <p className="text-lg sm:text-xl font-normal text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {currentCard.back}
                </p>
              </div>
            )}
          </div>

          {/* Rating Buttons */}
          <div className="space-y-4 pt-2">
            {isFlipped ? (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className="py-2.5 px-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 text-foreground text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Again</span>
                  <span className="text-[10px] text-muted-foreground font-mono">1d [1]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className="py-2.5 px-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 text-foreground text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Hard</span>
                  <span className="text-[10px] text-muted-foreground font-mono">2d [2]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className="py-2.5 px-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 text-foreground text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Good</span>
                  <span className="text-[10px] text-muted-foreground font-mono">4d [3]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className="py-2.5 px-3 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 text-foreground text-xs font-medium transition-all active-press flex flex-col items-center"
                >
                  <span>Easy</span>
                  <span className="text-[10px] text-muted-foreground font-mono">7d [4]</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full py-3 bg-neutral-100/60 dark:bg-neutral-800/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 text-foreground font-medium text-xs rounded-full transition-colors active-press"
              >
                Reveal Answer (Space)
              </button>
            )}

            {/* Bottom Nav arrows */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
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

              <span className="text-[11px] font-mono opacity-60">
                Space to flip • Arrow keys to navigate
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
        <div className="py-20 text-center text-xs text-muted-foreground">
          No flashcards available. Click "Regenerate" above to create recall cards.
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-background rounded-3xl p-6 space-y-4 ring-1 ring-black/5 dark:ring-white/10 text-xs">
            <h3 className="text-base font-semibold text-foreground">Edit Flashcard</h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-muted-foreground">Prompt</label>
                <textarea
                  rows={3}
                  value={editingCard.front}
                  onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                  className="w-full p-2.5 bg-neutral-100/50 dark:bg-neutral-800/40 rounded-xl text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground">Answer</label>
                <textarea
                  rows={4}
                  value={editingCard.back}
                  onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                  className="w-full p-2.5 bg-neutral-100/50 dark:bg-neutral-800/40 rounded-xl text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCardModal(editingCard)}
                className="px-4 py-2 bg-foreground text-background rounded-full hover:opacity-85 active-press font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
