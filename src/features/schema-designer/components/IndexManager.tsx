/**
 * Index Manager Component
 * UI for creating, editing, and deleting indexes on a table
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaTable, SchemaIndex, IndexType } from '../types';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';

interface IndexManagerProps {
  isOpen: boolean;
  table: SchemaTable;
  allTables: SchemaTable[]; // Needed to check for global index name uniqueness
  onClose: () => void;
  onSave: (indexes: SchemaIndex[]) => void;
}

const INDEX_TYPES: IndexType[] = ['BTREE', 'HASH', 'GIN', 'GIST', 'BRIN'];

export default function IndexManager({ isOpen, table, allTables, onClose, onSave }: IndexManagerProps) {
  const [indexes, setIndexes] = useState<SchemaIndex[]>(table.indexes || []);
  const [editingIndex, setEditingIndex] = useState<SchemaIndex | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Form state for editing/adding
  const [formData, setFormData] = useState<Partial<SchemaIndex>>({
    name: '',
    columns: [],
    type: 'BTREE',
    unique: false,
    where: '',
    comment: '',
  });

  // Sync indexes when table changes (important for state consistency)
  useEffect(() => {
    // Clean up indexes that reference deleted columns
    const cleanedIndexes = (table.indexes || []).map(idx => ({
      ...idx,
      columns: idx.columns.filter(colName => 
        table.columns.some(c => c.name === colName)
      ),
    })).filter(idx => idx.columns.length > 0); // Remove indexes with no valid columns
    
    setIndexes(cleanedIndexes);
    
    // Reset editing state when table changes
    setEditingIndex(null);
    setIsAddingNew(false);
    setValidationError(null);
    setValidationWarning(null);
  }, [table.id, table.columns]);

  const handleAddNew = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    
    setFormData({
      id: `idx-${timestamp}-${random}`,
      name: `idx_${table.name}_`,
      columns: [],
      type: 'BTREE',
      unique: false,
      where: '',
      comment: '',
    });
    setEditingIndex(null);
    setIsAddingNew(true);
    setValidationError(null);
    setValidationWarning(null);
  };

  const handleEdit = (index: SchemaIndex) => {
    setFormData(index);
    setEditingIndex(index);
    setIsAddingNew(false);
    setValidationError(null);
    setValidationWarning(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      columns: [],
      type: 'BTREE',
      unique: false,
      where: '',
      comment: '',
    });
    setValidationError(null);
    setValidationWarning(null);
  };

  const handleSaveIndex = () => {
    // Validation 1: Empty name
    if (!formData.name || formData.name.trim() === '') {
      setValidationError('Index name is required');
      return;
    }

    // Validation 2: Name length (max 64 chars for compatibility)
    if (formData.name.length > 64) {
      setValidationError('Index name must be 64 characters or less');
      return;
    }

    // Validation 3: Valid naming convention (SQL identifiers)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      setValidationError('Index name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return;
    }

    // Validation 4: No columns selected
    if (!formData.columns || formData.columns.length === 0) {
      setValidationError('Select at least one column for the index');
      return;
    }

    // Validation 5: Duplicate column selections (e.g., [email, email] is invalid)
    const uniqueColumns = new Set(formData.columns);
    if (uniqueColumns.size !== formData.columns.length) {
      setValidationError('Cannot select the same column multiple times in an index');
      return;
    }

    // Validation 6: Duplicate index names within this table
    const duplicateName = indexes.some(idx => 
      idx.id !== formData.id && idx.name === formData.name
    );
    if (duplicateName) {
      setValidationError(`Index "${formData.name}" already exists in this table`);
      return;
    }

    // Validation 6b: Check for globally unique index names (across all tables)
    const globalDuplicate = allTables.find(t => {
      if (t.id === table.id) return false; // Skip current table (already checked above)
      return t.indexes?.some(idx => idx.name === formData.name);
    });
    
    if (globalDuplicate) {
      setValidationError(`Index name "${formData.name}" already exists in table "${globalDuplicate.name}". Index names must be unique across all tables.`);
      return;
    }

    // Validation 7: Check if all selected columns exist
    const invalidColumns = formData.columns!.filter(col => 
      !table.columns.some(c => c.name === col)
    );
    if (invalidColumns.length > 0) {
      setValidationError(`Invalid columns: ${invalidColumns.join(', ')}`);
      return;
    }

    // Validation 8: UNIQUE index on nullable columns (warning, not error)
    if (formData.unique) {
      const nullableColumns = formData.columns!.filter(colName => {
        const col = table.columns.find(c => c.name === colName);
        return col?.nullable;
      });
      
      if (nullableColumns.length > 0) {
        // Show warning but allow (NULL is considered unique in SQL)
        setValidationWarning(`UNIQUE constraint on nullable column${nullableColumns.length > 1 ? 's' : ''}: ${nullableColumns.join(', ')}. Multiple NULL values are allowed.`);
      } else {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }

    // Validation 9: WHERE clause basic check (prevent obvious SQL injection)
    if (formData.where && formData.where.trim()) {
      const dangerousPatterns = /;|DROP|DELETE|UPDATE|INSERT|EXEC|EXECUTE/i;
      if (dangerousPatterns.test(formData.where)) {
        setValidationError('WHERE clause contains potentially dangerous SQL keywords. Use simple conditions only (e.g., status = \'active\')');
        return;
      }
    }

    // Validation 10: Check for redundant indexes (same columns already indexed)
    const existingIndex = indexes.find(idx => {
      if (idx.id === formData.id) return false; // Skip if editing self
      // Check if columns are the same (order matters for composite indexes)
      return JSON.stringify(idx.columns) === JSON.stringify(formData.columns);
    });
    
    if (existingIndex) {
      setValidationError(`An index already exists on these columns: "${existingIndex.name}". Remove the existing index first or edit it instead.`);
      return;
    }

    // Validation 11: Warn about UNIQUE index on column that's already UNIQUE
    if (formData.unique && formData.columns!.length === 1) {
      const col = table.columns.find(c => c.name === formData.columns![0]);
      if (col?.unique || col?.primaryKey) {
        setValidationError(`Column "${col.name}" already has a UNIQUE constraint. No need for a UNIQUE index.`);
        return;
      }
    }

    const newIndex: SchemaIndex = {
      id: formData.id!,
      name: formData.name,
      columns: formData.columns!,
      type: formData.type!,
      unique: formData.unique!,
      where: formData.where || undefined,
      comment: formData.comment || undefined,
    };

    let updatedIndexes: SchemaIndex[];
    if (isAddingNew) {
      updatedIndexes = [...indexes, newIndex];
    } else {
      updatedIndexes = indexes.map(idx => 
        idx.id === newIndex.id ? newIndex : idx
      );
    }

    setIndexes(updatedIndexes);
    handleCancelEdit();
  };

  const handleDelete = (indexId: string) => {
    const updatedIndexes = indexes.filter(idx => idx.id !== indexId);
    setIndexes(updatedIndexes);
    if (editingIndex?.id === indexId) {
      handleCancelEdit();
    }
  };

  const handleToggleColumn = (columnName: string) => {
    const currentColumns = formData.columns || [];
    const newColumns = currentColumns.includes(columnName)
      ? currentColumns.filter(c => c !== columnName)
      : [...currentColumns, columnName];
    
    setFormData({ ...formData, columns: newColumns });
  };

  const handleSaveAll = () => {
    // If user is in the middle of editing, save that first
    if (isAddingNew || editingIndex) {
      setValidationError('Please save or cancel the current index edit first');
      return;
    }
    
    onSave(indexes);
    onClose();
  };

  const handleClose = () => {
    // If editing, just cancel the edit
    if (isAddingNew || editingIndex) {
      handleCancelEdit();
      return;
    }
    
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(indexes) !== JSON.stringify(table.indexes || []);
    
    if (hasChanges) {
      // Show warning about unsaved changes
      setShowUnsavedWarning(true);
      return;
    }
    
    onClose();
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  const suggestIndexForFK = () => {
    const fkColumns = table.columns.filter(col => col.references);
    const suggestions: string[] = [];

    fkColumns.forEach(col => {
      const hasIndex = indexes.some(idx => 
        idx.columns.length === 1 && idx.columns[0] === col.name
      );
      if (!hasIndex) {
        suggestions.push(col.name);
      }
    });

    return suggestions;
  };

  const suggestions = suggestIndexForFK();

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddingNew, editingIndex, indexes, table.indexes]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white dark:bg-[#1a1a1a] border-l border-foreground/10 z-[91] flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="index-manager-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <h3 id="index-manager-title" className="text-lg font-semibold text-foreground font-mono flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Manage Indexes
                </h3>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">
                  {table.name} • {indexes.length} index{indexes.length !== 1 ? 'es' : ''} <span className="text-foreground/30">• Press <kbd className="px-1 py-0.5 bg-foreground/10 rounded text-[9px]">Esc</kbd> to close</span>
                </p>
              </div>
              <button
                onClick={handleClose}
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
              {/* Performance Suggestions */}
              {suggestions.length > 0 && !isAddingNew && !editingIndex && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 font-mono">Performance Tip</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 font-mono mt-1">
                        Foreign key columns should have indexes for better JOIN performance:
                      </p>
                      <ul className="text-xs text-yellow-600 dark:text-yellow-500 font-mono mt-1 ml-3">
                        {suggestions.map(col => (
                          <li key={col}>• {col}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Index List */}
              {!isAddingNew && !editingIndex && (
                <div className="space-y-3">
                  {indexes.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-foreground/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm text-foreground/40 font-mono">
                        No indexes yet
                      </p>
                      <p className="text-xs text-foreground/30 font-mono mt-1">
                        Add indexes to improve query performance
                      </p>
                    </div>
                  ) : (
                    indexes.map((index) => (
                      <div
                        key={index.id}
                        className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg hover:border-foreground/20 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground font-mono truncate">
                                {index.name}
                              </h4>
                              {index.unique && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-bold">
                                  UNIQUE
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded font-bold">
                                {index.type}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/60 font-mono mt-1">
                              Columns: {index.columns.join(', ')}
                            </p>
                            {index.where && (
                              <p className="text-xs text-foreground/40 font-mono mt-1">
                                WHERE: {index.where}
                              </p>
                            )}
                            {index.comment && (
                              <p className="text-xs text-foreground/40 font-mono mt-1">
                                {index.comment}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleEdit(index)}
                              className="p-1.5 hover:bg-foreground/10 rounded transition-all"
                              title="Edit index"
                              aria-label={`Edit index ${index.name}`}
                            >
                              <svg className="w-3.5 h-3.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(index.id)}
                              className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                              title="Delete index"
                              aria-label={`Delete index ${index.name}`}
                            >
                              <svg className="w-3.5 h-3.5 text-foreground/60 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Edit/Add Form */}
              {(isAddingNew || editingIndex) && (
                <div className="space-y-4">
                  {/* Index Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Index Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., idx_users_email"
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                      autoFocus
                    />
                    <p className="text-xs text-foreground/40 font-mono mt-1">
                      Convention: idx_tablename_columns
                    </p>
                  </div>

                  {/* Columns Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Indexed Columns <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {table.columns.map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 p-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.columns?.includes(column.name)}
                            onChange={() => handleToggleColumn(column.name)}
                            className="w-4 h-4"
                          />
                          <span className="text-xs font-mono text-foreground flex-1">
                            {column.name} ({column.type})
                          </span>
                          {column.references && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-bold">
                              FK
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-foreground/40 font-mono mt-1">
                      Select columns in order for composite indexes
                    </p>
                  </div>

                  {/* Index Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Index Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as IndexType })}
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                    >
                      {INDEX_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <p className="text-xs text-foreground/40 font-mono mt-1">
                      BTREE is the most common (default for PostgreSQL)
                    </p>
                  </div>

                  {/* Unique */}
                  <div>
                    <label className="flex items-center gap-2 p-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded cursor-pointer hover:bg-foreground/5">
                      <input
                        type="checkbox"
                        checked={formData.unique}
                        onChange={(e) => setFormData({ ...formData, unique: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-mono text-foreground">UNIQUE Index</span>
                        <p className="text-xs text-foreground/50 font-mono">Enforce uniqueness constraint</p>
                      </div>
                    </label>
                  </div>

                  {/* Partial Index (WHERE clause) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Partial Index (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.where || ''}
                      onChange={(e) => setFormData({ ...formData, where: e.target.value })}
                      placeholder="e.g., status = 'active'"
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                    />
                    <p className="text-xs text-foreground/40 font-mono mt-1">
                      PostgreSQL only: Index only rows matching this condition
                    </p>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={formData.comment || ''}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Why this index exists..."
                      rows={2}
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono resize-none"
                    />
                  </div>

                  {/* Validation Error */}
                  {validationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600 dark:text-red-400 font-mono flex-1 break-words">
                          {validationError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation Warning */}
                  {validationWarning && !validationError && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 font-mono flex-1 break-words leading-relaxed">
                          {validationWarning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 rounded-lg transition-all font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveIndex}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all font-mono active:scale-95"
                    >
                      {isAddingNew ? 'Add Index' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/5 flex flex-col gap-2">
              {/* Validation Error for Save All */}
              {validationError && !isAddingNew && !editingIndex && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono flex-1 break-words">
                      {validationError}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3">
                {!isAddingNew && !editingIndex ? (
                  <>
                    <button
                      onClick={handleAddNew}
                      className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all font-mono flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Index
                    </button>
                    <button
                      onClick={handleSaveAll}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono active:scale-95"
                    >
                      Save All Changes
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-foreground/40 font-mono">
                    Finish editing the current index first, then save all changes
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Warning */}
      <ConfirmDialog
        isOpen={showUnsavedWarning}
        title="Unsaved Changes"
        message="You have unsaved index changes. Close without saving?"
        confirmLabel="Close Without Saving"
        cancelLabel="Keep Editing"
        confirmVariant="danger"
        onConfirm={handleConfirmClose}
        onCancel={() => setShowUnsavedWarning(false)}
      />
    </>
  );
}

