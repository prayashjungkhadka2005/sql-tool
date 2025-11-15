"use client";

import { useRef, useState, useEffect } from "react";

interface BranchSwitcherProps {
  activeBranch?: string;
  branchOptions?: string[];
  onSelect?: (branch: string) => void;
  onCreate?: () => void;
  onDelete?: (branch: string) => void;
  onOpenBranchesSidebar?: () => void;
}

export default function BranchSwitcher({
  activeBranch = "main",
  branchOptions,
  onSelect,
  onCreate,
  onDelete,
  onOpenBranchesSidebar,
}: BranchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("mousedown", handleClick, true);
    return () => window.removeEventListener("mousedown", handleClick, true);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!branchOptions || branchOptions.length === 0) {
    return null;
  }

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="px-2 py-1 text-xs sm:text-sm font-medium border border-foreground/15 rounded-lg transition-all flex items-center gap-1.5 bg-white/70 dark:bg-black/30 hover:bg-foreground/5 active:scale-95"
        title="Switch branch"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg className="w-3.5 h-3.5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 18h7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 12h7" />
        </svg>
        <span className="font-mono">{activeBranch}</span>
        <svg className={`w-3 h-3 transition-transform text-foreground/60 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
          <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#0f0f0f] border border-foreground/15 rounded-xl shadow-2xl p-2 z-50">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-foreground/40 mb-1 px-1 flex items-center justify-between">
            <span>Branches</span>
            {onOpenBranchesSidebar && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBranchesSidebar();
                }}
                className="p-1 rounded hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                title="Open branches drawer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
              {branchOptions!.map(branch => (
              <button
                key={branch}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelect?.(branch);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                  branch === activeBranch
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-foreground/5 text-foreground/80"
                }`}
              >
                <span className="flex-1 truncate font-mono text-xs">{branch}</span>
                {branch === activeBranch && (
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {branch !== "main" && onDelete && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsOpen(false);
                      onDelete(branch);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsOpen(false);
                        onDelete(branch);
                      }
                    }}
                    className="p-1 rounded-md hover:bg-red-500/10 text-red-500 cursor-pointer"
                    aria-label={`Delete branch ${branch}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          {onCreate && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                  onCreate?.();
              }}
              className="w-full mt-2 px-2 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-foreground/20 text-foreground/70 hover:bg-foreground/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Branch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

