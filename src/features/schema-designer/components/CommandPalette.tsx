/**
 * Command Palette Component
 * 
 * Spotlight-style search for all actions in Schema Designer.
 * Inspired by Figma, Linear, VSCode, and Raycast.
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaState, SchemaTable } from '../types';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category: 'table' | 'export' | 'import' | 'navigation' | 'edit' | 'view';
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SchemaState;
  commands: Command[];
}

export default function CommandPalette({ isOpen, onClose, schema, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(cmd => {
      // Search in label
      if (cmd.label.toLowerCase().includes(searchLower)) return true;
      
      // Search in description
      if (cmd.description?.toLowerCase().includes(searchLower)) return true;
      
      // Search in keywords
      if (cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))) return true;
      
      // Search in category
      if (cmd.category.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    table: 'Tables',
    export: 'Export',
    import: 'Import',
    navigation: 'Navigation',
    edit: 'Edit',
    view: 'View',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    table: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    import: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
      </svg>
    ),
    navigation: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    view: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="px-4 py-3 border-b border-foreground/10">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commands... (tables, export, import)"
                className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 outline-none text-base font-mono"
              />
              <kbd className="px-2 py-1 text-xs font-mono text-foreground/50 bg-foreground/5 border border-foreground/10 rounded">
                Esc
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <svg className="w-12 h-12 mx-auto text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-foreground/60 font-mono">No commands found</p>
                <p className="text-xs text-foreground/40 font-mono mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    {/* Category Header */}
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <span className="text-foreground/40">{categoryIcons[category]}</span>
                      <span className="text-[10px] font-semibold text-foreground/40 font-mono uppercase tracking-wider">
                        {categoryLabels[category]}
                      </span>
                    </div>

                    {/* Commands */}
                    {cmds.map((cmd, idx) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          data-index={globalIndex}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors text-left ${
                            isSelected
                              ? 'bg-primary/10 border-l-2 border-primary'
                              : 'border-l-2 border-transparent hover:bg-foreground/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {cmd.icon && (
                              <span className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-foreground/60'}`}>
                                {cmd.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium font-mono truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div className="text-xs text-foreground/50 font-mono truncate mt-0.5">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {cmd.shortcut && (
                            <kbd className="px-2 py-0.5 text-[10px] font-mono text-foreground/50 bg-foreground/5 border border-foreground/10 rounded flex-shrink-0">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-foreground/40 font-mono">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-foreground/5 border border-foreground/10 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-foreground/5 border border-foreground/10 rounded">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-foreground/5 border border-foreground/10 rounded">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-foreground/5 border border-foreground/10 rounded">Esc</kbd>
                Close
              </span>
            </div>
            <div className="text-[10px] text-foreground/40 font-mono">
              {filteredCommands.length} {filteredCommands.length === 1 ? 'result' : 'results'}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

