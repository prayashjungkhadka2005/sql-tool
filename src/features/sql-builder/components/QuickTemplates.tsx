import { QueryState } from "@/features/sql-builder/types";

interface QuickTemplatesProps {
  onLoadTemplate: (state: Partial<QueryState>) => void;
}

export default function QuickTemplates({ onLoadTemplate }: QuickTemplatesProps) {
  // Organized by difficulty for better learning
  const beginnerTemplates = [
    {
      name: "Get All Users",
      description: "Learn: Basic SELECT statement",
      difficulty: "Beginner",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["id", "name", "email", "age", "status"],
      },
    },
    {
      name: "Select Specific Columns",
      description: "Learn: Choose only the data you need",
      difficulty: "Beginner",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "products",
        columns: ["name", "price", "category"],
      },
    },
    {
      name: "Filter by Status",
      description: "Learn: WHERE with exact match (=)",
      difficulty: "Beginner",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
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
  ];

  const intermediateTemplates = [
    {
      name: "Find by Age Range",
      description: "Learn: Numeric comparison with >",
      difficulty: "Intermediate",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "age", "email"],
        whereConditions: [
          {
            id: "1",
            column: "age",
            operator: ">" as const,
            value: "25",
            conjunction: "AND" as const,
          },
        ],
      },
    },
    {
      name: "Email Pattern Search",
      description: "Learn: LIKE with % wildcard",
      difficulty: "Intermediate",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "email"],
        whereConditions: [
          {
            id: "1",
            column: "email",
            operator: "LIKE" as const,
            value: "%@gmail.com",
            conjunction: "AND" as const,
          },
        ],
      },
    },
    {
      name: "Sort & Limit Results",
      description: "Learn: ORDER BY + LIMIT for top results",
      difficulty: "Intermediate",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "posts",
        columns: ["title", "user_id", "created_at"],
        orderBy: [{ column: "created_at", direction: "DESC" as const }],
        limit: 5,
      },
    },
  ];

  const advancedTemplates = [
    {
      name: "Multiple Conditions",
      description: "Learn: Combine filters with AND",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["name", "age", "status"],
        whereConditions: [
          {
            id: "1",
            column: "status",
            operator: "=" as const,
            value: "active",
            conjunction: "AND" as const,
          },
          {
            id: "2",
            column: "age",
            operator: ">" as const,
            value: "18",
            conjunction: "AND" as const,
          },
        ],
      },
    },
    {
      name: "Pagination Example",
      description: "Learn: LIMIT + OFFSET for pages",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "posts",
        columns: ["title", "user_id", "views", "created_at"],
        orderBy: [{ column: "created_at", direction: "DESC" as const }],
        limit: 10,
        offset: 0,
      },
    },
    {
      name: "Count Total Rows",
      description: "Learn: COUNT(*) aggregate function",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: [],
        aggregates: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            alias: "total_users",
          },
        ],
      },
    },
    {
      name: "Count by Status",
      description: "Learn: GROUP BY with COUNT",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["status"],
        aggregates: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            alias: "user_count",
          },
        ],
        groupBy: ["status"],
        orderBy: [{ column: "user_count", direction: "DESC" as const }],
      },
    },
    {
      name: "Average Age by City",
      description: "Learn: AVG with GROUP BY",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["city"],
        aggregates: [
          {
            id: "1",
            function: "AVG" as const,
            column: "age",
            alias: "avg_age",
          },
          {
            id: "2",
            function: "COUNT" as const,
            column: "*",
            alias: "total",
          },
        ],
        groupBy: ["city"],
        orderBy: [{ column: "avg_age", direction: "DESC" as const }],
      },
    },
    {
      name: "Total Sales by Product",
      description: "Learn: SUM with WHERE & GROUP BY",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "orders",
        columns: ["product_id"],
        aggregates: [
          {
            id: "1",
            function: "SUM" as const,
            column: "total",
            alias: "revenue",
          },
          {
            id: "2",
            function: "COUNT" as const,
            column: "*",
            alias: "order_count",
          },
        ],
        whereConditions: [
          {
            id: "1",
            column: "status",
            operator: "=" as const,
            value: "delivered",
            conjunction: "AND" as const,
          },
        ],
        groupBy: ["product_id"],
        orderBy: [{ column: "revenue", direction: "DESC" as const }],
        limit: 10,
      },
    },
    {
      name: "Filter Groups (HAVING)",
      description: "Learn: HAVING clause for groups",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "users",
        columns: ["status"],
        aggregates: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            alias: "count",
          },
        ],
        groupBy: ["status"],
        having: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            operator: ">" as const,
            value: "10",
            conjunction: "AND" as const,
          },
        ],
        orderBy: [{ column: "count", direction: "DESC" as const }],
      },
    },
    {
      name: "Product Analytics",
      description: "Learn: Multiple aggregates & HAVING",
      difficulty: "Advanced",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      state: {
        queryType: "SELECT" as const,
        table: "products",
        columns: ["category"],
        aggregates: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            alias: "total_products",
          },
          {
            id: "2",
            function: "AVG" as const,
            column: "price",
            alias: "avg_price",
          },
          {
            id: "3",
            function: "MIN" as const,
            column: "price",
            alias: "min_price",
          },
          {
            id: "4",
            function: "MAX" as const,
            column: "price",
            alias: "max_price",
          },
        ],
        whereConditions: [
          {
            id: "1",
            column: "is_active",
            operator: "=" as const,
            value: "true",
            conjunction: "AND" as const,
          },
        ],
        groupBy: ["category"],
        having: [
          {
            id: "1",
            function: "COUNT" as const,
            column: "*",
            operator: ">=" as const,
            value: "5",
            conjunction: "AND" as const,
          },
        ],
        orderBy: [{ column: "avg_price", direction: "DESC" as const }],
      },
    },
  ];

  // Combine all templates
  const allTemplates = [...beginnerTemplates, ...intermediateTemplates, ...advancedTemplates];

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
              Learning Templates
            </h3>
          </div>
          <p className="text-xs text-foreground/40 font-mono">
            → learn by example • organized by difficulty
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allTemplates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => onLoadTemplate(template.state)}
              className={`group relative p-4 bg-[#fafafa] dark:bg-black/40 border ${templateStyle.border} ${templateStyle.hover} hover:border-foreground/20 rounded transition-all text-left`}
            >
              {/* Difficulty Badge */}
              <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                template.difficulty === 'Beginner' 
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : template.difficulty === 'Intermediate'
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}>
                {template.difficulty}
              </div>

              <div className="relative">
                <div className={`inline-flex w-9 h-9 rounded border ${templateStyle.border} items-center justify-center mb-3 ${templateStyle.icon}`}>
                  {template.icon}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1.5 font-mono uppercase tracking-wide">
                  {template.name}
                </h4>
                <p className="text-xs text-foreground/50 leading-relaxed mb-3 min-h-[2.5rem]">
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

