"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { WaveBackgroundPreview, CalmColorName } from './bg-shader-modal';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  color?: CalmColorName | "random";
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export function FocusModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  color = "indigo",
  headerActions,
  children,
  footer,
  maxWidth = "max-w-3xl",
  className,
}: FocusModalProps) {
  const [mounted, setMounted] = useState(false);
  const isBackdropClickRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="focus-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            isBackdropClickRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (isBackdropClickRef.current && e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-background/60 dark:bg-background/70 select-none overflow-hidden"
        >
          {/* Animated WebGL Calm Wave Shader in Background */}
          <motion.div
            key="focus-modal-shader-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            <WaveBackgroundPreview
              color={color}
              cycleColors={false}
              className="w-full h-full opacity-80"
            />
          </motion.div>

          {/* Clean Focus Modal Window */}
          <motion.div
            key="focus-modal-content-window"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 12,
              transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full h-[88dvh] max-h-[760px] bg-background/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] rounded-2xl flex flex-col overflow-hidden text-foreground z-10 select-auto",
              maxWidth,
              className
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-neutral-200/60 dark:border-neutral-800/70 shrink-0 bg-background/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-muted-foreground border border-neutral-200/60 dark:border-neutral-700/60 select-none">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={onClose}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
              {children}
            </div>

            {/* Modal Footer (Optional) */}
            {footer && (
              <div className="px-5 sm:px-7 py-3.5 border-t border-neutral-200/60 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-950/30 shrink-0 flex items-center justify-between">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default FocusModal;
