"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectSummary } from "@/types/projects";

interface ProjectsDrawerProps {
  isOpen: boolean;
  projects?: ProjectSummary[];
  isLoading: boolean;
  error?: string;
  activeProjectId: string | null;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  onCreate?: (payload: { name: string; description?: string | null }) => Promise<void>;
  isCreating?: boolean;
  onRetry?: () => void;
}

export default function ProjectsDrawer({
  isOpen,
  projects,
  isLoading,
  error,
  activeProjectId,
  onClose,
  onSelect,
  onCreate,
  isCreating = false,
  onRetry,
}: ProjectsDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreate) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setFormError("Project name must be at least 2 characters.");
      return;
    }
    setFormError(null);
    try {
      await onCreate({ name: trimmed, description: description.trim() || null });
      setName("");
      setDescription("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create project.");
    }
  };

  const renderProjects = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-2xl border border-foreground/10 bg-foreground/5 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-sm text-red-500 py-10 space-y-3">
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    if (!projects || projects.length === 0) {
      return (
        <div className="text-center text-sm text-foreground/50 py-10 font-mono">
          No projects yet. Create one to sync your schema.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {projects.map(project => {
          const isActive = project.id === activeProjectId;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className={`w-full text-left border rounded-2xl p-4 transition-all active:scale-[0.99] ${
                isActive
                  ? "border-primary/40 bg-primary/5 shadow-[0_8px_30px_rgba(37,99,235,0.15)]"
                  : "border-foreground/10 bg-white/90 dark:bg-[#0b0b0b]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{project.name}</div>
                  <div className="text-xs text-foreground/50 line-clamp-2">
                    {project.description || "No description provided."}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-foreground/50 font-mono mt-3">
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                <span>{project.members.length} member{project.members.length === 1 ? "" : "s"}</span>
                {project.schemaVersion !== undefined && (
                  <span>v{project.schemaVersion}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white dark:bg-[#050505] border-l border-foreground/10 shadow-2xl z-[91] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="px-5 py-4 border-b border-foreground/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50 font-mono">
                  Projects
                </div>
                <div className="text-lg font-semibold text-foreground">Cloud workspace</div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                aria-label="Close project drawer"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 border-b border-foreground/10">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="project-name" className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                    Project name
                  </label>
                  <input
                    id="project-name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="e.g., Messaging Platform"
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={isCreating}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-description" className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                    Description (optional)
                  </label>
                  <textarea
                    id="project-description"
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder="Short summary for collaborators"
                    className="mt-1 w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    rows={2}
                    disabled={isCreating}
                  />
                </div>
                {formError && (
                  <div className="text-sm text-red-500">{formError}</div>
                )}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating…" : "Create project"}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {renderProjects()}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}


