import { OrderByClause, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { useMemo } from "react";
import HelpTooltip from "./HelpTooltip";

interface OrderByBuilderProps {
  table: string;
  orderBy: OrderByClause[];
  onChange: (orderBy: OrderByClause[]) => void;
}

export default function OrderByBuilder({ table, orderBy, onChange }: OrderByBuilderProps) {
  const tableSchema = useMemo(
    () => SAMPLE_TABLES.find(t => t.name === table),
    [table]
  );

  const addOrderBy = () => {
    const newOrder: OrderByClause = {
      column: tableSchema?.columns[0]?.name || "",
      direction: "ASC",
    };
    onChange([...orderBy, newOrder]);
  };

  const updateOrderBy = (index: number, updates: Partial<OrderByClause>) => {
    onChange(
      orderBy.map((order, i) =>
        i === index ? { ...order, ...updates } : order
      )
    );
  };

  const removeOrderBy = (index: number) => {
    onChange(orderBy.filter((_, i) => i !== index));
  };

  if (!tableSchema) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
          ORDER BY
          <HelpTooltip 
            title="What is ORDER BY?"
            content="ORDER BY sorts your results. ASC means ascending (A→Z, 0→9), DESC means descending (Z→A, 9→0). You can sort by multiple columns."
          />
          {orderBy.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-foreground/10 text-foreground/60 rounded font-mono">
              {orderBy.length}
            </span>
          )}
        </label>
        <button
          onClick={addOrderBy}
          className="text-xs px-2 py-1 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
          aria-label="Add ORDER BY"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          add
        </button>
      </div>

      {orderBy.length === 0 ? (
        <div className="p-4 border border-dashed border-foreground/10 rounded bg-foreground/5">
          <div className="text-center mb-2">
            <p className="text-xs font-mono text-foreground/40">
              → no sorting applied (default order)
            </p>
          </div>
          <div className="flex items-start gap-2 text-left mt-3 pt-3 border-t border-foreground/10">
            <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[10px] text-foreground/50 font-mono leading-relaxed">
              Tip: Sort results by clicking &quot;add&quot;. Use ASC for ascending (A-Z, 1-9) or DESC for descending (Z-A, 9-1)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderBy.map((order, index) => (
            <div
              key={index}
              className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Column */}
                <select
                  value={order.column}
                  onChange={(e) => updateOrderBy(index, { column: e.target.value })}
                  className="px-2 py-1.5 bg-white dark:bg-black/40 border border-foreground/10 rounded text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  aria-label="Column"
                >
                  {tableSchema.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>

                {/* Direction */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateOrderBy(index, { direction: "ASC" })}
                    className={`flex-1 px-2 py-1.5 text-xs font-mono rounded transition-all active:scale-95 ${
                      order.direction === "ASC"
                        ? "bg-foreground text-background active:bg-foreground/80"
                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 active:bg-foreground/15"
                    }`}
                  >
                    ASC ↑
                  </button>
                  <button
                    onClick={() => updateOrderBy(index, { direction: "DESC" })}
                    className={`flex-1 px-2 py-1.5 text-xs font-mono rounded transition-all active:scale-95 ${
                      order.direction === "DESC"
                        ? "bg-foreground text-background active:bg-foreground/80"
                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 active:bg-foreground/15"
                    }`}
                  >
                    DESC ↓
                  </button>
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeOrderBy(index)}
                className="mt-2 text-xs text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 px-2 py-1 rounded transition-all flex items-center gap-1 font-mono"
                aria-label="Remove order"
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
