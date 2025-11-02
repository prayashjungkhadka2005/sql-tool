import { QueryType } from "@/types/sql-builder";

interface QueryTypeSelectorProps {
  value: QueryType;
  onChange: (type: QueryType) => void;
}

export default function QueryTypeSelector({ value, onChange }: QueryTypeSelectorProps) {
  const queryTypes: { value: QueryType; label: string; description: string }[] = [
    { value: "SELECT", label: "SELECT", description: "Retrieve data" },
    { value: "INSERT", label: "INSERT", description: "Add records" },
    { value: "UPDATE", label: "UPDATE", description: "Modify records" },
    { value: "DELETE", label: "DELETE", description: "Remove records" },
  ];

  return (
    <div>
      <label className="block text-xs font-mono font-semibold text-foreground/60 mb-3 uppercase tracking-wider">
        Query Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {queryTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-3 rounded border transition-all text-left ${
              value === type.value
                ? "border-foreground/30 bg-foreground/10"
                : "border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5"
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

