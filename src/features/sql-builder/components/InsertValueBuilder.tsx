"use client";

import { useMemo } from "react";
import { SAMPLE_TABLES, TableSchema } from "@/features/sql-builder/types";
import { getCSVData } from "../utils/csv-data-manager";
import ColumnTypeIndicator from "./ColumnTypeIndicator";

interface InsertValueBuilderProps {
  table: string;
  insertValues: Record<string, string>;
  onChange: (insertValues: Record<string, string>) => void;
}

export default function InsertValueBuilder({ table, insertValues, onChange }: InsertValueBuilderProps) {
  const tableSchema = useMemo(() => {
    const csvData = getCSVData(table);
    if (csvData) {
      return { name: csvData.tableName, columns: csvData.columns } as TableSchema;
    }
    return SAMPLE_TABLES.find(t => t.name === table);
  }, [table]);

  if (!tableSchema) return null;

  const updateValue = (column: string, value: string) => {
    onChange({
      ...insertValues,
      [column]: value
    });
  };

  const clearAll = () => {
    onChange({});
  };

  const fillCurrentTimestamp = (column: string) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19); // YYYY-MM-DD HH:MM:SS
    updateValue(column, timestamp);
  };

  const fillCurrentDate = (column: string) => {
    const now = new Date();
    const date = now.toISOString().substring(0, 10); // YYYY-MM-DD
    updateValue(column, date);
  };

  // Count filled values
  const filledCount = Object.values(insertValues).filter(v => v && v.trim() !== '').length;
  const requiredColumns = tableSchema.columns.filter(c => !c.nullable);
  const filledRequiredCount = requiredColumns.filter(c => insertValues[c.name] && insertValues[c.name].trim() !== '').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-mono font-semibold text-foreground/80 uppercase tracking-wider">
            Column Values
          </span>
          {filledCount > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded">
              {filledCount}/{tableSchema.columns.length}
            </span>
          )}
          {filledRequiredCount === requiredColumns.length && requiredColumns.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-mono font-bold rounded">
              all required ✓
            </span>
          )}
        </label>
        {filledCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 text-foreground/60 hover:text-foreground rounded transition-all font-mono"
            aria-label="Clear all values"
          >
            clear all
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {tableSchema.columns.map((column) => {
          const isRequired = !column.nullable;
          const isEmpty = !insertValues[column.name] || insertValues[column.name].trim() === '';
          const hasError = isRequired && isEmpty;
          
          return (
          <div
            key={column.name}
            className={`p-3 bg-[#fafafa] dark:bg-black/40 border rounded transition-all ${
              hasError 
                ? 'border-red-500/30 bg-red-500/5' 
                : 'border-foreground/10'
            }`}
          >
            {/* Column Info - Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-foreground">
                {column.name}
              </span>
              <ColumnTypeIndicator column={column} compact={true} />
            </div>

            {/* Value Input - Full Width */}
            <div>
                {column.type === "BOOLEAN" ? (
                  <select
                    value={insertValues[column.name] || ""}
                    onChange={(e) => updateValue(column.name, e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                    aria-label={`Value for ${column.name}`}
                  >
                    <option value="">-- Select --</option>
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                  </select>
                ) : column.type === "TIMESTAMP" ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={insertValues[column.name] || ""}
                      onChange={(e) => updateValue(column.name, e.target.value)}
                      placeholder="YYYY-MM-DD HH:MM:SS"
                      className="flex-1 px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono placeholder:text-foreground/30"
                      aria-label={`Value for ${column.name}`}
                    />
                    <button
                      onClick={() => fillCurrentTimestamp(column.name)}
                      className="px-2 py-1.5 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 rounded text-[10px] font-mono text-foreground/70 transition-all whitespace-nowrap"
                      aria-label="Use current time"
                    >
                      now
                    </button>
                  </div>
                ) : column.type === "DATE" ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={insertValues[column.name] || ""}
                      onChange={(e) => updateValue(column.name, e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="flex-1 px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono placeholder:text-foreground/30"
                      aria-label={`Value for ${column.name}`}
                    />
                    <button
                      onClick={() => fillCurrentDate(column.name)}
                      className="px-2 py-1.5 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 border border-foreground/10 rounded text-[10px] font-mono text-foreground/70 transition-all whitespace-nowrap"
                      aria-label="Use today"
                    >
                      today
                    </button>
                  </div>
                ) : (
                  <input
                    type={column.type === "INTEGER" ? "number" : "text"}
                    value={insertValues[column.name] || ""}
                    onChange={(e) => updateValue(column.name, e.target.value)}
                    placeholder={
                      column.type === "INTEGER" ? "Enter number..." :
                      `Enter ${column.name}...`
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono placeholder:text-foreground/30"
                    aria-label={`Value for ${column.name}`}
                  />
                )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Helpful Tip */}
      <div className="mt-3 p-2.5 bg-foreground/5 border border-foreground/10 rounded-lg">
        <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
          <span className="text-foreground/70 font-semibold">Tip:</span> Fill in the values for your new row.{' '}
          <span className="text-red-600 dark:text-red-400 font-semibold">Required fields</span> must have values.{' '}
          Optional fields can be left empty (will use NULL/defaults).
        </p>
      </div>
    </div>
  );
}

