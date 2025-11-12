/**
 * URL Sharing Utilities
 * Encode/decode query state to URL for sharing
 */

import { QueryState } from "@/features/sql-builder/types";
import { isCSVTable } from "./csv-data-manager";

/**
 * Encode query state to URL-safe string
 */
export function encodeQueryToURL(queryState: QueryState): string {
  try {
    // Create minimal state object (only non-default values)
    const minimalState: any = {
      t: queryState.queryType,
      tb: queryState.table,
    };

    if (queryState.columns.length > 0) minimalState.c = queryState.columns;
    if (queryState.joins && queryState.joins.length > 0) minimalState.j = queryState.joins;
    if (queryState.aggregates && queryState.aggregates.length > 0) minimalState.a = queryState.aggregates;
    if (queryState.distinct) minimalState.d = true;
    if (queryState.whereConditions.length > 0) minimalState.w = queryState.whereConditions;
    if (queryState.groupBy && queryState.groupBy.length > 0) minimalState.g = queryState.groupBy;
    if (queryState.having && queryState.having.length > 0) minimalState.h = queryState.having;
    if (queryState.orderBy.length > 0) minimalState.o = queryState.orderBy;
    if (queryState.limit !== null) minimalState.l = queryState.limit;
    if (queryState.offset !== null) minimalState.of = queryState.offset;
    if (queryState.insertValues && Object.keys(queryState.insertValues).length > 0) {
      minimalState.iv = queryState.insertValues;
    }

    // JSON stringify and encode
    const json = JSON.stringify(minimalState);
    const base64 = btoa(json);
    return base64;
  } catch (error) {
    console.error('Failed to encode query:', error);
    return '';
  }
}

/**
 * Decode URL string to query state
 */
export function decodeQueryFromURL(encoded: string): Partial<QueryState> | null {
  try {
    if (!encoded || encoded.trim() === '') return null;

    const json = atob(encoded);
    const minimalState = JSON.parse(json);

    // Validate decoded data
    if (!minimalState || typeof minimalState !== 'object') {
      return null;
    }

    // Reconstruct full state with safe fallbacks
    const queryState: Partial<QueryState> = {
      queryType: minimalState.t || "SELECT",
      table: minimalState.tb || "",
      columns: Array.isArray(minimalState.c) ? minimalState.c : [],
      joins: Array.isArray(minimalState.j) ? minimalState.j : [],
      aggregates: Array.isArray(minimalState.a) ? minimalState.a : [],
      distinct: minimalState.d === true,
      whereConditions: Array.isArray(minimalState.w) ? minimalState.w : [],
      groupBy: Array.isArray(minimalState.g) ? minimalState.g : [],
      having: Array.isArray(minimalState.h) ? minimalState.h : [],
      orderBy: Array.isArray(minimalState.o) ? minimalState.o : [],
      limit: typeof minimalState.l === 'number' ? minimalState.l : null,
      offset: typeof minimalState.of === 'number' ? minimalState.of : null,
      insertValues: minimalState.iv && typeof minimalState.iv === 'object' ? minimalState.iv : {},
    };

    return queryState;
  } catch (error) {
    console.error('Failed to decode query:', error);
    return null;
  }
}

/**
 * Generate shareable URL with query encoded
 */
export function generateShareableURL(queryState: QueryState): string {
  const encoded = encodeQueryToURL(queryState);
  if (!encoded) return '';
  
  // Get current URL without query params
  const baseURL = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname
    : '';
  
  return `${baseURL}?q=${encoded}`;
}

/**
 * Check if query can be shared via URL
 * CSV queries cannot be shared because data is local
 */
export function canShareQuery(queryState: QueryState): { 
  canShare: boolean; 
  reason?: string;
} {
  // Check if table is from CSV
  if (queryState.table && isCSVTable(queryState.table)) {
    return {
      canShare: false,
      reason: "CSV queries cannot be shared because the data is stored locally in your browser. Only demo table queries can be shared."
    };
  }
  
  return { canShare: true };
}

/**
 * Copy URL to clipboard
 * Returns { success: boolean, error?: string }
 */
export async function copyShareableURL(queryState: QueryState): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if query can be shared
    const shareCheck = canShareQuery(queryState);
    if (!shareCheck.canShare) {
      return { 
        success: false, 
        error: shareCheck.reason 
      };
    }
    
    const url = generateShareableURL(queryState);
    await navigator.clipboard.writeText(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return { 
      success: false, 
      error: "Failed to copy URL to clipboard" 
    };
  }
}

