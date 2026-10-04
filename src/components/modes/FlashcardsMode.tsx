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
import { CustomSelect } from '@/components/custom/CustomSelect';

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
    <div className="flex flex-col justify-between max-w-2xl mx-auto h-full space-y-4 select-none">
      {/* Top Deck Streamlined Bar */}
      <div className="flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <CustomSelect
            value={selectedTopicId}
            onChange={setSelectedTopicId}
            disabled={generating}
            size="sm"
            options={[
              { value: 'all', label: `All Topics (${document.topics.length})` },
              ...document.topics.map((t) => ({ value: t.id, label: t.title }))
            ]}
          />

          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerateCards()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
            title="Regenerate cards"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {cards.length > 0 && currentCard && !isSessionFinished && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span className="tabular-nums font-medium text-foreground">
              {currentIndex + 1} <span className="opacity-40">/ {cards.length}</span>
            </span>
            <button
              type="button"
              onClick={() => onJumpToPage(currentCard.sourcePage)}
              className="hover:text-foreground flex items-center gap-1 text-[11px] transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              p.{currentCard.sourcePage}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCard(currentCard);
                setEditModalOpen(true);
              }}
              className="hover:text-foreground p-1 transition-colors"
              title="Edit Card"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleCreateNewCard}
              className="hover:text-foreground p-1 transition-colors"
              title="Add New Card"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Flashcard Arena */}
      {generating ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Generating recall flashcards from your notes...</span>
        </div>
      ) : isSessionFinished ? (
        <div className="py-10 space-y-5 text-center max-w-md mx-auto">
          <div className="size-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Review Session Complete
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reviewed all {cards.length} cards. Intervals have been recorded for spaced recall.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <ColoredButton
              color="indigo"
              size="default"
              onClick={() => {
                setCurrentIndex(0);
                setIsSessionFinished(false);
                setIsFlipped(false);
              }}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Review Again
            </ColoredButton>

            {onLaunchQuiz && (
              <ColoredButton
                color="emerald"
                size="default"
                onClick={() => onLaunchQuiz(selectedTopicId === 'all' ? undefined : selectedTopicId)}
              >
                Test With Quiz →
              </ColoredButton>
            )}
          </div>
        </div>
      ) : cards.length > 0 && currentCard ? (
        <div className="space-y-4">
          {/* Thin Progress line */}
          <div className="w-full h-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500/80 transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Calm, Borderless Flashcard Canvas */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative min-h-[220px] sm:min-h-[240px] px-8 py-10 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/30 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 transition-all cursor-pointer flex flex-col justify-between items-center text-center select-none"
          >
            {/* Type Tag */}
            <span className="uppercase tracking-widest font-mono text-[9px] text-muted-foreground/60">
              {currentCard.cardType} • rep {currentCard.reps || 0}
            </span>

            {/* Prompt / Answer */}
            <div className="my-auto py-2 max-w-lg">
              {!isFlipped ? (
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-serif font-normal text-foreground leading-snug tracking-tight text-wrap balance">
                    {currentCard.front}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground/50 pt-2">
                    Click or Space to flip
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <p className="text-base sm:text-lg font-sans font-normal text-foreground leading-relaxed text-wrap pretty">
                    {currentCard.back}
                  </p>
                  {currentCard.sourcePassage && (
                    <blockquote className="text-xs text-muted-foreground/70 italic border-l border-indigo-400/40 pl-3 text-left max-w-md mx-auto line-clamp-2">
                      "{currentCard.sourcePassage}"
                    </blockquote>
                  )}
                </div>
              )}
            </div>

            {/* Rep interval */}
            <span className="text-[10px] font-mono text-muted-foreground/40">
              Interval: {currentCard.intervalDays || 1}d
            </span>
          </div>

          {/* Action Row */}
          <div>
            {isFlipped ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate('again')}
                    className="py-2 px-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium transition-colors text-center cursor-pointer active-press"
                  >
                    <div>Again</div>
                    <span className="text-[10px] font-mono opacity-60">1d [1]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('hard')}
                    className="py-2 px-3 rounded-xl bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors text-center cursor-pointer active-press"
                  >
                    <div>Hard</div>
                    <span className="text-[10px] font-mono opacity-60">2d [2]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('good')}
                    className="py-2 px-3 rounded-xl bg-teal-50/80 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-medium transition-colors text-center cursor-pointer active-press"
                  >
                    <div>Good</div>
                    <span className="text-[10px] font-mono opacity-60">4d [3]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('easy')}
                    className="py-2 px-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium transition-colors text-center cursor-pointer active-press"
                  >
                    <div>Easy</div>
                    <span className="text-[10px] font-mono opacity-60">7d [4]</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>

                <ColoredButton
                  color="indigo"
                  size="default"
                  className="px-6"
                  onClick={() => setIsFlipped(true)}
                >
                  Reveal Answer (Space)
                </ColoredButton>

                <button
                  type="button"
                  disabled={currentIndex >= cards.length - 1}
                  onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quiet Keyboard Shortcuts Hint */}
            <div className="pt-2.5 flex items-center justify-center gap-4 text-[10px] font-mono text-muted-foreground/50">
              <span>Space: Flip</span>
              <span>1–4: Rate</span>
              <span>← / →: Prev/Next</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center space-y-3">
          <p className="text-xs text-muted-foreground">No flashcards found for this topic.</p>
          <ColoredButton color="indigo" size="sm" onClick={() => handleGenerateCards()}>
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
                  <CustomSelect
                    value={editingCard.cardType}
                    onChange={(val) => setEditingCard({ ...editingCard, cardType: val as any })}
                    className="w-full"
                    triggerClassName="w-full justify-between"
                    options={[
                      { value: 'concept', label: 'Concept' },
                      { value: 'definition', label: 'Definition' },
                      { value: 'fact', label: 'Key Fact' },
                      { value: 'application', label: 'Application' }
                    ]}
                  />
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
