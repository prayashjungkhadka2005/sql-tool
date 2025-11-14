"use client";

import { SchemaDiff } from '../utils/schema-comparator';
import { motion, AnimatePresence } from 'framer-motion';

interface DatabaseRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: SchemaDiff | null;
  connectionLabel: string;
  hostLabel: string;
  onApply: () => void;
}

export default function DatabaseRefreshModal({
  isOpen,
  onClose,
  diff,
  connectionLabel,
  hostLabel,
  onApply,
}: DatabaseRefreshModalProps) {
  if (!isOpen) return null;

  const hasChanges = diff?.hasChanges;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pull Latest from Database</h2>
                  <p className="text-xs text-foreground/60 mt-1" title={hostLabel}>
                    {connectionLabel}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-all active:scale-95"
                  aria-label="Close refresh modal"
                >
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {!hasChanges || !diff ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-foreground/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-foreground/70">No differences detected between the database and your canvas.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Remote Changes Summary</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-foreground/60">Tables Added:</span>
                          <span className="ml-2 font-mono text-foreground">{diff.tablesAdded.length}</span>
                        </div>
                        <div>
                          <span className="text-foreground/60">Tables Removed:</span>
                          <span className="ml-2 font-mono text-foreground">{diff.tablesRemoved.length}</span>
                        </div>
                        <div>
                          <span className="text-foreground/60">Tables Modified:</span>
                          <span className="ml-2 font-mono text-foreground">{diff.tablesModified.length}</span>
                        </div>
                        <div>
                          <span className="text-foreground/60">Total Changes:</span>
                          <span className="ml-2 font-mono text-foreground">
                            {diff.tablesAdded.length + diff.tablesRemoved.length + diff.tablesModified.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
                      Pulling will replace your local canvas with the live database schema. Make sure you push or export local changes first.
                    </div>

                    {(diff.tablesAdded.length > 0 || diff.tablesRemoved.length > 0 || diff.tablesModified.length > 0) && (
                      <div className="space-y-3 text-xs text-foreground/80">
                        {diff.tablesAdded.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-foreground">Tables only in database</h4>
                            <ul className="list-disc list-inside">
                              {diff.tablesAdded.map((table) => (
                                <li key={table.id}>{table.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {diff.tablesRemoved.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-foreground">Tables only in canvas</h4>
                            <ul className="list-disc list-inside">
                              {diff.tablesRemoved.map((table) => (
                                <li key={table.id}>{table.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {diff.tablesModified.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-foreground">Modified tables</h4>
                            <ul className="list-disc list-inside">
                              {diff.tablesModified.map((tableChange) => (
                                <li key={tableChange.tableName}>{tableChange.tableName}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-foreground/10 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all active:scale-95"
                >
                  Cancel
                </button>
                {hasChanges && (
                  <button
                    onClick={onApply}
                    className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition-all active:scale-95"
                  >
                    Replace Local Schema
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

