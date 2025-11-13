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

  // Add schema comment (sanitize to prevent comment injection)
  if (schema.name) {
    const sanitizedName = schema.name
      .replace(/[\r\n]+/g, ' ')
      .replace(/--/g, '- -')
      .trim();
    if (sanitizedName) {
      statements.push(`-- Schema: ${sanitizedName}`);
    }
    
    if (schema.description) {
      const sanitizedDescription = schema.description
        .replace(/[\r\n]+/g, ' ')
        .replace(/--/g, '- -')
        .trim();
      if (sanitizedDescription) {
        statements.push(`-- ${sanitizedDescription}`);
      }
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

  // Generate index statements
  schema.tables.forEach(table => {
    if (table.indexes && table.indexes.length > 0) {
      const indexStatements = generateIndexes(table, format);
      if (indexStatements.length > 0) {
        statements.push(...indexStatements);
        statements.push('');
      }
    }
  });

  return statements.join('\n');
}

/**
 * Generate CREATE TABLE statement for a single table
 */
function generateCreateTable(table: SchemaTable, format: ExportFormat): string {
  const lines: string[] = [];

  // Table comment (sanitize to prevent comment injection)
  if (table.comment) {
    const sanitizedComment = table.comment
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .replace(/--/g, '- -')     // Escape SQL comment markers
      .trim();
    if (sanitizedComment) {
      lines.push(`-- ${sanitizedComment}`);
    }
  }

  lines.push(`CREATE TABLE ${table.name} (`);

  // Check if composite primary key (multiple columns)
  const primaryKeys = table.columns.filter(c => c.primaryKey).map(c => c.name);
  const isCompositePK = primaryKeys.length > 1;

  // Column definitions
  const columnDefs: string[] = [];
  table.columns.forEach(column => {
    const def = generateColumnDefinition(column, format, isCompositePK);
    columnDefs.push(`  ${def}`);
  });

  // Primary key constraint (table-level for composite PKs, or for all in non-SQLite)
  if (primaryKeys.length > 0 && format !== 'sql-sqlite') {
    // For composite PKs (2+ columns), always use table-level constraint
    // For single PK, still add table-level for consistency (unless it's inline)
    if (isCompositePK) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    }
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
function generateColumnDefinition(column: SchemaColumn, format: ExportFormat, isCompositePK: boolean = false): string {
  const parts: string[] = [column.name];

  // Data type with length/precision
  let dataType: string = column.type;
  if (column.type === 'VARCHAR' && column.length) {
    dataType = `VARCHAR(${column.length})`;
  } else if (column.type === 'CHAR' && column.length) {
    dataType = `CHAR(${column.length})`;
  } else if (column.type === 'DECIMAL' && column.precision) {
    dataType = column.scale 
      ? `DECIMAL(${column.precision},${column.scale})`
      : `DECIMAL(${column.precision})`;
  }
  parts.push(dataType);

  // SQLite uses INTEGER PRIMARY KEY for auto-increment (only for single PK)
  if (format === 'sql-sqlite' && column.primaryKey && column.autoIncrement && !isCompositePK) {
    parts.push('PRIMARY KEY AUTOINCREMENT');
    return parts.join(' ');
  }

  // PostgreSQL uses SERIAL/BIGSERIAL/SMALLSERIAL for auto-increment
  if (format === 'sql-postgres' && column.autoIncrement) {
    if (column.type === 'BIGINT') {
      parts[1] = 'BIGSERIAL';
    } else if (column.type === 'SMALLINT') {
      parts[1] = 'SMALLSERIAL';
    } else if (column.type === 'INTEGER') {
      parts[1] = 'SERIAL';
    }
  }

  // MySQL uses AUTO_INCREMENT (works with all integer types)
  if (format === 'sql-mysql' && column.autoIncrement) {
    parts.push('AUTO_INCREMENT');
  }

  // Primary key (ONLY if single PK, not for composite PKs)
  if (column.primaryKey && format !== 'sql-sqlite' && !isCompositePK) {
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
 * Generate CREATE INDEX statements for a table
 */
function generateIndexes(table: SchemaTable, format: ExportFormat): string[] {
  if (!table.indexes || table.indexes.length === 0) {
    return [];
  }

  const statements: string[] = [];

  table.indexes.forEach(index => {
    const parts: string[] = [];

    // Comment (sanitize: remove newlines and dangerous chars to prevent comment injection)
    if (index.comment) {
      const sanitizedComment = index.comment
        .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
        .replace(/--/g, '- -')     // Escape SQL comment markers
        .trim();
      if (sanitizedComment) {
        statements.push(`-- ${sanitizedComment}`);
      }
    }

    // CREATE UNIQUE INDEX or CREATE INDEX
    if (index.unique) {
      parts.push('CREATE UNIQUE INDEX');
    } else {
      parts.push('CREATE INDEX');
    }

    // Index name (already validated in IndexManager)
    parts.push(index.name);

    // ON table_name (already validated in table rename)
    parts.push(`ON ${table.name}`);

    // Index type (PostgreSQL syntax, skip for MySQL/SQLite)
    if (format === 'sql-postgres' && index.type !== 'BTREE') {
      parts.push(`USING ${index.type}`);
    }

    // Column list (already validated in IndexManager)
    parts.push(`(${index.columns.join(', ')})`);

    // Partial index WHERE clause (PostgreSQL only) - already validated in IndexManager
    if (format === 'sql-postgres' && index.where && index.where.trim()) {
      parts.push(`WHERE ${index.where.trim()}`);
    }

    statements.push(parts.join(' ') + ';');
  });

  return statements;
}

/**
 * Format default value based on type
 * Handles all SQL data types correctly
 */
function formatDefaultValue(value: string, type: SQLDataType): string {
  // NULL
  if (value.toUpperCase() === 'NULL') {
    return 'NULL';
  }

  // Functions (NOW(), CURRENT_TIMESTAMP, UUID(), etc.)
  if (value.match(/^[A-Z_]+\(\)$/i)) {
    return value.toUpperCase();
  }

  // Boolean
  if (type === 'BOOLEAN') {
    return value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
  }

  // Numeric types (no quotes)
  if (['SMALLINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'REAL', 'DECIMAL'].includes(type)) {
    return value;
  }

  // String types (wrap in single quotes)
  return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
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

  // Check for composite primary key
  const primaryKeyColumns = table.columns.filter(c => c.primaryKey);
  const isCompositePK = primaryKeyColumns.length > 1;

  table.columns.forEach(column => {
    const fieldDef = generatePrismaField(column, table, schema, isCompositePK);
    lines.push(`  ${fieldDef}`);
  });

  // Add model-level attributes
  const modelAttributes: string[] = [];

  // Composite primary key
  if (isCompositePK) {
    const pkFields = primaryKeyColumns.map(c => toCamelCase(c.name)).join(', ');
    modelAttributes.push(`  @@id([${pkFields}])`);
  }

  // Indexes
  if (table.indexes && table.indexes.length > 0) {
    table.indexes.forEach(index => {
      const indexCols = index.columns.map(c => toCamelCase(c)).join(', ');
      if (index.unique) {
        modelAttributes.push(`  @@unique([${indexCols}], name: "${index.name}")`);
      } else {
        modelAttributes.push(`  @@index([${indexCols}], name: "${index.name}")`);
      }
    });
  }

  if (modelAttributes.length > 0) {
    lines.push('');
    lines.push(...modelAttributes);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate Prisma field
 */
function generatePrismaField(column: SchemaColumn, table: SchemaTable, schema: SchemaState, isCompositePK: boolean = false): string {
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

  // For composite PK, don't add @id on individual columns
  if (column.primaryKey && !isCompositePK) {
    attributes.push('@id');
  }

  if (column.autoIncrement && ['SMALLINT', 'INTEGER', 'BIGINT'].includes(column.type)) {
    attributes.push('@default(autoincrement())');
  }

  if (column.unique && !column.primaryKey) {
    attributes.push('@unique');
  }

  if (column.defaultValue && !column.autoIncrement) {
    // Timestamp types
    if (['TIMESTAMP', 'TIMESTAMPTZ', 'DATE'].includes(column.type) && column.defaultValue.toUpperCase() === 'NOW()') {
      attributes.push('@default(now())');
    }
    // Boolean
    else if (column.type === 'BOOLEAN') {
      attributes.push(`@default(${column.defaultValue.toLowerCase()})`);
    }
    // Numeric types (no quotes)
    else if (['SMALLINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'REAL', 'DECIMAL'].includes(column.type)) {
      attributes.push(`@default(${column.defaultValue})`);
    }
    // UUID
    else if (column.type === 'UUID' && column.defaultValue.toLowerCase() === 'uuid()') {
      attributes.push('@default(uuid())');
    }
    // String types (with quotes, escape double quotes)
    else {
      const escapedValue = column.defaultValue.replace(/"/g, '\\"');
      attributes.push(`@default("${escapedValue}")`);
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
    // Integers
    case 'SMALLINT': return 'Int';
    case 'INTEGER': return 'Int';
    case 'BIGINT': return 'BigInt';
    
    // Strings
    case 'VARCHAR': return 'String';
    case 'TEXT': return 'String';
    case 'CHAR': return 'String';
    
    // Numbers
    case 'DECIMAL': return 'Decimal';
    case 'FLOAT': return 'Float';
    case 'DOUBLE': return 'Float';
    case 'REAL': return 'Float';
    
    // Date/Time
    case 'DATE': return 'DateTime';
    case 'TIME': return 'DateTime';
    case 'TIMESTAMP': return 'DateTime';
    case 'TIMESTAMPTZ': return 'DateTime';
    
    // Boolean
    case 'BOOLEAN': return 'Boolean';
    
    // Binary
    case 'BYTEA': return 'Bytes';
    case 'BLOB': return 'Bytes';
    
    // JSON
    case 'JSON': return 'Json';
    case 'JSONB': return 'Json';
    
    // PostgreSQL specific
    case 'UUID': return 'String'; // Prisma handles UUID as String with @db.Uuid
    case 'INET': return 'String';
    case 'CIDR': return 'String';
    case 'ARRAY': return 'String[]'; // Basic array support
    case 'TSVECTOR': return 'String';
    
    default: return 'String';
  }
}

/**
 * Convert string to PascalCase (for model names)
 * Handles edge cases: empty strings, spaces, multiple underscores
 */
function toPascalCase(str: string): string {
  if (!str || str.trim() === '') return 'UnnamedModel';
  
  return str
    .trim()
    .split(/[_\s]+/) // Split on underscores OR spaces
    .filter(word => word.length > 0) // Remove empty strings from consecutive separators
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase (for field names)
 * Handles edge cases: empty strings, spaces, multiple underscores
 */
function toCamelCase(str: string): string {
  if (!str || str.trim() === '') return 'unnamedField';
  
  const words = str.trim().split(/[_\s]+/).filter(word => word.length > 0);
  if (words.length === 0) return 'unnamedField';
  
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

  // Check for duplicate table names
  const tableNames = schema.tables.map(t => t.name.toLowerCase());
  const duplicateTables = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
  if (duplicateTables.length > 0) {
    errors.push(`Duplicate table names found: ${[...new Set(duplicateTables)].join(', ')}`);
  }

  // Check for SQL reserved keywords as table names
  const SQL_RESERVED = ['table', 'select', 'from', 'where', 'join', 'order', 'group', 'user', 'index', 'view', 'database', 'schema'];
  schema.tables.forEach(table => {
    if (SQL_RESERVED.includes(table.name.toLowerCase())) {
      warnings.push(`Table "${table.name}" uses a SQL reserved keyword. This may cause issues in some databases. Consider renaming to "${table.name}_table".`);
    }
  });

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

    // Check for SQL reserved keywords as column names
    const SQL_COL_RESERVED = ['user', 'order', 'group', 'table', 'index', 'key', 'value', 'rank', 'position'];
    table.columns.forEach(column => {
      if (SQL_COL_RESERVED.includes(column.name.toLowerCase())) {
        warnings.push(`Column "${table.name}.${column.name}" uses a SQL reserved keyword. Consider renaming to avoid compatibility issues.`);
      }
    });

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

            // Check for data type compatibility
            // CRITICAL: Must match ColumnEditor.tsx compatibility groups exactly
            const COMPATIBLE_TYPE_GROUPS = {
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

            let typesCompatible = column.type === refColumn.type;
            
            // Check if both types are in the same compatibility group
            if (!typesCompatible) {
              for (const group of Object.values(COMPATIBLE_TYPE_GROUPS)) {
                if (group.includes(column.type) && group.includes(refColumn.type)) {
                  typesCompatible = true;
                  break;
                }
              }
            }

            if (!typesCompatible) {
              errors.push(`Column "${table.name}.${column.name}" (${column.type}) references "${column.references.table}.${column.references.column}" (${refColumn.type}). Data types must be compatible for foreign keys.`);
            }
          }
        }
      }

      // Check for invalid VARCHAR length
      if (column.type === 'VARCHAR' && (!column.length || column.length <= 0 || column.length > 65535)) {
        errors.push(`Column "${table.name}.${column.name}" has invalid VARCHAR length: ${column.length}. Must be between 1 and 65,535.`);
      }

      // Check for invalid CHAR length
      if (column.type === 'CHAR' && (!column.length || column.length <= 0 || column.length > 255)) {
        errors.push(`Column "${table.name}.${column.name}" has invalid CHAR length: ${column.length}. Must be between 1 and 255.`);
      }

      // Check for invalid DECIMAL precision
      if (column.type === 'DECIMAL') {
        if (!column.precision || column.precision <= 0 || column.precision > 65) {
          errors.push(`Column "${table.name}.${column.name}" has invalid DECIMAL precision: ${column.precision}. Must be between 1 and 65.`);
        }
        if (column.scale !== undefined && (column.scale < 0 || column.scale > 30 || column.scale > (column.precision || 0))) {
          errors.push(`Column "${table.name}.${column.name}" has invalid DECIMAL scale: ${column.scale}. Must be between 0 and precision (${column.precision}).`);
        }
      }
    });

    // Check for composite primary keys (informational)
    const primaryKeyColumns = table.columns.filter(c => c.primaryKey);
    if (primaryKeyColumns.length > 1) {
      const pkNames = primaryKeyColumns.map(c => c.name).join(', ');
      warnings.push(`Table "${table.name}" has composite primary key: (${pkNames}). Note: AUTO_INCREMENT is not available with composite keys.`);
    }
    
    // Check for AUTO_INCREMENT with composite PK (should never happen due to validation)
    if (primaryKeyColumns.length > 1) {
      const hasAutoIncrement = primaryKeyColumns.some(c => c.autoIncrement);
      if (hasAutoIncrement) {
        errors.push(`Table "${table.name}" has AUTO INCREMENT with composite primary key. This is invalid - AUTO INCREMENT only works with single-column primary keys.`);
      }
    }
  });

  // Check for circular foreign key dependencies (basic check)
  const checkedCircularPairs = new Set<string>();
  
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
            // Create a sorted pair key to prevent duplicate warnings
            const pairKey = [table.name, column.references.table].sort().join('<->');
            
            if (!checkedCircularPairs.has(pairKey)) {
              checkedCircularPairs.add(pairKey);
              warnings.push(`Circular foreign key dependency detected between "${table.name}" and "${column.references.table}". This may cause issues with INSERT operations.`);
            }
          }
        }
      }
    });
  });

  // Check for duplicate index names across ALL tables (indexes must be globally unique)
  const allIndexNames = new Map<string, string>(); // indexName -> tableName
  schema.tables.forEach(table => {
    if (table.indexes) {
      table.indexes.forEach(index => {
        if (allIndexNames.has(index.name)) {
          errors.push(`Duplicate index name "${index.name}" found in tables "${allIndexNames.get(index.name)}" and "${table.name}". Index names must be unique across all tables.`);
        }
        allIndexNames.set(index.name, table.name);
      });
    }
  });

  // Check indexes
  schema.tables.forEach(table => {
    if (table.indexes && table.indexes.length > 0) {
      table.indexes.forEach(index => {
        // Check for empty column list
        if (!index.columns || index.columns.length === 0) {
          errors.push(`Index "${index.name}" on table "${table.name}" has no columns`);
        }

        // Check if indexed columns exist
        index.columns.forEach(colName => {
          const columnExists = table.columns.some(c => c.name === colName);
          if (!columnExists) {
            errors.push(`Index "${index.name}" on table "${table.name}" references non-existent column "${colName}"`);
          }
        });

        // Check for duplicate columns in index definition
        const uniqueCols = new Set(index.columns);
        if (uniqueCols.size !== index.columns.length) {
          errors.push(`Index "${index.name}" on table "${table.name}" has duplicate column references`);
        }
      });
    }

    // Suggest indexes for foreign key columns (performance best practice)
    table.columns.forEach(column => {
      if (column.references) {
        // Check for single-column index
        const hasSingleIndex = table.indexes?.some(idx => 
          idx.columns.length === 1 && idx.columns[0] === column.name
        );
        
        // Check for composite index with FK as leftmost column (leftmost prefix rule)
        const hasCompositeIndex = table.indexes?.some(idx => 
          idx.columns.length > 1 && idx.columns[0] === column.name
        );
        
        // Only warn if column has no index at all
        if (!hasSingleIndex && !hasCompositeIndex) {
          warnings.push(`Foreign key column "${table.name}.${column.name}" should have an index for better JOIN performance`);
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

