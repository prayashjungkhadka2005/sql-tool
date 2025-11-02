"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VscTerminal } from "react-icons/vsc";
import { RiKey2Line, RiLockPasswordLine } from "react-icons/ri";
import { BiCodeBlock, BiTime } from "react-icons/bi";
import { TbApi } from "react-icons/tb";

// Import tool components
import Terminal from "./tools/Terminal";
import ApiTester from "./tools/ApiTester";
import JwtDecoder from "./tools/JwtDecoder";
import HashGenerator from "./tools/HashGenerator";
import JsonFormatter from "./tools/JsonFormatter";
import CronBuilder from "./tools/CronBuilder";

export default function DevToolbar() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Detect if desktop (non-touch device)
  useEffect(() => {
    setIsDesktop(!('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  // Open/toggle tool
  const openTool = useCallback((toolId: string) => {
    setActiveTool(prev => prev === toolId ? null : toolId);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd is pressed
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "t":
            e.preventDefault();
            openTool("terminal");
            break;
          case "a":
            e.preventDefault();
            openTool("api");
            break;
          case "j":
            e.preventDefault();
            openTool("jwt");
            break;
          case "h":
            e.preventDefault();
            openTool("hash");
            break;
          case "n":
            e.preventDefault();
            openTool("json");
            break;
          case "r":
            e.preventDefault();
            openTool("cron");
            break;
        }
      }
      // ESC to close
      if (e.key === "Escape" && activeTool) {
        setActiveTool(null);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [activeTool, openTool]);

  // Prevent background scroll when tool is open
  useEffect(() => {
    if (activeTool) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeTool]);

  const tools = [
    { id: "terminal", icon: VscTerminal, name: "Terminal", title: "Dev Terminal", shortcut: "Ctrl+T" },
    { id: "api", icon: TbApi, name: "API", title: "API Tester", shortcut: "Ctrl+A" },
    { id: "cron", icon: BiTime, name: "Cron", title: "Cron Builder", shortcut: "Ctrl+R" },
    { id: "jwt", icon: RiKey2Line, name: "JWT", title: "JWT Decoder", shortcut: "Ctrl+J" },
    { id: "hash", icon: RiLockPasswordLine, name: "Hash", title: "SHA-256 Hash", shortcut: "Ctrl+H" },
    { id: "json", icon: BiCodeBlock, name: "JSON", title: "JSON Formatter", shortcut: "Ctrl+N" },
  ];

  // Filter tools based on search
  const filteredTools = searchQuery 
    ? tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools;

  return (
    <>
      {/* Full Width Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-[55] backdrop-blur-xl bg-white dark:bg-warm-dark border-t-2 border-primary/40 dark:border-secondary/50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] h-14 sm:h-16">
        <div className="container mx-auto px-2 sm:px-6 h-full flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left: Branding */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-foreground">
                <span className="text-primary">Dev</span> Tools
              </span>
              <span className="text-[10px] sm:text-xs text-foreground/50 hidden lg:block">
                Developer utilities by Prayash
              </span>
            </div>

            {/* Center/Right: Tool Buttons & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-lg transition-all flex-shrink-0"
                title="Search Tools (Ctrl+K)"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Tool Buttons */}
              {(showSearch ? filteredTools : tools).map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => openTool(tool.id)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium flex-shrink-0 ${
                      activeTool === tool.id
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                        : "hover:bg-primary/10 text-foreground/70"
                    }`}
                    title={`${tool.title} (${tool.shortcut})`}
                  >
                    <IconComponent className="text-base sm:text-lg" />
                    <span className="hidden sm:inline">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Search Backdrop */}
      <AnimatePresence>
        {showSearch && (
          <div
            className="fixed inset-0 z-[64]"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          />
        )}
      </AnimatePresence>

      {/* Search Popup */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-14 sm:bottom-20 right-2 sm:right-6 z-[65] backdrop-blur-xl bg-white/95 dark:bg-warm-dark/95 border border-primary/30 rounded-2xl shadow-2xl p-4 w-[calc(100vw-1rem)] sm:w-80 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tools..."
                className="flex-1 bg-transparent text-foreground focus:outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus={isDesktop}
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-red-500/10 rounded"
              >
                <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {filteredTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      openTool(tool.id);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-primary/10 rounded-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="text-lg text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="text-xs text-foreground/50">{tool.shortcut}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredTools.length === 0 && (
                <p className="text-sm text-foreground/50 text-center py-4">No tools found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setActiveTool(null)}
          />
        )}
      </AnimatePresence>

      {/* Tool Panels */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-0 right-0 bottom-14 sm:bottom-16 z-[60] pointer-events-none"
            style={activeTool === "terminal" ? { height: `${terminalHeight}px` } : {}}
          >
            {/* Terminal - Full Width */}
            {activeTool === "terminal" && (
              <Terminal 
                terminalHeight={terminalHeight}
                setTerminalHeight={setTerminalHeight}
                onClose={() => setActiveTool(null)}
              />
            )}

            {/* API Tester - Full Width */}
            {activeTool === "api" && (
              <div className="w-full pointer-events-auto">
                <ApiTester onClose={() => setActiveTool(null)} />
              </div>
            )}

            {/* Cron Builder - Full Width */}
            {activeTool === "cron" && (
              <div className="w-full pointer-events-auto">
                <CronBuilder onClose={() => setActiveTool(null)} />
              </div>
            )}

            {/* Other Tools - Full Width */}
            {activeTool !== "terminal" && activeTool !== "api" && activeTool !== "cron" && (
              <div className="w-full pointer-events-auto">
                {activeTool === "jwt" && <JwtDecoder onClose={() => setActiveTool(null)} />}
                {activeTool === "hash" && <HashGenerator onClose={() => setActiveTool(null)} />}
                {activeTool === "json" && <JsonFormatter onClose={() => setActiveTool(null)} />}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setActiveTool(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
