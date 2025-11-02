"use client";

import { useState } from "react";

interface HelpTooltipProps {
  title: string;
  content: string;
}

export default function HelpTooltip({ title, content }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="w-4 h-4 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-all"
        aria-label="Help"
        type="button"
      >
        <svg className="w-2.5 h-2.5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isVisible && (
        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#1e1e1e] dark:bg-black border border-gray-700 dark:border-gray-800 rounded-lg shadow-2xl z-50">
          <h4 className="text-xs font-semibold text-gray-200 mb-1.5 font-mono uppercase tracking-wide">
            {title}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
