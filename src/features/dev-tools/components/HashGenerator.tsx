"use client";

import { useState } from "react";
import { RiLockPasswordLine } from "react-icons/ri";

interface HashGeneratorProps {
  onClose: () => void;
}

export default function HashGenerator({ onClose }: HashGeneratorProps) {
  const [hashInput, setHashInput] = useState("");
  const [hashOutput, setHashOutput] = useState("");
  const [hashCopied, setHashCopied] = useState(false);

  // Hash Generator
  const generateHash = async () => {
    if (!hashInput) {
      setHashOutput("Please enter text to hash.");
      return;
    }
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    setHashOutput(hashHex);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  };

  return (
    <div className="backdrop-blur-xl bg-white/95 dark:bg-warm-dark/95 border-t border-primary/30 dark:border-secondary/30 shadow-2xl rounded-t-3xl">
      <div className="p-3 sm:p-8">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
          <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-1.5 sm:gap-3">
            <div className="p-1 sm:p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl flex-shrink-0">
              <RiLockPasswordLine className="text-base sm:text-xl md:text-2xl text-primary" />
            </div>
            <span className="truncate">Hash Generator</span>
          </h3>
          <div className="flex items-center gap-2">
            {hashOutput && (
              <button
                onClick={() => {
                  setHashInput("");
                  setHashOutput("");
                }}
                className="text-xs text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all group"
              title="Close (ESC)"
            >
              <svg className="w-5 h-5 text-foreground/60 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Enter text to hash
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl text-sm text-foreground focus:outline-none transition-all shadow-sm"
              placeholder="password123"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && hashInput && generateHash()}
            />
          </div>

          <button
            onClick={generateHash}
            disabled={!hashInput.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Generate Hash
          </button>

          {hashOutput && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/70">
                  SHA-256 Hash Output
                </label>
                <button
                  onClick={() => copyToClipboard(hashOutput)}
                  className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all flex items-center gap-1.5"
                >
                  {hashCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-white dark:bg-warm-dark border-2 border-green-200 dark:border-green-800/50 rounded-xl shadow-sm">
                <p className="text-xs text-foreground break-all font-mono leading-relaxed">
                  {hashOutput}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

