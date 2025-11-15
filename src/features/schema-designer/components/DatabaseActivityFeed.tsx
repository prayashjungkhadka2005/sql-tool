"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export interface DatabaseActivityEvent {
  id: string;
  type: "connect" | "pull" | "push" | "sync" | "general";
  status: "in-progress" | "success" | "error";
  message: string;
  timestamp: number;
}

interface DatabaseActivityFeedProps {
  isOpen: boolean;
  events: DatabaseActivityEvent[];
  onClose: () => void;
}

const statusBadge: Record<DatabaseActivityEvent["status"], string> = {
  "in-progress": "text-amber-600 bg-amber-100 dark:bg-amber-500/10",
  success: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10",
  error: "text-red-600 bg-red-100 dark:bg-red-500/10",
};

const statusLabel: Record<DatabaseActivityEvent["status"], string> = {
  "in-progress": "Running",
  success: "Done",
  error: "Failed",
};

export default function DatabaseActivityFeed({
  isOpen,
  events,
  onClose,
}: DatabaseActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-[#0a0a0a] border-l border-foreground/10 shadow-2xl z-[81] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="px-5 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground/50 font-mono">
                  Database Activity
                </div>
                <div className="text-lg font-semibold text-foreground">
                  Live progress & logs
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                aria-label="Close activity feed"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" ref={scrollRef}>
              {events.length === 0 ? (
                <div className="text-center text-sm text-foreground/50 py-16 font-mono">
                  Waiting for activity…
                </div>
              ) : (
                events.map(event => (
                  <div
                    key={event.id}
                    className="border border-foreground/10 rounded-xl p-3 bg-white/90 dark:bg-black/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs text-foreground/50">
                      <span className="font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusBadge[event.status]}`}>
                        {statusLabel[event.status]}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-mono leading-relaxed">
                      {event.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-foreground/10 text-[11px] text-foreground/50 font-mono">
              Logs auto-refresh. Esc to close.
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

