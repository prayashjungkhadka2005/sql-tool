/**
 * Schema Canvas Component
 * Main canvas for visual database design using React Flow
 */

"use client";

import { useCallback, useMemo, useEffect, useState } from 'react';
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
  onEditTable: (tableId: string) => void;
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, columnId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onManageIndexes: (tableId: string) => void;
}

export default function SchemaCanvas({ 
  schema, 
  onSchemaChange, 
  onEditTable,
  onAddColumn,
  onEditColumn,
  onDeleteTable,
  onManageIndexes
}: SchemaCanvasProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // Pan mode state (hand tool)
  const [isPanMode, setIsPanMode] = useState(false);
  
  // Keyboard shortcut: Hold Space to enable pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && e.target === document.body) {
        e.preventDefault();
        setIsPanMode(true);
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
  }, []);
  
  // Custom node types
  const nodeTypes = useMemo(() => ({ 
    tableNode: TableNode 
  }), []);

  // Convert schema tables to React Flow nodes
  const convertToNodes = useCallback((tables: SchemaTable[]): Node[] => {
    return tables
      .filter(table => table.id) // Filter out tables without IDs
      .map((table, index) => ({
        id: table.id || `node-${index}`, // Ensure ID is never empty
        type: 'tableNode',
        position: table.position,
        data: {
          table,
          onEdit: onEditTable,
          onDelete: onDeleteTable,
          onAddColumn,
          onEditColumn,
          onManageIndexes,
        },
      }));
  }, [onEditTable, onDeleteTable, onAddColumn, onEditColumn, onManageIndexes]);

  // Convert FK columns to React Flow edges (auto-generate from schema)
  const convertToEdges = useCallback((tables: SchemaTable[]): Edge[] => {
    const edges: Edge[] = [];
    
    // Generate edges from FK columns in tables
    tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.references) {
          // Find the referenced table
          const refTable = tables.find(t => t.name === column.references?.table);
          if (refTable) {
            edges.push({
              id: `fk-${table.id}-${column.id}`,
              source: table.id,
              target: refTable.id,
              sourceHandle: column.id,
              targetHandle: column.references.column,
              type: 'smoothstep',
              animated: false,
              style: { 
                stroke: 'rgba(59, 130, 246, 0.5)', // Blue for FK
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: 'rgba(59, 130, 246, 0.6)',
              },
              label: 'FK',
              labelStyle: {
                fontSize: 10,
                fontFamily: 'monospace',
                fill: 'rgba(59, 130, 246, 0.8)',
                fontWeight: 600,
              },
            });
          }
        }
      });
    });
    
    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToNodes(schema.tables));
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertToEdges(schema.tables));

  // Sync nodes when schema.tables changes
  useEffect(() => {
    setNodes(convertToNodes(schema.tables));
  }, [schema.tables, convertToNodes, setNodes]);

  // Sync edges when tables change (edges are auto-generated from FK columns)
  useEffect(() => {
    setEdges(convertToEdges(schema.tables));
  }, [schema.tables, convertToEdges, setEdges]);

  // Handle edge deletion - remove FK from column
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      
      // Check if any edge was removed (user clicked X on edge)
      const removedEdges = changes.filter((change: any) => change.type === 'remove');
      
      if (removedEdges.length > 0) {
        const removedIds = removedEdges.map((change: any) => change.id);
        
        // Track which columns are losing FK references
        const removedFKColumns: { tableId: string; columnName: string }[] = [];
        
        // Update schema: remove FK references for deleted edges
        const updatedTables = schema.tables.map(table => {
          const updatedColumns = table.columns.map(col => {
            const edgeId = `fk-${table.id}-${col.id}`;
            if (removedIds.includes(edgeId) && col.references) {
              // Track this column for index cleanup
              removedFKColumns.push({ tableId: table.id, columnName: col.name });
              
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
        
        if (JSON.stringify(updatedTables) !== JSON.stringify(schema.tables)) {
          onSchemaChange({
            ...schema,
            tables: updatedTables,
          });
        }
      }
    },
    [schema, onSchemaChange, onEdgesChange]
  );

  // Handle node position change - sync back to schema on drag end
  const handleNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      // Update schema with new position when drag stops
      const updatedTables = schema.tables.map(table => {
        if (table.id === node.id) {
          return {
            ...table,
            position: node.position,
          };
        }
        return table;
      });

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
    <div className="w-full h-[500px] border border-foreground/10 rounded-lg overflow-hidden bg-[#fafafa] dark:bg-black/20 relative">
      <style>{`
        .react-flow__attribution {
          display: none !important;
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
        /* Pan mode: hand cursors everywhere (tables locked) */
        .react-flow.pan-mode .react-flow__pane {
          cursor: grab !important;
        }
        .react-flow.pan-mode .react-flow__pane:active {
          cursor: grabbing !important;
        }
        .react-flow.pan-mode .react-flow__node {
          cursor: grab !important;
          pointer-events: none !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodesDraggable={!isPanMode}
        nodesConnectable={!isPanMode}
        elementsSelectable={!isPanMode}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={2}
        zoomOnScroll={false}
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
        className={`bg-[#fafafa] dark:bg-black/20 ${isPanMode ? 'pan-mode' : ''}`}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.5}
          className="!stroke-foreground/5"
        />
        
        {/* Minimap for navigation */}
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white/80 dark:!bg-black/60 !border !border-foreground/10 !rounded-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Custom Navigation Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        {/* Hand Tool (Pan Mode) */}
        <button
          onClick={() => setIsPanMode(!isPanMode)}
          className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-all ${
            isPanMode 
              ? 'bg-primary text-white border-primary shadow-lg scale-105' 
              : 'bg-white dark:bg-black/80 border-foreground/10 text-foreground hover:bg-foreground/5'
          }`}
          title={isPanMode ? "Hand Tool Active (Hold Space)" : "Hand Tool (Hold Space)"}
          aria-label="Hand Tool"
          aria-pressed={isPanMode}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </button>
        
        <div className="w-9 h-px bg-foreground/10"></div>
        
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="w-9 h-9 bg-white dark:bg-black/80 border border-foreground/10 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="w-9 h-9 bg-white dark:bg-black/80 border border-foreground/10 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => fitView({ duration: 200, padding: 0.2 })}
          className="w-9 h-9 bg-white dark:bg-black/80 border border-foreground/10 rounded-lg flex items-center justify-center hover:bg-foreground/5 transition-colors"
          title="Fit View"
          aria-label="Fit View"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

