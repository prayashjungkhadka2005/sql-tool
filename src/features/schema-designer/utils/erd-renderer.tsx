/**
 * Clean ERD Renderer
 * Generates a clean, print-ready ERD diagram from schema data
 */

import React from 'react';
import { SchemaTable, SchemaColumn } from '../types';

interface ERDRendererProps {
  tables: SchemaTable[];
  width: number;
  height: number;
}

/**
 * Calculate optimal table width based on content
 */
function calculateTableWidth(table: SchemaTable): number {
  // Base width
  let maxWidth = 280;
  
  // Validate table name exists
  if (!table.name) return 280;
  
  // Check table name length (truncate if > 40 chars for calculation)
  const tableName = table.name.length > 40 ? table.name.substring(0, 40) : table.name;
  const tableNameWidth = tableName.length * 8.5 + 40;
  maxWidth = Math.max(maxWidth, tableNameWidth);
  
  // Check each column (if exists)
  if (table.columns && table.columns.length > 0) {
    table.columns.forEach(column => {
      // Skip if column has no name
      if (!column.name) return;
      
      // Truncate very long names for calculation
      const columnName = column.name.length > 28 ? column.name.substring(0, 28) : column.name;
      const columnNameWidth = columnName.length * 7.5;
      
      const dataTypeText = (column.type || 'VARCHAR') + 
        ((column.type === 'VARCHAR' || column.type === 'CHAR') && column.length ? `(${column.length})` : '') +
        (column.type === 'DECIMAL' && column.precision ? `(${column.precision}${column.scale ? `,${column.scale}` : ''})` : '');
      const dataTypeWidth = dataTypeText.length * 6.5;
      const constraintsWidth = 
        (!column.nullable && !column.primaryKey ? 25 : 0) +
        (column.unique && !column.primaryKey ? 25 : 0) +
        (column.autoIncrement ? 22 : 0);
      
      const totalWidth = columnNameWidth + dataTypeWidth + constraintsWidth + 40;
      maxWidth = Math.max(maxWidth, totalWidth);
    });
  }
  
  // Return width, capped at reasonable max
  return Math.min(Math.max(maxWidth, 280), 500);
}

/**
 * Render a single table in ERD format
 */
function renderTable(table: SchemaTable, x: number, y: number) {
  const columnHeight = 32;
  const headerHeight = 70;
  const tableWidth = calculateTableWidth(table);
  const totalHeight = headerHeight + (table.columns.length * columnHeight) + 20;

  return (
    <g key={table.id} transform={`translate(${x}, ${y})`}>
      {/* Table container */}
      <rect
        x="0"
        y="0"
        width={tableWidth}
        height={totalHeight}
        fill="#ffffff"
        stroke="#e5e7eb"
        strokeWidth="2"
        rx="8"
      />
      
      {/* Header background */}
      <rect
        x="0"
        y="0"
        width={tableWidth}
        height={headerHeight}
        fill="#f9fafb"
        stroke="#e5e7eb"
        strokeWidth="0"
        rx="8"
      />
      <rect
        x="0"
        y="8"
        width={tableWidth}
        height={headerHeight - 8}
        fill="#f9fafb"
        stroke="none"
      />
      
      {/* Table name */}
      <text
        x="12"
        y="30"
        fontFamily="monospace"
        fontSize="14"
        fontWeight="600"
        fill="#111827"
      >
        {table.name && table.name.length > 35 ? table.name.substring(0, 32) + '...' : (table.name || 'Unnamed Table')}
      </text>
      
      {/* Column count */}
      <text
        x="12"
        y="52"
        fontFamily="monospace"
        fontSize="10"
        fill="#9ca3af"
      >
        {table.columns?.length || 0} column{(table.columns?.length || 0) !== 1 ? 's' : ''}
        {table.indexes && table.indexes.length > 0 && ` • ${table.indexes.length} index${table.indexes.length !== 1 ? 'es' : ''}`}
      </text>
      
      {/* Separator line */}
      <line
        x1="0"
        y1={headerHeight}
        x2={tableWidth}
        y2={headerHeight}
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      
      {/* Columns */}
      {table.columns.length === 0 ? (
        // Empty table case
        <text
          x={tableWidth / 2}
          y={headerHeight + 30}
          fontFamily="monospace"
          fontSize="11"
          fill="#9ca3af"
          textAnchor="middle"
          fontStyle="italic"
        >
          No columns
        </text>
      ) : (
        table.columns.map((column, idx) => {
          const yPos = headerHeight + 10 + (idx * columnHeight);
          
          // Truncate long column names
          const columnName = column.name && column.name.length > 28 
            ? column.name.substring(0, 25) + '...' 
            : (column.name || 'unnamed');
          
          return (
            <g key={column.id || `col-${idx}`}>
              {/* Column background */}
              <rect
                x="0"
                y={yPos - 4}
                width={tableWidth}
                height={columnHeight}
                fill="transparent"
              />
              
              {/* Column name */}
              <text
                x="12"
                y={yPos + 16}
                fontFamily="monospace"
                fontSize="12"
                fontWeight={column.primaryKey ? "600" : "400"}
                fill="#111827"
              >
                {columnName}
              </text>
              
              {/* Data type and constraints on same line */}
              <text
                x={tableWidth - 12}
                y={yPos + 16}
                fontFamily="monospace"
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {column.type || 'VARCHAR'}
                {(column.type === 'VARCHAR' || column.type === 'CHAR') && column.length ? `(${column.length})` : ''}
                {column.type === 'DECIMAL' && column.precision ? `(${column.precision}${column.scale ? `,${column.scale}` : ''})` : ''}
                {!column.nullable && !column.primaryKey && ' NN'}
                {column.unique && !column.primaryKey && ' UQ'}
                {column.autoIncrement && ' AI'}
              </text>
            </g>
          );
        })
      )}
    </g>
  );
}

/**
 * Render FK relationships
 */
function renderRelationships(tables: SchemaTable[]) {
  const relationships: JSX.Element[] = [];
  
  tables.forEach((table, tableIdx) => {
    // Skip if table has no columns
    if (!table.columns || table.columns.length === 0) return;
    
    const tableWidth = calculateTableWidth(table);
    
    table.columns.forEach((column, colIdx) => {
      // Validate references exist
      if (!column.references || !column.references.table) return;
      
      const targetTable = tables.find(t => t.name === column.references?.table);
      
      // Skip if target table not found (orphaned FK)
      if (!targetTable) {
        console.warn(`FK target table "${column.references.table}" not found for ${table.name}.${column.name}`);
        return;
      }
      
      // Skip self-referencing tables (would create arrow to itself)
      if (targetTable.id === table.id) return;
      
      const targetWidth = calculateTableWidth(targetTable);
      
      // Calculate connection points using dynamic widths
      const columnIndex = table.columns.findIndex(c => c.id === column.id);
      const sourceX = table.position.x + tableWidth;
      const sourceY = table.position.y + 70 + (columnIndex >= 0 ? columnIndex : colIdx) * 32 + 16;
      const targetX = targetTable.position.x;
      const targetY = targetTable.position.y + 35;
      
      // Smart path routing
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      
      // Use straight or curved path based on distance and direction
      let path: string;
      if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
        // Close proximity - simple line
        path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      } else if (dx < 0) {
        // Target is to the left - use S-curve
        const midX = sourceX + dx / 2;
        const controlOffset = Math.min(Math.abs(dx) / 3, 100);
        path = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`;
      } else {
        // Target is to the right or below - standard curve
        const midX = (sourceX + targetX) / 2;
        path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
      }
      
      // Generate unique key
      const relationshipKey = `fk-${table.id}-${column.id || colIdx}-${tableIdx}`;
      
      relationships.push(
        <g key={relationshipKey}>
          <path
            d={path}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeOpacity="0.5"
            markerEnd="url(#arrowhead)"
          />
          {/* FK label - only show if path is long enough */}
          {Math.sqrt(dx * dx + dy * dy) > 150 && (
            <text
              x={(sourceX + targetX) / 2}
              y={(sourceY + targetY) / 2 - 5}
              fontFamily="monospace"
              fontSize="10"
              fontWeight="600"
              fill="#ffffff"
              textAnchor="middle"
            >
              <tspan x={(sourceX + targetX) / 2} dy="0" fill="#000000" stroke="#ffffff" strokeWidth="3" paintOrder="stroke">FK</tspan>
              <tspan x={(sourceX + targetX) / 2} dy="0" fill="#000000">FK</tspan>
            </text>
          )}
        </g>
      );
    });
  });
  
  return relationships;
}


/**
 * Main ERD Renderer Component
 */
export function ERDRenderer({ tables, width, height }: ERDRendererProps) {
  // Validate tables array
  const validTables = (tables || []).filter(table => 
    table && 
    table.id && 
    table.position && 
    typeof table.position.x === 'number' && 
    typeof table.position.y === 'number'
  );
  
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definitions */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <polygon points="0 0, 10 5, 0 10" fill="#3b82f6" fillOpacity="0.6" />
        </marker>
      </defs>
      
      {/* White background */}
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      
      {validTables.length === 0 ? (
        // Empty schema message
        <text
          x={width / 2}
          y={height / 2}
          fontFamily="monospace"
          fontSize="16"
          fill="#9ca3af"
          textAnchor="middle"
        >
          No tables to export
        </text>
      ) : (
        <>
          {/* Render relationships first (below tables) */}
          {renderRelationships(validTables)}
          
          {/* Render all tables */}
          {validTables.map(table => renderTable(table, table.position.x, table.position.y))}
        </>
      )}
    </svg>
  );
}

