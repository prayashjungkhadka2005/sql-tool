"use client";

import { forwardRef } from "react";

interface NavbarTemplatesButtonProps {
  isOpen?: boolean;
  onToggle?: () => void;
  badge?: string | null;
}

const NavbarTemplatesButton = forwardRef<HTMLButtonElement, NavbarTemplatesButtonProps>(
  ({ isOpen = false, onToggle, badge }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={`px-2 py-1 text-xs sm:text-sm font-medium rounded transition-all flex items-center gap-1 active:scale-95 ${
          isOpen
            ? 'bg-foreground/10 text-foreground'
            : 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
        }`}
        title="Templates library"
        type="button"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 10h18M3 15h10M3 20h10" />
        </svg>
        <span className="hidden sm:inline">Templates</span>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

NavbarTemplatesButton.displayName = "NavbarTemplatesButton";

export default NavbarTemplatesButton;