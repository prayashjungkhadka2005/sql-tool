/**
 * Mock Data Generator (Legacy)
 * 
 * This file re-exports the new structured mock data system
 * for backward compatibility.
 * 
 * New structure:
 * - utils/mock-data/constants.ts - Data pools and constants
 * - utils/mock-data/generators.ts - Random generation utilities
 * - utils/mock-data/factories.ts - Factory functions for each table
 * - utils/mock-data/index.ts - Main exports and query functions
 */

export {
  getMockData,
  applyWhere,
  applyOrderBy,
  applyPagination,
  executeQuery,
  clearCache
} from './mock-data';
