/**
 * Schema Storage Manager
 * Handles localStorage persistence for Schema Designer
 * 
 * Edge cases handled:
 * - LocalStorage quota exceeded
 * - Browser storage disabled
 * - Corrupted data
 * - Version mismatches
 * - SSR/undefined window
 * - Very large schemas
 */

import { SchemaState } from '../types';

const STORAGE_KEY = 'schema-designer-v1';
const VERSION = 1;
const MAX_SIZE_MB = 5; // 5MB soft limit

interface StoredSchema {
  version: number;
  schema: SchemaState;
  timestamp: number;
  autoSaved: boolean;
}

/**
 * Save schema to localStorage
 */
export function saveSchema(schema: SchemaState, autoSaved: boolean = true): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Validate schema before saving
    if (!schema || !schema.tables) {
      console.warn('Invalid schema, not saving');
      return false;
    }
    
    // Create storage object
    const stored: StoredSchema = {
      version: VERSION,
      schema,
      timestamp: Date.now(),
      autoSaved,
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(stored);
    
    // Check size (rough estimate: 1 char ≈ 2 bytes)
    const sizeInMB = (jsonString.length * 2) / (1024 * 1024);
    
    if (sizeInMB > MAX_SIZE_MB) {
      console.warn(`Schema size (${sizeInMB.toFixed(2)}MB) exceeds ${MAX_SIZE_MB}MB. Saving anyway but may hit quota.`);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    return true;
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Schema is too large to save automatically.');
      
      // Try to clear and save minimal version
      try {
        const minimalSchema: StoredSchema = {
          version: VERSION,
          schema: {
            name: schema.name,
            description: schema.description,
            tables: schema.tables.slice(0, 10), // Keep only first 10 tables
            relationships: [],
          },
          timestamp: Date.now(),
          autoSaved: false,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalSchema));
        console.warn('Saved reduced schema (first 10 tables only)');
        return false;
      } catch {
        console.error('Could not save even reduced schema');
        return false;
      }
    } else {
      console.error('Failed to save schema to localStorage:', error);
      return false;
    }
  }
}

/**
 * Load schema from localStorage
 */
export function loadSchema(): SchemaState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) return null;
    
    const parsed: StoredSchema = JSON.parse(stored);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Invalid stored schema format');
      return null;
    }
    
    // Check version
    if (parsed.version !== VERSION) {
      console.warn(`Schema version mismatch: stored ${parsed.version}, current ${VERSION}`);
      // Could implement migration here if needed
      // For now, return null to start fresh
      return null;
    }
    
    // Validate schema structure
    if (!parsed.schema || !parsed.schema.tables || !Array.isArray(parsed.schema.tables)) {
      console.warn('Corrupted schema data');
      return null;
    }
    
    // Validate each table has required fields
    const validTables = parsed.schema.tables.filter(table => 
      table && 
      table.id && 
      table.name && 
      Array.isArray(table.columns) &&
      table.position &&
      typeof table.position.x === 'number' &&
      typeof table.position.y === 'number'
    );
    
    if (validTables.length !== parsed.schema.tables.length) {
      console.warn(`Removed ${parsed.schema.tables.length - validTables.length} invalid tables from stored schema`);
    }
    
    return {
      ...parsed.schema,
      tables: validTables,
      relationships: [], // Reset deprecated field
    };
  } catch (error) {
    console.error('Failed to load schema from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved schema
 */
export function clearSchema(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear schema:', error);
  }
}

/**
 * Get last saved timestamp
 */
export function getLastSaved(): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed: StoredSchema = JSON.parse(stored);
    return parsed.timestamp || null;
  } catch {
    return null;
  }
}

/**
 * Check if schema was auto-saved
 */
export function wasAutoSaved(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const parsed: StoredSchema = JSON.parse(stored);
    return parsed.autoSaved !== false; // Default to true
  } catch {
    return false;
  }
}

/**
 * Get storage size in MB
 */
export function getStorageSize(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    
    // Estimate: 1 char ≈ 2 bytes
    return (stored.length * 2) / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format timestamp to relative time
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

