/**
 * Table Node Component for React Flow
 * Custom node displaying table schema with columns
 */

"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SchemaTable } from '../types';

interface TableNodeData {
  table: SchemaTable;
  onEdit: (tableId: string) => void;
  onDelete: (tableId: string) => void;
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, columnId: string) => void;
}

function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  const { table, onEdit, onDelete, onAddColumn, onEditColumn } = data;

  return (
    <div
      className={`relative bg-white dark:bg-[#1a1a1a] border-2 rounded-lg shadow-lg min-w-[280px] transition-all ${
        selected 
          ? 'border-primary shadow-xl ring-2 ring-primary/20' 
          : 'border-foreground/10 hover:border-foreground/20'
      }`}
    >
      {/* Handles for connections (invisible but functional) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary border-2 border-white"
        style={{ right: -6 }}
      />

      {/* Table Header */}
      <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/5 rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg className="w-4 h-4 text-foreground/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <h3 
              className="font-mono font-semibold text-sm text-foreground truncate cursor-move"
              title={table.name}
            >
              {table.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(table.id);
              }}
              className="px-2 py-1 text-[10px] font-mono bg-primary/10 hover:bg-primary/20 text-primary rounded transition-all flex items-center gap-1"
              title="Edit table name"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(table.id);
              }}
              className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
              title="Delete table"
            >
              <svg className="w-3.5 h-3.5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Column count */}
        <div className="text-[10px] text-foreground/40 font-mono mt-1">
          {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Columns List */}
      <div className="px-4 py-3 space-y-1.5 max-h-[400px] overflow-y-auto">
        {table.columns.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-foreground/40 font-mono">
              No columns yet
            </p>
          </div>
        ) : (
          table.columns.map((column) => (
            <button
              key={column.id}
              onClick={(e) => {
                e.stopPropagation();
                onEditColumn(table.id, column.id);
              }}
              className="flex items-center gap-2 text-xs font-mono group hover:bg-foreground/10 active:bg-foreground/15 px-2 py-1.5 rounded transition-all cursor-pointer w-full text-left"
              title="Click to edit column"
            >
              {/* Primary Key Icon */}
              {column.primaryKey && (
                <span title="Primary Key">
                  <svg 
                    className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
              )}
              
              {/* Foreign Key Icon */}
              {column.references && (
                <span title={`References ${column.references.table}.${column.references.column}`}>
                  <svg 
                    className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
              )}

              {/* Column Name */}
              <span className={`flex-1 min-w-0 truncate ${column.primaryKey ? 'font-bold' : ''} text-foreground`}>
                {column.name}
              </span>

              {/* Data Type */}
              <span className="text-foreground/50 text-[10px]">
                {column.type}
                {column.type === 'VARCHAR' && column.length ? `(${column.length})` : ''}
              </span>

              {/* Constraints Badges */}
              <div className="flex items-center gap-1">
                {!column.nullable && !column.primaryKey && (
                  <span 
                    className="text-[9px] px-1 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded font-bold"
                    title="NOT NULL"
                  >
                    NN
                  </span>
                )}
                {column.unique && !column.primaryKey && (
                  <span 
                    className="text-[9px] px-1 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded font-bold"
                    title="UNIQUE"
                  >
                    UQ
                  </span>
                )}
                {column.autoIncrement && (
                  <span 
                    className="text-[9px] px-1 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-bold"
                    title="AUTO INCREMENT"
                  >
                    AI
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add Column Button */}
      <div className="px-4 py-3 border-t border-foreground/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddColumn(table.id);
          }}
          className="w-full py-2 text-xs font-mono text-foreground/60 hover:text-foreground hover:bg-foreground/5 active:bg-foreground/10 rounded transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Column
        </button>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TableNode);

