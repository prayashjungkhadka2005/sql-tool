/**
 * Export utilities for SQL Query Builder
 * Converts query results to various formats
 */

/**
 * Convert data to CSV format
 */
export function exportToCSV(data: any[], filename: string = 'query-results.csv'): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value == null) return '';
      
      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [csvHeaders, ...csvRows].join('\n');
  
  // Download file
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Convert data to JSON format
 */
export function exportToJSON(data: any[], filename: string = 'query-results.json'): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Convert data to SQL INSERT statements
 */
export function exportToSQL(data: any[], tableName: string = 'table', filename: string = 'query-results.sql'): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  
  const sqlStatements = data.map(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle null
      if (value == null) return 'NULL';
      
      // Handle booleans
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      
      // Handle numbers
      if (typeof value === 'number') return String(value);
      
      // Handle strings (escape single quotes)
      return `'${String(value).replace(/'/g, "''")}'`;
    }).join(', ');
    
    return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values});`;
  });
  
  const sql = sqlStatements.join('\n');
  downloadFile(sql, filename, 'text/plain');
}

/**
 * Copy data to clipboard as formatted table
 */
export async function copyAsTable(data: any[]): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to copy');
  }

  const headers = Object.keys(data[0]);
  
  // Calculate column widths
  const widths = headers.map(header => {
    const headerWidth = header.length;
    const maxDataWidth = Math.max(
      ...data.map(row => String(row[header] ?? '').length)
    );
    return Math.max(headerWidth, maxDataWidth);
  });
  
  // Create separator line
  const separator = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  
  // Create header row
  const headerRow = '|' + headers.map((h, i) => ` ${h.padEnd(widths[i])} `).join('|') + '|';
  
  // Create data rows
  const dataRows = data.map(row => {
    return '|' + headers.map((h, i) => {
      const value = String(row[h] ?? '');
      return ` ${value.padEnd(widths[i])} `;
    }).join('|') + '|';
  });
  
  // Combine all
  const table = [separator, headerRow, separator, ...dataRows, separator].join('\n');
  
  await navigator.clipboard.writeText(table);
}

/**
 * Copy data to clipboard as JSON
 */
export async function copyAsJSON(data: any[]): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to copy');
  }

  const json = JSON.stringify(data, null, 2);
  await navigator.clipboard.writeText(json);
}

/**
 * Copy data to clipboard as CSV
 */
export async function copyAsCSV(data: any[]): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to copy');
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value == null) return '';
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  const csv = [csvHeaders, ...csvRows].join('\n');
  await navigator.clipboard.writeText(csv);
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

