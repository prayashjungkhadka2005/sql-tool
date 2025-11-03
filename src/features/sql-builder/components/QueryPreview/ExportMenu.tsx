"use client";

import { useState, useRef, useEffect } from "react";

interface ExportMenuProps {
  mockResults: any[];
  tableName: string;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportSQL: () => void;
  onCopyJSON: () => void;
  onCopyCSV: () => void;
  onCopyTable: () => void;
}

export default function ExportMenu({
  mockResults,
  tableName,
  onExportCSV,
  onExportJSON,
  onExportSQL,
  onCopyJSON,
  onCopyCSV,
  onCopyTable,
}: ExportMenuProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExport = (exportFn: () => void) => {
    try {
      exportFn();
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      setShowExportMenu(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="px-2 py-1 hover:bg-foreground/5 active:bg-foreground/10 active:scale-95 rounded text-xs font-medium text-foreground/70 hover:text-foreground transition-all flex items-center gap-1.5"
        title="Export options"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden sm:inline">Export</span>
        <svg className={`w-3 h-3 transition-transform ${showExportMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showExportMenu && mockResults.length > 0 && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            {/* Download section */}
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">
              Download
            </div>
            <button
              onClick={() => handleExport(onExportCSV)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-foreground">CSV File</span>
            </button>
            <button
              onClick={() => handleExport(onExportJSON)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-foreground">JSON File</span>
            </button>
            <button
              onClick={() => handleExport(onExportSQL)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="text-foreground">SQL Inserts</span>
            </button>

            <div className="border-t border-foreground/10 my-1"></div>

            {/* Copy section */}
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">
              Copy
            </div>
            <button
              onClick={() => handleExport(onCopyJSON)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-foreground">As JSON</span>
            </button>
            <button
              onClick={() => handleExport(onCopyCSV)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-foreground">As CSV</span>
            </button>
            <button
              onClick={() => handleExport(onCopyTable)}
              className="w-full text-left px-4 py-2 hover:bg-foreground/5 active:bg-foreground/10 active:scale-[0.98] transition-all flex items-center gap-3 text-sm font-mono"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-foreground">As Table</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

