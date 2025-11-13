import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QueryState } from "@/features/sql-builder/types";
import { SQLRecipe } from "@/features/sql-builder/data/recipe-definitions";
import { SAMPLE_TABLES } from "@/features/sql-builder/types";
import { getCSVTableNames, getCSVData } from "@/features/sql-builder/utils/csv-data-manager";

interface RecipeCustomizerProps {
  recipe: SQLRecipe;
  currentTable?: string;
  onClose: () => void;
  onLoadRecipe: (state: Partial<QueryState>) => void;
}

export default function RecipeCustomizer({ recipe, currentTable, onClose, onLoadRecipe }: RecipeCustomizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize parameters with defaults
  const [params, setParams] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    
    // Set default values
    Object.entries(recipe.parameters).forEach(([key, config]) => {
      if (key === "table") {
        initial[key] = currentTable || "users";
      } else if ("default" in config) {
        initial[key] = config.default;
      } else if ("options" in config && Array.isArray(config.options)) {
        initial[key] = config.options[0];
      }
    });
    
    return initial;
  });

  // Get available tables (CSV + Demo)
  const csvTables = getCSVTableNames();
  const demoTables = SAMPLE_TABLES.map(t => t.name);
  const allTables = [...csvTables, ...demoTables];
  
  // Check if there are any tables available
  const hasNoTables = allTables.length === 0;

  // Get columns for selected table (memoized and reactive to table changes)
  const columns = useMemo(() => {
    // Use params.table if available, otherwise try to infer from recipe's generateQuery
    let tableName = params.table;
    
    // If no table param, try to get table from recipe's default query
    if (!tableName && !("table" in recipe.parameters)) {
      // Generate a sample query to see what table it uses
      try {
        const sampleQuery = recipe.generateQuery({});
        tableName = sampleQuery.table || '';
      } catch {
        // Fallback
        tableName = '';
      }
    }
    
    if (!tableName) return [];
    
    // Check CSV first
    const csvData = getCSVData(tableName);
    if (csvData) {
      return csvData.columns.map(c => c.name);
    }
    // Then check demo tables
    const demoTable = SAMPLE_TABLES.find(t => t.name === tableName);
    if (demoTable) {
      return demoTable.columns.map(c => c.name);
    }
    // Fallback
    return [];
  }, [params.table, recipe]); // Re-run when table or recipe changes!
  
  // Reset column parameters when table changes (with safeguard against infinite loop)
  useEffect(() => {
    if (columns.length > 0) {
      // Check which column parameters this recipe actually has
      const hasGroupByColumn = "groupByColumn" in recipe.parameters;
      const hasOrderByColumn = "orderByColumn" in recipe.parameters;
      const hasTimeColumn = "timeColumn" in recipe.parameters;
      
      // Only update if current selections are invalid for new table
      const needsUpdate = (
        (hasGroupByColumn && params.groupByColumn && !columns.includes(params.groupByColumn)) ||
        (hasOrderByColumn && params.orderByColumn && !columns.includes(params.orderByColumn)) ||
        (hasTimeColumn && params.timeColumn && !columns.includes(params.timeColumn)) ||
        (hasGroupByColumn && !params.groupByColumn) || 
        (hasOrderByColumn && !params.orderByColumn) || 
        (hasTimeColumn && !params.timeColumn)
      );
      
      if (needsUpdate) {
        const updates: Record<string, any> = {};
        
        // Helper: Find best categorical column (avoid IDs, prefer status/category/type/role)
        const findBestGroupByColumn = () => {
          // Prefer common categorical column names
          const preferredNames = ['status', 'category', 'type', 'role', 'city', 'country', 'department', 'payment_method'];
          for (const name of preferredNames) {
            const match = columns.find(c => c.toLowerCase() === name);
            if (match) return match;
          }
          // Avoid ID columns
          const nonIdColumns = columns.filter(c => !c.toLowerCase().includes('id') && !c.toLowerCase().includes('_at'));
          return nonIdColumns[0] || columns[0];
        };
        
        if (hasGroupByColumn && (!params.groupByColumn || !columns.includes(params.groupByColumn))) {
          updates.groupByColumn = findBestGroupByColumn();
        }
        if (hasOrderByColumn && (!params.orderByColumn || !columns.includes(params.orderByColumn))) {
          updates.orderByColumn = columns[0];
        }
        if (hasTimeColumn && (!params.timeColumn || !columns.includes(params.timeColumn))) {
          updates.timeColumn = columns.find(c => c.includes('created') || c.includes('date') || c.includes('time')) || columns[0];
        }
        
        if (Object.keys(updates).length > 0) {
          setParams(prev => ({ ...prev, ...updates }));
        }
      }
    }
  }, [params.table, columns, params.groupByColumn, params.orderByColumn, params.timeColumn, recipe.parameters]);

  const handleParamChange = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleLoad = () => {
    // Prevent double-click/rapid clicking
    if (isLoading) return;
    setIsLoading(true);
    
    // Validate required parameters
    const hasAllRequired = Object.entries(recipe.parameters).every(([key, config]) => {
      if ("required" in config && config.required) {
        return params[key] && params[key] !== "";
      }
      return true;
    });
    
    if (!hasAllRequired) {
      console.error("Missing required parameters");
      setIsLoading(false);
      return;
    }
    
    try {
      const queryState = recipe.generateQuery(params);
      onLoadRecipe(queryState);
      onClose(); // Close modal immediately after successful load
    } catch (error) {
      console.error("Error loading recipe:", error);
      setIsLoading(false);
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="recipe-customizer-title">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          aria-label="Close recipe customizer"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-foreground/10 bg-white dark:bg-[#1a1a1a]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-foreground/10 bg-foreground/5 flex items-center justify-center text-foreground/60">
                  {recipe.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground font-mono">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-foreground/50 font-mono mt-0.5">
                    {recipe.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Parameters Section */}
            {Object.keys(recipe.parameters).length > 0 && (
              <div>
                <h4 className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                  Customize Parameters
                </h4>
                
                <div className="space-y-3">
                  {Object.entries(recipe.parameters).map(([key, config]) => (
                  <div key={key}>
                    <label className="block text-xs font-mono text-foreground/70 mb-1.5 uppercase tracking-wide">
                      {config.label}
                      {"required" in config && config.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {key === "table" ? (
                      // Table selector
                      <select
                        value={params[key]}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                      >
                        {allTables.map(table => (
                          <option key={table} value={table}>{table}</option>
                        ))}
                      </select>
                    ) : key === "groupByColumn" || key === "orderByColumn" || key === "timeColumn" ? (
                      // Column selector
                      columns.length > 0 ? (
                        <select
                          value={params[key]}
                          onChange={(e) => handleParamChange(key, e.target.value)}
                          className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                        >
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600 dark:text-red-400 font-mono">
                          No columns available - select a table first
                        </div>
                      )
                    ) : "options" in config && Array.isArray(config.options) ? (
                      // Options selector (topN, direction, etc.)
                      <select
                        value={params[key]}
                        onChange={(e) => handleParamChange(key, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                      >
                        {config.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      // Text input fallback
                      <input
                        type="text"
                        value={params[key]}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
                      />
                    )}
                  </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation Section */}
            <div className="pt-4 border-t border-foreground/10">
              <h4 className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                How It Works
              </h4>
              <p className="text-xs text-foreground/60 font-mono leading-relaxed">
                {recipe.explanation}
              </p>
            </div>

            {/* Use Cases */}
            <div className="pt-4 border-t border-foreground/10">
              <h4 className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                Common Use Cases
              </h4>
              <ul className="space-y-1">
                {recipe.useCases.map((useCase, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground/60 font-mono">
                    <span className="text-foreground/40 flex-shrink-0 mt-0.5">→</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance Note */}
            {recipe.performanceNote && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Performance Note
                    </p>
                    <p className="text-xs text-foreground/60 font-mono">
                      {recipe.performanceNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SQL Pattern Preview */}
            <div className="pt-4 border-t border-foreground/10">
              <h4 className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                SQL Pattern
              </h4>
              <pre className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded text-[10px] font-mono text-foreground/70 overflow-x-auto">
                {recipe.sqlPattern}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-[#1a1a1a] border-t border-foreground/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground/90 hover:bg-foreground/10 rounded-lg transition-all font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={hasNoTables || columns.length === 0 || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-foreground hover:bg-foreground/90 disabled:bg-foreground/30 disabled:cursor-not-allowed rounded-lg transition-all font-mono active:scale-95 disabled:active:scale-100"
            >
              {isLoading ? "Loading..." : "Load into Builder"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

