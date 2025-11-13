"use client";

import { QueryState } from "@/features/sql-builder/types";
import { validateInsertQuery } from "@/features/sql-builder/utils/insert-validator";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface ValidationBannerProps {
  queryState: QueryState;
  onAutoFix?: (fixType: string) => void;
}

interface ValidationIssue {
  type: "error" | "warning";
  title: string;
  message: string;
  fixType?: string;
  fixLabel?: string;
}

export default function ValidationBanner({ queryState, onAutoFix }: ValidationBannerProps) {
  const issues = useMemo(() => {
    const problems: ValidationIssue[] = [];

    // PRIORITY 0 - INSERT VALIDATION: Use separate validator for cleaner code
    if (queryState.queryType === "INSERT") {
      const validation = validateInsertQuery(queryState);
      
      if (validation && validation.hasErrors) {
        // Missing required fields
        if (validation.missingRequired.length > 0) {
          problems.push({
            type: "error",
            title: "Missing Required Fields",
            message: `${validation.missingRequired.length} required field${validation.missingRequired.length > 1 ? 's are' : ' is'} empty: ${validation.missingRequired.join(', ')}. Fill in all required fields to insert a row.`,
            fixType: undefined,
            fixLabel: undefined
          });
          return problems;
        }
        
        // Type errors
        if (validation.typeErrors.length > 0) {
          problems.push({
            type: "error",
            title: "Invalid Data Types",
            message: `${validation.typeErrors.length} field${validation.typeErrors.length > 1 ? 's have' : ' has'} wrong data type: ${validation.typeErrors.slice(0, 2).join('; ')}${validation.typeErrors.length > 2 ? '...' : ''}`,
            fixType: undefined,
            fixLabel: undefined
          });
          return problems;
        }
      }
    }

    // PRIORITY 1 - CRITICAL ERROR: HAVING without GROUP BY
    // This is the most critical issue - show ONLY this if it exists
    if (queryState.having && queryState.having.length > 0 && (!queryState.groupBy || queryState.groupBy.length === 0)) {
      problems.push({
        type: "error",
        title: "Invalid Query: HAVING Requires GROUP BY",
        message: "HAVING clause filters grouped results. You must add GROUP BY first, otherwise the query won't work.",
        fixType: "add-group-by-for-having",
        fixLabel: "Add GROUP BY automatically"
      });
      
      // Return early - don't show other issues until this critical one is fixed
      return problems;
    }

    // PRIORITY 2 - ERROR: Empty WHERE values
    // Check for WHERE conditions with empty values (except IS NULL / IS NOT NULL which don't need values)
    if (queryState.whereConditions && queryState.whereConditions.length > 0) {
      const emptyConditions = queryState.whereConditions.filter(c => {
        // IS NULL and IS NOT NULL don't require a value
        if (c.operator === 'IS NULL' || c.operator === 'IS NOT NULL') {
          return false;
        }
        // All other operators require a value
        return !c.value || c.value.trim() === '';
      });
      if (emptyConditions.length > 0) {
        problems.push({
          type: "error",
          title: "Invalid WHERE Clause: Empty Value",
          message: `${emptyConditions.length} WHERE condition${emptyConditions.length > 1 ? 's have' : ' has'} an empty value. Enter a value or remove the condition.`,
          fixType: "remove-empty-where",
          fixLabel: `Remove empty condition${emptyConditions.length > 1 ? 's' : ''}`
        });
        // Return early - this will prevent query from running
        return problems;
      }
    }

    // PRIORITY 2.5 - ERROR: Empty HAVING values
    // Check for HAVING conditions with empty values
    if (queryState.having && queryState.having.length > 0) {
      const emptyHaving = queryState.having.filter(h => !h.value || h.value.trim() === '');
      if (emptyHaving.length > 0) {
        problems.push({
          type: "error",
          title: "Invalid HAVING Clause: Empty Value",
          message: `${emptyHaving.length} HAVING condition${emptyHaving.length > 1 ? 's have' : ' has'} an empty value. Enter a value or remove the condition.`,
          fixType: "remove-empty-having",
          fixLabel: `Remove empty condition${emptyHaving.length > 1 ? 's' : ''}`
        });
        // Return early - this will prevent query from running
        return problems;
      }
    }

    // PRIORITY 3 - ERROR: GROUP BY exists but columns not in GROUP BY (and no aggregates)
    // This is a critical SQL error - you can't SELECT non-grouped columns with GROUP BY
    if (queryState.groupBy && queryState.groupBy.length > 0 && queryState.columns && queryState.columns.length > 0) {
      const grouped = new Set(queryState.groupBy || []);
      const offenders = queryState.columns.filter(c => !grouped.has(c) && c !== '*');
      
      if (offenders.length > 0) {
        // If there are NO aggregates, this is an ERROR (invalid SQL)
        // If there ARE aggregates, it's a WARNING (might work in some DBs)
        const hasAggregates = queryState.aggregates && queryState.aggregates.length > 0;
        
        problems.push({
          type: hasAggregates ? "warning" : "error",
          title: hasAggregates ? "SQL Rule: Non-grouped Columns" : "Invalid SQL: Columns Not in GROUP BY",
          message: hasAggregates 
            ? `These columns aren't in GROUP BY but appear with aggregates: ${offenders.join(', ')}. Standard SQL requires them to be grouped or removed.`
            : `Invalid query! These columns must be in GROUP BY or removed: ${offenders.join(', ')}. When using GROUP BY, you can only SELECT grouped columns or aggregates.`,
          fixType: "add-columns-to-group-by",
          fixLabel: `Add ${offenders.length} column${offenders.length > 1 ? 's' : ''} to GROUP BY`
        });
        
        // Return early if it's an error to prevent query execution
        if (!hasAggregates) {
          return problems;
        }
      }
    }

    // PRIORITY 4 - ERROR: ORDER BY with GROUP BY must use grouped or aggregate columns
    if (queryState.groupBy && queryState.groupBy.length > 0 && 
        queryState.orderBy && queryState.orderBy.length > 0) {
      
      const grouped = new Set(queryState.groupBy || []);
      const aggregateAliases = new Set((queryState.aggregates || []).map(a => a.alias || a.column));
      
      const invalidOrderBy = queryState.orderBy.filter(order => {
        const orderCol = order.column;
        return !grouped.has(orderCol) && !aggregateAliases.has(orderCol);
      });
      
      if (invalidOrderBy.length > 0) {
        const invalidCols = invalidOrderBy.map(o => o.column).join(', ');
        problems.push({
          type: "error",
          title: "Invalid ORDER BY with GROUP BY",
          message: `ORDER BY column${invalidOrderBy.length > 1 ? 's' : ''} must be in GROUP BY or be aggregate${invalidOrderBy.length > 1 ? 's' : ''}: ${invalidCols}. When using GROUP BY, you can only order by grouped columns or aggregates.`,
          fixType: "add-orderby-to-groupby",
          fixLabel: `Add ${invalidOrderBy.length} column${invalidOrderBy.length > 1 ? 's' : ''} to GROUP BY`
        });
        
        // Return early - this is an error
        return problems;
      }
    }

    // PRIORITY 5 - WARNING: SELECT * with GROUP BY
    if (queryState.groupBy && queryState.groupBy.length > 0 && 
        queryState.columns && queryState.columns.includes('*')) {
      problems.push({
        type: "warning",
        title: "SELECT * with GROUP BY",
        message: "SELECT * doesn't work properly with GROUP BY. Select specific columns or aggregates instead.",
        fixType: "replace-star-with-grouped",
        fixLabel: "Select grouped columns only"
      });
    }

    // PRIORITY 6 - WARNING: GROUP BY without aggregates (only show if no errors above)
    if (queryState.groupBy && queryState.groupBy.length > 0 && (!queryState.aggregates || queryState.aggregates.length === 0)) {
      // Only show this if there are no non-grouped column errors
      const grouped = new Set(queryState.groupBy || []);
      const offenders = (queryState.columns || []).filter(c => !grouped.has(c) && c !== '*');
      
      if (offenders.length === 0 && !queryState.columns.includes('*')) {
        problems.push({
          type: "warning",
          title: "Suggestion: Add Aggregates",
          message: "You're grouping data but not calculating any statistics. Add COUNT(*) or other aggregates to make this meaningful.",
          fixType: "add-count-aggregate",
          fixLabel: "Add COUNT(*) aggregate"
        });
      }
    }

    return problems;
  }, [queryState]);

  if (issues.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      <AnimatePresence mode="popLayout">
        {issues.map((issue, idx) => (
          <motion.div
            key={`${issue.type}-${idx}`}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`relative overflow-hidden border-2 rounded-lg p-4 ${
                issue.type === "error"
                  ? "bg-red-500/10 border-red-500/50 dark:bg-red-500/20 dark:border-red-500/70"
                  : "bg-blue-500/10 border-blue-500/50 dark:bg-blue-500/20 dark:border-blue-500/70"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${issue.type === "error" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {issue.type === "error" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold mb-1 break-words ${issue.type === "error" ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}>
                    {issue.title}
                  </div>
                  <div className={`text-xs leading-relaxed break-words ${issue.type === "error" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {issue.message}
                  </div>
                </div>

                {/* Auto-fix Button */}
                {issue.fixType && onAutoFix && (
                  <button
                    onClick={() => onAutoFix(issue.fixType!)}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded transition-all active:scale-95 ${
                      issue.type === "error"
                        ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white dark:bg-red-500 dark:hover:bg-red-600"
                        : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                    }`}
                  >
                    {issue.fixLabel}
                  </button>
                )}
              </div>

              {/* Animated border pulse */}
              {issue.type === "error" && (
                <motion.div
                  className="absolute inset-0 pointer-events-none border-2 border-red-500 rounded-lg"
                  animate={{ opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

