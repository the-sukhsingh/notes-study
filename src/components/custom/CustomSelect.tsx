"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'default';
  ariaLabel?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  triggerClassName = '',
  size = 'default',
  ariaLabel
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={`group flex items-center justify-between gap-2 rounded-xl transition-all duration-150 cursor-pointer outline-none select-none text-left ${
          isSmall 
            ? 'px-2.5 py-1 text-xs font-medium' 
            : 'px-3 py-1.5 text-xs font-medium'
        } ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-muted-foreground' 
            : 'bg-neutral-100/80 hover:bg-neutral-200/70 dark:bg-neutral-800/70 dark:hover:bg-neutral-700/60 text-foreground border border-neutral-200/70 dark:border-neutral-700/70 hover:border-neutral-300 dark:hover:border-neutral-600 focus-visible:ring-2 focus-visible:ring-amber-500/30'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-neutral-200/70 dark:bg-neutral-700/70 text-muted-foreground shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`size-3.5 text-muted-foreground/80 group-hover:text-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`} 
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 min-w-[170px] max-w-[280px] w-max max-h-60 overflow-y-auto no-scrollbar rounded-2xl bg-popover/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-semibold'
                    : 'text-foreground/90 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span className="shrink-0 text-muted-foreground group-hover:text-foreground">
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {option.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800/70 text-muted-foreground">
                      {option.badge}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
