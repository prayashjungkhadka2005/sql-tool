"use client";

import { motion } from "framer-motion";
import Navbar from "@/features/sql-builder/components/Navbar";
import Footer from "@/features/sql-builder/components/Footer";
import QuickTemplates from "@/features/sql-builder/components/QuickTemplates";
import QueryTypeSelector from "@/features/sql-builder/components/QueryTypeSelector";
import TableSelector from "@/features/sql-builder/components/TableSelector";
import ColumnsSelector from "@/features/sql-builder/components/ColumnsSelector";
import AggregateSelector from "@/features/sql-builder/components/AggregateSelector";
import WhereClauseBuilder from "@/features/sql-builder/components/WhereClauseBuilder";
import GroupByBuilder from "@/features/sql-builder/components/GroupByBuilder";
import HavingBuilder from "@/features/sql-builder/components/HavingBuilder";
import OrderByBuilder from "@/features/sql-builder/components/OrderByBuilder";
import QueryPreview from "@/features/sql-builder/components/QueryPreview";
import HelpTooltip from "@/features/sql-builder/components/HelpTooltip";
import TableStructureVisualizer from "@/features/sql-builder/components/TableStructureVisualizer";
import LearningHints from "@/features/sql-builder/components/LearningHints";
import QueryVisualizations from "@/features/sql-builder/components/QueryVisualizations";
import { useQueryBuilder } from "@/features/sql-builder/hooks/useQueryBuilder";
import { useState, useCallback } from "react";

export default function Home() {
  const {
    queryState,
    updateQueryType,
    updateTable,
    updateColumns,
    updateAggregates,
    updateDistinct,
    updateWhereConditions,
    updateGroupBy,
    updateHaving,
    updateOrderBy,
    updateLimit,
    updateOffset,
    reset: resetBuilder,
    loadTemplate,
  } = useQueryBuilder();

  // State for visualizations
  const [rowCounts, setRowCounts] = useState({ total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 });
  const [mockResults, setMockResults] = useState<any[]>([]);

  // State for collapsible sections (default: open for better UX)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(true);
  const [isSortingOpen, setIsSortingOpen] = useState(true);

  // Memoized callbacks to prevent infinite loops
  const handleRowCountsChange = useCallback((counts: typeof rowCounts) => {
    setRowCounts(counts);
  }, []);

  const handleResultsChange = useCallback((results: any[]) => {
    setMockResults(results);
  }, []);

  // Auto-fix handler for validation issues
  const handleAutoFix = (fixType: string) => {
    switch (fixType) {
      case "add-group-by-for-having":
        // Add all non-aggregated columns to GROUP BY
        if (queryState.columns.length > 0) {
          updateGroupBy([...queryState.columns]);
        }
        break;
      
      case "add-columns-to-group-by":
        // Add all selected columns to GROUP BY
        const existingGroupBy = queryState.groupBy || [];
        const newGroupBy = [...new Set([...existingGroupBy, ...queryState.columns])];
        updateGroupBy(newGroupBy);
        break;
      
      case "add-count-aggregate":
        // Add COUNT(*) aggregate
        const existingAggregates = queryState.aggregates || [];
        updateAggregates([
          ...existingAggregates,
          { id: Date.now().toString(), function: "COUNT", column: "*", alias: "count" }
        ]);
        break;
      
      case "remove-empty-where":
        // Remove WHERE conditions with empty values
        const validConditions = queryState.whereConditions.filter(c => c.value && c.value.trim() !== '');
        updateWhereConditions(validConditions);
        break;
      
      case "remove-empty-having":
        // Remove HAVING conditions with empty values
        const validHaving = queryState.having.filter(h => h.value && h.value.trim() !== '');
        updateHaving(validHaving);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Subtle Grid Pattern - Backend Style */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
        
        {/* Hero Section */}
        <div className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 bg-foreground/5 border border-foreground/10 rounded font-mono text-xs">
                <svg className="w-3.5 h-3.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span className="text-foreground/70 uppercase tracking-wider">Backend Tools</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                  SQL Query Builder
                </h1>
                <span className="px-2.5 py-0.5 bg-foreground/10 border border-foreground/20 text-foreground/60 text-xs font-mono rounded">
                  BETA
                </span>
              </div>
              
              <p className="text-base sm:text-lg text-foreground/60 max-w-3xl mx-auto mb-8 leading-relaxed font-mono text-sm">
                Visual SQL query builder with real-time code generation
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded">
                  <span className="text-foreground/40">→</span>
                  <span className="text-foreground/70">Real-time Generation</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded">
                  <span className="text-foreground/40">→</span>
                  <span className="text-foreground/70">Export Results</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded">
                  <span className="text-foreground/40">→</span>
                  <span className="text-foreground/70">No Database Required</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 pb-12">
          {/* Quick Templates */}
          <QuickTemplates onLoadTemplate={loadTemplate} />

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Left Panel - Query Builder */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-foreground/10">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Query Builder</h2>
                        <p className="text-xs text-foreground/40 font-mono mt-0.5">
                          {!queryState.table 
                            ? "→ step 1: select a table to start" 
                            : queryState.columns.length === 0 
                            ? "table selected! → step 2: choose columns"
                            : queryState.whereConditions.length === 0
                            ? "looking good! → add filters or export"
                            : "great! query ready to execute"}
                        </p>
                      </div>
                    </div>
                    {queryState.table && (
                      <button
                        onClick={resetBuilder}
                        className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 rounded transition-all font-mono text-foreground/60 hover:text-foreground flex items-center gap-1.5"
                        title="Reset"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    <QueryTypeSelector
                      value={queryState.queryType}
                      onChange={updateQueryType}
                    />

                    <TableSelector
                      value={queryState.table}
                      onChange={updateTable}
                    />

                    {queryState.table && queryState.queryType === "SELECT" && (
                      <>
                        {/* Table Structure Visualizer - NEW! */}
                        <TableStructureVisualizer
                          tableName={queryState.table}
                          selectedColumns={queryState.columns}
                          selectedGroupBy={queryState.groupBy}
                        />

                        <ColumnsSelector
                          table={queryState.table}
                          selectedColumns={queryState.columns}
                          onChange={updateColumns}
                        />

                        {/* Advanced Filters - Collapsible */}
                        <div className="border border-foreground/10 rounded-lg overflow-visible">
                          <button
                            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                <span className="text-xs font-mono font-semibold text-foreground/80 uppercase tracking-wider">
                                  Advanced Filters
                                </span>
                                {/* Active indicator */}
                                {(queryState.aggregates.length > 0 || queryState.whereConditions.length > 0 || (queryState.groupBy && queryState.groupBy.length > 0) || (queryState.having && queryState.having.length > 0)) && (
                                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded">
                                    active
                                  </span>
                                )}
                              </div>
                              {/* Summary when collapsed */}
                              {!isAdvancedFiltersOpen && (
                                <div className="text-[10px] text-foreground/40 font-mono mt-1">
                                  {queryState.aggregates.length > 0 && `${queryState.aggregates.length} aggregate${queryState.aggregates.length > 1 ? 's' : ''}`}
                                  {queryState.whereConditions.length > 0 && `${queryState.aggregates.length > 0 ? ' • ' : ''}${queryState.whereConditions.length} filter${queryState.whereConditions.length > 1 ? 's' : ''}`}
                                  {(queryState.groupBy && queryState.groupBy.length > 0) && `${(queryState.aggregates.length > 0 || queryState.whereConditions.length > 0) ? ' • ' : ''}grouped by ${queryState.groupBy.length}`}
                                  {(queryState.having && queryState.having.length > 0) && `${(queryState.aggregates.length > 0 || queryState.whereConditions.length > 0 || (queryState.groupBy && queryState.groupBy.length > 0)) ? ' • ' : ''}${queryState.having.length} having`}
                                  {!(queryState.aggregates.length > 0 || queryState.whereConditions.length > 0 || (queryState.groupBy && queryState.groupBy.length > 0) || (queryState.having && queryState.having.length > 0)) && 'click to add filters'}
                                </div>
                              )}
                            </div>
                            <svg 
                              className={`w-4 h-4 text-foreground/40 transition-transform ${isAdvancedFiltersOpen ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isAdvancedFiltersOpen && (
                            <div className="p-4 space-y-5 border-t border-foreground/10">
                              <AggregateSelector
                                table={queryState.table}
                                aggregates={queryState.aggregates}
                                onChange={updateAggregates}
                              />

                              <WhereClauseBuilder
                                table={queryState.table}
                                conditions={queryState.whereConditions}
                                onChange={updateWhereConditions}
                              />

                              <GroupByBuilder
                                table={queryState.table}
                                groupBy={queryState.groupBy}
                                onChange={updateGroupBy}
                              />

                              <HavingBuilder
                                table={queryState.table}
                                having={queryState.having}
                                onChange={updateHaving}
                              />
                            </div>
                          )}
                        </div>

                        {/* Sorting & Limits - Collapsible */}
                        <div className="border border-foreground/10 rounded-lg overflow-visible">
                          <button
                            onClick={() => setIsSortingOpen(!isSortingOpen)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                                <span className="text-xs font-mono font-semibold text-foreground/80 uppercase tracking-wider">
                                  Sorting & Limits
                                </span>
                                {/* Active indicator */}
                                {(queryState.orderBy.length > 0 || queryState.limit || queryState.offset) && (
                                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded">
                                    active
                                  </span>
                                )}
                              </div>
                              {/* Summary when collapsed */}
                              {!isSortingOpen && (
                                <div className="text-[10px] text-foreground/40 font-mono mt-1">
                                  {queryState.orderBy.length > 0 && `sorted by ${queryState.orderBy.map(o => o.column).join(', ')}`}
                                  {queryState.limit && `${queryState.orderBy.length > 0 ? ' • ' : ''}limit ${queryState.limit}`}
                                  {queryState.offset && ` offset ${queryState.offset}`}
                                  {!(queryState.orderBy.length > 0 || queryState.limit || queryState.offset) && 'click to add sorting or limits'}
                                </div>
                              )}
                            </div>
                            <svg 
                              className={`w-4 h-4 text-foreground/40 transition-transform ${isSortingOpen ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isSortingOpen && (
                            <div className="p-4 space-y-5 border-t border-foreground/10">
                              <OrderByBuilder
                                table={queryState.table}
                                orderBy={queryState.orderBy}
                                onChange={updateOrderBy}
                              />

                              <div>
                          <label className="block text-xs font-mono font-semibold text-foreground/60 mb-3 uppercase tracking-wider flex items-center gap-2">
                            Pagination
                            <HelpTooltip 
                              title="What is Pagination?"
                              content="LIMIT controls how many rows to return. OFFSET skips rows before starting. Use together for pages: Page 1 (LIMIT 10, OFFSET 0), Page 2 (LIMIT 10, OFFSET 10)."
                            />
                          </label>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase flex items-center gap-1.5">
                                LIMIT
                                <HelpTooltip 
                                  title="LIMIT"
                                  content="Maximum number of rows to return. Example: LIMIT 10 returns only first 10 rows."
                                />
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="20"
                                value={queryState.limit || ""}
                                onChange={(e) => updateLimit(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase flex items-center gap-1.5">
                                OFFSET
                                <HelpTooltip 
                                  title="OFFSET"
                                  content="Number of rows to skip before starting. Example: OFFSET 10 skips first 10 rows. Used with LIMIT for pagination."
                                />
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={queryState.offset || ""}
                                onChange={(e) => updateOffset(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                              />
                            </div>
                          </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Learning Hints - NEW! */}
                        <LearningHints queryState={queryState} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Panel - Query Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:sticky lg:top-20 lg:self-start"
            >
              <QueryPreview 
                queryState={queryState} 
                onAutoFix={handleAutoFix}
                onRowCountsChange={handleRowCountsChange}
                onResultsChange={handleResultsChange}
              />
            </motion.div>
          </div>

          {/* Visualizations Section - Full Width Below */}
          <div className="mt-6 sm:mt-8">
            <QueryVisualizations 
              queryState={queryState}
              mockResults={mockResults}
              rowCounts={rowCounts}
            />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
  );
}
