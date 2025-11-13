"use client";

import { QueryState, TableSchema } from "@/features/sql-builder/types";
import { useMemo } from "react";
import { SAMPLE_TABLES } from "@/features/sql-builder/types";
import { getCSVData } from "../../utils/csv-data-manager";

interface QuickStatsProps {
  queryState: QueryState;
  totalRows: number;
  displayedRows: number;
}

export default function QuickStats({ queryState, totalRows, displayedRows }: QuickStatsProps) {
  // Generate contextual suggestions based on query state
  const suggestions = useMemo(() => {
    const tips: string[] = [];
    
    // Get table schema for smarter suggestions (CSV or mock)
    let tableSchema: TableSchema | undefined;
    const csvData = getCSVData(queryState.table);
    if (csvData) {
      tableSchema = { name: csvData.tableName, columns: csvData.columns } as TableSchema;
    } else {
      tableSchema = SAMPLE_TABLES.find(t => t.name === queryState.table);
    }
    if (!tableSchema) return tips;

    // Suggestion 1: Add WHERE if none exists (but deprioritize for aggregate queries)
    const hasCompleteAggregateQuery = (queryState.aggregates && queryState.aggregates.length > 0) && 
                                      (queryState.groupBy && queryState.groupBy.length > 0);
    
    if (queryState.whereConditions.length === 0 && !hasCompleteAggregateQuery) {
      const statusCol = tableSchema.columns.find(c => c.name === 'status');
      const ageCol = tableSchema.columns.find(c => c.name === 'age');
      
      if (statusCol) {
        tips.push("Try adding WHERE clause to filter by status");
      } else if (ageCol) {
        tips.push("Try adding WHERE clause to filter by age");
      } else {
        tips.push("Try adding WHERE clause to filter results");
      }
    }

    // Suggestion 2: Add aggregates if they have GROUP BY (fix incomplete query)
    if (queryState.groupBy && queryState.groupBy.length > 0 && (!queryState.aggregates || queryState.aggregates.length === 0)) {
      tips.push("Add COUNT(*) or other aggregates to analyze grouped data");
    }
    
    // Suggestion 3: Add GROUP BY if they have aggregates (better analytics)
    else if (queryState.aggregates && queryState.aggregates.length > 0 && (!queryState.groupBy || queryState.groupBy.length === 0)) {
      const statusCol = tableSchema.columns.find(c => c.name === 'status');
      const cityCol = tableSchema.columns.find(c => c.name === 'city');
      
      if (statusCol) {
        tips.push("Add GROUP BY status to see breakdown by category");
      } else if (cityCol) {
        tips.push("Add GROUP BY city to analyze by location");
      } else {
        tips.push("Add GROUP BY to analyze data by categories");
      }
    }

    // Suggestion 4: Add ORDER BY if none exists (polish the query)
    else if (queryState.orderBy.length === 0) {
      // For aggregate queries, suggest ordering by aggregate
      if (hasCompleteAggregateQuery && queryState.aggregates && queryState.aggregates.length > 0) {
        const firstAggregate = queryState.aggregates[0];
        const aggName = `${firstAggregate.function}_${firstAggregate.column}`;
        tips.push(`Try ORDER BY ${aggName} DESC to see top results`);
      } else {
        const createdCol = tableSchema.columns.find(c => c.name === 'created_at');
        const idCol = tableSchema.columns.find(c => c.name === 'id');
        
        if (createdCol) {
          tips.push("Try ORDER BY created_at DESC to see newest first");
        } else if (idCol) {
          tips.push("Try ORDER BY to sort your results");
        }
      }
    }
    
    // Suggestion 5: Add HAVING for aggregate filtering (advanced tip)
    else if (hasCompleteAggregateQuery && (!queryState.having || queryState.having.length === 0)) {
      tips.push("Try HAVING to filter aggregated results (e.g., COUNT > 5)");
    }

    // Return max 2 suggestions
    return tips.slice(0, 2);
  }, [queryState]);

  // Get table schema for column count (CSV or mock)
  const tableSchema = useMemo(() => {
    const csvData = getCSVData(queryState.table);
    if (csvData) {
      return { name: csvData.tableName, columns: csvData.columns } as TableSchema;
    }
    return SAMPLE_TABLES.find(t => t.name === queryState.table);
  }, [queryState.table]);
  
  const columnCount = queryState.columns.length > 0 ? queryState.columns.length : tableSchema?.columns.length || 0;

  return (
    <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-foreground/10">
        <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Quick Stats
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Rows */}
        <div className="p-3 border border-foreground/10 rounded-lg">
          <div className="text-xs text-foreground/50 font-mono uppercase mb-1">Rows</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">{displayedRows}</span>
            <span className="text-xs text-foreground/40 font-mono">/ {totalRows}</span>
          </div>
          {displayedRows < totalRows && (
            <div className="text-[10px] text-foreground/40 font-mono mt-1">
              showing first {displayedRows}
            </div>
          )}
        </div>

        {/* Columns */}
        <div className="p-3 border border-foreground/10 rounded-lg">
          <div className="text-xs text-foreground/50 font-mono uppercase mb-1">Columns</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground">{columnCount}</span>
            <span className="text-xs text-foreground/40 font-mono">selected</span>
          </div>
          {queryState.aggregates && queryState.aggregates.length > 0 && (
            <div className="text-[10px] text-foreground/40 font-mono mt-1">
              + {queryState.aggregates.length} aggregate{queryState.aggregates.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="pt-3 border-t border-foreground/10">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs font-semibold text-foreground">Try Next</div>
          </div>
          <div className="space-y-1.5">
            {suggestions.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <svg className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-xs text-foreground/70 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

