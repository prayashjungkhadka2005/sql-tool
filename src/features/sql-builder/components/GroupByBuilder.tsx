import { SAMPLE_TABLES, TableSchema } from "@/features/sql-builder/types";
import { getCSVData } from "../utils/csv-data-manager";
import { useMemo } from "react";
import HelpTooltip from "./HelpTooltip";
import ColumnTypeIndicator from "./ColumnTypeIndicator";

interface GroupByBuilderProps {
  table: string;
  groupBy: string[];
  onChange: (groupBy: string[]) => void;
}

export default function GroupByBuilder({ table, groupBy, onChange }: GroupByBuilderProps) {
  const tableSchema = useMemo(() => {
    const csvData = getCSVData(table);
    if (csvData) {
      return { name: csvData.tableName, columns: csvData.columns } as TableSchema;
    }
    return SAMPLE_TABLES.find(t => t.name === table);
  }, [table]);

  if (!tableSchema) return null;

  const toggleColumn = (column: string) => {
    if (groupBy.includes(column)) {
      onChange(groupBy.filter(c => c !== column));
    } else {
      onChange([...groupBy, column]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          GROUP BY
          <HelpTooltip 
            title="What is GROUP BY?"
            content="GROUP BY combines rows with the same values. Use with aggregate functions like COUNT or SUM. Example: GROUP BY status to count users per status."
          />
          {groupBy.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
              {groupBy.length}
            </span>
          )}
        </label>
        {groupBy.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15 active:scale-95 text-foreground/60 hover:text-foreground rounded transition-all font-mono"
            aria-label="Clear all"
          >
            clear
          </button>
        )}
      </div>

      <div>
        {/* Show tip when no columns selected */}
        {groupBy.length === 0 && (
          <div className="mb-3 p-3 border border-dashed border-foreground/10 rounded bg-foreground/5">
            <div className="flex items-start gap-2 text-left">
              <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
                Tip: Use GROUP BY when using aggregates. Example: GROUP BY status with COUNT(*) to count users per status
              </p>
            </div>
          </div>
        )}

        {/* Always show column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tableSchema.columns.map((column) => {
            const isSelected = groupBy.includes(column.name);
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
                aria-label={`${isSelected ? 'Remove' : 'Add'} ${column.name} from GROUP BY`}
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
                    <div className="text-xs font-medium text-foreground truncate font-mono mb-0.5">
                      {column.name}
                    </div>
                    <ColumnTypeIndicator column={column} compact={true} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

