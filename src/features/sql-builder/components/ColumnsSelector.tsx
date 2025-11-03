import { SAMPLE_TABLES } from "@/features/sql-builder/types";
import { useMemo } from "react";
import HelpTooltip from "./HelpTooltip";

interface ColumnsSelectorProps {
  table: string;
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

export default function ColumnsSelector({ table, selectedColumns, onChange }: ColumnsSelectorProps) {
  const tableSchema = useMemo(
    () => SAMPLE_TABLES.find(t => t.name === table),
    [table]
  );

  if (!tableSchema) return null;

  const toggleColumn = (column: string) => {
    if (selectedColumns.includes(column)) {
      onChange(selectedColumns.filter(c => c !== column));
    } else {
      onChange([...selectedColumns, column]);
    }
  };

  const selectAll = () => {
    onChange(tableSchema.columns.map(c => c.name));
  };

  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          Select Columns
          <HelpTooltip 
            title="What are Columns?"
            content="Columns are the fields you want to retrieve. For example, if you want user names and emails, select 'name' and 'email' columns. Or select all with 'All' button."
          />
          <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
            {selectedColumns.length}
          </span>
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={selectAll}
            className="text-xs px-2 py-1 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 text-foreground/60 hover:text-foreground rounded transition-all font-mono"
            aria-label="Select all columns"
          >
            all
          </button>
          <button
            onClick={deselectAll}
            className="text-xs px-2 py-1 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 text-foreground/60 hover:text-foreground rounded transition-all font-mono"
            aria-label="Deselect all columns"
          >
            clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tableSchema.columns.map((column) => {
          const isSelected = selectedColumns.includes(column.name);
          return (
            <button
              key={column.name}
              onClick={() => toggleColumn(column.name)}
              className={`p-2.5 rounded border transition-all text-left active:scale-95 ${
                isSelected
                  ? "border-foreground/30 bg-foreground/10"
                  : "border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  isSelected ? "border-foreground bg-foreground" : "border-foreground/20"
                }`}>
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate font-mono">
                    {column.name}
                  </div>
                  <div className="text-[10px] text-foreground/40 font-mono">
                    {column.type}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedColumns.length === 0 && (
        <p className="mt-2 text-xs text-foreground/40 font-mono">
          → select columns or use *
        </p>
      )}
    </div>
  );
}

