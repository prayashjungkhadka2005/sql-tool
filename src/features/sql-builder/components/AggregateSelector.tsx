import { AggregateColumn, AggregateFunction, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { useMemo } from "react";
import HelpTooltip from "./HelpTooltip";

interface AggregateSelectorProps {
  table: string;
  aggregates: AggregateColumn[];
  onChange: (aggregates: AggregateColumn[]) => void;
}

export default function AggregateSelector({ table, aggregates, onChange }: AggregateSelectorProps) {
  const tableSchema = useMemo(
    () => SAMPLE_TABLES.find(t => t.name === table),
    [table]
  );

  if (!tableSchema) return null;

  const addAggregate = () => {
    const newAggregate: AggregateColumn = {
      id: Date.now().toString(),
      function: "COUNT",
      column: "*",
      alias: undefined,
    };
    onChange([...aggregates, newAggregate]);
  };

  const updateAggregate = (id: string, updates: Partial<AggregateColumn>) => {
    onChange(
      aggregates.map((agg) => (agg.id === id ? { ...agg, ...updates } : agg))
    );
  };

  const removeAggregate = (id: string) => {
    onChange(aggregates.filter((agg) => agg.id !== id));
  };

  const functions: AggregateFunction[] = ["COUNT", "SUM", "AVG", "MIN", "MAX"];

  // Get numeric columns for SUM, AVG, MIN, MAX
  const numericColumns = tableSchema.columns.filter(
    col => col.type === "INTEGER"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          Aggregate Functions
          <HelpTooltip 
            title="What are Aggregates?"
            content="Aggregate functions perform calculations: COUNT counts rows, SUM adds numbers, AVG calculates average, MIN/MAX find minimum/maximum. Use with GROUP BY for analytics."
          />
          {aggregates.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
              {aggregates.length}
            </span>
          )}
        </label>
        <button
          onClick={addAggregate}
          className="text-xs px-2 py-1 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
          aria-label="Add aggregate function"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          add
        </button>
      </div>

      {aggregates.length === 0 ? (
        <div className="p-4 border border-dashed border-foreground/10 rounded bg-foreground/5">
          <div className="text-center mb-2">
            <p className="text-xs font-mono text-foreground/40">
              → no aggregates (regular SELECT)
            </p>
          </div>
          <div className="flex items-start gap-2 text-left mt-3 pt-3 border-t border-foreground/10">
            <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
              Tip: Click &quot;add&quot; for analytics. Try COUNT(*) to count rows, or SUM/AVG for numeric columns
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {aggregates.map((aggregate) => (
            <div
              key={aggregate.id}
              className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                {/* Function */}
                <select
                  value={aggregate.function}
                  onChange={(e) => updateAggregate(aggregate.id, { 
                    function: e.target.value as AggregateFunction,
                    column: e.target.value === "COUNT" ? "*" : aggregate.column
                  })}
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Function"
                >
                  {functions.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn}
                    </option>
                  ))}
                </select>

                {/* Column */}
                <select
                  value={aggregate.column}
                  onChange={(e) => updateAggregate(aggregate.id, { column: e.target.value })}
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Column"
                  disabled={aggregate.function === "COUNT" && aggregate.column === "*"}
                >
                  {aggregate.function === "COUNT" && (
                    <option value="*">* (all rows)</option>
                  )}
                  {(aggregate.function === "COUNT" ? tableSchema.columns : numericColumns).map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>

                {/* Alias (Optional) */}
                <input
                  type="text"
                  value={aggregate.alias || ""}
                  onChange={(e) => updateAggregate(aggregate.id, { alias: e.target.value || undefined })}
                  placeholder="alias (optional)"
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Alias"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeAggregate(aggregate.id)}
                className="text-xs text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 px-2 py-1 rounded transition-all flex items-center gap-1 font-mono"
                aria-label="Remove aggregate"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      {aggregates.length > 0 && (
        <p className="mt-2 text-xs text-foreground/40 font-mono">
          → using aggregates requires GROUP BY for non-aggregate columns
        </p>
      )}
    </div>
  );
}

