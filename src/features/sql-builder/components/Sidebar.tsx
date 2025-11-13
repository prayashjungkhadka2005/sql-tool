"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!isMobileOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  const tools = [
    {
      name: "SQL Builder",
      href: "/tools/sql-builder",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      badge: null,
    },
    {
      name: "SQL Formatter",
      href: "/tools/sql-formatter",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      ),
      badge: null,
    },
  ];

  // No actions in sidebar - QueryHistory is handled by individual pages
  const actions: any[] = [];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-[60px] sm:top-[72px] left-4 z-[55] p-2.5 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg shadow-lg hover:bg-foreground/5 transition-all active:scale-95"
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 60 : 240,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        className={`
          fixed top-0 left-0 bottom-0 z-50
          bg-white dark:bg-[#1a1a1a] border-r border-foreground/10
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-14 sm:h-16 px-4 border-b border-foreground/10 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#1a1a1a]">
            {!isCollapsed && (
              <span className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                Tools
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 hover:bg-foreground/10 rounded transition-all"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-4 h-4 text-foreground/60 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 pt-6 px-3 pb-3 space-y-1 overflow-y-auto">
            {/* Tools Section */}
            {tools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-foreground text-background' 
                      : 'hover:bg-foreground/5 text-foreground/70 hover:text-foreground'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? tool.name : undefined}
                >
                  <div className="flex-shrink-0">
                    {tool.icon}
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm font-medium font-mono truncate">
                      {tool.name}
                    </span>
                  )}
                  {!isCollapsed && tool.badge && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono font-bold">
                      {tool.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Divider and Actions Section - Only show if actions exist */}
            {actions.length > 0 && (
              <>
                <div className="my-3 border-t border-foreground/10" />
                
                {/* Actions Section */}
                {actions.map((actionItem, idx) => {
              if (!actionItem.action) return null;
              return (
                <button
                  key={idx}
                  onClick={actionItem.action}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    hover:bg-foreground/5 text-foreground/70 hover:text-foreground
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? actionItem.name : undefined}
                >
                  <div className="flex-shrink-0 relative">
                    {actionItem.icon}
                    {actionItem.badge && actionItem.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {actionItem.badge > 9 ? '9+' : actionItem.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium font-mono truncate">
                        {actionItem.name}
                      </span>
                      {actionItem.badge && actionItem.badge > 0 && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono font-bold">
                          {actionItem.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
              </>
            )}
          </nav>

          {/* Footer - Home Link */}
          <div className="p-3 border-t border-foreground/10">
            <Link
              href="/"
              className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-foreground/5 text-foreground/70 hover:text-foreground"
              title="Home"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!isCollapsed && (
                <span className="text-sm font-medium font-mono">Home</span>
              )}
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

