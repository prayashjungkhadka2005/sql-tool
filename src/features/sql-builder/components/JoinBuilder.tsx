"use client";

import { useState, useMemo } from "react";
import { JoinClause, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { getCSVTableNames, getCSVData } from "../utils/csv-data-manager";
import HelpTooltip from "./HelpTooltip";

interface JoinBuilderProps {
  baseTable: string;
  joins: JoinClause[];
  onChange: (joins: JoinClause[]) => void;
}

export default function JoinBuilder({ baseTable, joins, onChange }: JoinBuilderProps) {
  const addJoin = () => {
    const newJoin: JoinClause = {
      id: Date.now().toString(),
      type: "INNER",
      table: "",
      onLeft: "",
      onRight: "",
    };
    onChange([...joins, newJoin]);
  };

  const updateJoin = (id: string, updates: Partial<JoinClause>) => {
    onChange(joins.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const removeJoin = (id: string) => {
    onChange(joins.filter(j => j.id !== id));
  };

  // Get available tables (both CSV and mock, excluding base table and already joined)
  const availableTables = useMemo(() => {
    const csvTables = getCSVTableNames().map(name => ({ name }));
    const mockTables = SAMPLE_TABLES.map(t => ({ name: t.name }));
    const allTables = [...csvTables, ...mockTables];
    
    return allTables.filter(
      t => t.name !== baseTable && !joins.some(j => j.table === t.name)
    );
  }, [baseTable, joins]);

  // Get columns for a specific table (CSV or mock)
  const getTableColumns = (tableName: string) => {
    // Check CSV first
    const csvData = getCSVData(tableName);
    if (csvData) {
      return csvData.columns.map(c => c.name);
    }
    // Fallback to mock tables
    const table = SAMPLE_TABLES.find(t => t.name === tableName);
    return table ? table.columns.map(c => c.name) : [];
  };

  const baseTableColumns = getTableColumns(baseTable);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs font-mono font-semibold text-foreground/80 uppercase tracking-wider">
            JOIN Tables
          </span>
          <HelpTooltip 
            title="What are JOINs?"
            content="JOINs combine rows from two or more tables based on related columns. INNER JOIN returns matching rows, LEFT JOIN returns all rows from left table plus matches from right."
          />
        </label>
        <button
          onClick={addJoin}
          disabled={availableTables.length === 0}
          className="px-2 py-1 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/20 active:scale-95 border border-foreground/10 rounded text-[10px] font-mono text-foreground/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          add
        </button>
      </div>

      {joins.length === 0 ? (
        <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-lg">
          <p className="text-xs text-foreground/50 font-mono leading-relaxed">
            → no joins (single table query)
          </p>
          <p className="text-[10px] text-foreground/40 font-mono mt-2 leading-relaxed">
            <span className="text-foreground/70 font-semibold">Tip:</span> Click &quot;add&quot; to join with another table. Example: join users with orders to see user&apos;s order history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {joins.map((join, index) => {
            const joinTableColumns = getTableColumns(join.table);
            
            return (
              <div
                key={join.id}
                className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg space-y-2"
              >
                {/* Join Type & Table */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-foreground/40 uppercase">
                    Join #{index + 1}
                  </span>
                  
                  {/* Join Type Selector */}
                  <select
                    value={join.type}
                    onChange={(e) => updateJoin(join.id, { type: e.target.value as JoinClause["type"] })}
                    className="px-2 py-1 bg-white dark:bg-black/60 border border-foreground/10 rounded text-xs font-mono text-foreground focus:outline-none focus:border-foreground/30 transition-all active:scale-95"
                  >
                    <option value="INNER">INNER JOIN</option>
                    <option value="LEFT">LEFT JOIN</option>
                    <option value="RIGHT">RIGHT JOIN</option>
                    <option value="FULL">FULL JOIN</option>
                  </select>

                  {/* Table Selector */}
                  <select
                    value={join.table}
                    onChange={(e) => updateJoin(join.id, { table: e.target.value, onRight: "" })}
                    className="flex-1 min-w-[120px] max-w-[200px] px-2 py-1 bg-white dark:bg-black/60 border border-foreground/10 rounded text-xs font-mono text-foreground focus:outline-none focus:border-foreground/30 transition-all active:scale-95 truncate"
                    title={join.table || "Select table"}
                  >
                    <option value="">-- select table --</option>
                    {availableTables.map(t => (
                      <option key={t.name} value={t.name} title={t.name}>
                        {t.name.length > 25 ? `${t.name.substring(0, 25)}...` : t.name}
                      </option>
                    ))}
                    {join.table && !availableTables.some(t => t.name === join.table) && (
                      <option value={join.table} title={join.table}>
                        {join.table.length > 25 ? `${join.table.substring(0, 25)}...` : join.table}
                      </option>
                    )}
                  </select>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeJoin(join.id)}
                    className="p-1 hover:bg-foreground/10 active:bg-foreground/10 active:scale-95 rounded transition-all"
                    aria-label="Remove join"
                  >
                    <svg className="w-3.5 h-3.5 text-foreground/40 hover:text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* ON Clause */}
                {join.table && (
                  <div className="flex items-center gap-2 pl-4 border-l-2 border-foreground/10">
                    <span className="text-[10px] font-mono text-foreground/40 uppercase">ON</span>
                    
                    {/* Left Column (Base Table) */}
                    <select
                      value={join.onLeft}
                      onChange={(e) => updateJoin(join.id, { onLeft: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-black/60 border border-foreground/10 rounded text-xs font-mono text-foreground focus:outline-none focus:border-foreground/30 transition-all active:scale-95 truncate"
                      title={join.onLeft || `Select ${baseTable} column`}
                    >
                      <option value="">
                        -- {baseTable.length > 15 ? `${baseTable.substring(0, 15)}...` : baseTable} column --
                      </option>
                      {baseTableColumns.map(col => {
                        const fullName = `${baseTable}.${col}`;
                        const displayName = fullName.length > 30 ? `${fullName.substring(0, 30)}...` : fullName;
                        return (
                          <option key={col} value={fullName} title={fullName}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>

                    <span className="text-xs font-mono text-foreground/40 flex-shrink-0">=</span>

                    {/* Right Column (Join Table) */}
                    <select
                      value={join.onRight}
                      onChange={(e) => updateJoin(join.id, { onRight: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-black/60 border border-foreground/10 rounded text-xs font-mono text-foreground focus:outline-none focus:border-foreground/30 transition-all active:scale-95 truncate"
                      title={join.onRight || `Select ${join.table} column`}
                    >
                      <option value="">
                        -- {join.table.length > 15 ? `${join.table.substring(0, 15)}...` : join.table} column --
                      </option>
                      {joinTableColumns.map(col => {
                        const fullName = `${join.table}.${col}`;
                        const displayName = fullName.length > 30 ? `${fullName.substring(0, 30)}...` : fullName;
                        return (
                          <option key={col} value={fullName} title={fullName}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      {joins.length > 0 && (
        <div className="mt-3 p-2.5 bg-foreground/5 border border-foreground/10 rounded-lg">
          <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
            <span className="text-foreground/70 font-semibold">JOIN Types:</span> INNER (matching rows only), LEFT (all from left + matches from right), RIGHT (all from right + matches from left), FULL (all rows from both).
          </p>
        </div>
      )}
    </div>
  );
}

