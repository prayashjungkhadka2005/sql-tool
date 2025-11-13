/**
 * Column Editor Drawer
 * Slide-in panel for adding/editing table columns
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaColumn, SQLDataType, CascadeAction, SchemaTable } from '../types';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';

interface ColumnEditorProps {
  isOpen: boolean;
  column: SchemaColumn | null;
  tableName: string;
  allTables: SchemaTable[];
  onSave: (column: SchemaColumn) => void;
  onClose: () => void;
  onDelete?: (columnId: string) => void;
}

const DATA_TYPES: SQLDataType[] = [
  'INTEGER',
  'VARCHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'DECIMAL',
  'FLOAT',
];

const CASCADE_ACTIONS: CascadeAction[] = [
  'CASCADE',
  'SET NULL',
  'RESTRICT',
  'NO ACTION',
];

export default function ColumnEditor({
  isOpen,
  column,
  tableName,
  allTables,
  onSave,
  onClose,
  onDelete,
}: ColumnEditorProps) {
  const isEditing = column !== null;

  // Form state
  const [formData, setFormData] = useState<SchemaColumn>({
    id: '',
    name: '',
    type: 'VARCHAR',
    length: 255,
    nullable: true,
    unique: false,
    primaryKey: false,
    autoIncrement: false,
    defaultValue: '',
  });

  // Validation error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initialize form when column changes
  useEffect(() => {
    if (column) {
      setFormData(column);
    } else {
      // Reset for new column
      setFormData({
        id: Date.now().toString(),
        name: '',
        type: 'VARCHAR',
        length: 255,
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: '',
      });
    }
  }, [column]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation 1: Empty name
    if (!formData.name || formData.name.trim() === '') {
      setValidationError('Column name is required');
      return;
    }

    // Validation 2: SQL keywords
    const SQL_KEYWORDS = [
      'select', 'from', 'where', 'and', 'or', 'not', 'in', 'like', 'between',
      'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'drop',
      'join', 'inner', 'left', 'right', 'on', 'group', 'by', 'having', 'order',
      'asc', 'desc', 'limit', 'offset', 'distinct', 'as', 'is', 'null', 'table'
    ];
    
    if (SQL_KEYWORDS.includes(formData.name.toLowerCase())) {
      setValidationError(`"${formData.name}" is a SQL keyword. Use a different name like "${formData.name}_col"`);
      return;
    }

    // Validation 3: Special characters (only letters, numbers, underscore allowed)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      setValidationError('Column name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return;
    }

    // Validation 4: Duplicate column name (if this table has other columns)
    const otherColumns = column 
      ? allTables.find(t => t.name === tableName)?.columns.filter(c => c.id !== column.id) || []
      : allTables.find(t => t.name === tableName)?.columns || [];
    
    if (otherColumns.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      setValidationError(`Column "${formData.name}" already exists in this table. Use a different name.`);
      return;
    }

    // Validation 5: VARCHAR needs length
    if (formData.type === 'VARCHAR' && (!formData.length || formData.length <= 0)) {
      setValidationError('VARCHAR type requires a length (e.g., 255)');
      return;
    }

    // Validation 6: DECIMAL needs precision
    if (formData.type === 'DECIMAL' && (!formData.precision || formData.precision <= 0)) {
      setValidationError('DECIMAL type requires precision (e.g., 10,2)');
      return;
    }

    // Validation 7: AUTO INCREMENT only for INTEGER
    if (formData.autoIncrement && formData.type !== 'INTEGER') {
      setValidationError('AUTO INCREMENT is only valid for INTEGER type');
      return;
    }

    // Validation 8: Foreign key must reference existing table/column
    if (formData.references) {
      const refTable = allTables.find(t => t.name === formData.references?.table);
      if (!refTable) {
        setValidationError(`Referenced table "${formData.references.table}" does not exist`);
        return;
      }
      
      const refColumn = refTable.columns.find(c => c.name === formData.references?.column);
      if (!refColumn) {
        setValidationError(`Referenced column "${formData.references.table}.${formData.references.column}" does not exist`);
        return;
      }

      // Warning: FK should reference primary key or unique column
      if (!refColumn.primaryKey && !refColumn.unique) {
        // Just a warning, don't block save
        console.warn(`FK references non-unique column: ${formData.references.table}.${formData.references.column}`);
      }
    }

    // Clear validation error
    setValidationError(null);
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (column && onDelete) {
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Column?',
        message: `Delete column "${column.name}"?\n\nThis action cannot be undone.`,
        onConfirm: () => {
          onDelete(column.id);
          onClose();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    }
  };

  return (
    <>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white dark:bg-[#1a1a1a] border-l border-foreground/10 z-[91] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground font-mono">
                  {isEditing ? 'Edit Column' : 'Add Column'}
                </h3>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">
                  {tableName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Column Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                  Column Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., user_id"
                  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                  required
                  autoFocus
                />
              </div>

              {/* Data Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                  Data Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SQLDataType })}
                  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                >
                  {DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Length (for VARCHAR) */}
              {formData.type === 'VARCHAR' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                    Length
                  </label>
                  <input
                    type="number"
                    value={formData.length || 255}
                    onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 255 })}
                    min="1"
                    max="65535"
                    className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                  />
                </div>
              )}

              {/* Precision & Scale (for DECIMAL) */}
              {formData.type === 'DECIMAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Precision
                    </label>
                    <input
                      type="number"
                      value={formData.precision || 10}
                      onChange={(e) => setFormData({ ...formData, precision: parseInt(e.target.value) || 10 })}
                      min="1"
                      max="65"
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                      Scale
                    </label>
                    <input
                      type="number"
                      value={formData.scale || 2}
                      onChange={(e) => setFormData({ ...formData, scale: parseInt(e.target.value) || 2 })}
                      min="0"
                      max="30"
                      className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Constraints */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3 font-mono">
                  Constraints
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primaryKey}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        primaryKey: e.target.checked,
                        nullable: e.target.checked ? false : formData.nullable, // PK can't be null
                        unique: e.target.checked ? true : formData.unique, // PK is always unique
                      })}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground font-mono">Primary Key</div>
                      <div className="text-xs text-foreground/50 font-mono">Unique identifier for rows</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!formData.nullable}
                      onChange={(e) => setFormData({ ...formData, nullable: !e.target.checked })}
                      disabled={formData.primaryKey || formData.autoIncrement}
                      className="w-4 h-4 text-primary disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground font-mono">NOT NULL</div>
                      <div className="text-xs text-foreground/50 font-mono">
                        {formData.primaryKey || formData.autoIncrement ? 'Required (PK/AI)' : 'Value required'}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.unique}
                      onChange={(e) => setFormData({ ...formData, unique: e.target.checked })}
                      disabled={formData.primaryKey}
                      className="w-4 h-4 text-primary disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground font-mono">UNIQUE</div>
                      <div className="text-xs text-foreground/50 font-mono">No duplicate values</div>
                    </div>
                  </label>

                  {formData.type === 'INTEGER' && (
                    <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoIncrement}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          autoIncrement: e.target.checked,
                          nullable: e.target.checked ? false : formData.nullable, // AI requires NOT NULL
                        })}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground font-mono">AUTO INCREMENT</div>
                        <div className="text-xs text-foreground/50 font-mono">Automatically increments (forces NOT NULL)</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Default Value */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                  Default Value
                </label>
                <input
                  type="text"
                  value={formData.defaultValue || ''}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  placeholder="e.g., 'active' or 0 or NOW()"
                  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                  disabled={formData.autoIncrement}
                />
                <p className="text-xs text-foreground/40 font-mono mt-1">
                  Leave empty for NULL or use NOW() for current timestamp
                </p>
              </div>

              {/* Foreign Key Reference */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-mono flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Foreign Key Reference
                </label>

                {/* Enable/Disable FK */}
                <label className="flex items-center gap-2 mb-3 p-2.5 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded cursor-pointer hover:bg-foreground/5">
                  <input
                    type="checkbox"
                    checked={!!formData.references}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          references: {
                            table: allTables.filter(t => t.name !== tableName)[0]?.name || '',
                            column: 'id',
                            onDelete: 'CASCADE',
                            onUpdate: 'CASCADE',
                          },
                        });
                      } else {
                        setFormData({ ...formData, references: undefined });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-mono text-foreground">
                    This column references another table
                  </span>
                </label>

                {/* FK Configuration */}
                {formData.references && (
                  <div className="space-y-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                    {/* Reference Table */}
                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1.5 font-mono">
                        References Table
                      </label>
                      <select
                        value={formData.references.table}
                        onChange={(e) => setFormData({
                          ...formData,
                          references: formData.references ? {
                            ...formData.references,
                            table: e.target.value,
                          } : undefined,
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-foreground/10 rounded text-sm text-foreground focus:outline-none focus:border-primary/30 transition-all font-mono"
                      >
                        {allTables
                          .filter(t => t.name !== tableName)
                          .map(t => (
                            <option key={t.name} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Reference Column */}
                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1.5 font-mono">
                        References Column
                      </label>
                      <select
                        value={formData.references.column}
                        onChange={(e) => setFormData({
                          ...formData,
                          references: formData.references ? {
                            ...formData.references,
                            column: e.target.value,
                          } : undefined,
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-foreground/10 rounded text-sm text-foreground focus:outline-none focus:border-primary/30 transition-all font-mono"
                      >
                        {allTables
                          .find(t => t.name === formData.references?.table)
                          ?.columns.map(c => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.type})
                            </option>
                          )) || <option key="no-columns" value="">No columns</option>}
                      </select>
                    </div>

                    {/* ON DELETE */}
                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1.5 font-mono">
                        ON DELETE
                      </label>
                      <select
                        value={formData.references.onDelete || 'CASCADE'}
                        onChange={(e) => setFormData({
                          ...formData,
                          references: formData.references ? {
                            ...formData.references,
                            onDelete: e.target.value as CascadeAction,
                          } : undefined,
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-foreground/10 rounded text-sm text-foreground focus:outline-none focus:border-primary/30 transition-all font-mono"
                      >
                        {CASCADE_ACTIONS.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>

                    {/* ON UPDATE */}
                    <div>
                      <label className="block text-xs font-medium text-foreground/70 mb-1.5 font-mono">
                        ON UPDATE
                      </label>
                      <select
                        value={formData.references.onUpdate || 'CASCADE'}
                        onChange={(e) => setFormData({
                          ...formData,
                          references: formData.references ? {
                            ...formData.references,
                            onUpdate: e.target.value as CascadeAction,
                          } : undefined,
                        })}
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-foreground/10 rounded text-sm text-foreground focus:outline-none focus:border-primary/30 transition-all font-mono"
                      >
                        {CASCADE_ACTIONS.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                  Comment (Optional)
                </label>
                <textarea
                  value={formData.comment || ''}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Add a description for this column..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono resize-none"
                />
              </div>
            </form>

            {/* Validation Error */}
            {validationError && (
              <div className="px-6 pb-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                    {validationError}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between gap-3">
              {isEditing && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-mono"
                >
                  Delete Column
                </button>
              ) : (
                <div></div>
              )}
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 rounded-lg transition-all font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono active:scale-95"
                >
                  {isEditing ? 'Save Changes' : 'Add Column'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Confirm Dialog */}
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

