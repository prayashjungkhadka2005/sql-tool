/**
 * Query History Manager
 * Stores and retrieves query history from localStorage
 * 
 * Edge cases handled:
 * - LocalStorage quota exceeded
 * - Duplicate queries
 * - Empty/invalid queries
 * - CSV table queries (flagged)
 * - Browser storage disabled
 */

import { QueryState } from "../types";
import { isCSVTable } from "./csv-data-manager";

export interface QueryHistoryItem {
  id: string;
  query: QueryState;
  sql: string;
  timestamp: number;
  tableName: string;
  isCSV?: boolean; // Flag for CSV queries
}

const HISTORY_KEY = 'sql-builder-history';
const MAX_HISTORY = 50;

/**
 * Save query to history
 */
export function saveToHistory(query: QueryState, sql: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Don't save empty queries
    if (!query.table) return;
    
    // Don't save if SQL is too simple
    if (sql.trim() === ';' || sql.trim() === '') return;
    
    // Get existing history
    const history = getHistory();
    
    // Check if the MOST RECENT query is identical (avoid consecutive duplicates)
    if (history.length > 0) {
      const lastItem = history[0];
      const isSameQuery = lastItem.sql === sql && lastItem.tableName === query.table;
      
      if (isSameQuery) {
        // Don't save if it's the exact same as the last saved query
        return;
      }
    }
    
    // Create new history item
    const item: QueryHistoryItem = {
      id: Date.now().toString(),
      query,
      sql,
      timestamp: Date.now(),
      tableName: query.table,
      isCSV: isCSVTable(query.table), // Flag CSV queries
    };
    
    // Add to beginning of array
    history.unshift(item);
    
    // Keep only last MAX_HISTORY items
    const trimmed = history.slice(0, MAX_HISTORY);
    
    // Save to localStorage with quota check
    const jsonString = JSON.stringify(trimmed);
    
    // Check if localStorage quota exceeded (rough estimate)
    if (jsonString.length > 5000000) { // 5MB limit
      // Remove oldest items if too large
      const reduced = trimmed.slice(0, 25); // Keep only 25 most recent
      localStorage.setItem(HISTORY_KEY, JSON.stringify(reduced));
      console.warn('History size limit reached, reduced to 25 items');
    } else {
      localStorage.setItem(HISTORY_KEY, jsonString);
    }
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded, clearing old history');
      try {
        // Emergency: clear old history and save only current
        const newHistory = [{
          id: Date.now().toString(),
          query,
          sql,
          timestamp: Date.now(),
          tableName: query.table,
        }];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch {
        console.error('Could not save to history - storage unavailable');
      }
    } else {
      console.error('Failed to save query to history:', error);
    }
  }
}

/**
 * Get all query history
 */
export function getHistory(): QueryHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error('Failed to load query history:', error);
    return [];
  }
}

/**
 * Delete specific history item
 */
export function deleteHistoryItem(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete history item:', error);
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

/**
 * Search history by keywords
 */
export function searchHistory(query: string): QueryHistoryItem[] {
  const history = getHistory();
  
  if (!query || query.trim() === '') return history;
  
  const searchTerm = query.toLowerCase();
  
  return history.filter(item => 
    item.tableName.toLowerCase().includes(searchTerm) ||
    item.sql.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get recent queries (last N)
 */
export function getRecentQueries(limit: number = 10): QueryHistoryItem[] {
  const history = getHistory();
  return history.slice(0, limit);
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
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

