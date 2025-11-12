"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatSQL, validateSQL, minifySQL } from "../utils/sql-formatter";
import { highlightSQL } from "../utils/sql-highlighter";
import { useToast } from "../hooks/useToast";
import Toast from "./ui/Toast";

interface SQLFormatterProps {
  onClose?: () => void;
}

export default function SQLFormatter({ onClose }: SQLFormatterProps) {
  const { toast, showToast, hideToast } = useToast();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Sync textarea scroll with syntax highlighting overlay
  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    
    if (!textarea || !overlay) return;
    
    const handleScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };
    
    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setCopied(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to dismiss toast
      if (e.key === 'Escape' && toast.isVisible) {
        hideToast();
        return;
      }
      
      // Ctrl/Cmd + K to clear
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast.isVisible, hideToast, handleClear]);

  // Get formatted output
  const getFormattedOutput = useCallback(() => {
    if (!input.trim()) return '';
    
    const validation = validateSQL(input);
    if (!validation.valid) return input;
    
    try {
      return mode === 'format' 
        ? formatSQL(input, { indentSize: 2, uppercase: true })
        : minifySQL(input);
    } catch {
      return input;
    }
  }, [input, mode]);

  // Auto-apply when mode changes (Format/Minify toggle)
  const prevModeRef = useRef(mode);
  const inputRef = useRef(input);
  
  // Keep input ref updated
  useEffect(() => {
    inputRef.current = input;
  }, [input]);
  
  useEffect(() => {
    // Only apply if mode actually changed (not on initial mount)
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    
    const currentInput = inputRef.current;
    if (!currentInput.trim()) return;
    
    // Validate SQL
    const validation = validateSQL(currentInput);
    if (!validation.valid) {
      // Don't format invalid SQL
      return;
    }
    
    // Apply formatting based on current mode
    try {
      const formatted = mode === 'format' 
        ? formatSQL(currentInput, { indentSize: 2, uppercase: true })
        : minifySQL(currentInput);
      
      setInput(formatted);
    } catch (err) {
      // Silent fail - keep original input
      console.error('Format failed:', err);
    }
  }, [mode]); // ONLY trigger when mode changes

  const handleCopy = async () => {
    if (!input.trim()) {
      showToast('No SQL to copy', 'error');
      return;
    }
    
    const output = getFormattedOutput();
    if (!output) {
      showToast('No formatted output available', 'error');
      return;
    }
    
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        showToast('Clipboard API not supported in your browser', 'error');
        return;
      }
      
      await navigator.clipboard.writeText(output);
      setCopied(true);
      
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const loadExample = () => {
    const example = "SELECT u.name,u.email,COUNT(o.id) as total FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.status='active' GROUP BY u.id,u.name,u.email ORDER BY total DESC LIMIT 10";
    
    // Auto-format the example
    try {
      const formatted = mode === 'format' 
        ? formatSQL(example, { indentSize: 2, uppercase: true })
        : minifySQL(example);
      setInput(formatted);
    } catch (err) {
      // Keep original if formatting fails
      setInput(example);
    }
  };

  // Always show syntax highlighting for current input
  const displayOutput = input;

  return (
    <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              SQL Formatter
            </h2>
            <p className="text-xs text-foreground/40 font-mono mt-0.5">
              Beautify or minify SQL instantly
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadExample}
            className="text-xs px-2 py-1 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded font-mono text-foreground/60 hover:text-foreground transition-all"
            title="Load example query"
          >
            Example
          </button>
          {input && (
            <button
              onClick={handleClear}
              className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded font-mono text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all"
              title="Clear all (⌘K)"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Controls - Simplified */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Mode Toggle - Auto-applies on change */}
        <div className="flex items-center gap-2 bg-foreground/5 p-1 rounded-lg">
          <button
            onClick={() => setMode('format')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1.5 ${
              mode === 'format'
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
            }`}
            title="Format with indentation and line breaks"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Format
          </button>
          <button
            onClick={() => setMode('minify')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1.5 ${
              mode === 'minify'
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
            }`}
            title="Minify to single line"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Minify
          </button>
        </div>

        {/* Copy Button - Matches SQL Builder style */}
        {input.trim() && (
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
            aria-label="Copy formatted SQL to clipboard"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                copy
              </>
            )}
          </button>
        )}
      </div>

      {/* SQL Editor - Always with syntax highlighting */}
      <div className="relative">        
        {/* Always show syntax highlighting overlay */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your SQL here... Toggle Format/Minify to see instant results"
            className="w-full h-[400px] px-4 py-3 pt-10 bg-transparent border border-foreground/10 hover:border-foreground/20 focus:border-foreground/20 rounded-lg text-sm text-transparent focus:outline-none transition-all font-mono resize-none relative z-10 placeholder:text-foreground/30"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            style={{ 
              caretColor: '#000',
              WebkitTextFillColor: 'transparent',
            }}
            aria-label="SQL input editor"
          />
          <div 
            ref={overlayRef}
            className="absolute inset-0 px-4 py-3 pt-10 bg-[#fafafa] dark:bg-black/40 rounded-lg overflow-auto pointer-events-none"
            aria-hidden="true"
          >
            <pre 
              className="text-sm font-mono leading-[1.5] whitespace-pre-wrap break-words min-h-full"
              dangerouslySetInnerHTML={{ 
                __html: input ? highlightSQL(displayOutput) : '' 
              }}
            />
          </div>
          
          {/* Character counter - Inside editor, top-left */}
          <div className="absolute top-2 left-2 text-[10px] font-mono text-foreground/40 bg-white/80 dark:bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-foreground/10 shadow-sm z-20 pointer-events-none">
            {input.length.toLocaleString()} characters
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-mono leading-relaxed">
            <span className="font-semibold">How it works:</span> Toggle between Format/Minify to instantly see results. {mode === 'format' ? 'Format mode adds indentation and line breaks for readability.' : 'Minify mode compresses SQL to a single line.'} Click Copy to get the formatted version.
          </div>
        </div>
      </div>
    </div>
  );
}
