/**
 * Migration Sidebar Drawer
 * 
 * Slide-in panel for managing schema versions and generating migrations.
 * Matches ColumnEditor and IndexManager UI patterns.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom scrollbar styles
const scrollbarStyles = `
  .migration-code-block::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .migration-code-block::-webkit-scrollbar-track {
    background: transparent;
  }
  .migration-code-block::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 4px;
  }
  .migration-code-block::-webkit-scrollbar-thumb:hover {
    background: rgba(128, 128, 128, 0.5);
  }
  .migration-code-block {
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
  }
`;
import { SchemaState } from '../types';
import { useToast } from '@/features/sql-builder/hooks/useToast';
import Toast from '@/features/sql-builder/components/ui/Toast';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';
import {
  SchemaVersion,
  getVersions,
  saveVersion,
  deleteVersion,
  clearVersions,
  formatTimestamp,
  getStorageInfo,
} from '../utils/schema-versions';
import {
  compareSchemas,
  SchemaDiff,
  countChanges,
} from '../utils/schema-comparator';
import {
  generateMigration,
  SQLDialect,
  MigrationSQL,
} from '../utils/migration-generator';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchema: SchemaState;
  onLoadVersion: (schema: SchemaState) => void;
}

type View = 'list' | 'save' | 'compare' | 'migration';

export function MigrationModal({
  isOpen,
  onClose,
  currentSchema,
  onLoadVersion,
}: MigrationModalProps) {
  const [view, setView] = useState<View>('list');
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersion | null>(null);
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [migration, setMigration] = useState<MigrationSQL | null>(null);
  const [dialect, setDialect] = useState<SQLDialect>('postgresql');
  
  // Save version form
  const [saveTag, setSaveTag] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast for notifications
  const { toast, showToast, hideToast } = useToast();

  // Confirm dialog for destructive actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load versions on mount and when reopened
  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setView('list');
      setSaveTag('');
      setSaveDescription('');
      setSaveError('');
      setIsSaving(false);
      setSelectedVersion(null);
      setDiff(null);
      setMigration(null);
      // Don't reset dialect - let user preference persist across sessions
    }
  }, [isOpen]);

  // Cleanup when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Reset confirm dialog state to prevent stale dialogs
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
      });
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't close if confirm dialog is open
        if (confirmDialog.isOpen) {
          return;
        }

        e.preventDefault();
        if (view === 'list') {
          onClose();
        } else {
          setView('list');
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, view, onClose, confirmDialog.isOpen]);

  const loadVersions = () => {
    setVersions(getVersions());
  };

  const handleSave = () => {
    // Prevent rapid clicks
    if (isSaving) return;

    setSaveError('');
    setIsSaving(true);

    // Validate tag
    if (!saveTag.trim()) {
      setSaveError('Version tag is required');
      setIsSaving(false);
      return;
    }

    // Validate current schema has tables
    if (currentSchema.tables.length === 0) {
      setSaveError('Cannot save empty schema. Add at least one table first.');
      setIsSaving(false);
      return;
    }

    const result = saveVersion(currentSchema, saveTag, saveDescription);

    if (result.success) {
      showToast('Version saved successfully', 'success');
      loadVersions();
      setView('list');
      setSaveTag('');
      setSaveDescription('');
    } else {
      setSaveError(result.error || 'Failed to save version');
    }

    setIsSaving(false);
  };

  const handleDelete = (id: string, tag: string) => {
    // Check if user is viewing/comparing this version
    const isViewingThisVersion = selectedVersion?.id === id;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Version?',
      message: isViewingThisVersion
        ? `Are you sure you want to delete version "${tag}"?\n\nYou are currently viewing this version. Deleting it will return you to the version list.\n\nThis action cannot be undone.`
        : `Are you sure you want to delete version "${tag}"?\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        const result = deleteVersion(id);

        if (result.success) {
          showToast('Version deleted', 'success');
          loadVersions();
          
          // If viewing this version, reset to list view
          if (selectedVersion?.id === id) {
            setSelectedVersion(null);
            setDiff(null);
            setMigration(null);
            setView('list');
          }
        } else {
          showToast(result.error || 'Failed to delete version', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Versions?',
      message: `Are you sure you want to delete all ${versions.length} version${versions.length !== 1 ? 's' : ''}?\n\nThis action cannot be undone and will clear your entire version history.`,
      confirmLabel: 'Delete All',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        const result = clearVersions();

        if (result.success) {
          showToast('All versions deleted', 'success');
          loadVersions();
          setSelectedVersion(null);
          setDiff(null);
          setMigration(null);
          setView('list');
        } else {
          showToast(result.error || 'Failed to clear versions', 'error');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleCompare = (version: SchemaVersion) => {
    // Validate version schema
    if (!version.schema || !version.schema.tables || !Array.isArray(version.schema.tables)) {
      showToast('Version data is corrupted', 'error');
      return;
    }

    // Validate current schema
    if (!currentSchema || !currentSchema.tables || !Array.isArray(currentSchema.tables)) {
      showToast('Current schema is invalid', 'error');
      return;
    }

    setSelectedVersion(version);
    const schemaDiff = compareSchemas(version.schema, currentSchema);
    setDiff(schemaDiff);
    setView('compare');
  };

  const handleGenerateMigration = () => {
    if (!diff || !selectedVersion) return;

    // Validate diff has changes
    if (!diff.hasChanges) {
      showToast('No changes to migrate', 'error');
      return;
    }

    const migrationSQL = generateMigration(diff, dialect, selectedVersion.tag);
    setMigration(migrationSQL);
    setView('migration');
  };

  // Regenerate migration when dialect changes (only when viewing migration)
  useEffect(() => {
    if (diff && view === 'migration' && selectedVersion) {
      const migrationSQL = generateMigration(diff, dialect, selectedVersion.tag);
      setMigration(migrationSQL);
    }
  }, [dialect, diff, view, selectedVersion]); // Don't include 'migration' to avoid infinite loop

  // Recalculate diff if currentSchema changes while comparing
  useEffect(() => {
    if (selectedVersion && (view === 'compare' || view === 'migration')) {
      // Validate schemas before comparing
      if (!selectedVersion.schema?.tables || !currentSchema?.tables) {
        return;
      }

      const updatedDiff = compareSchemas(selectedVersion.schema, currentSchema);
      setDiff(updatedDiff);

      // If no changes anymore, show message and return to list
      if (!updatedDiff.hasChanges && view === 'compare') {
        showToast('Schemas are now identical', 'success');
        setView('list');
      }
    }
  }, [currentSchema, selectedVersion, view]); // Recalculate when currentSchema changes

  const handleCopySQL = async (sql: string[]) => {
    try {
      const text = sql.join('\n');
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownloadSQL = (sql: string[], filename: string) => {
    try {
      if (!sql || sql.length === 0) {
        showToast('No SQL to download', 'error');
        return;
      }

      // Sanitize filename (prevent path traversal)
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      const text = sql.join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename.endsWith('.sql') ? safeFilename : `${safeFilename}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded migration file', 'success');
    } catch (error) {
      console.error('[Migration] Download failed:', error);
      showToast('Failed to download file', 'error');
    }
  };

  const storageInfo = getStorageInfo();

  // Check if current schema can be saved (has tables)
  const canSaveVersion = currentSchema.tables.length > 0;

  return (
    <>
      {/* Inject custom scrollbar styles */}
      <style>{scrollbarStyles}</style>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[600px] bg-white dark:bg-[#1a1a1a] border-l border-foreground/10 z-[91] flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="migration-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <h3 id="migration-title" className="text-lg font-semibold text-foreground font-mono">
                  {view === 'list' && 'Migrations & Versions'}
                  {view === 'save' && 'Save Current Version'}
                  {view === 'compare' && 'Schema Comparison'}
                  {view === 'migration' && 'Migration SQL'}
                </h3>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">
                  {view === 'list' && `${versions.length} saved version${versions.length !== 1 ? 's' : ''}`}
                  {view === 'save' && 'Create a snapshot of your current schema'}
                  {view === 'compare' && selectedVersion && `Comparing changes from "${selectedVersion.tag}"`}
                  {view === 'migration' && selectedVersion && `SQL migration for "${selectedVersion.tag}"`}
                  <span className="text-foreground/30"> • Press <kbd className="px-1 py-0.5 bg-foreground/10 rounded text-[9px]">Esc</kbd> to {view === 'list' ? 'close' : 'go back'}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
                aria-label="Close"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {view === 'list' && (
                <VersionList
                  versions={versions}
                  storageInfo={storageInfo}
                  currentSchema={currentSchema}
                  canSaveVersion={canSaveVersion}
                  onSaveNew={() => setView('save')}
                  onCompare={handleCompare}
                  onLoad={onLoadVersion}
                  onDelete={handleDelete}
                  onClearAll={handleClearAll}
                />
              )}

              {view === 'save' && (
                <SaveVersionForm
                  tag={saveTag}
                  description={saveDescription}
                  error={saveError}
                  isSaving={isSaving}
                  onTagChange={setSaveTag}
                  onDescriptionChange={setSaveDescription}
                  onSave={handleSave}
                  onCancel={() => setView('list')}
                />
              )}

              {view === 'compare' && diff && selectedVersion && (
                <CompareView
                  diff={diff}
                  fromVersion={selectedVersion}
                  toLabel="Current Schema"
                  onGenerateMigration={handleGenerateMigration}
                  onBack={() => setView('list')}
                />
              )}

              {view === 'migration' && migration && diff && selectedVersion && (
                <MigrationView
                  migration={migration}
                  dialect={dialect}
                  fromVersion={selectedVersion}
                  onDialectChange={setDialect}
                  onCopySQL={handleCopySQL}
                  onDownloadSQL={handleDownloadSQL}
                  onBack={() => setView('compare')}
                />
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

// ==================== SUB-COMPONENTS ====================

function VersionList({
  versions,
  storageInfo,
  currentSchema,
  canSaveVersion,
  onSaveNew,
  onCompare,
  onLoad,
  onDelete,
  onClearAll,
}: {
  versions: SchemaVersion[];
  storageInfo: { versionCount: number; estimatedSize: number; quotaPercentage: number };
  currentSchema: SchemaState;
  canSaveVersion: boolean;
  onSaveNew: () => void;
  onCompare: (version: SchemaVersion) => void;
  onLoad: (schema: SchemaState) => void;
  onDelete: (id: string, tag: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Save Current Schema Button */}
      <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-1 font-mono">Current Schema</h4>
            <p className="text-xs text-foreground/60 font-mono">
              {currentSchema.tables.length} table{currentSchema.tables.length !== 1 ? 's' : ''} •{' '}
              {currentSchema.tables.reduce((sum, t) => sum + t.columns.length, 0)} columns
            </p>
            {!canSaveVersion && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-mono">
                Add at least one table to save a version
              </p>
            )}
          </div>
          <button
            onClick={onSaveNew}
            disabled={!canSaveVersion}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 disabled:bg-foreground/20 disabled:text-foreground/40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all active:scale-95 flex items-center gap-2 font-mono flex-shrink-0"
            title={canSaveVersion ? 'Save current schema as a new version' : 'Add tables to save a version'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Version
          </button>
        </div>
      </div>

      {/* Version List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground font-mono">
            Saved Versions ({versions.length})
          </h4>
          {versions.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium font-mono transition-all"
            >
              Clear All
            </button>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-12 text-foreground/40">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p className="text-sm font-mono">No saved versions yet</p>
            <p className="text-xs mt-1 font-mono">Save your current schema to track changes over time</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {version.tag}
                      </span>
                      <span className="text-xs text-foreground/40 font-mono">
                        {formatTimestamp(version.timestamp)}
                      </span>
                    </div>
                    {version.description && (
                      <p className="text-xs text-foreground/60 mb-2 font-mono break-words">{version.description}</p>
                    )}
                    <p className="text-xs text-foreground/50 font-mono">
                      {version.schema.tables.length} table{version.schema.tables.length !== 1 ? 's' : ''} •{' '}
                      {version.schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} columns
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onCompare(version)}
                      className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/10 rounded transition-all active:scale-95 font-mono"
                      title="Compare with current schema"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => onLoad(version.schema)}
                      className="px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10 rounded transition-all active:scale-95 font-mono"
                      title="Load this version (replaces current schema)"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDelete(version.id, version.tag)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded transition-all active:scale-95"
                      title="Delete version"
                      aria-label="Delete version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Info */}
      {versions.length > 0 && (
        <div className="text-xs text-foreground/50 text-center pt-2 border-t border-foreground/10 font-mono">
          Using {storageInfo.versionCount} of 50 version slots •{' '}
          {(storageInfo.estimatedSize / 1024).toFixed(1)} KB
        </div>
      )}
    </div>
  );
}

function SaveVersionForm({
  tag,
  description,
  error,
  isSaving,
  onTagChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: {
  tag: string;
  description: string;
  error: string;
  isSaving: boolean;
  onTagChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaving) {
      onSave();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-mono">
          Version Tag <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          placeholder="e.g., v1.0.0, initial-schema, add-users-table"
          disabled={isSaving}
          className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground placeholder-foreground/40 focus:outline-none transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={50}
          autoFocus
          required
        />
        <p className="text-xs text-foreground/50 mt-1 font-mono">{tag.length}/50 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-mono">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g., Added users table with authentication fields"
          rows={3}
          disabled={isSaving}
          className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground placeholder-foreground/40 focus:outline-none transition-all resize-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={500}
        />
        <p className="text-xs text-foreground/50 mt-1 font-mono">{description.length}/500 characters</p>
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600 font-mono break-words">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          type="button"
          disabled={isSaving}
          className="flex-1 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-mono active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!tag.trim() || isSaving}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-foreground/20 disabled:text-foreground/40 disabled:cursor-not-allowed rounded-lg transition-all font-mono active:scale-95"
        >
          {isSaving ? 'Saving...' : 'Save Version'}
        </button>
      </div>
    </form>
  );
}

function CompareView({
  diff,
  fromVersion,
  toLabel,
  onGenerateMigration,
  onBack,
}: {
  diff: SchemaDiff;
  fromVersion: SchemaVersion;
  toLabel: string;
  onGenerateMigration: () => void;
  onBack: () => void;
}) {
  const changeCount = countChanges(diff);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-foreground/60 hover:text-foreground flex items-center gap-1 font-mono active:scale-95 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to versions
      </button>

      {/* Summary info */}
      <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1 font-mono">
              Comparing: {fromVersion.tag} → Current Schema
            </h4>
            <p className="text-xs text-foreground/60 font-mono">
              {changeCount} change{changeCount !== 1 ? 's' : ''} detected
            </p>
          </div>
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 text-sm font-semibold rounded font-mono flex-shrink-0">
            {changeCount}
          </span>
        </div>
      </div>

      {!diff.hasChanges ? (
        <div className="text-center py-12 text-foreground/40">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-mono font-semibold">No changes detected</p>
          <p className="text-xs mt-1 font-mono">Both schemas are identical. Try comparing with a different version.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {/* Tables Added */}
            {diff.tablesAdded.length > 0 && (
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-semibold text-green-600 font-mono">
                    {diff.tablesAdded.length} Table{diff.tablesAdded.length !== 1 ? 's' : ''} Added
                  </span>
                </div>
                <ul className="text-xs text-foreground/70 space-y-1 ml-6 font-mono">
                  {diff.tablesAdded.map((table) => (
                    <li key={table.id}>
                      {table.name} ({table.columns.length} columns)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tables Removed */}
            {diff.tablesRemoved.length > 0 && (
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  <span className="text-sm font-semibold text-red-600 font-mono">
                    {diff.tablesRemoved.length} Table{diff.tablesRemoved.length !== 1 ? 's' : ''} Removed
                  </span>
                </div>
                <ul className="text-xs text-foreground/70 space-y-1 ml-6 font-mono">
                  {diff.tablesRemoved.map((table) => (
                    <li key={table.id}>
                      {table.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tables Modified */}
            {diff.tablesModified.map((tableChange) => (
              <div key={tableChange.tableName} className="p-3 bg-foreground/5 border border-foreground/10 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-600 font-mono">
                    {tableChange.tableName}
                  </span>
                </div>
                <ul className="text-xs text-foreground/70 space-y-1 ml-6 font-mono">
                  {tableChange.columnsAdded.map((col) => (
                    <li key={col.id} className="text-green-600">
                      + {col.name} ({col.type})
                    </li>
                  ))}
                  {tableChange.columnsRemoved.map((col) => (
                    <li key={col.id} className="text-red-600">
                      - {col.name}
                    </li>
                  ))}
                  {tableChange.columnsModified.map((colChange, idx) => (
                    <li key={idx} className="text-yellow-600">
                      ~ {colChange.new.name}: {colChange.changes.map(c => c.type).join(', ')}
                    </li>
                  ))}
                  {tableChange.indexesAdded.map((idx) => (
                    <li key={idx.name} className="text-green-600">
                      + Index: {idx.name}
                    </li>
                  ))}
                  {tableChange.indexesRemoved.map((idx) => (
                    <li key={idx.name} className="text-red-600">
                      - Index: {idx.name}
                    </li>
                  ))}
                  {tableChange.indexesModified.map((idxChange, idx) => (
                    <li key={idx} className="text-yellow-600">
                      ~ Index {idxChange.new.name}: {idxChange.changes.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            onClick={onGenerateMigration}
            className="w-full px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2 font-mono"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Generate Migration SQL
          </button>
        </>
      )}
    </div>
  );
}

function MigrationView({
  migration,
  dialect,
  fromVersion,
  onDialectChange,
  onCopySQL,
  onDownloadSQL,
  onBack,
}: {
  migration: MigrationSQL;
  dialect: SQLDialect;
  fromVersion: SchemaVersion;
  onDialectChange: (dialect: SQLDialect) => void;
  onCopySQL: (sql: string[]) => void;
  onDownloadSQL: (sql: string[], filename: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-foreground/60 hover:text-foreground flex items-center gap-1 font-mono active:scale-95 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to comparison
      </button>

      {/* Info Banner */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 font-mono">
              Before Applying
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-mono mt-1">
              Backup your database, test in staging, and review all warnings carefully before running migrations.
            </p>
          </div>
        </div>
      </div>

      {/* Dialect Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground font-mono">SQL Dialect:</span>
        <div className="flex gap-1">
          <button
            onClick={() => onDialectChange('postgresql')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all active:scale-95 font-mono ${
              dialect === 'postgresql'
                ? 'bg-primary text-white'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
            }`}
          >
            PostgreSQL
          </button>
          <button
            onClick={() => onDialectChange('mysql')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all active:scale-95 font-mono ${
              dialect === 'mysql'
                ? 'bg-primary text-white'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
            }`}
          >
            MySQL
          </button>
        </div>
      </div>

      {/* Warnings */}
      {migration.warnings.length > 0 && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <div className="flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">Important Warnings</p>
              <ul className="text-xs text-foreground/70 font-mono space-y-1 break-words mt-1">
                {migration.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* UP Migration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h5 className="text-sm font-semibold text-foreground font-mono">UP Migration (Apply Changes)</h5>
            <p className="text-xs text-foreground/50 font-mono">Run this to update your database</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onCopySQL(migration.up)}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/10 rounded transition-all active:scale-95 font-mono"
            >
              Copy
            </button>
            <button
              onClick={() => onDownloadSQL(migration.up, `migration_up_${fromVersion.tag}.sql`)}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-500/10 rounded transition-all active:scale-95 font-mono"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="migration-code-block bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg p-4 text-xs text-foreground font-mono overflow-x-auto max-h-[30vh] overflow-y-scroll break-words whitespace-pre-wrap">
          {migration.up.length > 0 ? migration.up.join('\n') : '-- No migration statements needed'}
        </pre>
      </div>

      {/* DOWN Migration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h5 className="text-sm font-semibold text-foreground font-mono">DOWN Migration (Rollback)</h5>
            <p className="text-xs text-foreground/50 font-mono">Run this to undo the changes</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onCopySQL(migration.down)}
              disabled={migration.down.length === 0}
              className="px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10 rounded transition-all active:scale-95 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy
            </button>
            <button
              onClick={() => onDownloadSQL(migration.down, `migration_down_${fromVersion.tag}.sql`)}
              disabled={migration.down.length === 0}
              className="px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:bg-foreground/10 rounded transition-all active:scale-95 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="migration-code-block bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg p-4 text-xs text-foreground font-mono overflow-x-auto max-h-[30vh] overflow-y-scroll break-words whitespace-pre-wrap">
          {migration.down.length > 0 ? migration.down.join('\n') : '-- No rollback statements needed'}
        </pre>
      </div>
    </div>
  );
}
