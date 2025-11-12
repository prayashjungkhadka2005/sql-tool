import { QueryState, SAMPLE_TABLES, TableSchema } from "@/features/sql-builder/types";
import { getCSVData } from "./csv-data-manager";

/**
 * Validate INSERT query for errors
 * Returns validation errors or null if valid
 */
export function validateInsertQuery(queryState: QueryState): {
  hasErrors: boolean;
  missingRequired: string[];
  typeErrors: string[];
} | null {
  if (queryState.queryType !== "INSERT") return null;

  // Get table schema (CSV or mock)
  let tableSchema: TableSchema | undefined;
  const csvData = getCSVData(queryState.table);
  if (csvData) {
    tableSchema = { name: csvData.tableName, columns: csvData.columns } as TableSchema;
  } else {
    tableSchema = SAMPLE_TABLES.find(t => t.name === queryState.table);
  }
  if (!tableSchema) return null;

  // Check 1: Missing required fields
  const requiredColumns = tableSchema.columns.filter(c => !c.nullable);
  const missingRequired = requiredColumns
    .filter(c => !queryState.insertValues[c.name] || queryState.insertValues[c.name].trim() === '')
    .map(c => c.name);

  // Check 2: Type validation
  const typeErrors: string[] = [];
  Object.keys(queryState.insertValues).forEach(colName => {
    const value = queryState.insertValues[colName];
    if (!value || value.trim() === '') return; // Skip empty optional fields

    const column = tableSchema.columns.find(c => c.name === colName);
    if (!column) return;

    // Validate VARCHAR/TEXT - should NOT be pure numbers
    if ((column.type === "VARCHAR" || column.type === "TEXT") && /^\d+$/.test(value.trim())) {
      typeErrors.push(`${colName} should be text like "pending" or "active", not just a number (got: "${value}")`);
    }

    // Validate INTEGER - must be valid number
    if (column.type === "INTEGER" && isNaN(Number(value))) {
      typeErrors.push(`${colName} must be a number (got: "${value}")`);
    }

    // Validate BOOLEAN
    if (column.type === "BOOLEAN" && !['true', 'false'].includes(value.toLowerCase())) {
      typeErrors.push(`${colName} must be true or false (got: "${value}")`);
    }

    // Validate DATE format
    if (column.type === "DATE" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      typeErrors.push(`${colName} needs YYYY-MM-DD format (got: "${value}")`);
    }

    // Validate TIMESTAMP format
    if (column.type === "TIMESTAMP" && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
      typeErrors.push(`${colName} needs YYYY-MM-DD HH:MM:SS format (got: "${value}")`);
    }
  });

  return {
    hasErrors: missingRequired.length > 0 || typeErrors.length > 0,
    missingRequired,
    typeErrors
  };
}

/**
 * Check if INSERT query is ready to execute
 */
export function isInsertQueryValid(queryState: QueryState): boolean {
  const validation = validateInsertQuery(queryState);
  if (!validation) return false;
  return !validation.hasErrors;
}

