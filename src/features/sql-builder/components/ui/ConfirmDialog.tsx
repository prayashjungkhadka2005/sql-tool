"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  badgeLabel?: string;
  badgeTone?: "danger" | "info" | "primary";
  detailItems?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  badgeLabel,
  badgeTone,
  detailItems,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  const computedBadgeLabel = badgeLabel ?? (confirmVariant === "danger" ? "Irreversible" : undefined);
  const computedBadgeTone = badgeTone ?? (confirmVariant === "danger" ? "danger" : "primary");

  const badgeClasses = (() => {
    switch (computedBadgeTone) {
      case "danger":
        return "bg-red-500/10 text-red-600 ring-1 ring-red-500/15";
      case "info":
        return "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/15";
      default:
        return "bg-primary/10 text-primary ring-1 ring-primary/15";
    }
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] cursor-pointer"
            aria-label="Close dialog"
          />

          {/* Dialog Container */}
          <div 
            className="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10">
                <div className="flex items-center gap-3">
                  {confirmVariant === "danger" ? (
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    {computedBadgeLabel && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${badgeClasses}`}
                      >
                        {computedBadgeLabel}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-foreground font-mono">
                    {title}
                  </h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3">
                  <p className="text-sm text-foreground/80 font-mono leading-relaxed whitespace-pre-line break-words">
                  {message}
                </p>
                </div>

                {detailItems && detailItems.length > 0 && (
                  <div className="bg-white/70 dark:bg-white/5 border border-foreground/10 rounded-xl px-4 py-3 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                      Details
                    </div>
                    <ul className="space-y-1.5">
                      {detailItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                          <span className="font-mono">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-foreground/5 flex items-center justify-end gap-3">
                {cancelLabel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all font-mono"
                  >
                    {cancelLabel}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all font-mono active:scale-95 ${
                    confirmVariant === "danger"
                      ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
                      : "bg-primary hover:bg-primary/90 active:bg-primary/80"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

