import { QueryType } from "@/features/sql-builder/types";
import HelpTooltip from "./HelpTooltip";

interface QueryTypeSelectorProps {
  value: QueryType;
  onChange: (type: QueryType) => void;
}

export default function QueryTypeSelector({ value, onChange }: QueryTypeSelectorProps) {
  const queryTypes: { value: QueryType; label: string; description: string; tooltip: string }[] = [
    { 
      value: "SELECT", 
      label: "SELECT", 
      description: "Retrieve data",
      tooltip: "Use SELECT to read/view data from tables. Most common query type for fetching information."
    },
    { 
      value: "INSERT", 
      label: "INSERT", 
      description: "Add records",
      tooltip: "Use INSERT to add new rows to a table. Creates new data entries."
    },
    { 
      value: "UPDATE", 
      label: "UPDATE", 
      description: "Modify records",
      tooltip: "Use UPDATE to change existing data. Modifies values in existing rows."
    },
    { 
      value: "DELETE", 
      label: "DELETE", 
      description: "Remove records",
      tooltip: "Use DELETE to remove rows from a table. Permanently deletes data."
    },
  ];

  return (
    <div>
      <label className="block text-xs font-mono font-semibold text-foreground/60 mb-3 uppercase tracking-wider flex items-center gap-2">
        Query Type
        <HelpTooltip 
          title="Query Types Explained"
          content="SELECT reads data, INSERT adds new data, UPDATE modifies existing data, DELETE removes data. Start with SELECT to learn the basics!"
        />
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {queryTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-3 rounded border transition-all text-left active:scale-95 ${
              value === type.value
                ? "border-foreground/30 bg-foreground/10 active:bg-foreground/15"
                : "border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5 active:bg-foreground/10"
            }`}
            aria-pressed={value === type.value}
          >
            <div className="font-bold text-xs sm:text-sm text-foreground mb-0.5 font-mono">
              {type.label}
            </div>
            <div className="text-[10px] text-foreground/40 font-mono">
              {type.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

