"use client";

import { QueryState } from "@/types/sql-builder";
import { useState, useMemo } from "react";
import { generateSQL, explainQuery } from "@/utils/sql-generator";
import { getMockData, applyWhere, applyOrderBy, applyPagination } from "@/utils/mock-data-generator";
import { exportToCSV, exportToJSON, exportToSQL, copyAsJSON, copyAsCSV, copyAsTable } from "@/utils/export-utils";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";

interface QueryPreviewProps {
  queryState: QueryState;
}

export default function QueryPreview({ queryState }: QueryPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
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
    
    // Apply ORDER BY
    data = applyOrderBy(data, queryState.orderBy);
    
    // Apply LIMIT and OFFSET (default to 20 rows for better UX)
    const defaultLimit = 20;
    const effectiveLimit = queryState.limit || (queryState.limit === null ? defaultLimit : null);
    data = applyPagination(data, effectiveLimit, queryState.offset);
    
    // Select only requested columns
    if (queryState.columns.length > 0) {
      return data.map(row => {
        const filtered: any = {};
        queryState.columns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });
    }
    
    return data;
  }, [queryState]);

  // Count total matching rows (before LIMIT)
  const totalMatchingRows = useMemo(() => {
    if (!queryState.table) return 0;
    let data = getMockData(queryState.table);
    data = applyWhere(data, queryState.whereConditions);
    return data.length;
  }, [queryState.table, queryState.whereConditions]);

  // Copy SQL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export handlers
  const handleExportCSV = () => {
    try {
      exportToCSV(mockResults, `${queryState.table || 'query'}-results.csv`);
      showToast('Exported to CSV successfully!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(mockResults, `${queryState.table || 'query'}-results.json`);
      showToast('Exported to JSON successfully!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleExportSQL = () => {
    try {
      exportToSQL(mockResults, queryState.table || 'table', `${queryState.table || 'query'}-inserts.sql`);
      showToast('Exported to SQL successfully!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to export: No data available', 'error');
    }
  };

  const handleCopyAsJSON = async () => {
    try {
      await copyAsJSON(mockResults);
      showToast('Copied as JSON to clipboard!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const handleCopyAsCSV = async () => {
    try {
      await copyAsCSV(mockResults);
      showToast('Copied as CSV to clipboard!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

  const handleCopyAsTable = async () => {
    try {
      await copyAsTable(mockResults);
      showToast('Copied as formatted table!', 'success');
      setShowExportMenu(false);
    } catch (error) {
      showToast('Failed to copy: No data available', 'error');
    }
  };

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

  const hasQuery = queryState.table && (queryState.queryType !== "SELECT" || queryState.columns.length > 0);

  return (
    <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
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
        {hasQuery && (
          <div className="flex flex-wrap gap-2">
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

      {/* SQL Query Display */}
      {hasQuery ? (
        <>
          <div className="relative mb-4">
            <pre className="p-4 bg-[#1e1e1e] dark:bg-black border border-gray-700 dark:border-gray-800 rounded overflow-x-auto text-xs font-mono leading-relaxed text-gray-100">
              <code className="language-sql">{sqlQuery}</code>
            </pre>
            <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">sql</div>
          </div>

          {/* Explain Query Button */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex-1 px-3 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded transition-all flex items-center justify-center gap-2 text-xs font-mono text-foreground/70 hover:text-foreground"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showExplanation ? "hide" : "explain"}
              <svg className={`w-3 h-3 transition-transform ml-auto ${showExplanation ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mb-5 p-4 bg-foreground/5 border border-foreground/10 rounded">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-foreground/70 mb-2 font-mono uppercase tracking-wider">
                    Explanation
                  </h3>
                  <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-line font-mono">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Query Results - Professional Backend Style */}
          <div className="p-4 sm:p-5 bg-white/60 dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg shadow-sm">
            {/* Header with Export Actions */}
            <div className="flex items-center justify-between mb-3 gap-3 flex-shrink-0 pb-3 border-b border-foreground/10">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Query Results</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-foreground/5 rounded text-xs font-mono">
                  <span className="font-bold text-foreground">{mockResults.length}</span>
                  <span className="text-foreground/50">
                    {totalMatchingRows > mockResults.length ? `/ ${totalMatchingRows}` : 'rows'}
                  </span>
                </div>
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-2 relative">
                {/* Quick copy button */}
                <button
                  onClick={handleCopyAsTable}
                  className="px-2 py-1 hover:bg-foreground/5 rounded text-xs font-medium text-foreground/70 hover:text-foreground transition-all flex items-center gap-1.5"
                  title="Copy table (Ctrl+C)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy</span>
                </button>
                
                {/* Export dropdown */}
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2 py-1 hover:bg-foreground/5 rounded text-xs font-medium text-foreground/70 hover:text-foreground transition-all flex items-center gap-1.5"
                  title="Export options"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                  <svg className={`w-3 h-3 transition-transform ${showExportMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Export Menu */}
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e1e1e] dark:bg-black border border-gray-700 dark:border-gray-800 rounded-lg shadow-2xl overflow-hidden z-20">
                    <div className="p-1.5">
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Download
                      </div>
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-2 py-1.5 hover:bg-white/5 rounded text-left flex items-center gap-2 transition-all group"
                      >
                        <span className="text-xs font-mono text-gray-500 group-hover:text-gray-300">.csv</span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">CSV File</span>
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full px-2 py-1.5 hover:bg-white/5 rounded text-left flex items-center gap-2 transition-all group"
                      >
                        <span className="text-xs font-mono text-gray-500 group-hover:text-gray-300">.json</span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">JSON File</span>
                      </button>
                      <button
                        onClick={handleExportSQL}
                        className="w-full px-2 py-1.5 hover:bg-white/5 rounded text-left flex items-center gap-2 transition-all group"
                      >
                        <span className="text-xs font-mono text-gray-500 group-hover:text-gray-300">.sql</span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">SQL Inserts</span>
                      </button>
                      
                      <div className="h-px bg-gray-800 my-1.5"></div>
                      
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Clipboard
                      </div>
                      <button
                        onClick={handleCopyAsJSON}
                        className="w-full px-2 py-1.5 hover:bg-white/5 rounded text-left flex items-center gap-2 transition-all group"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">Copy as JSON</span>
                      </button>
                      <button
                        onClick={handleCopyAsCSV}
                        className="w-full px-2 py-1.5 hover:bg-white/5 rounded text-left flex items-center gap-2 transition-all group"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">Copy as CSV</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {mockResults.length > 0 ? (
              <>

                {/* Table Container - Database Admin Style */}
                <div className="overflow-x-auto bg-[#fafafa] dark:bg-black/40 rounded border border-foreground/10">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#f5f5f5] dark:bg-[#0a0a0a] z-10">
                        <tr className="border-b border-foreground/10">
                          {Object.keys(mockResults[0]).map((col, idx) => (
                            <th key={idx} className="text-left py-3 px-3 font-bold text-foreground/90 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mockResults.map((row, rowIdx) => (
                          <tr 
                            key={rowIdx} 
                            className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors"
                          >
                            {Object.entries(row).map(([key, value], colIdx) => (
                              <td key={colIdx} className="py-2.5 px-3 text-foreground/70 whitespace-nowrap">
                                {typeof value === 'boolean' 
                                  ? (value ? '✓' : '✗')
                                  : typeof value === 'string' && value.includes('T') && value.includes('Z')
                                  ? new Date(value).toLocaleString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer - Professional Stats */}
                <div className="mt-3 pt-3 flex items-center justify-between gap-3 flex-shrink-0 border-t border-foreground/10">
                  <p className="text-[10px] sm:text-xs text-foreground/40 flex items-center gap-1.5 font-mono">
                    <span className="truncate">table: <strong className="text-foreground/60">{queryState.table}</strong></span>
                  </p>
                  {!queryState.limit && totalMatchingRows > 20 && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-foreground/5 text-foreground/60 rounded font-mono whitespace-nowrap">
                      LIMIT 20
                    </span>
                  )}
                  {queryState.limit && totalMatchingRows > queryState.limit && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-foreground/5 text-foreground/60 rounded font-mono whitespace-nowrap">
                      +{totalMatchingRows - queryState.limit} more
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm sm:text-base text-foreground/50 mb-1 font-medium">No matching results</p>
                <p className="text-xs text-foreground/40">Try adjusting your filters or query conditions</p>
              </div>
            )}
          </div>
        </>
      ) : (
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

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

