/**
 * Context Menu Component
 * 
 * Right-click menu for quick actions on tables.
 * Inspired by Figma, Linear, and VSCode.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  separator?: boolean;
  action: () => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter out separators for keyboard navigation
  const navigableItems = items.filter(item => !item.separator && !item.disabled);

  // Reset selected index when menu opens or items change
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      buttonRefs.current = [];
    }
  }, [isOpen, items]);

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && navigableItems.length > 0) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (buttonRefs.current[0]) {
          buttonRefs.current[0].focus();
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, navigableItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || navigableItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop propagation to prevent conflicts
      if (['Escape', 'ArrowDown', 'ArrowUp', 'Enter', 'Home', 'End'].includes(e.key)) {
        e.stopPropagation();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % navigableItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + navigableItems.length) % navigableItems.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSelectedIndex(navigableItems.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = navigableItems[selectedIndex];
        if (item) {
          item.action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigableItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && buttonRefs.current[selectedIndex]) {
      buttonRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      buttonRefs.current[selectedIndex]?.focus();
    }
  }, [selectedIndex, isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on scroll (menu position becomes stale)
    const handleScroll = () => {
      onClose();
    };

    // Close on window resize (menu position becomes stale)
    const handleResize = () => {
      onClose();
    };

    // Delay to prevent immediate close from the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Capture phase
      window.addEventListener('resize', handleResize);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose]);

  // Adjust position if menu goes off-screen
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    // Use requestAnimationFrame to ensure DOM has rendered
    const rafId = requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust if overflowing right
      if (rect.right > viewportWidth) {
        adjustedX = Math.max(8, viewportWidth - rect.width - 8);
      }

      // Adjust if overflowing bottom
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(8, viewportHeight - rect.height - 8);
      }

      // Adjust if overflowing left
      if (adjustedX < 8) {
        adjustedX = 8;
      }

      // Adjust if overflowing top
      if (adjustedY < 8) {
        adjustedY = 8;
      }

      // Only update if position changed (prevent unnecessary reflows)
      if (adjustedX !== position.x || adjustedY !== position.y) {
        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;
      }
    });

    return () => cancelAnimationFrame(rafId); // Cleanup RAF
  }, [isOpen, position]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[300] min-w-[200px] bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
          }}
          role="menu"
          aria-label="Table context menu"
        >
        <div className="py-1">
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={`separator-${index}`}
                  className="my-1 h-px bg-foreground/10"
                />
              );
            }

            // Find index in navigable items for keyboard selection
            const navigableIndex = navigableItems.findIndex(navItem => navItem.id === item.id);
            const isSelected = navigableIndex === selectedIndex && !item.disabled;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (navigableIndex >= 0) {
                    buttonRefs.current[navigableIndex] = el;
                  }
                }}
                onClick={() => {
                  if (!item.disabled) {
                    item.action();
                    onClose();
                  }
                }}
                onMouseEnter={() => {
                  if (!item.disabled && navigableIndex >= 0) {
                    setSelectedIndex(navigableIndex);
                  }
                }}
                disabled={item.disabled}
                role="menuitem"
                aria-label={item.label}
                tabIndex={item.disabled ? -1 : 0}
                className={`w-full px-3 py-2 flex items-center justify-between gap-3 text-left transition-colors active:scale-95 focus:outline-none ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : isSelected
                    ? item.variant === 'danger'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-primary/10 text-primary'
                    : item.variant === 'danger'
                    ? 'hover:bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'hover:bg-foreground/5 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {item.icon && (
                    <span className="flex-shrink-0 w-4 h-4">
                      {item.icon}
                    </span>
                  )}
                  <span className="text-sm font-mono font-medium truncate">
                    {item.label}
                  </span>
                </div>

                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-foreground/40 bg-foreground/5 border border-foreground/10 rounded flex-shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

