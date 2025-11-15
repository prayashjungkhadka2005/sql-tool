"use client";

import { ProjectSummary } from "@/types/projects";

interface ProjectListItemProps {
  project: ProjectSummary;
  isActive: boolean;
  onSelect: (projectId: string) => void;
  onEdit?: (project: ProjectSummary) => void;
  onDelete?: (project: ProjectSummary) => void;
  isMutating?: boolean;
  isDeleting?: boolean;
}

export function ProjectListItem({
  project,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  isMutating = false,
  isDeleting = false,
}: ProjectListItemProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(project.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project.id)}
      onKeyDown={handleKeyDown}
      className={`w-full text-left border rounded-2xl p-4 transition-all outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer ${
        isActive
          ? "border-primary/40 bg-primary/5 shadow-[0_8px_30px_rgba(37,99,235,0.15)]"
          : "border-foreground/10 bg-white/90 dark:bg-[#0b0b0b]"
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>{project.name}</span>
            {isMutating && (
              <span className="text-[10px] uppercase tracking-widest text-foreground/60">
                Saving…
              </span>
            )}
          </div>
          <div className="text-xs text-foreground/50 line-clamp-2">
            {project.description || "No description provided."}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
              Active
            </span>
          )}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                  aria-label={`Edit ${project.name}`}
                  disabled={isMutating || isDeleting}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    onDelete(project);
                  }}
                  className="p-1.5 rounded-full hover:bg-red-500/10 text-foreground/60 hover:text-red-500 transition-colors disabled:opacity-60"
                  aria-label={`Delete ${project.name}`}
                  disabled={isDeleting || isMutating}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-foreground/50 font-mono mt-3">
        <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
        <span>
          {project.members.length} member{project.members.length === 1 ? "" : "s"}
        </span>
        {project.schemaVersion !== undefined && <span>v{project.schemaVersion}</span>}
        {isDeleting && <span className="text-red-500">Deleting…</span>}
      </div>
    </div>
  );
}

