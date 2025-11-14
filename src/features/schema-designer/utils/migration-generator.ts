/**
 * Migration Generator
 * 
 * Generates SQL migration statements (UP and DOWN) from schema diffs.
 * Supports PostgreSQL and MySQL dialects.
 */

import { SchemaDiff, TableChange, ColumnChange } from './schema-comparator';
import { SchemaTable, SchemaColumn, SchemaIndex } from '../types';

export type SQLDialect = 'postgresql' | 'mysql';

export interface MigrationSQL {
  up: string[];      // Statements to apply changes (old → new)
  down: string[];    // Statements to rollback changes (new → old)
  warnings: string[]; // Important warnings for the user
}

/**
 * Generate migration SQL from a schema diff
 */
export function generateMigration(
  diff: SchemaDiff, 
  dialect: SQLDialect = 'postgresql',
  versionTag?: string
): MigrationSQL {
  const migration: MigrationSQL = {
    up: [],
    down: [],
    warnings: [],
  };

  if (!diff.hasChanges) {
    return migration;
  }

  // Add migration header with metadata (industry standard)
  const timestamp = new Date().toISOString();
  const header = [
    `-- Migration: ${versionTag || 'Schema Update'}`,
    `-- Generated: ${timestamp}`,
    `-- Dialect: ${dialect === 'postgresql' ? 'PostgreSQL' : 'MySQL'}`,
    `-- Description: Auto-generated migration from schema comparison`,
    `--`,
    `-- IMPORTANT: Review this migration before applying to production!`,
    `-- Some changes may require manual adjustments or data backups.`,
    '',
  ];

  migration.up.push(...header);
  migration.down.push(...header);

  // Add transaction wrapper (best practice)
  if (dialect === 'postgresql') {
    migration.up.push('BEGIN;', '');
    migration.down.push('BEGIN;', '');
  } else {
    migration.up.push('START TRANSACTION;', '');
    migration.down.push('START TRANSACTION;', '');
  }

  // Generate statements in correct order
  // UP: 1. Add tables, 2. Modify tables, 3. Remove tables
  // DOWN: reverse order

  // === UP MIGRATION ===

  // 1. Add new tables
  if (diff.tablesAdded.length > 0) {
    migration.up.push('-- Add new tables');
    for (const table of diff.tablesAdded) {
      migration.up.push(...generateCreateTable(table, dialect));
    }
    migration.up.push(''); // Blank line for readability
  }

  // 2. Modify existing tables
  if (diff.tablesModified.length > 0) {
    migration.up.push('-- Modify existing tables');
    for (const tableChange of diff.tablesModified) {
      migration.up.push(...generateTableModifications(tableChange, dialect, 'up'));
    }
    migration.up.push(''); // Blank line for readability
  }

  // 3. Drop removed tables
  if (diff.tablesRemoved.length > 0) {
    migration.up.push('-- Drop removed tables');
    for (const table of diff.tablesRemoved) {
      migration.up.push(...generateDropTable(table, dialect));
    }
  }

  // === DOWN MIGRATION ===

  // Reverse order: 1. Re-create dropped tables, 2. Revert modifications, 3. Drop new tables

  // 1. Re-create dropped tables
  if (diff.tablesRemoved.length > 0) {
    migration.down.push('-- Re-create dropped tables');
    for (const table of diff.tablesRemoved) {
      migration.down.push(...generateCreateTable(table, dialect));
    }
    migration.down.push(''); // Blank line for readability
  }

  // 2. Revert table modifications (reverse order)
  if (diff.tablesModified.length > 0) {
    migration.down.push('-- Revert table modifications');
    for (const tableChange of diff.tablesModified.slice().reverse()) {
      migration.down.push(...generateTableModifications(tableChange, dialect, 'down'));
    }
    migration.down.push(''); // Blank line for readability
  }

  // 3. Drop newly added tables
  if (diff.tablesAdded.length > 0) {
    migration.down.push('-- Drop newly added tables');
    for (const table of diff.tablesAdded) {
      migration.down.push(...generateDropTable(table, dialect));
    }
  }

  // === WARNINGS ===

  // Detect potential data loss
  if (diff.tablesRemoved.length > 0) {
    migration.warnings.push(
      `${diff.tablesRemoved.length} table(s) will be dropped. This is irreversible and will delete all data.`
    );
    
    // Hint about renames
    if (diff.tablesAdded.length > 0) {
      migration.warnings.push(
        `Note: If you renamed a table, it will appear as dropped + added. You may need to manually change DROP to RENAME TABLE.`
      );
    }
  }

  for (const tableChange of diff.tablesModified) {
    if (tableChange.columnsRemoved.length > 0) {
      migration.warnings.push(
        `Table "${tableChange.tableName}": ${tableChange.columnsRemoved.length} column(s) will be dropped. Data will be lost.`
      );
      
      // Hint about column renames
      if (tableChange.columnsAdded.length > 0) {
        migration.warnings.push(
          `Note: If you renamed columns in "${tableChange.tableName}", they will appear as dropped + added. You may need to use ALTER TABLE RENAME COLUMN instead.`
        );
      }
    }

    // Check for type changes that might require CAST
    for (const colChange of tableChange.columnsModified) {
      const typeChange = colChange.changes.find(c => c.type === 'type');
      if (typeChange) {
        // Check if it's a PRIMARY KEY change (very critical)
        if (typeChange.oldValue.includes('PRIMARY KEY') || typeChange.newValue.includes('PRIMARY KEY')) {
          migration.warnings.push(
            `Column "${tableChange.tableName}.${colChange.new.name}": PRIMARY KEY change requires manual migration. Altering primary keys may require recreating the table.`
          );
        } else {
          migration.warnings.push(
            `Column "${tableChange.tableName}.${colChange.new.name}": Type change (${typeChange.oldValue} → ${typeChange.newValue}) may require manual data conversion.`
          );
        }
      }

      // Check for NOT NULL added
      const nullableChange = colChange.changes.find(c => c.type === 'nullable');
      if (nullableChange && nullableChange.newValue === 'NOT NULL') {
        migration.warnings.push(
          `Column "${tableChange.tableName}.${colChange.new.name}": Adding NOT NULL constraint may fail if existing rows contain NULL values.`
        );
      }
    }

    // Warn about index modifications (requires rebuild)
    if (tableChange.indexesModified.length > 0) {
      migration.warnings.push(
        `Table "${tableChange.tableName}": ${tableChange.indexesModified.length} index(es) will be dropped and recreated. This may lock the table temporarily.`
      );
    }
  }

  // Warn if very large migration (potential performance issue)
  const totalStatements = migration.up.length + migration.down.length;
  if (totalStatements > 100) {
    migration.warnings.push(
      `Large migration detected (${totalStatements} statements). Consider splitting into multiple smaller migrations for better rollback control.`
    );
  }

  // Warn if mixing structure and data changes
  const hasStructuralChanges = diff.tablesAdded.length > 0 || diff.tablesRemoved.length > 0;
  const hasDataChanges = diff.tablesModified.some(t => 
    t.columnsModified.some(c => c.changes.some(ch => ch.type === 'default'))
  );
  
  if (hasStructuralChanges && hasDataChanges) {
    migration.warnings.push(
      `This migration contains both structural changes (new/dropped tables) and data-affecting changes (defaults). Test thoroughly in a staging environment.`
    );
  }

  // Close transaction (industry standard)
  // Count actual SQL statements (excluding comments and blank lines)
  const upSQLCount = migration.up.filter(line => 
    line.trim().length > 0 && !line.trim().startsWith('--')
  ).length;
  
  const downSQLCount = migration.down.filter(line => 
    line.trim().length > 0 && !line.trim().startsWith('--')
  ).length;

  // Add COMMIT if we have actual SQL statements (beyond just BEGIN/START TRANSACTION)
  if (upSQLCount > 1) { // More than just BEGIN/START TRANSACTION
    migration.up.push('', 'COMMIT;');
  } else {
    // Remove transaction wrapper if no actual statements
    migration.up = migration.up.filter(line => 
      line !== 'BEGIN;' && line !== 'START TRANSACTION;'
    );
  }

  if (downSQLCount > 1) { // More than just BEGIN/START TRANSACTION
    migration.down.push('', 'COMMIT;');
  } else {
    // Remove transaction wrapper if no actual statements
    migration.down = migration.down.filter(line => 
      line !== 'BEGIN;' && line !== 'START TRANSACTION;'
    );
  }

  // Remove duplicate warnings
  migration.warnings = Array.from(new Set(migration.warnings));

  return migration;
}

/**
 * Generate CREATE TABLE statement
 */
function generateCreateTable(table: SchemaTable, dialect: SQLDialect): string[] {
  const statements: string[] = [];

  // Validate table has columns
  if (!table.columns || table.columns.length === 0) {
    return [`-- Warning: Table "${table.name}" has no columns, skipping creation`];
  }

  // Build column definitions
  const columnDefs: string[] = [];
  const primaryKeys: string[] = [];

  for (const column of table.columns) {
    let def = `  ${escapeIdentifier(column.name, dialect)} ${column.type}`;

    // Primary key
    if (column.primaryKey) {
      primaryKeys.push(column.name);
      
      // For single PK with AUTO_INCREMENT, use SERIAL (PostgreSQL) or add AUTO_INCREMENT (MySQL)
      if (column.autoIncrement && table.columns.filter(c => c.primaryKey).length === 1) {
        if (dialect === 'postgresql') {
          def = `  ${escapeIdentifier(column.name, dialect)} SERIAL`;
        } else {
          def += ' AUTO_INCREMENT';
        }
      }
    }

    // Unique
    if (column.unique) {
      def += ' UNIQUE';
    }

    // Nullable
    if (!column.nullable) {
      def += ' NOT NULL';
    }

    // Default value
    if (column.defaultValue) {
      def += ` DEFAULT ${column.defaultValue}`;
    }

    columnDefs.push(def);
  }

  // Add primary key constraint (ALWAYS needed, even for SERIAL)
  if (primaryKeys.length > 0) {
    columnDefs.push(`  PRIMARY KEY (${primaryKeys.map(k => escapeIdentifier(k, dialect)).join(', ')})`);
  }

  // Build CREATE TABLE statement
  const tableName = escapeIdentifier(table.name, dialect);
  statements.push(
    `CREATE TABLE ${tableName} (\n${columnDefs.join(',\n')}\n);`
  );

  // Add foreign keys as separate ALTER TABLE statements (safer for dependencies)
  for (const column of table.columns) {
    if (column.references) {
      const constraintName = `fk_${table.name}_${column.name}`;
      const onDelete = column.references.onDelete || 'NO ACTION';
      const onUpdate = column.references.onUpdate || 'NO ACTION';

      statements.push(
        `ALTER TABLE ${tableName} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} ` +
        `FOREIGN KEY (${escapeIdentifier(column.name, dialect)}) ` +
        `REFERENCES ${escapeIdentifier(column.references.table, dialect)}(${escapeIdentifier(column.references.column, dialect)}) ` +
        `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
      );
    }
  }

  // Add indexes
  const indexes = table.indexes || [];
  for (const index of indexes) {
    statements.push(...generateCreateIndex(table.name, index, dialect));
  }

  return statements;
}

/**
 * Generate DROP TABLE statement
 */
function generateDropTable(table: SchemaTable, dialect: SQLDialect): string[] {
  const tableName = escapeIdentifier(table.name, dialect);
  return [`DROP TABLE ${tableName};`];
}

/**
 * Generate table modification statements
 */
function generateTableModifications(
  tableChange: TableChange,
  dialect: SQLDialect,
  direction: 'up' | 'down'
): string[] {
  const statements: string[] = [];
  const tableName = escapeIdentifier(tableChange.tableName, dialect);

  if (direction === 'up') {
    // === UP: Apply changes ===

    // 1. Drop foreign key constraints first (if columns are being removed/modified)
    // Use IF EXISTS to handle cases where constraint names don't match
    for (const column of tableChange.columnsRemoved) {
      if (column.references) {
        const constraintName = `fk_${tableChange.tableName}_${column.name}`;
        if (dialect === 'postgresql') {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${escapeIdentifier(constraintName, dialect)};`
          );
        } else {
          // MySQL doesn't support IF EXISTS for DROP CONSTRAINT, so we'll try to drop it
          // If it fails, the error will be caught and handled
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT ${escapeIdentifier(constraintName, dialect)};`
          );
        }
      }
    }

    for (const colChange of tableChange.columnsModified) {
      const refChange = colChange.changes.find(c => c.type === 'references');
      if (refChange && refChange.oldValue !== '(none)') {
        const constraintName = `fk_${tableChange.tableName}_${colChange.old.name}`;
        if (dialect === 'postgresql') {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${escapeIdentifier(constraintName, dialect)};`
          );
        } else {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT ${escapeIdentifier(constraintName, dialect)};`
          );
        }
      }
    }

    // 2. Drop indexes that will be removed or modified
    for (const index of tableChange.indexesRemoved) {
      statements.push(...generateDropIndex(tableChange.tableName, index, dialect));
    }

    // Drop modified indexes (will recreate them later)
    for (const indexChange of tableChange.indexesModified) {
      statements.push(...generateDropIndex(tableChange.tableName, indexChange.old, dialect));
    }

    // 3. Add new columns
    for (const column of tableChange.columnsAdded) {
      statements.push(...generateAddColumn(tableChange.tableName, column, dialect));
    }

    // 4. Modify existing columns
    for (const colChange of tableChange.columnsModified) {
      statements.push(...generateModifyColumn(tableChange.tableName, colChange, dialect));
    }

    // 5. Drop removed columns
    for (const column of tableChange.columnsRemoved) {
      statements.push(...generateDropColumn(tableChange.tableName, column, dialect));
    }

    // 6. Add new indexes and recreate modified indexes
    for (const index of tableChange.indexesAdded) {
      statements.push(...generateCreateIndex(tableChange.tableName, index, dialect));
    }

    // Recreate modified indexes with new definition
    for (const indexChange of tableChange.indexesModified) {
      statements.push(...generateCreateIndex(tableChange.tableName, indexChange.new, dialect));
    }

    // 7. Add new foreign key constraints
    for (const column of tableChange.columnsAdded) {
      if (column.references) {
        const constraintName = `fk_${tableChange.tableName}_${column.name}`;
        const onDelete = column.references.onDelete || 'NO ACTION';
        const onUpdate = column.references.onUpdate || 'NO ACTION';

        statements.push(
          `ALTER TABLE ${tableName} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} ` +
          `FOREIGN KEY (${escapeIdentifier(column.name, dialect)}) ` +
          `REFERENCES ${escapeIdentifier(column.references.table, dialect)}(${escapeIdentifier(column.references.column, dialect)}) ` +
          `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
        );
      }
    }

    for (const colChange of tableChange.columnsModified) {
      const refChange = colChange.changes.find(c => c.type === 'references');
      if (refChange && refChange.newValue !== '(none)' && colChange.new.references) {
        const constraintName = `fk_${tableChange.tableName}_${colChange.new.name}`;
        const onDelete = colChange.new.references.onDelete || 'NO ACTION';
        const onUpdate = colChange.new.references.onUpdate || 'NO ACTION';

        statements.push(
          `ALTER TABLE ${tableName} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} ` +
          `FOREIGN KEY (${escapeIdentifier(colChange.new.name, dialect)}) ` +
          `REFERENCES ${escapeIdentifier(colChange.new.references.table, dialect)}(${escapeIdentifier(colChange.new.references.column, dialect)}) ` +
          `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
        );
      }
    }

  } else {
    // === DOWN: Revert changes (reverse order) ===

    // 1. Drop new foreign key constraints
    for (const column of tableChange.columnsAdded) {
      if (column.references) {
        const constraintName = `fk_${tableChange.tableName}_${column.name}`;
        if (dialect === 'postgresql') {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${escapeIdentifier(constraintName, dialect)};`
          );
        } else {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT ${escapeIdentifier(constraintName, dialect)};`
          );
        }
      }
    }

    for (const colChange of tableChange.columnsModified) {
      const refChange = colChange.changes.find(c => c.type === 'references');
      if (refChange && refChange.newValue !== '(none)') {
        const constraintName = `fk_${tableChange.tableName}_${colChange.new.name}`;
        if (dialect === 'postgresql') {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${escapeIdentifier(constraintName, dialect)};`
          );
        } else {
          statements.push(
            `ALTER TABLE ${tableName} DROP CONSTRAINT ${escapeIdentifier(constraintName, dialect)};`
          );
        }
      }
    }

    // 2. Drop new indexes and modified indexes
    for (const index of tableChange.indexesAdded) {
      statements.push(...generateDropIndex(tableChange.tableName, index, dialect));
    }

    // Drop modified indexes (will recreate with old definition)
    for (const indexChange of tableChange.indexesModified) {
      statements.push(...generateDropIndex(tableChange.tableName, indexChange.new, dialect));
    }

    // 3. Re-add removed columns
    for (const column of tableChange.columnsRemoved) {
      statements.push(...generateAddColumn(tableChange.tableName, column, dialect));
    }

    // 4. Revert column modifications
    for (const colChange of tableChange.columnsModified) {
      statements.push(...generateModifyColumn(tableChange.tableName, colChange, dialect, true));
    }

    // 5. Drop added columns
    for (const column of tableChange.columnsAdded) {
      statements.push(...generateDropColumn(tableChange.tableName, column, dialect));
    }

    // 6. Re-create removed indexes and restore modified indexes to old definition
    for (const index of tableChange.indexesRemoved) {
      statements.push(...generateCreateIndex(tableChange.tableName, index, dialect));
    }

    // Recreate modified indexes with old definition
    for (const indexChange of tableChange.indexesModified) {
      statements.push(...generateCreateIndex(tableChange.tableName, indexChange.old, dialect));
    }

    // 7. Re-add old foreign key constraints
    for (const column of tableChange.columnsRemoved) {
      if (column.references) {
        const constraintName = `fk_${tableChange.tableName}_${column.name}`;
        const onDelete = column.references.onDelete || 'NO ACTION';
        const onUpdate = column.references.onUpdate || 'NO ACTION';

        statements.push(
          `ALTER TABLE ${tableName} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} ` +
          `FOREIGN KEY (${escapeIdentifier(column.name, dialect)}) ` +
          `REFERENCES ${escapeIdentifier(column.references.table, dialect)}(${escapeIdentifier(column.references.column, dialect)}) ` +
          `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
        );
      }
    }

    for (const colChange of tableChange.columnsModified) {
      const refChange = colChange.changes.find(c => c.type === 'references');
      if (refChange && refChange.oldValue !== '(none)' && colChange.old.references) {
        const constraintName = `fk_${tableChange.tableName}_${colChange.old.name}`;
        const onDelete = colChange.old.references.onDelete || 'NO ACTION';
        const onUpdate = colChange.old.references.onUpdate || 'NO ACTION';

        statements.push(
          `ALTER TABLE ${tableName} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} ` +
          `FOREIGN KEY (${escapeIdentifier(colChange.old.name, dialect)}) ` +
          `REFERENCES ${escapeIdentifier(colChange.old.references.table, dialect)}(${escapeIdentifier(colChange.old.references.column, dialect)}) ` +
          `ON DELETE ${onDelete} ON UPDATE ${onUpdate};`
        );
      }
    }
  }

  return statements;
}

/**
 * Generate ADD COLUMN statement
 */
function generateAddColumn(tableName: string, column: SchemaColumn, dialect: SQLDialect): string[] {
  const table = escapeIdentifier(tableName, dialect);
  const columnName = escapeIdentifier(column.name, dialect);

  let def = `${columnName} ${column.type}`;

  if (column.unique) def += ' UNIQUE';
  if (!column.nullable) def += ' NOT NULL';
  if (column.defaultValue) def += ` DEFAULT ${column.defaultValue}`;

  return [`ALTER TABLE ${table} ADD COLUMN ${def};`];
}

/**
 * Generate DROP COLUMN statement
 */
function generateDropColumn(tableName: string, column: SchemaColumn, dialect: SQLDialect): string[] {
  const table = escapeIdentifier(tableName, dialect);
  const columnName = escapeIdentifier(column.name, dialect);

  return [`ALTER TABLE ${table} DROP COLUMN ${columnName};`];
}

/**
 * Generate column modification statements
 */
function generateModifyColumn(
  tableName: string,
  colChange: ColumnChange,
  dialect: SQLDialect,
  revert: boolean = false
): string[] {
  const statements: string[] = [];
  const table = escapeIdentifier(tableName, dialect);
  const column = revert ? colChange.old : colChange.new;
  const columnName = escapeIdentifier(column.name, dialect);

  // Note: Different dialects handle ALTER COLUMN differently
  // This is a simplified version that works for basic cases

  for (const change of colChange.changes) {
    switch (change.type) {
      case 'type':
        if (dialect === 'postgresql') {
          statements.push(
            `ALTER TABLE ${table} ALTER COLUMN ${columnName} TYPE ${column.type};`
          );
        } else {
          statements.push(
            `ALTER TABLE ${table} MODIFY COLUMN ${columnName} ${column.type};`
          );
        }
        break;

      case 'nullable':
        if (dialect === 'postgresql') {
          const action = column.nullable ? 'DROP' : 'SET';
          statements.push(
            `ALTER TABLE ${table} ALTER COLUMN ${columnName} ${action} NOT NULL;`
          );
        } else {
          const nullable = column.nullable ? 'NULL' : 'NOT NULL';
          statements.push(
            `ALTER TABLE ${table} MODIFY COLUMN ${columnName} ${column.type} ${nullable};`
          );
        }
        break;

      case 'default':
        if (column.defaultValue) {
          if (dialect === 'postgresql') {
            statements.push(
              `ALTER TABLE ${table} ALTER COLUMN ${columnName} SET DEFAULT ${column.defaultValue};`
            );
          } else {
            statements.push(
              `ALTER TABLE ${table} ALTER COLUMN ${columnName} SET DEFAULT ${column.defaultValue};`
            );
          }
        } else {
          if (dialect === 'postgresql') {
            statements.push(
              `ALTER TABLE ${table} ALTER COLUMN ${columnName} DROP DEFAULT;`
            );
          } else {
            statements.push(
              `ALTER TABLE ${table} ALTER COLUMN ${columnName} DROP DEFAULT;`
            );
          }
        }
        break;

      case 'unique':
        // Note: Unique constraints are complex and dialect-specific
        // This is a simplified approach
        if (column.unique) {
          const constraintName = `uq_${tableName}_${column.name}`;
          statements.push(
            `ALTER TABLE ${table} ADD CONSTRAINT ${escapeIdentifier(constraintName, dialect)} UNIQUE (${columnName});`
          );
        }
        break;

      // References and autoIncrement changes are handled separately
    }
  }

  return statements;
}

/**
 * Generate CREATE INDEX statement
 */
function generateCreateIndex(tableName: string, index: SchemaIndex, dialect: SQLDialect): string[] {
  const table = escapeIdentifier(tableName, dialect);
  const indexName = escapeIdentifier(index.name, dialect);
  const columns = index.columns.map(c => escapeIdentifier(c, dialect)).join(', ');

  const unique = index.unique ? 'UNIQUE ' : '';
  let statement = `CREATE ${unique}INDEX ${indexName} ON ${table}(${columns})`;

  if (index.where) {
    statement += ` WHERE ${index.where}`;
  }

  return [`${statement};`];
}

/**
 * Generate DROP INDEX statement
 */
function generateDropIndex(tableName: string, index: SchemaIndex, dialect: SQLDialect): string[] {
  const indexName = escapeIdentifier(index.name, dialect);

  if (dialect === 'postgresql') {
    return [`DROP INDEX ${indexName};`];
  } else {
    const table = escapeIdentifier(tableName, dialect);
    return [`DROP INDEX ${indexName} ON ${table};`];
  }
}

/**
 * Escape identifier (table/column name) based on dialect
 */
function escapeIdentifier(name: string, dialect: SQLDialect): string {
  if (dialect === 'postgresql') {
    return `"${name.replace(/"/g, '""')}"`;
  } else {
    return `\`${name.replace(/`/g, '``')}\``;
  }
}

