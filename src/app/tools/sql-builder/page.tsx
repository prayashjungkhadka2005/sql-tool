"use client";

import { motion } from "framer-motion";
import Navbar from "@/features/sql-builder/components/Navbar";
import Footer from "@/features/sql-builder/components/Footer";
import QuickTemplates from "@/features/sql-builder/components/QuickTemplates";
import CSVUploader from "@/features/sql-builder/components/CSVUploader";
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
import InsertValueBuilder from "@/features/sql-builder/components/InsertValueBuilder";
import JoinBuilder from "@/features/sql-builder/components/JoinBuilder";
import DistinctToggle from "@/features/sql-builder/components/DistinctToggle";
import WelcomeTutorial from "@/features/sql-builder/components/WelcomeTutorial";
import { useQueryBuilder } from "@/features/sql-builder/hooks/useQueryBuilder";
import { useKeyboardShortcuts } from "@/features/sql-builder/hooks/useKeyboardShortcuts";
import { useState, useCallback, useEffect } from "react";
import { decodeQueryFromURL, copyShareableURL } from "@/features/sql-builder/utils/url-sharing";
import { isCSVTable } from "@/features/sql-builder/utils/csv-data-manager";

export default function Home() {
  const {
    queryState,
    updateQueryType,
    updateTable,
    updateColumns,
    updateAggregates,
    updateDistinct,
    updateWhereConditions,
    updateJoins,
    updateGroupBy,
    updateHaving,
    updateOrderBy,
    updateLimit,
    updateOffset,
    updateInsertValues,
    reset: resetBuilder,
    loadTemplate,
  } = useQueryBuilder();

  // State for visualizations
  const [rowCounts, setRowCounts] = useState({ total: 0, afterWhere: 0, afterGroupBy: 0, final: 0 });
  const [mockResults, setMockResults] = useState<any[]>([]);

  // State for collapsible sections (default: open for better UX)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(true);
  const [isSortingOpen, setIsSortingOpen] = useState(true);

  // State for share functionality
  const [shareToast, setShareToast] = useState(false);

  // State for welcome tutorial
  const [showTutorial, setShowTutorial] = useState(false);

  // State to trigger TableSelector refresh when CSV is uploaded
  const [csvRefreshTrigger, setCsvRefreshTrigger] = useState(0);

  // State for collapsible CSV upload section
  const [isCSVSectionOpen, setIsCSVSectionOpen] = useState(true);

  // Check if first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasVisited = localStorage.getItem('sql-builder-visited');
        if (!hasVisited) {
          setShowTutorial(true);
        }
      } catch (error) {
        // LocalStorage blocked or unavailable - show tutorial anyway
        setShowTutorial(true);
      }
    }
  }, []);

  const handleTutorialComplete = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sql-builder-visited', 'true');
      } catch (error) {
        // LocalStorage blocked - tutorial won't persist, but that's okay
        console.log('Could not save tutorial preference');
      }
    }
    setShowTutorial(false);
  };

  // Load query from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('q');
      if (encoded) {
        const decodedQuery = decodeQueryFromURL(encoded);
        if (decodedQuery) {
          loadTemplate(decodedQuery);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // State for error toast
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Share query handler
  const handleShareQuery = async () => {
    const result = await copyShareableURL(queryState);
    if (result.success) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } else {
      // Show error toast
      setErrorToast(result.error || "Failed to share query");
      setTimeout(() => setErrorToast(null), 5000);
    }
  };

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onShare: queryState.table ? handleShareQuery : undefined,
    onReset: queryState.table ? resetBuilder : undefined,
  });

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
    <>
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

          {/* CSV Upload Section - Collapsible */}
          <div className="mb-8">
            <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
              <button
                onClick={() => setIsCSVSectionOpen(!isCSVSectionOpen)}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-foreground/5 active:bg-foreground/10 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Upload Your Data
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-mono font-semibold">
                        NEW
                      </span>
                    </div>
                    <p className="text-xs text-foreground/40 font-mono mt-0.5">
                      → upload CSV to query your own data • 100% client-side • private
                    </p>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-foreground/40 transition-transform ${isCSVSectionOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCSVSectionOpen && (
                <div className="px-5 sm:px-6 py-5 sm:py-6 border-t border-foreground/10">
                  <CSVUploader 
                onUploadSuccess={(tableName) => {
                  // Trigger refresh of TableSelector dropdown
                  setCsvRefreshTrigger(prev => prev + 1);
                  // Auto-select the uploaded table
                  updateTable(tableName);
                }}
                onDelete={(tableName) => {
                  // Trigger refresh of TableSelector dropdown
                  setCsvRefreshTrigger(prev => prev + 1);
                  
                  // If empty string (clear all signal) or deleted table was selected, FULL RESET
                  if (tableName === "" || queryState.table === tableName) {
                    resetBuilder(); // Complete reset
                    return;
                  }
                  
                  // If deleted table is used in JOINs, remove those joins
                  if (queryState.joins && queryState.joins.length > 0) {
                    const cleanedJoins = queryState.joins.filter(join => join.table !== tableName);
                    if (cleanedJoins.length !== queryState.joins.length) {
                      updateJoins(cleanedJoins);
                      // Also need to clear columns from deleted joined table
                      const deletedTablePrefix = `${tableName}.`;
                      const cleanedColumns = queryState.columns.filter(col => !col.startsWith(deletedTablePrefix));
                      if (cleanedColumns.length !== queryState.columns.length) {
                        updateColumns(cleanedColumns);
                      }
                    }
                  }
                }}
                  />
                </div>
              )}
            </div>
          </div>

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
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Query Builder</h2>
                          {queryState.table && isCSVTable(queryState.table) && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-mono font-bold">
                              YOUR CSV
                            </span>
                          )}
                        </div>
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
                      <div className="flex gap-2">
                        <button
                          onClick={handleShareQuery}
                          className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 rounded transition-all font-mono text-foreground/60 hover:text-foreground flex items-center gap-1.5"
                          title={`Share query via URL ${isCSVTable(queryState.table) ? '(Not available for CSV queries)' : '(Cmd/Ctrl+S)'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                        </button>
                        <button
                          onClick={resetBuilder}
                          className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 rounded transition-all font-mono text-foreground/60 hover:text-foreground flex items-center gap-1.5"
                          title="Reset (Cmd/Ctrl+Shift+R)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      </div>
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
                      refreshTrigger={csvRefreshTrigger}
                    />

                    {/* INSERT-specific UI */}
                    {queryState.table && queryState.queryType === "INSERT" && (
                      <>
                        {/* Table Structure Visualizer */}
                        <TableStructureVisualizer
                          tableName={queryState.table}
                          selectedColumns={[]}
                          selectedGroupBy={[]}
                        />

                        {/* INSERT Value Builder */}
                        <InsertValueBuilder
                          table={queryState.table}
                          insertValues={queryState.insertValues}
                          onChange={updateInsertValues}
                        />
                      </>
                    )}

                    {/* SELECT-specific UI */}
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
                          joins={queryState.joins}
                        />

                        {/* DISTINCT Toggle */}
                        <DistinctToggle
                          value={queryState.distinct}
                          onChange={updateDistinct}
                        />

                        {/* JOINs Builder */}
                        <JoinBuilder
                          baseTable={queryState.table}
                          joins={queryState.joins}
                          onChange={updateJoins}
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

        {/* Share Success Toast */}
        {shareToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">URL Copied!</p>
                <p className="text-xs opacity-90">Share this link to load your query</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg flex items-center gap-3 max-w-md">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold">Cannot Share Query</p>
                <p className="text-xs opacity-90">{errorToast}</p>
              </div>
              <button
                onClick={() => setErrorToast(null)}
                className="p-1 hover:bg-red-600 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Welcome Tutorial - Outside main container for proper fixed positioning */}
      {showTutorial && <WelcomeTutorial onComplete={handleTutorialComplete} />}
    </>
  );
}
