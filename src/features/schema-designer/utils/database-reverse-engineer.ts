/**
 * Database Reverse Engineering Utilities
 * Extract schema information from live databases
 */

import { SchemaState, SchemaTable, SchemaColumn, SchemaIndex, SQLDataType } from '../types';

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite';

export interface DatabaseConnectionConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  file?: File | null;
}

/**
 * Map database-specific types to our SQLDataType
 */
function mapDatabaseTypeToSQLType(
  dbType: string,
  databaseType: DatabaseType
): SQLDataType {
  const normalized = dbType.toLowerCase().trim();

  // PostgreSQL types
  if (databaseType === 'postgresql') {
    if (normalized.includes('int') && normalized.includes('big')) return 'BIGINT';
    if (normalized.includes('int') && normalized.includes('small')) return 'SMALLINT';
    if (normalized.includes('int')) return 'INTEGER';
    if (normalized.includes('varchar')) return 'VARCHAR';
    if (normalized.includes('text')) return 'TEXT';
    if (normalized.includes('char') && !normalized.includes('var')) return 'CHAR';
    if (normalized.includes('decimal') || normalized.includes('numeric')) return 'DECIMAL';
    if (normalized.includes('float')) return 'FLOAT';
    if (normalized.includes('double')) return 'DOUBLE';
    if (normalized.includes('real')) return 'REAL';
    if (normalized.includes('date') && !normalized.includes('time')) return 'DATE';
    if (normalized.includes('time') && !normalized.includes('date')) return 'TIME';
    if (normalized.includes('timestamp')) return normalized.includes('tz') ? 'TIMESTAMPTZ' : 'TIMESTAMP';
    if (normalized.includes('bool')) return 'BOOLEAN';
    if (normalized.includes('bytea')) return 'BYTEA';
    if (normalized.includes('jsonb')) return 'JSONB';
    if (normalized.includes('json')) return 'JSON';
    if (normalized.includes('uuid')) return 'UUID';
    if (normalized.includes('inet')) return 'INET';
    if (normalized.includes('cidr')) return 'CIDR';
    if (normalized.includes('array')) return 'ARRAY';
    if (normalized.includes('tsvector')) return 'TSVECTOR';
  }

  // MySQL types
  if (databaseType === 'mysql') {
    if (normalized.includes('int') && normalized.includes('big')) return 'BIGINT';
    if (normalized.includes('int') && normalized.includes('small')) return 'SMALLINT';
    if (normalized.includes('int')) return 'INTEGER';
    if (normalized.includes('varchar')) return 'VARCHAR';
    if (normalized.includes('text')) return 'TEXT';
    if (normalized.includes('char') && !normalized.includes('var')) return 'CHAR';
    if (normalized.includes('decimal') || normalized.includes('numeric')) return 'DECIMAL';
    if (normalized.includes('float')) return 'FLOAT';
    if (normalized.includes('double')) return 'DOUBLE';
    if (normalized.includes('real')) return 'REAL';
    if (normalized.includes('date') && !normalized.includes('time')) return 'DATE';
    if (normalized.includes('time') && !normalized.includes('date')) return 'TIME';
    if (normalized.includes('timestamp') || normalized.includes('datetime')) return 'TIMESTAMP';
    if (normalized.includes('bool') || normalized.includes('tinyint(1)')) return 'BOOLEAN';
    if (normalized.includes('blob')) return 'BLOB';
    if (normalized.includes('json')) return 'JSON';
  }

  // SQLite types (very flexible)
  if (databaseType === 'sqlite') {
    if (normalized.includes('int')) return 'INTEGER';
    if (normalized.includes('text')) return 'TEXT';
    if (normalized.includes('real')) return 'REAL';
    if (normalized.includes('blob')) return 'BLOB';
    // SQLite doesn't have strict types, default to common ones
    if (normalized.includes('varchar') || normalized.includes('char')) return 'VARCHAR';
    if (normalized.includes('bool')) return 'BOOLEAN';
    if (normalized.includes('date') || normalized.includes('time')) return 'TIMESTAMP';
  }

  // Default fallback
  return 'TEXT';
}

/**
 * Extract VARCHAR length from database type string
 */
function extractLength(dbType: string): number | undefined {
  const match = dbType.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Reverse engineer schema from PostgreSQL
 * Calls the API route to perform reverse engineering
 */
export async function reverseEngineerPostgreSQL(
  connectionConfig: DatabaseConnectionConfig
): Promise<SchemaState> {
  const response = await fetch('/api/database/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'postgresql',
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      username: connectionConfig.username,
      password: connectionConfig.password,
      connectionString: connectionConfig.connectionString,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to reverse engineer PostgreSQL database');
  }

  if (!data.schema) {
    throw new Error('No schema data returned from server');
  }

  return data.schema;
}

/**
 * Reverse engineer schema from MySQL
 * Calls the API route to perform reverse engineering
 */
export async function reverseEngineerMySQL(
  connectionConfig: DatabaseConnectionConfig
): Promise<SchemaState> {
  const response = await fetch('/api/database/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'mysql',
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      username: connectionConfig.username,
      password: connectionConfig.password,
      connectionString: connectionConfig.connectionString,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to reverse engineer MySQL database');
  }

  if (!data.schema) {
    throw new Error('No schema data returned from server');
  }

  return data.schema;
}

/**
 * Reverse engineer schema from SQLite
 * Uses sql.js in the browser
 */
export async function reverseEngineerSQLite(file: File): Promise<SchemaState> {
  // This will use sql.js to read the SQLite file
  // For now, return a placeholder
  throw new Error('SQLite reverse engineering requires sql.js implementation');
}

/**
 * Convert raw database table info to SchemaTable
 */
export function convertDatabaseTableToSchemaTable(
  rawTable: any,
  databaseType: DatabaseType,
  tableIndex: number = 0
): SchemaTable {
  const columns: SchemaColumn[] = (rawTable.columns || []).map((col: any, idx: number) => {
    const sqlType = mapDatabaseTypeToSQLType(col.type || col.dataType || 'TEXT', databaseType);
    const length = extractLength(col.type || col.dataType || '');

    return {
      id: `col-${rawTable.name}-${idx}`,
      name: col.name || col.columnName || `column_${idx}`,
      type: sqlType,
      length: length,
      nullable: col.nullable !== false && col.isNullable !== false,
      unique: col.unique === true || col.isUnique === true,
      primaryKey: col.primaryKey === true || col.isPrimaryKey === true,
      autoIncrement: col.autoIncrement === true || col.isAutoIncrement === true,
      defaultValue: col.defaultValue || col.default || undefined,
      comment: col.comment || col.description || undefined,
      references: col.foreignKey
        ? {
            table: col.foreignKey.referencedTable || col.foreignKey.table,
            column: col.foreignKey.referencedColumn || col.foreignKey.column,
            onDelete: (col.foreignKey.onDelete as any) || 'RESTRICT',
            onUpdate: (col.foreignKey.onUpdate as any) || 'RESTRICT',
          }
        : undefined,
    };
  });

  const indexes: SchemaIndex[] = (rawTable.indexes || []).map((idx: any, idxIndex: number) => ({
    id: `idx-${rawTable.name}-${idxIndex}`,
    name: idx.name || `index_${idxIndex}`,
    columns: idx.columns || idx.columnNames || [],
    type: (idx.type || 'BTREE') as any,
    unique: idx.unique === true || idx.isUnique === true,
    comment: idx.comment || undefined,
  }));

  return {
    id: `table-${rawTable.name}`,
    name: rawTable.name || rawTable.tableName || `table_${tableIndex}`,
    position: {
      x: (tableIndex % 3) * 300 + 100,
      y: Math.floor(tableIndex / 3) * 400 + 100,
    },
    columns,
    indexes,
  };
}

/**
 * Main reverse engineering function
 */
export async function reverseEngineerDatabase(
  connectionConfig: DatabaseConnectionConfig
): Promise<SchemaState> {
  const { type } = connectionConfig;

  switch (type) {
    case 'postgresql':
      return reverseEngineerPostgreSQL(connectionConfig);
    case 'mysql':
      return reverseEngineerMySQL(connectionConfig);
    case 'sqlite':
      if (!connectionConfig.file) {
        throw new Error('SQLite file is required');
      }
      return reverseEngineerSQLite(connectionConfig.file);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

