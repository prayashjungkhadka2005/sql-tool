"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/features/sql-builder/components/Navbar";
import Footer from "@/features/sql-builder/components/Footer";
import Sidebar from "@/features/sql-builder/components/Sidebar";
import CommandPalette from "@/features/sql-builder/components/CommandPalette";

interface ToolsLayoutProps {
  children: React.ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  const pathname = usePathname();
  const isSchemaDesigner = pathname === '/tools/schema-designer';
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // For schema-designer, let its own layout handle everything
  if (isSchemaDesigner) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Navbar */}
      <Navbar isSidebarCollapsed={isSidebarCollapsed} />

      {/* Sidebar */}
      <Sidebar 
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
                main.max-w-7xl,
                footer .max-w-7xl {
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

