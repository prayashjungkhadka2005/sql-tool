"use client";

import { useState } from "react";

interface QueryExplanationProps {
  explanation: string;
  hasQuery: boolean;
}

export default function QueryExplanation({ explanation, hasQuery }: QueryExplanationProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!hasQuery) return null;

  return (
    <>
      {/* Explain Query Button */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex-1 px-3 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded transition-all flex items-center justify-center gap-2 text-xs font-mono text-foreground/70 hover:text-foreground"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showExplanation ? "hide" : "explain"}
          <svg className={`w-3 h-3 transition-transform ml-auto ${showExplanation ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Explanation Content */}
      {showExplanation && (
        <div className="mb-5 p-4 bg-foreground/5 border border-foreground/10 rounded">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-foreground/70 mb-2 font-mono uppercase tracking-wider">
                Explanation
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-line font-mono">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

