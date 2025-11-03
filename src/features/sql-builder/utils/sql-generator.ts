import { QueryState } from "@/features/sql-builder/types";

/**
 * Generate SQL query from QueryState
 * Following SQL best practices and formatting
 */
export function generateSQL(state: QueryState): string {
  if (!state.table) {
    return "-- Select a table to start building your query";
  }

  switch (state.queryType) {
    case "SELECT":
      return generateSelectQuery(state);
    case "INSERT":
      return "-- INSERT query builder coming soon!";
    case "UPDATE":
      return "-- UPDATE query builder coming soon!";
    case "DELETE":
      return "-- DELETE query builder coming soon!";
    default:
      return "";
  }
}

/**
 * Generate SELECT query
 */
function generateSelectQuery(state: QueryState): string {
  const parts: string[] = [];

  // SELECT clause
  let selectClause = "SELECT";
  
  // Add DISTINCT if enabled
  if (state.distinct) {
    selectClause += " DISTINCT";
  }
  
  // Build column/aggregate list
  const selectItems: string[] = [];
  
  // Add aggregate functions
  if (state.aggregates.length > 0) {
    state.aggregates.forEach(agg => {
      const aggStr = agg.alias 
        ? `${agg.function}(${agg.column}) AS ${agg.alias}`
        : `${agg.function}(${agg.column})`;
      selectItems.push(aggStr);
    });
  }
  
  // Add regular columns
  if (state.columns.length > 0) {
    selectItems.push(...state.columns);
  }
  
  // If no columns or aggregates, use *
  const columns = selectItems.length > 0 ? selectItems.join(", ") : "*";
  parts.push(`${selectClause} ${columns}`);

  // FROM clause
  parts.push(`FROM ${state.table}`);

  // WHERE clause
  if (state.whereConditions.length > 0) {
    const whereParts: string[] = [];
    state.whereConditions.forEach((condition, index) => {
      const valueFormatted = formatValue(condition.operator, condition.value);
      const clause = `${condition.column} ${condition.operator} ${valueFormatted}`;
      
      if (index === 0) {
        whereParts.push(clause);
      } else {
        whereParts.push(`  ${condition.conjunction} ${clause}`);
      }
    });
    parts.push(`WHERE ${whereParts.join("\n")}`);
  }

  // GROUP BY clause
  if (state.groupBy.length > 0) {
    parts.push(`GROUP BY ${state.groupBy.join(", ")}`);
  }

  // HAVING clause
  if (state.having.length > 0) {
    const havingParts: string[] = [];
    state.having.forEach((condition, index) => {
      const aggFunc = `${condition.function}(${condition.column})`;
      const clause = `${aggFunc} ${condition.operator} ${condition.value}`;
      
      if (index === 0) {
        havingParts.push(clause);
      } else {
        havingParts.push(`  ${condition.conjunction} ${clause}`);
      }
    });
    parts.push(`HAVING ${havingParts.join("\n")}`);
  }

  // ORDER BY clause
  if (state.orderBy.length > 0) {
    const orderParts = state.orderBy.map(
      order => `${order.column} ${order.direction}`
    );
    parts.push(`ORDER BY ${orderParts.join(", ")}`);
  }

  // LIMIT clause
  if (state.limit !== null && state.limit > 0) {
    parts.push(`LIMIT ${state.limit}`);
  }

  // OFFSET clause
  if (state.offset !== null && state.offset > 0) {
    parts.push(`OFFSET ${state.offset}`);
  }

  // Join with proper indentation
  return parts.join("\n") + ";";
}

/**
 * Format value based on operator
 */
function formatValue(operator: string, value: string): string {
  // IS NULL / IS NOT NULL don't need values
  if (operator.includes("NULL")) {
    return "";
  }

  // IN / NOT IN need parentheses
  if (operator.includes("IN")) {
    return `(${value})`;
  }

  // LIKE keeps quotes
  if (operator === "LIKE") {
    return `'${value}'`;
  }

  // Number detection (simple)
  if (!isNaN(Number(value)) && value.trim() !== "") {
    return value;
  }

  // Default: string with quotes
  return `'${value}'`;
}

/**
 * Explain query in plain English
 */
export function explainQuery(state: QueryState): string {
  if (!state.table) {
    return "No query to explain yet. Start by selecting a table.";
  }

  const parts: string[] = [];

  // Main action
  if (state.queryType === "SELECT") {
    // Handle aggregates
    if (state.aggregates.length > 0) {
      const aggDescriptions = state.aggregates.map(agg => {
        const funcName = agg.function.toLowerCase();
        const colName = agg.column === "*" ? "all rows" : `the ${agg.column} column`;
        return `${funcName}s ${colName}`;
      });
      parts.push(`This query calculates: ${aggDescriptions.join(", ")}.`);
      
      if (state.columns.length > 0) {
        parts.push(`It also selects: ${state.columns.join(", ")}.`);
      }
    } else {
      const columns = state.columns.length > 0 
        ? state.columns.join(", ") 
        : "all columns";
      const distinct = state.distinct ? "unique " : "";
      parts.push(`This query retrieves ${distinct}${columns} from the "${state.table}" table.`);
    }
  }

  // WHERE conditions
  if (state.whereConditions.length > 0) {
    parts.push("\nIt filters rows where:");
    state.whereConditions.forEach((condition, index) => {
      const conjunction = index > 0 ? condition.conjunction.toLowerCase() : "";
      const operator = operatorToEnglish(condition.operator);
      parts.push(`  ${conjunction} ${condition.column} ${operator} ${condition.value || "(null)"}`.trim());
    });
  }

  // GROUP BY
  if (state.groupBy.length > 0) {
    parts.push(`\nResults are grouped by: ${state.groupBy.join(", ")}.`);
  }

  // HAVING
  if (state.having.length > 0) {
    parts.push("\nGroups are filtered where:");
    state.having.forEach((condition, index) => {
      const conjunction = index > 0 ? condition.conjunction.toLowerCase() : "";
      const aggFunc = `${condition.function}(${condition.column})`;
      parts.push(`  ${conjunction} ${aggFunc} ${condition.operator} ${condition.value}`.trim());
    });
  }

  // ORDER BY
  if (state.orderBy.length > 0) {
    const orderDesc = state.orderBy.map(
      o => `${o.column} (${o.direction === "ASC" ? "ascending" : "descending"})`
    ).join(", then by ");
    parts.push(`\nResults are sorted by ${orderDesc}.`);
  }

  // LIMIT/OFFSET
  if (state.limit !== null && state.limit > 0) {
    parts.push(`\nIt returns up to ${state.limit} results.`);
  } else {
    parts.push(`\nPreview shows first 20 rows. Add LIMIT to change this.`);
  }
  if (state.offset !== null && state.offset > 0) {
    parts.push(`Starting from record #${state.offset + 1} (skipping first ${state.offset}).`);
  }

  return parts.join("\n");
}

/**
 * Convert operator to plain English
 */
function operatorToEnglish(operator: string): string {
  const map: Record<string, string> = {
    "=": "equals",
    "!=": "does not equal",
    ">": "is greater than",
    "<": "is less than",
    ">=": "is greater than or equal to",
    "<=": "is less than or equal to",
    "LIKE": "matches pattern",
    "IN": "is in",
    "NOT IN": "is not in",
    "IS NULL": "is null",
    "IS NOT NULL": "is not null",
  };
  return map[operator] || operator;
}

