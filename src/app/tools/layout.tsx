"use client";

import { useState, useEffect } from "react";
import Navbar from "@/features/sql-builder/components/Navbar";
import Footer from "@/features/sql-builder/components/Footer";
import Sidebar from "@/features/sql-builder/components/Sidebar";
import CommandPalette from "@/features/sql-builder/components/CommandPalette";
import QueryHistory from "@/features/sql-builder/components/QueryHistory";

interface ToolsLayoutProps {
  children: React.ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  const [historyCount, setHistoryCount] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Update history count on mount and periodically
  useEffect(() => {
    const updateCount = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('sql-builder-history');
          if (stored) {
            const parsed = JSON.parse(stored);
            setHistoryCount(Array.isArray(parsed) ? parsed.length : 0);
          }
        } catch {
          setHistoryCount(0);
        }
      }
    };

    updateCount();
    
    // Listen for storage events (when history changes in same tab)
    window.addEventListener('storage', updateCount);
    
    // Poll every 2 seconds as fallback
    const interval = setInterval(updateCount, 2000);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Navbar */}
      <Navbar isSidebarCollapsed={isSidebarCollapsed} />

      {/* Sidebar */}
      <Sidebar 
        historyCount={historyCount}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none -z-10" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Main Content Container - With sidebar offset and top padding for navbar */}
      <div 
        className={`transition-all duration-200 ease-in-out pt-8 ${
          isSidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[240px]'
        }`}
      >
        {isSidebarCollapsed && (
          <style dangerouslySetInnerHTML={{
            __html: `
              @media (min-width: 1024px) {
                main.max-w-7xl {
                  max-width: 90rem !important;
                }
              }
            `
          }} />
        )}
        {children}
        
        {/* Footer */}
        <Footer />
      </div>

      {/* Query History Panel */}
      <QueryHistory 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadQuery={(item) => {
          // This will be handled by individual pages
          setIsHistoryOpen(false);
        }}
        onHistoryChange={(count) => setHistoryCount(count)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

