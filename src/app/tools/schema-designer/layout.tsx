"use client";

interface SchemaDesignerLayoutProps {
  children: React.ReactNode;
}

export default function SchemaDesignerLayout({ children }: SchemaDesignerLayoutProps) {
  return (
    <div className="h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none -z-10" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Main Content - Full Height, No Sidebar/Footer */}
      <div className="flex-1 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}

