/**
 * Database Service Layer
 * Handles database connections and reverse engineering
 * Separated from API routes for better testability and reusability
 */

import { Pool, Client } from 'pg';
import mysql from 'mysql2/promise';
import { SchemaState, SchemaTable, SchemaColumn, SchemaIndex, SQLDataType } from '../types';

export type DatabaseType = 'postgresql' | 'mysql';

export interface DatabaseConnectionConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionString?: string;
}

export interface DatabaseConnectionResult {
  success: boolean;
  schema?: SchemaState;
  error?: string;
}

/**
 * Map PostgreSQL types to our SQLDataType
 */
function mapPostgreSQLTypeToSQLType(pgType: string): SQLDataType {
  const normalized = pgType.toLowerCase().trim();

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
  if (normalized.includes('time') && !normalized.includes('date') && !normalized.includes('stamp')) return 'TIME';
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

  return 'TEXT'; // Default fallback
}

/**
 * Map MySQL types to our SQLDataType
 */
function mapMySQLTypeToSQLType(mysqlType: string): SQLDataType {
  const normalized = mysqlType.toLowerCase().trim();

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
  if (normalized.includes('time') && !normalized.includes('date') && !normalized.includes('stamp')) return 'TIME';
  if (normalized.includes('timestamp') || normalized.includes('datetime')) return 'TIMESTAMP';
  if (normalized.includes('bool') || normalized.includes('tinyint(1)')) return 'BOOLEAN';
  if (normalized.includes('blob')) return 'BLOB';
  if (normalized.includes('json')) return 'JSON';

  return 'TEXT'; // Default fallback
}

/**
 * Extract length from type string (e.g., VARCHAR(255) -> 255)
 */
function extractLength(typeString: string): number | undefined {
  const match = typeString.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Parse PostgreSQL connection string and extract config
 * Supports standard postgresql:// format with query parameters
 */
function parsePostgreSQLConnectionString(connectionString: string): Partial<DatabaseConnectionConfig> {
  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    
    // Parse SSL mode from query params (sslmode=require, prefer, disable, etc.)
    const sslMode = params.get('sslmode') || 'prefer';
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading /
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  } catch (error) {
    throw new Error('Invalid PostgreSQL connection string format');
  }
}

/**
 * Determine SSL configuration based on connection string or defaults
 */
function getSSLConfig(connectionString?: string): boolean | { rejectUnauthorized: boolean } {
  if (!connectionString) {
    // Default: require SSL but allow self-signed (common for RDS, cloud providers)
    return {
      rejectUnauthorized: false,
    };
  }

  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    const sslMode = params.get('sslmode')?.toLowerCase();

    switch (sslMode) {
      case 'require':
      case 'prefer':
        // Require SSL but allow self-signed certificates
        return {
          rejectUnauthorized: false,
        };
      case 'verify-full':
      case 'verify-ca':
        // Strict SSL verification (would need CA certs)
        return {
          rejectUnauthorized: true,
        };
      case 'disable':
        return false;
      default:
        // Default: prefer SSL
        return {
          rejectUnauthorized: false,
        };
    }
  } catch {
    // If parsing fails, use safe default
    return {
      rejectUnauthorized: false,
    };
  }
}

/**
 * Reverse engineer PostgreSQL database
 */
export async function reverseEngineerPostgreSQL(
  config: DatabaseConnectionConfig
): Promise<SchemaState> {
  // Parse connection string if provided, otherwise use individual fields
  let connectionConfig: any = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectionTimeoutMillis: 30000, // 30 second timeout (increased for large databases)
  };

  // If connection string is provided, parse it and merge with individual fields
  if (config.connectionString) {
    const parsed = parsePostgreSQLConnectionString(config.connectionString);
    connectionConfig = {
      ...connectionConfig,
      ...parsed,
      user: parsed.username || connectionConfig.user,
    };
  }

  // Determine SSL configuration
  const sslConfig = getSSLConfig(config.connectionString);
  if (sslConfig !== false) {
    connectionConfig.ssl = sslConfig;
  }

  const client = new Client(connectionConfig);

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully, fetching schema...');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT 
        t.table_name,
        COALESCE(d.description, '') as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = COALESCE(current_schema(), 'public')
      LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = 0
      WHERE t.table_schema = COALESCE(current_schema(), 'public')
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables`);

    const tables: SchemaTable[] = [];
    let tableIndex = 0;

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      console.log(`Processing table ${tableIndex + 1}/${tablesResult.rows.length}: ${tableName}`);

      // Get columns for this table
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = COALESCE(current_schema(), 'public')
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Get primary keys
      const pkResult = await client.query(`
        SELECT column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = COALESCE(current_schema(), 'public')
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
      `, [tableName]);

      const primaryKeys = new Set(pkResult.rows.map((r: any) => r.column_name));

      // Get foreign keys
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
          AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = COALESCE(current_schema(), 'public')
          AND tc.table_name = $1
      `, [tableName]);

      const foreignKeys = new Map<string, any>();
      fkResult.rows.forEach((fk: any) => {
        foreignKeys.set(fk.column_name, {
          table: fk.foreign_table_name,
          column: fk.foreign_column_name,
          onDelete: fk.delete_rule === 'CASCADE' ? 'CASCADE' : 
                   fk.delete_rule === 'SET NULL' ? 'SET NULL' : 
                   fk.delete_rule === 'RESTRICT' ? 'RESTRICT' : 'NO ACTION',
          onUpdate: fk.update_rule === 'CASCADE' ? 'CASCADE' : 
                   fk.update_rule === 'SET NULL' ? 'SET NULL' : 
                   fk.update_rule === 'RESTRICT' ? 'RESTRICT' : 'NO ACTION',
        });
      });

      // Get unique constraints
      const uniqueResult = await client.query(`
        SELECT column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = COALESCE(current_schema(), 'public')
          AND tc.table_name = $1
          AND tc.constraint_type = 'UNIQUE'
      `, [tableName]);

      const uniqueColumns = new Set(uniqueResult.rows.map((r: any) => r.column_name));

      // Get indexes
      const indexesResult = await client.query(`
        SELECT
          i.relname AS index_name,
          a.attname AS column_name,
          ix.indisunique AS is_unique,
          am.amname AS index_type
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_am am ON i.relam = am.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
          AND t.relname = $1
          AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = COALESCE(current_schema(), 'public'))
        ORDER BY i.relname, a.attnum
      `, [tableName]);

      const indexesMap = new Map<string, SchemaIndex>();
      indexesResult.rows.forEach((idx: any) => {
        const idxName = idx.index_name;
        if (!indexesMap.has(idxName)) {
          indexesMap.set(idxName, {
            id: `idx-${tableName}-${idxName}`,
            name: idxName,
            columns: [],
            type: idx.index_type === 'hash' ? 'HASH' : 
                  idx.index_type === 'gin' ? 'GIN' : 
                  idx.index_type === 'gist' ? 'GIST' : 
                  idx.index_type === 'brin' ? 'BRIN' : 'BTREE',
            unique: idx.is_unique,
          });
        }
        indexesMap.get(idxName)!.columns.push(idx.column_name);
      });

      const columns: SchemaColumn[] = columnsResult.rows.map((col: any, colIdx: number) => {
        const colName = col.column_name;
        const dataType = col.udt_name || col.data_type;
        const sqlType = mapPostgreSQLTypeToSQLType(dataType);
        const length = col.character_maximum_length || extractLength(dataType);
        const isPrimaryKey = primaryKeys.has(colName);
        const isUnique = uniqueColumns.has(colName) || isPrimaryKey;
        const defaultValue = col.column_default;
        const isAutoIncrement = defaultValue && defaultValue.includes('nextval');

        // Clean up PostgreSQL default values
        let cleanedDefaultValue: string | undefined = undefined;
        if (defaultValue && !isAutoIncrement) {
          // Remove type casts (::text, ::regclass, etc.)
          let cleaned = defaultValue.replace(/::[a-z_]+/gi, '');
          
          // Handle function calls (NOW(), CURRENT_TIMESTAMP, etc.)
          if (cleaned.match(/^[A-Z_]+\(\)$/i)) {
            cleanedDefaultValue = cleaned.toUpperCase();
          }
          // Handle quoted strings - extract the actual value
          else if (cleaned.match(/^'([^']*)'$/)) {
            // Single-quoted string, extract inner value
            cleanedDefaultValue = cleaned.match(/^'([^']*)'$/)?.[1];
          }
          // Handle double-quoted identifiers (unlikely for defaults, but handle it)
          else if (cleaned.match(/^"([^"]*)"$/)) {
            cleanedDefaultValue = cleaned.match(/^"([^"]*)"$/)?.[1];
          }
          // Handle numeric or boolean literals
          else if (cleaned.match(/^-?\d+(\.\d+)?$/) || cleaned.toLowerCase() === 'true' || cleaned.toLowerCase() === 'false') {
            cleanedDefaultValue = cleaned;
          }
          // Handle nextval() - should be caught by isAutoIncrement, but just in case
          else if (cleaned.includes('nextval')) {
            cleanedDefaultValue = undefined; // Don't store nextval as default
          }
          // Fallback: use as-is (might be a function or expression)
          else {
            cleanedDefaultValue = cleaned;
          }
        }

        return {
          id: `col-${tableName}-${colIdx}`,
          name: colName,
          type: sqlType,
          length: length,
          nullable: col.is_nullable === 'YES',
          unique: isUnique,
          primaryKey: isPrimaryKey,
          autoIncrement: isAutoIncrement,
          defaultValue: cleanedDefaultValue,
          references: foreignKeys.get(colName),
        };
      });

      tables.push({
        id: `table-${tableName}`,
        name: tableName,
        position: {
          x: (tableIndex % 3) * 300 + 100,
          y: Math.floor(tableIndex / 3) * 400 + 100,
        },
        columns,
        indexes: Array.from(indexesMap.values()),
      });

      tableIndex++;
    }

    console.log(`Successfully reverse engineered ${tables.length} tables`);
    return {
      name: config.database,
      description: `Reverse engineered from PostgreSQL database: ${config.database}`,
      tables,
      relationships: [],
    };
  } catch (error) {
    console.error('PostgreSQL reverse engineering error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

/**
 * Reverse engineer MySQL database
 */
export async function reverseEngineerMySQL(
  config: DatabaseConnectionConfig
): Promise<SchemaState> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    connectTimeout: 10000, // 10 second timeout
  });

  try {
    // Get all tables
    const [tablesResult] = await connection.execute<mysql.RowDataPacket[]>(`
      SELECT 
        TABLE_NAME,
        TABLE_COMMENT
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [config.database]);

    const tables: SchemaTable[] = [];
    let tableIndex = 0;

    for (const tableRow of tablesResult) {
      const tableName = tableRow.TABLE_NAME;

      // Get columns for this table
      const [columnsResult] = await connection.execute<mysql.RowDataPacket[]>(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_TYPE,
          EXTRA,
          COLUMN_KEY,
          COLUMN_COMMENT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [config.database, tableName]);

      // Get foreign keys
      const [fkResult] = await connection.execute<mysql.RowDataPacket[]>(`
        SELECT
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          DELETE_RULE,
          UPDATE_RULE
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [config.database, tableName]);

      const foreignKeys = new Map<string, any>();
      fkResult.forEach((fk) => {
        foreignKeys.set(fk.COLUMN_NAME, {
          table: fk.REFERENCED_TABLE_NAME,
          column: fk.REFERENCED_COLUMN_NAME,
          onDelete: fk.DELETE_RULE === 'CASCADE' ? 'CASCADE' : 
                   fk.DELETE_RULE === 'SET NULL' ? 'SET NULL' : 
                   fk.DELETE_RULE === 'RESTRICT' ? 'RESTRICT' : 'NO ACTION',
          onUpdate: fk.UPDATE_RULE === 'CASCADE' ? 'CASCADE' : 
                   fk.UPDATE_RULE === 'SET NULL' ? 'SET NULL' : 
                   fk.UPDATE_RULE === 'RESTRICT' ? 'RESTRICT' : 'NO ACTION',
        });
      });

      // Get indexes
      const [indexesResult] = await connection.execute<mysql.RowDataPacket[]>(`
        SELECT
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [config.database, tableName]);

      const indexesMap = new Map<string, SchemaIndex>();
      indexesResult.forEach((idx) => {
        const idxName = idx.INDEX_NAME;
        if (idxName === 'PRIMARY') return; // Skip primary key index

        if (!indexesMap.has(idxName)) {
          indexesMap.set(idxName, {
            id: `idx-${tableName}-${idxName}`,
            name: idxName,
            columns: [],
            type: 'BTREE', // MySQL mostly uses BTREE
            unique: idx.NON_UNIQUE === 0,
          });
        }
        indexesMap.get(idxName)!.columns.push(idx.COLUMN_NAME);
      });

      const columns: SchemaColumn[] = columnsResult.map((col, colIdx) => {
        const colName = col.COLUMN_NAME;
        const dataType = col.DATA_TYPE;
        const sqlType = mapMySQLTypeToSQLType(col.COLUMN_TYPE || dataType);
        const length = col.CHARACTER_MAXIMUM_LENGTH || extractLength(col.COLUMN_TYPE || '');
        const isPrimaryKey = col.COLUMN_KEY === 'PRI';
        const isUnique = col.COLUMN_KEY === 'UNI' || isPrimaryKey;
        const isAutoIncrement = col.EXTRA?.includes('auto_increment') || false;

        return {
          id: `col-${tableName}-${colIdx}`,
          name: colName,
          type: sqlType,
          length: length,
          nullable: col.IS_NULLABLE === 'YES',
          unique: isUnique,
          primaryKey: isPrimaryKey,
          autoIncrement: isAutoIncrement,
          defaultValue: col.COLUMN_DEFAULT || undefined,
          comment: col.COLUMN_COMMENT || undefined,
          references: foreignKeys.get(colName),
        };
      });

      tables.push({
        id: `table-${tableName}`,
        name: tableName,
        position: {
          x: (tableIndex % 3) * 300 + 100,
          y: Math.floor(tableIndex / 3) * 400 + 100,
        },
        columns,
        indexes: Array.from(indexesMap.values()),
      });

      tableIndex++;
    }

    return {
      name: config.database,
      description: `Reverse engineered from MySQL database: ${config.database}`,
      tables,
      relationships: [],
    };
  } finally {
    await connection.end();
  }
}

/**
 * Main service function to reverse engineer a database
 */
export async function reverseEngineerDatabase(
  config: DatabaseConnectionConfig
): Promise<SchemaState> {
  switch (config.type) {
    case 'postgresql':
      return reverseEngineerPostgreSQL(config);
    case 'mysql':
      return reverseEngineerMySQL(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

