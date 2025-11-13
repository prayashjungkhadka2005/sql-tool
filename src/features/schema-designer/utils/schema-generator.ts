/**
 * Schema to SQL Generator
 * Converts visual schema to SQL DDL statements
 */

import { SchemaState, SchemaTable, SchemaColumn, ExportFormat, SQLDataType } from '../types';

/**
 * Generate SQL CREATE TABLE statements
 */
export function generateSQL(schema: SchemaState, format: ExportFormat = 'sql-postgres'): string {
  if (!schema.tables || schema.tables.length === 0) {
    return '-- No tables defined. Add tables to generate SQL.';
  }

  const statements: string[] = [];

  // Add schema comment
  if (schema.name) {
    statements.push(`-- Schema: ${schema.name}`);
    if (schema.description) {
      statements.push(`-- ${schema.description}`);
    }
    statements.push('');
  }

  // Generate CREATE TABLE for each table
  schema.tables.forEach(table => {
    const sql = generateCreateTable(table, format);
    statements.push(sql);
    statements.push(''); // Empty line between tables
  });

  // Generate foreign key statements (for MySQL compatibility)
  if (format === 'sql-mysql') {
    schema.tables.forEach(table => {
      const fkStatements = generateForeignKeys(table);
      if (fkStatements.length > 0) {
        statements.push(...fkStatements);
        statements.push('');
      }
    });
  }

  return statements.join('\n');
}

/**
 * Generate CREATE TABLE statement for a single table
 */
function generateCreateTable(table: SchemaTable, format: ExportFormat): string {
  const lines: string[] = [];

  // Table comment
  if (table.comment) {
    lines.push(`-- ${table.comment}`);
  }

  lines.push(`CREATE TABLE ${table.name} (`);

  // Column definitions
  const columnDefs: string[] = [];
  table.columns.forEach(column => {
    const def = generateColumnDefinition(column, format);
    columnDefs.push(`  ${def}`);
  });

  // Primary key constraint
  const primaryKeys = table.columns.filter(c => c.primaryKey).map(c => c.name);
  if (primaryKeys.length > 0 && format !== 'sql-sqlite') {
    columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  // Foreign key constraints (inline for PostgreSQL)
  if (format === 'sql-postgres') {
    table.columns.forEach(column => {
      if (column.references) {
        const fkDef = generateForeignKeyConstraint(table.name, column);
        columnDefs.push(`  ${fkDef}`);
      }
    });
  }

  lines.push(columnDefs.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Generate column definition
 */
function generateColumnDefinition(column: SchemaColumn, format: ExportFormat): string {
  const parts: string[] = [column.name];

  // Data type with length
  let dataType: string = column.type;
  if (column.type === 'VARCHAR' && column.length) {
    dataType = `VARCHAR(${column.length})`;
  } else if (column.type === 'DECIMAL' && column.precision) {
    dataType = column.scale 
      ? `DECIMAL(${column.precision},${column.scale})`
      : `DECIMAL(${column.precision})`;
  }
  parts.push(dataType);

  // SQLite uses INTEGER PRIMARY KEY for auto-increment
  if (format === 'sql-sqlite' && column.primaryKey && column.autoIncrement) {
    parts.push('PRIMARY KEY AUTOINCREMENT');
    return parts.join(' ');
  }

  // PostgreSQL uses SERIAL for auto-increment
  if (format === 'sql-postgres' && column.autoIncrement && column.type === 'INTEGER') {
    parts[1] = 'SERIAL';
  }

  // MySQL uses AUTO_INCREMENT
  if (format === 'sql-mysql' && column.autoIncrement) {
    parts.push('AUTO_INCREMENT');
  }

  // Primary key (if not SQLite)
  if (column.primaryKey && format !== 'sql-sqlite') {
    parts.push('PRIMARY KEY');
  }

  // NOT NULL
  if (!column.nullable) {
    parts.push('NOT NULL');
  }

  // UNIQUE
  if (column.unique && !column.primaryKey) {
    parts.push('UNIQUE');
  }

  // DEFAULT value (but not for auto-increment columns)
  if (column.defaultValue !== undefined && column.defaultValue !== '' && !column.autoIncrement) {
    const defaultVal = formatDefaultValue(column.defaultValue, column.type);
    parts.push(`DEFAULT ${defaultVal}`);
  }

  return parts.join(' ');
}

/**
 * Generate foreign key constraint
 */
function generateForeignKeyConstraint(tableName: string, column: SchemaColumn): string {
  if (!column.references) return '';

  const parts: string[] = [
    `FOREIGN KEY (${column.name})`,
    `REFERENCES ${column.references.table}(${column.references.column})`
  ];

  if (column.references.onDelete) {
    parts.push(`ON DELETE ${column.references.onDelete}`);
  }

  if (column.references.onUpdate) {
    parts.push(`ON UPDATE ${column.references.onUpdate}`);
  }

  return parts.join(' ');
}

/**
 * Generate foreign keys as separate ALTER statements (for MySQL)
 */
function generateForeignKeys(table: SchemaTable): string[] {
  const statements: string[] = [];

  table.columns.forEach(column => {
    if (column.references) {
      const statement = [
        `ALTER TABLE ${table.name}`,
        `ADD CONSTRAINT fk_${table.name}_${column.name}`,
        `FOREIGN KEY (${column.name})`,
        `REFERENCES ${column.references.table}(${column.references.column})`
      ];

      if (column.references.onDelete) {
        statement.push(`ON DELETE ${column.references.onDelete}`);
      }

      if (column.references.onUpdate) {
        statement.push(`ON UPDATE ${column.references.onUpdate}`);
      }

      statements.push(statement.join(' ') + ';');
    }
  });

  return statements;
}

/**
 * Format default value based on type
 */
function formatDefaultValue(value: string, type: SQLDataType): string {
  // NULL
  if (value.toUpperCase() === 'NULL') {
    return 'NULL';
  }

  // Functions (NOW(), CURRENT_TIMESTAMP, etc.)
  if (value.match(/^[A-Z_]+\(\)$/)) {
    return value;
  }

  // Boolean
  if (type === 'BOOLEAN') {
    return value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
  }

  // Number types
  if (type === 'INTEGER' || type === 'FLOAT' || type === 'DECIMAL') {
    return value;
  }

  // String types (wrap in quotes)
  return `'${value}'`;
}

/**
 * Generate Prisma schema
 */
export function generatePrismaSchema(schema: SchemaState): string {
  if (!schema.tables || schema.tables.length === 0) {
    return '// No tables defined';
  }

  const lines: string[] = [];

  // Generator and datasource config
  lines.push('generator client {');
  lines.push('  provider = "prisma-client-js"');
  lines.push('}');
  lines.push('');
  lines.push('datasource db {');
  lines.push('  provider = "postgresql"');
  lines.push('  url      = env("DATABASE_URL")');
  lines.push('}');
  lines.push('');

  // Generate models
  schema.tables.forEach(table => {
    const prismaModel = generatePrismaModel(table, schema);
    lines.push(prismaModel);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate Prisma model for a table
 */
function generatePrismaModel(table: SchemaTable, schema: SchemaState): string {
  const lines: string[] = [`model ${toPascalCase(table.name)} {`];

  table.columns.forEach(column => {
    const fieldDef = generatePrismaField(column, table, schema);
    lines.push(`  ${fieldDef}`);
  });

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate Prisma field
 */
function generatePrismaField(column: SchemaColumn, table: SchemaTable, schema: SchemaState): string {
  const parts: string[] = [];

  // Field name
  parts.push(toCamelCase(column.name).padEnd(14));

  // Field type
  let prismaType = mapSQLTypeToPrisma(column.type);
  if (!column.nullable && !column.primaryKey) {
    // Prisma types are non-nullable by default unless marked with ?
  } else if (column.nullable) {
    prismaType += '?';
  }
  parts.push(prismaType.padEnd(12));

  // Attributes
  const attributes: string[] = [];

  if (column.primaryKey) {
    attributes.push('@id');
  }

  if (column.autoIncrement && column.type === 'INTEGER') {
    attributes.push('@default(autoincrement())');
  }

  if (column.unique && !column.primaryKey) {
    attributes.push('@unique');
  }

  if (column.defaultValue && !column.autoIncrement) {
    if (column.type === 'TIMESTAMP') {
      attributes.push('@default(now())');
    } else if (column.type === 'BOOLEAN') {
      attributes.push(`@default(${column.defaultValue.toLowerCase()})`);
    } else if (column.type === 'INTEGER' || column.type === 'FLOAT' || column.type === 'DECIMAL') {
      attributes.push(`@default(${column.defaultValue})`);
    } else {
      attributes.push(`@default("${column.defaultValue}")`);
    }
  }

  // Relation attribute for foreign keys
  if (column.references) {
    const relName = toCamelCase(column.references.table);
    attributes.push(`@relation(fields: [${toCamelCase(column.name)}], references: [${column.references.column}])`);
  }

  if (attributes.length > 0) {
    parts.push(attributes.join(' '));
  }

  return parts.join(' ');
}

/**
 * Map SQL types to Prisma types
 */
function mapSQLTypeToPrisma(sqlType: SQLDataType): string {
  switch (sqlType) {
    case 'INTEGER': return 'Int';
    case 'VARCHAR': return 'String';
    case 'TEXT': return 'String';
    case 'BOOLEAN': return 'Boolean';
    case 'DATE': return 'DateTime';
    case 'TIMESTAMP': return 'DateTime';
    case 'DECIMAL': return 'Decimal';
    case 'FLOAT': return 'Float';
    default: return 'String';
  }
}

/**
 * Convert string to PascalCase (for model names)
 */
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase (for field names)
 */
function toCamelCase(str: string): string {
  const words = str.split('_');
  return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

/**
 * Generate JSON schema export
 */
export function generateJSONSchema(schema: SchemaState): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Validate schema for common issues
 */
export function validateSchema(schema: SchemaState): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if schema has tables
  if (!schema.tables || schema.tables.length === 0) {
    errors.push('Schema has no tables');
    return { isValid: false, errors, warnings };
  }

  schema.tables.forEach(table => {
    // Check if table has columns
    if (!table.columns || table.columns.length === 0) {
      errors.push(`Table "${table.name}" has no columns`);
    }

    // Check for primary key
    const hasPrimaryKey = table.columns.some(c => c.primaryKey);
    if (!hasPrimaryKey) {
      warnings.push(`Table "${table.name}" has no primary key`);
    }

    // Check for duplicate column names
    const columnNames = table.columns.map(c => c.name.toLowerCase());
    const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Table "${table.name}" has duplicate column names: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check foreign key references
    table.columns.forEach(column => {
      if (column.references) {
        const refTable = schema.tables.find(t => t.name === column.references!.table);
        if (!refTable) {
          errors.push(`Column "${table.name}.${column.name}" references non-existent table "${column.references.table}"`);
        } else {
          const refColumn = refTable.columns.find(c => c.name === column.references!.column);
          if (!refColumn) {
            errors.push(`Column "${table.name}.${column.name}" references non-existent column "${column.references.table}.${column.references.column}"`);
          } else {
            // Check if referenced column is unique or primary key
            if (!refColumn.primaryKey && !refColumn.unique) {
              warnings.push(`Column "${table.name}.${column.name}" references non-unique column "${column.references.table}.${column.references.column}". Foreign keys should reference primary keys or unique columns.`);
            }
          }
        }
      }
    });

    // Check for multiple primary keys (should use composite key instead)
    const primaryKeyCount = table.columns.filter(c => c.primaryKey).length;
    if (primaryKeyCount > 1) {
      warnings.push(`Table "${table.name}" has ${primaryKeyCount} primary keys. Consider using a composite primary key instead.`);
    }
  });

  // Check for circular foreign key dependencies (basic check)
  schema.tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.references) {
        // Check if referenced table has FK back to this table (circular)
        const refTable = schema.tables.find(t => t.name === column.references!.table);
        if (refTable) {
          const hasCircular = refTable.columns.some(c => 
            c.references && c.references.table === table.name
          );
          if (hasCircular) {
            warnings.push(`Circular foreign key dependency detected between "${table.name}" and "${column.references.table}". This may cause issues with INSERT operations.`);
          }
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

