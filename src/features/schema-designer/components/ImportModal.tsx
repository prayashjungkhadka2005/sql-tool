/**
 * Import Modal
 * Import schema from SQL or Prisma format
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaState } from '../types';
import { parseSQLSchema } from '../utils/sql-parser';
import { parsePrismaSchema } from '../utils/prisma-parser';
import { useToast } from '@/features/sql-builder/hooks/useToast';
import Toast from '@/features/sql-builder/components/ui/Toast';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (schema: SchemaState) => void;
  hasExistingTables?: boolean;
}

type ImportFormat = 'sql' | 'prisma' | 'auto';

export default function ImportModal({ isOpen, onClose, onImport, hasExistingTables = false }: ImportModalProps) {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<ImportFormat>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewSchema, setPreviewSchema] = useState<SchemaState | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast, showToast, hideToast} = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInput('');
      setFormat('auto');
      setParseError(null);
      setPreviewSchema(null);
      setIsProcessing(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing && !showConfirm) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isProcessing, showConfirm]);

  // Auto-detect format
  const detectFormat = (text: string): 'sql' | 'prisma' => {
    const normalized = text.trim().toLowerCase();
    
    // Prisma patterns
    if (normalized.includes('model ') && normalized.includes('@')) {
      return 'prisma';
    }
    
    // SQL patterns
    if (normalized.includes('create table') || normalized.includes('create index')) {
      return 'sql';
    }
    
    // Default to SQL
    return 'sql';
  };

  // Parse and preview schema
  const handleParse = async () => {
    if (!input.trim()) {
      setParseError('Please paste your SQL or Prisma schema');
      return;
    }

    setIsProcessing(true);
    setParseError(null);
    setPreviewSchema(null);

    try {
      // Detect or use selected format
      const actualFormat = format === 'auto' ? detectFormat(input) : format;
      
      let parsed: SchemaState;
      
      if (actualFormat === 'prisma') {
        parsed = await parsePrismaSchema(input);
      } else {
        parsed = await parseSQLSchema(input);
      }

      // Validate parsed schema
      if (!parsed.tables || parsed.tables.length === 0) {
        throw new Error('No tables found in the input. Please check your schema syntax.');
      }

      setPreviewSchema(parsed);
      showToast(`Successfully parsed ${parsed.tables.length} table${parsed.tables.length !== 1 ? 's' : ''}!`, 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse schema';
      setParseError(errorMessage);
      showToast('Parse failed. Check the error message below.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Import the parsed schema
  const handleImport = () => {
    if (!previewSchema) return;
    
    // If user has existing tables, show confirmation dialog
    if (hasExistingTables) {
      setShowConfirm(true);
      return;
    }
    
    // No existing tables - import directly
    proceedWithImport();
  };

  // Actually perform the import
  const proceedWithImport = () => {
    if (!previewSchema) return;
    
    // Final validation before import
    if (previewSchema.tables.length === 0) {
      setParseError('Cannot import an empty schema. Add at least one table.');
      setShowConfirm(false);
      return;
    }
    
    onImport(previewSchema);
    showToast('Schema imported successfully!', 'success');
    setShowConfirm(false);
    onClose();
  };

  // Load example
  const loadExample = () => {
    const example = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);`;
    
    setInput(example);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="import-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              // Don't close if processing or confirm dialog is open
              if (!isProcessing && !showConfirm) {
                onClose();
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div 
            key="import-modal-wrapper"
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="import-modal-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 id="import-modal-title" className="text-lg font-bold text-foreground font-mono">
                        Import Schema
                      </h3>
                      <p className="text-xs text-foreground/60 font-mono">
                        Paste SQL CREATE TABLE or Prisma schema
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="p-2 hover:bg-foreground/10 rounded-lg transition-all disabled:opacity-50 active:scale-95"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Format Selector */}
              <div className="px-6 py-3 bg-foreground/5 border-b border-foreground/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground/60 font-mono uppercase tracking-wider">Format:</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'auto' as const, label: 'Auto-detect' },
                      { value: 'sql' as const, label: 'SQL' },
                      { value: 'prisma' as const, label: 'Prisma' },
                    ].map(fmt => (
                      <button
                        key={fmt.value}
                        onClick={() => {
                          setFormat(fmt.value);
                          setParseError(null);
                          setPreviewSchema(null);
                        }}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 text-xs font-medium font-mono rounded-lg transition-all disabled:opacity-50 active:scale-95 ${
                          format === fmt.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={loadExample}
                    disabled={isProcessing}
                    className="ml-auto text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500/10 active:scale-95"
                    title="Load example SQL schema"
                  >
                    Load Example
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {/* Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground/60 font-mono uppercase tracking-wider">
                        Paste Your Schema
                      </label>
                      {input && (
                        <span className="text-[10px] text-foreground/40 font-mono">
                          {input.length.toLocaleString()} characters
                        </span>
                      )}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setParseError(null);
                        setPreviewSchema(null);
                      }}
                      disabled={isProcessing}
                      placeholder="Paste CREATE TABLE statements or Prisma schema here..."
                      className="w-full h-64 px-4 py-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-primary rounded-lg text-xs font-mono text-foreground focus:outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      spellCheck={false}
                      aria-label="Schema input"
                      maxLength={100000}
                    />
                  </div>

                  {/* Parse Error */}
                  {parseError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-red-600 dark:text-red-400 font-mono flex-1 break-words">
                          {parseError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {previewSchema && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 font-mono">
                              Ready to Import
                            </h4>
                            <button
                              onClick={() => {
                                setPreviewSchema(null);
                                setParseError(null);
                                textareaRef.current?.focus();
                              }}
                              className="text-xs px-2 py-1 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 text-green-700 dark:text-green-400 rounded font-mono transition-all active:scale-95"
                              title="Clear preview and modify schema"
                            >
                              Edit & Re-parse
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="text-green-600 dark:text-green-400">
                                {previewSchema.tables.length} table{previewSchema.tables.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-green-600 dark:text-green-400">
                                {previewSchema.tables.reduce((sum, t) => sum + t.columns.length, 0)} columns
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span className="text-green-600 dark:text-green-400">
                                {previewSchema.tables.reduce((sum, t) => sum + t.columns.filter(c => c.references).length, 0)} foreign keys
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-green-600 dark:text-green-400">
                                {previewSchema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0)} indexes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between gap-3">
                <div className="text-xs text-foreground/50 font-mono">
                  {previewSchema ? 'Review and import' : 'Supports PostgreSQL, MySQL, SQLite, Prisma'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 rounded-lg transition-all font-mono disabled:opacity-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  {!previewSchema ? (
                    <button
                      onClick={handleParse}
                      disabled={!input.trim() || isProcessing}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Parsing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Parse Schema
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all font-mono active:scale-95 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Schema
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Overwrite Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Replace Existing Schema?"
        message={`You currently have ${hasExistingTables ? 'tables in your schema' : 'work in progress'}.\n\nImporting will replace all existing tables with the ${previewSchema?.tables.length || 0} imported table${previewSchema && previewSchema.tables.length !== 1 ? 's' : ''}.\n\nMake sure to export your current work first if you want to keep it.`}
        confirmLabel="Replace and Import"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={proceedWithImport}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

