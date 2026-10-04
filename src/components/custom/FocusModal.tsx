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
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  color?: CalmColorName | "random";
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  zIndex?: string;
}

export function FocusModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  color = "indigo",
  headerActions,
  children,
  footer,
  maxWidth = "max-w-3xl",
  className,
  onSubmit,
  zIndex = "z-50",
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
          className={cn(
            "fixed inset-0 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-background/60 dark:bg-background/70 select-none overflow-hidden",
            zIndex
          )}
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
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 8,
              transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-h-[86vh] bg-background/95 dark:bg-neutral-900/95 backdrop-blur-2xl ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.7)] rounded-[28px] flex flex-col overflow-hidden text-foreground z-10 select-auto",
              maxWidth,
              className
            )}
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-2 shrink-0">
              <div className="space-y-0.5 min-w-0">
                {subtitle && (
                  <p className="text-[11px] font-mono tracking-wider text-muted-foreground/60 uppercase">
                    {subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {icon && <span className="shrink-0">{icon}</span>}
                  <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                    {title}
                  </h2>
                  {badge}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className="size-8 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body & Footer */}
            {onSubmit ? (
              <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-8 py-4">
                  {children}
                </div>
                {footer && (
                  <div className="px-6 sm:px-8 py-3.5 border-t border-neutral-100 dark:border-neutral-800/40 bg-neutral-50/30 dark:bg-neutral-950/20 shrink-0 flex items-center justify-between text-xs text-muted-foreground">
                    {footer}
                  </div>
                )}
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-8 py-4">
                  {children}
                </div>
                {footer && (
                  <div className="px-6 sm:px-8 py-3.5 border-t border-neutral-100 dark:border-neutral-800/40 bg-neutral-50/30 dark:bg-neutral-950/20 shrink-0 flex items-center justify-between text-xs text-muted-foreground">
                    {footer}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default FocusModal;
