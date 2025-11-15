"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SchemaTemplate } from "../types";
import { SCHEMA_TEMPLATES } from "../data/schema-templates";

interface TemplatesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SchemaTemplate) => void;
}

export default function TemplatesSidebar({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplatesSidebarProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SCHEMA_TEMPLATES;
    return SCHEMA_TEMPLATES.filter((template) => {
      const haystack = `${template.name} ${template.description} ${template.schema.tables.length} ${template.difficulty}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search]);

  const handleSelect = (template: SchemaTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.aside
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[520px] lg:w-[560px] bg-white dark:bg-[#0a0a0a] border-l border-foreground/10 shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground/50 font-mono">
                    Templates Library
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    Kickstart your schema
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                  aria-label="Close templates"
                >
                  <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 border-b border-foreground/10">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50 font-mono block mb-2">
                  Search templates
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 12.65z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-foreground/10 bg-white/80 dark:bg-[#141414]/80 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Payments, SaaS, Support, Messaging..."
                  />
                </div>
              </div>

              <div className="px-6 py-5 flex-1 overflow-y-auto space-y-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center text-sm text-foreground/50 py-10">
                    No templates match “{search}”.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className="group p-4 text-left rounded-xl border border-foreground/10 hover:border-primary/40 hover:shadow-lg bg-white/90 dark:bg-black/30 transition-all flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-foreground/10 bg-foreground/5 flex items-center justify-center text-foreground/60">
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-semibold text-foreground truncate">
                                {template.name}
                              </h4>
                              <span className="text-[10px] uppercase font-semibold tracking-wider text-foreground/50">
                                {template.schema.tables.length} tables
                              </span>
                            </div>
                            <p className="text-[11px] text-primary font-mono uppercase tracking-wider">
                              {template.difficulty}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
  );
}

