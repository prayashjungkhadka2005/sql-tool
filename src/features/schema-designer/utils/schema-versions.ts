/**
 * Schema Version Management
 * 
 * Handles saving, loading, and managing schema versions in localStorage.
 * Used for tracking schema changes over time and generating migrations.
 */

import { SchemaState } from '../types';

const STORAGE_KEY = 'schema_versions';
const MAX_VERSIONS = 50; // Limit to prevent storage bloat

export interface SchemaVersion {
  id: string;
  schema: SchemaState;
  timestamp: number;
  tag: string;
  description?: string;
}

/**
 * Get all saved schema versions
 */
export function getVersions(): SchemaVersion[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const versions = JSON.parse(data) as SchemaVersion[];
    
    // Sort by timestamp (newest first)
    return versions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[Schema Versions] Failed to get versions:', error);
    return [];
  }
}

/**
 * Save a new schema version
 */
export function saveVersion(
  schema: SchemaState,
  tag: string,
  description?: string
): { success: boolean; error?: string; version?: SchemaVersion } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  // Validate inputs
  if (!tag || tag.trim().length === 0) {
    return { success: false, error: 'Version tag is required' };
  }

  if (tag.trim().length > 50) {
    return { success: false, error: 'Version tag too long (max 50 characters)' };
  }

  if (description && description.length > 500) {
    return { success: false, error: 'Description too long (max 500 characters)' };
  }

  if (schema.tables.length === 0) {
    return { success: false, error: 'Cannot save empty schema' };
  }

  try {
    const versions = getVersions();

    // Check for duplicate tag
    if (versions.some(v => v.tag === tag.trim())) {
      return { success: false, error: `Version tag "${tag}" already exists` };
    }

    // Create new version
    const newVersion: SchemaVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schema: JSON.parse(JSON.stringify(schema)), // Deep clone
      timestamp: Date.now(),
      tag: tag.trim(),
      description: description?.trim() || undefined,
    };

    // Add to versions (newest first)
    versions.unshift(newVersion);

    // Limit number of versions
    const limitedVersions = versions.slice(0, MAX_VERSIONS);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedVersions));

    return { success: true, version: newVersion };
  } catch (error) {
    console.error('[Schema Versions] Failed to save version:', error);
    
    // Check if quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return { 
        success: false, 
        error: 'Storage quota exceeded. Delete old versions to free up space.' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save version' 
    };
  }
}

/**
 * Get a specific version by ID
 */
export function getVersion(id: string): SchemaVersion | null {
  const versions = getVersions();
  return versions.find(v => v.id === id) || null;
}

/**
 * Delete a version
 */
export function deleteVersion(id: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  try {
    const versions = getVersions();
    const filtered = versions.filter(v => v.id !== id);

    if (filtered.length === versions.length) {
      return { success: false, error: 'Version not found' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('[Schema Versions] Failed to delete version:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete version' 
    };
  }
}

/**
 * Delete all versions
 */
export function clearVersions(): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('[Schema Versions] Failed to clear versions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to clear versions' 
    };
  }
}

/**
 * Get storage info
 */
export function getStorageInfo(): {
  versionCount: number;
  estimatedSize: number;
  quotaPercentage: number;
} {
  if (typeof window === 'undefined') {
    return { versionCount: 0, estimatedSize: 0, quotaPercentage: 0 };
  }

  try {
    const versions = getVersions();
    const data = localStorage.getItem(STORAGE_KEY);
    const estimatedSize = data ? new Blob([data]).size : 0;

    // Estimate quota (typically 5-10MB)
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    const quotaPercentage = (estimatedSize / estimatedQuota) * 100;

    return {
      versionCount: versions.length,
      estimatedSize,
      quotaPercentage: Math.min(quotaPercentage, 100),
    };
  } catch (error) {
    console.error('[Schema Versions] Failed to get storage info:', error);
    return { versionCount: 0, estimatedSize: 0, quotaPercentage: 0 };
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

  // Full date for older versions
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

