"use client";

import { QueryState, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { useState, useMemo, useEffect } from "react";
import { generateSQL, explainQuery } from "@/features/sql-builder/utils/sql-generator";
import { getMockData, applyWhere, applyOrderBy, applyPagination, executeJoins, getJoinColumnValue } from "@/features/sql-builder/utils/mock-data-generator";
import { exportToCSV, exportToJSON, exportToSQL, exportToMarkdown, copyAsJSON, copyAsCSV, copyAsTable, copyAsMarkdown } from "@/features/sql-builder/utils/export-utils";
import { isInsertQueryValid } from "@/features/sql-builder/utils/insert-validator";
import { useToast } from "@/features/sql-builder/hooks/useToast";
import Toast from "@/features/sql-builder/components/ui/Toast";

// Import sub-components
import QueryExplanation from "./QueryExplanation";
import ResultsTable from "./ResultsTable";
import ExportMenu from "./ExportMenu";
import ValidationBanner from "./ValidationBanner";
import SQLDisplay from "@/features/sql-builder/components/SQLDisplay";

interface QueryPreviewProps {
  queryState: QueryState;
  onAutoFix?: (fixType: string) => void;
  onRowCountsChange?: (counts: { total: number; afterWhere: number; afterGroupBy: number; final: number }) => void;
  onResultsChange?: (results: any[]) => void;
}

export default function QueryPreview({ queryState, onAutoFix, onRowCountsChange, onResultsChange }: QueryPreviewProps) {
  const { toast, showToast, hideToast } = useToast();

  // Generate SQL query
  const sqlQuery = useMemo(() => {
    return generateSQL(queryState);
  }, [queryState]);

  // Generate explanation
  const explanation = useMemo(() => {
    return explainQuery(queryState);
  }, [queryState]);

  // Get realistic mock results
  const mockResults = useMemo(() => {
    if (!queryState.table) return [];
    
    // INSERT queries don't return results (show success message instead)
    if (queryState.queryType === "INSERT") {
      return [];
    }
    
    try {
      // Get all mock data for table (with JOINs if present)
      let data = queryState.joins && queryState.joins.length > 0
        ? executeJoins(queryState.table, queryState.joins)
        : getMockData(queryState.table);
      
      // If no data (table might have been deleted), return empty
      if (!data || data.length === 0) return [];
      
      // Apply WHERE filters
      data = applyWhere(data, queryState.whereConditions);
    
    // Handle aggregate queries with GROUP BY
    if (queryState.aggregates && queryState.aggregates.length > 0) {
      // Group data
      const groups: Record<string, any[]> = {};
      
      data.forEach(row => {
        // Create group key from groupBy columns
        const groupKey = queryState.groupBy && queryState.groupBy.length > 0
          ? queryState.groupBy.map(col => String(getJoinColumnValue(row, col) ?? '')).join('|||')
          : 'all';
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(row);
      });
      
      // Calculate aggregates for each group (guarded)
      data = Object.entries(groups).map(([groupKey, rows]) => {
        const result: any = {};
        
        // Add groupBy columns
        if (queryState.groupBy && queryState.groupBy.length > 0) {
          queryState.groupBy.forEach((col, idx) => {
            const value = groupKey.split('|||')[idx];
            result[col] = value === '' ? null : (isNaN(Number(value)) ? value : Number(value));
          });
        }
        
        // Calculate aggregates
        queryState.aggregates!.forEach(agg => {
          const columnName = agg.alias || `${agg.function}(${agg.column})`;
          
          switch (agg.function) {
            case 'COUNT':
              if (agg.column === '*') {
                result[columnName] = rows.length;
              } else {
                result[columnName] = rows.filter(r => getJoinColumnValue(r, agg.column) != null).length;
              }
              break;
            case 'SUM':
              result[columnName] = rows.reduce((sum, r) => sum + (isNaN(Number(getJoinColumnValue(r, agg.column))) ? 0 : Number(getJoinColumnValue(r, agg.column))), 0);
              break;
            case 'AVG':
              const values = rows.map(r => (isNaN(Number(getJoinColumnValue(r, agg.column))) ? 0 : Number(getJoinColumnValue(r, agg.column))));
              result[columnName] = values.length > 0 
                ? values.reduce((a, b) => a + b, 0) / values.length 
                : 0;
              break;
            case 'MIN':
              const minValues = rows.map(r => (isNaN(Number(getJoinColumnValue(r, agg.column))) ? Infinity : Number(getJoinColumnValue(r, agg.column))));
              const minResult = minValues.length > 0 ? Math.min(...minValues) : 0;
              result[columnName] = minResult === Infinity ? 0 : minResult; // If all NaN, return 0
              break;
            case 'MAX':
              const maxValues = rows.map(r => (isNaN(Number(getJoinColumnValue(r, agg.column))) ? -Infinity : Number(getJoinColumnValue(r, agg.column))));
              const maxResult = maxValues.length > 0 ? Math.max(...maxValues) : 0;
              result[columnName] = maxResult === -Infinity ? 0 : maxResult; // If all NaN, return 0
              break;
          }
        });
        
        // Add regular columns (non-aggregate, non-groupBy)
        queryState.columns.forEach(col => {
          if (queryState.groupBy && !queryState.groupBy.includes(col)) {
            // For non-grouped columns, take first value (SQL would require aggregation)
            result[col] = rows[0] ? getJoinColumnValue(rows[0], col) : undefined;
          } else if (!queryState.groupBy || queryState.groupBy.length === 0) {
            result[col] = rows[0] ? getJoinColumnValue(rows[0], col) : undefined;
          }
        });
        
        return result;
      });
      
      // Apply HAVING filters
      if (queryState.having && queryState.having.length > 0) {
        data = data.filter(row => {
          let result = true;
          queryState.having!.forEach((condition, index) => {
            const alias = queryState.aggregates!.find(a => a.function === condition.function && a.column === condition.column)?.alias;
            const directKey = condition.function + '(' + condition.column + ')';
            const rawValue = (alias && row[alias] !== undefined) ? row[alias] : row[directKey];
            const aggValue = Number(rawValue);
            let conditionMet = false;
            
            switch (condition.operator) {
              case '=':
                conditionMet = !isNaN(aggValue) && aggValue === Number(condition.value);
                break;
              case '!=':
                conditionMet = !isNaN(aggValue) && aggValue !== Number(condition.value);
                break;
              case '>':
                conditionMet = !isNaN(aggValue) && aggValue > Number(condition.value);
                break;
              case '<':
                conditionMet = !isNaN(aggValue) && aggValue < Number(condition.value);
                break;
              case '>=':
                conditionMet = !isNaN(aggValue) && aggValue >= Number(condition.value);
                break;
              case '<=':
                conditionMet = !isNaN(aggValue) && aggValue <= Number(condition.value);
                break;
            }
            
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
    } else {
      // Non-aggregate query: just select columns
      if (queryState.columns.length > 0) {
        data = data.map(row => {
          const filtered: any = {};
          queryState.columns.forEach(col => {
            // Handle both prefixed and non-prefixed columns
            const value = getJoinColumnValue(row, col);
            if (value !== undefined) {
              filtered[col] = value;
            }
          });
          return filtered;
        });
      }
    }
    
    // Apply DISTINCT (remove duplicate rows)
    if (queryState.distinct && data.length > 0) {
      const seen = new Set<string>();
      data = data.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }
    
      // Apply ORDER BY (after grouping for aggregate queries)
      data = applyOrderBy(data, queryState.orderBy);
      
      // Apply LIMIT and OFFSET (default to 20 rows for better UX)
      const defaultLimit = 20;
      const effectiveLimit = queryState.limit || (queryState.limit === null ? defaultLimit : null);
      data = applyPagination(data, effectiveLimit, queryState.offset);
      
      return data;
    } catch (error) {
      // If any error occurs (e.g., deleted table), return empty array
      console.error('Error executing query:', error);
      return [];
    }
  }, [queryState]);

  // Count total matching rows (before LIMIT)
  const totalMatchingRows = useMemo(() => {
    if (!queryState.table) return 0;
    try {
      let data = getMockData(queryState.table);
      if (!data || data.length === 0) return 0;
      data = applyWhere(data, queryState.whereConditions);
      return data.length;
    } catch (error) {
      console.error('Error counting rows:', error);
      return 0;
    }
  }, [queryState.table, queryState.whereConditions]);

  // Row counts for visual flow
  const rowCounts = useMemo(() => {
    if (!queryState.table) return { total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 };
    
    // INSERT queries don't have row counts
    if (queryState.queryType === "INSERT") {
      return { total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 };
    }
    
    try {
      // Get data (with JOINs if present)
      let data = queryState.joins && queryState.joins.length > 0
        ? executeJoins(queryState.table, queryState.joins)
        : getMockData(queryState.table);
      
      if (!data || data.length === 0) {
        return { total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 };
      }
      
      const total = data.length;
    
    // After WHERE
    data = applyWhere(data, queryState.whereConditions);
    const afterWhere = data.length;
    
    // After GROUP BY (if exists)
    let afterGroupBy = afterWhere;
    if (queryState.aggregates && queryState.aggregates.length > 0) {
      const groups: Record<string, any[]> = {};
      data.forEach(row => {
        const groupKey = queryState.groupBy && queryState.groupBy.length > 0
          ? queryState.groupBy.map(col => String(getJoinColumnValue(row, col) ?? '')).join('|||')
          : 'all';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
      });
      afterGroupBy = Object.keys(groups).length;
    }
    
      // Final (after HAVING and LIMIT)
      const final = mockResults.length;
      
      return { total, afterWhere, afterGroupBy, final };
    } catch (error) {
      console.error('Error calculating row counts:', error);
      return { total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 };
    }
  }, [queryState, mockResults]);

  // Notify parent of changes for visualizations
  useEffect(() => {
    if (onRowCountsChange) {
      onRowCountsChange(rowCounts);
    }
  }, [rowCounts, onRowCountsChange]);

  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(mockResults);
    }
  }, [mockResults, onResultsChange]);

  // Download as .sql file
  const downloadSQL = () => {
    const blob = new Blob([sqlQuery], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export handlers
  const handleExportCSV = () => {
    try {
      exportToCSV(mockResults, `${queryState.table || 'query'}-results.csv`);
      showToast('Exported to CSV successfully!', 'success');
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(mockResults, `${queryState.table || 'query'}-results.json`);
      showToast('Exported to JSON successfully!', 'success');
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleExportSQL = () => {
    try {
      exportToSQL(mockResults, queryState.table || 'table', `${queryState.table || 'query'}-inserts.sql`);
      showToast('Exported to SQL successfully!', 'success');
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleCopyAsJSON = async () => {
    try {
      await copyAsJSON(mockResults);
      showToast('Copied as JSON to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const handleCopyAsCSV = async () => {
    try {
      await copyAsCSV(mockResults);
      showToast('Copied as CSV to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const handleCopyAsTable = async () => {
    try {
      await copyAsTable(mockResults);
      showToast('Copied as table to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const handleExportMarkdown = () => {
    try {
      exportToMarkdown(mockResults, `${queryState.table || 'query'}-results.md`);
      showToast('Exported to Markdown successfully!', 'success');
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleCopyAsMarkdown = async () => {
    try {
      await copyAsMarkdown(mockResults);
      showToast('Copied as Markdown to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const hasQuery = queryState.table && (
    queryState.queryType !== "SELECT" || 
    queryState.columns.length > 0 || 
    (queryState.aggregates && queryState.aggregates.length > 0)
  );

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // Check clipboard API support
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        showToast('Clipboard API not supported in your browser', 'error');
        return;
      }
      
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy SQL to clipboard', 'error');
    }
  };

  return (
    <div className={`relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6 flex flex-col ${
      !queryState.table ? 'h-fit' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-foreground/10">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Generated SQL</h2>
            {hasQuery && (
              <p className="text-xs text-foreground/40 font-mono mt-0.5">
                → ready to execute
              </p>
            )}
          </div>
        </div>

        {/* Copy/Download Buttons in Header */}
        {hasQuery && (
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="text-xs px-3 py-1.5 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
              aria-label="Copy SQL to clipboard"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  copy
                </>
              )}
            </button>
            <button
              onClick={downloadSQL}
              className="hidden sm:flex text-xs px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 hover:border-foreground/20 text-foreground rounded transition-all items-center gap-1.5 font-mono"
              aria-label="Download SQL file"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              download
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {hasQuery ? (
        <>
          {/* SQL Code Display with Syntax Highlighting */}
          <div className="relative mb-4">
            <div className="p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded overflow-x-auto">
              <SQLDisplay sql={sqlQuery} />
            </div>
            <div className="absolute top-2 right-2 text-[10px] text-foreground/40 font-mono uppercase tracking-wider">sql</div>
          </div>

          {/* Query Explanation */}
          <QueryExplanation
            explanation={explanation}
            hasQuery={hasQuery}
          />

          {/* Validation Banner - Shows errors/warnings with auto-fix */}
          <ValidationBanner 
            queryState={queryState}
            onAutoFix={onAutoFix}
          />

          {/* Results Table with Export - Only for SELECT queries */}
          {queryState.queryType === "SELECT" ? (
            <ResultsTable
              mockResults={mockResults}
              totalMatchingRows={totalMatchingRows}
              hasQuery={hasQuery}
              onCopyTable={handleCopyAsTable}
              exportMenu={
                <ExportMenu
                  mockResults={mockResults}
                  tableName={queryState.table || 'query'}
                  onExportCSV={handleExportCSV}
                  onExportJSON={handleExportJSON}
                  onExportSQL={handleExportSQL}
                  onExportMarkdown={handleExportMarkdown}
                  onCopyJSON={handleCopyAsJSON}
                  onCopyCSV={handleCopyAsCSV}
                  onCopyTable={handleCopyAsTable}
                  onCopyMarkdown={handleCopyAsMarkdown}
                />
              }
            />
          ) : queryState.queryType === "INSERT" ? (
            /* INSERT Success Message - Only show if valid (use centralized validator) */
            isInsertQueryValid(queryState) ? (
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1 font-mono">
                      Ready to INSERT
                    </h4>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80 font-mono leading-relaxed">
                      This query will insert 1 new row into the <span className="font-bold">{queryState.table}</span> table. 
                      In a real database, this would add the data permanently. 
                      {Object.keys(queryState.insertValues).filter(k => queryState.insertValues[k]).length > 0 && (
                        <> You&apos;re setting {Object.keys(queryState.insertValues).filter(k => queryState.insertValues[k]).length} column{Object.keys(queryState.insertValues).filter(k => queryState.insertValues[k]).length > 1 ? 's' : ''}.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : null
          ) : null}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 p-3 bg-foreground/5 rounded-lg border border-foreground/10">
            <svg className="w-8 h-8 text-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5 font-mono uppercase tracking-wider">
            No Query Yet
          </h3>
          <p className="text-xs text-foreground/40 font-mono">
            → select table and columns to start
          </p>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

