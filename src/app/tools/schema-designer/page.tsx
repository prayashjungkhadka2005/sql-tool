/**
 * Schema Designer Page
 * Visual database design tool with ERD diagram
 */

"use client";

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SchemaState, SchemaTable, SchemaColumn, SchemaTemplate } from '@/features/schema-designer/types';
import SchemaCanvas from '@/features/schema-designer/components/SchemaCanvas';
import ColumnEditor from '@/features/schema-designer/components/ColumnEditor';
import ExportModal from '@/features/schema-designer/components/ExportModal';
import { SCHEMA_TEMPLATES } from '@/features/schema-designer/data/schema-templates';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';
import InputDialog from '@/features/sql-builder/components/ui/InputDialog';

export default function SchemaDesignerPage() {
  const [schema, setSchema] = useState<SchemaState>({
    name: 'My Database',
    tables: [],
    relationships: [], // Deprecated: kept for backward compatibility
  });

  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{
    table: SchemaTable;
    column: SchemaColumn | null;
  } | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

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

  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Add new table
  const handleAddTable = useCallback(() => {
    // Find unique table name
    let tableName = `table_${schema.tables.length + 1}`;
    let counter = schema.tables.length + 1;
    while (schema.tables.some(t => t.name === tableName)) {
      counter++;
      tableName = `table_${counter}`;
    }

    // Generate unique IDs to prevent collision
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);

    const newTable: SchemaTable = {
      id: `table-${timestamp}-${random}`,
      name: tableName,
      columns: [
        {
          id: `col-${timestamp}-${random}`,
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          unique: false,
          primaryKey: true,
          autoIncrement: true,
        },
      ],
      position: { 
        x: 100 + (schema.tables.length * 50), 
        y: 100 + (schema.tables.length * 50) 
      },
    };

    setSchema(prev => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));
  }, [schema.tables]);

  // Edit table name
  const handleEditTable = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setInputDialog({
      isOpen: true,
      title: 'Rename Table',
      message: 'Enter new table name:',
      defaultValue: table.name,
      onConfirm: (newName: string) => {
        // Validate: no duplicates
        if (schema.tables.some(t => t.id !== tableId && t.name.toLowerCase() === newName.toLowerCase())) {
          setAlertDialog({
            isOpen: true,
            title: 'Duplicate Table Name',
            message: `Table "${newName}" already exists. Choose a different name.`,
          });
          return;
        }

        // Validate: proper naming
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
          setAlertDialog({
            isOpen: true,
            title: 'Invalid Table Name',
            message: 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores.',
          });
          return;
        }

        // Validate: max length (for UI and DB compatibility)
        if (newName.length > 64) {
          setAlertDialog({
            isOpen: true,
            title: 'Table Name Too Long',
            message: 'Table name must be 64 characters or less.',
          });
          return;
        }

        // Update table name AND all foreign key references
        const oldName = table.name;
        const newNameLower = newName.toLowerCase();
        
        const updatedTables = schema.tables.map(t => {
          if (t.id === tableId) {
            // Rename this table
            return { ...t, name: newNameLower };
          } else {
            // Update FK references in other tables
            const updatedColumns = t.columns.map(col => {
              if (col.references && col.references.table === oldName) {
                return {
                  ...col,
                  references: {
                    ...col.references,
                    table: newNameLower, // Update FK reference!
                  },
                };
              }
              return col;
            });
          return { ...t, columns: updatedColumns };
        }
      });

        setSchema({
          ...schema,
          tables: updatedTables,
          // relationships are auto-generated from FK columns, no manual update needed
        });

        setInputDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema]);

  // Add column to table
  const handleAddColumn = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setEditingColumn({
      table,
      column: null, // null = adding new column
    });
    setIsColumnEditorOpen(true);
  }, [schema.tables]);

  // Edit specific column
  const handleEditColumn = useCallback((tableId: string, columnId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    const column = table.columns.find(c => c.id === columnId);
    if (!column) return;

    setEditingColumn({
      table,
      column,
    });
    setIsColumnEditorOpen(true);
  }, [schema.tables]);

  // Save column (add or update)
  const handleSaveColumn = useCallback((column: SchemaColumn) => {
    if (!editingColumn) return;

    setSchema(prev => {
      const updatedTables = prev.tables.map(table => {
        if (table.id === editingColumn.table.id) {
          // Check if editing existing column or adding new
          const existingIndex = table.columns.findIndex(c => c.id === column.id);
          
          if (existingIndex >= 0) {
            // Update existing column
            const updatedColumns = [...table.columns];
            updatedColumns[existingIndex] = column;
            return { ...table, columns: updatedColumns };
          } else {
            // Add new column
            return { ...table, columns: [...table.columns, column] };
          }
        }
        return table;
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    setIsColumnEditorOpen(false);
    setEditingColumn(null);
  }, [editingColumn]);

  // Delete column
  const handleDeleteColumn = useCallback((columnId: string) => {
    if (!editingColumn) return;

    setSchema(prev => {
      // Find the column being deleted
      const deletedColumn = editingColumn.table.columns.find(c => c.id === columnId);
      if (!deletedColumn) return prev;

      const deletedColumnName = deletedColumn.name;
      const deletedTableName = editingColumn.table.name;

      const updatedTables = prev.tables.map(table => {
        if (table.id === editingColumn.table.id) {
          // Remove column from this table
          return {
            ...table,
            columns: table.columns.filter(c => c.id !== columnId),
          };
        } else {
          // Clean up FK references in other tables pointing to this column
          const updatedColumns = table.columns.map(col => {
            if (col.references && 
                col.references.table === deletedTableName && 
                col.references.column === deletedColumnName) {
              // Remove FK reference (column stays, reference cleared)
              const { references, ...columnWithoutRef } = col;
              return columnWithoutRef;
            }
            return col;
          });
          return { ...table, columns: updatedColumns };
        }
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });
  }, [editingColumn]);

  // Load template
  const handleLoadTemplate = useCallback((template: SchemaTemplate) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Load Template?',
      message: `Load "${template.name}" template?\n\nThis will replace your current schema.`,
      onConfirm: () => {
        // Close any open editors to prevent state conflicts
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        
        setSchema(template.schema);
        setIsTemplatesOpen(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // Delete table (with confirmation)
  const handleDeleteTable = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    // Count FK references TO this table (from other tables)
    const incomingFKCount = schema.tables.reduce((count, t) => {
      if (t.id === tableId) return count;
      return count + t.columns.filter(col => 
        col.references && col.references.table === table.name
      ).length;
    }, 0);

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Table?',
      message: `Delete table "${table.name}"?${incomingFKCount > 0 ? `\n\nThis table is referenced by ${incomingFKCount} foreign key${incomingFKCount > 1 ? 's' : ''} in other tables. These FK references will be removed.` : ''}\n\nThis action cannot be undone.`,
      onConfirm: () => {
        // Close editor if this table is being edited
        if (editingColumn?.table.id === tableId) {
          setIsColumnEditorOpen(false);
          setEditingColumn(null);
        }

        // Remove table AND clean up all FK references to it
        const deletedTableName = table.name;
        
        const updatedTables = schema.tables
          .filter(t => t.id !== tableId) // Remove the table
          .map(t => {
            // Clean up FK references in remaining tables
            const updatedColumns = t.columns.map(col => {
              if (col.references && col.references.table === deletedTableName) {
                // Remove FK reference (column stays, but reference is cleared)
                const { references, ...columnWithoutRef } = col;
                return columnWithoutRef;
              }
              return col;
            });
            return { ...t, columns: updatedColumns };
          });

        setSchema({
          ...schema,
          tables: updatedTables,
        });
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema, editingColumn]);

  // Reset schema
  const handleReset = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Schema?',
      message: 'This will delete all tables and start fresh.\n\nThis action cannot be undone.',
      onConfirm: () => {
        // Close any open editors to prevent state conflicts
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        
        setSchema({
          name: 'My Database',
          tables: [],
          relationships: [], // Deprecated: kept for backward compatibility
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-mono mb-2">
              Schema Designer
            </h1>
            <p className="text-sm text-foreground/60 font-mono">
              → visual database design • drag & drop • export to code
            </p>
          </div>

          <div className="flex items-center gap-2">
            {schema.tables.length > 0 && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-red-600 hover:bg-red-500/10 border border-foreground/10 hover:border-red-500/20 rounded-lg transition-all font-mono flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset
              </button>
            )}
            
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={schema.tables.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title={schema.tables.length === 0 ? 'Add tables to enable export' : 'Export schema to SQL, Prisma, or JSON'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddTable}
            className="px-4 py-2 text-sm font-medium bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 border border-foreground/10 text-foreground rounded-lg transition-all flex items-center gap-2 font-mono active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Table
          </button>

          <button
            onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
            className="px-4 py-2 text-sm font-medium bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground rounded-lg transition-all flex items-center gap-2 font-mono"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
            </svg>
            Templates
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {schema.tables.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-xs font-mono text-foreground/60">
              <span className="px-2 py-1 bg-foreground/10 rounded">
                {schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-1 bg-foreground/10 rounded">
                {schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} column{schema.tables.reduce((sum, t) => sum + t.columns.length, 0) !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {isTemplatesOpen && (
        <div className="mb-6 p-5 sm:p-6 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Schema Templates
            </h3>
            <button
              onClick={() => setIsTemplatesOpen(false)}
              className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
              title="Close templates"
              aria-label="Close templates"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCHEMA_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleLoadTemplate(template)}
                className="group p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 active:scale-95 active:bg-foreground/10 rounded transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded border border-foreground/10 flex items-center justify-center text-foreground/60">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground font-mono truncate">
                      {template.name}
                    </h4>
                    <p className="text-[10px] text-foreground/40 font-mono">
                      {template.schema.tables.length} tables • {template.difficulty}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-foreground/60 font-mono leading-relaxed">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      {schema.tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
          <div className="mb-6 p-8 bg-foreground/5 rounded-full">
            <svg className="w-16 h-16 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2 font-mono">
            Start Designing Your Database
          </h3>
          <p className="text-sm text-foreground/60 font-mono mb-6 max-w-md">
            Click &quot;Add Table&quot; to create your first table or choose a template to get started quickly.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddTable}
              className="px-6 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all flex items-center gap-2 font-mono active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Table
            </button>
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="px-6 py-3 text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all flex items-center gap-2 font-mono"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
              </svg>
              Use Template
            </button>
          </div>
        </div>
      ) : (
        <ReactFlowProvider>
          <SchemaCanvas
            schema={schema}
            onSchemaChange={setSchema}
            onEditTable={handleEditTable}
            onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteTable={handleDeleteTable}
          />
        </ReactFlowProvider>
      )}

      {/* Help Tips */}
      {schema.tables.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-1 font-mono">Quick Tips</h4>
              <ul className="text-xs text-foreground/70 font-mono space-y-1 leading-relaxed">
                <li>→ Drag tables to reposition them on canvas</li>
                <li>→ Click on any column to edit it, or use &quot;Add Column&quot; button</li>
                <li>→ Click &quot;Edit&quot; button in table header to rename table</li>
                <li>→ Drag from one table to another to create relationships</li>
                <li>→ Scroll normally to navigate page (works over canvas too)</li>
                <li>→ Use zoom buttons (bottom-left) or pinch to zoom in/out</li>
                <li>→ Click &quot;Export&quot; to generate SQL, Prisma, or JSON</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Column Editor Drawer */}
      {editingColumn && (
        <ColumnEditor
          isOpen={isColumnEditorOpen}
          column={editingColumn.column}
          tableName={editingColumn.table.name}
          allTables={schema.tables}
          onSave={handleSaveColumn}
          onClose={() => {
            setIsColumnEditorOpen(false);
            setEditingColumn(null);
          }}
          onDelete={editingColumn.column ? handleDeleteColumn : undefined}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        schema={schema}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Input Dialog (for table rename) */}
      <InputDialog
        isOpen={inputDialog.isOpen}
        title={inputDialog.title}
        message={inputDialog.message}
        defaultValue={inputDialog.defaultValue}
        placeholder="e.g., users"
        confirmLabel="Save"
        cancelLabel="Cancel"
        onConfirm={inputDialog.onConfirm}
        onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Alert Dialog (for validation errors) */}
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmLabel="OK"
        cancelLabel=""
        confirmVariant="primary"
        onConfirm={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}

