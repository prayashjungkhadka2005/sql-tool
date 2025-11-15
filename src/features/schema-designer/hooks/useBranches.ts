import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SchemaState } from "../types";

const BRANCH_STORAGE_KEY = "schema-designer-branches-v1";

export interface SchemaBranchEntry {
  name: string;
  schema: SchemaState;
  createdAt: number;
  updatedAt: number;
  parent?: string;
}

export type SchemaBranchMap = Record<string, SchemaBranchEntry>;

interface UseBranchesOptions {
  initialSchema: SchemaState;
  schema: SchemaState;
  replaceSchema: (schema: SchemaState) => void;
  storageAvailable: boolean;
}

export function useBranches({
  initialSchema,
  schema,
  replaceSchema,
  storageAvailable,
}: UseBranchesOptions) {
  const [branches, setBranches] = useState<SchemaBranchMap>({});
  const [activeBranch, setActiveBranch] = useState("main");
  const [initialized, setInitialized] = useState(false);
  const branchSyncRef = useRef<string>("");
  const hasLoadedRef = useRef(false);

  const clampClone = useCallback((state: SchemaState) => JSON.parse(JSON.stringify(state)), []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const initializeDefault = () => {
      const now = Date.now();
      const entry: SchemaBranchEntry = {
        name: "main",
        schema: clampClone(initialSchema),
        createdAt: now,
        updatedAt: now,
      };
      setBranches({ main: entry });
      setActiveBranch("main");
      branchSyncRef.current = JSON.stringify(initialSchema);
      setInitialized(true);
    };

    if (!storageAvailable) {
      initializeDefault();
      return;
    }

    try {
      const stored = window.localStorage.getItem(BRANCH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { branches?: SchemaBranchMap; activeBranch?: string };
        if (parsed?.branches && Object.keys(parsed.branches).length > 0) {
          setBranches(parsed.branches);
          const fallback =
            parsed.activeBranch && parsed.branches[parsed.activeBranch]
              ? parsed.activeBranch
              : Object.keys(parsed.branches)[0];
          setActiveBranch(fallback);
          branchSyncRef.current = JSON.stringify(parsed.branches[fallback].schema);
          replaceSchema(clampClone(parsed.branches[fallback].schema));
          setInitialized(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to load branch data:", error);
    }

    initializeDefault();
  }, [initialSchema, replaceSchema, storageAvailable, clampClone]);

  useEffect(() => {
    if (!initialized) return;
    const signature = JSON.stringify(schema);
    if (branchSyncRef.current === signature) return;
    branchSyncRef.current = signature;
    setBranches(prev => {
      const existing = prev[activeBranch];
      const updatedEntry: SchemaBranchEntry = {
        name: activeBranch,
        schema: clampClone(schema),
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        parent: existing?.parent,
      };
      return { ...prev, [activeBranch]: updatedEntry };
    });
  }, [schema, activeBranch, initialized, clampClone]);

  useEffect(() => {
    if (!initialized) return;
    if (!branches[activeBranch] && Object.keys(branches).length > 0) {
      const fallback = branches.main ? "main" : Object.keys(branches)[0];
      if (!fallback) return;
      setActiveBranch(fallback);
      const target = branches[fallback]?.schema;
      if (target) {
        branchSyncRef.current = JSON.stringify(target);
        replaceSchema(clampClone(target));
      }
    }
  }, [branches, activeBranch, initialized, replaceSchema, clampClone]);

  useEffect(() => {
    if (!initialized || !storageAvailable) return;
    try {
      window.localStorage.setItem(
        BRANCH_STORAGE_KEY,
        JSON.stringify({ branches, activeBranch })
      );
    } catch (error) {
      console.warn("Failed to persist branch data:", error);
    }
  }, [branches, activeBranch, initialized, storageAvailable]);

  const branchNames = useMemo(() => {
    return Object.values(branches)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(entry => entry.name);
  }, [branches]);

  const branchList = useMemo(() => {
    return Object.values(branches).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [branches]);

  const createBranch = useCallback((rawName: string) => {
    const normalized = rawName.trim().replace(/\s+/g, '-');
    const name = normalized || `branch-${Object.keys(branches).length + 1}`;
    if (branches[name]) {
      throw new Error(`Branch "${name}" already exists.`);
    }
    const now = Date.now();
    const entry: SchemaBranchEntry = {
      name,
      schema: clampClone(schema),
      createdAt: now,
      updatedAt: now,
      parent: activeBranch,
    };
    setBranches(prev => ({ ...prev, [name]: entry }));
    setActiveBranch(name);
    branchSyncRef.current = JSON.stringify(entry.schema);
  }, [branches, schema, activeBranch, clampClone]);

  const switchBranch = useCallback((branchName: string) => {
    if (branchName === activeBranch) return;
    const target = branches[branchName];
    if (!target) return;
    setActiveBranch(branchName);
    branchSyncRef.current = JSON.stringify(target.schema);
    replaceSchema(clampClone(target.schema));
  }, [activeBranch, branches, replaceSchema, clampClone]);

  const deleteBranch = useCallback((branchName: string) => {
    if (branchName === 'main') {
      throw new Error('The main branch cannot be deleted.');
    }

    setBranches(prev => {
      const updated = { ...prev };
      delete updated[branchName];

      if (branchName === activeBranch) {
        const fallback = updated.main ? 'main' : Object.keys(updated)[0] || 'main';
        setActiveBranch(fallback);
        const fallbackSchema = updated[fallback]?.schema || schema;
        branchSyncRef.current = JSON.stringify(fallbackSchema);
        replaceSchema(clampClone(fallbackSchema));
      }

      return updated;
    });
  }, [activeBranch, schema, replaceSchema, clampClone]);

  return {
    initialized,
    branches,
    activeBranch,
    branchNames,
    branchList,
    createBranch,
    switchBranch,
    deleteBranch,
  };
}

