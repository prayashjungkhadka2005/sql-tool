"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import BranchSwitcher from "./BranchSwitcher";
import NavbarTemplatesButton from "./NavbarTemplatesButton";
import NavbarDatabaseMenu from "./NavbarDatabaseMenu";

interface SchemaDesignerNavbarProps {
  onOpenBranchesSidebar?: () => void;
  onExport?: () => void;
  onNewTable?: () => void;
  onImport?: () => void;
  onConnectDatabase?: () => void;
  onRefreshDatabase?: () => void;
  onDisconnectDatabase?: () => void;
  onSyncDatabase?: () => void;
  onTemplates?: () => void;
  onMigrations?: () => void;
  onAutoLayout?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onShortcuts?: () => void;
  onReset?: () => void;
  onOpenActivityFeed?: () => void;
  activeBranch?: string;
  branchOptions?: string[];
  onBranchSelect?: (branch: string) => void;
  onBranchCreate?: () => void;
  onBranchDelete?: (branch: string) => void;
  
  // States
  canExport?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  hasTables?: boolean;
  hasMultipleTables?: boolean;
  isTemplatesOpen?: boolean;
  isDatabaseConnected?: boolean;
  isRefreshingDatabase?: boolean;
  dbStatus?: {
    label: string;
    status: "in-progress" | "success" | "error";
  } | null;
}

export interface SchemaDesignerNavbarRef {
  templatesButtonRef: React.RefObject<HTMLButtonElement>;
}

const SchemaDesignerNavbar = forwardRef<SchemaDesignerNavbarRef, SchemaDesignerNavbarProps>(({
  onExport,
  onNewTable,
  onImport,
  onConnectDatabase,
  onRefreshDatabase,
  onDisconnectDatabase,
  onSyncDatabase,
  onTemplates,
  onMigrations,
  onAutoLayout,
  onUndo,
  onRedo,
  onShortcuts,
  onReset,
  onOpenActivityFeed,
  onOpenBranchesSidebar,
  activeBranch,
  branchOptions,
  onBranchSelect,
  onBranchCreate,
  onBranchDelete,
  canExport = false,
  canUndo = false,
  canRedo = false,
  hasTables = false,
  hasMultipleTables = false,
  isTemplatesOpen = false,
  isDatabaseConnected = false,
  isRefreshingDatabase = false,
  dbStatus = null,
}, ref) => {
  const templatesButtonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    templatesButtonRef,
  }));

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-foreground/10">
      <div className="flex items-center h-12 sm:h-14 gap-2 px-2 sm:px-3">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded border border-foreground/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-foreground">
                  Schema Designer
                </h1>
                <p className="text-[10px] text-foreground/40 font-mono hidden sm:block">
                  Collaborative ERD Workspace
                </p>
              </div>
            </div>
          </Link>

          <BranchSwitcher
            activeBranch={activeBranch}
            branchOptions={branchOptions}
            onSelect={onBranchSelect}
            onCreate={onBranchCreate}
            onDelete={onBranchDelete}
          onOpenBranchesSidebar={onOpenBranchesSidebar}
          />

          {/* Toolbar Actions - Left Aligned */}
          <div className="flex items-center gap-1 flex-shrink-0 overflow-visible">
            {/* History */}
            <div className="flex items-center gap-0">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95"
                title={canUndo ? 'Undo (Cmd+Z)' : 'Nothing to undo'}
                aria-label="Undo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95"
                title={canRedo ? 'Redo (Cmd+Shift+Z)' : 'Nothing to redo'}
                aria-label="Redo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            <div className="w-px h-4 bg-foreground/10"></div>

            {/* Primary Actions */}
            <button
              onClick={onNewTable}
              className="px-2 py-1 text-xs sm:text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded transition-all flex items-center gap-1 font-mono active:scale-95"
              title="Create a new table (Cmd+T)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Table</span>
            </button>

            <div className="w-px h-4 bg-foreground/10"></div>

            <button
              onClick={onExport}
              disabled={!canExport}
              className="px-2 py-1 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={canExport ? 'Export schema (Cmd+E)' : 'Add tables to enable export'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onImport}
              className="px-2 py-1 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1 active:scale-95"
              title="Import schema (Cmd+I)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Import</span>
            </button>

            <NavbarDatabaseMenu
              isDatabaseConnected={isDatabaseConnected}
              isRefreshingDatabase={isRefreshingDatabase}
              onConnectDatabase={onConnectDatabase}
              onRefreshDatabase={onRefreshDatabase}
              onSyncDatabase={onSyncDatabase}
              onDisconnectDatabase={onDisconnectDatabase}
              onOpenActivity={onOpenActivityFeed}
            />

            {dbStatus && (
              <button
                onClick={onOpenActivityFeed}
                className="px-2 py-1 text-[11px] font-medium rounded-full border border-foreground/10 bg-foreground/5 text-foreground/70 flex items-center gap-2 active:scale-95 transition-all hover:border-foreground/20"
                type="button"
              >
                {dbStatus.status === 'in-progress' ? (
                  <svg className="w-3.5 h-3.5 text-foreground/60 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 8v4m8-8h4M4 12H0m15.535-6.535l2.828 2.828M5.636 18.364l-2.828 2.828M18.364 18.364l2.828 2.828M5.636 5.636L2.808 2.808" />
                  </svg>
                ) : dbStatus.status === 'success' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-mono truncate max-w-[150px]">
                  {dbStatus.label}
                </span>
              </button>
            )}

            <NavbarTemplatesButton
              ref={templatesButtonRef}
              isOpen={isTemplatesOpen}
              onToggle={onTemplates}
            />

            {onMigrations && (
            <button
              onClick={onMigrations}
              className="px-2 py-1 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1 active:scale-95"
              title="Version history & migrations (Cmd+M)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="hidden sm:inline">Migrations</span>
            </button>
            )}

            {hasMultipleTables && onAutoLayout && (
              <button
                onClick={onAutoLayout}
                className="px-2 py-1 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded transition-all flex items-center gap-1 active:scale-95"
                title="Auto-arrange tables (Cmd+L)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                </svg>
                <span className="hidden sm:inline">Auto Layout</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <button
              onClick={onShortcuts}
              className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded transition-all active:scale-95"
              title="Keyboard shortcuts (?)"
              aria-label="Show keyboard shortcuts"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {hasTables && onReset && (
              <button
                onClick={onReset}
                className="p-1.5 text-foreground/60 hover:text-red-600 hover:bg-red-500/10 rounded transition-all active:scale-95"
                title="Reset schema (Cmd+Shift+R)"
                aria-label="Reset schema"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
      </div>
    </nav>
  );
});

SchemaDesignerNavbar.displayName = "SchemaDesignerNavbar";

export default SchemaDesignerNavbar;

