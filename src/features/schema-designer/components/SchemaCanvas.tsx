/**
 * Schema Canvas Component
 * Main canvas for visual database design using React Flow
 */

"use client";

import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  useReactFlow,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { SchemaState, SchemaTable } from '../types';
import TableNode from './TableNode';

interface SchemaCanvasProps {
  schema: SchemaState;
  onSchemaChange: (schema: SchemaState) => void;
  tableCount: number;
  columnCount: number;
  indexCount: number;
  lastSavedLabel?: string | null;
  onEditTable: (tableId: string) => void;
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, columnId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onManageIndexes: (tableId: string) => void;
  onTableContextMenu?: (tableId: string, x: number, y: number) => void;
  onCanvasClick?: () => void;
  onCloseContextMenu?: () => void;
  onAddTable?: () => void;
  onOpenTemplates?: () => void;
  onAutoIndexFKs?: () => void;
  hasFKOptimization?: boolean;
  isOptimizingFKs?: boolean;
  autoLayoutTrigger?: number; // Increment this to trigger fitView after auto-layout
}

export default function SchemaCanvas({ 
  schema, 
  onSchemaChange, 
  tableCount,
  columnCount,
  indexCount,
  lastSavedLabel,
  onEditTable,
  onAddColumn,
  onEditColumn,
  onDeleteTable,
  onManageIndexes,
  onTableContextMenu,
  onCanvasClick,
  onCloseContextMenu,
  onAddTable,
  onOpenTemplates,
  onAutoIndexFKs,
  hasFKOptimization = false,
  isOptimizingFKs = false,
  autoLayoutTrigger
}: SchemaCanvasProps) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const hasTables = !!(schema?.tables && schema.tables.length > 0);
  
  // Fit view after auto-layout (only when explicitly triggered via autoLayoutTrigger)
  // Note: Only depends on autoLayoutTrigger, NOT on schema.tables to avoid zooming out when moving tables
  useEffect(() => {
    if (autoLayoutTrigger && autoLayoutTrigger > 0) {
      // Small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        try {
          fitView({ duration: 300, padding: 0.2 });
        } catch (error) {
          // Ignore errors
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoLayoutTrigger, fitView]);
  
  // Pan mode state (hand tool)
  const [isPanMode, setIsPanMode] = useState(false);
  
  // Track if actively panning (for performance optimizations)
  const [isPanning, setIsPanning] = useState(false);

  // Movable toolbar state
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 });

  const clampToolbarPosition = useCallback((position: { x: number; y: number }) => {
    if (typeof window === 'undefined') return position;
    const margin = 12;
    const navHeight = 72; // Approximate navbar height to prevent overlap
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 220;
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 64;
    const maxX = Math.max(margin, window.innerWidth - toolbarWidth - margin);
    const maxY = Math.max(navHeight + margin, window.innerHeight - toolbarHeight - margin);

    return {
      x: Math.min(Math.max(margin, position.x), maxX),
      y: Math.min(Math.max(navHeight + margin, position.y), maxY),
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('schema-designer-toolbar-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setToolbarPosition(clampToolbarPosition(parsed));
          return;
        }
      } catch {
        // Ignore parse errors
      }
    }

    setToolbarPosition(clampToolbarPosition({
      x: 20,
      y: Math.max(84, window.innerHeight - 140),
    }));
  }, [clampToolbarPosition]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('schema-designer-toolbar-position', JSON.stringify(toolbarPosition));
  }, [toolbarPosition]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handleMouseMove = (event: MouseEvent) => {
      const newX = event.clientX - dragOffsetRef.current.x;
      const newY = event.clientY - dragOffsetRef.current.y;
      setToolbarPosition(clampToolbarPosition({ x: newX, y: newY }));
    };

    const handleMouseUp = () => setIsDraggingToolbar(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clampToolbarPosition, isDraggingToolbar]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setToolbarPosition(prev => clampToolbarPosition(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampToolbarPosition]);

  const startToolbarDrag = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragOffsetRef.current = {
      x: event.clientX - toolbarPosition.x,
      y: event.clientY - toolbarPosition.y,
    };
    setIsDraggingToolbar(true);
  }, [toolbarPosition.x, toolbarPosition.y]);
  
  // Selected table for relationship highlighting
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Zoom level for display
  const [zoomLevel, setZoomLevel] = useState(80);
  
  // Update zoom level display (optimized - pause during panning for performance)
  useEffect(() => {
    let lastZoom = -1;
    const updateZoom = () => {
      // Skip updates during active panning to avoid lag
      if (isPanning) return;
      
      try {
        const zoom = getZoom();
        if (typeof zoom === 'number' && !isNaN(zoom)) {
          const roundedZoom = Math.round(zoom * 100);
          // Only update state if zoom actually changed (avoid unnecessary re-renders)
          if (roundedZoom !== lastZoom) {
            lastZoom = roundedZoom;
            setZoomLevel(roundedZoom);
          }
        }
      } catch (error) {
        // ReactFlow might not be initialized yet, ignore silently
      }
    };
    
    // Update on mount
    updateZoom();
    // Check for zoom changes periodically (reduced frequency for better performance)
    // Use longer interval during panning
    const interval = setInterval(updateZoom, isPanning ? 500 : 150);
    
    return () => clearInterval(interval);
  }, [getZoom, isPanning]);
  
  // Keyboard shortcuts: Space for pan, Ctrl/Cmd + Plus/Minus/0 for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Space for pan mode (more flexible target check)
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        // Allow Space if not in input/textarea/contentEditable
        if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable)) {
        e.preventDefault();
        setIsPanMode(true);
          return;
        }
      }

      // Zoom shortcuts
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        try {
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomIn({ duration: 200 });
          } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomOut({ duration: 200 });
          } else if (e.key === '0') {
            e.preventDefault();
            fitView({ duration: 200, padding: 0.2 });
          }
        } catch (error) {
          console.debug('Zoom shortcut failed:', error);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoomIn, zoomOut, fitView]);

  // Middle mouse button pan support
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        setIsPanMode(true);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        setIsPanMode(false);
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Custom node types
  const nodeTypes = useMemo(() => ({ 
    tableNode: TableNode 
  }), []);

  // Get related table IDs for highlighting (optimized with Map for O(1) lookups)
  const getRelatedTables = useCallback((tableId: string): Set<string> => {
    const related = new Set<string>();
    if (!schema?.tables || !tableId || schema.tables.length === 0) return related;
    
    // Build table name to ID map for O(1) lookups
    const tableNameToId = new Map<string, string>();
    schema.tables.forEach(t => {
      if (t && t.id && t.name) {
        tableNameToId.set(t.name, t.id);
      }
    });
    
    const table = schema.tables.find(t => t.id === tableId);
    if (!table || !table.columns) return related;
    
    // Add tables that this table references (outgoing FKs) - O(n) where n = columns
    table.columns.forEach(col => {
      if (col.references?.table) {
        const refTableId = tableNameToId.get(col.references.table);
        if (refTableId) related.add(refTableId);
      }
    });
    
    // Add tables that reference this table (incoming FKs) - O(n*m) optimized with Map
    if (table.name) {
    schema.tables.forEach(t => {
        if (!t.columns) return;
      t.columns.forEach(col => {
          if (col.references?.table === table.name) {
          related.add(t.id);
        }
      });
    });
    }
    
    return related;
  }, [schema.tables]);

  // Convert schema tables to React Flow nodes
  const getTableSignature = useCallback((table: SchemaTable) => {
    if (!table) return '';
    return JSON.stringify({
      name: table.name,
      columns: table.columns?.map(col => ({
        id: col.id,
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        defaultValue: col.defaultValue,
        references: col.references
          ? {
              table: col.references.table,
              column: col.references.column,
              onDelete: col.references.onDelete,
              onUpdate: col.references.onUpdate,
            }
          : null,
      })),
      indexes: table.indexes?.map(idx => ({
        id: idx.id,
        name: idx.name,
        columns: idx.columns,
        type: idx.type,
        unique: idx.unique,
      })),
    });
  }, []);

  const convertToNodes = useCallback((tables: SchemaTable[]): Node[] => {
    if (!tables || !Array.isArray(tables)) return [];
    
    const relatedTables = selectedTableId ? getRelatedTables(selectedTableId) : new Set<string>();
    
    return tables
      .filter(table => table && table.id) // Filter out tables without IDs
      .map((table, index) => {
        // Ensure each table has a unique position (stagger if missing)
        const defaultPosition = table.position || { 
          x: (index % 5) * 320, 
          y: Math.floor(index / 5) * 200 
        };
        
        return {
        id: table.id || `node-${index}`, // Ensure ID is never empty
        type: 'tableNode',
          position: defaultPosition,
          selected: selectedTableId === table.id, // React Flow selection state
        data: {
          table,
          tableSignature: getTableSignature(table),
          onEdit: onEditTable,
          onDelete: onDeleteTable,
          onAddColumn,
          onEditColumn,
          onManageIndexes,
          isSelected: selectedTableId === table.id,
          isRelated: relatedTables.has(table.id),
          onSelect: () => {
            // Close context menu if open
            if (onCloseContextMenu) {
              onCloseContextMenu();
            }
            // Toggle selection
            setSelectedTableId(prev => prev === table.id ? null : table.id);
          },
          onContextMenu: onTableContextMenu,
          onCloseContextMenu,
        },
        };
      });
  }, [onEditTable, onDeleteTable, onAddColumn, onEditColumn, onManageIndexes, onTableContextMenu, onCloseContextMenu, selectedTableId, getRelatedTables, getTableSignature]);

  // Convert FK columns to React Flow edges (auto-generate from schema)
  const convertToEdges = useCallback((tables: SchemaTable[]): Edge[] => {
    if (!tables || !Array.isArray(tables) || tables.length === 0) return [];
    
    const edges: Edge[] = [];
    const edgeIds = new Set<string>(); // Prevent duplicate edges
    const tableMap = new Map<string, SchemaTable>(); // Cache for faster lookups
    
    // Build table map for O(1) lookups (better performance than find)
    tables.forEach((table) => {
      if (table && table.id && table.name) {
        tableMap.set(table.name, table);
      }
    });
    
    // Generate edges from FK columns in tables
    tables.forEach((table) => {
      if (!table || !table.id || !table.columns || !Array.isArray(table.columns)) return;
      
      table.columns.forEach((column) => {
        if (!column || !column.id || !column.references || !column.references.table) return;
        
        // Find the referenced table (use cached map for O(1) lookup)
        const refTable = tableMap.get(column.references.table);
        if (!refTable || !refTable.id) {
          // Referenced table doesn't exist - skip invalid edge
          return;
        }
        
        // Prevent duplicate edges (same FK column)
        const edgeId = `fk-${table.id}-${column.id}`;
        if (edgeIds.has(edgeId)) {
          return; // Skip duplicate
        }
        edgeIds.add(edgeId);
        
        // Self-references are valid (e.g., employee.manager_id -> employee.id)
        const targetColumn = column.references.column || 'id'; // Default to 'id' if not specified
        const label = `${column.name} → ${targetColumn}`;
        
            edges.push({
          id: edgeId,
              source: table.id,
              target: refTable.id,
              sourceHandle: column.id,
          targetHandle: targetColumn,
              type: 'smoothstep',
              animated: false,
          data: {
            sourceTable: table.name,
            targetTable: refTable.name,
            sourceColumn: column.name,
            targetColumn: targetColumn,
          },
              style: { 
            stroke: 'rgba(59, 130, 246, 0.6)', // Professional blue for FK
            strokeWidth: 2.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
            width: 22,
            height: 22,
            color: 'rgba(59, 130, 246, 0.7)',
              },
          label: label,
              labelStyle: {
            fontSize: 11,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            fill: 'rgba(59, 130, 246, 0.95)',
                fontWeight: 600,
            letterSpacing: '0.01em',
          },
          labelBgStyle: {
            fill: 'rgba(255, 255, 255, 0.95)',
            fillOpacity: 0.95,
            stroke: 'rgba(59, 130, 246, 0.2)',
            strokeWidth: 1,
          },
          labelBgPadding: [5, 8],
          labelBgBorderRadius: 6,
        });
      });
    });
    
    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToNodes(schema?.tables || []));
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertToEdges(schema?.tables || []));

  // Clear selection if selected table no longer exists
  useEffect(() => {
    if (selectedTableId && schema?.tables) {
      const tableExists = schema.tables.some(t => t.id === selectedTableId);
      if (!tableExists) {
        setSelectedTableId(null);
      }
    }
  }, [schema?.tables, selectedTableId]);

  // Sync nodes when schema.tables changes (optimized with deep comparison)
  // Skip updates during active panning to avoid lag
  useEffect(() => {
    // Defer updates during panning - they'll happen when panning stops
    if (isPanning) return;
    
    if (!schema?.tables) {
      setNodes([]);
      return;
    }
    
    const newNodes = convertToNodes(schema.tables);
    // Only update if nodes actually changed (prevent unnecessary re-renders)
    setNodes((prevNodes) => {
      if (prevNodes.length !== newNodes.length) {
        return newNodes;
      }
      // Fast path: check if any node changed (early exit for performance)
      // Use Map for O(1) lookups to handle reordered tables correctly
      const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
      let hasChanges = false;
      for (let i = 0; i < prevNodes.length; i++) {
        const prevNode = prevNodes[i];
        if (!prevNode) {
          hasChanges = true;
          break;
        }
        // Find corresponding node by ID (handles reordering correctly)
        const newNode = newNodeMap.get(prevNode.id);
        if (!newNode) {
          // Node was removed
          hasChanges = true;
          break;
        }
        // Quick checks first (most common changes)
        if (prevNode.position.x !== newNode.position.x ||
            prevNode.position.y !== newNode.position.y ||
            prevNode.selected !== newNode.selected ||
            prevNode.data?.isSelected !== newNode.data?.isSelected ||
            prevNode.data?.isRelated !== newNode.data?.isRelated) {
          hasChanges = true;
          break;
        }
        if (prevNode.data?.tableSignature !== newNode.data?.tableSignature) {
          hasChanges = true;
          break;
        }
      }
      // Also check if any new nodes were added (not in prevNodes)
      if (!hasChanges && newNodes.length > prevNodes.length) {
        hasChanges = true;
      }
      return hasChanges ? newNodes : prevNodes;
    });
  }, [schema?.tables, convertToNodes, setNodes, isPanning]);

  // Sync edges when tables change (edges are auto-generated from FK columns)
  // Skip updates during active panning to avoid lag
  useEffect(() => {
    // Defer updates during panning - they'll happen when panning stops
    if (isPanning) return;
    
    if (!schema?.tables) {
      setEdges([]);
      return;
    }
    
    const newEdges = convertToEdges(schema.tables);
    // Only update if edges actually changed
    setEdges((prevEdges) => {
      if (prevEdges.length !== newEdges.length) {
        return newEdges;
      }
      // Fast path: check if any edge changed (early exit for performance)
      let hasChanges = false;
      for (let i = 0; i < prevEdges.length; i++) {
        const prevEdge = prevEdges[i];
        const newEdge = newEdges[i];
        if (!newEdge || !prevEdge) {
          hasChanges = true;
          break;
        }
        if (prevEdge.id !== newEdge.id ||
            prevEdge.source !== newEdge.source ||
            prevEdge.target !== newEdge.target ||
            prevEdge.sourceHandle !== newEdge.sourceHandle ||
            prevEdge.targetHandle !== newEdge.targetHandle) {
          hasChanges = true;
          break;
        }
      }
      return hasChanges ? newEdges : prevEdges;
    });
  }, [schema?.tables, convertToEdges, setEdges, isPanning]);

  // Handle edge deletion - remove FK from column
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      if (!changes || !Array.isArray(changes)) {
        onEdgesChange(changes);
        return;
      }
      
      onEdgesChange(changes);
      
      // Check if any edge was removed (user clicked X on edge)
      const removedEdges = changes.filter((change: any) => change && change.type === 'remove');
      
      if (removedEdges.length > 0 && schema?.tables) {
        const removedIds = removedEdges
          .map((change: any) => change.id)
          .filter((id: any) => id && typeof id === 'string');
        
        if (removedIds.length === 0) return;
        
        // Track which columns are losing FK references
        const removedFKColumns: { tableId: string; columnName: string }[] = [];
        
        // Update schema: remove FK references for deleted edges
        const updatedTables = schema.tables.map(table => {
          if (!table || !table.id || !table.columns) return table;
          const updatedColumns = table.columns.map(col => {
            if (!col || !col.id) return col;
            
            const edgeId = `fk-${table.id}-${col.id}`;
            if (removedIds.includes(edgeId) && col.references) {
              // Track this column for index cleanup
              removedFKColumns.push({ tableId: table.id, columnName: col.name || col.id });
              
              // Remove FK reference from this column
              const { references, ...columnWithoutRef } = col;
              return columnWithoutRef;
            }
            return col;
          });
          
          // CRITICAL: Clean up indexes that were created for the removed FK
          // We remove single-column indexes with comment "Auto-created for foreign key performance"
          const updatedIndexes = (table.indexes || []).filter(idx => {
            // Keep non-FK indexes
            if (!idx.comment?.includes('Auto-created for foreign key performance')) {
              return true;
            }
            
            // Keep composite indexes (user-created, not auto-generated)
            if (idx.columns.length > 1) {
              return true;
            }
            
            // Remove single-column auto-created index if that column lost its FK
            const colName = idx.columns[0];
            const fkRemoved = removedFKColumns.some(
              removed => removed.tableId === table.id && removed.columnName === colName
            );
            
            return !fkRemoved;
          });
          
          return { ...table, columns: updatedColumns, indexes: updatedIndexes };
        });
        
        // Only update if tables actually changed (avoid unnecessary updates)
        // Fast comparison without JSON.stringify for better performance
        const hasChanges = updatedTables.some((updatedTable, index) => {
          const originalTable = schema.tables[index];
          if (!originalTable) return true;
          
          // Quick length checks first (fastest)
          if (updatedTable.columns.length !== originalTable.columns.length) return true;
          if ((updatedTable.indexes?.length || 0) !== (originalTable.indexes?.length || 0)) return true;
          
          // Check if any column lost its references (more efficient than JSON.stringify)
          const hasColumnChanges = updatedTable.columns.some((updatedCol, colIndex) => {
            const originalCol = originalTable.columns[colIndex];
            if (!originalCol) return true;
            // Check if FK reference was removed (use 'references' property check)
            const originalHasRef = 'references' in originalCol && !!originalCol.references;
            const updatedHasRef = 'references' in updatedCol && !!(updatedCol as any).references;
            return originalHasRef !== updatedHasRef;
          });
          
          return hasColumnChanges;
        });
        
        if (hasChanges) {
          onSchemaChange({
            ...schema,
            tables: updatedTables,
          });
        }
      }
    },
    [schema, onSchemaChange, onEdgesChange]
  );

  // Handle node position change - sync back to schema on drag end (optimized)
  const handleNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      if (!node || !node.id || !schema?.tables) return;
      
      // Validate position
      const position = node.position || { x: 0, y: 0 };
      if (typeof position.x !== 'number' || typeof position.y !== 'number' || 
          isNaN(position.x) || isNaN(position.y)) {
        return; // Silently ignore invalid positions
      }
      
      // Find the table index first for faster update
      const tableIndex = schema.tables.findIndex(t => t && t.id === node.id);
      if (tableIndex === -1) return;
      
      // Get current table
      const currentTable = schema.tables[tableIndex];
      
      // Check if position changed (with small tolerance for floating point)
      const currentPos = currentTable.position || { x: 0, y: 0 };
      const positionChanged = Math.abs(currentPos.x - position.x) > 0.1 || Math.abs(currentPos.y - position.y) > 0.1;
      
      if (!positionChanged) {
        return; // No significant change, skip update
      }
      
      // Create new array with updated position (immutable update)
      const updatedTables = [...schema.tables];
      updatedTables[tableIndex] = {
        ...currentTable,
        position: { x: position.x, y: position.y },
      };

      onSchemaChange({
        ...schema,
        tables: updatedTables,
      });
    },
    [schema, onSchemaChange]
  );

  // Drag connections are disabled - users must use Column Editor
  // This ensures proper FK validation and data integrity
  const onConnect = useCallback(() => {
    // Do nothing - connections are created via Column Editor
    // Edges are auto-generated from FK columns
    // Visual feedback handled by temporary animated edge (if needed in future)
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] border border-foreground/10 rounded-lg overflow-hidden bg-gradient-to-br from-[#f8f9fa] via-[#ffffff] to-[#f8f9fa] dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#0a0a0a] relative shadow-inner">
      <style>{`
        .react-flow__attribution {
          display: none !important;
        }
        
        /* Professional canvas styling */
        .react-flow__pane {
          background: transparent !important;
        }
        
        /* Default mode: normal cursors on elements, grab on canvas */
        .react-flow:not(.pan-mode) .react-flow__pane {
          cursor: grab !important;
        }
        .react-flow:not(.pan-mode) .react-flow__pane:active {
          cursor: grabbing !important;
        }
        .react-flow:not(.pan-mode) .react-flow__node {
          cursor: pointer !important;
        }
        
        /* Pan mode: hand cursors everywhere, but tables can still be dragged */
        .react-flow.pan-mode .react-flow__pane {
          cursor: grab !important;
        }
        .react-flow.pan-mode .react-flow__pane:active {
          cursor: grabbing !important;
        }
        .react-flow.pan-mode .react-flow__node {
          cursor: move !important;
        }
        
        /* Enable touchpad panning in pan mode */
        .react-flow.pan-mode {
          touch-action: pan-x pan-y !important;
        }
        
        /* Professional edge styling - no transitions during panning */
        .react-flow__edge {
          transition: stroke-width 0.15s ease, filter 0.15s ease !important;
        }
        .react-flow.panning .react-flow__edge {
          transition: none !important;
        }
        .react-flow__edge:hover {
          stroke-width: 3 !important;
          filter: brightness(1.1) !important;
        }
        .react-flow__edge.selected {
          stroke-width: 3 !important;
        }
        
        /* Better edge path styling */
        .react-flow__edge-path {
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }
        
        /* Professional edge label */
        .react-flow__edge-text {
          font-weight: 600 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Better node selection */
        .react-flow__node.selected {
          filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3)) !important;
          z-index: 10 !important;
        }
        
        /* Smooth node transitions - but NOT during drag for performance */
        .react-flow__node {
          transition: filter 0.15s ease, box-shadow 0.15s ease !important;
        }
        .react-flow__node.dragging {
          transition: none !important;
        }
        
        /* Node hover effects */
        .react-flow__node:not(.selected):hover {
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1)) !important;
        }
        
        /* Better handle visibility on hover */
        .react-flow__node:hover .react-flow__handle {
          opacity: 1 !important;
          transform: scale(1.1) !important;
        }
        .react-flow__handle {
          opacity: 0.7 !important;
          transition: opacity 0.15s ease, transform 0.15s ease !important;
        }
        
        /* Enhanced edge hover effects */
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 3.5 !important;
          filter: brightness(1.15) drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3)) !important;
          cursor: pointer !important;
        }
        .react-flow__edge:hover .react-flow__edge-text {
          font-weight: 700 !important;
        }
        .react-flow__edge:hover .react-flow__edge-labelbg {
          fill: rgba(255, 255, 255, 1) !important;
          stroke: rgba(59, 130, 246, 0.3) !important;
        }
        
        /* Edge selection highlight */
        .react-flow__edge.selected .react-flow__edge-path {
          stroke-width: 3.5 !important;
          filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4)) !important;
        }
        
        /* Edge interaction cursor */
        .react-flow__edge {
          cursor: pointer !important;
        }
        
        /* Minimap viewport indicator rounded corners */
        .react-flow__minimap-mask {
          rx: 12 !important;
          ry: 12 !important;
        }
        .react-flow__minimap {
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        
        /* Smooth zoom transitions - but NOT during panning for instant response */
        .react-flow__viewport {
          transition: transform 0.2s ease !important;
        }
        .react-flow__viewport.panning {
          transition: none !important;
        }
        
        /* Better focus states for accessibility */
        .react-flow__controls button:focus-visible,
        .react-flow__minimap button:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.6) !important;
          outline-offset: 2px !important;
        }
        
        /* Performance: GPU acceleration for smooth animations */
        .react-flow__node {
          will-change: filter, box-shadow !important;
        }
        .react-flow__edge-path {
          will-change: stroke-width, filter !important;
        }
        
        /* Disable transitions during drag for instant response */
        .react-flow__node.react-flow__node-dragging {
          transition: none !important;
          will-change: transform !important;
        }
        
        /* Disable all transitions during panning for smooth performance */
        .react-flow.panning * {
          transition: none !important;
        }
        .react-flow.panning .react-flow__viewport {
          transition: none !important;
        }
        .react-flow.panning .react-flow__node {
          transition: none !important;
        }
        .react-flow.panning .react-flow__edge {
          transition: none !important;
        }
        
        /* Optimize rendering during panning */
        .react-flow.panning {
          contain: layout style paint !important;
        }
        
        /* Better scrollbar styling for table nodes */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* Dark mode scrollbar */
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div className="absolute top-3 right-3 z-20">
        <div className="px-3 py-2 text-[11px] sm:text-xs font-mono text-foreground/70 bg-white/90 dark:bg-[#0d0d0d]/90 border border-foreground/10 rounded-xl shadow-sm flex flex-col gap-1 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span>{tableCount} {tableCount === 1 ? 'Table' : 'Tables'}</span>
            <span className="text-foreground/30">•</span>
            <span>{columnCount} Cols</span>
            <span className="text-foreground/30">•</span>
            <span>{indexCount} {indexCount === 1 ? 'Idx' : 'Idxs'}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-foreground/40">
            {lastSavedLabel ? `Last saved ${lastSavedLabel}` : 'Not saved yet'}
          </span>
        </div>
      </div>
      {hasTables && (
        <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onPaneClick={(e) => {
          // Clear selection when clicking on canvas
          setSelectedTableId(null);
          // Also call the parent handler if provided
          if (onCanvasClick) {
            onCanvasClick();
          }
        }}
        onEdgeClick={(event, edge) => {
          // Optional: Add edge click handler for future features
          event.stopPropagation();
        }}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={!isPanMode}
        elementsSelectable={true}
        edgesFocusable={true}
        edgesUpdatable={false}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={2}
        zoomOnScroll={!isPanMode}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnScroll={isPanMode}
        panOnScrollSpeed={0.5}
        panOnDrag={true}
        preventScrolling={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={['Meta', 'Control']}
        selectionOnDrag={false}
        className={`bg-[#fafafa] dark:bg-black/20 ${isPanMode ? 'pan-mode' : ''} ${isPanning ? 'panning' : ''}`}
        onMoveStart={() => setIsPanning(true)}
        onMoveEnd={() => setIsPanning(false)}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          className="!stroke-foreground/[0.03] dark:!stroke-foreground/[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)',
          }}
          // Reduce background complexity during panning
        />
        
        {/* Professional Minimap - pause updates during panning */}
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.selected) return '#3b82f6';
            if (node.data?.isRelated) return '#10b981';
            return '#6b7280';
          }}
          nodeBorderRadius={12}
          zoomable
          pannable
          className="!bg-white/95 dark:!bg-[#1a1a1a]/95 !backdrop-blur-sm !border-2 !border-foreground/20 !rounded-xl !shadow-xl"
          maskColor="rgba(59, 130, 246, 0.15)"
          style={{
            right: 16,
            bottom: 16,
            width: 200,
            height: 150,
          }}
          // Reduce minimap update frequency during panning
          maskStrokeColor="rgba(59, 130, 246, 0.15)"
        />
      </ReactFlow>

      {/* Simple Navigation Controls */}
      <div
        ref={toolbarRef}
        className="fixed z-10 flex flex-row gap-2"
        style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
      >
        <div className="bg-white/95 dark:bg-[#1a1a1a]/95 border border-foreground/20 rounded-lg shadow-sm p-1.5 flex flex-row gap-1.5 items-center">
          <div
            onMouseDown={startToolbarDrag}
            className={`w-8 h-8 border rounded-md flex items-center justify-center transition-colors cursor-move ${
              isDraggingToolbar
                ? 'bg-foreground/10 border-foreground/30'
                : 'bg-white dark:bg-[#1a1a1a] border-foreground/20 text-foreground hover:bg-foreground/5 hover:border-foreground/30'
            }`}
            title="Drag to reposition toolbar"
            aria-label="Move toolbar"
          >
            <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16M4 14h16" />
            </svg>
          </div>

          <div className="h-8 w-px bg-foreground/10"></div>
        <button
          onClick={() => setIsPanMode(!isPanMode)}
            className={`w-8 h-8 border rounded-md flex items-center justify-center transition-colors ${
            isPanMode 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-[#1a1a1a] border-foreground/20 text-foreground hover:bg-foreground/5 hover:border-foreground/30'
          }`}
            title={isPanMode ? "Hand Tool Active (Hold Space or Middle Mouse)" : "Hand Tool (Hold Space or Middle Mouse)"}
          aria-label="Hand Tool"
          aria-pressed={isPanMode}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </button>
        
          <div className="h-8 w-px bg-foreground/10"></div>
        
        <button
            onClick={() => {
              try {
                zoomIn({ duration: 200 });
              } catch (error) {
                console.warn('Zoom in failed:', error);
              }
            }}
            className="w-8 h-8 bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-md flex items-center justify-center hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
            title="Zoom In (Ctrl/Cmd + Scroll or +)"
          aria-label="Zoom In"
        >
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
            onClick={() => {
              try {
                zoomOut({ duration: 200 });
              } catch (error) {
                console.warn('Zoom out failed:', error);
              }
            }}
            className="w-8 h-8 bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-md flex items-center justify-center hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
            title="Zoom Out (Ctrl/Cmd + Scroll or -)"
          aria-label="Zoom Out"
        >
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
            onClick={() => {
              try {
                fitView({ duration: 200, padding: 0.2 });
              } catch (error) {
                console.warn('Fit view failed:', error);
              }
            }}
            className="w-8 h-8 bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-md flex items-center justify-center hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
            title="Fit View (Ctrl/Cmd + 0)"
          aria-label="Fit View"
        >
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
          
          <div className="h-8 w-px bg-foreground/10"></div>
          
          <div className="w-8 h-8 bg-foreground/5 dark:bg-foreground/10 border border-foreground/20 rounded-md flex items-center justify-center">
            <span className="text-[9px] font-mono font-medium text-foreground/70" title="Current zoom level">
              {zoomLevel}%
            </span>
          </div>
        </div>

        {(hasFKOptimization || isOptimizingFKs) && onAutoIndexFKs && (
          <button
            onClick={onAutoIndexFKs}
            disabled={isOptimizingFKs}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold font-mono transition-colors ${
              isOptimizingFKs
                ? 'border-primary/40 bg-primary/10 text-primary cursor-wait'
                : 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/20'
            }`}
            title="Automatically create indexes for foreign key columns"
          >
            {isOptimizingFKs ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Indexing…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Auto-Index FKs
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                  Needed
                </span>
              </>
            )}
          </button>
        )}
      </div>
      </>
      )}

      {/* Simple Empty State Overlay */}
      {!hasTables && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center justify-center text-center bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm rounded-lg p-8 border border-foreground/10 shadow-lg pointer-events-auto max-w-xl mx-4">
            <div className="mb-6 p-6 bg-foreground/5 rounded-lg" aria-hidden="true">
              <svg className="w-16 h-16 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-semibold text-foreground mb-2 font-mono">
              Start Designing Your Database
            </h3>
            
            <p className="text-sm text-foreground/60 font-mono mb-6 leading-relaxed">
              Create your first table or choose from professional templates to get started quickly.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              {onAddTable && (
                <button
                  onClick={onAddTable}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center justify-center gap-2 font-mono"
                  aria-label="Add your first table to begin"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Your First Table</span>
                </button>
              )}
              {onOpenTemplates && (
                <button
                  onClick={onOpenTemplates}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-foreground bg-white dark:bg-[#1a1a1a] border border-foreground/20 hover:border-foreground/30 rounded-md transition-colors flex items-center justify-center gap-2 font-mono hover:bg-foreground/5"
                  aria-label="Browse and load pre-built templates"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                  </svg>
                  <span>Use Template</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

