"use client";

import { QueryState } from "@/features/sql-builder/types";
import { useState, useMemo } from "react";
import { generateSQL, explainQuery } from "@/features/sql-builder/utils/sql-generator";
import { getMockData, applyWhere, applyOrderBy, applyPagination } from "@/features/sql-builder/utils/mock-data-generator";
import { exportToCSV, exportToJSON, exportToSQL, copyAsJSON, copyAsCSV, copyAsTable } from "@/features/sql-builder/utils/export-utils";
import { useToast } from "@/features/sql-builder/hooks/useToast";
import Toast from "@/features/sql-builder/components/ui/Toast";

// Import sub-components
import QueryExplanation from "./QueryExplanation";
import ResultsTable from "./ResultsTable";
import ExportMenu from "./ExportMenu";
import VisualQueryFlow from "./VisualQueryFlow";
import DataVisualization from "./DataVisualization";
import ValidationBanner from "./ValidationBanner";

interface QueryPreviewProps {
  queryState: QueryState;
  onAutoFix?: (fixType: string) => void;
}

export default function QueryPreview({ queryState, onAutoFix }: QueryPreviewProps) {
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
    
    // Get all mock data for table
    let data = getMockData(queryState.table);
    
    // Apply WHERE filters
    data = applyWhere(data, queryState.whereConditions);
    
    // Handle aggregate queries with GROUP BY
    if (queryState.aggregates && queryState.aggregates.length > 0) {
      // Group data
      const groups: Record<string, any[]> = {};
      
      data.forEach(row => {
        // Create group key from groupBy columns
        const groupKey = queryState.groupBy && queryState.groupBy.length > 0
          ? queryState.groupBy.map(col => String(row[col] ?? '')).join('|||')
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
                result[columnName] = rows.filter(r => r[agg.column] != null).length;
              }
              break;
            case 'SUM':
              result[columnName] = rows.reduce((sum, r) => sum + (isNaN(Number(r[agg.column])) ? 0 : Number(r[agg.column])), 0);
              break;
            case 'AVG':
              const values = rows.map(r => (isNaN(Number(r[agg.column])) ? 0 : Number(r[agg.column])));
              result[columnName] = values.length > 0 
                ? values.reduce((a, b) => a + b, 0) / values.length 
                : 0;
              break;
            case 'MIN':
              const minValues = rows.map(r => (isNaN(Number(r[agg.column])) ? Infinity : Number(r[agg.column])));
              result[columnName] = minValues.length > 0 ? Math.min(...minValues) : 0;
              break;
            case 'MAX':
              const maxValues = rows.map(r => (isNaN(Number(r[agg.column])) ? -Infinity : Number(r[agg.column])));
              result[columnName] = maxValues.length > 0 ? Math.max(...maxValues) : 0;
              break;
          }
        });
        
        // Add regular columns (non-aggregate, non-groupBy)
        queryState.columns.forEach(col => {
          if (queryState.groupBy && !queryState.groupBy.includes(col)) {
            // For non-grouped columns, take first value (SQL would require aggregation)
            result[col] = rows[0]?.[col];
          } else if (!queryState.groupBy || queryState.groupBy.length === 0) {
            result[col] = rows[0]?.[col];
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
            if (col in row) {
              filtered[col] = row[col];
            }
          });
          return filtered;
        });
      }
    }
    
    // Apply ORDER BY (after grouping for aggregate queries)
    data = applyOrderBy(data, queryState.orderBy);
    
    // Apply LIMIT and OFFSET (default to 20 rows for better UX)
    const defaultLimit = 20;
    const effectiveLimit = queryState.limit || (queryState.limit === null ? defaultLimit : null);
    data = applyPagination(data, effectiveLimit, queryState.offset);
    
    return data;
  }, [queryState]);

  // Count total matching rows (before LIMIT)
  const totalMatchingRows = useMemo(() => {
    if (!queryState.table) return 0;
    let data = getMockData(queryState.table);
    data = applyWhere(data, queryState.whereConditions);
    return data.length;
  }, [queryState.table, queryState.whereConditions]);

  // Row counts for visual flow
  const rowCounts = useMemo(() => {
    if (!queryState.table) return { total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 };
    
    let data = getMockData(queryState.table);
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
          ? queryState.groupBy.map(col => String(row[col] ?? '')).join('|||')
          : 'all';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
      });
      afterGroupBy = Object.keys(groups).length;
    }
    
    // Final (after HAVING and LIMIT)
    const final = mockResults.length;
    
    return { total, afterWhere, afterGroupBy, final };
  }, [queryState, mockResults]);

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
      // No toast needed - button shows "copied" feedback
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const hasQuery = queryState.table && (
    queryState.queryType !== "SELECT" || 
    queryState.columns.length > 0 || 
    (queryState.aggregates && queryState.aggregates.length > 0)
  );

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
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
              className="text-xs px-3 py-1.5 bg-foreground/10 hover:bg-foreground/15 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
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
              className="hidden sm:flex text-xs px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 text-foreground rounded transition-all items-center gap-1.5 font-mono"
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
          {/* SQL Code Display */}
          <div className="relative mb-4">
            <pre className="p-4 bg-[#1e1e1e] dark:bg-black border border-gray-700 dark:border-gray-800 rounded overflow-x-auto text-xs font-mono leading-relaxed text-gray-100">
              <code className="language-sql">{sqlQuery}</code>
            </pre>
            <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">sql</div>
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

          {/* Visual Query Flow - NEW! */}
          <VisualQueryFlow
            queryState={queryState}
            totalRows={rowCounts.total}
            afterWhereRows={rowCounts.afterWhere}
            afterGroupByRows={rowCounts.afterGroupBy}
            finalRows={rowCounts.final}
          />

          {/* Data Visualization Charts - NEW! */}
          <DataVisualization
            data={mockResults}
            hasAggregates={(queryState.aggregates && queryState.aggregates.length > 0) || false}
            hasGroupBy={(queryState.groupBy && queryState.groupBy.length > 0) || false}
          />

          {/* Results Table with Export */}
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
                onCopyJSON={handleCopyAsJSON}
                onCopyCSV={handleCopyAsCSV}
                onCopyTable={handleCopyAsTable}
              />
            }
          />
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 p-6 bg-foreground/5 rounded-lg border border-foreground/10">
            <svg className="w-12 h-12 text-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2 font-mono uppercase tracking-wider">
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

