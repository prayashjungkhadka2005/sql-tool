/**
 * Schema Designer Types
 * Defines the structure for visual database design
 */

export type SQLDataType = 
  | 'INTEGER' 
  | 'VARCHAR' 
  | 'TEXT' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'TIMESTAMP'
  | 'DECIMAL'
  | 'FLOAT';

export type RelationshipType = '1:1' | '1:N' | 'N:N';

export type CascadeAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

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

