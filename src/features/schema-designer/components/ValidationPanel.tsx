/**
 * Validation Panel Component
 * 
 * Shows real-time validation warnings and suggestions for the schema.
 * Helps users catch issues early and follow best practices.
 */

'use client';

import { useMemo } from 'react';
import { SchemaState, SchemaTable } from '../types';

interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  category: 'structure' | 'performance' | 'naming' | 'best-practice';
  table: string;
  message: string;
  fixable?: boolean;
}

interface ValidationPanelProps {
  schema: SchemaState;
  onFix?: (issue: ValidationIssue) => void;
}

export function ValidationPanel({ schema, onFix }: ValidationPanelProps) {
  const issues = useMemo(() => findIssues(schema), [schema]);

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const suggestionCount = issues.filter(i => i.type === 'suggestion').length;

  if (schema.tables.length === 0) {
    return null; // Don't show when no tables
  }

  if (issues.length === 0) {
    return (
      <div className="p-3 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 font-mono">Schema Validation</span>
          <span className="text-xs text-foreground/60 font-mono">No issues found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground font-mono">Schema Validation</h3>
        </div>
        
        {/* Summary badges */}
        <div className="flex items-center gap-1.5">
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded font-mono">
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-semibold rounded font-mono">
              {warningCount}
            </span>
          )}
          {suggestionCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded font-mono">
              {suggestionCount}
            </span>
          )}
        </div>
      </div>

      {/* Issues List - Compact like VSCode Problems panel */}
      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-2 px-2 py-1.5 hover:bg-foreground/5 rounded transition-colors"
          >
            {/* Icon */}
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                issue.type === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : issue.type === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {issue.type === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : issue.type === 'warning' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] leading-relaxed font-mono text-foreground/90 break-words">
                <span className="font-bold text-foreground">{issue.table}</span>
                <span className="text-foreground/50 mx-1">›</span>
                <span>{issue.message}</span>
              </p>
            </div>
            
            {/* Category badge (on hover) */}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono text-foreground/40 uppercase tracking-wider flex-shrink-0">
              {issue.category === 'performance' ? 'perf' : 
               issue.category === 'best-practice' ? 'style' : 
               issue.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Find all validation issues in the schema
 */
function findIssues(schema: SchemaState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const table of schema.tables) {
    // Check for missing primary key
    const hasPrimaryKey = table.columns.some(c => c.primaryKey);
    if (!hasPrimaryKey) {
      issues.push({
        type: 'warning',
        category: 'structure',
        table: table.name,
        message: 'No primary key defined. Every table should have a primary key for data integrity.',
      });
    }

    // Check for foreign keys without indexes
    const fkColumns = table.columns.filter(c => c.references);
    const indexes = table.indexes || [];
    
    for (const fkCol of fkColumns) {
      // Skip if column is already a PK or UNIQUE (automatically indexed)
      if (fkCol.primaryKey || fkCol.unique) {
        continue;
      }
      
      // Check if there's an index on this column (single or composite with this as first column)
      const hasIndex = indexes.some(idx => {
        // Single-column index
        if (idx.columns.length === 1 && idx.columns[0] === fkCol.name) {
          return true;
        }
        // Composite index with FK column as leftmost (benefits FK lookups)
        if (idx.columns.length > 1 && idx.columns[0] === fkCol.name) {
          return true;
        }
        return false;
      });

      if (!hasIndex) {
        issues.push({
          type: 'warning',
          category: 'performance',
          table: table.name,
          message: `Foreign key "${fkCol.name}" should have an index for better JOIN performance.`,
          fixable: true,
        });
      }
    }

    // Check for tables with too many columns
    if (table.columns.length > 30) {
      issues.push({
        type: 'suggestion',
        category: 'best-practice',
        table: table.name,
        message: `Table has ${table.columns.length} columns. Consider splitting into multiple tables for better normalization.`,
      });
    }

    // Check for missing NOT NULL on important columns
    for (const column of table.columns) {
      if (!column.primaryKey && !column.nullable && !column.defaultValue) {
        // This is actually good, but let's suggest defaults for common patterns
        if (column.name.toLowerCase().includes('created_at') || column.name.toLowerCase().includes('updated_at')) {
          if (!column.defaultValue) {
            issues.push({
              type: 'suggestion',
              category: 'best-practice',
              table: table.name,
              message: `Column "${column.name}" should have DEFAULT NOW() or CURRENT_TIMESTAMP.`,
            });
          }
        }
      }
    }

    // Check for VARCHAR without length
    for (const column of table.columns) {
      if (column.type === 'VARCHAR' && !column.length) {
        issues.push({
          type: 'warning',
          category: 'structure',
          table: table.name,
          message: `Column "${column.name}" (VARCHAR) should have a length specified.`,
        });
      }
    }

    // Check for potential many-to-many relationships that might benefit from metadata
    // Only suggest for junction tables with activity patterns (likes, follows, joins, members)
    const activityPatterns = ['like', 'follow', 'member', 'join', 'subscription', 'enrollment', 'participation'];
    const hasActivityPattern = activityPatterns.some(pattern => table.name.toLowerCase().includes(pattern));
    
    if (hasActivityPattern && table.columns.length <= 3) {
      const fks = table.columns.filter(c => c.references);
      const hasTimestamp = table.columns.some(c => 
        c.name.toLowerCase().includes('created_at') || 
        c.name.toLowerCase().includes('joined_at') ||
        c.name.toLowerCase().includes('timestamp')
      );
      
      // Suggest adding timestamps only for activity-based junction tables without them
      if (fks.length >= 2 && !hasTimestamp) {
        issues.push({
          type: 'suggestion',
          category: 'best-practice',
          table: table.name,
          message: 'Consider adding a timestamp column to track when this relationship was created.',
        });
      }
    }

    // Check for naming conventions
    if (table.name !== table.name.toLowerCase()) {
      issues.push({
        type: 'suggestion',
        category: 'naming',
        table: table.name,
        message: 'Table names should be lowercase for better portability across databases.',
      });
    }

    // Check for singular vs plural table names
    if (!table.name.endsWith('s') && table.name !== 'data' && table.name !== 'info') {
      issues.push({
        type: 'suggestion',
        category: 'naming',
        table: table.name,
        message: 'Consider using plural table names (e.g., "users" instead of "user") as a common convention.',
      });
    }
  }

  // Check for circular dependencies
  const circularDeps = findCircularDependencies(schema.tables);
  for (const cycle of circularDeps) {
    issues.push({
      type: 'warning',
      category: 'structure',
      table: cycle[0],
      message: `Circular dependency detected: ${cycle.join(' → ')}. This may cause issues with data seeding.`,
    });
  }

  // Sort by severity
  return issues.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, suggestion: 2 };
    return severityOrder[a.type] - severityOrder[b.type];
  });
}

/**
 * Find circular dependencies in foreign keys
 * Note: Self-referencing tables (tree structures) are NOT circular dependencies
 */
function findCircularDependencies(tables: SchemaTable[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(tableName: string, path: string[]): void {
    if (recursionStack.has(tableName)) {
      // Found a cycle
      const cycleStart = path.indexOf(tableName);
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), tableName];
        
        // Filter out self-references (single table cycles)
        // Self-references like messages→messages are valid tree structures, not circular dependencies
        if (cycle.length > 2 || (cycle.length === 2 && cycle[0] !== cycle[1])) {
          cycles.push(cycle);
        }
      }
      return;
    }

    if (visited.has(tableName)) {
      return;
    }

    visited.add(tableName);
    recursionStack.add(tableName);
    path.push(tableName);

    // Find all tables this table references
    const table = tables.find(t => t.name === tableName);
    if (table) {
      const referencedTables = new Set(
        table.columns
          .filter(c => c.references)
          .map(c => c.references!.table)
      );

      for (const refTable of referencedTables) {
        // Skip self-references in the traversal (they're not circular dependencies)
        if (refTable === tableName) {
          continue;
        }
        dfs(refTable, [...path]);
      }
    }

    recursionStack.delete(tableName);
  }

  for (const table of tables) {
    if (!visited.has(table.name)) {
      dfs(table.name, []);
    }
  }

  // Remove duplicate cycles (same cycle found from different starting points)
  const uniqueCycles: string[][] = [];
  const seenCycles = new Set<string>();
  
  for (const cycle of cycles) {
    // Normalize cycle by sorting to detect duplicates
    const normalized = [...cycle].sort().join('→');
    if (!seenCycles.has(normalized)) {
      seenCycles.add(normalized);
      uniqueCycles.push(cycle);
    }
  }

  return uniqueCycles;
}

