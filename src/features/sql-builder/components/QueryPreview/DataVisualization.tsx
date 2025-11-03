"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface DataVisualizationProps {
  data: any[];
  hasAggregates: boolean;
  hasGroupBy: boolean;
}

export default function DataVisualization({ data, hasAggregates, hasGroupBy }: DataVisualizationProps) {
  // Only show charts for GROUP BY queries with aggregates
  const shouldShowChart = hasAggregates && hasGroupBy && data.length > 0 && data.length <= 50;

  // Detect if we have numeric aggregate data
  const chartData = useMemo(() => {
    if (!shouldShowChart || !data || data.length === 0) return null;

    // Find the first row to analyze columns
    const firstRow = data[0];
    if (!firstRow) return null;
    const columns = Object.keys(firstRow);

    // Find group column (non-numeric) and value column (numeric aggregate)
    let groupColumn: string | null = null;
    let valueColumn: string | null = null;

    // Separate numeric and non-numeric columns
    const numericColumns: string[] = [];
    const nonNumericColumns: string[] = [];

    for (const col of columns) {
      const value = firstRow[col];
      if (typeof value === 'number') {
        numericColumns.push(col);
      } else {
        nonNumericColumns.push(col);
      }
    }

    // Find best aggregate column (prioritize common aggregate names)
    const aggregateKeywords = ['count', 'total', 'sum', 'avg', 'revenue', 'min', 'max'];
    valueColumn = numericColumns.find(col => 
      aggregateKeywords.some(keyword => col.toLowerCase().includes(keyword))
    ) || numericColumns[0] || null;

    // Group column is the first non-numeric column
    groupColumn = nonNumericColumns[0] || null;

    if (!groupColumn || !valueColumn) return null;

    // Extract data for chart
    const chartPoints = data.map(row => ({
      label: String(row[groupColumn!]),
      value: Number(row[valueColumn!])
    })).filter(point => !isNaN(point.value));

    if (chartPoints.length === 0) return null;

    const maxValue = Math.max(...chartPoints.map(p => p.value));

    return {
      points: chartPoints,
      maxValue,
      groupColumn,
      valueColumn
    };
  }, [data, shouldShowChart]);

  if (!chartData) return null;

  const { points, maxValue, groupColumn, valueColumn } = chartData;

  // Calculate total for pie chart
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-5 border border-foreground/10 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V9m4 10V5m4 14v-8M5 19V13" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Bar Chart</h4>
              <p className="text-xs text-foreground/50 font-mono">
                {valueColumn} by {groupColumn}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {points.map((point, index) => {
              const percentage = (point.value / maxValue) * 100;
              const color = 'bg-gradient-to-r from-primary to-accent';

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-foreground/70 truncate max-w-[60%]">
                      {point.label}
                    </span>
                    <span className="text-xs font-bold font-mono text-foreground">
                      {point.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-6 bg-foreground/5 rounded-full overflow-hidden border border-foreground/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`h-full ${color} flex items-center justify-end pr-2`}
                    >
                      {percentage > 15 && (
                        <span className="text-[10px] font-bold text-white">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-5 border border-foreground/10 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3a9 9 0 109 9h-9V3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Distribution</h4>
              <p className="text-xs text-foreground/50 font-mono">
                Percentage breakdown
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {points.map((point, index) => {
              const percentage = (point.value / total) * 100;
              const colorSet = { text: 'text-foreground', border: 'border-primary/30' };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-3 border ${colorSet.border} rounded`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold text-foreground truncate">
                        {point.label}
                      </div>
                      <div className={`text-xs font-mono ${colorSet.text}`}>
                        {point.value.toLocaleString()} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className={`text-2xl font-bold font-mono ${colorSet.text}`}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-foreground/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-foreground/60">Total</span>
              <span className="text-lg font-bold font-mono text-foreground">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Learning Tip */}
      <div className="mt-4 p-3 border border-foreground/10 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-foreground mb-1">Visualization Insight</div>
            <div className="text-xs text-foreground/70 leading-relaxed">
              Charts help you spot patterns! Bar charts show comparisons, while distributions reveal proportions. 
              Try different GROUP BY columns to discover insights in your data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

