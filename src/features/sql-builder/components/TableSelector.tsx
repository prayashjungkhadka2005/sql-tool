"use client";

import { SAMPLE_TABLES } from "@/features/sql-builder/types";
import { getCSVData, getCSVTableNames } from "../utils/csv-data-manager";
import HelpTooltip from "./HelpTooltip";
import { useEffect, useState } from "react";

interface TableSelectorProps {
  value: string;
  onChange: (table: string) => void;
  refreshTrigger?: number; // Optional trigger to force refresh
}

export default function TableSelector({ value, onChange, refreshTrigger }: TableSelectorProps) {
  const [csvTables, setCsvTables] = useState<string[]>([]);

  // Refresh CSV tables list when trigger changes
  useEffect(() => {
    setCsvTables(getCSVTableNames());
  }, [refreshTrigger]);

  // Get column count for selected table
  const getColumnCount = (tableName: string) => {
    // Check if it's a CSV table
    const csvData = getCSVData(tableName);
    if (csvData) {
      return csvData.columns.length;
    }
    // Otherwise it's a mock table
    return SAMPLE_TABLES.find(t => t.name === tableName)?.columns.length || 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          Select Table
          <HelpTooltip 
            title="What is a Table?"
            content="A table is like a spreadsheet in your database. It stores data in rows and columns. For example, 'users' table stores user information."
          />
        </label>
        {!value && (
          <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
            required
          </span>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
        aria-label="Select database table"
      >
        <option value="">-- select table --</option>
        
        {/* CSV Tables (if any) */}
        {csvTables.length > 0 && (
          <optgroup label="YOUR CSV FILES">
            {csvTables.map((table) => (
              <option key={table} value={table} title={table}>
                {table.length > 40 ? `${table.substring(0, 40)}...` : table}
              </option>
            ))}
          </optgroup>
        )}
        
        {/* Mock Tables */}
        <optgroup label="DEMO TABLES (MOCK DATA)">
          {SAMPLE_TABLES.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </optgroup>
      </select>
      {value && (
        <p className="mt-1.5 text-xs text-foreground/40 font-mono truncate" title={`${value} - ${getColumnCount(value)} columns`}>
          → {value.length > 30 ? `${value.substring(0, 30)}...` : value} • {getColumnCount(value)} columns
        </p>
      )}
    </div>
  );
}

