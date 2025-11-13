/**
 * Schema Designer Types
 * Defines the structure for visual database design
 */

export type SQLDataType = 
  // Integers
  | 'SMALLINT'    // -32,768 to 32,767
  | 'INTEGER'     // -2,147,483,648 to 2,147,483,647
  | 'BIGINT'      // Large integers (common for IDs, timestamps)
  // Strings
  | 'VARCHAR'     // Variable-length string
  | 'TEXT'        // Unlimited text
  | 'CHAR'        // Fixed-length string
  // Numbers
  | 'DECIMAL'     // Exact decimal (for money)
  | 'FLOAT'       // Floating point
  | 'DOUBLE'      // Double precision floating point
  | 'REAL'        // Real number
  // Date/Time
  | 'DATE'        // Date only
  | 'TIME'        // Time only
  | 'TIMESTAMP'   // Date + time
  | 'TIMESTAMPTZ' // Timestamp with timezone (PostgreSQL)
  // Boolean
  | 'BOOLEAN'
  // Binary
  | 'BYTEA'       // Binary data (PostgreSQL)
  | 'BLOB'        // Binary large object (MySQL)
  // JSON
  | 'JSON'        // JSON data (MySQL, PostgreSQL)
  | 'JSONB'       // Binary JSON with indexing (PostgreSQL)
  // PostgreSQL specific
  | 'UUID'        // Universally unique identifier
  | 'INET'        // IP address
  | 'CIDR'        // Network address
  | 'ARRAY'       // Array type (PostgreSQL)
  // Full-text search
  | 'TSVECTOR';   // Text search vector (PostgreSQL)

export type RelationshipType = '1:1' | '1:N' | 'N:N';

export type CascadeAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export type IndexType = 'BTREE' | 'HASH' | 'GIN' | 'GIST' | 'BRIN';

/**
 * Schema Index Definition
 * Indexes improve query performance by creating optimized data structures
 */
export interface SchemaIndex {
  id: string;
  name: string;
  columns: string[]; // Column names (supports composite indexes)
  type: IndexType;
  unique: boolean;
  where?: string; // Partial index condition (e.g., "status = 'active'")
  comment?: string;
}

/**
 * Schema Column Definition
 */
export interface SchemaColumn {
  id: string;
  name: string;
  type: SQLDataType;
  length?: number; // For VARCHAR(255)
  precision?: number; // For DECIMAL(10,2)
  scale?: number;
  nullable: boolean;
  unique: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  comment?: string;
  // Foreign key reference
  references?: {
    table: string;
    column: string;
    onDelete?: CascadeAction;
    onUpdate?: CascadeAction;
  };
}

/**
 * Schema Table Definition
 */
export interface SchemaTable {
  id: string;
  name: string;
  columns: SchemaColumn[];
  indexes?: SchemaIndex[]; // Performance optimization via indexes
  position: { x: number; y: number }; // For React Flow
  comment?: string;
}

/**
 * Schema Relationship (DEPRECATED - for backward compatibility only)
 * @deprecated Use column.references instead. Relationships are now auto-generated from FK columns.
 */
export interface SchemaRelationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: RelationshipType;
  onDelete?: CascadeAction;
  onUpdate?: CascadeAction;
}

/**
 * Complete Schema State
 */
export interface SchemaState {
  tables: SchemaTable[];
  /**
   * @deprecated No longer used. Relationships are auto-generated from column.references.
   * Kept for backward compatibility with existing templates.
   */
  relationships?: SchemaRelationship[];
  name: string; // Schema name
  description?: string;
}

/**
 * Export Format Types
 */
export type ExportFormat = 
  | 'sql-postgres'
  | 'sql-mysql'
  | 'sql-sqlite'
  | 'prisma'
  | 'typeorm'
  | 'sequelize'
  | 'drizzle'
  | 'json';

/**
 * Schema Template
 */
export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Starter' | 'E-commerce' | 'Social' | 'SaaS';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: JSX.Element;
  schema: SchemaState;
  useCases: string[];
}

