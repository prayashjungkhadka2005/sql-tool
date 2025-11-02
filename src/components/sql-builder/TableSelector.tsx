import { SAMPLE_TABLES } from "@/types/sql-builder";
import HelpTooltip from "./HelpTooltip";

interface TableSelectorProps {
  value: string;
  onChange: (table: string) => void;
}

export default function TableSelector({ value, onChange }: TableSelectorProps) {
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
        {SAMPLE_TABLES.map((table) => (
          <option key={table.name} value={table.name}>
            {table.name}
          </option>
        ))}
      </select>
      {value && (
        <p className="mt-1.5 text-xs text-foreground/40 font-mono">
          → {SAMPLE_TABLES.find(t => t.name === value)?.columns.length || 0} columns
        </p>
      )}
    </div>
  );
}

