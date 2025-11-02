"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import QuickTemplates from "@/components/sql-builder/QuickTemplates";
import QueryTypeSelector from "@/components/sql-builder/QueryTypeSelector";
import TableSelector from "@/components/sql-builder/TableSelector";
import ColumnsSelector from "@/components/sql-builder/ColumnsSelector";
import WhereClauseBuilder from "@/components/sql-builder/WhereClauseBuilder";
import OrderByBuilder from "@/components/sql-builder/OrderByBuilder";
import QueryPreview from "@/components/sql-builder/QueryPreview";
import { QueryState, WhereCondition, OrderByClause } from "@/types/sql-builder";

export default function Home() {
  const [queryState, setQueryState] = useState<QueryState>({
    queryType: "SELECT",
    table: "",
    columns: [],
    whereConditions: [],
    joins: [],
    orderBy: [],
    limit: null,
    offset: null,
  });

  // Update query type
  const updateQueryType = (type: QueryState["queryType"]) => {
    setQueryState(prev => ({ ...prev, queryType: type }));
  };

  // Update table
  const updateTable = (table: string) => {
    setQueryState(prev => ({ ...prev, table, columns: [] }));
  };

  // Update columns
  const updateColumns = (columns: string[]) => {
    setQueryState(prev => ({ ...prev, columns }));
  };

  // Update WHERE conditions
  const updateWhereConditions = (conditions: WhereCondition[]) => {
    setQueryState(prev => ({ ...prev, whereConditions: conditions }));
  };

  // Update ORDER BY
  const updateOrderBy = (orderBy: OrderByClause[]) => {
    setQueryState(prev => ({ ...prev, orderBy }));
  };

  // Update LIMIT
  const updateLimit = (limit: number | null) => {
    setQueryState(prev => ({ ...prev, limit }));
  };

  // Update OFFSET
  const updateOffset = (offset: number | null) => {
    setQueryState(prev => ({ ...prev, offset }));
  };

  // Reset builder
  const resetBuilder = () => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      whereConditions: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
    });
  };

  // Load template
  const loadTemplate = (templateState: Partial<QueryState>) => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      whereConditions: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
      ...templateState,
    });
  };

  return (
    <>
      <ThemeToggle />
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
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
                            ? "→ select table" 
                            : queryState.columns.length === 0 
                            ? "→ select columns"
                            : "→ customize query"}
                        </p>
                      </div>
                    </div>
                    {queryState.table && (
                      <button
                        onClick={resetBuilder}
                        className="px-2 py-1 text-xs bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded transition-all font-mono text-foreground/60 hover:text-foreground flex items-center gap-1.5"
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
                        <ColumnsSelector
                          table={queryState.table}
                          selectedColumns={queryState.columns}
                          onChange={updateColumns}
                        />

                        <WhereClauseBuilder
                          table={queryState.table}
                          conditions={queryState.whereConditions}
                          onChange={updateWhereConditions}
                        />

                        <OrderByBuilder
                          table={queryState.table}
                          orderBy={queryState.orderBy}
                          onChange={updateOrderBy}
                        />

                        <div>
                          <label className="block text-xs font-mono font-semibold text-foreground/60 mb-3 uppercase tracking-wider">
                            Pagination
                          </label>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase">
                                LIMIT
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
                              <label className="block text-xs font-mono text-foreground/50 mb-1.5 uppercase">
                                OFFSET
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
              className="lg:sticky lg:top-8 lg:self-start"
            >
              <QueryPreview queryState={queryState} />
            </motion.div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-6 border-t border-foreground/10">
            <div className="text-center font-mono">
              <p className="text-xs text-foreground/40 mb-1">
                <Link
                  href="/portfolio"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  → View Portfolio
                </Link>
              </p>
              <p className="text-[10px] text-foreground/30">
                Built by Prayash Jung Khadka
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
