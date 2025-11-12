"use client";

import { motion } from "framer-motion";
import { SAMPLE_TABLES, TableSchema } from "@/features/sql-builder/types";
import { getCSVData } from "../utils/csv-data-manager";
import { useMemo } from "react";
import ColumnTypeIndicator from "./ColumnTypeIndicator";

interface TableStructureVisualizerProps {
  tableName: string;
  selectedColumns?: string[];
  selectedGroupBy?: string[];
}

export default function TableStructureVisualizer({ 
  tableName, 
  selectedColumns = [],
  selectedGroupBy = []
}: TableStructureVisualizerProps) {
  // Get table schema (either from CSV or mock data)
  const tableSchema = useMemo(() => {
    // Check if it's a CSV table
    const csvData = getCSVData(tableName);
    if (csvData) {
      return {
        name: csvData.tableName,
        columns: csvData.columns
      } as TableSchema;
    }
    // Otherwise get from mock tables
    return SAMPLE_TABLES.find(t => t.name === tableName);
  }, [tableName]);

  if (!tableSchema) return null;

  // Icons are rendered using SVG below for consistency (no emojis)

  const getColumnColor = (columnName: string) => {
    if (selectedGroupBy.includes(columnName)) {
      return 'border-purple-500/40 bg-purple-500/10';
    }
    if (selectedColumns.includes(columnName)) {
      return 'border-blue-500/40 bg-blue-500/10';
    }
    return 'border-foreground/10 bg-foreground/5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Table Structure
        </h3>
        <span className="text-xs text-foreground/40 font-mono">
          → understand your data schema
        </span>
      </div>

      <div className="p-5 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
        {/* Table Name Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-foreground/10">
          <div className="text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold font-mono text-foreground">{tableName}</h4>
            <p className="text-xs text-foreground/50 font-mono">
              {tableSchema.columns.length} columns • {tableSchema.columns.filter(c => !c.nullable).length} required
            </p>
          </div>
        </div>

        {/* Column Grid */}
        <div className="grid sm:grid-cols-2 gap-2">
          {tableSchema.columns.map((column, index) => (
            <motion.div
              key={column.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-3 border rounded transition-all ${getColumnColor(column.name)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-primary flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-semibold text-sm text-foreground truncate mb-1">
                      {column.name}
                    </div>
                    <ColumnTypeIndicator column={column} compact={true} />
                  </div>
                </div>

                {/* Status indicators */}
                {selectedGroupBy.includes(column.name) && (
                  <div className="flex-shrink-0">
                    <div className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded font-mono font-semibold">
                      GROUPED
                    </div>
                  </div>
                )}
                {selectedColumns.includes(column.name) && !selectedGroupBy.includes(column.name) && (
                  <div className="flex-shrink-0">
                    <div className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded font-mono font-semibold">
                      SELECTED
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        {(selectedColumns.length > 0 || selectedGroupBy.length > 0) && (
          <div className="mt-4 pt-4 border-t border-foreground/10">
            <div className="flex flex-wrap gap-3 text-xs">
              {selectedGroupBy.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500/20 border border-purple-500/40 rounded"></div>
                  <span className="text-foreground/60 font-mono">Grouped columns</span>
                </div>
              )}
              {selectedColumns.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/40 rounded"></div>
                  <span className="text-foreground/60 font-mono">Selected columns</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Learning Tip */}
      <div className="mt-4 p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-foreground mb-1">Schema Understanding</div>
            <div className="text-xs text-foreground/70 leading-relaxed">
              Each table has columns with specific data types. <span className="font-mono">INTEGER</span> for numbers, 
              <span className="font-mono"> VARCHAR</span> for text. Required fields cannot be empty. 
              Understanding the schema helps you write better queries!
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

