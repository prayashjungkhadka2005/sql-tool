/**
 * Mock Data System
 * Entry point for all mock data generation and querying
 */

import * as factories from './factories';
import { WhereCondition, OrderByClause } from '@/features/sql-builder/types';
import { getCSVData, isCSVTable } from '../csv-data-manager';

// Re-export JOIN executor
export { executeJoins, getColumnValue as getJoinColumnValue } from './join-executor';

// Cache for generated data
const dataCache: Record<string, any[]> = {};

/**
 * Get mock data for a table (with caching)
 * Now supports both mock data and uploaded CSV data
 */
export function getMockData(tableName: string): any[] {
  // Check if it's a CSV table first
  if (isCSVTable(tableName)) {
    const csvData = getCSVData(tableName);
    if (csvData) {
      return csvData.data;
    }
  }

  // Return cached mock data if exists
  if (dataCache[tableName]) {
    return dataCache[tableName];
  }

  // Generate and cache mock data
  let data: any[] = [];
  
  switch (tableName) {
    case 'users':
      data = Array.from({ length: 100 }, (_, i) => factories.createUser(i + 1));
      break;
    case 'products':
      data = Array.from({ length: 100 }, (_, i) => factories.createProduct(i + 1));
      break;
    case 'orders':
      data = Array.from({ length: 100 }, (_, i) => factories.createOrder(i + 1, 100));
      break;
    case 'posts':
      data = Array.from({ length: 100 }, (_, i) => factories.createPost(i + 1, 100));
      break;
    case 'comments':
      data = Array.from({ length: 100 }, (_, i) => factories.createComment(i + 1, 100, 100));
      break;
    case 'categories':
      data = Array.from({ length: 20 }, (_, i) => factories.createCategory(i + 1));
      break;
    case 'employees':
      data = Array.from({ length: 50 }, (_, i) => factories.createEmployee(i + 1));
      break;
    default:
      data = [];
  }
  
  dataCache[tableName] = data;
  return data;
}

/**
 * Clear cache (useful for testing or refreshing data)
 */
export function clearCache(tableName?: string): void {
  if (tableName) {
    delete dataCache[tableName];
  } else {
    Object.keys(dataCache).forEach(key => delete dataCache[key]);
  }
}

/**
 * Get column value handling table-prefixed columns (e.g., "users.name")
 */
function getColumnValue(row: any, column: string): any {
  // Try direct access first (handles both prefixed and non-prefixed)
  if (row[column] !== undefined) {
    return row[column];
  }
  
  // If column doesn't have table prefix, try to find it in any table
  if (!column.includes('.')) {
    const keys = Object.keys(row);
    for (const key of keys) {
      if (key.endsWith(`.${column}`)) {
        return row[key];
      }
    }
  }
  
  return undefined;
}

/**
 * Apply WHERE conditions to data
 */
export function applyWhere(data: any[], whereConditions: WhereCondition[]): any[] {
  if (whereConditions.length === 0) return data;
  
  return data.filter(row => {
    let result = true;
    
    whereConditions.forEach((condition, index) => {
      const columnValue = getColumnValue(row, condition.column);
      let conditionMet = false;
      
      // Evaluate condition based on operator
      switch (condition.operator) {
        case '=':
          // Handle null comparisons
          if (columnValue == null) {
            conditionMet = false;
          } else {
            conditionMet = String(columnValue).toLowerCase() === String(condition.value).toLowerCase();
          }
          break;
        case '!=':
          // Handle null comparisons
          if (columnValue == null) {
            conditionMet = true;
          } else {
            conditionMet = String(columnValue).toLowerCase() !== String(condition.value).toLowerCase();
          }
          break;
        case '>':
          conditionMet = !isNaN(Number(columnValue)) && Number(columnValue) > Number(condition.value);
          break;
        case '<':
          conditionMet = !isNaN(Number(columnValue)) && Number(columnValue) < Number(condition.value);
          break;
        case '>=':
          conditionMet = !isNaN(Number(columnValue)) && Number(columnValue) >= Number(condition.value);
          break;
        case '<=':
          conditionMet = !isNaN(Number(columnValue)) && Number(columnValue) <= Number(condition.value);
          break;
        case 'LIKE': {
          // Handle null
          if (columnValue == null) {
            conditionMet = false;
          } else {
            // Convert SQL LIKE pattern to regex
            const pattern = condition.value
              .replace(/%/g, '.*')
              .replace(/_/g, '.');
            try {
              conditionMet = new RegExp(`^${pattern}$`, 'i').test(String(columnValue));
            } catch (e) {
              // Invalid regex pattern
              conditionMet = false;
            }
          }
          break;
        }
        case 'IN': {
          if (columnValue == null) {
            conditionMet = false;
          } else {
            const values = condition.value.split(',').map(v => v.trim().replace(/['"]/g, ''));
            conditionMet = values.includes(String(columnValue));
          }
          break;
        }
        case 'NOT IN': {
          if (columnValue == null) {
            conditionMet = true;
          } else {
            const values = condition.value.split(',').map(v => v.trim().replace(/['"]/g, ''));
            conditionMet = !values.includes(String(columnValue));
          }
          break;
        }
        case 'IS NULL':
          conditionMet = columnValue === null || columnValue === undefined || columnValue === '';
          break;
        case 'IS NOT NULL':
          conditionMet = columnValue !== null && columnValue !== undefined && columnValue !== '';
          break;
        case 'BETWEEN': {
          const [min, max] = condition.value.split('AND').map(v => Number(v.trim()));
          conditionMet = Number(columnValue) >= min && Number(columnValue) <= max;
          break;
        }
        default:
          conditionMet = true;
      }
      
      // Apply AND/OR logic
      if (index === 0) {
        result = conditionMet;
      } else if (condition.conjunction === 'AND') {
        result = result && conditionMet;
      } else if (condition.conjunction === 'OR') {
        result = result || conditionMet;
      }
    });
    
    return result;
  });
}

/**
 * Apply ORDER BY to data
 */
export function applyOrderBy(data: any[], orderBy: OrderByClause[]): any[] {
  if (orderBy.length === 0) return data;
  
  return [...data].sort((a, b) => {
    for (const order of orderBy) {
      const aVal = getColumnValue(a, order.column);
      const bVal = getColumnValue(b, order.column);
      
      // Handle null/undefined
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return order.direction === 'ASC' ? 1 : -1;
      if (bVal == null) return order.direction === 'ASC' ? -1 : 1;
      
      // Compare values
      let comparison = 0;
      
      // Try numeric comparison first
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        // String comparison
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      if (comparison !== 0) {
        return order.direction === 'ASC' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * Apply LIMIT and OFFSET
 */
export function applyPagination(data: any[], limit: number | null, offset: number | null): any[] {
  const start = offset || 0;
  const end = limit ? start + limit : undefined;
  return data.slice(start, end);
}

/**
 * Execute a full query (combines all operations)
 */
export function executeQuery(params: {
  table: string;
  columns?: string[];
  where?: WhereCondition[];
  orderBy?: OrderByClause[];
  limit?: number | null;
  offset?: number | null;
}) {
  // Get base data
  let data = getMockData(params.table);
  
  // Apply filters
  if (params.where && params.where.length > 0) {
    data = applyWhere(data, params.where);
  }
  
  // Apply sorting
  if (params.orderBy && params.orderBy.length > 0) {
    data = applyOrderBy(data, params.orderBy);
  }
  
  // Get total before pagination
  const total = data.length;
  
  // Apply pagination
  data = applyPagination(data, params.limit || null, params.offset || null);
  
  // Select columns
  if (params.columns && params.columns.length > 0 && !params.columns.includes('*')) {
    data = data.map(row => {
      const filtered: any = {};
      params.columns!.forEach(col => {
        filtered[col] = row[col];
      });
      return filtered;
    });
  }
  
  return {
    data,
    total,
    count: data.length,
  };
}

