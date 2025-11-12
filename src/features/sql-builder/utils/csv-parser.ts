/**
 * CSV Parser Utility
 * Handles CSV file parsing and data type detection
 */

export interface ParsedCSV {
  tableName: string;
  columns: {
    name: string;
    type: 'INTEGER' | 'VARCHAR' | 'TEXT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP';
    nullable: boolean;
  }[];
  data: Record<string, any>[];
  rowCount: number;
}

/**
 * Parse CSV file to structured data
 */
export async function parseCSVFile(file: File): Promise<ParsedCSV> {
  // Check if File API is supported
  if (typeof File === 'undefined' || typeof FileReader === 'undefined') {
    throw new Error('File upload is not supported in your browser. Please use a modern browser.');
  }
  
  try {
    const text = await file.text();
    
    // Get clean filename (remove extension and path)
    let filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Remove path if present (handles both / and \ separators)
    const pathParts = filename.split(/[/\\]/);
    filename = pathParts[pathParts.length - 1] || 'uploaded_data';
    
    return parseCSVText(text, filename);
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    }
    throw new Error('Failed to read file. The file may be corrupted or too large.');
  }
}

/**
 * Parse CSV text content
 * Properly handles multi-line quoted values
 */
export function parseCSVText(csvText: string, tableName: string = 'uploaded_data'): ParsedCSV {
  // Remove BOM (Byte Order Mark) if present
  const cleanText = csvText.replace(/^\uFEFF/, '');
  
  if (!cleanText || cleanText.trim() === '') {
    throw new Error('CSV file is empty');
  }
  
  // Check if this might be semicolon or tab-delimited (check first 500 chars)
  const sample = cleanText.substring(0, 500);
  const commaCount = (sample.match(/,/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  
  if (semicolonCount > commaCount && semicolonCount > 0) {
    throw new Error('Semicolon-delimited files are not supported. Please use comma-delimited CSV.');
  }
  
  if (tabCount > commaCount && tabCount > 0) {
    throw new Error('Tab-delimited files (TSV) are not supported. Please use comma-delimited CSV.');
  }
  
  // Validate minimum columns (at least 1 comma or it's not a CSV)
  if (commaCount === 0 && semicolonCount === 0 && tabCount === 0) {
    throw new Error('Invalid CSV format. File must have at least 2 columns separated by commas.');
  }

  // Parse CSV into rows (properly handles multi-line quoted values)
  const rows = parseCSVRows(cleanText.trim());
  
  if (rows.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = rows[0];
  
  if (headers.length === 0) {
    throw new Error('CSV file has no columns');
  }
  
  // Check for too many columns (browser performance limit)
  if (headers.length > 100) {
    throw new Error('CSV has too many columns (max 100). Please reduce columns and try again.');
  }

  // SQL reserved keywords that should be avoided as column names
  const SQL_KEYWORDS = new Set([
    'select', 'from', 'where', 'and', 'or', 'not', 'in', 'like', 'between',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'drop',
    'join', 'inner', 'left', 'right', 'full', 'outer', 'on', 'using',
    'group', 'by', 'having', 'order', 'asc', 'desc', 'limit', 'offset',
    'distinct', 'as', 'is', 'null', 'exists', 'case', 'when', 'then', 'else',
    'end', 'union', 'all', 'table', 'index', 'key', 'primary', 'foreign',
    'unique', 'constraint', 'default', 'check', 'references', 'cascade'
  ]);
  
  // Clean and validate column names
  const cleanHeaders = headers.map((header, index) => {
    // Trim and check if empty
    let cleaned = header.trim();
    
    // If empty header, use default name
    if (!cleaned) {
      return `column_${index + 1}`;
    }
    
    // Replace special characters with underscores
    cleaned = cleaned.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // If starts with number or is empty after cleaning, prefix with column_
    if (!cleaned || /^\d/.test(cleaned)) {
      cleaned = `column_${index + 1}`;
    }
    
    // Truncate very long column names
    if (cleaned.length > 64) {
      cleaned = cleaned.substring(0, 64);
    }
    
    // Convert to lowercase
    const lowerCleaned = cleaned.toLowerCase();
    
    // If it's a SQL keyword, append _col suffix
    if (SQL_KEYWORDS.has(lowerCleaned)) {
      return `${lowerCleaned}_col`;
    }
    
    return lowerCleaned;
  });

  // Check for duplicate column names and fix them
  const finalHeaders: string[] = [];
  const seenHeaders = new Set<string>();
  
  cleanHeaders.forEach((header, index) => {
    let uniqueHeader = header;
    let counter = 1;
    
    // If duplicate, add number suffix until unique
    while (seenHeaders.has(uniqueHeader)) {
      uniqueHeader = `${header}_${counter}`;
      counter++;
    }
    
    seenHeaders.add(uniqueHeader);
    finalHeaders.push(uniqueHeader);
  });

  // Parse data rows
  const data: Record<string, any>[] = [];
  let malformedRowCount = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    
    if (values.length === 0) continue; // Skip empty rows
    
    // Skip rows that are all empty
    if (values.every(v => !v || v.trim() === '')) continue;
    
    // Warn about rows with mismatched column count (but still process them)
    if (values.length !== finalHeaders.length) {
      malformedRowCount++;
      if (malformedRowCount === 1) {
        console.warn(`Row ${i + 1} has ${values.length} columns but expected ${finalHeaders.length}. Missing columns will be NULL.`);
      }
    }
    
    const row: Record<string, any> = {};
    
    finalHeaders.forEach((header, index) => {
      let value = values[index] || null;
      
      // Truncate very long values (>10000 chars) to prevent memory issues
      if (value && typeof value === 'string' && value.length > 10000) {
        value = value.substring(0, 10000) + '... (truncated)';
      }
      
      row[header] = value === '' || value === null ? null : value;
    });
    
    data.push(row);
  }
  
  // Log summary if there were malformed rows
  if (malformedRowCount > 0) {
    console.warn(`${malformedRowCount} row(s) had mismatched column counts. Missing values set to NULL.`);
  }

  if (data.length === 0) {
    throw new Error('CSV file contains no data rows (only headers found)');
  }
  
  // Check row count limits
  if (data.length > 50000) {
    throw new Error(`CSV has too many rows (${data.length}). Maximum is 50,000 rows. Please filter or split your data.`);
  }
  
  if (data.length > 10000) {
    console.warn(`Large CSV detected: ${data.length} rows. Performance may be affected.`);
  }
  
  // Estimate memory usage (rough calculation)
  const estimatedSize = JSON.stringify(data).length;
  const estimatedMB = estimatedSize / (1024 * 1024);
  
  if (estimatedMB > 50) {
    throw new Error(`CSV data is too large (${estimatedMB.toFixed(1)}MB in memory). Maximum is 50MB. Please reduce data size.`);
  }

  // Detect column types
  const columns = finalHeaders.map(header => ({
    name: header,
    type: detectColumnType(data, header),
    nullable: hasNullValues(data, header),
  }));

  // Convert data to appropriate types
  const typedData = data.map(row => {
    const typedRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = row[col.name];
      typedRow[col.name] = convertValue(value, col.type);
    });
    return typedRow;
  });

  return {
    tableName: sanitizeTableName(tableName),
    columns,
    data: typedData,
    rowCount: typedData.length,
  };
}

/**
 * Parse entire CSV text into rows, properly handling multi-line quoted values
 * This respects quotes and only splits rows at newlines that are NOT inside quotes
 */
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote ("") - add one quote to field
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes) {
      // Outside quotes - check for field/row delimiters
      if (char === ',') {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        // End of row
        currentRow.push(currentField.trim());
        
        // Only add non-empty rows
        if (currentRow.length > 0 && !currentRow.every(f => f === '')) {
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentField = '';
        
        // Skip \r\n together
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        continue;
      }

      if (char === '\r') {
        // Handle lone \r as row delimiter
        currentRow.push(currentField.trim());
        
        if (currentRow.length > 0 && !currentRow.every(f => f === '')) {
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentField = '';
        i++;
        continue;
      }
    }

    // Add character to current field (including newlines if inside quotes)
    currentField += char;
    i++;
  }

  // Handle last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 && !currentRow.every(f => f === '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 * DEPRECATED: Use parseCSVRows for proper multi-line support
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());
  
  // Warning: if still in quotes at end, there's an unclosed quote
  // But we'll still return the result (be lenient)
  if (inQuotes) {
    console.warn('CSV line has unclosed quote, but parsing anyway');
  }

  return result;
}

/**
 * Detect column data type from sample values
 */
function detectColumnType(
  data: Record<string, any>[],
  columnName: string
): 'INTEGER' | 'VARCHAR' | 'TEXT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' {
  // Sample first 100 non-null values
  const sample = data
    .slice(0, 100)
    .map(row => row[columnName])
    .filter(val => val !== null && val !== '');

  if (sample.length === 0) return 'VARCHAR';

  // Check for boolean
  const booleanPattern = /^(true|false|yes|no|1|0|t|f|y|n)$/i;
  if (sample.every(val => booleanPattern.test(String(val)))) {
    return 'BOOLEAN';
  }

  // Check for integer (at least 80% must be integers to classify as INTEGER)
  const integerCount = sample.filter(val => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num);
  }).length;
  
  if (integerCount / sample.length >= 0.8) {
    return 'INTEGER';
  }

  // Check for date/timestamp
  const datePattern = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/;
  const simpleDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  const allTimestamps = sample.every(val => datePattern.test(String(val)));
  if (allTimestamps) return 'TIMESTAMP';
  
  const allDates = sample.every(val => simpleDatePattern.test(String(val)));
  if (allDates) return 'DATE';

  // Check for text (long strings)
  const avgLength = sample.reduce((sum, val) => sum + String(val).length, 0) / sample.length;
  if (avgLength > 100) return 'TEXT';

  // Default to VARCHAR
  return 'VARCHAR';
}

/**
 * Check if column has null values
 */
function hasNullValues(data: Record<string, any>[], columnName: string): boolean {
  return data.some(row => {
    const value = row[columnName];
    return value === null || value === '' || value === undefined;
  });
}

/**
 * Convert value to appropriate type
 */
function convertValue(value: any, type: string): any {
  if (value === null || value === '' || value === undefined) {
    return null;
  }

  switch (type) {
    case 'INTEGER': {
      const num = parseInt(String(value), 10);
      // If parsing fails, return 0 instead of NaN
      return isNaN(num) ? 0 : num;
    }
    
    case 'BOOLEAN': {
      const str = String(value).toLowerCase();
      return ['true', 'yes', '1', 't', 'y'].includes(str);
    }
    
    case 'DATE':
    case 'TIMESTAMP':
      return String(value);
    
    default:
      return String(value);
  }
}

/**
 * Sanitize table name for SQL compatibility
 * Adds csv_ prefix to avoid conflicts with mock tables
 */
function sanitizeTableName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1'); // Prefix with _ if starts with number
  
  // Add csv_ prefix to avoid conflicts with demo tables
  return `csv_${cleaned}`;
}

/**
 * Validate CSV file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const validExtensions = ['.csv', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload a CSV file.' 
    };
  }

  // Check file size (max 10MB for browser processing)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'File too large. Maximum size is 10MB.' 
    };
  }

  if (file.size === 0) {
    return { 
      valid: false, 
      error: 'File is empty.' 
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

