/**
 * Schema Designer Page
 * Visual database design tool with ERD diagram
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { AnimatePresence } from 'framer-motion';
import { SchemaState, SchemaTable, SchemaColumn, SchemaTemplate, SchemaIndex } from '@/features/schema-designer/types';
import SchemaCanvas from '@/features/schema-designer/components/SchemaCanvas';
import ColumnEditor from '@/features/schema-designer/components/ColumnEditor';
import ExportModal from '@/features/schema-designer/components/ExportModal';
import ImportModal from '@/features/schema-designer/components/ImportModal';
import { MigrationModal } from '@/features/schema-designer/components/MigrationModal';
import IndexManager from '@/features/schema-designer/components/IndexManager';
import { ValidationPanel } from '@/features/schema-designer/components/ValidationPanel';
import CommandPalette, { Command } from '@/features/schema-designer/components/CommandPalette';
import { SCHEMA_TEMPLATES } from '@/features/schema-designer/data/schema-templates';
import { autoLayoutTables, LayoutAlgorithm } from '@/features/schema-designer/utils/auto-layout';
import { exportCanvasAsImage, getSuggestedFilename } from '@/features/schema-designer/utils/image-export';
import { saveSchema, loadSchema, clearSchema, getLastSaved, formatTimestamp, isStorageAvailable } from '@/features/schema-designer/utils/schema-storage';
import { useSchemaHistory } from '@/features/schema-designer/hooks/useSchemaHistory';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';
import InputDialog from '@/features/sql-builder/components/ui/InputDialog';

export default function SchemaDesignerPage() {
  // Schema state with undo/redo support
  const {
    schema,
    setSchema,
    setSchemaDebounced,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    replaceSchema,
    lastActionName,
  } = useSchemaHistory({
    name: 'My Database',
    tables: [],
    relationships: [],
  });

  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{
    table: SchemaTable;
    column: SchemaColumn | null;
  } | null>(null);

  const [isIndexManagerOpen, setIsIndexManagerOpen] = useState(false);
  const [managingIndexTable, setManagingIndexTable] = useState<SchemaTable | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isOptimizingFKs, setIsOptimizingFKs] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLElement | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // LocalStorage persistence state
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [isStorageEnabled, setIsStorageEnabled] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    confirmVariant: 'danger',
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

  // LOCALSTORAGE PERSISTENCE
  // Restore schema from localStorage on mount
  useEffect(() => {
    // Check if storage is available
    if (!isStorageAvailable()) {
      setIsStorageEnabled(false);
      console.warn('LocalStorage not available - auto-save disabled');
      return;
    }
    
    // Try to load saved schema
    const savedSchema = loadSchema();
    
    if (savedSchema) {
      replaceSchema(savedSchema); // Use replaceSchema to avoid adding to history
      setLastSavedTime(getLastSaved());
      console.log('✅ Schema restored from localStorage');
    }
  }, [replaceSchema]); // Run only on mount
  
  // Auto-save schema to localStorage (debounced)
  useEffect(() => {
    if (!isStorageEnabled) return;
    
    // Skip auto-save for empty schema on initial mount
    if (schema.tables.length === 0 && !lastSavedTime) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveSchema(schema, true);
      if (success) {
        setLastSavedTime(Date.now());
      }
    }, 2000);
    
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [schema, isStorageEnabled, lastSavedTime]);
  
  // Update "saved time" display every minute
  useEffect(() => {
    if (!lastSavedTime) return;
    
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSavedTime(prev => prev);
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

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
    }), 'Add table');
  }, [schema.tables, setSchema]);

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
    // Prevent rapid clicks - check button state
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

    // Use a ref to store result to avoid React Strict Mode double-call issues
    const resultRef = { current: { indexesCreated: 0, errors: [] as string[], indexesBefore: 0, indexesAfter: 0 } };

    setSchema(prev => {
      // Store initial count
      resultRef.current.indexesBefore = prev.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
      
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

          // Generate unique index name with better collision avoidance
          let indexName = `fk_${table.name}_${col.name}`;
          let nameCounter = 1;
          
          // Ensure global uniqueness (check both existing and newly created)
          while (allIndexNames.has(indexName) || newIndexes.some(idx => idx.name === indexName)) {
            indexName = `fk_${table.name}_${col.name}_${nameCounter}`;
            nameCounter++;
          }

          // Validate index name length (max 64 characters for most databases)
          if (indexName.length > 64) {
            resultRef.current.errors.push(`Cannot create index for ${table.name}.${col.name}: Name too long (${indexName.length} > 64 chars)`);
            return;
          }

          // Create index with unique ID to prevent collisions
          const timestamp = Date.now() + resultRef.current.indexesCreated;
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
          allIndexNames.add(indexName);
          resultRef.current.indexesCreated++;
        });

        return { ...table, indexes: newIndexes };
      });

      // Calculate actual indexes after
      resultRef.current.indexesAfter = updatedTables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    // Show result message using queueMicrotask for better performance
    queueMicrotask(() => {
      setIsOptimizingFKs(false); // Re-enable button
      
      // Use actual difference in index count (protection against double-calls)
      const actualIndexesCreated = resultRef.current.indexesAfter - resultRef.current.indexesBefore;
      
      if (resultRef.current.errors.length > 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Partial Success',
          message: `Created ${actualIndexesCreated} index${actualIndexesCreated !== 1 ? 'es' : ''} successfully, but encountered ${resultRef.current.errors.length} error${resultRef.current.errors.length !== 1 ? 's' : ''}:\n\n${resultRef.current.errors.join('\n')}\n\nThese indexes need to be created manually using the "Indexes" button on each table.`,
        });
      } else if (actualIndexesCreated > 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Indexes Created Successfully',
          message: `Created ${actualIndexesCreated} index${actualIndexesCreated !== 1 ? 'es' : ''} for foreign key columns.\n\n${actualIndexesCreated === 1 ? 'This index optimizes' : 'These indexes optimize'} JOIN query performance.\n\nClick "Export" to see the CREATE INDEX statements in your schema.`,
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Already Optimized',
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
      confirmLabel: 'Load Template',
      cancelLabel: 'Cancel',
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
        
        // Replace schema without adding to undo history (template load is a new starting point)
        replaceSchema(normalizedSchema);
        setIsTemplatesOpen(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [replaceSchema]);

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
      confirmLabel: 'Delete Table',
      cancelLabel: 'Cancel',
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
    const totalColumns = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);
    const totalIndexes = schema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Tables?',
      message: `This will permanently delete:\n\n• ${schema.tables.length} table${schema.tables.length !== 1 ? 's' : ''}\n• ${totalColumns} column${totalColumns !== 1 ? 's' : ''}\n• ${totalIndexes} index${totalIndexes !== 1 ? 'es' : ''}\n\nYour saved work and undo history will also be cleared.`,
      confirmLabel: 'Delete Everything',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        // Close any open editors to prevent state conflicts
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false); // Reset optimization state
        
        // Replace schema without adding to history
        replaceSchema({
          name: 'My Database',
          tables: [],
          relationships: [],
        });
        
        // Clear localStorage and history
        clearSchema();
        clearHistory();
        setLastSavedTime(null);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema.tables, replaceSchema, clearHistory]);

  // Import schema
  const handleImport = useCallback((importedSchema: SchemaState) => {
    // Close any open editors to prevent state conflicts
    setIsColumnEditorOpen(false);
    setEditingColumn(null);
    setIsIndexManagerOpen(false);
    setManagingIndexTable(null);
    setIsOptimizingFKs(false);
    
    // Close import modal
    setIsImportModalOpen(false);
    
    // Replace schema without adding to undo history (import is a new starting point)
    replaceSchema({
      name: importedSchema.name || 'Imported Schema',
      description: importedSchema.description || '',
      tables: importedSchema.tables,
      relationships: [], // Deprecated: relationships auto-generated from FKs
    });
    
    // Suggest auto-layout if many tables were imported
    if (importedSchema.tables.length >= 5) {
      queueMicrotask(() => {
        setConfirmDialog({
          isOpen: true,
          title: 'Auto-Arrange Tables?',
          message: `Successfully imported ${importedSchema.tables.length} tables.\n\nWould you like to auto-arrange them by dependencies for better visualization?`,
          confirmLabel: 'Auto-Arrange',
          cancelLabel: 'Skip',
          confirmVariant: 'primary',
          onConfirm: () => {
            // Apply auto-layout
            const layoutedTables = autoLayoutTables(importedSchema.tables, 'hierarchical');
            setSchema(prev => ({
              ...prev,
              tables: layoutedTables,
            }));
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          },
        });
      });
    }
  }, [replaceSchema]);

  /**
   * Load a schema version from migration history
   */
  const handleLoadVersion = useCallback((loadedSchema: SchemaState) => {
    // Close migration modal
    setIsMigrationModalOpen(false);
    
    // Confirm before loading (will replace current schema)
    setConfirmDialog({
      isOpen: true,
      title: 'Load Schema Version?',
      message: `This will replace your current schema with the selected version.\n\nMake sure you've saved your current work if you want to keep it.`,
      confirmLabel: 'Load Version',
      cancelLabel: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: () => {
        // Close any open editors
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false);
        
        // Replace schema
        replaceSchema(loadedSchema);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Show success alert
        setAlertDialog({
          isOpen: true,
          title: 'Version Loaded',
          message: `Schema version loaded successfully. You can now continue editing or save a new version.`,
        });
      },
    });
  }, [replaceSchema]);

  // Auto-layout tables
  const handleAutoLayout = useCallback((algorithm: LayoutAlgorithm = 'hierarchical') => {
    if (schema.tables.length === 0) return;
    
    const layoutedTables = autoLayoutTables(schema.tables, algorithm);
    
    setSchema({
      ...schema,
      tables: layoutedTables,
    }, 'Auto-layout');
  }, [schema, setSchema]);

  // Export canvas as image
  const handleExportImage = useCallback(async (format: 'png' | 'svg') => {
    if (!canvasRef) {
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: 'Canvas reference not found. Please try again or refresh the page.',
      });
      return;
    }

    if (schema.tables.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Nothing to Export',
        message: 'Your schema is empty. Add some tables first before exporting as an image.',
      });
      return;
    }

    try {
      const filename = getSuggestedFilename(schema.name, format);
      await exportCanvasAsImage(canvasRef, schema.tables, {
        format,
        filename,
        backgroundColor: '#ffffff', // Always white for clean export
        quality: 0.95,
        pixelRatio: 2,
      });
      
      // Success feedback
      setAlertDialog({
        isOpen: true,
        title: `${format.toUpperCase()} Exported Successfully!`,
        message: `Your schema diagram has been downloaded as "${filename}".\n\nPerfect for documentation, presentations, or sharing on social media!`,
      });
    } catch (error) {
      console.error('Image export failed:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export canvas as image. Please try again.',
      });
    }
  }, [canvasRef, schema.name, schema.tables]);

  // Generate commands for command palette
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // Table commands
    cmds.push({
      id: 'add-table',
      label: 'Add New Table',
      description: 'Create a new table in your schema',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      category: 'table',
      keywords: ['create', 'new', 'table', 'add'],
      action: handleAddTable,
      shortcut: 'Cmd+T',
    });

    // Add navigation commands for each table
    schema.tables.forEach(table => {
      cmds.push({
        id: `goto-${table.id}`,
        label: `Go to ${table.name}`,
        description: `${table.columns.length} columns`,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
        category: 'navigation',
        keywords: ['table', table.name, 'jump', 'find'],
        action: () => {
          // TODO: Focus on table (scroll into view)
          console.log(`Navigate to table: ${table.name}`);
        },
      });
    });

    // Export commands
    const exportFormats = [
      { id: 'export-postgres', label: 'Export as PostgreSQL', format: 'sql-postgres' },
      { id: 'export-mysql', label: 'Export as MySQL', format: 'sql-mysql' },
      { id: 'export-prisma', label: 'Export as Prisma', format: 'prisma' },
      { id: 'export-typescript', label: 'Export as TypeScript', format: 'typescript' },
      { id: 'export-zod', label: 'Export as Zod Schemas', format: 'zod' },
      { id: 'export-json', label: 'Export as JSON', format: 'json' },
    ];

    exportFormats.forEach(fmt => {
      cmds.push({
        id: fmt.id,
        label: fmt.label,
        description: 'Download code',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        ),
        category: 'export',
        keywords: ['export', 'download', 'code', fmt.format],
        action: () => setIsExportModalOpen(true),
      });
    });

    // Import commands
    cmds.push({
      id: 'import-schema',
      label: 'Import Schema',
      description: 'Import from SQL or Prisma',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
        </svg>
      ),
      category: 'import',
      keywords: ['import', 'load', 'sql', 'prisma'],
      action: () => setIsImportModalOpen(true),
      shortcut: 'Cmd+I',
    });

    // View commands
    cmds.push({
      id: 'auto-layout',
      label: 'Auto Layout',
      description: 'Organize tables hierarchically',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
        </svg>
      ),
      category: 'view',
      keywords: ['layout', 'organize', 'arrange'],
      action: () => handleAutoLayout('hierarchical'),
      shortcut: 'Cmd+L',
    });

    cmds.push({
      id: 'reset-schema',
      label: 'Reset Schema',
      description: 'Delete all tables',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      category: 'edit',
      keywords: ['reset', 'clear', 'delete', 'remove'],
      action: handleReset,
      shortcut: 'Cmd+Shift+R',
    });

    cmds.push({
      id: 'undo',
      label: 'Undo',
      description: canUndo ? `Undo: ${lastActionName || 'Last action'}` : 'Nothing to undo',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      category: 'edit',
      keywords: ['undo', 'revert'],
      action: undo,
      shortcut: 'Cmd+Z',
    });

    cmds.push({
      id: 'redo',
      label: 'Redo',
      description: canRedo ? 'Redo last undone action' : 'Nothing to redo',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      ),
      category: 'edit',
      keywords: ['redo', 'repeat'],
      action: redo,
      shortcut: 'Cmd+Shift+Z',
    });

    return cmds;
  }, [schema.tables, canUndo, canRedo, lastActionName, undo, redo]);

  // Keyboard shortcut overlay (? key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts overlay with ? key (only when not typing)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      
      // Close overlay with Escape
      if (e.key === 'Escape' && isShortcutsOpen) {
        e.preventDefault();
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen]);

  // Keyboard shortcuts (Cmd+E for Export, Cmd+T for Add Table, Cmd+Shift+R for Reset, Cmd+I for Import)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when dialogs are open
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      
      // Don't trigger when any dialog/drawer is open (except command palette opening with Cmd+K)
      if (isColumnEditorOpen || isIndexManagerOpen || isExportModalOpen || isImportModalOpen || isMigrationModalOpen || confirmDialog.isOpen || inputDialog.isOpen || alertDialog.isOpen || isShortcutsOpen || isCommandPaletteOpen) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 'k':
            // Cmd/Ctrl + K: Open command palette
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
          
          case 'z':
            // Cmd/Ctrl + Z: Undo
            if (e.shiftKey) {
              // Cmd/Ctrl + Shift + Z: Redo
              if (canRedo) {
                e.preventDefault();
                redo();
              }
            } else {
              // Cmd/Ctrl + Z: Undo
              if (canUndo) {
                e.preventDefault();
                undo();
              }
            }
            break;
          
          case 'e':
            // Cmd/Ctrl + E: Export schema
            if (schema.tables.length > 0) {
              e.preventDefault();
              setIsExportModalOpen(true);
            }
            break;
          
          case 'i':
            // Cmd/Ctrl + I: Import schema
            e.preventDefault();
            setIsImportModalOpen(true);
            break;
          
          case 't':
            // Cmd/Ctrl + T: Add new table
            e.preventDefault();
            handleAddTable();
            break;
          
          case 'l':
            // Cmd/Ctrl + L: Auto-layout
            if (schema.tables.length > 0) {
              e.preventDefault();
              handleAutoLayout('hierarchical');
            }
            break;
          
          case 'r':
            // Cmd/Ctrl + Shift + R: Reset schema
            if (e.shiftKey && schema.tables.length > 0) {
              e.preventDefault();
              handleReset();
            }
            break;
          
          case 'm':
            // Cmd/Ctrl + M: Migrations
            e.preventDefault();
            setIsMigrationModalOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schema.tables, isColumnEditorOpen, isIndexManagerOpen, isExportModalOpen, isImportModalOpen, isMigrationModalOpen, confirmDialog.isOpen, inputDialog.isOpen, alertDialog.isOpen, isShortcutsOpen, canUndo, canRedo, undo, redo, handleAddTable, handleReset, handleAutoLayout]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      {/* Header - Industry Standard Compact */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Schema Designer
            </h1>
            {/* Schema stats - integrated with title */}
            {schema.tables.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-foreground/50 font-mono">
                <span className="hidden sm:inline">•</span>
                <span>{schema.tables.length} {schema.tables.length === 1 ? 'Table' : 'Tables'}</span>
                <span>•</span>
                <span>{schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} Cols</span>
                {(() => {
                  const totalIndexes = schema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
                  return totalIndexes > 0 ? (
                    <>
                      <span>•</span>
                      <span className="text-purple-500">{totalIndexes} {totalIndexes === 1 ? 'Idx' : 'Idxs'}</span>
                    </>
                  ) : null;
                })()}
              </div>
            )}
            {/* Auto-save status */}
            {isStorageEnabled && lastSavedTime && (
              <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-mono">
                <span className="hidden sm:inline">•</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span className="hidden sm:inline">{formatTimestamp(lastSavedTime)}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={schema.tables.length === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
            title={schema.tables.length === 0 ? 'Add tables to enable export' : 'Export schema (Cmd+E)'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Export
          </button>
        </div>
            
        {/* Toolbar - Clean and consistent */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-foreground/[0.03] border border-foreground/10 rounded-lg">
          <div className="flex items-center gap-1.5">
            {/* History group */}
            <div className="flex items-center gap-0.5">
            <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95"
                title={canUndo ? `Undo (Cmd+Z)` : 'Nothing to undo'}
                aria-label="Undo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95"
                title={canRedo ? 'Redo (Cmd+Shift+Z)' : 'Nothing to redo'}
                aria-label="Redo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
            </button>
        </div>

            <div className="w-px h-5 bg-foreground/10"></div>
            
            {/* Primary action */}
          <button
            onClick={handleAddTable}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition-all flex items-center gap-1.5 font-mono active:scale-95"
              title="Create a new table (Cmd+T)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
              New Table
            </button>
            
            <div className="w-px h-5 bg-foreground/10"></div>
            
            {/* File actions group */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-2 py-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1.5 active:scale-95"
              title="Import schema (Cmd+I)"
              aria-label="Import schema"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs font-medium hidden lg:inline">Import</span>
          </button>

          <button
            onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
              className="px-2 py-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1.5 active:scale-95"
              title="Templates"
              aria-label="Templates"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
            </svg>
              <span className="text-xs font-medium hidden lg:inline">Templates</span>
            </button>
            
            {schema.tables.length > 1 && (
              <button
                onClick={() => handleAutoLayout('hierarchical')}
                className="px-2 py-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1.5 active:scale-95"
                title="Auto-arrange tables (Cmd+L)"
                aria-label="Auto-layout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
            </svg>
                <span className="text-xs font-medium hidden lg:inline">Auto Layout</span>
          </button>
            )}
            
            <button
              onClick={() => setIsMigrationModalOpen(true)}
              className="px-2 py-1.5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1.5 active:scale-95"
              title="Version history & migrations (Cmd+M)"
              aria-label="Migrations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-xs font-medium hidden lg:inline">Migrations</span>
            </button>
            
            {hasFKsWithoutIndexes && (
              <>
                <div className="w-px h-5 bg-foreground/10"></div>
                <button
                  onClick={handleAutoIndexForeignKeys}
                  disabled={isOptimizingFKs}
                  className="px-2 py-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  title={isOptimizingFKs ? 'Creating indexes...' : 'Auto-create indexes for foreign keys'}
                  aria-label="Optimize foreign keys"
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
                  <span className="text-xs font-medium hidden lg:inline">{isOptimizingFKs ? 'Optimizing...' : 'Optimize'}</span>
                </button>
              </>
            )}
            </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-1.5">
            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded transition-all active:scale-95"
              title="Keyboard shortcuts (?)"
              aria-label="Show keyboard shortcuts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {schema.tables.length > 0 && (
              <button
                onClick={handleReset}
                className="px-2 py-1.5 text-foreground/60 hover:text-red-600 hover:bg-red-500/10 rounded transition-all flex items-center gap-1.5 active:scale-95"
                title="Reset schema (Cmd+Shift+R)"
                aria-label="Reset schema"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs font-medium hidden lg:inline">Reset</span>
              </button>
            )}
          </div>
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

      {/* Validation Panel */}
      {schema.tables.length > 0 && (
        <div className="mb-4">
          <ValidationPanel schema={schema} />
        </div>
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
        <div ref={(el) => setCanvasRef(el)}>
        <SchemaCanvas
          schema={schema}
          onSchemaChange={setSchema}
          onEditTable={handleEditTable}
          onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteTable={handleDeleteTable}
            onManageIndexes={handleManageIndexes}
        />
        </div>
          </ReactFlowProvider>
        </section>
      )}

      {/* Keyboard Shortcuts Overlay - Press ? to toggle */}
      {isShortcutsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            onClick={() => setIsShortcutsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <h3 id="shortcuts-title" className="text-lg font-bold text-foreground font-mono">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
                {/* General Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3 font-mono">General Actions</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Command palette</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+K</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">New table</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+T</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Export schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+E</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Import schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+I</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Auto-layout</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+L</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Migrations</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+M</kbd>
                    </div>
                  </div>
                </div>

                {/* History & Navigation */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3 font-mono">History & Navigation</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Undo</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Redo</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Shift+Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Pan mode</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Hold Space</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Reset schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Shift+R</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-foreground/5 border-t border-foreground/10 text-center">
                <p className="text-xs text-foreground/50 font-mono">
                  Press <kbd className="px-1.5 py-0.5 bg-foreground/10 border border-foreground/20 rounded text-[10px] mx-0.5">?</kbd> or <kbd className="px-1.5 py-0.5 bg-foreground/10 border border-foreground/20 rounded text-[10px] mx-0.5">Esc</kbd> to close
                </p>
              </div>
            </div>
          </div>
        </>
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
        onExportImage={handleExportImage}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        hasExistingTables={schema.tables.length > 0}
      />

      {/* Migration Modal */}
      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        currentSchema={schema}
        onLoadVersion={handleLoadVersion}
      />

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            schema={schema}
            commands={commands}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
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

