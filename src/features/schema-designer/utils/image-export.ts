/**
 * ERD Image Export Utility
 * Generates clean ERD diagrams programmatically (not screenshots)
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { getNodesBounds } from 'reactflow';
import type { Node } from 'reactflow';
import type { SchemaTable } from '../types';
import { ERDRenderer } from './erd-renderer';
import { autoLayoutTables } from './auto-layout';

export type ImageFormat = 'png' | 'svg';

export interface ExportImageOptions {
  format: ImageFormat;
  filename: string;
  backgroundColor?: string;
  quality?: number;
  pixelRatio?: number;
}

/**
 * Calculate optimal table width (matches erd-renderer logic)
 */
function getTableWidth(table: SchemaTable): number {
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
 * Calculate canvas dimensions from tables
 */
function calculateCanvasDimensions(tables: SchemaTable[], padding: number = 60) {
  if (!tables || tables.length === 0) {
    return { width: 1200, height: 800, offsetX: 0, offsetY: 0 };
  }

  // Calculate bounds from table positions with dynamic widths
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let validTableCount = 0;
  
  tables.forEach(table => {
    // Skip invalid tables
    if (!table || !table.position || 
        typeof table.position.x !== 'number' || 
        typeof table.position.y !== 'number') {
      return;
    }
    
    validTableCount++;
    const tableWidth = getTableWidth(table);
    const columnCount = table.columns?.length || 0;
    const tableHeight = 70 + (columnCount * 32) + 20;
    
    minX = Math.min(minX, table.position.x);
    minY = Math.min(minY, table.position.y);
    maxX = Math.max(maxX, table.position.x + tableWidth);
    maxY = Math.max(maxY, table.position.y + tableHeight);
  });
  
  // If no valid tables found, return defaults
  if (validTableCount === 0) {
    return { width: 1200, height: 800, offsetX: 0, offsetY: 0 };
  }
  
  const width = (maxX - minX) + (padding * 2);
  const height = (maxY - minY) + (padding * 2);
  
  return {
    width: Math.max(width, 800),
    height: Math.max(height, 600),
    offsetX: minX - padding,
    offsetY: minY - padding
  };
}

/**
 * Normalize table positions for export
 */
function normalizeTablePositions(tables: SchemaTable[], offsetX: number, offsetY: number): SchemaTable[] {
  return tables.map(table => {
    // Validate table has position
    if (!table.position || 
        typeof table.position.x !== 'number' || 
        typeof table.position.y !== 'number') {
      console.warn(`Table ${table.name} has invalid position, using (0, 0)`);
      return {
        ...table,
        position: { x: 0, y: 0 }
      };
    }
    
    return {
      ...table,
      position: {
        x: Math.max(0, table.position.x - offsetX), // Ensure non-negative
        y: Math.max(0, table.position.y - offsetY)
      }
    };
  });
}

/**
 * Generate clean ERD diagram and export as image
 */
export async function exportCanvasAsImage(
  element: HTMLElement,
  tables: SchemaTable[],
  options: ExportImageOptions
): Promise<void> {
  const {
    format,
    filename,
    backgroundColor = '#ffffff',
    quality = 0.95,
    pixelRatio = 2,
  } = options;

  try {
    // Validate input
    if (!tables || tables.length === 0) {
      throw new Error('No tables to export');
    }
    
    // Filter out invalid tables
    const validTables = tables.filter(t => t && t.id && t.position);
    
    if (validTables.length === 0) {
      throw new Error('No valid tables found to export');
    }
    
    // Apply auto-layout with export-optimized spacing (wider horizontal alignment)
    const layoutedTables = autoLayoutTables(validTables, 'hierarchical', true);
    
    // Calculate canvas dimensions based on organized layout
    const { width, height, offsetX, offsetY } = calculateCanvasDimensions(layoutedTables, 60);
    
    // Validate dimensions are reasonable
    if (width < 100 || height < 100 || width > 50000 || height > 50000) {
      throw new Error(`Invalid export dimensions: ${width}x${height}. Please check your schema.`);
    }
    
    // Normalize table positions (start from 0,0 with padding)
    const normalizedTables = normalizeTablePositions(layoutedTables, offsetX ?? 0, offsetY ?? 0);
    
    // Generate clean ERD SVG using React.createElement
    const erdElement = ERDRenderer({
      tables: normalizedTables,
      width,
      height
    });
    
    const svgString = renderToStaticMarkup(erdElement);
    
    // Validate SVG was generated
    if (!svgString || svgString.length < 100) {
      throw new Error('Failed to generate ERD diagram');
    }
    
    if (format === 'svg') {
      // For SVG, download directly
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // For PNG, convert SVG to PNG
      const canvas = document.createElement('canvas');
      
      // Validate dimensions for canvas
      const canvasWidth = Math.min(width * pixelRatio, 32767); // Canvas max size
      const canvasHeight = Math.min(height * pixelRatio, 32767);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context. Your browser may not support this feature.');
      }
      
      // Scale for high DPI
      ctx.scale(pixelRatio, pixelRatio);
      
      // Create image from SVG
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Set timeout for image loading
      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(url);
        throw new Error('Image export timed out. Try with a smaller schema.');
      }, 30000); // 30 second timeout
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          clearTimeout(timeoutId);
          
          try {
            // Draw white background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = filename;
                link.href = pngUrl;
                link.click();
                
                // Clean up
                setTimeout(() => {
                  URL.revokeObjectURL(pngUrl);
                  URL.revokeObjectURL(url);
                }, 100);
                
                resolve(null);
              } else {
                reject(new Error('Failed to create PNG blob. Your browser may not support this feature.'));
              }
            }, 'image/png', quality);
          } catch (error) {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        
        img.onerror = (err) => {
          clearTimeout(timeoutId);
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image. The diagram may be too complex.'));
        };
        
        img.src = url;
      });
    }
  } catch (error) {
    console.error('Failed to export ERD:', error);
    throw new Error('Failed to export ERD diagram. Please try again.');
  }
}

/**
 * Get suggested filename based on schema name
 */
export function getSuggestedFilename(schemaName: string, format: ImageFormat): string {
  const sanitized = schemaName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^\\.+/, '')
    .substring(0, 64)
    .toLowerCase();
  
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = format === 'png' ? 'png' : 'svg';
  
  return `${sanitized || 'schema'}-${timestamp}.${extension}`;
}

