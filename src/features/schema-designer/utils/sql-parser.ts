/**
 * SQL Parser
 * Parses SQL CREATE TABLE statements into SchemaState
 */

import { SchemaState, SchemaTable, SchemaColumn, SQLDataType, CascadeAction, IndexType } from '../types';

/**
 * Parse SQL schema (supports PostgreSQL, MySQL, SQLite)
 */
export async function parseSQLSchema(sql: string): Promise<SchemaState> {
  const tables: SchemaTable[] = [];
  const indexes: { tableName: string; sql: string }[] = [];
  
  // Check for unsupported statements
  if (/ALTER\s+TABLE/i.test(sql)) {
    console.warn('ALTER TABLE statements detected - these will be ignored. Only CREATE TABLE statements are imported.');
  }
  
  if (/DROP\s+TABLE/i.test(sql)) {
    console.warn('DROP TABLE statements detected - these will be ignored.');
  }
  
  // Normalize SQL
  const normalized = sql
    .replace(/--[^\n]*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/;+\s*$/g, ';') // Normalize trailing semicolons
    .trim();

  // Validate input
  if (!normalized) {
    throw new Error('Input is empty. Please paste your SQL schema.');
  }

  // Validate parentheses are balanced globally
  const openParens = (normalized.match(/\(/g) || []).length;
  const closeParens = (normalized.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    throw new Error(`Unbalanced parentheses detected. Found ${openParens} opening "(" and ${closeParens} closing ")". Check your SQL syntax.`);
  }

  // Extract CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?)(\w+)\1\s*\(([\s\S]*?)\);/gi;
  const tableMatches = Array.from(normalized.matchAll(tableRegex));

  if (tableMatches.length === 0) {
    // Provide helpful error message
    if (/CREATE\s+TABLE/i.test(normalized)) {
      // Check for specific issues
      if (!/\);/i.test(normalized)) {
        throw new Error('CREATE TABLE statements found but missing closing ");". Make sure each CREATE TABLE ends with ");');
      }
      throw new Error('CREATE TABLE statements found but could not be parsed. Check for:\n- Missing semicolons (;)\n- Unmatched parentheses\n- Incomplete table definitions');
    }
    throw new Error('No CREATE TABLE statements found. Please paste SQL with CREATE TABLE syntax.');
  }

  // Extract CREATE INDEX statements
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?)(\w+)\1\s+ON\s+([`"]?)(\w+)\3\s*\(([\s\S]*?)\);/gi;
  const indexMatches = Array.from(normalized.matchAll(indexRegex));
  
  // Check for incomplete CREATE INDEX statements
  const allCreateIndexCount = (normalized.match(/CREATE\s+(?:UNIQUE\s+)?INDEX/gi) || []).length;
  if (allCreateIndexCount > indexMatches.length) {
    throw new Error(`Found ${allCreateIndexCount} CREATE INDEX keyword${allCreateIndexCount !== 1 ? 's' : ''} but only ${indexMatches.length} complete index definition${indexMatches.length !== 1 ? 's' : ''}. Check for:\n- Missing "ON table_name(column)" clause\n- Missing semicolon (;) at end of CREATE INDEX`);
  }
  
  indexMatches.forEach(match => {
    indexes.push({
      tableName: match[4],
      sql: match[0],
    });
  });

  // Check for incomplete CREATE TABLE statements (orphaned keywords)
  const allCreateTableCount = (normalized.match(/CREATE\s+TABLE/gi) || []).length;
  if (allCreateTableCount > tableMatches.length) {
    throw new Error(`Found ${allCreateTableCount} CREATE TABLE keyword${allCreateTableCount !== 1 ? 's' : ''} but only ${tableMatches.length} complete table definition${tableMatches.length !== 1 ? 's' : ''}. Check for:\n- Missing closing ");" for each table\n- Incomplete table definitions`);
  }

  // Parse each table
  let yPosition = 100;
  const parseErrors: string[] = [];
  
  tableMatches.forEach((match, tableIndex) => {
    const tableName = match[2];
    const tableBody = match[3];

    try {
      const table = parseTable(tableName, tableBody, tableIndex, yPosition);
      
      // Add indexes for this table
      const tableIndexes = indexes.filter(idx => idx.tableName === tableName);
      tableIndexes.forEach(idx => {
        const parsedIndex = parseIndexStatement(idx.sql, table.name);
        if (parsedIndex && table.indexes) {
          table.indexes.push(parsedIndex);
        }
      });
      
      tables.push(table);
      
      // Position tables in grid
      yPosition += 200;
      if ((tableIndex + 1) % 3 === 0) {
        yPosition = 100;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      parseErrors.push(`Table "${tableName}": ${errorMsg}`);
    }
  });

  // If any tables failed to parse, throw error
  if (parseErrors.length > 0) {
    throw new Error(`Failed to parse ${parseErrors.length} table${parseErrors.length !== 1 ? 's' : ''}:\n\n${parseErrors.join('\n')}`);
  }

  // Validate reasonable table count (prevent memory issues)
  if (tables.length > 100) {
    throw new Error(`Schema has ${tables.length} tables - maximum supported is 100 tables. For very large schemas, consider splitting into multiple schemas or importing in batches.`);
  }

  if (tables.length > 50) {
    console.warn(`Schema has ${tables.length} tables - this may impact performance. Consider using auto-layout to organize them.`);
  }

  // VALIDATION LAYER: Schema-level validations
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  // Check 1: Duplicate table names
  const tableNames = tables.map(t => t.name.toLowerCase());
  const duplicates = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    validationErrors.push(`Duplicate table names: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check 2: Reserved SQL keywords as table names
  const RESERVED_KEYWORDS = ['USER', 'TABLE', 'INDEX', 'SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'ON', 'USING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
  tables.forEach(table => {
    if (RESERVED_KEYWORDS.includes(table.name.toUpperCase())) {
      validationWarnings.push(`Table "${table.name}" is a SQL reserved keyword - consider using a different name or quoting it`);
    }
  });

  // Check 3: Table names too long (>63 chars for PostgreSQL)
  tables.forEach(table => {
    if (table.name.length > 63) {
      validationWarnings.push(`Table "${table.name}" exceeds 63 characters (PostgreSQL limit) - may cause issues`);
    }
    
    // Check for invalid characters in table names
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table.name)) {
      validationWarnings.push(`Table "${table.name}" contains special characters - should only use letters, numbers, and underscores, starting with a letter or underscore`);
    }
    
    // Check for leading numbers
    if (/^\d/.test(table.name)) {
      validationWarnings.push(`Table "${table.name}" starts with a number - this may require quoting in queries`);
    }
  });

  // Check 4: Foreign key references point to existing tables
  const tableNameSet = new Set(tables.map(t => t.name.toLowerCase()));
  const invalidFKs: string[] = [];
  
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.references) {
        const refTable = col.references.table.toLowerCase();
        if (!tableNameSet.has(refTable)) {
          invalidFKs.push(`${table.name}.${col.name} → ${col.references.table} (table not found)`);
        }
      }
    });
  });
  
  if (invalidFKs.length > 0) {
    validationErrors.push(`Foreign key references to non-existent tables:\n${invalidFKs.join('\n')}`);
  }

  // Check 5: Foreign key data type compatibility
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.references) {
        const refTable = tables.find(t => t.name.toLowerCase() === col.references!.table.toLowerCase());
        if (refTable) {
          const refColumn = refTable.columns.find(c => c.name.toLowerCase() === col.references!.column.toLowerCase());
          if (refColumn) {
            // Check data type compatibility
            const compatibleTypes = areTypesCompatible(col.type, refColumn.type);
            if (!compatibleTypes) {
              validationWarnings.push(`${table.name}.${col.name} (${col.type}) references ${refTable.name}.${refColumn.name} (${refColumn.type}) - data types should match for foreign keys`);
            }
            
            // Warn if FK references a non-primary, non-unique column
            if (!refColumn.primaryKey && !refColumn.unique) {
              validationWarnings.push(`${table.name}.${col.name} references ${refTable.name}.${refColumn.name} which is not a primary key or unique column - this may cause performance issues`);
            }
          } else {
            validationErrors.push(`${table.name}.${col.name} references non-existent column ${refTable.name}.${col.references.column}`);
          }
        }
      }
    });
  });

  // Check 6: Circular foreign key dependencies (self-referencing is OK, but cycles are warnings)
  const circularDeps = detectCircularDependencies(tables);
  if (circularDeps.length > 0) {
    circularDeps.forEach(cycle => {
      validationWarnings.push(`Circular dependency: ${cycle.join(' → ')}. This may cause issues with INSERT operations.`);
    });
  }

  // Check 7: Multiple AUTO_INCREMENT columns per table
  tables.forEach(table => {
    const autoIncrementCols = table.columns.filter(c => c.autoIncrement);
    if (autoIncrementCols.length > 1) {
      validationErrors.push(`Table "${table.name}" has ${autoIncrementCols.length} AUTO_INCREMENT columns (${autoIncrementCols.map(c => c.name).join(', ')}). Only one is allowed per table.`);
    }
  });

  // Check 8: Duplicate column names within table
  tables.forEach(table => {
    const colNames = table.columns.map(c => c.name.toLowerCase());
    const dupCols = colNames.filter((name, index) => colNames.indexOf(name) !== index);
    if (dupCols.length > 0) {
      validationErrors.push(`Table "${table.name}" has duplicate column names: ${[...new Set(dupCols)].join(', ')}`);
    }
  });

  // Check 9: Reserved keywords as column names
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (RESERVED_KEYWORDS.includes(col.name.toUpperCase())) {
        validationWarnings.push(`Column "${table.name}.${col.name}" is a SQL reserved keyword - may require quoting in queries`);
      }
      
      // Check for special characters in column names
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name)) {
        validationWarnings.push(`Column "${table.name}.${col.name}" contains special characters - should only use letters, numbers, and underscores`);
      }
    });
  });

  // Check 10: Foreign keys referencing AUTO_INCREMENT columns (best practice check)
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.references) {
        const refTable = tables.find(t => t.name.toLowerCase() === col.references!.table.toLowerCase());
        if (refTable) {
          const refColumn = refTable.columns.find(c => c.name.toLowerCase() === col.references!.column.toLowerCase());
          if (refColumn?.autoIncrement && !col.primaryKey) {
            // This is actually good - FKs often reference auto-increment PKs
            // Just make sure FK column doesn't have autoIncrement itself
            if (col.autoIncrement) {
              validationWarnings.push(`Column "${table.name}.${col.name}" has AUTO_INCREMENT and is a foreign key - this is unusual and may cause conflicts`);
            }
          }
        }
      }
    });
  });

  // Check 11: Too many columns per table (>100 is a smell)
  tables.forEach(table => {
    if (table.columns.length > 100) {
      validationWarnings.push(`Table "${table.name}" has ${table.columns.length} columns - consider normalizing into multiple related tables`);
    }
  });

  // Throw errors if any critical issues found
  if (validationErrors.length > 0) {
    throw new Error(`Schema validation failed:\n\n${validationErrors.join('\n\n')}\n\nPlease fix these issues and try again.`);
  }

  // Log warnings (non-blocking)
  if (validationWarnings.length > 0) {
    console.warn('Schema imported with warnings:');
    validationWarnings.forEach(warn => console.warn(`- ${warn}`));
  }

  return {
    name: 'Imported Schema',
    description: `Imported ${tables.length} table${tables.length !== 1 ? 's' : ''} from SQL${validationWarnings.length > 0 ? ` (${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''})` : ''}`,
    tables,
  };
}

/**
 * Check if two data types are compatible for FK relationships
 */
function areTypesCompatible(type1: SQLDataType, type2: SQLDataType): boolean {
  // Exact match
  if (type1 === type2) return true;
  
  // Integer family
  const intTypes: SQLDataType[] = ['SMALLINT', 'INTEGER', 'BIGINT'];
  if (intTypes.includes(type1) && intTypes.includes(type2)) return true;
  
  // Float family
  const floatTypes: SQLDataType[] = ['FLOAT', 'DOUBLE', 'REAL'];
  if (floatTypes.includes(type1) && floatTypes.includes(type2)) return true;
  
  // String family
  const stringTypes: SQLDataType[] = ['VARCHAR', 'TEXT', 'CHAR'];
  if (stringTypes.includes(type1) && stringTypes.includes(type2)) return true;
  
  // Timestamp family
  const timestampTypes: SQLDataType[] = ['TIMESTAMP', 'TIMESTAMPTZ'];
  if (timestampTypes.includes(type1) && timestampTypes.includes(type2)) return true;
  
  return false;
}

/**
 * Detect circular foreign key dependencies
 */
function detectCircularDependencies(tables: SchemaTable[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  // Build adjacency list
  const graph = new Map<string, Set<string>>();
  tables.forEach(table => {
    graph.set(table.name.toLowerCase(), new Set());
  });
  
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.references) {
        const from = table.name.toLowerCase();
        const to = col.references.table.toLowerCase();
        if (from !== to) { // Ignore self-references
          graph.get(from)?.add(to);
        }
      }
    });
  });
  
  // DFS to detect cycles
  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycle.push(neighbor);
        cycles.push(cycle);
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  // Check each table
  tables.forEach(table => {
    const name = table.name.toLowerCase();
    if (!visited.has(name)) {
      dfs(name, []);
    }
  });
  
  return cycles;
}

/**
 * Parse a single CREATE TABLE statement
 */
function parseTable(
  tableName: string,
  tableBody: string,
  index: number,
  yPosition: number
): SchemaTable {
  const columns: SchemaColumn[] = [];
  const indexes: any[] = [];
  
  // Split by commas (but not within parentheses)
  const lines = splitByComma(tableBody);
  
  // Primary key columns (for composite PKs)
  const primaryKeyColumns: string[] = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;
    
    // Check for PRIMARY KEY constraint
    if (/PRIMARY\s+KEY\s*\(/i.test(trimmed)) {
      const pkMatch = trimmed.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
      if (pkMatch) {
        const pkCols = pkMatch[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
        primaryKeyColumns.push(...pkCols);
      }
      return;
    }
    
    // Check for FOREIGN KEY constraint
    if (/FOREIGN\s+KEY\s*\(/i.test(trimmed)) {
      // Will be handled by column REFERENCES parsing
      return;
    }
    
    // Check for UNIQUE constraint
    if (/UNIQUE\s*\(/i.test(trimmed)) {
      // Handle as index
      return;
    }
    
    // Check for INDEX/KEY
    if (/(?:INDEX|KEY)\s+/i.test(trimmed) && !trimmed.match(/^\w+\s+/)) {
      // Table-level index definition
      return;
    }
    
    // Parse column definition
    const column = parseColumn(trimmed, tableName);
    if (column) {
      columns.push(column);
    }
  });
  
  // Validate table has columns
  if (columns.length === 0) {
    console.warn(`Table "${tableName}" has no columns - skipping`);
    throw new Error(`Table "${tableName}" has no valid columns. Each table must have at least one column.`);
  }

  // Apply composite primary key
  if (primaryKeyColumns.length > 0) {
    columns.forEach(col => {
      if (primaryKeyColumns.includes(col.name)) {
        col.primaryKey = true;
        col.nullable = false;
        // Don't set autoIncrement for composite PKs
        if (primaryKeyColumns.length > 1) {
          col.autoIncrement = false;
        }
      }
    });
  }

  // Validate at least one primary key exists
  const hasPrimaryKey = columns.some(c => c.primaryKey);
  if (!hasPrimaryKey) {
    console.warn(`Table "${tableName}" has no primary key - consider adding one`);
  }

  // Validate column-level constraints
  columns.forEach(col => {
    // VARCHAR without length
    if (col.type === 'VARCHAR' && !col.length) {
      console.warn(`Column "${tableName}.${col.name}" is VARCHAR without length - defaulting to 255`);
      col.length = 255;
    }
    
    // CHAR without length
    if (col.type === 'CHAR' && !col.length) {
      console.warn(`Column "${tableName}.${col.name}" is CHAR without length - defaulting to 1`);
      col.length = 1;
    }
    
    // DECIMAL without precision
    if (col.type === 'DECIMAL' && !col.precision) {
      console.warn(`Column "${tableName}.${col.name}" is DECIMAL without precision - defaulting to DECIMAL(10,2)`);
      col.precision = 10;
      col.scale = 2;
    }
    
    // VARCHAR length validation
    if (col.type === 'VARCHAR' && col.length) {
      if (col.length > 65535) {
        throw new Error(`Column "${tableName}.${col.name}" has VARCHAR(${col.length}) - maximum is 65,535. Use TEXT for longer strings.`);
      }
      if (col.length < 1) {
        throw new Error(`Column "${tableName}.${col.name}" has VARCHAR(${col.length}) - minimum length is 1.`);
      }
    }
    
    // CHAR length validation
    if (col.type === 'CHAR' && col.length) {
      if (col.length > 255) {
        throw new Error(`Column "${tableName}.${col.name}" has CHAR(${col.length}) - maximum is 255. Use VARCHAR or TEXT instead.`);
      }
      if (col.length < 1) {
        throw new Error(`Column "${tableName}.${col.name}" has CHAR(${col.length}) - minimum length is 1.`);
      }
    }
    
    // DECIMAL precision/scale validation
    if (col.type === 'DECIMAL') {
      if (col.precision && (col.precision < 1 || col.precision > 65)) {
        throw new Error(`Column "${tableName}.${col.name}" has DECIMAL(${col.precision},${col.scale || 0}) - precision must be between 1 and 65.`);
      }
      if (col.scale && col.precision && col.scale > col.precision) {
        throw new Error(`Column "${tableName}.${col.name}" has DECIMAL(${col.precision},${col.scale}) - scale cannot exceed precision.`);
      }
      if (col.scale && (col.scale < 0 || col.scale > 30)) {
        throw new Error(`Column "${tableName}.${col.name}" has DECIMAL(${col.precision},${col.scale}) - scale must be between 0 and 30.`);
      }
    }
    
    // UNIQUE + nullable warning (can cause issues)
    if (col.unique && col.nullable) {
      console.warn(`Column "${tableName}.${col.name}" is UNIQUE and nullable - multiple NULL values are allowed in most databases`);
    }
    
    // AUTO_INCREMENT requires NOT NULL and numeric type
    if (col.autoIncrement) {
      if (col.nullable) {
        console.warn(`Column "${tableName}.${col.name}" is AUTO_INCREMENT but nullable - forcing NOT NULL`);
        col.nullable = false;
      }
      if (!['SMALLINT', 'INTEGER', 'BIGINT'].includes(col.type)) {
        console.warn(`Column "${tableName}.${col.name}" is AUTO_INCREMENT but type is ${col.type} - should be INTEGER, SMALLINT, or BIGINT`);
      }
    }
  });

  return {
    id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${tableName}`,
    name: tableName,
    columns,
    indexes: indexes || [], // Initialize empty array if undefined
    position: {
      x: 100 + ((index % 3) * 400),
      y: yPosition,
    },
  };
}

/**
 * Parse a column definition
 */
function parseColumn(line: string, tableName: string): SchemaColumn | null {
  // Extract column name (first word)
  const nameMatch = line.match(/^([`"]?)(\w+)\1/);
  if (!nameMatch) return null;
  
  const columnName = nameMatch[2];
  
  // Validate column name length (max 64 chars for most databases)
  if (columnName.length > 64) {
    console.warn(`Column "${columnName}" exceeds 64 characters - may cause issues in some databases`);
  }
  
  // Remove column name from line
  const rest = line.substring(nameMatch[0].length).trim();
  
  // Extract data type
  const typeInfo = extractDataType(rest);
  if (!typeInfo) {
    console.warn(`Could not parse data type for column "${columnName}" in table "${tableName}"`);
    return null;
  }
  
  // Validate NOT NULL and DEFAULT conflict
  const isNotNull = /NOT\s+NULL/i.test(rest);
  const hasDefault = /DEFAULT/i.test(rest);
  const isNullable = !isNotNull;
  
  // Check for contradictory NULL DEFAULT
  if (isNotNull && /DEFAULT\s+NULL/i.test(rest)) {
    console.warn(`Column "${columnName}" is NOT NULL but has DEFAULT NULL - removing DEFAULT`);
  }
  
  const column: SchemaColumn = {
    id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${columnName}`,
    name: columnName,
    type: typeInfo.type,
    length: typeInfo.length,
    precision: typeInfo.precision,
    scale: typeInfo.scale,
    nullable: isNullable,
    unique: /UNIQUE/i.test(rest),
    primaryKey: /PRIMARY\s+KEY/i.test(rest),
    autoIncrement: /(?:AUTO_INCREMENT|AUTOINCREMENT|SERIAL|BIGSERIAL|SMALLSERIAL)/i.test(rest),
  };
  
  // Extract default value
  const defaultMatch = rest.match(/DEFAULT\s+(.+?)(?:\s+(?:REFERENCES|CONSTRAINT|,|$))/i);
  if (defaultMatch && !(isNotNull && /DEFAULT\s+NULL/i.test(rest))) {
    let defaultValue = defaultMatch[1].trim();
    // Skip if DEFAULT NULL
    if (defaultValue.toUpperCase() === 'NULL') {
      // Only set if column is nullable
      if (isNullable) {
        column.defaultValue = undefined; // NULL is default for nullable
      }
    } else {
      // Remove quotes if present
      defaultValue = defaultValue.replace(/^['"]|['"]$/g, '');
      // Handle NOW(), CURRENT_TIMESTAMP, etc.
      if (/NOW\(\)|CURRENT_TIMESTAMP/i.test(defaultValue)) {
        defaultValue = 'NOW()';
      }
      column.defaultValue = defaultValue;
    }
  }
  
  // Extract foreign key reference
  const fkMatch = rest.match(/REFERENCES\s+([`"]?)(\w+)\1\s*\(\s*([`"]?)(\w+)\3\s*\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
  if (fkMatch) {
    // Normalize CASCADE actions
    const normalizeCascadeAction = (action?: string): CascadeAction => {
      if (!action) return 'RESTRICT';
      const normalized = action.toUpperCase().replace(/\s+/g, ' ');
      // Validate CASCADE action
      const validActions: CascadeAction[] = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];
      if (validActions.includes(normalized as CascadeAction)) {
        return normalized as CascadeAction;
      }
      console.warn(`Invalid CASCADE action "${action}" - defaulting to RESTRICT`);
      return 'RESTRICT';
    };

    column.references = {
      table: fkMatch[2],
      column: fkMatch[4],
      onDelete: normalizeCascadeAction(fkMatch[5]),
      onUpdate: normalizeCascadeAction(fkMatch[6]),
    };
  }
  
  return column;
}

/**
 * Extract data type and parameters from column definition
 */
function extractDataType(definition: string): {
  type: SQLDataType;
  length?: number;
  precision?: number;
  scale?: number;
} | null {
  // Handle SERIAL types (PostgreSQL)
  if (/SERIAL/i.test(definition)) {
    if (/BIGSERIAL/i.test(definition)) {
      return { type: 'BIGINT' };
    } else if (/SMALLSERIAL/i.test(definition)) {
      return { type: 'SMALLINT' };
    }
    return { type: 'INTEGER' };
  }
  
  // Match type with optional parameters: TYPE(length) or TYPE(precision, scale)
  const match = definition.match(/^(\w+)(?:\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\))?/i);
  if (!match) return null;
  
  const typeName = match[1].toUpperCase();
  const param1 = match[2] ? parseInt(match[2], 10) : undefined;
  const param2 = match[3] ? parseInt(match[3], 10) : undefined;
  
  // Map SQL types to our SQLDataType
  const typeMap: Record<string, SQLDataType> = {
    // Integers
    'TINYINT': 'SMALLINT',
    'SMALLINT': 'SMALLINT',
    'MEDIUMINT': 'INTEGER',
    'INT': 'INTEGER',
    'INTEGER': 'INTEGER',
    'BIGINT': 'BIGINT',
    'SERIAL': 'INTEGER',
    'BIGSERIAL': 'BIGINT',
    'SMALLSERIAL': 'SMALLINT',
    // Strings
    'VARCHAR': 'VARCHAR',
    'CHAR': 'CHAR',
    'CHARACTER': 'CHAR',
    'TEXT': 'TEXT',
    'TINYTEXT': 'TEXT',
    'MEDIUMTEXT': 'TEXT',
    'LONGTEXT': 'TEXT',
    // Numbers
    'DECIMAL': 'DECIMAL',
    'NUMERIC': 'DECIMAL',
    'FLOAT': 'FLOAT',
    'DOUBLE': 'DOUBLE',
    'REAL': 'REAL',
    // Date/Time
    'DATE': 'DATE',
    'TIME': 'TIME',
    'DATETIME': 'TIMESTAMP',
    'TIMESTAMP': 'TIMESTAMP',
    'TIMESTAMPTZ': 'TIMESTAMPTZ',
    // Boolean
    'BOOLEAN': 'BOOLEAN',
    'BOOL': 'BOOLEAN',
    'TINYINT(1)': 'BOOLEAN',
    // Binary
    'BYTEA': 'BYTEA',
    'BLOB': 'BLOB',
    'BINARY': 'BLOB',
    'VARBINARY': 'BLOB',
    // JSON
    'JSON': 'JSON',
    'JSONB': 'JSONB',
    // PostgreSQL specific
    'UUID': 'UUID',
    'INET': 'INET',
    'CIDR': 'CIDR',
    'ARRAY': 'ARRAY',
    'TSVECTOR': 'TSVECTOR',
  };
  
  const mappedType = typeMap[typeName];
  if (!mappedType) {
    // Default to VARCHAR if unknown
    return { type: 'VARCHAR', length: 255 };
  }
  
  // Handle parameters based on type
  if (mappedType === 'VARCHAR' || mappedType === 'CHAR') {
    return { type: mappedType, length: param1 };
  }
  
  if (mappedType === 'DECIMAL') {
    return { type: mappedType, precision: param1, scale: param2 };
  }
  
  return { type: mappedType };
}

/**
 * Parse CREATE INDEX statement
 */
function parseIndexStatement(sql: string, tableName: string): any | null {
  const match = sql.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?)(\w+)\2\s+ON\s+([`"]?)(\w+)\4\s*\(\s*([^)]+)\s*\)/i);
  
  if (!match) return null;
  
  const isUnique = !!match[1];
  const indexName = match[3];
  const columns = match[6].split(',').map(c => c.trim().replace(/[`"]/g, ''));
  
  return {
    id: `idx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: indexName,
    columns,
    type: 'BTREE' as IndexType,
    unique: isUnique,
    comment: 'Imported from SQL',
  };
}

/**
 * Split by comma but respect parentheses
 */
function splitByComma(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    result.push(current.trim());
  }
  
  return result;
}

