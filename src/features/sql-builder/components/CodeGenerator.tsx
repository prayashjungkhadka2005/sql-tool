"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QueryState } from "../types";
import { generateORMCode, ORMType, getORMInstallCommand, getORMDocsLink } from "../utils/code-generator";

interface CodeGeneratorProps {
  queryState: QueryState;
}

const ORMS: { value: ORMType; label: string }[] = [
  { value: 'prisma', label: 'Prisma' },
  { value: 'typeorm', label: 'TypeORM' },
  { value: 'sequelize', label: 'Sequelize' },
  { value: 'mongoose', label: 'Mongoose' },
  { value: 'drizzle', label: 'Drizzle' },
];

export default function CodeGenerator({ queryState }: CodeGeneratorProps) {
  const [selectedORM, setSelectedORM] = useState<ORMType>('prisma');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Generate code when ORM or query changes
  useEffect(() => {
    if (!queryState.table) {
      setCode('');
      setCopied(false); // Reset copy state when no query
      return;
    }
    
    const generated = generateORMCode(queryState, selectedORM);
    setCode(generated);
    setCopied(false); // Reset copy state when code changes
  }, [queryState, selectedORM]);

  const handleCopy = async () => {
    if (!code) return;
    
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        console.error('Clipboard API not supported');
        return;
      }
      
      await navigator.clipboard.writeText(code);
      setCopied(true);
      
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (!queryState.table) return null;

  return (
    <div className="relative bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Generate ORM Code
            </h3>
            <p className="text-xs text-foreground/40 font-mono mt-0.5">
              Convert SQL to {ORMS.find(o => o.value === selectedORM)?.label}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        {code && (
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 active:scale-95 text-foreground rounded transition-all flex items-center gap-1.5 font-mono"
            aria-label="Copy code to clipboard"
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

      {/* ORM Selector */}
      <div className="mb-4">
        <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2 block">
          Select ORM
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ORMS.map((orm) => (
            <button
              key={orm.value}
              onClick={() => setSelectedORM(orm.value)}
              className={`px-3 py-2 text-xs font-mono rounded-lg transition-all flex flex-col items-center gap-1.5 ${
                selectedORM === orm.value
                  ? 'bg-primary text-white'
                  : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground'
              }`}
            >
              {/* Icon based on ORM */}
              {orm.value === 'prisma' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              )}
              {orm.value === 'typeorm' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {orm.value === 'sequelize' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
              {orm.value === 'mongoose' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
              {orm.value === 'drizzle' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              )}
              <span className="text-[10px]">{orm.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Code */}
      {code ? (
        <div>
          <label className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2 block">
            Generated Code
          </label>
          <div className="bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-foreground whitespace-pre">
              {code}
            </pre>
          </div>

          {/* Installation Hint */}
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono leading-relaxed">
                  <span className="font-semibold">Installation:</span> <code className="bg-blue-500/10 px-1 py-0.5 rounded">{getORMInstallCommand(selectedORM)}</code>
                </p>
                <a 
                  href={getORMDocsLink(selectedORM)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 font-mono hover:underline mt-1 inline-flex items-center gap-1"
                >
                  View {ORMS.find(o => o.value === selectedORM)?.label} Docs
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-foreground/40 text-sm font-mono">
          Build a query to generate code
        </div>
      )}
    </div>
  );
}

