"use client";

import { QueryState } from "@/features/sql-builder/types";
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

    // ERROR: HAVING without GROUP BY
    if (queryState.having && queryState.having.length > 0 && (!queryState.groupBy || queryState.groupBy.length === 0)) {
      problems.push({
        type: "error",
        title: "Invalid Query: HAVING Requires GROUP BY",
        message: "HAVING clause filters grouped results. You must add GROUP BY first, otherwise the query won't work.",
        fixType: "add-group-by-for-having",
        fixLabel: "Add GROUP BY automatically"
      });
    }

    // WARNING: Non-grouped columns with aggregates
    if (queryState.aggregates && queryState.aggregates.length > 0 && queryState.columns && queryState.columns.length > 0) {
      const grouped = new Set(queryState.groupBy || []);
      const offenders = queryState.columns.filter(c => !grouped.has(c));
      if (offenders.length > 0) {
        problems.push({
          type: "warning",
          title: "SQL Rule Violation: Non-grouped Columns",
          message: `These columns aren't in GROUP BY but appear with aggregates: ${offenders.join(', ')}. Standard SQL requires them to be grouped or removed.`,
          fixType: "add-columns-to-group-by",
          fixLabel: `Add ${offenders.length} column${offenders.length > 1 ? 's' : ''} to GROUP BY`
        });
      }
    }

    // WARNING: GROUP BY without aggregates
    if (queryState.groupBy && queryState.groupBy.length > 0 && (!queryState.aggregates || queryState.aggregates.length === 0)) {
      problems.push({
        type: "warning",
        title: "Incomplete Query: GROUP BY Without Aggregates",
        message: "You're grouping data but not calculating any statistics. Add COUNT(*) or other aggregates to make this meaningful.",
        fixType: "add-count-aggregate",
        fixLabel: "Add COUNT(*) aggregate"
      });
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
                  : "bg-orange-500/10 border-orange-500/50 dark:bg-orange-500/20 dark:border-orange-500/70"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${issue.type === "error" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
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
                  <div className={`text-sm font-bold mb-1 ${issue.type === "error" ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                    {issue.title}
                  </div>
                  <div className={`text-xs leading-relaxed ${issue.type === "error" ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
                    {issue.message}
                  </div>
                </div>

                {/* Auto-fix Button */}
                {issue.fixType && onAutoFix && (
                  <button
                    onClick={() => onAutoFix(issue.fixType!)}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded transition-all ${
                      issue.type === "error"
                        ? "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
                        : "bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600"
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

