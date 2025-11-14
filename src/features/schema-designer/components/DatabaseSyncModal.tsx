/**
 * Database Sync Modal
 * Preview and apply schema changes to connected database
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaState } from '../types';
import { compareSchemas } from '../utils/schema-comparator';
import { generateMigration, SQLDialect } from '../utils/migration-generator';
import { useToast } from '@/features/sql-builder/hooks/useToast';
import Toast from '@/features/sql-builder/components/ui/Toast';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchema: SchemaState;
  originalSchema: SchemaState;
  connectionConfig: {
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    connectionString?: string;
  };
  onSyncComplete?: () => void;
}

export default function DatabaseSyncModal(props: DatabaseSyncModalProps) {
  return <DatabaseSyncModalContent {...props} />;
}

function DatabaseSyncModalContent({
  isOpen,
  onClose,
  currentSchema,
  originalSchema,
  connectionConfig,
  onSyncComplete,
}: DatabaseSyncModalProps) {
  const { toast, showToast, hideToast, resetToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [diff, setDiff] = useState(compareSchemas(originalSchema, currentSchema));
  const [dialect, setDialect] = useState<SQLDialect>(
    connectionConfig.type === 'mysql' ? 'mysql' : 'postgresql'
  );
  const [migration, setMigration] = useState<{ up: string[]; down: string[]; warnings: string[] } | null>(null);

  // Recalculate diff when schemas change
  useEffect(() => {
    const newDiff = compareSchemas(originalSchema, currentSchema);
    setDiff(newDiff);
    if (newDiff.hasChanges) {
      const migrationSQL = generateMigration(newDiff, dialect, 'Sync to Database');
      setMigration(migrationSQL);
    } else {
      setMigration(null);
    }
  }, [originalSchema, currentSchema, dialect]);

  useEffect(() => {
    if (!isOpen) return;
    resetToast();
  }, [isOpen, resetToast]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSyncing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSyncing, onClose]);

  const handleSync = async () => {
    if (!migration || migration.up.length === 0) {
      showToast('No changes to sync', 'error');
      return;
    }

    if (connectionConfig.type === 'sqlite') {
      showToast('SQLite sync is not yet supported', 'error');
      return;
    }

    setIsSyncing(true);

    try {
      // Filter out comments and empty lines for execution
      const sqlStatements = migration.up
        .filter(line => line.trim() && !line.trim().startsWith('--'))
        .filter(line => !line.trim().startsWith('BEGIN') && !line.trim().startsWith('COMMIT'));

      const response = await fetch('/api/database/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: connectionConfig.type,
          connectionConfig: {
            host: connectionConfig.host,
            port: connectionConfig.port,
            database: connectionConfig.database,
            username: connectionConfig.username,
            connectionString: connectionConfig.connectionString,
            // Note: Password should be stored securely, not sent from client
            // For now, we'll need to re-enter it or use connection string
          },
          sql: sqlStatements,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync database');
      }

      showToast('Database synced successfully!', 'success');
      onSyncComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Sync error:', error);
      showToast(
        error.message || 'Failed to sync database. Please check your connection and try again.',
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const noChanges = !diff.hasChanges;

  const connectionLabel = connectionConfig.username
    ? `Connected as ${connectionConfig.username}`
    : connectionConfig.database
      ? `Database: ${connectionConfig.database}`
      : 'Connected database';
  const hostLabel = connectionConfig.host || 'localhost';

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={!isSyncing ? onClose : undefined}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
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
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Sync to Database</h2>
                  <p className="text-xs text-foreground/60 mt-1" title={hostLabel}>
                    {connectionLabel}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSyncing}
                  className="p-1.5 hover:bg-foreground/10 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {noChanges ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-foreground/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-foreground/70">No changes detected. Schema is up to date.</p>
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    <div className="mb-4 p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Changes Summary</h3>
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

                    {/* Warnings */}
                    {migration && migration.warnings.length > 0 && (
                      <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Warnings</h3>
                        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                          {migration.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* SQL Preview */}
                    {migration && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2">SQL Migration Preview</h3>
                        <div className="bg-[#1e1e1e] rounded-lg p-4 overflow-x-auto">
                          <pre className="text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap">
                            {migration.up.join('\n')}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-foreground/10 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isSyncing}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover.bg-foreground/10 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  Close
                </button>
                {!noChanges && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || !migration}
                    className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                  >
                    {isSyncing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync to Database
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </>
  );
}

