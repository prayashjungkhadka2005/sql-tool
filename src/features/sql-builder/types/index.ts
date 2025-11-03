// SQL Query Builder Types

export type QueryType = "SELECT" | "INSERT" | "UPDATE" | "DELETE";

export type OperatorType = 
  | "=" 
  | "!=" 
  | ">" 
  | "<" 
  | ">=" 
  | "<=" 
  | "LIKE" 
  | "IN" 
  | "NOT IN"
  | "BETWEEN" 
  | "IS NULL" 
  | "IS NOT NULL";

export type ConjunctionType = "AND" | "OR";

export interface WhereCondition {
  id: string;
  column: string;
  operator: OperatorType;
  value: string;
  conjunction: ConjunctionType;
}

export interface OrderByClause {
  column: string;
  direction: "ASC" | "DESC";
}

export interface JoinClause {
  id: string;
  type: "INNER" | "LEFT" | "RIGHT" | "FULL";
  table: string;
  onLeft: string;
  onRight: string;
}

export type AggregateFunction = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";

export interface AggregateColumn {
  id: string;
  function: AggregateFunction;
  column: string; // "*" for COUNT(*)
  alias?: string; // Optional column alias
}

export interface HavingCondition {
  id: string;
  function: AggregateFunction;
  column: string;
  operator: OperatorType;
  value: string;
  conjunction: ConjunctionType;
}

export interface QueryState {
  queryType: QueryType;
  table: string;
  columns: string[];
  aggregates: AggregateColumn[]; // NEW: Aggregate functions
  distinct: boolean; // NEW: DISTINCT keyword
  whereConditions: WhereCondition[];
  joins: JoinClause[];
  groupBy: string[]; // NEW: GROUP BY columns
  having: HavingCondition[]; // NEW: HAVING conditions
  orderBy: OrderByClause[];
  limit: number | null;
  offset: number | null;
}

// Sample table schemas for demo
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: "INTEGER" | "VARCHAR" | "TEXT" | "BOOLEAN" | "DATE" | "TIMESTAMP";
  nullable: boolean;
}

// Sample tables - More realistic variety for learning
export const SAMPLE_TABLES: TableSchema[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "email", type: "VARCHAR", nullable: false },
      { name: "age", type: "INTEGER", nullable: true },
      { name: "status", type: "VARCHAR", nullable: false },
      { name: "role", type: "VARCHAR", nullable: false },
      { name: "city", type: "VARCHAR", nullable: true },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
      { name: "updated_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "user_id", type: "INTEGER", nullable: false },
      { name: "product_id", type: "INTEGER", nullable: false },
      { name: "quantity", type: "INTEGER", nullable: false },
      { name: "total", type: "INTEGER", nullable: false },
      { name: "status", type: "VARCHAR", nullable: false },
      { name: "payment_method", type: "VARCHAR", nullable: true },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "description", type: "TEXT", nullable: true },
      { name: "price", type: "INTEGER", nullable: false },
      { name: "stock", type: "INTEGER", nullable: false },
      { name: "category", type: "VARCHAR", nullable: false },
      { name: "brand", type: "VARCHAR", nullable: true },
      { name: "is_active", type: "BOOLEAN", nullable: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "posts",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "user_id", type: "INTEGER", nullable: false },
      { name: "title", type: "VARCHAR", nullable: false },
      { name: "content", type: "TEXT", nullable: false },
      { name: "views", type: "INTEGER", nullable: false },
      { name: "likes", type: "INTEGER", nullable: false },
      { name: "published", type: "BOOLEAN", nullable: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "comments",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "post_id", type: "INTEGER", nullable: false },
      { name: "user_id", type: "INTEGER", nullable: false },
      { name: "content", type: "TEXT", nullable: false },
      { name: "created_at", type: "TIMESTAMP", nullable: false },
    ],
  },
  {
    name: "categories",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "description", type: "TEXT", nullable: true },
      { name: "parent_id", type: "INTEGER", nullable: true },
    ],
  },
  {
    name: "employees",
    columns: [
      { name: "id", type: "INTEGER", nullable: false },
      { name: "name", type: "VARCHAR", nullable: false },
      { name: "email", type: "VARCHAR", nullable: false },
      { name: "department", type: "VARCHAR", nullable: false },
      { name: "salary", type: "INTEGER", nullable: false },
      { name: "hire_date", type: "DATE", nullable: false },
      { name: "is_active", type: "BOOLEAN", nullable: false },
    ],
  },
];

