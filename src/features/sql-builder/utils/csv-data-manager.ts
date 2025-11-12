/**
 * CSV Data Manager
 * Manages uploaded CSV data in memory alongside mock data
 */

import { ParsedCSV } from './csv-parser';

// In-memory store for uploaded CSV data
const csvDataStore: Map<string, ParsedCSV> = new Map();

/**
 * Store parsed CSV data
 * Checks memory limits before storing
 */
export function storeCSVData(tableName: string, parsedData: ParsedCSV): void {
  // Validate input
  if (!tableName || !parsedData || !parsedData.data || !parsedData.columns) {
    throw new Error('Invalid CSV data structure');
  }
  
  // Check total memory usage (exclude if overwriting existing table)
  const totalTables = csvDataStore.size;
  const isOverwrite = csvDataStore.has(tableName);
  
  if (!isOverwrite && totalTables >= 20) {
    throw new Error('Maximum 20 CSV tables allowed. Please delete some tables before uploading more.');
  }
  
  csvDataStore.set(tableName, parsedData);
}

/**
 * Get CSV data by table name
 */
export function getCSVData(tableName: string): ParsedCSV | undefined {
  return csvDataStore.get(tableName);
}

/**
 * Get all uploaded CSV table names
 */
export function getCSVTableNames(): string[] {
  return Array.from(csvDataStore.keys());
}

/**
 * Check if table is from CSV
 */
export function isCSVTable(tableName: string): boolean {
  return csvDataStore.has(tableName);
}

/**
 * Delete CSV data
 */
export function deleteCSVData(tableName: string): boolean {
  return csvDataStore.delete(tableName);
}

/**
 * Clear all CSV data
 */
export function clearAllCSVData(): void {
  csvDataStore.clear();
}

/**
 * Get CSV table info
 */
export function getCSVTableInfo(tableName: string): { rowCount: number; columns: number } | null {
  const data = csvDataStore.get(tableName);
  if (!data) return null;
  
  return {
    rowCount: data.rowCount,
    columns: data.columns.length,
  };
}

/**
 * Get all table info (for display)
 */
export function getAllCSVTablesInfo(): Array<{
  name: string;
  rowCount: number;
  columns: number;
  size: string;
}> {
  const tables: Array<{
    name: string;
    rowCount: number;
    columns: number;
    size: string;
  }> = [];
  
  csvDataStore.forEach((data, name) => {
    // Estimate size
    const sizeInBytes = JSON.stringify(data.data).length;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    
    tables.push({
      name,
      rowCount: data.rowCount,
      columns: data.columns.length,
      size: `${sizeInKB} KB`,
    });
  });
  
  return tables;
}

