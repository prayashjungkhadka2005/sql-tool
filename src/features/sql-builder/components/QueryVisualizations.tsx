"use client";

import { QueryState } from "@/features/sql-builder/types";
import { useMemo, useState } from "react";
import { getMockData, applyWhere } from "@/features/sql-builder/utils/mock-data-generator";
import VisualQueryFlow from "./QueryPreview/VisualQueryFlow";
import DataVisualization from "./QueryPreview/DataVisualization";
import QuickStats from "./QueryPreview/QuickStats";
import { motion, AnimatePresence } from "framer-motion";

interface QueryVisualizationsProps {
  queryState: QueryState;
  mockResults: any[];
  rowCounts: {
    total: number;
    afterWhere: number;
    afterGroupBy: number;
    final: number;
  };
}

export default function QueryVisualizations({ 
  queryState, 
  mockResults = [],
  rowCounts 
}: QueryVisualizationsProps) {
  const [isQueryFlowOpen, setIsQueryFlowOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(true);

  const hasQuery = queryState.table && (
    queryState.queryType !== "SELECT" || 
    queryState.columns.length > 0 || 
    (queryState.aggregates && queryState.aggregates.length > 0)
  );

  // Check if query has features worth visualizing
  const hasVisualizableFeatures = 
    queryState.whereConditions.length > 0 ||
    queryState.orderBy.length > 0 ||
    (queryState.aggregates && queryState.aggregates.length > 0) ||
    (queryState.groupBy && queryState.groupBy.length > 0) ||
    (queryState.having && queryState.having.length > 0) ||
    (queryState.limit && queryState.limit > 0);

  // Don't render if no query OR nothing interesting to visualize
  if (!hasQuery || !hasVisualizableFeatures) return null;

  // Show helpful message if no results
  const hasResults = mockResults && mockResults.length > 0;
  
  if (!hasResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-foreground mb-1">No Results to Visualize</div>
            <p className="text-xs text-foreground/60 font-mono">
              Your query returned 0 rows. Try adjusting your WHERE conditions or check your data.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Quick Stats - Always show for any query */}
      <QuickStats 
        queryState={queryState}
        totalRows={rowCounts.total}
        displayedRows={rowCounts.final}
      />

      {/* Query Flow Visualization */}
      <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
        <button
          onClick={() => setIsQueryFlowOpen(!isQueryFlowOpen)}
          className="w-full flex items-center justify-between hover:bg-foreground/5 active:bg-foreground/10 transition-colors -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 -mt-5 sm:-mt-6 mb-4"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Query Execution Flow
              </h3>
              <p className="text-xs text-foreground/40 font-mono mt-0.5">
                → see how your data transforms step-by-step
              </p>
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-foreground/40 transition-transform ${isQueryFlowOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isQueryFlowOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VisualQueryFlow
                queryState={queryState}
                totalRows={rowCounts.total}
                afterWhereRows={rowCounts.afterWhere}
                afterGroupByRows={rowCounts.afterGroupBy}
                finalRows={rowCounts.final}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Data Visualization Charts - Only show if query has GROUP BY + aggregates */}
      {queryState.aggregates && queryState.aggregates.length > 0 && queryState.groupBy && queryState.groupBy.length > 0 && (
      <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
        <button
          onClick={() => setIsChartsOpen(!isChartsOpen)}
          className="w-full flex items-center justify-between hover:bg-foreground/5 active:bg-foreground/10 transition-colors -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 -mt-5 sm:-mt-6 mb-4"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Data Visualizations
              </h3>
              <p className="text-xs text-foreground/40 font-mono mt-0.5">
                → charts and graphs for your query results
              </p>
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-foreground/40 transition-transform ${isChartsOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isChartsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DataVisualization
                data={mockResults}
                hasAggregates={(queryState.aggregates && queryState.aggregates.length > 0) || false}
                hasGroupBy={(queryState.groupBy && queryState.groupBy.length > 0) || false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </motion.div>
  );
}

