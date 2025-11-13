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
  // Integers (most common first)
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  // Strings (most common first)
  'VARCHAR',
  'TEXT',
  'CHAR',
  // Numbers
  'DECIMAL',
  'FLOAT',
  'DOUBLE',
  'REAL',
  // Date/Time
  'DATE',
  'TIME',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  // Boolean
  'BOOLEAN',
  // Binary
  'BYTEA',
  'BLOB',
  // JSON (modern apps)
  'JSON',
  'JSONB',
  // PostgreSQL specific
  'UUID',
  'INET',
  'CIDR',
  'ARRAY',
  'TSVECTOR',
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
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmVariant: 'primary',
    onConfirm: () => {},
  });

  // Initialize form when column changes
  useEffect(() => {
    if (column) {
      setFormData(column);
    } else {
      // Reset for new column - generate unique ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      setFormData({
        id: `col-${timestamp}-${random}`,
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
    // Clear validation error when column changes
    setValidationError(null);
  }, [column, isOpen]); // Reset when drawer opens/closes

  // Clear validation error when form data changes (real-time feedback)
  useEffect(() => {
    if (validationError) {
      setValidationError(null);
    }
  }, [formData.primaryKey, formData.autoIncrement, formData.type, formData.name]);

  // Auto-disable AUTO_INCREMENT when composite PK is detected
  useEffect(() => {
    if (!formData.primaryKey || !formData.autoIncrement) return;
    
    const currentTable = allTables.find(t => t.name === tableName);
    const otherPKColumns = currentTable?.columns.filter(
      c => c.id !== (column?.id || formData.id) && c.primaryKey
    ) || [];
    
    // If this is a composite PK, auto-disable AUTO_INCREMENT
    if (otherPKColumns.length > 0) {
      setFormData(prev => ({ ...prev, autoIncrement: false }));
    }
  }, [formData.primaryKey, allTables, tableName, column, formData.id]);

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

    // Validation 5: VARCHAR and CHAR need length
    if ((formData.type === 'VARCHAR' || formData.type === 'CHAR') && (!formData.length || formData.length <= 0)) {
      setValidationError(`${formData.type} type requires a length (e.g., 255 for VARCHAR, 10 for CHAR)`);
      return;
    }

    // Validation 5b: VARCHAR/CHAR length limits
    if (formData.type === 'VARCHAR' && formData.length) {
      if (formData.length < 1 || formData.length > 65535) {
        setValidationError('VARCHAR length must be between 1 and 65,535 characters');
        return;
      }
    }
    
    if (formData.type === 'CHAR' && formData.length) {
      if (formData.length < 1 || formData.length > 255) {
        setValidationError('CHAR length must be between 1 and 255 characters. Use VARCHAR or TEXT for longer strings.');
        return;
      }
    }

    // Validation 6: DECIMAL needs precision and scale validation
    if (formData.type === 'DECIMAL') {
      if (!formData.precision || formData.precision <= 0 || formData.precision > 65) {
        setValidationError('DECIMAL precision must be between 1 and 65');
        return;
      }
      if (formData.scale !== undefined) {
        if (formData.scale < 0 || formData.scale > 30 || formData.scale > formData.precision) {
          setValidationError(`DECIMAL scale must be between 0 and ${formData.precision} (cannot exceed precision)`);
          return;
        }
      }
    }

    // Validation 7: AUTO INCREMENT only for integer types
    const AUTO_INCREMENT_TYPES = ['SMALLINT', 'INTEGER', 'BIGINT'];
    if (formData.autoIncrement && !AUTO_INCREMENT_TYPES.includes(formData.type)) {
      setValidationError('AUTO INCREMENT is only valid for integer types (SMALLINT, INTEGER, BIGINT)');
      return;
    }

    // Validation 8: Check AUTO_INCREMENT constraints
    const currentTable = allTables.find(t => t.name === tableName);
    const otherPKColumns = currentTable?.columns.filter(
      c => c.id !== formData.id && c.primaryKey
    ) || [];
    
    if (formData.autoIncrement) {
      // Only one AUTO INCREMENT per table
      const hasOtherAutoIncrement = currentTable?.columns.some(
        c => c.id !== formData.id && c.autoIncrement
      );
      
      if (hasOtherAutoIncrement) {
        setValidationError('A table can have only one AUTO INCREMENT column');
        return;
      }

      // AUTO INCREMENT not allowed with composite PK
      if (otherPKColumns.length > 0 && formData.primaryKey) {
        setValidationError('AUTO INCREMENT cannot be used with composite primary keys');
        return;
      }
    }

    // Validation 9: Composite PK cannot have AUTO_INCREMENT (reverse check)
    if (formData.primaryKey && otherPKColumns.length > 0) {
      // Check if any other PK column has AUTO_INCREMENT
      const hasAutoIncrementPK = otherPKColumns.some(c => c.autoIncrement);
      if (hasAutoIncrementPK) {
        setValidationError('Cannot add to composite primary key when an AUTO INCREMENT column exists');
        return;
      }
    }

    // Validation 10: Column name max length (for UI and DB compatibility)
    if (formData.name.length > 64) {
      setValidationError('Column name must be 64 characters or less');
      return;
    }

    // Validation 11: Foreign key must reference existing table/column
    if (formData.references) {
      // Check for self-reference
      if (formData.references.table === tableName) {
        setConfirmDialog({
          isOpen: true,
          title: 'Self-Referencing Table?',
          message: `This will create a self-referencing foreign key (table references itself).\n\nCommon for hierarchical data like:\n• Employee → Manager (same table)\n• Category → Parent Category\n• Comment → Reply To\n\nDo you want to continue?`,
          confirmLabel: 'Allow Self-Reference',
          cancelLabel: 'Cancel',
          confirmVariant: 'primary',
          onConfirm: () => {
            setValidationError(null);
            onSave(formData);
            onClose();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          },
        });
        return;
      }

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

      // Check: Cannot reference the same column (self-reference within same column is meaningless)
      if (formData.references.table === tableName && formData.references.column === formData.name) {
        setValidationError('Column cannot reference itself');
        return;
      }

      // Check: Data type compatibility (FK and referenced column should have compatible types)
      const COMPATIBLE_TYPES = {
        numeric: ['SMALLINT', 'INTEGER', 'BIGINT'],
        float: ['FLOAT', 'DOUBLE', 'REAL'],
        decimal: ['DECIMAL'],
        string: ['VARCHAR', 'TEXT', 'CHAR'],
        date: ['DATE'],
        time: ['TIME'],
        timestamp: ['TIMESTAMP', 'TIMESTAMPTZ'],
        boolean: ['BOOLEAN'],
        uuid: ['UUID'],
        json: ['JSON', 'JSONB'],
        binary: ['BYTEA', 'BLOB'],
        network: ['INET', 'CIDR'],
        array: ['ARRAY'],
        tsvector: ['TSVECTOR'],
      };

      let isCompatible = formData.type === refColumn.type;
      
      // Check if both types are in the same compatibility group
      if (!isCompatible) {
        for (const group of Object.values(COMPATIBLE_TYPES)) {
          if (group.includes(formData.type) && group.includes(refColumn.type)) {
            isCompatible = true;
            break;
          }
        }
      }

      if (!isCompatible) {
        setValidationError(`Data type mismatch: ${formData.type} cannot reference ${refColumn.type}. Foreign key and referenced column must have compatible types.`);
        return;
      }

      // Warning: FK should reference primary key or unique column
      if (!refColumn.primaryKey && !refColumn.unique) {
        // Show warning dialog but allow save
        setConfirmDialog({
          isOpen: true,
          title: 'Non-Unique Reference',
          message: `Column "${formData.references.table}.${formData.references.column}" is not a primary key or unique column.\n\nForeign keys should typically reference primary keys or unique columns for data integrity.\n\nDo you want to continue anyway?`,
          confirmLabel: 'Save Anyway',
          cancelLabel: 'Cancel',
          confirmVariant: 'primary',
          onConfirm: () => {
            setValidationError(null);
            onSave(formData);
            onClose();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          },
        });
        return;
      }
    }

    // Clear validation error
    setValidationError(null);
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (column && onDelete) {
      // Check if this column is referenced by other tables
      const referencingColumns = allTables.flatMap(t => 
        t.columns.filter(c => 
          c.references?.table === tableName && c.references?.column === column.name
        ).map(c => ({ table: t.name, column: c.name }))
      );
      
      setConfirmDialog({
        isOpen: true,
        title: 'Delete Column?',
        message: `Delete column "${column.name}"?${referencingColumns.length > 0 ? `\n\nThis column is referenced by ${referencingColumns.length} foreign key${referencingColumns.length !== 1 ? 's' : ''} in other tables. These references will be removed.` : ''}\n\nThis action cannot be undone.`,
        confirmLabel: 'Delete Column',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="column-editor-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <h3 id="column-editor-title" className="text-lg font-semibold text-foreground font-mono">
                  {isEditing ? 'Edit Column' : 'Add Column'}
                </h3>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">
                  {tableName} <span className="text-foreground/30">• Press <kbd className="px-1 py-0.5 bg-foreground/10 rounded text-[9px]">Esc</kbd> to close</span>
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
                  onChange={(e) => {
                    const newType = e.target.value as SQLDataType;
                    const AUTO_INCREMENT_TYPES = ['SMALLINT', 'INTEGER', 'BIGINT'];
                    
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      // Auto-disable AUTO_INCREMENT if type is not integer-based
                      autoIncrement: AUTO_INCREMENT_TYPES.includes(newType) ? formData.autoIncrement : false,
                      // Set default length for VARCHAR/CHAR
                      length: newType === 'VARCHAR' ? (formData.length || 255) : 
                              newType === 'CHAR' ? (formData.length || 10) :
                              undefined,
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                >
                  {DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formData.autoIncrement && !['SMALLINT', 'INTEGER', 'BIGINT'].includes(formData.type) && (
                  <div className="flex items-center gap-1.5 mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                      AUTO_INCREMENT was disabled (only valid for integer types)
                    </p>
                  </div>
                )}
              </div>

              {/* Length (for VARCHAR and CHAR) */}
              {(formData.type === 'VARCHAR' || formData.type === 'CHAR') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-mono">
                    Length <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.length || (formData.type === 'VARCHAR' ? 255 : 10)}
                    onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || (formData.type === 'VARCHAR' ? 255 : 10) })}
                    min="1"
                    max={formData.type === 'VARCHAR' ? 65535 : 255}
                    className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                  />
                  <p className="text-xs text-foreground/40 font-mono mt-1">
                    {formData.type === 'VARCHAR' ? 'Max 65,535 characters' : 'Max 255 characters (use VARCHAR or TEXT for longer strings)'}
                  </p>
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
                
                {/* Composite PK Info */}
                {(() => {
                  const currentTable = allTables.find(t => t.name === tableName);
                  const otherPKColumns = currentTable?.columns.filter(
                    c => c.id !== (column?.id || formData.id) && c.primaryKey
                  ) || [];
                  
                  // Only show if this column IS a PK AND there are other PK columns
                  if (formData.primaryKey && otherPKColumns.length > 0) {
                    return (
                      <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 font-mono">
                              Composite Primary Key
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 font-mono mt-1">
                              Columns: {[...otherPKColumns.map(c => c.name), formData.name].sort().join(', ')}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 font-mono mt-1">
                              Multiple columns form a single primary key. AUTO_INCREMENT is not available.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.primaryKey}
                      onChange={(e) => {
                        const currentTable = allTables.find(t => t.name === tableName);
                        const otherPKColumns = currentTable?.columns.filter(
                          c => c.id !== (column?.id || formData.id) && c.primaryKey
                        ) || [];
                        
                        // If checking PK and other PKs exist (composite), auto-disable AUTO_INCREMENT
                        const willBeCompositePK = e.target.checked && otherPKColumns.length > 0;
                        
                        setFormData({ 
                          ...formData, 
                          primaryKey: e.target.checked,
                          nullable: e.target.checked ? false : formData.nullable, // PK can't be null
                          unique: e.target.checked ? true : formData.unique, // PK is always unique
                          autoIncrement: willBeCompositePK ? false : formData.autoIncrement, // Clear AI for composite
                        });
                      }}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground font-mono">Primary Key</div>
                      <div className="text-xs text-foreground/50 font-mono">
                        {(() => {
                          const currentTable = allTables.find(t => t.name === tableName);
                          const otherPKColumns = currentTable?.columns.filter(
                            c => c.id !== (column?.id || formData.id) && c.primaryKey
                          ) || [];
                          return otherPKColumns.length > 0 
                            ? 'Part of composite primary key' 
                            : 'Unique identifier for rows';
                        })()}
                      </div>
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

                  {['SMALLINT', 'INTEGER', 'BIGINT'].includes(formData.type) && (() => {
                    const currentTable = allTables.find(t => t.name === tableName);
                    const otherPKColumns = currentTable?.columns.filter(
                      c => c.id !== (column?.id || formData.id) && c.primaryKey
                    ) || [];
                    const isCompositePK = otherPKColumns.length > 0 && formData.primaryKey;
                    
                    return (
                      <label className="flex items-center gap-3 p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded hover:bg-foreground/5 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.autoIncrement}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            autoIncrement: e.target.checked,
                            nullable: e.target.checked ? false : formData.nullable, // AI requires NOT NULL
                          })}
                          disabled={isCompositePK}
                          className="w-4 h-4 text-primary disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground font-mono">AUTO INCREMENT</div>
                          <div className="text-xs text-foreground/50 font-mono">
                            {isCompositePK ? 'Not available (composite PK)' : 'Automatically increments (forces NOT NULL)'}
                          </div>
                        </div>
                      </label>
                    );
                  })()}
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
                {allTables.filter(t => t.name !== tableName).length === 0 ? (
                  <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-mono">
                      No other tables available. Create another table first to add foreign key references.
                    </p>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 mb-3 p-2.5 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded cursor-pointer hover:bg-foreground/5">
                    <input
                      type="checkbox"
                      checked={!!formData.references}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const otherTables = allTables.filter(t => t.name !== tableName);
                          const firstTable = otherTables[0];
                          setFormData({
                            ...formData,
                            references: {
                              table: firstTable?.name || '',
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
                )}

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
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400 font-mono flex-1 break-words">
                      {validationError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between gap-3">
              {isEditing && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-mono active:scale-95"
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
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 rounded-lg transition-all font-mono active:scale-95"
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
        confirmLabel={confirmDialog.confirmLabel || "Confirm"}
        cancelLabel={confirmDialog.cancelLabel || "Cancel"}
        confirmVariant={confirmDialog.confirmVariant || "danger"}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

