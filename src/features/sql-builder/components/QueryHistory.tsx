"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QueryHistoryItem, getHistory, deleteHistoryItem, clearHistory, searchHistory, formatTimestamp } from "../utils/query-history";
import { isCSVTable } from "../utils/csv-data-manager";
import ConfirmDialog from "./ui/ConfirmDialog";

interface QueryHistoryProps {
  onLoadQuery: (item: QueryHistoryItem) => void;
}

export default function QueryHistory({ onLoadQuery }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]); // Start empty to avoid hydration mismatch
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const refreshHistory = useCallback(() => {
    const items = searchTerm ? searchHistory(searchTerm) : getHistory();
    setHistory(items);
  }, [searchTerm]);

  // Load history on mount (client-side only to avoid hydration issues)
  useEffect(() => {
    refreshHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load once on mount

  // Refresh history when panel is opened
  useEffect(() => {
    if (isOpen) {
      refreshHistory();
    }
  }, [isOpen, refreshHistory]);

  // Keyboard shortcuts - Escape to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const items = term ? searchHistory(term) : getHistory();
    setHistory(items);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Query?",
      message: "Remove this query from history?\n\nThis action cannot be undone.",
      onConfirm: () => {
        deleteHistoryItem(id);
        refreshHistory();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear All History?",
      message: `Delete all ${history.length} saved queries?\n\nThis action cannot be undone.`,
      onConfirm: () => {
        clearHistory();
        setHistory([]);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleLoad = (item: QueryHistoryItem) => {
    // Check if it's a CSV query and CSV no longer exists
    if (item.isCSV && !isCSVTable(item.tableName)) {
      setConfirmDialog({
        isOpen: true,
        title: "CSV Data Not Available",
        message: `This query used CSV table "${item.tableName}" which is no longer loaded.\n\nThe query will load but you'll need to upload the CSV again to see results.`,
        onConfirm: () => {
          onLoadQuery(item);
          setIsOpen(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }
    
    onLoadQuery(item);
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Refresh history when opening
          if (newIsOpen) {
            const items = getHistory();
            setHistory(items);
          }
        }}
        className="relative px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all font-mono text-sm flex items-center gap-2 text-foreground/70 hover:text-foreground"
        title="View query history"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
        {history.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono font-bold">
            {history.length}
          </span>
        )}
      </button>

      {/* History Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] cursor-pointer"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white dark:bg-[#1a1a1a] border-l border-foreground/10 z-[91] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Query History
                    </h2>
                    <p className="text-xs text-foreground/40 font-mono">
                      {history.length} saved {history.length === 1 ? 'query' : 'queries'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="px-6 py-3 border-b border-foreground/10">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search queries..."
                    className="w-full px-3 py-2 pl-9 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-foreground/60 mb-1">
                      {searchTerm ? 'No Results Found' : 'No History Yet'}
                    </p>
                    <p className="text-xs text-foreground/40 font-mono">
                      {searchTerm ? 'Try a different search term' : 'Your queries will be saved here automatically'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 rounded-lg transition-all cursor-pointer"
                        onClick={() => handleLoad(item)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="text-sm font-semibold text-foreground font-mono truncate">
                                {item.tableName}
                              </span>
                              {item.isCSV && !isCSVTable(item.tableName) && (
                                <span 
                                  className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded font-mono font-bold"
                                  title="CSV data no longer available"
                                >
                                  CSV ⚠️
                                </span>
                              )}
                              {item.isCSV && isCSVTable(item.tableName) && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-mono font-bold">
                                  CSV
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-foreground/40 font-mono">
                              {formatTimestamp(item.timestamp)}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="opacity-0 sm:group-hover:opacity-100 sm:opacity-100 p-1 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                            aria-label="Delete query"
                            title="Delete this query"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* SQL Preview */}
                        <div className="bg-white dark:bg-black/60 border border-foreground/5 rounded px-3 py-2">
                          <pre className="text-[10px] font-mono text-foreground/60 line-clamp-2 whitespace-pre-wrap break-words">
                            {item.sql}
                          </pre>
                        </div>

                        {/* Load Hint */}
                        <div className="mt-2 text-[10px] text-foreground/40 font-mono opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          → Click to load this query
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {history.length > 0 && (
                <div className="px-6 py-4 border-t border-foreground/10 flex items-center justify-between bg-foreground/5">
                  <p className="text-xs text-foreground/50 font-mono">
                    Last {Math.min(history.length, 50)} queries saved
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 rounded transition-all font-mono"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

