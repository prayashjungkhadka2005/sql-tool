import { WhereCondition, OperatorType, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { useMemo } from "react";
import HelpTooltip from "./HelpTooltip";

interface WhereClauseBuilderProps {
  table: string;
  conditions: WhereCondition[];
  onChange: (conditions: WhereCondition[]) => void;
}

export default function WhereClauseBuilder({ table, conditions, onChange }: WhereClauseBuilderProps) {
  const tableSchema = useMemo(
    () => SAMPLE_TABLES.find(t => t.name === table),
    [table]
  );

  const operators: OperatorType[] = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"];

  const addCondition = () => {
    const newCondition: WhereCondition = {
      id: Date.now().toString(),
      column: tableSchema?.columns[0]?.name || "",
      operator: "=",
      value: "",
      conjunction: "AND",
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<WhereCondition>) => {
    onChange(
      conditions.map(cond =>
        cond.id === id ? { ...cond, ...updates } : cond
      )
    );
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(cond => cond.id !== id));
  };

  if (!tableSchema) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          WHERE Clause
          <HelpTooltip 
            title="What is WHERE?"
            content="WHERE filters your results based on conditions. For example, column comparisons like 'column > value' or 'column = value'. Use AND/OR to combine multiple conditions."
          />
          {conditions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
              {conditions.length}
            </span>
          )}
        </label>
        <button
          onClick={addCondition}
          className="text-xs px-2 py-1 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
          aria-label="Add WHERE condition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          add
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="p-4 border border-dashed border-foreground/10 rounded bg-foreground/5">
          <div className="text-center mb-2">
            <p className="text-xs font-mono text-foreground/40">
              → no filters applied (returns all rows)
            </p>
          </div>
          <div className="flex items-start gap-2 text-left mt-3 pt-3 border-t border-foreground/10">
            <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
              Tip: Click &quot;add&quot; to filter results. Use operators like = (equals), {'>'} (greater than), or LIKE for patterns
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conditions.map((condition, index) => (
            <div
              key={condition.id}
              className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded"
            >
              {/* Conjunction (AND/OR) */}
              {index > 0 && (
                <div className="mb-2 flex gap-1.5">
                  <button
                    onClick={() => updateCondition(condition.id, { conjunction: "AND" })}
                    className={`px-2 py-1 text-xs font-mono rounded transition-all active:scale-95 ${
                      condition.conjunction === "AND"
                        ? "bg-foreground text-background active:bg-foreground/80"
                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 active:bg-foreground/15"
                    }`}
                  >
                    AND
                  </button>
                  <button
                    onClick={() => updateCondition(condition.id, { conjunction: "OR" })}
                    className={`px-2 py-1 text-xs font-mono rounded transition-all active:scale-95 ${
                      condition.conjunction === "OR"
                        ? "bg-foreground text-background active:bg-foreground/80"
                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 active:bg-foreground/15"
                    }`}
                  >
                    OR
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Column */}
                <select
                  value={condition.column}
                  onChange={(e) => updateCondition(condition.id, { column: e.target.value })}
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Column"
                >
                  {tableSchema.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as OperatorType })}
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Operator"
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>

                {/* Value */}
                {!condition.operator.includes("NULL") && (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="value"
                    className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                    aria-label="Value"
                  />
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeCondition(condition.id)}
                className="mt-2 text-xs text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 px-2 py-1 rounded transition-all flex items-center gap-1 font-mono"
                aria-label="Remove condition"
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
    </div>
  );
}
