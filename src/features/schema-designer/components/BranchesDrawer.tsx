"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SchemaBranchEntry } from "../hooks/useBranches";

interface BranchesDrawerProps {
  isOpen: boolean;
  branches: SchemaBranchEntry[];
  activeBranch: string;
  onClose: () => void;
  onSwitch?: (name: string) => void;
  onCreate?: () => void;
  onRename?: (name: string) => void;
  onDelete?: (name: string) => void;
}

export default function BranchesDrawer({
  isOpen,
  branches,
  activeBranch,
  onClose,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: BranchesDrawerProps) {
  const handleSwitch = (name: string) => {
    onClose();
    onSwitch?.(name);
  };

  const handleCreate = () => {
    onClose();
    onCreate?.();
  };

  const handleRename = (name: string) => {
    onClose();
    onRename?.(name);
  };

  const handleDelete = (name: string) => {
    onClose();
    onDelete?.(name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-[#0a0a0a] border-l border-foreground/10 shadow-2xl z-[81] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="px-5 py-4 border-bottom border-foreground/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground/50 font-mono">
                  Branches
                </div>
                <div className="text-lg font-semibold text-foreground">
                  Manage versions
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                aria-label="Close branch drawer"
              >
                <svg className="w-5 h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between">
              <div className="text-sm text-foreground/60">
                {branches.length} branch{branches.length === 1 ? '' : 'es'}
              </div>
              {onCreate && (
                <button
                  onClick={handleCreate}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-foreground text-white active:scale-95"
                >
                  New Branch
                </button>
              )}
            </div>

            <div className="px-5 py-4 flex-1 overflow-y-auto space-y-3">
              {branches.length === 0 ? (
                <div className="text-center text-sm text-foreground/50 py-16 font-mono">
                  No branches yet.
                </div>
              ) : (
                branches.map(branch => (
                  <div
                    key={branch.name}
                    className={`border rounded-xl p-3 flex flex-col gap-2 ${branch.name === activeBranch ? 'border-primary/30 bg-primary/5' : 'border-foreground/10 bg-white/90 dark:bg-black/20'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground font-mono">{branch.name}</span>
                        <span className="text-[11px] text-foreground/50 font-mono">
                          Updated {new Date(branch.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {onSwitch && branch.name !== activeBranch && (
                          <button
                            onClick={() => handleSwitch(branch.name)}
                            className="px-2 py-1 text-[11px] font-semibold uppercase rounded-lg border border-foreground/10 text-foreground/70 hover:border-foreground/30 active:scale-95"
                          >
                            Switch
                          </button>
                        )}
                        {onRename && (
                          <button
                            onClick={() => handleRename(branch.name)}
                            className="px-2 py-1 text-[11px] text-foreground/60 hover:text-foreground active:scale-95"
                          >
                            Rename
                          </button>
                        )}
                        {onDelete && branch.name !== 'main' && (
                          <button
                            onClick={() => handleDelete(branch.name)}
                            className="px-2 py-1 text-[11px] text-red-500 hover:text-red-600 active:scale-95"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

