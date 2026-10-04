"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash2, 
  BookOpen, 
  RefreshCw,
  Sparkles,
  RotateCw
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
import { ColoredButton } from '@/components/custom/colored-button';

interface FlashcardsModeProps {
  document: DocumentSource;
  settings: AISettings;
  onJumpToPage: (page: number) => void;
  presetTopicId?: string;
  onLaunchQuiz?: (topicId?: string) => void;
}

export function FlashcardsMode({
  document,
  settings,
  onJumpToPage,
  presetTopicId,
  onLaunchQuiz
}: FlashcardsModeProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(presetTopicId || 'all');
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

  useEffect(() => {
    if (presetTopicId) {
      setSelectedTopicId(presetTopicId);
    }
  }, [presetTopicId]);

  const handleGenerateCards = async (count = 6) => {
    setGenerating(true);
    try {
      const topicId = selectedTopicId === 'all' ? undefined : selectedTopicId;
      const newCards = await generateFlashcards(document, topicId, count, settings);
      setCards(newCards);
      saveFlashcardsForDoc(document.id, newCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSessionFinished(false);
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
      setTimeout(() => setCurrentIndex(prev => prev + 1), 120);
    } else {
      setIsFlipped(false);
      setIsSessionFinished(true);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Deck Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-100/70 dark:bg-neutral-800/60 rounded-lg text-foreground focus:outline-none border border-neutral-200/50 dark:border-neutral-700/50"
          >
            <option value="all">All Topics ({document.topics.length})</option>
            {document.topics.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>

          <ColoredButton
            color="neutral"
            size="sm"
            disabled={generating}
            onClick={() => handleGenerateCards()}
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </ColoredButton>
        </div>

        <div className="flex items-center gap-2">
          <ColoredButton
            color="indigo"
            size="sm"
            onClick={handleCreateNewCard}
          >
            <Plus className="w-3 h-3" />
            Add Card
          </ColoredButton>
        </div>
      </div>

      {/* Main Flashcard Arena */}
      {generating ? (
        <div className="py-28 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <span>Generating recall flashcards from your notes...</span>
        </div>
      ) : isSessionFinished ? (
        <div className="py-12 space-y-6 text-center animate-in fade-in duration-200 max-w-md mx-auto">
          <div className="size-14 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Review Session Complete!
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You reviewed all {cards.length} flashcards in this deck. Spaced repetition intervals have been recorded.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <ColoredButton
              color="indigo"
              size="lg"
              onClick={() => {
                setCurrentIndex(0);
                setIsSessionFinished(false);
                setIsFlipped(false);
              }}
            >
              <RotateCw className="w-4 h-4" />
              Review Deck Again
            </ColoredButton>

            {onLaunchQuiz && (
              <ColoredButton
                color="emerald"
                size="lg"
                onClick={() => onLaunchQuiz(selectedTopicId === 'all' ? undefined : selectedTopicId)}
              >
                Test With Quiz →
              </ColoredButton>
            )}
          </div>
        </div>
      ) : cards.length > 0 && currentCard ? (
        <div className="space-y-6">
          {/* Progress Bar & Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="font-medium text-foreground">
              Card {currentIndex + 1} <span className="opacity-50">/ {cards.length}</span>
            </span>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onJumpToPage(currentCard.sourcePage)}
                className="hover:text-foreground flex items-center gap-1 text-[11px]"
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
                className="hover:text-foreground p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Edit Card"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDeleteCurrentCard}
                className="hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete Card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Interactive Flashcard Surface */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative min-h-[260px] sm:min-h-[300px] p-8 sm:p-10 rounded-2xl bg-white/70 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none"
          >
            {/* Top Card Badge */}
            <div className="flex items-center justify-between text-xs text-muted-foreground/80">
              <span className="uppercase tracking-wider font-mono text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {currentCard.cardType}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                <RotateCw className="w-3 h-3" />
                {isFlipped ? 'Click to show front' : 'Click or Space to flip'}
              </span>
            </div>

            {/* Card Content Area */}
            <div className="my-auto py-4 text-center">
              {!isFlipped ? (
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground leading-snug">
                    {currentCard.front}
                  </h3>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-lg sm:text-xl font-normal text-foreground leading-relaxed whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                  {currentCard.sourcePassage && (
                    <blockquote className="text-xs text-muted-foreground italic border-l-2 border-indigo-400/50 pl-3 max-w-lg mx-auto text-left">
                      "{currentCard.sourcePassage}"
                    </blockquote>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 font-mono pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
              <span>Reps: {currentCard.reps || 0}</span>
              <span>Interval: {currentCard.intervalDays || 1}d</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-3">
            {isFlipped ? (
              <div className="space-y-2">
                <div className="text-center text-[11px] text-muted-foreground font-mono">
                  Rate your recall difficulty (Keyboard 1–4):
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <ColoredButton
                    color="rose"
                    size="lg"
                    onClick={() => handleRate('again')}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold text-xs">Again</span>
                    <span className="text-[10px] opacity-75 font-mono">1d [1]</span>
                  </ColoredButton>

                  <ColoredButton
                    color="orange"
                    size="lg"
                    onClick={() => handleRate('hard')}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold text-xs">Hard</span>
                    <span className="text-[10px] opacity-75 font-mono">2d [2]</span>
                  </ColoredButton>

                  <ColoredButton
                    color="teal"
                    size="lg"
                    onClick={() => handleRate('good')}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold text-xs">Good</span>
                    <span className="text-[10px] opacity-75 font-mono">4d [3]</span>
                  </ColoredButton>

                  <ColoredButton
                    color="emerald"
                    size="lg"
                    onClick={() => handleRate('easy')}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold text-xs">Easy</span>
                    <span className="text-[10px] opacity-75 font-mono">7d [4]</span>
                  </ColoredButton>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <ColoredButton
                  color="neutral"
                  size="default"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </ColoredButton>

                <ColoredButton
                  color="indigo"
                  size="lg"
                  className="flex-1 max-w-xs mx-auto"
                  onClick={() => setIsFlipped(true)}
                >
                  Reveal Answer (Space)
                </ColoredButton>

                <ColoredButton
                  color="neutral"
                  size="default"
                  disabled={currentIndex >= cards.length - 1}
                  onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </ColoredButton>
              </div>
            )}

            {/* Keyboard Shortcuts Legend */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-[10px]">Space</kbd>
                Flip
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-[10px]">1–4</kbd>
                Rate Recall
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-[10px]">← / →</kbd>
                Navigate
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <p className="text-sm text-muted-foreground">No flashcards found for this topic.</p>
          <ColoredButton color="indigo" onClick={() => handleGenerateCards()}>
            Generate New Flashcards
          </ColoredButton>
        </div>
      )}

      {/* Edit Card Modal */}
      {editModalOpen && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-background rounded-2xl p-6 space-y-4 border border-border shadow-xl">
            <h4 className="font-semibold text-base text-foreground">
              {editingCard.front ? 'Edit Flashcard' : 'New Flashcard'}
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Front (Prompt / Question)</label>
                <textarea
                  rows={3}
                  value={editingCard.front}
                  onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  placeholder="Enter the question or concept prompt..."
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Back (Answer / Explanation)</label>
                <textarea
                  rows={4}
                  value={editingCard.back}
                  onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  placeholder="Enter the detailed answer..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Source Page Reference</label>
                  <input
                    type="number"
                    min={1}
                    max={document.pageCount}
                    value={editingCard.sourcePage}
                    onChange={(e) => setEditingCard({ ...editingCard, sourcePage: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Card Type</label>
                  <select
                    value={editingCard.cardType}
                    onChange={(e) => setEditingCard({ ...editingCard, cardType: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-foreground focus:outline-none"
                  >
                    <option value="concept">Concept</option>
                    <option value="definition">Definition</option>
                    <option value="fact">Key Fact</option>
                    <option value="application">Application</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <ColoredButton
                color="neutral"
                size="sm"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </ColoredButton>
              <ColoredButton
                color="indigo"
                size="sm"
                onClick={() => handleSaveCardModal(editingCard)}
              >
                Save Flashcard
              </ColoredButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashcardsMode;
