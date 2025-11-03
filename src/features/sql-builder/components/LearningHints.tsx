"use client";

import { QueryState } from "@/features/sql-builder/types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface LearningHintsProps {
  queryState: QueryState;
}

export default function LearningHints({ queryState }: LearningHintsProps) {
  // Generate contextual hints based on query state
  const hints = useMemo(() => {
    const tips = [];

    // Hint: Use aggregates with GROUP BY
    if (queryState.aggregates && queryState.aggregates.length > 0 && (!queryState.groupBy || queryState.groupBy.length === 0)) {
      tips.push({
        type: "tip",
        title: "Add GROUP BY",
        message: "Aggregate functions work best with GROUP BY. Try grouping by a column to analyze data by categories.",
        color: "blue"
      });
    }

    // Hint: GROUP BY without aggregates
    if (queryState.groupBy && queryState.groupBy.length > 0 && (!queryState.aggregates || queryState.aggregates.length === 0)) {
      tips.push({
        type: "suggestion",
        title: "Add Aggregates",
        message: "You are grouping data. Add COUNT(*) or other aggregates to see statistics for each group.",
        color: "green"
      });
    }

    // Error: HAVING without GROUP BY
    if (queryState.having && queryState.having.length > 0 && (!queryState.groupBy || queryState.groupBy.length === 0)) {
      tips.push({
        type: "error",
        title: "Invalid: HAVING without GROUP BY",
        message: "HAVING filters aggregated groups. Add at least one GROUP BY column or remove the HAVING clause.",
        color: "orange"
      });
    }

    // Hint: Large result set without LIMIT
    if (queryState.table && !queryState.limit && (!queryState.aggregates || queryState.aggregates.length === 0)) {
      tips.push({
        type: "tip",
        title: "Performance Tip",
        message: "Add LIMIT to control how many rows to return. This is especially useful for large datasets.",
        color: "purple"
      });
    }

    // Hint: OFFSET without LIMIT
    if (queryState.offset && queryState.offset > 0 && !queryState.limit) {
      tips.push({
        type: "info",
        title: "SQL Pattern",
        message: "OFFSET is typically used with LIMIT for pagination. Try adding LIMIT to see pages of results.",
        color: "indigo"
      });
    }

    // Hint: Successful aggregate query
    if (queryState.aggregates && queryState.aggregates.length > 0 && queryState.groupBy && queryState.groupBy.length > 0) {
      tips.push({
        type: "success",
        title: "Aggregates with GROUP BY",
        message: "Good job. Using aggregates with GROUP BY mirrors real-world analytics patterns.",
        color: "green"
      });
    }

    // Warning: Non-grouped, non-aggregated columns present with aggregates
    if (queryState.aggregates && queryState.aggregates.length > 0 && queryState.columns && queryState.columns.length > 0) {
      const grouped = new Set(queryState.groupBy || []);
      const offenders = queryState.columns.filter(c => !grouped.has(c));
      if (offenders.length > 0) {
        tips.push({
          type: "warning",
          title: "SQL Rule: Non-grouped columns",
          message: `Columns not in GROUP BY are not well-defined alongside aggregates: ${offenders.join(', ')}. Consider adding them to GROUP BY or removing them.`,
          color: "orange"
        });
      }
    }

    return tips;
  }, [queryState]);

  const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: "bg-white dark:bg-[#1a1a1a]", border: "border-foreground/10", icon: "text-primary" },
    green: { bg: "bg-white dark:bg-[#1a1a1a]", border: "border-foreground/10", icon: "text-primary" },
    orange: { bg: "bg-white dark:bg-[#1a1a1a]", border: "border-foreground/10", icon: "text-primary" },
    purple: { bg: "bg-white dark:bg-[#1a1a1a]", border: "border-foreground/10", icon: "text-primary" },
    indigo: { bg: "bg-white dark:bg-[#1a1a1a]", border: "border-foreground/10", icon: "text-primary" },
  };

  if (hints.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {hints.map((hint, index) => {
          const colors = colorMap[hint.color] || colorMap.blue;
          return (
            <motion.div
              key={hint.title}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className={`w-5 h-5 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {hint.title}
                  </div>
                  <div className="text-xs text-foreground/70 leading-relaxed">
                    {hint.message}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

