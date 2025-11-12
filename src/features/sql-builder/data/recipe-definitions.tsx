import { QueryState, SAMPLE_TABLES } from "@/features/sql-builder/types";
import { getCSVData } from "@/features/sql-builder/utils/csv-data-manager";

/**
 * Helper: Get all column names for a table (supports CSV + demo tables)
 */
function getAllColumns(tableName: string): string[] {
  // Check CSV first
  const csvData = getCSVData(tableName);
  if (csvData) {
    return csvData.columns.map(c => c.name);
  }
  
  // Then check demo tables
  const table = SAMPLE_TABLES.find(t => t.name === tableName);
  return table ? table.columns.map(c => c.name) : [];
}

/**
 * Recipe Definition Interface
 */
export interface SQLRecipe {
  id: string;
  name: string;
  description: string;
  category: "Analysis" | "Quality" | "Performance" | "Business";
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  icon: JSX.Element;
  
  // Parameters that can be customized
  parameters: {
    topN?: { label: string; default: number; options: number[] };
    table?: { label: string; required: boolean };
    groupByColumn?: { label: string; required: boolean };
    orderByColumn?: { label: string; required: boolean };
    direction?: { label: string; options: ["ASC", "DESC"]; default: "DESC" };
    timeColumn?: { label: string; required: boolean };
    timePeriod?: { label: string; options: string[]; default: string };
  };
  
  // Function that generates QueryState from parameters
  generateQuery: (params: Record<string, any>) => Partial<QueryState>;
  
  // Educational content
  explanation: string;
  useCases: string[];
  performanceNote?: string;
  
  // SQL pattern explanation
  sqlPattern: string;
}

/**
 * Recipe: Top N Per Group
 */
export const topNPerGroupRecipe: SQLRecipe = {
  id: "top-n-per-group",
  name: "Top N Per Group",
  description: "Find best/worst items within each category using window functions",
  category: "Analysis",
  difficulty: "Advanced",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  parameters: {
    topN: { label: "Top N", default: 5, options: [3, 5, 10, 20] },
    table: { label: "Table", required: true },
    groupByColumn: { label: "Group By Column", required: true },
    orderByColumn: { label: "Order By Column", required: true },
    direction: { label: "Direction", options: ["ASC", "DESC"], default: "DESC" },
  },
  generateQuery: (params) => {
    const table = params.table || "products";
    return {
      queryType: "SELECT" as const,
      table,
      columns: getAllColumns(table), // Get all actual column names for UI
      aggregates: [],
      distinct: false,
      whereConditions: [],
      joins: [],
      groupBy: [],
      having: [],
      orderBy: [
        { column: params.orderByColumn || "price", direction: (params.direction || "DESC") as "ASC" | "DESC" }
      ],
      limit: params.topN || null,
      offset: null,
      insertValues: {},
    };
  },
  explanation: "Uses ROW_NUMBER() window function to rank items within each group, then filters to keep only top N. PARTITION BY splits data into groups, ORDER BY ranks within each group.",
  useCases: [
    "Top selling products per category",
    "Highest paid employees per department",
    "Best performing posts per author",
    "Most popular items per region"
  ],
  performanceNote: "Window functions are efficient for this pattern. Avoid subqueries for large datasets.",
  sqlPattern: "WITH ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY {group} ORDER BY {column} {dir}) as rank FROM {table}) SELECT * FROM ranked WHERE rank <= {n}"
};

/**
 * Recipe: Group and Count
 */
export const groupAndCountRecipe: SQLRecipe = {
  id: "group-and-count",
  name: "Group and Count",
  description: "Count how many items exist in each category or group",
  category: "Analysis",
  difficulty: "Beginner",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  parameters: {
    table: { label: "Table", required: true },
    groupByColumn: { label: "Group By Column", required: true },
  },
  generateQuery: (params) => ({
    queryType: "SELECT" as const,
    table: params.table || "products",
    columns: [params.groupByColumn || "category"],
    aggregates: [
      { id: "1", function: "COUNT" as const, column: "*", alias: "total_count" }
    ],
    distinct: false,
    whereConditions: [],
    joins: [],
    groupBy: [params.groupByColumn || "category"],
    having: [],
    orderBy: [
      { column: "total_count", direction: "DESC" as const }
    ],
    limit: null,
    offset: null,
    insertValues: {},
  }),
  explanation: "Groups records by a category column and counts how many items are in each group. Orders by count to see the most popular categories first.",
  useCases: [
    "Products per category",
    "Users per city or status",
    "Orders per payment method",
    "Posts per author"
  ],
  sqlPattern: "SELECT {column}, COUNT(*) as total FROM {table} GROUP BY {column} ORDER BY total DESC"
};

/**
 * Recipe: Time Series Analysis
 */
export const timeSeriesRecipe: SQLRecipe = {
  id: "time-series",
  name: "Time Series Analysis",
  description: "Aggregate data by time periods (day, week, month, year)",
  category: "Analysis",
  difficulty: "Intermediate",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  parameters: {
    table: { label: "Table", required: true },
    timeColumn: { label: "Date Column", required: true },
  },
  generateQuery: (params) => ({
    queryType: "SELECT" as const,
    table: params.table || "orders",
    columns: [params.timeColumn || "created_at"],
    aggregates: [
      { id: "1", function: "COUNT" as const, column: "*", alias: "count" }
    ],
    distinct: false,
    whereConditions: [],
    joins: [],
    groupBy: [params.timeColumn || "created_at"],
    having: [],
    orderBy: [
      { column: params.timeColumn || "created_at", direction: "DESC" as const }
    ],
    limit: null,
    offset: null,
    insertValues: {},
  }),
  explanation: "Groups records by time period and counts/sums values. Useful for tracking trends, growth, and patterns over time.",
  useCases: [
    "Daily signups tracking",
    "Monthly revenue reports",
    "Weekly order counts",
    "Yearly growth analysis"
  ],
  sqlPattern: "SELECT DATE({time}), COUNT(*) FROM {table} GROUP BY DATE({time}) ORDER BY DATE({time})"
};

/**
 * Recipe: Efficient Pagination
 */
export const paginationRecipe: SQLRecipe = {
  id: "pagination",
  name: "Efficient Pagination",
  description: "Paginate large result sets without performance issues",
  category: "Performance",
  difficulty: "Intermediate",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  parameters: {
    table: { label: "Table", required: true },
    topN: { label: "Page Size", default: 20, options: [10, 20, 50, 100] },
  },
  generateQuery: (params) => {
    const table = params.table || "products";
    return {
      queryType: "SELECT" as const,
      table,
      columns: getAllColumns(table), // Get all actual column names for UI
      aggregates: [],
      distinct: false,
      whereConditions: [],
      joins: [],
      groupBy: [],
      having: [],
      orderBy: [
        { column: "id", direction: "ASC" }
      ],
      limit: params.topN || 20,
      offset: 0,
      insertValues: {},
    };
  },
  explanation: "Uses LIMIT and OFFSET for pagination. Always ORDER BY a unique column (usually ID) to ensure consistent results across pages.",
  useCases: [
    "Product listing pages",
    "Search results pagination",
    "Table data with load more",
    "API endpoint pagination"
  ],
  performanceNote: "For large OFFSETs, consider cursor-based pagination instead",
  sqlPattern: "SELECT * FROM {table} ORDER BY id LIMIT {size} OFFSET {page * size}"
};

/**
 * Recipe: Revenue Analysis
 */
export const revenueAnalysisRecipe: SQLRecipe = {
  id: "revenue-analysis",
  name: "Revenue Analysis",
  description: "Calculate total revenue with grouping (works best with orders table)",
  category: "Business",
  difficulty: "Beginner",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  parameters: {
    groupByColumn: { label: "Group By", required: true },
  },
  generateQuery: (params) => ({
    queryType: "SELECT" as const,
    table: "orders", // Fixed to orders table (has total column)
    columns: [params.groupByColumn || "status"],
    aggregates: [
      { id: "1", function: "SUM" as const, column: "total", alias: "revenue" },
      { id: "2", function: "COUNT" as const, column: "*", alias: "order_count" },
      { id: "3", function: "AVG" as const, column: "total", alias: "avg_order_value" }
    ],
    distinct: false,
    whereConditions: [],
    joins: [],
    groupBy: [params.groupByColumn || "status"],
    having: [],
    orderBy: [
      { column: "revenue", direction: "DESC" as const }
    ],
    limit: null,
    offset: null,
    insertValues: {},
  }),
  explanation: "Sums revenue and counts orders grouped by status. Shows which order statuses generate the most revenue and calculates average order value.",
  useCases: [
    "Revenue by order status",
    "Sales by payment method",
    "Revenue trends analysis",
    "Order performance metrics"
  ],
  performanceNote: "Works specifically with orders table which has total column for revenue calculations",
  sqlPattern: "SELECT {group}, SUM(total) as revenue, COUNT(*), AVG(total) FROM orders GROUP BY {group} ORDER BY revenue DESC"
};

/**
 * Recipe: Count by Category
 */
export const countByCategoryRecipe: SQLRecipe = {
  id: "count-by-category",
  name: "Count by Category",
  description: "Count and analyze data by different groupings",
  category: "Analysis",
  difficulty: "Intermediate",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  parameters: {
    table: { label: "Table", required: true },
    groupByColumn: { label: "Group By Column", required: true },
  },
  generateQuery: (params) => ({
    queryType: "SELECT" as const,
    table: params.table || "products",
    columns: [params.groupByColumn || "category"],
    aggregates: [
      { id: "1", function: "COUNT" as const, column: "*", alias: "total_count" }
    ],
    distinct: false,
    whereConditions: [
      { id: "1", column: params.groupByColumn || "category", operator: "IS NOT NULL" as const, value: "", conjunction: "AND" as const }
    ],
    joins: [],
    groupBy: [params.groupByColumn || "category"],
    having: [
      { id: "1", function: "COUNT" as const, column: "*", operator: ">" as const, value: "0", conjunction: "AND" as const }
    ],
    orderBy: [
      { column: "total_count", direction: "DESC" as const }
    ],
    limit: 20,
    offset: null,
    insertValues: {},
  }),
  explanation: "Filters out null values, groups by category, counts items, filters groups with HAVING, and orders by count. Shows complete filtering pipeline.",
  useCases: [
    "Products per category (non-empty)",
    "Users per status (with counts)",
    "Orders per payment method",
    "Posts per category (ranked)"
  ],
  performanceNote: "WHERE before GROUP BY reduces data before aggregation. HAVING filters after grouping.",
  sqlPattern: "SELECT {group}, COUNT(*) as count FROM {table} WHERE {group} IS NOT NULL GROUP BY {group} HAVING COUNT(*) > 0 ORDER BY count DESC"
};

/**
 * Recipe: Users with Orders (JOIN)
 */
export const joinAnalysisRecipe: SQLRecipe = {
  id: "join-analysis",
  name: "Users with Orders",
  description: "Combine users and orders tables to see customer purchase history",
  category: "Analysis",
  difficulty: "Intermediate",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  parameters: {},
  generateQuery: (params) => ({
    queryType: "SELECT" as const,
    table: "users",
    columns: ["users.name", "users.email", "users.city", "orders.total", "orders.status"],
    aggregates: [],
    distinct: false,
    whereConditions: [],
    joins: [
      { 
        id: "1", 
        type: "LEFT" as const, 
        table: "orders", 
        onLeft: "users.id", 
        onRight: "orders.user_id" 
      }
    ],
    groupBy: [],
    having: [],
    orderBy: [
      { column: "orders.total", direction: "DESC" as const }
    ],
    limit: 20,
    offset: null,
    insertValues: {},
  }),
  explanation: "Joins users and orders tables to show customer purchase information. LEFT JOIN includes all users even if they have no orders. Perfect for customer analysis.",
  useCases: [
    "Customer purchase history",
    "User activity analysis",
    "Revenue per customer",
    "Order patterns by user"
  ],
  performanceNote: "LEFT JOIN includes users with zero orders. Use INNER JOIN if you only want users who have ordered.",
  sqlPattern: "SELECT u.name, u.email, o.total, o.status FROM users u LEFT JOIN orders o ON u.id = o.user_id ORDER BY o.total DESC"
};

/**
 * Recipe: Advanced Filtering
 */
export const advancedFilteringRecipe: SQLRecipe = {
  id: "advanced-filtering",
  name: "Advanced Filtering",
  description: "Combine multiple conditions with AND/OR logic for precise filtering",
  category: "Quality",
  difficulty: "Intermediate",
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  parameters: {
    table: { label: "Table", required: true },
  },
  generateQuery: (params) => {
    const table = params.table || "products";
    // Table-specific WHERE conditions
    const whereConditions = table === "products" ? [
      { id: "1", column: "category", operator: "=" as const, value: "Electronics", conjunction: "AND" as const },
      { id: "2", column: "price", operator: ">" as const, value: "100", conjunction: "AND" as const },
      { id: "3", column: "is_active", operator: "=" as const, value: "true", conjunction: "AND" as const }
    ] : table === "users" ? [
      { id: "1", column: "status", operator: "=" as const, value: "active", conjunction: "AND" as const },
      { id: "2", column: "age", operator: ">" as const, value: "25", conjunction: "AND" as const }
    ] : table === "orders" ? [
      { id: "1", column: "status", operator: "=" as const, value: "delivered", conjunction: "AND" as const },
      { id: "2", column: "total", operator: ">" as const, value: "100", conjunction: "AND" as const }
    ] : [];
    
    return {
      queryType: "SELECT" as const,
      table,
      columns: getAllColumns(table),
      aggregates: [],
      distinct: false,
      whereConditions,
      joins: [],
      groupBy: [],
      having: [],
      orderBy: table === "products" ? [{ column: "price", direction: "DESC" as const }] : [{ column: "id", direction: "DESC" as const }],
      limit: 20,
      offset: null,
      insertValues: {},
    };
  },
  explanation: "Uses multiple WHERE conditions with AND logic to narrow down results. Each condition must be true for a row to be included. Great for precise data filtering.",
  useCases: [
    "Active electronics over $100",
    "Premium users in specific city",
    "Recent high-value orders",
    "Quality products on sale"
  ],
  sqlPattern: "SELECT * FROM {table} WHERE {cond1} AND {cond2} AND {cond3}"
};

/**
 * All Recipes organized by category
 */
export const ALL_RECIPES: SQLRecipe[] = [
  // Beginner-Friendly
  groupAndCountRecipe,
  revenueAnalysisRecipe,
  paginationRecipe,
  
  // Intermediate
  timeSeriesRecipe,
  countByCategoryRecipe,
  joinAnalysisRecipe,
  advancedFilteringRecipe,
  
  // Advanced
  topNPerGroupRecipe,
];

export const RECIPES_BY_CATEGORY = {
  Analysis: ALL_RECIPES.filter(r => r.category === "Analysis"),
  Quality: ALL_RECIPES.filter(r => r.category === "Quality"),
  Performance: ALL_RECIPES.filter(r => r.category === "Performance"),
  Business: ALL_RECIPES.filter(r => r.category === "Business"),
};
