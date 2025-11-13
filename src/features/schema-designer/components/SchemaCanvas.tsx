/**
 * Schema Canvas Component
 * Main canvas for visual database design using React Flow
 */

"use client";

import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  MiniMap,
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
}

export default function SchemaCanvas({ 
  schema, 
  onSchemaChange, 
  onEditTable,
  onAddColumn,
  onEditColumn,
  onDeleteTable
}: SchemaCanvasProps) {
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
        },
      }));
  }, [onEditTable, onDeleteTable, onAddColumn, onEditColumn]);

  // Convert relationships to React Flow edges
  const convertToEdges = useCallback((relationships: any[]): Edge[] => {
    return relationships
      .filter(rel => rel.id && rel.fromTable && rel.toTable) // Filter out invalid relationships
      .map((rel, index) => ({
        id: rel.id || `edge-${index}`, // Ensure ID is never empty
        source: rel.fromTable,
        target: rel.toTable,
        sourceHandle: rel.fromColumn || undefined,
        targetHandle: rel.toColumn || undefined,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: 'rgba(0, 0, 0, 0.2)',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: 'rgba(0, 0, 0, 0.3)',
        },
        label: rel.type,
        labelStyle: {
          fontSize: 10,
          fontFamily: 'monospace',
          fill: 'rgba(0, 0, 0, 0.5)',
        },
      }));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToNodes(schema.tables));
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertToEdges(schema.relationships));

  // Sync nodes when schema.tables changes
  useEffect(() => {
    setNodes(convertToNodes(schema.tables));
  }, [schema.tables, convertToNodes, setNodes]);

  // Sync edges when schema.relationships changes
  useEffect(() => {
    setEdges(convertToEdges(schema.relationships));
  }, [schema.relationships, convertToEdges, setEdges]);

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

  // Handle connection (create relationship)
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: 'rgba(0, 0, 0, 0.2)',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: 'rgba(0, 0, 0, 0.3)',
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));

      // Update schema relationships
      if (connection.source && connection.target) {
        const newRelationship = {
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          fromTable: connection.source,
          fromColumn: connection.sourceHandle || '',
          toTable: connection.target,
          toColumn: connection.targetHandle || '',
          type: '1:N' as const,
        };

        onSchemaChange({
          ...schema,
          relationships: [...schema.relationships, newRelationship],
        });
      }
    },
    [schema, onSchemaChange, setEdges]
  );

  return (
    <div className="w-full h-[calc(100vh-200px)] border border-foreground/10 rounded-lg overflow-hidden bg-[#fafafa] dark:bg-black/20">
      <style>{`
        .react-flow__attribution {
          display: none !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        className="bg-[#fafafa] dark:bg-black/20"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.5}
          className="!stroke-foreground/5"
        />
      </ReactFlow>
    </div>
  );
}

