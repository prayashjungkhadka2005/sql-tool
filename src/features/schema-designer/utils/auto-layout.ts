/**
 * Auto-Layout Utility
 * Automatically arranges tables using graph algorithms
 */

import dagre from 'dagre';
import { SchemaTable } from '../types';

export type LayoutAlgorithm = 'hierarchical' | 'grid' | 'circular';

/**
 * Auto-layout tables using the specified algorithm
 */
export function autoLayoutTables(
  tables: SchemaTable[],
  algorithm: LayoutAlgorithm = 'hierarchical',
  forExport: boolean = false
): SchemaTable[] {
  if (tables.length === 0) return tables;
  
  switch (algorithm) {
    case 'hierarchical':
      return hierarchicalLayout(tables, forExport);
    case 'grid':
      return gridLayout(tables);
    case 'circular':
      return circularLayout(tables);
    default:
      return hierarchicalLayout(tables, forExport);
  }
}

/**
 * Calculate dynamic table width for layout
 */
function getTableWidthForLayout(table: SchemaTable): number {
  let maxWidth = 280;
  
  // Validate table name exists
  if (!table.name) return 280;
  
  const tableName = table.name.length > 40 ? table.name.substring(0, 40) : table.name;
  const tableNameWidth = tableName.length * 8.5 + 40;
  maxWidth = Math.max(maxWidth, tableNameWidth);
  
  // Check each column (if exists)
  if (table.columns && table.columns.length > 0) {
    table.columns.forEach(column => {
      if (!column.name) return;
      
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
  
  return Math.min(Math.max(maxWidth, 280), 500);
}

/**
 * Hierarchical layout using Dagre
 * Tables with dependencies flow from top to bottom
 */
function hierarchicalLayout(tables: SchemaTable[], forExport: boolean = false): SchemaTable[] {
  const g = new dagre.graphlib.Graph();
  
  // Configure graph - wider spacing and center alignment for exports
  g.setGraph({
    rankdir: 'TB', // Top to bottom
    align: forExport ? undefined : 'UL', // Center for export, upper-left for canvas
    nodesep: forExport ? 180 : 100, // Maximum horizontal spacing for export
    ranksep: forExport ? 250 : 200, // More vertical spacing for export
    marginx: forExport ? 80 : 50,
    marginy: forExport ? 80 : 50,
  });
  
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes with dynamic widths
  tables.forEach(table => {
    // Skip tables without ID
    if (!table.id) return;
    
    const tableWidth = getTableWidthForLayout(table);
    const columnCount = table.columns?.length || 0;
    
    g.setNode(table.id, {
      label: table.name || 'Unnamed',
      width: tableWidth, // Dynamic width
      height: Math.max(150, 70 + (columnCount * 32) + 20), // Accurate height
    });
  });
  
  // Add edges (foreign key relationships)
  // Edge direction: parent → child (referenced table → referencing table)
  tables.forEach(table => {
    // Skip tables without ID or columns
    if (!table.id || !table.columns) return;
    
    table.columns.forEach(col => {
      // Validate references exist and have required fields
      if (!col.references || !col.references.table) return;
      
      const targetTable = tables.find(t => t.name === col.references?.table);
      
      // Skip if target not found or has no ID
      if (!targetTable || !targetTable.id) return;
      
      // Skip self-references (would create loop in hierarchy)
      if (targetTable.id === table.id) return;
      
      // Correct direction: parent (referenced) → child (has FK)
      // This ensures parent tables are positioned above child tables
      g.setEdge(targetTable.id, table.id);
    });
  });
  
  // Run layout
  dagre.layout(g);
  
  // Calculate bounding box of all nodes to center the layout
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  tables.forEach(table => {
    if (!table.id) return;
    const node = g.node(table.id);
    if (!node) return;
    
    const nodeLeft = node.x - node.width / 2;
    const nodeRight = node.x + node.width / 2;
    const nodeTop = node.y - node.height / 2;
    const nodeBottom = node.y + node.height / 2;
    
    minX = Math.min(minX, nodeLeft);
    minY = Math.min(minY, nodeTop);
    maxX = Math.max(maxX, nodeRight);
    maxY = Math.max(maxY, nodeBottom);
  });
  
  // Calculate center offset to position layout in center of canvas
  // Assuming canvas viewport is approximately 1200x800 (will be adjusted by fitView)
  const canvasCenterX = 600; // Approximate center of viewport
  const canvasCenterY = 400;
  const layoutWidth = maxX - minX;
  const layoutHeight = maxY - minY;
  const layoutCenterX = minX + layoutWidth / 2;
  const layoutCenterY = minY + layoutHeight / 2;
  
  // Calculate offset to center the layout
  const offsetX = canvasCenterX - layoutCenterX;
  const offsetY = canvasCenterY - layoutCenterY;
  
  // Apply new positions with centering offset
  return tables.map(table => {
    // Skip if table has no ID or wasn't added to graph
    if (!table.id) return table;
    
    const node = g.node(table.id);
    
    // If node wasn't laid out (shouldn't happen), keep original position
    if (!node) {
      console.warn(`Table ${table.name} was not laid out`);
      return table;
    }
    
    return {
      ...table,
      position: {
        x: node.x - node.width / 2 + offsetX,
        y: node.y - node.height / 2 + offsetY,
      },
    };
  });
}

/**
 * Grid layout - simple organized rows and columns
 */
function gridLayout(tables: SchemaTable[]): SchemaTable[] {
  const columns = 3;
  const cellWidth = 400;
  const cellHeight = 300;
  
  // Calculate grid dimensions
  const rows = Math.ceil(tables.length / columns);
  const gridWidth = columns * cellWidth;
  const gridHeight = rows * cellHeight;
  
  // Center the grid on canvas
  const canvasCenterX = 600;
  const canvasCenterY = 400;
  const startX = canvasCenterX - gridWidth / 2 + cellWidth / 2;
  const startY = canvasCenterY - gridHeight / 2 + cellHeight / 2;
  
  return tables.map((table, index) => ({
    ...table,
    position: {
      x: startX + (index % columns) * cellWidth,
      y: startY + Math.floor(index / columns) * cellHeight,
    },
  }));
}

/**
 * Circular layout - arrange tables in a circle
 * Good for showing relationships without hierarchy
 */
function circularLayout(tables: SchemaTable[]): SchemaTable[] {
  // Center the circle on canvas
  const canvasCenterX = 600;
  const canvasCenterY = 400;
  const radius = Math.max(300, tables.length * 50);
  
  // Estimate average table size for centering
  const avgTableWidth = 280;
  const avgTableHeight = 200;
  
  return tables.map((table, index) => {
    const angle = (2 * Math.PI * index) / tables.length - Math.PI / 2; // Start from top
    
    return {
      ...table,
      position: {
        x: canvasCenterX + radius * Math.cos(angle) - avgTableWidth / 2, // Center node
        y: canvasCenterY + radius * Math.sin(angle) - avgTableHeight / 2,
      },
    };
  });
}

