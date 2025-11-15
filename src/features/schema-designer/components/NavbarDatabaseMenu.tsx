"use client";

import { useEffect, useRef, useState } from "react";

interface NavbarDatabaseMenuProps {
  isDatabaseConnected?: boolean;
  isRefreshingDatabase?: boolean;
  onConnectDatabase?: () => void;
  onRefreshDatabase?: () => void;
  onSyncDatabase?: () => void;
  onDisconnectDatabase?: () => void;
  onOpenActivity?: () => void;
}

export default function NavbarDatabaseMenu({
  isDatabaseConnected = false,
  isRefreshingDatabase = false,
  onConnectDatabase,
  onRefreshDatabase,
  onSyncDatabase,
  onDisconnectDatabase,
  onOpenActivity,
}: NavbarDatabaseMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action?: () => void) => {
    return () => {
      action?.();
      setIsOpen(false);
    };
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`px-2 py-1 text-xs sm:text-sm font-medium rounded transition-all flex items-center gap-1 active:scale-95 ${
          isOpen
            ? 'bg-foreground/10 text-foreground'
            : 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
        }`}
        title="Database actions"
        type="button"
      >
        <svg className={`w-3.5 h-3.5 ${isDatabaseConnected ? 'text-emerald-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a2 2 0 012-2h12a2 2 0 012 2v5H4V5zM4 10h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z" />
        </svg>
        <span className="hidden sm:inline">{isDatabaseConnected ? 'Database' : 'Connect'}</span>
        {isDatabaseConnected && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Live</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#101010] border border-foreground/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
          {!isDatabaseConnected && onConnectDatabase && (
            <button
              onClick={handleAction(onConnectDatabase)}
              className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-foreground/5 transition active:scale-95"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-medium">Connect to database</div>
                  <div className="text-xs text-foreground/50">Cmd/Ctrl + D</div>
                </div>
              </div>
            </button>
          )}

          {isDatabaseConnected && (
            <>
              {onRefreshDatabase && (
                <button
                  onClick={handleAction(onRefreshDatabase)}
                  disabled={isRefreshingDatabase}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-foreground/5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    {isRefreshingDatabase ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    <div>
                      <div className="font-medium">Pull latest schema</div>
                      <div className="text-xs text-foreground/50">Refresh from database</div>
                    </div>
                  </div>
                </button>
              )}

              {onSyncDatabase && (
                <button
                  onClick={handleAction(onSyncDatabase)}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-foreground/5 transition active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div>
                      <div className="font-medium">Push local changes</div>
                      <div className="text-xs text-foreground/50">Sync canvas → DB</div>
                    </div>
                  </div>
                </button>
              )}

              {onDisconnectDatabase && (
                <button
                  onClick={handleAction(onDisconnectDatabase)}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-600 transition active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <div className="font-medium">Disconnect</div>
                      <div className="text-xs text-foreground/50">Keep local changes</div>
                    </div>
                  </div>
                </button>
              )}
            </>
          )}
          {onOpenActivity && (
            <button
              onClick={handleAction(onOpenActivity)}
              className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-foreground/5 transition flex items-center gap-2 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
              </svg>
              <div>
                <div className="font-medium">Open activity feed</div>
                <div className="text-xs text-foreground/50">View live logs</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

