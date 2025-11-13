/**
 * Export Modal
 * Export schema in multiple formats
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaState, ExportFormat } from '../types';
import { generateSQL, generatePrismaSchema, generateJSONSchema, validateSchema as validateSchemaUtil } from '../utils/schema-generator';
import { useToast } from '@/features/sql-builder/hooks/useToast';
import Toast from '@/features/sql-builder/components/ui/Toast';

interface ExportModalProps {
  isOpen: boolean;
  schema: SchemaState;
  onClose: () => void;
  onExportImage?: (format: 'png' | 'svg') => void;
}

const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'sql-postgres', label: 'PostgreSQL', description: 'CREATE TABLE statements for PostgreSQL' },
  { value: 'sql-mysql', label: 'MySQL', description: 'CREATE TABLE statements for MySQL' },
  { value: 'sql-sqlite', label: 'SQLite', description: 'CREATE TABLE statements for SQLite' },
  { value: 'prisma', label: 'Prisma Schema', description: 'Prisma schema.prisma file' },
  { value: 'json', label: 'JSON', description: 'Schema as JSON (for backup/restore)' },
];

export default function ExportModal({ isOpen, schema, onClose, onExportImage }: ExportModalProps) {
  const { toast, showToast, hideToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('sql-postgres');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Generate export code based on selected format
  const exportCode = () => {
    // Use comprehensive validation from utility
    const validation = validateSchemaUtil(schema);
    
    if (!validation.isValid) {
      // Show errors
      const errorLines = validation.errors.map(err => `-- ERROR: ${err}`);
      const warningLines = validation.warnings.length > 0 
        ? ['--', '-- WARNINGS:', ...validation.warnings.map(warn => `-- ${warn}`)]
        : [];
      
      return [
        '-- VALIDATION ERRORS',
        '-- Fix these issues before exporting:',
        '--',
        ...errorLines,
        ...warningLines,
      ].join('\n');
    }
    
    // Show warnings but allow export
    if (validation.warnings.length > 0) {
      const warningLines = validation.warnings.map(warn => `-- WARNING: ${warn}`);
      const warningHeader = [
        '-- WARNINGS (schema is valid but could be improved):',
        ...warningLines,
        '--',
        '',
      ].join('\n');
      
      // Generate code with warnings at top
      let generatedCode = '';
      switch (selectedFormat) {
        case 'sql-postgres':
        case 'sql-mysql':
        case 'sql-sqlite':
          generatedCode = generateSQL(schema, selectedFormat);
          break;
        case 'prisma':
          generatedCode = generatePrismaSchema(schema);
          break;
        case 'json':
          generatedCode = generateJSONSchema(schema);
          break;
      }
      
      return warningHeader + generatedCode;
    }

    switch (selectedFormat) {
      case 'sql-postgres':
      case 'sql-mysql':
      case 'sql-sqlite':
        return generateSQL(schema, selectedFormat);
      case 'prisma':
        return generatePrismaSchema(schema);
      case 'json':
        return generateJSONSchema(schema);
      default:
        return '// Select a format';
    }
  };

  const code = exportCode();
  const hasValidationError = code.includes('VALIDATION ERROR');

  const handleCopy = async () => {
    // Don't allow copying validation errors
    if (hasValidationError) {
      showToast('Fix validation errors before copying', 'error');
      return;
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        showToast('Clipboard API not supported by your browser', 'error');
        return;
      }

      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Copied to clipboard!', 'success');

      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    // Don't allow downloading validation errors
    if (hasValidationError) {
      showToast('Fix validation errors before downloading', 'error');
      return;
    }

    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determine filename based on format
      // Sanitize schema name to prevent path traversal and special characters
      const sanitizedName = (schema.name || 'schema')
        .replace(/[^a-zA-Z0-9_-]/g, '_')  // Replace special chars with underscore
        .replace(/^\.+/, '')               // Remove leading dots
        .substring(0, 64);                 // Limit length
      
      let filename = sanitizedName || 'schema';
      if (selectedFormat === 'prisma') {
        filename = 'schema.prisma';
      } else if (selectedFormat === 'json') {
        filename = `${filename}.json`;
      } else {
        filename = `${filename}.sql`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('File downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Failed to download file', 'error');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="export-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div key="export-modal-wrapper" className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-modal-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <div>
                    <h3 id="export-modal-title" className="text-lg font-semibold text-foreground font-mono">
                      Export Schema
                    </h3>
                    <p className="text-xs text-foreground/40 font-mono mt-0.5">
                      {schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* FK Optimization Banner */}
              {(() => {
                const validation = validateSchemaUtil(schema);
                const hasFKWarnings = validation.warnings.some(warn => 
                  warn.includes('Foreign key column') && warn.includes('should have an index')
                );
                
                if (hasFKWarnings && validation.isValid) {
                  return (
                    <div className="px-6 py-4 bg-yellow-500/5 border-b border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 font-mono mb-1">
                            ⚡ Performance Optimization Available
                          </h4>
                          <p className="text-xs text-yellow-600 dark:text-yellow-500 font-mono leading-relaxed mb-2">
                            Some foreign key columns don&apos;t have indexes, which can significantly slow down JOIN queries in production.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              // The main page will show the Auto-Index FKs button
                            }}
                            className="text-xs font-mono font-semibold text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 hover:bg-yellow-500/10 px-2 py-1 rounded transition-all inline-flex items-center gap-1 active:scale-95"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Close and use &quot;Auto-Index FKs&quot; button
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Format Selection */}
              <div className="px-6 py-4 border-b border-foreground/10">
                <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                  Select Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPORT_FORMATS.map(format => (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`p-3 border rounded-lg transition-all text-left active:scale-95 ${
                        selectedFormat === format.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-foreground/5 text-foreground border-foreground/10 hover:bg-foreground/10'
                      }`}
                    >
                      <div className="text-sm font-semibold font-mono mb-0.5">{format.label}</div>
                      <div className="text-[10px] font-mono opacity-80">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Preview */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="relative">
                  <pre className="p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-words">
                    {code}
                  </pre>
                  
                  {/* Format Badge */}
                  <div className="absolute top-2 right-2 text-[10px] px-2 py-1 bg-white dark:bg-black/80 border border-foreground/10 rounded font-mono text-foreground/40 uppercase tracking-wider">
                    {EXPORT_FORMATS.find(f => f.value === selectedFormat)?.label}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-foreground/10 bg-white dark:bg-[#1a1a1a]">
                {/* Image Export Section */}
                {onExportImage && (
                  <div className="mb-3 pb-3 border-b border-foreground/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-semibold text-foreground/60 font-mono uppercase tracking-wider">
                          Export as Image
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onExportImage?.('png');
                            onClose(); // Close modal to show clean canvas for export
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all font-mono flex items-center gap-1.5 active:scale-95"
                          title="Export diagram as PNG image (high resolution)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          PNG
                        </button>
                        <button
                          onClick={() => {
                            onExportImage?.('svg');
                            onClose(); // Close modal to show clean canvas for export
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all font-mono flex items-center gap-1.5 active:scale-95"
                          title="Export diagram as SVG (vector, editable)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          SVG
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Code Export Section */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={hasValidationError}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all font-mono flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground/5"
                    title={hasValidationError ? 'Fix validation errors first' : 'Download code as file'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={hasValidationError}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all font-mono flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                    title={hasValidationError ? 'Fix validation errors first' : copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-4 4H12a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2z" />
                    </svg>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

