/**
 * Schema Designer Page
 * Visual database design tool with ERD diagram
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useSession, signOut } from 'next-auth/react';
import { ReactFlowProvider } from 'reactflow';
import { AnimatePresence } from 'framer-motion';
import { SchemaState, SchemaTable, SchemaColumn, SchemaTemplate, SchemaIndex } from '@/features/schema-designer/types';
import SchemaCanvas from '@/features/schema-designer/components/SchemaCanvas';
import ColumnEditor from '@/features/schema-designer/components/ColumnEditor';
import ExportModal from '@/features/schema-designer/components/ExportModal';
import ImportModal from '@/features/schema-designer/components/ImportModal';
import { MigrationModal } from '@/features/schema-designer/components/MigrationModal';
import IndexManager from '@/features/schema-designer/components/IndexManager';
import ContextMenu, { ContextMenuItem } from '@/features/schema-designer/components/ContextMenu';
import { SCHEMA_TEMPLATES } from '@/features/schema-designer/data/schema-templates';
import { autoLayoutTables, LayoutAlgorithm } from '@/features/schema-designer/utils/auto-layout';
import { exportCanvasAsImage, getSuggestedFilename } from '@/features/schema-designer/utils/image-export';
import { saveSchema, loadSchema, clearSchema, getLastSaved, formatTimestamp, isStorageAvailable } from '@/features/schema-designer/utils/schema-storage';
import { compareSchemas, SchemaDiff } from '@/features/schema-designer/utils/schema-comparator';
import { useSchemaHistory } from '@/features/schema-designer/hooks/useSchemaHistory';
import { useBranches } from '@/features/schema-designer/hooks/useBranches';
import { ProjectSummary } from '@/types/projects';
import ConfirmDialog from '@/features/sql-builder/components/ui/ConfirmDialog';
import InputDialog from '@/features/sql-builder/components/ui/InputDialog';
import SchemaDesignerNavbar, { SchemaDesignerNavbarRef } from '@/features/schema-designer/components/SchemaDesignerNavbar';
import DatabaseRefreshModal from '@/features/schema-designer/components/DatabaseRefreshModal';
import TemplatesSidebar from '@/features/schema-designer/components/TemplatesSidebar';
import DatabaseConnectionModal from '@/features/schema-designer/components/DatabaseConnectionModal';
import DatabaseSyncModal from '@/features/schema-designer/components/DatabaseSyncModal';
import DatabaseActivityFeed, { DatabaseActivityEvent } from '@/features/schema-designer/components/DatabaseActivityFeed';
import BranchesDrawer from '@/features/schema-designer/components/BranchesDrawer';
import LoginModal from '@/features/schema-designer/components/LoginModal';
import ProjectsDrawer from '@/features/schema-designer/components/ProjectsDrawer';
import Toast from '@/features/sql-builder/components/ui/Toast';
import { useToast } from '@/features/sql-builder/hooks/useToast';

const EMPTY_SCHEMA: SchemaState = {
  name: 'My Database',
  tables: [],
  relationships: [],
};

interface ProjectsResponse {
  projects: ProjectSummary[];
}

interface ProjectDetailResponse {
  project: ProjectSummary;
}

const apiFetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorData = await response.json();
      message = errorData.error ?? message;
    } catch (error) {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
};

export default function SchemaDesignerPage() {
  // Schema state with undo/redo support
  const {
    schema,
    setSchema,
    setSchemaDebounced,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    replaceSchema,
    lastActionName,
  } = useSchemaHistory(EMPTY_SCHEMA);
  const { toast, showToast, hideToast } = useToast();

  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{
    table: SchemaTable;
    column: SchemaColumn | null;
    initialValues?: Partial<SchemaColumn>;
  } | null>(null);

  const [isIndexManagerOpen, setIsIndexManagerOpen] = useState(false);
  const [managingIndexTable, setManagingIndexTable] = useState<SchemaTable | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
const [isDatabaseConnectionOpen, setIsDatabaseConnectionOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
const [dbActivityEvents, setDbActivityEvents] = useState<DatabaseActivityEvent[]>([]);
const syncActivityIdRef = useRef<string | null>(null);
  const connectionActivityIdRef = useRef<string | null>(null);
  const [isBranchesDrawerOpen, setIsBranchesDrawerOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [isProjectsDrawerOpen, setIsProjectsDrawerOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const lastLoadedProjectVersionRef = useRef<string | null>(null);
  const [projectMutationState, setProjectMutationState] = useState<{
    editingId: string | null;
    deletingId: string | null;
  }>({ editingId: null, deletingId: null });
  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  
  const storageAvailable = isStorageAvailable();
  const {
    initialized: branchesInitialized,
    activeBranch,
    branchNames,
    branchList,
    createBranch,
    switchBranch,
    deleteBranch,
  } = useBranches({
    initialSchema: EMPTY_SCHEMA,
    schema,
    replaceSchema,
    storageAvailable,
    storageKey: activeProjectId ?? null,
  });

  const { data: session, status: sessionStatus } = useSession();
  const isSessionLoading = sessionStatus === 'loading';
  const isAuthenticated = sessionStatus === 'authenticated';
  const sessionUserLabel = session?.user?.email ?? session?.user?.name ?? null;
  const {
    data: projectsData,
    error: projectsError,
    isLoading: isProjectsLoading,
    mutate: mutateProjects,
  } = useSWR<ProjectsResponse>(isAuthenticated ? '/api/projects' : null, apiFetcher);

  const {
    data: projectDetailData,
    error: projectDetailError,
    isLoading: isProjectDetailLoading,
    mutate: mutateProjectDetail,
  } = useSWR<ProjectDetailResponse>(
    isAuthenticated && activeProjectId ? `/api/projects/${activeProjectId}` : null,
    apiFetcher
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const hasProjects = Boolean(projectsData?.projects && projectsData.projects.length > 0);

  const ensureProjectContext = useCallback(() => {
    if (activeProjectId) {
      return true;
    }
    setAlertDialog({
      isOpen: true,
      title: hasProjects ? 'Select a project' : 'Create a project',
      message: hasProjects
        ? 'Create or select a project to sync your schema.'
        : 'Create a project to start syncing your schema.',
    });
    setIsProjectsDrawerOpen(true);
    return false;
  }, [activeProjectId, hasProjects, setAlertDialog, setIsProjectsDrawerOpen]);

  const pendingAuthActionRef = useRef<(() => void) | null>(null);

  const openLoginModal = useCallback(() => {
    pendingAuthActionRef.current = null;
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    pendingAuthActionRef.current = null;
    setIsLoginModalOpen(false);
  }, []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (!action) return;
      if (isAuthenticated) {
        action();
      } else {
        pendingAuthActionRef.current = action;
        setIsLoginModalOpen(true);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      if (pendingAuthActionRef.current) {
        pendingAuthActionRef.current();
        pendingAuthActionRef.current = null;
      }
      setIsLoginModalOpen(false);
    }
  }, [isAuthenticated]);

  const handleOpenProjectPanel = useCallback(() => {
    requireAuth(() => setIsProjectsDrawerOpen(true));
  }, [requireAuth]);

  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setIsProjectsDrawerOpen(false);
    setActiveProject(null);
    lastLoadedProjectVersionRef.current = null;
    lastSavedSnapshotRef.current = null;
    setHasUnsavedChanges(true);
  }, []);

  const handleCreateProject = useCallback(
    async ({ name, description }: { name: string; description?: string | null }) => {
      if (!isAuthenticated) {
        throw new Error('Sign in to create projects.');
      }
      setIsCreatingProject(true);
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.project) {
          throw new Error(payload?.error ?? 'Failed to create project');
        }
        await mutateProjects();
        setActiveProjectId(payload.project.id);
        setIsProjectsDrawerOpen(false);
        lastLoadedProjectVersionRef.current = null;
        lastSavedSnapshotRef.current = null;
        setHasUnsavedChanges(true);
        showToast('Project created successfully.', 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create project.';
        throw new Error(message);
      } finally {
        setIsCreatingProject(false);
      }
    },
    [isAuthenticated, mutateProjects]
  );

  const handleUpdateProjectMetadata = useCallback(
    async (projectId: string, payload: { name: string; description?: string | null }) => {
      if (!isAuthenticated) {
        throw new Error("Sign in to manage projects.");
      }
      setProjectMutationState(prev => ({ ...prev, editingId: projectId }));
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error ?? "Failed to update project.");
        }
        await mutateProjects();
        await mutateProjectDetail();
        if (activeProjectId === projectId) {
          setActiveProject(prev => (prev ? { ...prev, ...payload } : prev));
        }
        showToast('Project updated successfully.', 'success');
      } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to update project.");
      } finally {
        setProjectMutationState(prev => ({ ...prev, editingId: null }));
      }
    },
    [isAuthenticated, mutateProjects, mutateProjectDetail, activeProjectId]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!isAuthenticated) {
        throw new Error("Sign in to manage projects.");
      }
      setProjectMutationState(prev => ({ ...prev, deletingId: projectId }));
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error ?? "Failed to delete project.");
        }
        if (projectId === activeProjectId) {
          setActiveProjectId(null);
          setActiveProject(null);
          lastLoadedProjectVersionRef.current = null;
          lastSavedSnapshotRef.current = null;
        }
        await mutateProjects();
        await mutateProjectDetail();
        showToast('Project deleted successfully.', 'success');
        setIsProjectsDrawerOpen(false);
      } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to delete project.");
      } finally {
        setProjectMutationState(prev => ({ ...prev, deletingId: null }));
      }
    },
    [isAuthenticated, activeProjectId, mutateProjects, mutateProjectDetail]
  );

  const saveProject = useCallback(async () => {
    if (!activeProjectId) return;
    setIsSavingProject(true);
    try {
      const response = await fetch(`/api/projects/${activeProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSchema: schema }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to save project');
      }
      lastSavedSnapshotRef.current = JSON.stringify(schema);
      setHasUnsavedChanges(false);
      setLastSavedTime(Date.now());
      mutateProjectDetail();
      mutateProjects();
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        title: 'Save failed',
        message: error instanceof Error ? error.message : 'Failed to save project.',
      });
    } finally {
      setIsSavingProject(false);
    }
  }, [
    activeProjectId,
    schema,
    mutateProjectDetail,
    mutateProjects,
    setAlertDialog,
  ]);

  const handleSaveProject = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    requireAuth(() => {
      void saveProject();
    });
  }, [ensureProjectContext, requireAuth, saveProject]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedId = window.localStorage.getItem('schemaDesigner:activeProjectId');
    if (storedId) {
      setActiveProjectId(storedId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeProjectId) {
      window.localStorage.setItem('schemaDesigner:activeProjectId', activeProjectId);
    } else {
      window.localStorage.removeItem('schemaDesigner:activeProjectId');
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      setActiveProjectId(null);
      setActiveProject(null);
    }
  }, [sessionStatus]);
  
  // Store original database schema and connection info for sync
  const [databaseConnection, setDatabaseConnection] = useState<{
    originalSchema: SchemaState;
    connectionConfig: {
      type: 'postgresql' | 'mysql' | 'sqlite';
      host?: string;
      port?: number;
      database?: string;
      username?: string;
      password?: string;
      connectionString?: string;
    };
  } | null>(null);
  const [isOptimizingFKs, setIsOptimizingFKs] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLElement | null>(null);
  const handleCanvasRef = useCallback((node: HTMLElement | null) => {
    setCanvasRef(prev => (prev === node ? prev : node));
  }, []);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [autoLayoutTrigger, setAutoLayoutTrigger] = useState(0);
  const navbarRef = useRef<SchemaDesignerNavbarRef>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    tableId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    tableId: null,
  });
  
  // LocalStorage persistence state
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [isStorageEnabled, setIsStorageEnabled] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: "danger" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

const [isRefreshingDatabase, setIsRefreshingDatabase] = useState(false);
const [refreshDiff, setRefreshDiff] = useState<SchemaDiff | null>(null);
const [refreshRemoteSchema, setRefreshRemoteSchema] = useState<SchemaState | null>(null);

  const createActivityId = useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const startDbActivity = useCallback(
    (type: DatabaseActivityEvent['type'], message: string, options?: { openFeed?: boolean }) => {
      const event: DatabaseActivityEvent = {
        id: createActivityId(),
        type,
        status: 'in-progress',
        message,
        timestamp: Date.now(),
      };
      setDbActivityEvents(prev => [...prev, event]);
      if (options?.openFeed) {
        setIsActivityFeedOpen(true);
      }
      return event.id;
    },
    [createActivityId]
  );

  const updateDbActivity = useCallback(
    (id: string, status: 'progress' | 'success' | 'error', message?: string) => {
      setDbActivityEvents(prev =>
        prev.map(event =>
          event.id === id
            ? {
                ...event,
                status: status === 'progress' ? event.status : status,
                message: message ?? event.message,
                timestamp: Date.now(),
              }
            : event
        )
      );
    },
    []
  );

  const latestDbActivity = useMemo(() => {
    for (let i = dbActivityEvents.length - 1; i >= 0; i--) {
      if (dbActivityEvents[i].status === 'in-progress') {
        return dbActivityEvents[i];
      }
    }
    return null;
  }, [dbActivityEvents]);

  // LOCALSTORAGE PERSISTENCE
  // Restore schema from localStorage on mount
  useEffect(() => {
    // Check if storage is available
    if (!isStorageAvailable()) {
      setIsStorageEnabled(false);
      console.warn('LocalStorage not available - auto-save disabled');
      return;
    }
    
    // Try to load saved schema
    const savedSchema = loadSchema();
    
    if (savedSchema) {
      replaceSchema(savedSchema); // Use replaceSchema to avoid adding to history
      setLastSavedTime(getLastSaved());
      console.log('✅ Schema restored from localStorage');
    }
  }, [replaceSchema]); // Run only on mount
  
  // Auto-save schema to localStorage (debounced)
  useEffect(() => {
    if (!isStorageEnabled) return;
    
    // Skip auto-save for empty schema on initial mount
    if (schema.tables.length === 0 && !lastSavedTime) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveSchema(schema, true);
      if (success) {
        setLastSavedTime(Date.now());
      }
    }, 2000);
    
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [schema, isStorageEnabled, lastSavedTime]);
  
  // Update "saved time" display every minute
  useEffect(() => {
    if (!lastSavedTime) return;
    
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSavedTime(prev => prev);
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  useEffect(() => {
    const project = projectDetailData?.project;
    if (!project) return;
    setActiveProject(project);
    const versionKey = `${project.id}:${project.schemaVersion ?? project.updatedAt}`;
    if (lastLoadedProjectVersionRef.current === versionKey) {
      return;
    }
    if (project.currentSchema) {
      replaceSchema(project.currentSchema);
      setSchemaDebounced(project.currentSchema);
      clearHistory();
      lastSavedSnapshotRef.current = JSON.stringify(project.currentSchema);
      setHasUnsavedChanges(false);
    } else {
      lastSavedSnapshotRef.current = null;
      setHasUnsavedChanges(true);
    }
    if (project.updatedAt) {
      setLastSavedTime(new Date(project.updatedAt).getTime());
    }
    lastLoadedProjectVersionRef.current = versionKey;
  }, [
    projectDetailData,
    replaceSchema,
    setSchemaDebounced,
    clearHistory,
    setLastSavedTime,
  ]);

  useEffect(() => {
    if (!activeProjectId) {
      setHasUnsavedChanges(false);
      return;
    }
    if (!lastSavedSnapshotRef.current) {
      setHasUnsavedChanges(true);
      return;
    }
    const snapshot = JSON.stringify(schema);
    setHasUnsavedChanges(snapshot !== lastSavedSnapshotRef.current);
  }, [schema, activeProjectId, setHasUnsavedChanges]);

  useEffect(() => {
    if (!projectDetailError || !activeProjectId) return;
    setAlertDialog({
      isOpen: true,
      title: 'Unable to load project',
      message:
        projectDetailError instanceof Error
          ? projectDetailError.message
          : 'Failed to load project details.',
    });
    setActiveProjectId(null);
    setActiveProject(null);
  }, [projectDetailError, activeProjectId, setAlertDialog]);

  // Add new table
  const handleAddTable = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    // Find unique table name
    let tableName = `table_${schema.tables.length + 1}`;
    let counter = schema.tables.length + 1;
    while (schema.tables.some(t => t.name === tableName)) {
      counter++;
      tableName = `table_${counter}`;
    }

    // Generate unique IDs to prevent collision
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);

    const newTable: SchemaTable = {
      id: `table-${timestamp}-${random}`,
      name: tableName,
      columns: [
        {
          id: `col-${timestamp}-${random}`,
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          unique: false,
          primaryKey: true,
          autoIncrement: true,
        },
      ],
      indexes: [], // Initialize empty indexes array
      position: { 
        x: 100 + ((schema.tables.length % 10) * 50),  // Wrap at 10 to prevent overflow
        y: 100 + (Math.floor(schema.tables.length / 10) * 150) 
      },
    };

    setSchema(prev => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }), 'Add table');
  }, [schema.tables, setSchema, ensureProjectContext]);

  // Edit table name
  const handleEditTable = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setInputDialog({
      isOpen: true,
      title: 'Rename Table',
      message: 'Enter new table name:',
      defaultValue: table.name,
      onConfirm: (newName: string) => {
        // Validate: empty name
        if (!newName || newName.trim() === '') {
          setAlertDialog({
            isOpen: true,
            title: 'Empty Table Name',
            message: 'Table name cannot be empty.',
          });
          return;
        }

        const trimmedName = newName.trim();

        // Validate: no duplicates
        if (schema.tables.some(t => t.id !== tableId && t.name.toLowerCase() === trimmedName.toLowerCase())) {
          setAlertDialog({
            isOpen: true,
            title: 'Duplicate Table Name',
            message: `Table "${trimmedName}" already exists. Choose a different name.`,
          });
          return;
        }

        // Validate: SQL reserved keywords
        const SQL_RESERVED = ['table', 'select', 'from', 'where', 'join', 'inner', 'outer', 'left', 'right', 'order', 'group', 'having', 'limit', 'offset', 'insert', 'update', 'delete', 'create', 'drop', 'alter', 'index', 'view', 'user', 'database', 'schema'];
        if (SQL_RESERVED.includes(trimmedName.toLowerCase())) {
          setAlertDialog({
            isOpen: true,
            title: 'Reserved Keyword',
            message: `"${trimmedName}" is a SQL reserved keyword. Use a different name like "${trimmedName}_table".`,
          });
          return;
        }

        // Validate: proper naming
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
          setAlertDialog({
            isOpen: true,
            title: 'Invalid Table Name',
            message: 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores.',
          });
          return;
        }

        // Validate: max length (for UI and DB compatibility)
        if (trimmedName.length > 64) {
          setAlertDialog({
            isOpen: true,
            title: 'Table Name Too Long',
            message: 'Table name must be 64 characters or less.',
          });
          return;
        }

        // Update table name AND all foreign key references
        const oldName = table.name;
        const newNameLower = trimmedName.toLowerCase();
        
        const updatedTables = schema.tables.map(t => {
          if (t.id === tableId) {
            // Rename this table
            return { ...t, name: newNameLower };
          } else {
            // Update FK references in other tables
            const updatedColumns = t.columns.map(col => {
              if (col.references && col.references.table === oldName) {
                return {
                  ...col,
                  references: {
                    ...col.references,
                    table: newNameLower, // Update FK reference!
                  },
                };
              }
              return col;
            });
          return { ...t, columns: updatedColumns };
        }
      });

        setSchema({
          ...schema,
          tables: updatedTables,
          // relationships are auto-generated from FK columns, no manual update needed
        });

        setInputDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema, setSchema]);

  const handleRefreshDatabase = useCallback(async () => {
    if (!databaseConnection) {
      setAlertDialog({
        isOpen: true,
        title: 'No Database Connection',
        message: 'Connect to a database before pulling remote changes.',
      });
      return;
    }

    setIsRefreshingDatabase(true);
    const activityId = startDbActivity('pull', 'Pulling latest schema from database…', { openFeed: true });

    try {
      const connectionConfig = databaseConnection.connectionConfig;
      const requestBody: any = {
        type: connectionConfig.type,
        host: connectionConfig.host || '',
        port: connectionConfig.port || (connectionConfig.type === 'postgresql' ? 5432 : 3306),
        database: connectionConfig.database || '',
        username: connectionConfig.username || '',
        password: connectionConfig.password || '',
      };

      if (connectionConfig.connectionString) {
        requestBody.connectionString = connectionConfig.connectionString;
      }

      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to pull schema from database');
      }

      if (!data.schema) {
        throw new Error('No schema data returned from database');
      }

      const remoteSchema: SchemaState = data.schema;
      const diff = compareSchemas(schema, remoteSchema);

      if (!diff.hasChanges) {
        setAlertDialog({
          isOpen: true,
          title: 'Already Up to Date',
          message: 'The live database already matches your current design.',
        });
        updateDbActivity(activityId, 'success', 'Schema already up to date.');
        return;
      }

      setRefreshDiff(diff);
      setRefreshRemoteSchema(remoteSchema);
      setIsRefreshModalOpen(true);
      updateDbActivity(activityId, 'success', 'Pulled latest schema from database.');
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Refresh Failed',
        message: error.message || 'Unable to pull the latest schema. Please try again.',
      });
      updateDbActivity(activityId, 'error', error.message || 'Failed to pull latest schema.');
    } finally {
      setIsRefreshingDatabase(false);
    }
  }, [databaseConnection, schema, setAlertDialog, startDbActivity, updateDbActivity]);

  const handleApplyRemoteSchema = useCallback(() => {
    if (!refreshRemoteSchema) return;
    replaceSchema(refreshRemoteSchema);
    setDatabaseConnection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        originalSchema: JSON.parse(JSON.stringify(refreshRemoteSchema)),
      };
    });
    setIsRefreshModalOpen(false);
    setRefreshDiff(null);
    setRefreshRemoteSchema(null);
    setAlertDialog({
      isOpen: true,
      title: 'Schema Updated',
      message: 'Your canvas now matches the live database schema.',
    });
  }, [refreshRemoteSchema, replaceSchema, setAlertDialog, setDatabaseConnection]);

  const handleCloseRefreshModal = useCallback(() => {
    setIsRefreshModalOpen(false);
    setRefreshDiff(null);
    setRefreshRemoteSchema(null);
  }, []);

  const handleSyncStatusChange = useCallback(
    (status: 'start' | 'success' | 'error', message?: string) => {
      if (status === 'start') {
        syncActivityIdRef.current = startDbActivity('push', message ?? 'Pushing local changes to database…', {
          openFeed: true,
        });
        return;
      }

      if (syncActivityIdRef.current) {
        updateDbActivity(
          syncActivityIdRef.current,
          status === 'success' ? 'success' : 'error',
          message ?? (status === 'success' ? 'Database synced successfully.' : 'Database sync failed.')
        );
        syncActivityIdRef.current = null;
      }
    },
    [startDbActivity, updateDbActivity]
  );

  const handleConnectionActivity = useCallback(
    (phase: 'start' | 'progress' | 'success' | 'error', message: string) => {
      if (phase === 'start') {
        connectionActivityIdRef.current = startDbActivity('connect', message, { openFeed: true });
        return;
      }
      if (!connectionActivityIdRef.current) return;
      if (phase === 'progress') {
        updateDbActivity(connectionActivityIdRef.current, 'progress', message);
        return;
      }
      updateDbActivity(
        connectionActivityIdRef.current,
        phase === 'success' ? 'success' : 'error',
        message
      );
      connectionActivityIdRef.current = null;
    },
    [startDbActivity, updateDbActivity]
  );

  // Add column to table
  const handleAddColumn = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setEditingColumn({
      table,
      column: null, // null = adding new column
    });
    setIsColumnEditorOpen(true);
  }, [schema.tables]);

  // Edit specific column
  const handleEditColumn = useCallback((tableId: string, columnId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    const column = table.columns.find(c => c.id === columnId);
    if (!column) return;

    setEditingColumn({
      table,
      column,
    });
    setIsColumnEditorOpen(true);
  }, [schema.tables]);

  // Manage indexes for a table
  const handleManageIndexes = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    setManagingIndexTable(table);
    setIsIndexManagerOpen(true);
  }, [schema.tables]);

  const handleManualConnection = useCallback(
    (sourceTableId: string, targetTableId: string) => {
      if (sourceTableId === targetTableId) {
        setAlertDialog({
          isOpen: true,
          title: 'Select Different Tables',
          message: 'Connect two different tables to define a relationship.',
        });
        return;
      }

      const sourceTable = schema.tables.find(t => t.id === sourceTableId);
      const targetTable = schema.tables.find(t => t.id === targetTableId);

      if (!sourceTable || !targetTable) return;

      if (!sourceTable.columns.length) {
        setAlertDialog({
          isOpen: true,
          title: 'No Columns to Reference',
          message: `Table "${sourceTable.name}" has no columns yet. Add a primary key column before creating relationships.`,
        });
        return;
      }

      const sourcePk =
        sourceTable.columns.find(col => col.primaryKey) ?? sourceTable.columns[0];

      if (!sourcePk) {
        setAlertDialog({
          isOpen: true,
          title: 'Missing Primary Key',
          message: `Table "${sourceTable.name}" needs a primary key column before creating relationships.`,
        });
        return;
      }

      const slugBase = sourceTable.name
        ? sourceTable.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
        : 'ref';
      const baseColumnName = `${slugBase || 'ref'}_id`;

      const existingNames = new Set(
        targetTable.columns.map(col => col.name.toLowerCase())
      );
      let candidateName = baseColumnName;
      let attempt = 1;
      while (existingNames.has(candidateName.toLowerCase())) {
        candidateName = `${baseColumnName}_${attempt}`;
        attempt += 1;
      }

      const defaultType = sourcePk.type || 'INTEGER';
      const newColumnId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const initialValues: SchemaColumn = {
        id: newColumnId,
        name: candidateName,
        type: defaultType,
        length: sourcePk.length,
        precision: sourcePk.precision,
        scale: sourcePk.scale,
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: '',
        references: {
          table: sourceTable.name,
          column: sourcePk.name,
          onDelete: 'NO ACTION',
          onUpdate: 'NO ACTION',
        },
      };

      setEditingColumn({
        table: targetTable,
        column: null,
        initialValues,
      });
      setIsColumnEditorOpen(true);
    },
    [schema.tables, setAlertDialog]
  );

  // Save indexes for a table
  const handleSaveIndexes = useCallback((indexes: SchemaIndex[]) => {
    if (!managingIndexTable) return;

    setSchema(prev => {
      const updatedTables = prev.tables.map(table => {
        if (table.id === managingIndexTable.id) {
          return { ...table, indexes };
        }
        return table;
      });

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    setIsIndexManagerOpen(false);
    setManagingIndexTable(null);
  }, [managingIndexTable, setSchema]);

  // Auto-create indexes for all foreign key columns
  const handleAutoIndexForeignKeys = useCallback(() => {
    // Prevent rapid clicks - check button state
    if (isOptimizingFKs) return;
    
    setIsOptimizingFKs(true);

    // Close any open editors to prevent state conflicts
    if (isIndexManagerOpen) {
      setIsIndexManagerOpen(false);
      setManagingIndexTable(null);
    }
    if (isColumnEditorOpen) {
      setIsColumnEditorOpen(false);
      setEditingColumn(null);
    }

    // Use a ref to store result to avoid React Strict Mode double-call issues
    const resultRef = { current: { indexesCreated: 0, errors: [] as string[], indexesBefore: 0, indexesAfter: 0 } };

    setSchema(prev => {
      // Store initial count
      resultRef.current.indexesBefore = prev.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
      
      // Collect all existing index names globally to prevent collisions
      const allIndexNames = new Set<string>();
      prev.tables.forEach(t => {
        t.indexes?.forEach(idx => allIndexNames.add(idx.name));
      });

      const updatedTables = prev.tables.map(table => {
        // Find all FK columns in this table
        const fkColumns = table.columns.filter(col => col.references);
        
        if (fkColumns.length === 0) return table;

        // Get existing indexes for this table
        const existingIndexes = table.indexes || [];
        const newIndexes = [...existingIndexes];

        // Create index for each FK column that doesn't already have one
        fkColumns.forEach(col => {
          // Check if this column already has a dedicated single-column index
          const hasSingleIndex = existingIndexes.some(idx => 
            idx.columns.length === 1 && idx.columns[0] === col.name
          );

          // Check if column is the FIRST column in a composite index (leftmost prefix rule)
          const hasCompositeIndex = existingIndexes.some(idx => 
            idx.columns.length > 1 && idx.columns[0] === col.name
          );

          // Skip if already indexed (either single or leftmost in composite)
          if (hasSingleIndex || hasCompositeIndex) {
            return;
          }

          // Generate unique index name with better collision avoidance
          let indexName = `fk_${table.name}_${col.name}`;
          let nameCounter = 1;
          
          // Ensure global uniqueness (check both existing and newly created)
          while (allIndexNames.has(indexName) || newIndexes.some(idx => idx.name === indexName)) {
            indexName = `fk_${table.name}_${col.name}_${nameCounter}`;
            nameCounter++;
          }

          // Validate index name length (max 64 characters for most databases)
          if (indexName.length > 64) {
            resultRef.current.errors.push(`Cannot create index for ${table.name}.${col.name}: Name too long (${indexName.length} > 64 chars)`);
            return;
          }

          // Create index with unique ID to prevent collisions
          const timestamp = Date.now() + resultRef.current.indexesCreated;
          const random = Math.random().toString(36).substring(2, 9);
          const newIndex = {
            id: `idx-${timestamp}-${random}`,
            name: indexName,
            columns: [col.name],
            type: 'BTREE' as const,
            unique: false,
            comment: 'Auto-created for foreign key performance',
          };

          newIndexes.push(newIndex);
          allIndexNames.add(indexName);
          resultRef.current.indexesCreated++;
        });

        return { ...table, indexes: newIndexes };
      });

      // Calculate actual indexes after
      resultRef.current.indexesAfter = updatedTables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    // Show result message using queueMicrotask for better performance
    queueMicrotask(() => {
      setIsOptimizingFKs(false); // Re-enable button
      
      // Use actual difference in index count (protection against double-calls)
      const actualIndexesCreated = resultRef.current.indexesAfter - resultRef.current.indexesBefore;
      
      if (resultRef.current.errors.length > 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Partial Success',
          message: `Created ${actualIndexesCreated} index${actualIndexesCreated !== 1 ? 'es' : ''} successfully, but encountered ${resultRef.current.errors.length} error${resultRef.current.errors.length !== 1 ? 's' : ''}:\n\n${resultRef.current.errors.join('\n')}\n\nThese indexes need to be created manually using the "Indexes" button on each table.`,
        });
      } else if (actualIndexesCreated > 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Indexes Created Successfully',
          message: `Created ${actualIndexesCreated} index${actualIndexesCreated !== 1 ? 'es' : ''} for foreign key columns.\n\n${actualIndexesCreated === 1 ? 'This index optimizes' : 'These indexes optimize'} JOIN query performance.\n\nClick "Export" to see the CREATE INDEX statements in your schema.`,
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Already Optimized',
          message: 'All foreign key columns already have indexes.\n\nYour schema follows performance best practices. No action needed!',
        });
      }
    });
  }, [isOptimizingFKs, isIndexManagerOpen, isColumnEditorOpen, setSchema, setAlertDialog]);

  // Save column (add or update)
  const handleSaveColumn = useCallback((column: SchemaColumn) => {
    if (!editingColumn) return;

    setSchema(prev => {
      const updatedTables = prev.tables.map(table => {
      if (table.id === editingColumn.table.id) {
        // Check if editing existing column or adding new
        const existingIndex = table.columns.findIndex(c => c.id === column.id);
        
        if (existingIndex >= 0) {
          // Update existing column
            const oldColumn = table.columns[existingIndex];
            const oldColumnName = oldColumn.name;
            const newColumnName = column.name;
          const updatedColumns = [...table.columns];
          updatedColumns[existingIndex] = column;
            
            // Track if FK reference was removed
            const fkWasRemoved = oldColumn.references && !column.references;
            
            // If column name changed, update all indexes that reference it
            let updatedIndexes = table.indexes;
            if (oldColumnName !== newColumnName && table.indexes) {
              updatedIndexes = table.indexes.map(idx => ({
                ...idx,
                columns: idx.columns.map(col => 
                  col === oldColumnName ? newColumnName : col
                ),
              }));
            }
            
            // CRITICAL: If FK was removed, clean up auto-created index
            if (fkWasRemoved && updatedIndexes) {
              updatedIndexes = updatedIndexes.filter(idx => {
                // Keep non-FK indexes
                if (!idx.comment?.includes('Auto-created for foreign key performance')) {
                  return true;
                }
                
                // Keep composite indexes (user-created)
                if (idx.columns.length > 1) {
                  return true;
                }
                
                // Remove single-column auto-created index for this column
                return idx.columns[0] !== newColumnName;
              });
            }
            
            return { ...table, columns: updatedColumns, indexes: updatedIndexes };
        } else {
          // Add new column
          return { ...table, columns: [...table.columns, column] };
        }
      }
      return table;
    });

      return {
      ...prev,
      tables: updatedTables,
      };
    });

    setIsColumnEditorOpen(false);
    setEditingColumn(null);
  }, [editingColumn, setSchema]);

  // Delete column
  const handleDeleteColumn = useCallback((columnId: string) => {
    if (!editingColumn) return;

    setSchema(prev => {
      // Find the column being deleted
      const deletedColumn = editingColumn.table.columns.find(c => c.id === columnId);
      if (!deletedColumn) return prev;

      const deletedColumnName = deletedColumn.name;
      const deletedTableName = editingColumn.table.name;

      // CRITICAL: Track FK columns that will lose their references (BEFORE clearing them)
      const columnsLosingFKs: { tableId: string; columnName: string }[] = [];
      
      prev.tables.forEach(table => {
        if (table.id === editingColumn.table.id) return; // Skip source table
        
        table.columns.forEach(col => {
          if (col.references && 
              col.references.table === deletedTableName && 
              col.references.column === deletedColumnName) {
            columnsLosingFKs.push({ tableId: table.id, columnName: col.name });
          }
        });
      });

      const updatedTables = prev.tables.map(table => {
      if (table.id === editingColumn.table.id) {
          // Remove column from this table
          const updatedColumns = table.columns.filter(c => c.id !== columnId);
          
          // Clean up indexes that reference the deleted column
          const updatedIndexes = table.indexes?.filter(idx => 
            !idx.columns.includes(deletedColumnName)
          ) || [];
          
        return {
          ...table,
            columns: updatedColumns,
            indexes: updatedIndexes,
          };
        } else {
          // Clean up FK references in other tables pointing to this column
          const updatedColumns = table.columns.map(col => {
            if (col.references && 
                col.references.table === deletedTableName && 
                col.references.column === deletedColumnName) {
              // Remove FK reference (column stays, reference cleared)
              const { references, ...columnWithoutRef } = col;
              return columnWithoutRef;
            }
            return col;
          });
          
          // CRITICAL: Clean up auto-created FK indexes in other tables
          const updatedIndexes = table.indexes?.filter(idx => {
            // Keep non-FK indexes and user-created indexes
            if (!idx.comment?.includes('Auto-created for foreign key performance')) {
              return true;
            }
            
            // Keep composite indexes (user-created, not auto-generated)
            if (idx.columns.length > 1) {
              return true;
            }
            
            // Remove single-column auto-created index if that column lost its FK
            const colName = idx.columns[0];
            const fkRemoved = columnsLosingFKs.some(
              lost => lost.tableId === table.id && lost.columnName === colName
            );
            
            return !fkRemoved;
          }) || [];
          
          return { ...table, columns: updatedColumns, indexes: updatedIndexes };
        }
      });

      return {
      ...prev,
      tables: updatedTables,
      };
    });

    setIsColumnEditorOpen(false);
    setEditingColumn(null);
  }, [editingColumn, setSchema]);

  // Load template
  const handleLoadTemplate = useCallback((template: SchemaTemplate) => {
    if (!ensureProjectContext()) {
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Load Template?',
      message: `Load "${template.name}" template?\n\nThis will replace your current schema.`,
      confirmLabel: 'Load Template',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        // Close any open editors to prevent state conflicts
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false); // Reset optimization state
        // Close context menu if open
        setContextMenu(prev => ({ ...prev, isOpen: false }));
        
        // Ensure all tables have indexes array initialized
        const normalizedSchema = {
          ...template.schema,
          tables: template.schema.tables.map(table => ({
            ...table,
            indexes: table.indexes || [], // Initialize if missing
          })),
        };
        
        // Replace schema without adding to undo history (template load is a new starting point)
        replaceSchema(normalizedSchema);
        setIsTemplatesOpen(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [replaceSchema, ensureProjectContext]);

  // Delete table (with confirmation)
  const handleDeleteTable = useCallback((tableId: string) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;

    // Count FK references TO this table (from other tables)
    const incomingFKCount = schema.tables.reduce((count, t) => {
      if (t.id === tableId) return count;
      return count + t.columns.filter(col => 
        col.references && col.references.table === table.name
      ).length;
    }, 0);

    const isDatabaseConnected = databaseConnection !== null;
    const syncNote = isDatabaseConnected 
      ? `\n\nNote: This change is local only. The table will be deleted from the database when you click "Sync DB".`
      : '';

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Table?',
      message: `Delete table "${table.name}"?${incomingFKCount > 0 ? `\n\nThis table is referenced by ${incomingFKCount} foreign key${incomingFKCount > 1 ? 's' : ''} in other tables. These FK references will be removed.` : ''}${syncNote}\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete Table',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        // Close editors if this table is being edited or managed
        if (editingColumn?.table.id === tableId) {
          setIsColumnEditorOpen(false);
          setEditingColumn(null);
        }
        if (managingIndexTable?.id === tableId) {
          setIsIndexManagerOpen(false);
          setManagingIndexTable(null);
        }
        // Close context menu if open for this table
        if (contextMenu.isOpen && contextMenu.tableId === tableId) {
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        }

        // Remove table AND clean up all FK references to it
        const deletedTableName = table.name;
        
        // CRITICAL: Track columns that will lose FK references (BEFORE clearing them)
        const columnsLosingFKs: { tableId: string; columnName: string }[] = [];
        
        schema.tables.forEach(t => {
          if (t.id === tableId) return; // Skip the table being deleted
          
          t.columns.forEach(col => {
            if (col.references && col.references.table === deletedTableName) {
              columnsLosingFKs.push({ tableId: t.id, columnName: col.name });
            }
          });
        });
        
        const updatedTables = schema.tables
          .filter(t => t.id !== tableId) // Remove the table
          .map(t => {
            // Clean up FK references in remaining tables
            const updatedColumns = t.columns.map(col => {
              if (col.references && col.references.table === deletedTableName) {
                // Remove FK reference (column stays, but reference is cleared)
                const { references, ...columnWithoutRef } = col;
                return columnWithoutRef;
              }
              return col;
            });
            
            // CRITICAL: Clean up auto-created FK indexes in remaining tables
            const updatedIndexes = t.indexes?.filter(idx => {
              // Keep non-FK indexes and user-created indexes
              if (!idx.comment?.includes('Auto-created for foreign key performance')) {
                return true;
              }
              
              // Keep composite indexes (user-created, not auto-generated)
              if (idx.columns.length > 1) {
                return true;
              }
              
              // Remove single-column auto-created index if that column lost its FK
              const colName = idx.columns[0];
              const fkRemoved = columnsLosingFKs.some(
                lost => lost.tableId === t.id && lost.columnName === colName
              );
              
              return !fkRemoved;
            }) || [];
            
            return { ...t, columns: updatedColumns, indexes: updatedIndexes };
          });

        setSchema({
          ...schema,
          tables: updatedTables,
        });
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema, editingColumn, managingIndexTable, contextMenu.isOpen, contextMenu.tableId, databaseConnection, setSchema]);

  // Memoize button visibility check for performance
  const hasFKsWithoutIndexes = useMemo(() => {
    return schema.tables.some(table => 
      table.columns.some(col => {
        if (!col.references) return false;
        const indexes = table.indexes || [];
        
        // Check for single-column index
        const hasSingleIndex = indexes.some(idx => 
          idx.columns.length === 1 && idx.columns[0] === col.name
        );
        
        // Check for composite index with FK as leftmost column
        const hasCompositeIndex = indexes.some(idx => 
          idx.columns.length > 1 && idx.columns[0] === col.name
        );
        
        // Show button if FK has no index at all
        return !hasSingleIndex && !hasCompositeIndex;
      })
    );
  }, [schema]);

  // Reset schema
  const handleReset = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    const totalColumns = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);
    const totalIndexes = schema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);
    
    const isConnected = !!databaseConnection;
    const connectionNote = isConnected
      ? '\n\nThis only clears your local design canvas. The connected database stays untouched.'
      : '';
    const introLine = isConnected
      ? 'This clears your local canvas only.'
      : 'This will permanently delete:';
    const confirmLabel = isConnected ? 'Clear Local Canvas' : 'Delete Everything';
    const removalLine = isConnected ? 'It will remove:' : '';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Tables?',
      message: `${introLine}\n\n${removalLine ? `${removalLine}\n\n` : ''}• ${schema.tables.length} table${schema.tables.length !== 1 ? 's' : ''}\n• ${totalColumns} column${totalColumns !== 1 ? 's' : ''}\n• ${totalIndexes} index${totalIndexes !== 1 ? 'es' : ''}\n\nYour saved work and undo history will also be cleared.${connectionNote}`,
      confirmLabel,
      cancelLabel: 'Cancel',
      onConfirm: () => {
        // Close any open editors to prevent state conflicts
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false); // Reset optimization state
        // Close context menu if open
        setContextMenu(prev => ({ ...prev, isOpen: false }));
        
        // Replace schema without adding to history
        replaceSchema({
          name: 'My Database',
          tables: [],
          relationships: [],
        });
        
        // Clear localStorage and history
        clearSchema();
        clearHistory();
        setLastSavedTime(null);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [schema.tables, replaceSchema, clearHistory, databaseConnection, ensureProjectContext]);

  // Import schema
  const handleImport = useCallback((importedSchema: SchemaState) => {
    if (!ensureProjectContext()) {
      return;
    }
    // Close any open editors to prevent state conflicts
    setIsColumnEditorOpen(false);
    setEditingColumn(null);
    setIsIndexManagerOpen(false);
    setManagingIndexTable(null);
    setIsOptimizingFKs(false);
    // Close context menu if open
    setContextMenu(prev => ({ ...prev, isOpen: false }));
    
    // Close import modal
    setIsImportModalOpen(false);
    
    // Replace schema without adding to undo history (import is a new starting point)
    replaceSchema({
      name: importedSchema.name || 'Imported Schema',
      description: importedSchema.description || '',
      tables: importedSchema.tables,
      relationships: [], // Deprecated: relationships auto-generated from FKs
    });
    
    // Suggest auto-layout if many tables were imported
    if (importedSchema.tables.length >= 5) {
      queueMicrotask(() => {
        setConfirmDialog({
          isOpen: true,
          title: 'Auto-Arrange Tables?',
          message: `Successfully imported ${importedSchema.tables.length} tables.\n\nWould you like to auto-arrange them by dependencies for better visualization?`,
          confirmLabel: 'Auto-Arrange',
          cancelLabel: 'Skip',
          confirmVariant: 'primary',
          onConfirm: () => {
            // Apply auto-layout
            const layoutedTables = autoLayoutTables(importedSchema.tables, 'hierarchical');
            setSchema(prev => ({
              ...prev,
              tables: layoutedTables,
            }));
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          },
        });
      });
    }
  }, [replaceSchema, setSchema, ensureProjectContext]);

  /**
   * Load a schema version from migration history
   */
  const handleLoadVersion = useCallback((loadedSchema: SchemaState) => {
    // Close migration modal
    setIsMigrationModalOpen(false);
    
    // Confirm before loading (will replace current schema)
    setConfirmDialog({
      isOpen: true,
      title: 'Load Schema Version?',
      message: `This will replace your current schema with the selected version.\n\nMake sure you've saved your current work if you want to keep it.`,
      confirmLabel: 'Load Version',
      cancelLabel: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: () => {
        // Close any open editors
        setIsColumnEditorOpen(false);
        setEditingColumn(null);
        setIsIndexManagerOpen(false);
        setManagingIndexTable(null);
        setIsOptimizingFKs(false);
        
        // Replace schema
        replaceSchema(loadedSchema);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        
        // Show success alert
        setAlertDialog({
          isOpen: true,
          title: 'Version Loaded',
          message: `Schema version loaded successfully. You can now continue editing or save a new version.`,
        });
      },
    });
  }, [replaceSchema]);

  // Auto-layout tables
  const handleAutoLayout = useCallback((algorithm: LayoutAlgorithm = 'hierarchical') => {
    if (!ensureProjectContext()) {
      return;
    }
    if (schema.tables.length === 0) return;
    
    const layoutedTables = autoLayoutTables(schema.tables, algorithm);
    
    setSchema({
      ...schema,
      tables: layoutedTables,
    }, 'Auto-layout');
    
    // Trigger fitView after layout (only when explicitly clicking auto-layout)
    setAutoLayoutTrigger(prev => prev + 1);
  }, [schema, setSchema, ensureProjectContext]);

  const handleToggleTemplates = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    setIsTemplatesOpen(prev => !prev);
  }, [ensureProjectContext]);

  const handleOpenTemplatesPanel = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    setIsTemplatesOpen(true);
  }, [ensureProjectContext]);

  const requestCreateBranch = useCallback(() => {
    if (!ensureProjectContext()) {
      return;
    }
    setInputDialog({
      isOpen: true,
      title: 'Create Branch',
      message: 'Enter a name for the new branch.',
      defaultValue: '',
      onConfirm: (rawName: string) => {
        const normalized = rawName.trim().replace(/\s+/g, '-');
        const candidate = normalized || `branch-${branchNames.length + 1}`;
        try {
          createBranch(candidate);
          setInputDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Branch Error',
            message: error?.message || 'Unable to create branch. Please try a different name.',
          });
        }
      },
    });
  }, [ensureProjectContext, branchNames.length, createBranch]);

  const handleSwitchBranch = useCallback((branchName: string) => {
    if (!ensureProjectContext()) {
      return;
    }
    switchBranch(branchName);
  }, [ensureProjectContext, switchBranch]);

  const requestDeleteBranch = useCallback((branchName: string) => {
    if (!ensureProjectContext()) {
      return;
    }
    if (branchName === 'main') {
      setAlertDialog({
        isOpen: true,
        title: 'Protected Branch',
        message: 'The main branch cannot be deleted.',
      });
      return;
    }

    const branchDetails = branchList.find(branch => branch.name === branchName);
    const detailLines = branchDetails
      ? [
          `• Created ${formatTimestamp(branchDetails.createdAt)}`,
          `• Last updated ${formatTimestamp(branchDetails.updatedAt)}`,
          branchDetails.parent ? `• Derived from "${branchDetails.parent}"` : null,
        ].filter(Boolean).join('\n')
      : '';

    const detailBlock = detailLines ? `\n\nBranch details:\n${detailLines}` : '';

    setConfirmDialog({
      isOpen: true,
      title: `Delete branch "${branchName}"?`,
      message: `This will permanently remove the "${branchName}" snapshot and its history.${detailBlock}\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete Branch',
      cancelLabel: 'Keep Branch',
      confirmVariant: 'danger',
      onConfirm: () => {
        try {
          deleteBranch(branchName);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Delete Failed',
            message: error?.message || 'Unable to delete branch. Please try again.',
          });
        }
      },
    });
  }, [ensureProjectContext, branchList, deleteBranch, setAlertDialog, setConfirmDialog]);

  // Export canvas as image
  const handleExportImage = useCallback(async (format: 'png' | 'svg') => {
    if (!canvasRef) {
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: 'Canvas reference not found. Please try again or refresh the page.',
      });
      return;
    }

    if (schema.tables.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Nothing to Export',
        message: 'Your schema is empty. Add some tables first before exporting as an image.',
      });
      return;
    }

    try {
      const filename = getSuggestedFilename(schema.name, format);
      await exportCanvasAsImage(canvasRef, schema.tables, {
        format,
        filename,
        backgroundColor: '#ffffff', // Always white for clean export
        quality: 0.95,
        pixelRatio: 2,
      });
      
      // Success feedback
      setAlertDialog({
        isOpen: true,
        title: `${format.toUpperCase()} Exported Successfully!`,
        message: `Your schema diagram has been downloaded as "${filename}".\n\nPerfect for documentation, presentations, or sharing on social media!`,
      });
    } catch (error) {
      console.error('Image export failed:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export canvas as image. Please try again.',
      });
    }
  }, [canvasRef, schema.name, schema.tables]);

  // Handle table context menu (right-click)
  const handleTableContextMenu = useCallback((tableId: string, x: number, y: number) => {
    // Close existing context menu and open new one (handles rapid right-clicks)
    setContextMenu({
      isOpen: true,
      position: { x, y },
      tableId,
    });
  }, []);

  // Handle canvas click (close context menu)
  const handleCanvasClick = useCallback(() => {
    if (contextMenu.isOpen) {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
    }
  }, [contextMenu.isOpen]);

  // Close context menu handler
  const handleCloseContextMenu = useCallback(() => {
    if (contextMenu.isOpen) {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
    }
  }, [contextMenu.isOpen]);

  // Auto-close context menu if table is deleted
  useEffect(() => {
    if (contextMenu.isOpen && contextMenu.tableId) {
      const table = schema.tables.find(t => t.id === contextMenu.tableId);
      if (!table) {
        // Table was deleted - close menu
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    }
  }, [contextMenu.isOpen, contextMenu.tableId, schema.tables]);

  // Generate context menu items for the selected table
  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu.tableId) return [];

    const table = schema.tables.find(t => t.id === contextMenu.tableId);
    if (!table) return [];

    return [
      {
        id: 'add-column',
        label: 'Add Column',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
        action: () => handleAddColumn(table.id),
      },
      {
        id: 'edit-table',
        label: 'Rename Table',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        action: () => handleEditTable(table.id),
      },
      {
        id: 'manage-indexes',
        label: 'Manage Indexes',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        action: () => handleManageIndexes(table.id),
      },
      {
        id: 'separator-1',
        label: '',
        separator: true,
        action: () => {},
      },
      {
        id: 'duplicate-table',
        label: 'Duplicate Table',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
        action: () => {
          // Generate unique table name
          let newName = `${table.name}_copy`;
          let counter = 1;
          while (schema.tables.some(t => t.name === newName)) {
            counter++;
            newName = `${table.name}_copy${counter}`;
          }

          // Duplicate table with new position and unique IDs
          const newTable: SchemaTable = {
            ...table,
            id: `${table.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: newName,
            position: {
              x: table.position.x + 50,
              y: table.position.y + 50,
            },
            columns: table.columns.map((col, idx) => ({
              ...col,
              id: `${col.name}_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
              // Remove FK references (don't copy relationships)
              references: undefined,
            })),
            indexes: table.indexes
              ?.filter(idx => {
                // Only copy indexes that don't reference FK columns
                const fkColumnNames = table.columns
                  .filter(c => c.references)
                  .map(c => c.name);
                return !idx.columns.some(col => fkColumnNames.includes(col));
              })
              .map((idx, i) => ({
                ...idx,
                id: `${idx.name}_${Date.now()}_${i}_copy`,
                name: `${idx.name}_copy${counter > 1 ? counter : ''}`,
              })),
          };
          
          setSchema({ ...schema, tables: [...schema.tables, newTable] }, 'Duplicate table');
        },
      },
      {
        id: 'separator-2',
        label: '',
        separator: true,
        action: () => {},
      },
      {
        id: 'delete-table',
        label: 'Delete Table',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        variant: 'danger',
        action: () => handleDeleteTable(table.id),
      },
    ];
  }, [contextMenu.tableId, schema, setSchema, handleAddColumn, handleEditTable, handleManageIndexes, handleDeleteTable]);


  // Keyboard shortcut overlay (? key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts overlay with ? key (only when not typing)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      
      // Close overlay with Escape
      if (e.key === 'Escape' && isShortcutsOpen) {
        e.preventDefault();
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen]);

  // Keyboard shortcuts (Cmd+E for Export, Cmd+T for Add Table, Cmd+Shift+R for Reset, Cmd+I for Import)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when dialogs are open
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      
      // Don't trigger when any dialog/drawer is open
      if (isColumnEditorOpen || isIndexManagerOpen || isExportModalOpen || isImportModalOpen || isMigrationModalOpen || confirmDialog.isOpen || inputDialog.isOpen || alertDialog.isOpen || isShortcutsOpen || contextMenu.isOpen) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 'z':
            // Cmd/Ctrl + Z: Undo
            if (e.shiftKey) {
              // Cmd/Ctrl + Shift + Z: Redo
              if (canRedo) {
                e.preventDefault();
                redo();
              }
            } else {
              // Cmd/Ctrl + Z: Undo
              if (canUndo) {
                e.preventDefault();
                undo();
              }
            }
            break;
          
          case 'e':
            // Cmd/Ctrl + E: Export schema
            if (schema.tables.length > 0) {
              e.preventDefault();
              setIsExportModalOpen(true);
            }
            break;
          
          case 'i':
            // Cmd/Ctrl + I: Import schema
            e.preventDefault();
            setIsImportModalOpen(true);
            break;
          
          case 't':
            // Cmd/Ctrl + T: Add new table
            e.preventDefault();
            handleAddTable();
            break;
          
          case 'l':
            // Cmd/Ctrl + L: Auto-layout
            if (schema.tables.length > 0) {
              e.preventDefault();
              handleAutoLayout('hierarchical');
            }
            break;
          
          case 'r':
            // Cmd/Ctrl + Shift + R: Reset schema
            if (e.shiftKey && schema.tables.length > 0) {
              e.preventDefault();
              handleReset();
            }
            break;
          
          case 'm':
            // Cmd/Ctrl + M: Migrations
            e.preventDefault();
            setIsMigrationModalOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schema.tables, isColumnEditorOpen, isIndexManagerOpen, isExportModalOpen, isImportModalOpen, isMigrationModalOpen, confirmDialog.isOpen, inputDialog.isOpen, alertDialog.isOpen, isShortcutsOpen, contextMenu.isOpen, canUndo, canRedo, undo, redo, handleAddTable, handleReset, handleAutoLayout]);

  // Calculate stats
  const tableCount = schema.tables.length;
  const columnCount = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);
  const indexCount = schema.tables.reduce((sum, t) => sum + (t.indexes?.length || 0), 0);

  const lastSavedLabel = lastSavedTime ? formatTimestamp(lastSavedTime) : null;
  const handleRequestSignOut = useCallback(() => {
    signOut();
  }, []);
  const handleConnectDatabaseRequest = useCallback(() => {
    requireAuth(() => setIsDatabaseConnectionOpen(true));
  }, [requireAuth]);
  const handleRefreshDatabaseRequest = useCallback(() => {
    requireAuth(handleRefreshDatabase);
  }, [requireAuth, handleRefreshDatabase]);
  const handleSyncDatabaseRequest = useCallback(() => {
    requireAuth(() => setIsSyncModalOpen(true));
  }, [requireAuth]);

  return (
    <>
    <div className="h-full flex flex-col overflow-hidden">
      {/* Professional Navbar with all actions */}
      <SchemaDesignerNavbar
        ref={navbarRef}
        onExport={() => setIsExportModalOpen(true)}
        onNewTable={handleAddTable}
        onImport={() => {
          if (ensureProjectContext()) {
            setIsImportModalOpen(true);
          }
        }}
        onConnectDatabase={handleConnectDatabaseRequest}
        onRefreshDatabase={handleRefreshDatabaseRequest}
        onDisconnectDatabase={() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Disconnect Database?',
            message: 'Disconnecting will clear the database connection. Your local changes will be preserved, but you will need to reconnect to sync changes to the database.',
            confirmLabel: 'Disconnect',
            cancelLabel: 'Cancel',
            confirmVariant: 'danger',
            onConfirm: () => {
                const activityId = startDbActivity('connect', 'Disconnecting from database…');
              setDatabaseConnection(null);
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                updateDbActivity(activityId, 'success', 'Disconnected from database.');
            },
          });
        }}
        onSyncDatabase={databaseConnection ? handleSyncDatabaseRequest : undefined}
        onTemplates={handleToggleTemplates}
        onMigrations={() => {
          if (ensureProjectContext()) {
            setIsMigrationModalOpen(true);
          }
        }}
        onAutoLayout={() => handleAutoLayout('hierarchical')}
        onUndo={undo}
        onRedo={redo}
        onShortcuts={() => setIsShortcutsOpen(true)}
        onReset={handleReset}
          onOpenActivityFeed={() => setIsActivityFeedOpen(true)}
          onOpenBranchesSidebar={() => setIsBranchesDrawerOpen(true)}
          activeBranch={activeBranch}
          branchOptions={branchNames}
          onBranchSelect={handleSwitchBranch}
          onBranchCreate={requestCreateBranch}
          onBranchDelete={requestDeleteBranch}
        canExport={schema.tables.length > 0}
        canUndo={canUndo}
        canRedo={canRedo}
        hasTables={schema.tables.length > 0}
        hasMultipleTables={schema.tables.length > 1}
        isTemplatesOpen={isTemplatesOpen}
        isDatabaseConnected={databaseConnection !== null}
        isRefreshingDatabase={isRefreshingDatabase}
          dbStatus={
            latestDbActivity
              ? { label: latestDbActivity.message, status: latestDbActivity.status }
              : null
          }
        projectName={activeProject?.name ?? null}
        onOpenProjectPanel={handleOpenProjectPanel}
        onSaveProject={handleSaveProject}
        isSavingProject={isSavingProject}
        hasUnsavedChanges={hasUnsavedChanges}
        isAuthenticated={isAuthenticated}
        isSessionLoading={isSessionLoading}
        userLabel={sessionUserLabel}
        onRequestSignIn={openLoginModal}
        onRequestSignOut={handleRequestSignOut}
      />
      
      {/* Content Area - Full Height Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Templates Sidebar */}
        <TemplatesSidebar
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          onSelectTemplate={handleLoadTemplate}
        />

        {/* Canvas - Always Shown, Full Height */}
        <section className="flex-1 flex flex-col min-h-0" role="region" aria-label="Schema design canvas">
          <ReactFlowProvider>
            <div ref={handleCanvasRef} className="flex-1 w-full min-h-0">
        <SchemaCanvas
          schema={schema}
          onSchemaChange={setSchema}
          tableCount={tableCount}
          columnCount={columnCount}
          indexCount={indexCount}
          lastSavedLabel={lastSavedLabel}
          onEditTable={handleEditTable}
          onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteTable={handleDeleteTable}
            onManageIndexes={handleManageIndexes}
            onTableContextMenu={handleTableContextMenu}
            onCanvasClick={handleCanvasClick}
            onCloseContextMenu={handleCloseContextMenu}
          onAddTable={handleAddTable}
          onOpenTemplates={handleOpenTemplatesPanel}
          onAutoIndexFKs={hasFKsWithoutIndexes || isOptimizingFKs ? handleAutoIndexForeignKeys : undefined}
          hasFKOptimization={hasFKsWithoutIndexes}
          isOptimizingFKs={isOptimizingFKs}
          autoLayoutTrigger={autoLayoutTrigger}
          onManualConnect={handleManualConnection}
        />
        </div>
          </ReactFlowProvider>
        </section>
      </div>

      {/* Keyboard Shortcuts Overlay - Press ? to toggle */}
      {isShortcutsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            onClick={() => setIsShortcutsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border-2 border-foreground/20 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
                  <h3 id="shortcuts-title" className="text-lg font-bold text-foreground font-mono">
                    Keyboard Shortcuts
                  </h3>
            </div>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1.5 hover:bg-foreground/10 rounded-lg transition-all active:scale-95"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
          </div>

              {/* Content */}
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-6">
                {/* General Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3 font-mono">General Actions</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">New table</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+T</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Export schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+E</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Import schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+I</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Auto-layout</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+L</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Migrations</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+M</kbd>
                    </div>
                  </div>
                </div>

                {/* History & Navigation */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3 font-mono">History & Navigation</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Undo</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Redo</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Shift+Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Pan mode</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Hold Space</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80 font-mono">Reset schema</span>
                      <kbd className="px-2 py-1 bg-foreground/10 border border-foreground/20 rounded text-xs font-mono">Cmd+Shift+R</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-foreground/5 border-t border-foreground/10 text-center">
                <p className="text-xs text-foreground/50 font-mono">
                  Press <kbd className="px-1.5 py-0.5 bg-foreground/10 border border-foreground/20 rounded text-[10px] mx-0.5">?</kbd> or <kbd className="px-1.5 py-0.5 bg-foreground/10 border border-foreground/20 rounded text-[10px] mx-0.5">Esc</kbd> to close
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Column Editor Drawer */}
      {editingColumn && (
        <ColumnEditor
          isOpen={isColumnEditorOpen}
          column={editingColumn.column}
          tableName={editingColumn.table.name}
          allTables={schema.tables}
          onSave={handleSaveColumn}
          onClose={() => {
            setIsColumnEditorOpen(false);
            setEditingColumn(null);
          }}
          onDelete={editingColumn.column ? handleDeleteColumn : undefined}
          initialValues={editingColumn.initialValues}
        />
      )}

      {/* Index Manager Drawer */}
      {managingIndexTable && (
        <IndexManager
          isOpen={isIndexManagerOpen}
          table={managingIndexTable}
          allTables={schema.tables}
          onSave={handleSaveIndexes}
          onClose={() => {
            setIsIndexManagerOpen(false);
            setManagingIndexTable(null);
          }}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        schema={schema}
        onClose={() => setIsExportModalOpen(false)}
        onExportImage={handleExportImage}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        hasExistingTables={schema.tables.length > 0}
      />

      {/* Database Connection Modal */}
      <DatabaseConnectionModal
        isOpen={isDatabaseConnectionOpen}
        onClose={() => setIsDatabaseConnectionOpen(false)}
        onConnect={(connectedSchema, connectionConfig) => {
          // Store original schema and connection info for sync
          if (connectionConfig) {
            setDatabaseConnection({
              originalSchema: JSON.parse(JSON.stringify(connectedSchema)), // Deep copy
              connectionConfig,
            });
          }
          
          // For now, always replace. Merge functionality can be added later
          if (schema.tables.length > 0) {
            setConfirmDialog({
              isOpen: true,
              title: 'Replace Existing Schema?',
              message: `You have ${schema.tables.length} existing table(s). Connecting to the database will replace your current schema. Continue?`,
              confirmLabel: 'Replace',
              cancelLabel: 'Cancel',
              confirmVariant: 'danger',
              onConfirm: () => {
                replaceSchema(connectedSchema);
                setIsDatabaseConnectionOpen(false);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              },
            });
          } else {
            replaceSchema(connectedSchema);
            setIsDatabaseConnectionOpen(false);
          }
        }}
        onActivity={handleConnectionActivity}
      />

      {/* Migration Modal */}
      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        currentSchema={schema}
        onLoadVersion={handleLoadVersion}
      />

      {/* Database Sync Modal */}
      {databaseConnection && (
        <DatabaseSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          currentSchema={schema}
          originalSchema={databaseConnection.originalSchema}
          connectionConfig={databaseConnection.connectionConfig}
          onSyncComplete={() => {
            // Update original schema to current after successful sync
            setDatabaseConnection(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                originalSchema: JSON.parse(JSON.stringify(schema)),
              };
            });
          }}
          onSyncStatusChange={handleSyncStatusChange}
        />
      )}

      {/* Database Refresh Modal */}
      {databaseConnection && refreshRemoteSchema && isRefreshModalOpen && (
        <DatabaseRefreshModal
          isOpen={isRefreshModalOpen}
          onClose={handleCloseRefreshModal}
          diff={refreshDiff}
          connectionLabel={
            databaseConnection.connectionConfig.username
              ? `Connected as ${databaseConnection.connectionConfig.username}`
              : databaseConnection.connectionConfig.database
                ? `Database: ${databaseConnection.connectionConfig.database}`
                : 'Connected database'
          }
          hostLabel={databaseConnection.connectionConfig.host || 'localhost'}
          onApply={handleApplyRemoteSchema}
        />
      )}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={contextMenuItems}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || "Confirm"}
        cancelLabel={confirmDialog.cancelLabel || "Cancel"}
        confirmVariant={confirmDialog.confirmVariant || "danger"}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Input Dialog (for table rename) */}
      <InputDialog
        isOpen={inputDialog.isOpen}
        title={inputDialog.title}
        message={inputDialog.message}
        defaultValue={inputDialog.defaultValue}
        placeholder="e.g., users"
        confirmLabel="Save"
        cancelLabel="Cancel"
        onConfirm={inputDialog.onConfirm}
        onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Alert Dialog (for validation errors) */}
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmLabel="OK"
        cancelLabel=""
        confirmVariant="primary"
        onConfirm={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <DatabaseActivityFeed
        isOpen={isActivityFeedOpen}
        events={dbActivityEvents}
        onClose={() => setIsActivityFeedOpen(false)}
      />

      <BranchesDrawer
        isOpen={isBranchesDrawerOpen}
        branches={branchList}
        activeBranch={activeBranch}
        onClose={() => setIsBranchesDrawerOpen(false)}
        onSwitch={handleSwitchBranch}
        onCreate={requestCreateBranch}
        onDelete={requestDeleteBranch}
      />

      <ProjectsDrawer
        isOpen={isProjectsDrawerOpen}
        projects={projectsData?.projects}
        isLoading={isProjectsLoading || isProjectDetailLoading}
        error={projectsError instanceof Error ? projectsError.message : undefined}
        activeProjectId={activeProjectId}
        onClose={() => setIsProjectsDrawerOpen(false)}
        onSelect={handleSelectProject}
        onCreate={handleCreateProject}
        isCreating={isCreatingProject}
        onRetry={() => mutateProjects()}
        onUpdateProject={handleUpdateProjectMetadata}
        onDeleteProject={handleDeleteProject}
        mutatingProjectId={projectMutationState.editingId}
        deletingProjectId={projectMutationState.deletingId}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>

    <LoginModal
      isOpen={isLoginModalOpen}
      isCheckingSession={isLoginModalOpen && isSessionLoading}
      onClose={closeLoginModal}
    />
    </>
  );
}

function cloneSchemaState(state: SchemaState): SchemaState {
  return JSON.parse(JSON.stringify(state));
}

