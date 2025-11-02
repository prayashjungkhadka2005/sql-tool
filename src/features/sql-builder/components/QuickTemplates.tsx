import { QueryState } from "@/types/sql-builder";

interface QuickTemplatesProps {
  onLoadTemplate: (state: Partial<QueryState>) => void;
}

export default function QuickTemplates({ onLoadTemplate }: QuickTemplatesProps) {
  const templates = [
    {
      name: "Get All Users",
      description: "Basic SELECT - retrieve all user data",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "blue",
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["id", "name", "email", "age", "status"],
      },
    },
    {
      name: "Filter by Condition",
      description: "WHERE clause - find active users only",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      color: "purple",
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "email", "status"],
        whereConditions: [
          {
            id: "1",
            column: "status",
            operator: "=" as const,
            value: "active",
            conjunction: "AND" as const,
          },
        ],
      },
    },
    {
      name: "Sort & Limit",
      description: "ORDER BY + LIMIT - newest 10 users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
      color: "orange",
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "email", "created_at"],
        orderBy: [{ column: "created_at", direction: "DESC" as const }],
        limit: 10,
      },
    },
    {
      name: "Pattern Matching",
      description: "LIKE operator - search names with 'John'",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "green",
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "email"],
        whereConditions: [
          {
            id: "1",
            column: "name",
            operator: "LIKE" as const,
            value: "%John%",
            conjunction: "AND" as const,
          },
        ],
      },
    },
  ];

  // Unified monochrome style for all templates
  const templateStyle = {
    bg: "bg-foreground/5",
    border: "border-foreground/10",
    icon: "text-foreground/60",
    hover: "hover:bg-foreground/10",
  };

  return (
    <div className="mb-8">
      {/* Clean Backend Style */}
      <div className="relative p-5 sm:p-6 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
        {/* Header */}
        <div className="mb-5 pb-4 border-b border-foreground/10">
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
            </svg>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Templates
            </h3>
          </div>
          <p className="text-xs text-foreground/40 font-mono">
            → load pre-built query examples
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => onLoadTemplate(template.state)}
              className={`group relative p-4 bg-[#fafafa] dark:bg-black/40 border ${templateStyle.border} ${templateStyle.hover} hover:border-foreground/20 rounded transition-all text-left`}
            >
              <div className="relative">
                <div className={`inline-flex w-9 h-9 rounded border ${templateStyle.border} items-center justify-center mb-3 ${templateStyle.icon}`}>
                  {template.icon}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1.5 font-mono uppercase tracking-wide">
                  {template.name}
                </h4>
                <p className="text-xs text-foreground/50 leading-relaxed mb-3 min-h-[2rem]">
                  {template.description}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/40">
                  <span>→</span>
                  <span>click to load</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

