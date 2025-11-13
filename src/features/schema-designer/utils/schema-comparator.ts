/**
 * Schema Comparator
 * 
 * Compares two schemas and generates a detailed diff of all changes.
 * Used for migration generation and visual comparison.
 */

import { SchemaState, SchemaTable, SchemaColumn, SchemaIndex } from '../types';

export interface ColumnChange {
  old: SchemaColumn;
  new: SchemaColumn;
  changes: {
    type: 'type' | 'nullable' | 'default' | 'unique' | 'autoIncrement' | 'references' | 'comment';
    oldValue: string;
    newValue: string;
  }[];
}

export interface IndexChange {
  old: SchemaIndex;
  new: SchemaIndex;
  changes: string[]; // Array of what changed (e.g., "columns", "type", "unique", "where")
}

export interface TableChange {
  tableName: string;
  columnsAdded: SchemaColumn[];
  columnsRemoved: SchemaColumn[];
  columnsModified: ColumnChange[];
  indexesAdded: SchemaIndex[];
  indexesRemoved: SchemaIndex[];
  indexesModified: IndexChange[];
}

export interface SchemaDiff {
  tablesAdded: SchemaTable[];
  tablesRemoved: SchemaTable[];
  tablesModified: TableChange[];
  hasChanges: boolean;
}

/**
 * Compare two schemas and return a detailed diff
 */
export function compareSchemas(oldSchema: SchemaState, newSchema: SchemaState): SchemaDiff {
  const diff: SchemaDiff = {
    tablesAdded: [],
    tablesRemoved: [],
    tablesModified: [],
    hasChanges: false,
  };

  // Validate inputs
  if (!oldSchema || !oldSchema.tables || !Array.isArray(oldSchema.tables)) {
    console.error('[Schema Comparator] Invalid old schema');
    return diff;
  }

  if (!newSchema || !newSchema.tables || !Array.isArray(newSchema.tables)) {
    console.error('[Schema Comparator] Invalid new schema');
    return diff;
  }

  // Find added and removed tables
  const oldTableNames = new Set(oldSchema.tables.map(t => t.name));
  const newTableNames = new Set(newSchema.tables.map(t => t.name));

  // Tables added
  for (const table of newSchema.tables) {
    if (!oldTableNames.has(table.name)) {
      diff.tablesAdded.push(table);
    }
  }

  // Tables removed
  for (const table of oldSchema.tables) {
    if (!newTableNames.has(table.name)) {
      diff.tablesRemoved.push(table);
    }
  }

  // Tables modified (compare columns and indexes)
  for (const newTable of newSchema.tables) {
    if (!oldTableNames.has(newTable.name)) continue;

    const oldTable = oldSchema.tables.find(t => t.name === newTable.name)!;
    const tableChange = compareTable(oldTable, newTable);

    if (tableChange) {
      diff.tablesModified.push(tableChange);
    }
  }

  // Determine if there are any changes
  diff.hasChanges = 
    diff.tablesAdded.length > 0 ||
    diff.tablesRemoved.length > 0 ||
    diff.tablesModified.length > 0;

  return diff;
}

/**
 * Compare two tables and return changes
 */
function compareTable(oldTable: SchemaTable, newTable: SchemaTable): TableChange | null {
  const change: TableChange = {
    tableName: newTable.name,
    columnsAdded: [],
    columnsRemoved: [],
    columnsModified: [],
    indexesAdded: [],
    indexesRemoved: [],
    indexesModified: [],
  };

  // Find added and removed columns
  const oldColumnNames = new Set(oldTable.columns.map(c => c.name));
  const newColumnNames = new Set(newTable.columns.map(c => c.name));

  // Columns added
  for (const column of newTable.columns) {
    if (!oldColumnNames.has(column.name)) {
      change.columnsAdded.push(column);
    }
  }

  // Columns removed
  for (const column of oldTable.columns) {
    if (!newColumnNames.has(column.name)) {
      change.columnsRemoved.push(column);
    }
  }

  // Columns modified
  for (const newColumn of newTable.columns) {
    if (!oldColumnNames.has(newColumn.name)) continue;

    const oldColumn = oldTable.columns.find(c => c.name === newColumn.name)!;
    const columnChange = compareColumn(oldColumn, newColumn);

    if (columnChange) {
      change.columnsModified.push(columnChange);
    }
  }

  // Compare indexes
  const oldIndexes = oldTable.indexes || [];
  const newIndexes = newTable.indexes || [];

  const oldIndexNames = new Set(oldIndexes.map(i => i.name));
  const newIndexNames = new Set(newIndexes.map(i => i.name));

  // Indexes added
  for (const index of newIndexes) {
    if (!oldIndexNames.has(index.name)) {
      change.indexesAdded.push(index);
    }
  }

  // Indexes removed
  for (const index of oldIndexes) {
    if (!newIndexNames.has(index.name)) {
      change.indexesRemoved.push(index);
    }
  }

  // Indexes modified (same name but different properties)
  for (const newIndex of newIndexes) {
    if (!oldIndexNames.has(newIndex.name)) continue;

    const oldIndex = oldIndexes.find(i => i.name === newIndex.name)!;
    const indexChange = compareIndex(oldIndex, newIndex);

    if (indexChange) {
      change.indexesModified.push(indexChange);
    }
  }

  // If no changes, return null
  const hasChanges = 
    change.columnsAdded.length > 0 ||
    change.columnsRemoved.length > 0 ||
    change.columnsModified.length > 0 ||
    change.indexesAdded.length > 0 ||
    change.indexesRemoved.length > 0 ||
    change.indexesModified.length > 0;

  return hasChanges ? change : null;
}

/**
 * Compare two indexes and return changes
 */
function compareIndex(oldIndex: SchemaIndex, newIndex: SchemaIndex): IndexChange | null {
  const changes: string[] = [];

  // Columns changed
  const oldCols = oldIndex.columns.join(',');
  const newCols = newIndex.columns.join(',');
  if (oldCols !== newCols) {
    changes.push('columns');
  }

  // Type changed
  if (oldIndex.type !== newIndex.type) {
    changes.push('type');
  }

  // Unique flag changed
  if (oldIndex.unique !== newIndex.unique) {
    changes.push('unique');
  }

  // WHERE clause changed (partial index)
  if ((oldIndex.where || '') !== (newIndex.where || '')) {
    changes.push('where');
  }

  return changes.length > 0 ? { old: oldIndex, new: newIndex, changes } : null;
}

/**
 * Compare two columns and return changes
 */
function compareColumn(oldColumn: SchemaColumn, newColumn: SchemaColumn): ColumnChange | null {
  const changes: ColumnChange['changes'] = [];

  // Type change
  if (oldColumn.type !== newColumn.type) {
    changes.push({
      type: 'type',
      oldValue: oldColumn.type,
      newValue: newColumn.type,
    });
  }

  // Length change (for VARCHAR/CHAR) - only if type didn't change
  if (oldColumn.type === newColumn.type && oldColumn.length !== newColumn.length) {
    changes.push({
      type: 'type',
      oldValue: `${oldColumn.type}${oldColumn.length ? `(${oldColumn.length})` : ''}`,
      newValue: `${newColumn.type}${newColumn.length ? `(${newColumn.length})` : ''}`,
    });
  }

  // Primary key change (CRITICAL - affects table structure)
  if (oldColumn.primaryKey !== newColumn.primaryKey) {
    changes.push({
      type: 'type', // Use 'type' since it affects structure
      oldValue: oldColumn.primaryKey ? 'PRIMARY KEY' : '(not PK)',
      newValue: newColumn.primaryKey ? 'PRIMARY KEY' : '(not PK)',
    });
  }

  // Nullable change
  if (oldColumn.nullable !== newColumn.nullable) {
    changes.push({
      type: 'nullable',
      oldValue: oldColumn.nullable ? 'NULL' : 'NOT NULL',
      newValue: newColumn.nullable ? 'NULL' : 'NOT NULL',
    });
  }

  // Default value change
  if (oldColumn.defaultValue !== newColumn.defaultValue) {
    changes.push({
      type: 'default',
      oldValue: oldColumn.defaultValue || '(none)',
      newValue: newColumn.defaultValue || '(none)',
    });
  }

  // Unique constraint change
  if (oldColumn.unique !== newColumn.unique) {
    changes.push({
      type: 'unique',
      oldValue: oldColumn.unique ? 'UNIQUE' : '(none)',
      newValue: newColumn.unique ? 'UNIQUE' : '(none)',
    });
  }

  // Auto increment change
  if (oldColumn.autoIncrement !== newColumn.autoIncrement) {
    changes.push({
      type: 'autoIncrement',
      oldValue: oldColumn.autoIncrement ? 'AUTO_INCREMENT' : '(none)',
      newValue: newColumn.autoIncrement ? 'AUTO_INCREMENT' : '(none)',
    });
  }

  // Foreign key reference change
  const oldRef = oldColumn.references;
  const newRef = newColumn.references;
  const oldRefStr = oldRef ? `${oldRef.table}.${oldRef.column}` : '(none)';
  const newRefStr = newRef ? `${newRef.table}.${newRef.column}` : '(none)';

  if (oldRefStr !== newRefStr) {
    changes.push({
      type: 'references',
      oldValue: oldRefStr,
      newValue: newRefStr,
    });
  }

  // Foreign key CASCADE actions change (even if FK target is same)
  if (oldRef && newRef && oldRefStr === newRefStr) {
    const oldOnDelete = oldRef.onDelete || 'NO ACTION';
    const newOnDelete = newRef.onDelete || 'NO ACTION';
    const oldOnUpdate = oldRef.onUpdate || 'NO ACTION';
    const newOnUpdate = newRef.onUpdate || 'NO ACTION';

    if (oldOnDelete !== newOnDelete || oldOnUpdate !== newOnUpdate) {
      changes.push({
        type: 'references',
        oldValue: `FK: ON DELETE ${oldOnDelete}, ON UPDATE ${oldOnUpdate}`,
        newValue: `FK: ON DELETE ${newOnDelete}, ON UPDATE ${newOnUpdate}`,
      });
    }
  }

  // Comment change
  if ((oldColumn.comment || '') !== (newColumn.comment || '')) {
    changes.push({
      type: 'comment',
      oldValue: oldColumn.comment || '(none)',
      newValue: newColumn.comment || '(none)',
    });
  }

  // If no changes, return null
  return changes.length > 0 ? { old: oldColumn, new: newColumn, changes } : null;
}

/**
 * Get summary of changes for display
 */
export function getDiffSummary(diff: SchemaDiff): string {
  const parts: string[] = [];

  if (diff.tablesAdded.length > 0) {
    parts.push(`${diff.tablesAdded.length} table${diff.tablesAdded.length !== 1 ? 's' : ''} added`);
  }

  if (diff.tablesRemoved.length > 0) {
    parts.push(`${diff.tablesRemoved.length} table${diff.tablesRemoved.length !== 1 ? 's' : ''} removed`);
  }

  if (diff.tablesModified.length > 0) {
    parts.push(`${diff.tablesModified.length} table${diff.tablesModified.length !== 1 ? 's' : ''} modified`);
  }

  if (parts.length === 0) {
    return 'No changes detected';
  }

  return parts.join(', ');
}

/**
 * Count total changes
 */
export function countChanges(diff: SchemaDiff): number {
  let count = 0;

  count += diff.tablesAdded.length;
  count += diff.tablesRemoved.length;

  for (const tableChange of diff.tablesModified) {
    count += tableChange.columnsAdded.length;
    count += tableChange.columnsRemoved.length;
    count += tableChange.columnsModified.length;
    count += tableChange.indexesAdded.length;
    count += tableChange.indexesRemoved.length;
    count += tableChange.indexesModified.length;
  }

  return count;
}

