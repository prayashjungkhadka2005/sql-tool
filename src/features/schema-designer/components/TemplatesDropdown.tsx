/**
 * Templates Dropdown Component
 * Dropdown menu for selecting schema templates
 */

"use client";

import { useEffect, useRef } from 'react';
import { SchemaTemplate } from '../types';
import { SCHEMA_TEMPLATES } from '../data/schema-templates';

interface TemplatesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SchemaTemplate) => void;
  buttonRef?: React.RefObject<HTMLButtonElement> | null;
}

export default function TemplatesDropdown({
  isOpen,
  onClose,
  onSelectTemplate,
  buttonRef,
}: TemplatesDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  // Calculate position relative to button
  useEffect(() => {
    if (!isOpen || !buttonRef?.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownWidth = Math.min(900, viewportWidth - 32); // Wider dropdown, max 900px or viewport - padding
    const padding = 16; // Padding from viewport edges

    // Calculate horizontal position - align to button left, but ensure it doesn't go off screen
    let left = buttonRect.left;
    if (left + dropdownWidth + padding > viewportWidth) {
      // If dropdown would overflow right, align to right edge with padding
      left = viewportWidth - dropdownWidth - padding;
    }
    if (left < padding) {
      // If dropdown would overflow left, align to left edge with padding
      left = padding;
    }

    // Calculate vertical position - below button with spacing
    const top = buttonRect.bottom + 8;
    const maxHeight = viewportHeight - top - padding;
    
    // Position below the button, aligned to left (with smart alignment)
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.width = `${dropdownWidth}px`;
    dropdown.style.maxHeight = `${Math.min(maxHeight, 600)}px`;
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed z-50 bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg shadow-xl overflow-y-auto"
        role="menu"
        aria-label="Schema templates"
        style={{ maxHeight: '70vh' }}
      >
        <div className="p-4 border-b border-foreground/10 sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
              Schema Templates
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all"
              title="Close templates"
              aria-label="Close templates"
            >
              <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list">
            {SCHEMA_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="group p-4 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 active:scale-95 active:bg-foreground/10 rounded transition-all text-left"
                role="menuitem"
                aria-label={`Load ${template.name} template: ${template.description}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded border border-foreground/10 flex items-center justify-center text-foreground/60">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground font-mono truncate">
                      {template.name}
                    </h4>
                    <p className="text-[10px] text-foreground/40 font-mono">
                      {template.schema.tables.length} tables • {template.difficulty}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-foreground/60 font-mono leading-relaxed">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

