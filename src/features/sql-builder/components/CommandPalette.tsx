"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  name: string;
  description: string;
  category: "Navigate" | "Actions";
  icon: JSX.Element;
  action: () => void;
  keywords: string[];
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: "sql-builder",
      name: "SQL Query Builder",
      description: "Build SQL queries visually",
      category: "Navigate",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      action: () => router.push("/tools/sql-builder"),
      keywords: ["sql", "builder", "query", "database"],
    },
    {
      id: "sql-formatter",
      name: "SQL Formatter",
      description: "Format and beautify SQL",
      category: "Navigate",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      ),
      action: () => router.push("/tools/sql-formatter"),
      keywords: ["format", "formatter", "beautify", "sql"],
    },
    {
      id: "home",
      name: "Home",
      description: "Back to all tools",
      category: "Navigate",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      action: () => router.push("/"),
      keywords: ["home", "tools", "landing"],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(k => k.includes(searchLower))
    );
  });

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] cursor-pointer"
            aria-label="Close command palette"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-[111] flex items-start justify-center p-4 pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-foreground/10">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type to search tools and actions..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none font-mono text-sm"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-block px-2 py-1 bg-foreground/10 text-foreground/60 rounded text-xs font-mono">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-[400px] overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  <>
                    {["Navigate", "Actions"].map(category => {
                      const categoryCommands = filteredCommands.filter(c => c.category === category);
                      if (categoryCommands.length === 0) return null;

                      return (
                        <div key={category} className="py-2">
                          <div className="px-4 py-2">
                            <h3 className="text-[10px] font-mono font-semibold text-foreground/40 uppercase tracking-wider">
                              {category}
                            </h3>
                          </div>
                          {categoryCommands.map((cmd, idx) => {
                            const globalIndex = filteredCommands.indexOf(cmd);
                            const isSelected = globalIndex === selectedIndex;
                            
                            return (
                              <button
                                key={cmd.id}
                                onClick={() => {
                                  cmd.action();
                                  onClose();
                                }}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                                  isSelected 
                                    ? 'bg-foreground text-background' 
                                    : 'hover:bg-foreground/5'
                                }`}
                              >
                                <div className={`flex-shrink-0 ${isSelected ? 'text-background' : 'text-foreground/60'}`}>
                                  {cmd.icon}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`text-sm font-medium font-mono ${isSelected ? 'text-background' : 'text-foreground'}`}>
                                    {cmd.name}
                                  </div>
                                  <div className={`text-xs font-mono ${isSelected ? 'text-background/70' : 'text-foreground/50'}`}>
                                    {cmd.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <kbd className="px-2 py-1 bg-background/20 text-background rounded text-xs font-mono">
                                    ↵
                                  </kbd>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-foreground/40 font-mono">No results found</p>
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="px-4 py-3 bg-foreground/5 border-t border-foreground/10">
                <div className="flex items-center justify-between text-[10px] font-mono text-foreground/40">
                  <span>Use ↑↓ to navigate</span>
                  <span>↵ to select</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

