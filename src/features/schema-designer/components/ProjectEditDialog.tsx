"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProjectSummary } from "@/types/projects";

interface ProjectEditDialogProps {
  project: ProjectSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (projectId: string, payload: { name: string; description?: string | null }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProjectEditDialog({
  project,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ProjectEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setError(null);
    }
  }, [project]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !onSubmit) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Project name must be at least 2 characters.");
      return;
    }
    try {
      await onSubmit(project.id, { name: trimmed, description: description.trim() || null });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && project && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-[121] flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClose}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#050505] border border-foreground/10 shadow-2xl p-6 space-y-4"
              onClick={event => event.stopPropagation()}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
                  Edit project
                </p>
                <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                    Project name
                  </label>
                  <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g., Analytics Platform"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-foreground/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    rows={3}
                    placeholder="Optional summary visible to collaborators"
                    disabled={isSubmitting}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-foreground/15 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isSubmitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

