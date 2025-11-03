"use client";

import { QueryState } from "@/features/sql-builder/types";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface VisualQueryFlowProps {
  queryState: QueryState;
  totalRows: number;
  afterWhereRows: number;
  afterGroupByRows: number;
  finalRows: number;
}

export default function VisualQueryFlow({ 
  queryState, 
  totalRows, 
  afterWhereRows, 
  afterGroupByRows, 
  finalRows 
}: VisualQueryFlowProps) {
  // Build step-by-step flow
  const steps = useMemo(() => {
    const flowSteps = [];

    // Step 1: FROM
    flowSteps.push({
      label: "FROM",
      description: `Get all rows from ${queryState.table}`,
      rows: totalRows,
      color: "blue"
    });

    // Step 2: WHERE (if exists)
    if (queryState.whereConditions.length > 0) {
      const conditions = queryState.whereConditions.length;
      flowSteps.push({
        label: "WHERE",
        description: `Filter with ${conditions} condition${conditions > 1 ? 's' : ''}`,
        rows: afterWhereRows,
        color: "orange"
      });
    }

    // Step 3: GROUP BY (if exists)
    if (queryState.groupBy && queryState.groupBy.length > 0) {
      const groups = queryState.groupBy.join(", ");
      flowSteps.push({
        label: "GROUP BY",
        description: `Group by ${groups}`,
        rows: afterGroupByRows,
        color: "purple"
      });
    }

    // Step 4: Aggregates (if exists)
    if (queryState.aggregates && queryState.aggregates.length > 0) {
      const funcs = queryState.aggregates.map(a => a.function).join(", ");
      flowSteps.push({
        label: "AGGREGATE",
        description: `Calculate ${funcs}`,
        rows: afterGroupByRows > 0 ? afterGroupByRows : finalRows,
        color: "green"
      });
    }

    // Step 5: HAVING (if exists)
    if (queryState.having && queryState.having.length > 0) {
      flowSteps.push({
        label: "HAVING",
        description: "Filter grouped results",
        rows: finalRows,
        color: "red"
      });
    }

    // Step 6: ORDER BY (if exists)
    if (queryState.orderBy && queryState.orderBy.length > 0) {
      const sorts = queryState.orderBy.map(o => `${o.column} ${o.direction}`).join(", ");
      flowSteps.push({
        label: "ORDER BY",
        description: `Sort by ${sorts}`,
        rows: finalRows,
        color: "indigo"
      });
    }

    // Step 7: LIMIT (if exists)
    if (queryState.limit) {
      flowSteps.push({
        label: "LIMIT",
        description: `Take first ${queryState.limit} rows`,
        rows: Math.min(queryState.limit, finalRows),
        color: "pink"
      });
    }

    return flowSteps;
  }, [queryState, totalRows, afterWhereRows, afterGroupByRows, finalRows]);

  // Harmonized color accents using primary/accent palette
  const colorMap: Record<string, string> = {
    blue: "border-foreground/10 bg-foreground/5 text-foreground",
    orange: "border-foreground/10 bg-foreground/5 text-foreground",
    purple: "border-foreground/10 bg-foreground/5 text-foreground",
    green: "border-foreground/10 bg-foreground/5 text-foreground",
    red: "border-foreground/10 bg-foreground/5 text-foreground",
    indigo: "border-foreground/10 bg-foreground/5 text-foreground",
    pink: "border-foreground/10 bg-foreground/5 text-foreground"
  };

  if (steps.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Query Execution Flow
        </h3>
        <span className="text-xs text-foreground/40 font-mono">
          → see how SQL processes your query
        </span>
      </div>

      <div className="relative">
        {/* Flow Steps */}
        <div className="flex flex-col gap-0">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`relative flex items-center gap-4 p-4 border rounded-lg ${colorMap[step.color] || colorMap.blue} bg-white dark:bg-[#1a1a1a]`}
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-foreground/10 flex items-center justify-center text-sm font-bold text-foreground">
                  {index + 1}
                </div>

                {/* Icon (subtle) */}
                <div className="flex-shrink-0 text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-semibold text-sm mb-0.5">
                    {step.label}
                  </div>
                  <div className="text-xs opacity-80 truncate">
                    {step.description}
                  </div>
                </div>

                {/* Row Count */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold font-mono">
                    {step.rows}
                  </div>
                  <div className="text-[10px] opacity-60 font-mono">
                    rows
                  </div>
                </div>
              </motion.div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <svg className="w-5 h-5 text-foreground/30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final Result Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: steps.length * 0.1 + 0.2 }}
          className="mt-4 p-4 bg-foreground/5 border border-foreground/10 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-foreground">Final Result</div>
                <div className="text-xs text-foreground/60 font-mono">
                  Query executed successfully
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground font-mono">
                {finalRows}
              </div>
              <div className="text-xs text-foreground/60 font-mono">
                rows returned
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Educational Tip */}
      <div className="mt-4 p-3 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-foreground mb-1">Learning Tip</div>
            <div className="text-xs text-foreground/70 leading-relaxed">
              SQL processes queries in this order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. 
              Watch how your data transforms at each step!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

