"use client";

import { useState, useEffect, useRef } from "react";

interface ResultsTableProps {
  mockResults: any[];
  totalMatchingRows: number;
  hasQuery: boolean;
  onCopyTable: () => void;
  exportMenu: React.ReactNode;
}

export default function ResultsTable({
  mockResults,
  totalMatchingRows,
  hasQuery,
  onCopyTable,
  exportMenu,
}: ResultsTableProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!hasQuery) return null;

  const handleCopy = () => {
    onCopyTable();
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
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
            onClick={handleCopy}
            className="px-2 py-1 hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 rounded text-xs font-medium text-foreground/70 hover:text-foreground transition-all flex items-center gap-1.5"
            title="Copy table"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
          
          {/* Export menu */}
          {exportMenu}
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
                      {Object.entries(row).map(([key, value], colIdx) => {
                        let displayValue: string;
                        if (typeof value === 'boolean') {
                          displayValue = value ? 'true' : 'false';
                        } else if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
                          displayValue = new Date(value).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } else {
                          displayValue = String(value);
                        }
                        
                        // Truncate very long values
                        const isTruncated = displayValue.length > 100;
                        const truncatedValue = isTruncated 
                          ? displayValue.substring(0, 100) + '...' 
                          : displayValue;
                        
                        return (
                          <td 
                            key={colIdx} 
                            className="py-2.5 px-3 text-foreground/70 max-w-xs" 
                            title={isTruncated ? displayValue : undefined}
                          >
                            <div className="truncate">{truncatedValue}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Info */}
          {totalMatchingRows > mockResults.length && (
            <div className="mt-3 text-xs text-foreground/40 font-mono flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing first {mockResults.length} of {totalMatchingRows} rows
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-foreground/40 font-mono">No results found</p>
          <p className="text-xs text-foreground/30 font-mono mt-1">Adjust your WHERE conditions</p>
        </div>
      )}
    </div>
  );
}

