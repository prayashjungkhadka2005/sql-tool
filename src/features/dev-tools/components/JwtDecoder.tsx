"use client";

import { useState } from "react";
import { RiKey2Line } from "react-icons/ri";

interface JwtDecoderProps {
  onClose: () => void;
}

export default function JwtDecoder({ onClose }: JwtDecoderProps) {
  const [jwtInput, setJwtInput] = useState("");
  const [jwtDecoded, setJwtDecoded] = useState<any>(null);
  const [jwtError, setJwtError] = useState("");
  const [jwtCopied, setJwtCopied] = useState(false);

  // JWT Decoder
  const decodeJWT = () => {
    try {
      setJwtError("");
      const parts = jwtInput.split(".");
      if (parts.length !== 3) {
        setJwtError("Invalid JWT format");
        return;
      }
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      setJwtDecoded({ header, payload });
    } catch (error) {
      setJwtError("Failed to decode JWT. Ensure it's a valid token.");
      setJwtDecoded(null);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setJwtCopied(true);
    setTimeout(() => setJwtCopied(false), 2000);
  };

  return (
    <div className="backdrop-blur-xl bg-white/95 dark:bg-warm-dark/95 border-t border-primary/30 dark:border-secondary/30 shadow-2xl rounded-t-3xl">
      <div className="p-3 sm:p-8">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
          <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-1.5 sm:gap-3">
            <div className="p-1 sm:p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg sm:rounded-xl flex-shrink-0">
              <RiKey2Line className="text-base sm:text-xl md:text-2xl text-primary" />
            </div>
            <span className="truncate">JWT Decoder</span>
          </h3>
          <div className="flex items-center gap-2">
            {jwtDecoded && (
              <button
                onClick={() => {
                  setJwtInput("");
                  setJwtDecoded(null);
                  setJwtError("");
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
              Paste your JWT token
            </label>
            <textarea
              className="w-full h-36 px-4 py-3 bg-white dark:bg-warm-dark border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl text-sm text-foreground resize-none focus:outline-none transition-all font-mono shadow-sm"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={jwtInput}
              onChange={(e) => {
                setJwtInput(e.target.value);
                setJwtError("");
              }}
            />
          </div>

          <button
            onClick={decodeJWT}
            disabled={!jwtInput.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Decode Token
          </button>

          {jwtError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{jwtError}</p>
            </div>
          )}

          {jwtDecoded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/70">
                  Decoded Output
                </label>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(jwtDecoded, null, 2))}
                  className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all flex items-center gap-1.5"
                >
                  {jwtCopied ? (
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
              <div className="p-4 bg-white dark:bg-warm-dark border-2 border-green-200 dark:border-green-800/50 rounded-xl max-h-64 overflow-auto shadow-sm">
                <pre className="text-xs text-foreground font-mono leading-relaxed">
                  {JSON.stringify(jwtDecoded, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

