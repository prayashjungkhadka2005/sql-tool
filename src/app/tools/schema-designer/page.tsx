/**
 * Schema Designer Page
 * Visual database design tool with ERD diagram
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SchemaState, SchemaTable, SchemaColumn, SchemaTemplate, SchemaIndex } from '@/features/schema-designer/types';
import SchemaCanvas from '@/features/schema-designer/components/SchemaCanvas';
import ColumnEditor from '@/features/schema-designer/components/ColumnEditor';
import ExportModal from '@/features/schema-designer/components/ExportModal';
import IndexManager from '@/features/schema-designer/components/IndexManager';
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

  const [isIndexManagerOpen, setIsIndexManagerOpen] = useState(false);
  const [managingIndexTable, setManagingIndexTable] = useState<SchemaTable | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isOptimizingFKs, setIsOptimizingFKs] = useState(false);

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
      indexes: [], // Initialize empty indexes array
      position: { 
        x: 100 + ((schema.tables.length % 10) * 50),  // Wrap at 10 to prevent overflow
        y: 100 + (Math.floor(schema.tables.length / 10) * 150) 
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
        // Validate: empty name
        if (!newName || newName.trim() === '') {
          setAlertDialog({
            isOpen: true,
            title: 'Empty Table Name',
            message: 'Table name cannot be empty.',
          });
          return;
        }

        const trimmedName = newName.trim();

        // Validate: no duplicates
        if (schema.tables.some(t => t.id !== tableId && t.name.toLowerCase() === trimmedName.toLowerCase())) {
          setAlertDialog({
            isOpen: true,
            title: 'Duplicate Table Name',
            message: `Table "${trimmedName}" already exists. Choose a different name.`,
          });
          return;
        }

        // Validate: SQL reserved keywords
        const SQL_RESERVED = ['table', 'select', 'from', 'where', 'join', 'inner', 'outer', 'left', 'right', 'order', 'group', 'having', 'limit', 'offset', 'insert', 'update', 'delete', 'create', 'drop', 'alter', 'index', 'view', 'user', 'database', 'schema'];
        if (SQL_RESERVED.includes(trimmedName.toLowerCase())) {
          setAlertDialog({
            isOpen: true,
            title: 'Reserved Keyword',
            message: `"${trimmedName}" is a SQL reserved keyword. Use a different name like "${trimmedName}_table".`,
          });
          return;
        }

        // Validate: proper naming
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
          setAlertDialog({
            isOpen: true,
            title: 'Invalid Table Name',
            message: 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores.',
          });
          return;
        }

        // Validate: max length (for UI and DB compatibility)
        if (trimmedName.length > 64) {
          setAlertDialog({
            isOpen: true,
            title: 'Table Name Too Long',
            message: 'Table name must be 64 characters or less.',
          });
          return;
        }

        // Update table name AND all foreign key references
        const oldName = table.name;
        const newNameLower = trimmedName.toLowerCase();
        
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

  // Manage indexes for a table
  const handleManageIndexes = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setManagingIndexTable(table);
    setIsIndexManagerOpen(true);
  }, [schema.tables]);

  // Save indexes for a table
  const handleSaveIndexes = useCallback((indexes: SchemaIndex[]) => {
    if (!managingIndexTable) return;

    setSchema(prev => {
      const updatedTables = prev.tables.map(table => {
        if (table.id === managingIndexTable.id) {
          return { ...table, indexes };
        }
        return table;
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    setIsIndexManagerOpen(false);
    setManagingIndexTable(null);
  }, [managingIndexTable]);

  // Auto-create indexes for all foreign key columns
  const handleAutoIndexForeignKeys = useCallback(() => {
    // Prevent rapid clicks
    if (isOptimizingFKs) return;
    
    setIsOptimizingFKs(true);

    // Close any open editors to prevent state conflicts
    if (isIndexManagerOpen) {
      setIsIndexManagerOpen(false);
      setManagingIndexTable(null);
    }
    if (isColumnEditorOpen) {
      setIsColumnEditorOpen(false);
      setEditingColumn(null);
    }

    // Compute result inside setSchema to avoid closure issues
    const result = { indexesCreated: 0, errors: [] as string[] };

    setSchema(prev => {
      // Collect all existing index names globally to prevent collisions
      const allIndexNames = new Set<string>();
      prev.tables.forEach(t => {
        t.indexes?.forEach(idx => allIndexNames.add(idx.name));
      });

      const updatedTables = prev.tables.map(table => {
        // Find all FK columns in this table
        const fkColumns = table.columns.filter(col => col.references);
        
        if (fkColumns.length === 0) return table;

        // Get existing indexes for this table
        const existingIndexes = table.indexes || [];
        const newIndexes = [...existingIndexes];

        // Create index for each FK column that doesn't already have one
        fkColumns.forEach(col => {
          // Check if this column already has a dedicated single-column index
          const hasSingleIndex = existingIndexes.some(idx => 
            idx.columns.length === 1 && idx.columns[0] === col.name
          );

          // Check if column is the FIRST column in a composite index (leftmost prefix rule)
          const hasCompositeIndex = existingIndexes.some(idx => 
            idx.columns.length > 1 && idx.columns[0] === col.name
          );

          // Skip if already indexed (either single or leftmost in composite)
          if (hasSingleIndex || hasCompositeIndex) {
            return;
          }

          // Generate unique index name
          let indexName = `idx_${table.name}_${col.name}`;
          let nameCounter = 1;
          
          // Ensure global uniqueness
          while (allIndexNames.has(indexName)) {
            indexName = `idx_${table.name}_${col.name}_${nameCounter}`;
            nameCounter++;
          }

          // Validate index name length (max 64 characters for most databases)
          if (indexName.length > 64) {
            result.errors.push(`Cannot create index for ${table.name}.${col.name}: Name too long (${indexName.length} > 64 chars)`);
            return;
          }

          // Create index with unique ID to prevent collisions
          const timestamp = Date.now() + result.indexesCreated; // Add counter to ensure unique timestamps
          const random = Math.random().toString(36).substring(2, 9);
          const newIndex = {
            id: `idx-${timestamp}-${random}`,
            name: indexName,
            columns: [col.name],
            type: 'BTREE' as const,
            unique: false,
            comment: 'Auto-created for foreign key performance',
          };

          newIndexes.push(newIndex);
          allIndexNames.add(indexName); // Track for collision detection
          result.indexesCreated++;
        });

        return { ...table, indexes: newIndexes };
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    // Show result message using queueMicrotask for better performance
    queueMicrotask(() => {
      setIsOptimizingFKs(false); // Re-enable button
      
      if (result.errors.length > 0) {
        setAlertDialog({
          isOpen: true,
          title: '⚠️ Partial Success',
          message: `Created ${result.indexesCreated} index${result.indexesCreated !== 1 ? 'es' : ''} successfully, but encountered ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}:\n\n${result.errors.join('\n')}\n\nThese indexes need to be created manually using the "Indexes" button on each table.`,
        });
      } else if (result.indexesCreated > 0) {
        setAlertDialog({
          isOpen: true,
          title: '✅ Indexes Created Successfully!',
          message: `Created ${result.indexesCreated} index${result.indexesCreated !== 1 ? 'es' : ''} for foreign key columns.\n\n${result.indexesCreated === 1 ? 'This index optimizes' : 'These indexes optimize'} JOIN query performance.\n\nClick "Export" to see the CREATE INDEX statements in your schema.`,
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: '✅ Already Optimized!',
          message: 'All foreign key columns already have indexes.\n\nYour schema follows performance best practices. No action needed!',
        });
      }
    });
  }, [isOptimizingFKs, isIndexManagerOpen, isColumnEditorOpen]);

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
            const oldColumn = table.columns[existingIndex];
            const oldColumnName = oldColumn.name;
            const newColumnName = column.name;
            const updatedColumns = [...table.columns];
            updatedColumns[existingIndex] = column;
            
            // Track if FK reference was removed
            const fkWasRemoved = oldColumn.references && !column.references;
            
            // If column name changed, update all indexes that reference it
            let updatedIndexes = table.indexes;
            if (oldColumnName !== newColumnName && table.indexes) {
              updatedIndexes = table.indexes.map(idx => ({
                ...idx,
                columns: idx.columns.map(col => 
                  col === oldColumnName ? newColumnName : col
                ),
              }));
            }
            
            // CRITICAL: If FK was removed, clean up auto-created index
            if (fkWasRemoved && updatedIndexes) {
              updatedIndexes = updatedIndexes.filter(idx => {
                // Keep non-FK indexes
                if (!idx.comment?.includes('Auto-created for foreign key performance')) {
                  return true;
                }
                
                // Keep composite indexes (user-created)
                if (idx.columns.length > 1) {
                  return true;
                }
                
                // Remove single-column auto-created index for this column
                return idx.columns[0] !== newColumnName;
              });
            }
            
            return { ...table, columns: updatedColumns, indexes: updatedIndexes };
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

      // CRITICAL: Track FK columns that will lose their references (BEFORE clearing them)
      const columnsLosingFKs: { tableId: string; columnName: string }[] = [];
      
      prev.tables.forEach(table => {
        if (table.id === editingColumn.table.id) return; // Skip source table
        
        table.columns.forEach(col => {
          if (col.references && 
              col.references.table === deletedTableName && 
              col.references.column === deletedColumnName) {
            columnsLosingFKs.push({ tableId: table.id, columnName: col.name });
          }
        });
      });

      const updatedTables = prev.tables.map(table => {
        if (table.id === editingColumn.table.id) {
          // Remove column from this table
          const updatedColumns = table.columns.filter(c => c.id !== columnId);
          
          // Clean up indexes that reference the deleted column
          const updatedIndexes = table.indexes?.filter(idx => 
            !idx.columns.includes(deletedColumnName)
          ) || [];
          
          return {
            ...table,
            columns: updatedColumns,
            indexes: updatedIndexes,
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
          
          // CRITICAL: Clean up auto-created FK indexes in other tables
          const updatedIndexes = table.indexes?.filter(idx => {
            // Keep non-FK indexes and user-created indexes
            if (!idx.comment?.includes('Auto-created for foreign key performance')) {
              return true;
            }
            
            // Keep composite indexes (user-created, not auto-generated)
            if (idx.columns.length > 1) {
              return true;
            }
            
            // Remove single-column auto-created index if that column lost its FK
            const colName = idx.columns[0];
            const fkRemoved = columnsLosingFKs.some(
              lost => lost.tableId === table.id && lost.columnName === colName
            );
            
            return !fkRemoved;
          }) || [];
          
          return { ...table, columns: updatedColumns, indexes: updatedIndexes };
        }
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    setIsColumnEditorOpen(false);
    setEditingColumn(null);
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
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false); // Reset optimization state
        
        // Ensure all tables have indexes array initialized
        const normalizedSchema = {
          ...template.schema,
          tables: template.schema.tables.map(table => ({
            ...table,
            indexes: table.indexes || [], // Initialize if missing
          })),
        };
        
        setSchema(normalizedSchema);
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
        // Close editors if this table is being edited or managed
        if (editingColumn?.table.id === tableId) {
          setIsColumnEditorOpen(false);
          setEditingColumn(null);
        }
        if (managingIndexTable?.id === tableId) {
          setIsIndexManagerOpen(false);
          setManagingIndexTable(null);
        }

        // Remove table AND clean up all FK references to it
        const deletedTableName = table.name;
        
        // CRITICAL: Track columns that will lose FK references (BEFORE clearing them)
        const columnsLosingFKs: { tableId: string; columnName: string }[] = [];
        
        schema.tables.forEach(t => {
          if (t.id === tableId) return; // Skip the table being deleted
          
          t.columns.forEach(col => {
            if (col.references && col.references.table === deletedTableName) {
              columnsLosingFKs.push({ tableId: t.id, columnName: col.name });
            }
          });
        });
        
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
            
            // CRITICAL: Clean up auto-created FK indexes in remaining tables
            const updatedIndexes = t.indexes?.filter(idx => {
              // Keep non-FK indexes and user-created indexes
              if (!idx.comment?.includes('Auto-created for foreign key performance')) {
                return true;
              }
              
              // Keep composite indexes (user-created, not auto-generated)
              if (idx.columns.length > 1) {
                return true;
              }
              
              // Remove single-column auto-created index if that column lost its FK
              const colName = idx.columns[0];
              const fkRemoved = columnsLosingFKs.some(
                lost => lost.tableId === t.id && lost.columnName === colName
              );
              
              return !fkRemoved;
            }) || [];
            
            return { ...t, columns: updatedColumns, indexes: updatedIndexes };
          });

        setSchema({
          ...schema,
          tables: updatedTables,
        });
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema, editingColumn, managingIndexTable]);

  // Memoize button visibility check for performance
  const hasFKsWithoutIndexes = useMemo(() => {
    return schema.tables.some(table => 
      table.columns.some(col => {
        if (!col.references) return false;
        const indexes = table.indexes || [];
        
        // Check for single-column index
        const hasSingleIndex = indexes.some(idx => 
          idx.columns.length === 1 && idx.columns[0] === col.name
        );
        
        // Check for composite index with FK as leftmost column
        const hasCompositeIndex = indexes.some(idx => 
          idx.columns.length > 1 && idx.columns[0] === col.name
        );
        
        // Show button if FK has no index at all
        return !hasSingleIndex && !hasCompositeIndex;
      })
    );
  }, [schema.tables]);

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
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false); // Reset optimization state
        
        setSchema({
          name: 'My Database',
          tables: [],
          relationships: [], // Deprecated: kept for backward compatibility
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // Keyboard shortcuts (Cmd+E for Export, Cmd+T for Add Table, Cmd+Shift+R for Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when dialogs are open
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      
      // Don't trigger when any dialog/drawer is open
      if (isColumnEditorOpen || isIndexManagerOpen || isExportModalOpen || confirmDialog.isOpen || inputDialog.isOpen || alertDialog.isOpen) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 'e':
            // Cmd/Ctrl + E: Export schema
            if (schema.tables.length > 0) {
              e.preventDefault();
              setIsExportModalOpen(true);
            }
            break;
          
          case 't':
            // Cmd/Ctrl + T: Add new table
            e.preventDefault();
            handleAddTable();
            break;
          
          case 'r':
            // Cmd/Ctrl + Shift + R: Reset schema
            if (e.shiftKey && schema.tables.length > 0) {
              e.preventDefault();
              handleReset();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schema.tables, isColumnEditorOpen, isIndexManagerOpen, isExportModalOpen, confirmDialog.isOpen, inputDialog.isOpen, alertDialog.isOpen, handleAddTable, handleReset]);

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
              <>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-red-600 hover:bg-red-500/10 border border-foreground/10 hover:border-red-500/20 rounded-lg transition-all font-mono flex items-center gap-2"
                  title="Delete all tables and start fresh"
                  aria-label="Reset schema"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Reset
                </button>

                {/* Auto-Index FKs button - only show when FKs need optimization */}
                {hasFKsWithoutIndexes && (
                  <button
                    onClick={handleAutoIndexForeignKeys}
                    disabled={isOptimizingFKs}
                    className="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/30 rounded-lg transition-all font-mono flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title={isOptimizingFKs ? 'Creating indexes...' : 'Automatically create indexes for all foreign key columns to optimize JOIN performance'}
                    aria-label="Auto-create foreign key indexes"
                    aria-busy={isOptimizingFKs}
                  >
                    {isOptimizingFKs ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{isOptimizingFKs ? 'Optimizing...' : 'Auto-Index FKs'}</span>
                    <span className="sm:hidden">{isOptimizingFKs ? '...' : 'Optimize'}</span>
                  </button>
                )}
              </>
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
            title="Create a new table"
            aria-label="Add new table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Table
          </button>

          <button
            onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
            className="px-4 py-2 text-sm font-medium bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground rounded-lg transition-all flex items-center gap-2 font-mono"
            title={isTemplatesOpen ? 'Close templates' : 'Show pre-built schema templates'}
            aria-label={isTemplatesOpen ? 'Close templates' : 'Show templates'}
            aria-expanded={isTemplatesOpen}
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
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {schema.tables.length > 0 && (() => {
            // Compute stats once to avoid multiple reduce calls
            const totalColumns = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);
            const totalIndexes = schema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
            
            return (
              <div className="ml-auto flex items-center gap-2 text-xs font-mono text-foreground/60" role="status" aria-live="polite">
                <span className="px-2 py-1 bg-foreground/10 rounded" aria-label={`${schema.tables.length} tables in schema`}>
                  {schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''}
                </span>
                <span className="px-2 py-1 bg-foreground/10 rounded" aria-label={`${totalColumns} columns total`}>
                  {totalColumns} column{totalColumns !== 1 ? 's' : ''}
                </span>
                {totalIndexes > 0 && (
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded" aria-label={`${totalIndexes} indexes for performance optimization`}>
                    {totalIndexes} index{totalIndexes !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Templates Grid */}
      {isTemplatesOpen && (
        <section className="mb-6 p-5 sm:p-6 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg" role="region" aria-label="Schema templates">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Schema Templates
            </h3>
            <button
              onClick={() => setIsTemplatesOpen(false)}
              className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
              title="Close templates"
              aria-label="Close templates panel"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list">
            {SCHEMA_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleLoadTemplate(template)}
                className="group p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 active:scale-95 active:bg-foreground/10 rounded transition-all text-left"
                role="listitem"
                aria-label={`Load ${template.name} template: ${template.description}`}
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
        </section>
      )}

      {/* Canvas */}
      {schema.tables.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg" role="region" aria-label="Empty schema canvas">
          <div className="mb-6 p-8 bg-foreground/5 rounded-full" aria-hidden="true">
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
              aria-label="Add your first table to begin"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Table
            </button>
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="px-6 py-3 text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all flex items-center gap-2 font-mono"
              aria-label="Browse and load pre-built templates"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
              </svg>
              Use Template
            </button>
          </div>
        </section>
      ) : (
        <section role="region" aria-label="Schema design canvas">
          <ReactFlowProvider>
            <SchemaCanvas
              schema={schema}
              onSchemaChange={setSchema}
              onEditTable={handleEditTable}
              onAddColumn={handleAddColumn}
              onEditColumn={handleEditColumn}
              onDeleteTable={handleDeleteTable}
              onManageIndexes={handleManageIndexes}
            />
          </ReactFlowProvider>
        </section>
      )}

      {/* Help Tips */}
      {schema.tables.length > 0 && (
        <aside className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg" role="complementary" aria-label="Quick tips and keyboard shortcuts">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-1 font-mono">Quick Tips</h4>
              <ul className="text-xs text-foreground/70 font-mono space-y-1 leading-relaxed" role="list">
                <li>→ Drag tables to reposition them on canvas</li>
                <li>→ Click on any column to edit it, or use &quot;Add Column&quot; button</li>
                <li>→ Click &quot;Indexes&quot; button on tables to manually manage indexes</li>
                <li>→ Click <span className="text-purple-600 dark:text-purple-400">&quot;Auto-Index FKs&quot;</span> button to instantly optimize all foreign keys</li>
                <li>→ <span className="text-purple-600 dark:text-purple-400">Lightning icon</span> next to columns indicates they are indexed</li>
                <li>→ Press <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-[10px]">Cmd+T</kbd> to add table, <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-[10px]">Cmd+E</kbd> to export</li>
                <li>→ <span className="text-foreground/70">Drag canvas</span> to pan (shows hand cursor ✋), drag tables to move them</li>
                <li>→ Click <span className="text-primary">Hand Tool</span> or hold <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-[10px]">Space</kbd> to lock tables and pan anywhere</li>
                <li>→ <span className="text-foreground/70">Use zoom buttons</span> or <span className="text-foreground/70">minimap</span> (bottom-right) to navigate large schemas</li>
                <li>→ <span className="text-foreground/70">Double-click</span> canvas to zoom, click <span className="text-foreground/70">&quot;Fit View&quot;</span> to center all tables</li>
                <li>→ Press <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-[10px]">Esc</kbd> to close dialogs</li>
              </ul>
            </div>
          </div>
        </aside>
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

      {/* Index Manager Drawer */}
      {managingIndexTable && (
        <IndexManager
          isOpen={isIndexManagerOpen}
          table={managingIndexTable}
          allTables={schema.tables}
          onSave={handleSaveIndexes}
          onClose={() => {
            setIsIndexManagerOpen(false);
            setManagingIndexTable(null);
          }}
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

