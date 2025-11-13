/**
 * TypeScript Type Generator
 * 
 * Generates TypeScript interfaces and Zod validation schemas from database schema.
 * Unique feature that sets this tool apart from competitors.
 */

import { SchemaState, SchemaTable, SchemaColumn, SQLDataType } from '../types';

/**
 * Map SQL data types to TypeScript types
 */
function mapSQLTypeToTypeScript(column: SchemaColumn): string {
  const baseType = column.type.toUpperCase();
  
  // CRITICAL: BIGINT requires string to preserve precision (JavaScript number max is 2^53)
  if (baseType === 'BIGINT') {
    return 'string'; // Use string for BIGINT to prevent precision loss
  }
  
  // Regular integer types (safe for JavaScript number)
  if (['SMALLINT', 'INTEGER'].includes(baseType)) {
    return 'number';
  }
  
  // DECIMAL/NUMERIC should be string for exact precision (financial data)
  if (['DECIMAL'].includes(baseType)) {
    return 'string'; // Use string for exact decimal precision
  }
  
  // Floating point (approximate)
  if (['FLOAT', 'DOUBLE', 'REAL'].includes(baseType)) {
    return 'number';
  }
  
  // String types
  if (['VARCHAR', 'CHAR', 'TEXT', 'TSVECTOR'].includes(baseType)) {
    return 'string';
  }
  
  // Boolean
  if (baseType === 'BOOLEAN') {
    return 'boolean';
  }
  
  // Date/Time types
  if (['DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ'].includes(baseType)) {
    return 'Date';
  }
  
  // Binary
  if (['BYTEA', 'BLOB'].includes(baseType)) {
    return 'Buffer';
  }
  
  // JSON
  if (['JSON', 'JSONB'].includes(baseType)) {
    return 'Record<string, any>';
  }
  
  // PostgreSQL specific
  if (baseType === 'UUID') {
    return 'string';
  }
  
  if (['INET', 'CIDR'].includes(baseType)) {
    return 'string';
  }
  
  if (baseType === 'ARRAY') {
    return 'any[]';
  }
  
  // Default
  return 'any';
}

/**
 * Map SQL data types to Zod validators
 */
function mapSQLTypeToZod(column: SchemaColumn): string {
  const baseType = column.type.toUpperCase();
  
  // CRITICAL: BIGINT uses string in TypeScript, so Zod should validate string
  if (baseType === 'BIGINT') {
    return 'z.string().regex(/^-?\\d+$/, "Must be a valid integer")';
  }
  
  // SMALLINT has range -32,768 to 32,767
  if (baseType === 'SMALLINT') {
    return 'z.number().int().min(-32768).max(32767)';
  }
  
  // INTEGER has range -2,147,483,648 to 2,147,483,647
  if (baseType === 'INTEGER') {
    return 'z.number().int().min(-2147483648).max(2147483647)';
  }
  
  // DECIMAL/NUMERIC should use string for exact precision
  if (baseType === 'DECIMAL') {
    // Validate decimal format: optional minus, digits, optional decimal point and more digits
    return 'z.string().regex(/^-?\\d+(\\.\\d+)?$/, "Must be a valid decimal number")';
  }
  
  // Floating point (approximate)
  if (['FLOAT', 'DOUBLE', 'REAL'].includes(baseType)) {
    return 'z.number()';
  }
  
  // String types
  if (['VARCHAR', 'CHAR', 'TEXT', 'TSVECTOR'].includes(baseType)) {
    let validator = 'z.string()';
    
    // Smart pattern detection (email, url) - but preserve length constraints
    const colNameLower = column.name.toLowerCase();
    const hasEmail = colNameLower.includes('email');
    const hasUrl = colNameLower.includes('url') || colNameLower.includes('link') || colNameLower.includes('href');
    
    // Add smart validation for common patterns
    if (hasEmail && baseType === 'VARCHAR') {
      validator += '.email()';
    } else if (hasUrl && baseType === 'VARCHAR') {
      validator += '.url()';
    }
    
    // Add length constraints for VARCHAR/CHAR (after smart validators)
    if (baseType === 'VARCHAR' && column.length && !hasEmail && !hasUrl) {
      validator += `.max(${column.length})`;
    } else if (baseType === 'VARCHAR' && column.length && (hasEmail || hasUrl)) {
      // For email/url, length is already validated by format, but add as extra safety
      validator += `.max(${column.length})`;
    }
    
    if (baseType === 'CHAR' && column.length) {
      validator += `.length(${column.length})`;
    }
    
    return validator;
  }
  
  // Boolean
  if (baseType === 'BOOLEAN') {
    return 'z.boolean()';
  }
  
  // Date/Time types
  if (['DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ'].includes(baseType)) {
    return 'z.date()';
  }
  
  // JSON
  if (['JSON', 'JSONB'].includes(baseType)) {
    return 'z.record(z.any())';
  }
  
  // UUID
  if (baseType === 'UUID') {
    return 'z.string().uuid()';
  }
  
  // Binary data
  if (['BYTEA', 'BLOB'].includes(baseType)) {
    return 'z.instanceof(Buffer)';
  }
  
  // Network addresses
  if (baseType === 'INET' || baseType === 'CIDR') {
    // Basic IP address validation pattern
    return 'z.string().regex(/^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}/, "Must be a valid IP address")';
  }
  
  // Arrays
  if (baseType === 'ARRAY') {
    return 'z.array(z.any())';
  }
  
  // Default
  return 'z.any()';
}

/**
 * Generate TypeScript interfaces from schema
 */
export function generateTypeScriptInterfaces(schema: SchemaState): string {
  const lines: string[] = [];
  
  // Validate schema
  if (schema.tables.length === 0) {
    lines.push('// No tables defined in schema');
    lines.push('// Add tables to your schema to generate TypeScript interfaces');
    return lines.join('\n');
  }
  
  // Header
  lines.push('/**');
  lines.push(` * Database Schema: ${schema.name || 'Schema'}`);
  lines.push(' * Auto-generated TypeScript interfaces');
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(' *');
  lines.push(' * Note: BIGINT and DECIMAL types are mapped to string to preserve precision.');
  lines.push(' * Foreign key relationships are documented in comments.');
  lines.push(' */');
  lines.push('');
  
  // Generate interface for each table
  for (const table of schema.tables) {
    // Skip tables with no columns
    if (table.columns.length === 0) {
      lines.push(`// Warning: Table "${table.name}" has no columns defined`);
      lines.push('');
      continue;
    }
    // Table interface
    lines.push(`/**`);
    lines.push(` * ${table.name} table`);
    lines.push(` */`);
    lines.push(`export interface ${toPascalCase(table.name)} {`);
    
    for (const column of table.columns) {
      const tsType = mapSQLTypeToTypeScript(column);
      const optional = column.nullable || column.defaultValue ? '?' : '';
      
      // Build comprehensive comment
      const comments: string[] = [];
      if (column.comment) comments.push(column.comment);
      if (column.references) {
        comments.push(`FK → ${column.references.table}.${column.references.column}`);
      }
      if (column.unique && !column.primaryKey) comments.push('UNIQUE');
      if (column.primaryKey) comments.push('PRIMARY KEY');
      
      const comment = comments.length > 0 ? ` // ${comments.join(' | ')}` : '';
      
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    
    lines.push('}');
    lines.push('');
    
    // Generate helper types
    const pkColumns = table.columns.filter(c => c.primaryKey).map(c => c.name);
    
    // For CreateInput, only omit truly auto-generated fields:
    // - AUTO_INCREMENT columns (database generates these)
    // - Columns with default values that are functions (NOW(), etc.)
    const autoGenColumns = table.columns.filter(c => {
      if (c.autoIncrement) return true;
      if (c.defaultValue) {
        const val = c.defaultValue.toLowerCase();
        // Omit function-based defaults, but keep literal defaults (users might want to override)
        return val.includes('()') || val === 'now' || val === 'current_timestamp';
      }
      return false;
    }).map(c => c.name);
    
    if (autoGenColumns.length > 0) {
      // CreateInput (omit auto-generated fields)
      lines.push(`export type ${toPascalCase(table.name)}CreateInput = Omit<${toPascalCase(table.name)}, ${autoGenColumns.map(c => `'${c}'`).join(' | ')}>;`);
      lines.push('');
    }
    
    // UpdateInput (all fields optional except PK)
    const nonPKFields = table.columns.filter(c => !c.primaryKey).map(c => c.name);
    if (nonPKFields.length > 0) {
      lines.push(`export type ${toPascalCase(table.name)}UpdateInput = Partial<Pick<${toPascalCase(table.name)}, ${nonPKFields.map(c => `'${c}'`).join(' | ')}>>;`);
      lines.push('');
    }
    
    // Primary key type
    if (pkColumns.length > 0) {
      lines.push(`export type ${toPascalCase(table.name)}PrimaryKey = Pick<${toPascalCase(table.name)}, ${pkColumns.map(c => `'${c}'`).join(' | ')}>;`);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Zod validation schemas
 */
export function generateZodSchemas(schema: SchemaState): string {
  const lines: string[] = [];
  
  // Validate schema
  if (schema.tables.length === 0) {
    lines.push('// No tables defined in schema');
    lines.push('// Add tables to your schema to generate Zod validation schemas');
    return lines.join('\n');
  }
  
  // Header
  lines.push('/**');
  lines.push(` * Database Schema: ${schema.name || 'Schema'}`);
  lines.push(' * Auto-generated Zod validation schemas');
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(' *');
  lines.push(' * Note: Install zod with: npm install zod');
  lines.push(' * BIGINT and DECIMAL use string validation for precision.');
  lines.push(' * UNIQUE constraints are documented in comments.');
  lines.push(' */');
  lines.push('');
  lines.push("import { z } from 'zod';");
  lines.push('');
  
  // Generate schema for each table
  for (const table of schema.tables) {
    // Skip tables with no columns
    if (table.columns.length === 0) {
      lines.push(`// Warning: Table "${table.name}" has no columns defined`);
      lines.push('');
      continue;
    }
    lines.push(`/**`);
    lines.push(` * ${table.name} validation schema`);
    lines.push(` */`);
    lines.push(`export const ${toCamelCase(table.name)}Schema = z.object({`);
    
    for (const column of table.columns) {
      let validator = mapSQLTypeToZod(column);
      
      // Add default value if specified (for common patterns)
      if (column.defaultValue && !column.autoIncrement) {
        const defaultVal = column.defaultValue.toLowerCase();
        
        // Handle common default value patterns
        if (defaultVal === 'true' || defaultVal === 'false') {
          validator += `.default(${defaultVal})`;
        } else if (defaultVal.match(/^-?\d+(\.\d+)?$/)) {
          // Numeric default
          validator += `.default(${defaultVal})`;
        } else if (defaultVal === 'now()' || defaultVal === 'current_timestamp') {
          validator += '.default(() => new Date())';
        } else if (!defaultVal.includes('()')) {
          // String literal (not a function call)
          validator += `.default("${column.defaultValue.replace(/"/g, '\\"')}")`;
        }
      }
      
      // Add optional/nullable
      if (column.nullable) {
        validator += '.nullable()';
      } else if (column.defaultValue || column.autoIncrement) {
        validator += '.optional()';
      }
      
      const comment = column.comment ? ` // ${column.comment}` : '';
      const uniqueHint = column.unique ? ' (unique)' : '';
      lines.push(`  ${column.name}: ${validator},${comment}${uniqueHint}`);
    }
    
    lines.push('});');
    lines.push('');
    
    // Generate TypeScript type from Zod schema
    lines.push(`export type ${toPascalCase(table.name)} = z.infer<typeof ${toCamelCase(table.name)}Schema>;`);
    lines.push('');
    
    // Generate helper schemas
    // Only omit truly auto-generated fields (same logic as TypeScript interfaces)
    const autoGenColumns = table.columns.filter(c => {
      if (c.autoIncrement) return true;
      if (c.defaultValue) {
        const val = c.defaultValue.toLowerCase();
        return val.includes('()') || val === 'now' || val === 'current_timestamp';
      }
      return false;
    }).map(c => c.name);
    
    if (autoGenColumns.length > 0) {
      // Create schema (omit auto-generated fields)
      lines.push(`export const ${toCamelCase(table.name)}CreateSchema = ${toCamelCase(table.name)}Schema.omit({`);
      for (const col of autoGenColumns) {
        lines.push(`  ${col}: true,`);
      }
      lines.push('});');
      lines.push('');
      lines.push(`export type ${toPascalCase(table.name)}CreateInput = z.infer<typeof ${toCamelCase(table.name)}CreateSchema>;`);
      lines.push('');
    }
    
    // Update schema (all fields optional)
    lines.push(`export const ${toCamelCase(table.name)}UpdateSchema = ${toCamelCase(table.name)}Schema.partial();`);
    lines.push('');
    lines.push(`export type ${toPascalCase(table.name)}UpdateInput = z.infer<typeof ${toCamelCase(table.name)}UpdateSchema>;`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Convert snake_case or kebab-case to PascalCase
 * Handles edge cases: numbers, special characters, spaces
 */
function toPascalCase(str: string): string {
  // Remove special characters (except underscore and hyphen) and trim
  const cleaned = str.replace(/[^a-zA-Z0-9_-\s]/g, '').trim();
  
  // If empty after cleaning, return a default name
  if (!cleaned) return 'UnnamedTable';
  
  // Split by common delimiters (underscore, hyphen, space) and convert to PascalCase
  const words = cleaned.split(/[-_\s]+/);
  
  return words
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert snake_case or kebab-case to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  
  // Ensure first character is lowercase
  if (!pascal) return 'unnamedTable';
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

