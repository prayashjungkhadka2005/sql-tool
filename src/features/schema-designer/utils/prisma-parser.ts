/**
 * Prisma Schema Parser
 * Parses Prisma schema.prisma into SchemaState
 */

import { SchemaState, SchemaTable, SchemaColumn, SQLDataType } from '../types';

/**
 * Parse Prisma schema
 */
export async function parsePrismaSchema(prisma: string): Promise<SchemaState> {
  const tables: SchemaTable[] = [];
  
  // Extract model blocks
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  const modelMatches = Array.from(prisma.matchAll(modelRegex));
  
  if (modelMatches.length === 0) {
    throw new Error('No Prisma models found. Please check your schema syntax.');
  }
  
  // Parse each model
  let yPosition = 100;
  modelMatches.forEach((match, index) => {
    const modelName = match[1];
    const modelBody = match[2];
    
    const table = parsePrismaModel(modelName, modelBody, index, yPosition);
    tables.push(table);
    
    // Position tables in grid
    yPosition += 200;
    if ((index + 1) % 3 === 0) {
      yPosition = 100;
    }
  });
  
  // Second pass: resolve foreign key relationships
  const tableNameSet = new Set(tables.map(t => t.name.toLowerCase()));
  const invalidFKs: string[] = [];
  
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.comment?.startsWith('FK:')) {
        const fkInfo = col.comment.substring(3).split('.');
        if (fkInfo.length === 2) {
          const refTable = fkInfo[0].toLowerCase();
          
          // Validate FK points to existing table
          if (!tableNameSet.has(refTable)) {
            invalidFKs.push(`${table.name}.${col.name} → ${fkInfo[0]} (model not found)`);
          } else {
            col.references = {
              table: fkInfo[0],
              column: fkInfo[1],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
            };
          }
          col.comment = undefined;
        }
      }
    });
  });
  
  if (invalidFKs.length > 0) {
    throw new Error(`Foreign key references to non-existent models:\n${invalidFKs.join('\n')}\n\nMake sure all referenced models are included in the schema.`);
  }

  // Validate reasonable model count
  if (tables.length > 100) {
    throw new Error(`Schema has ${tables.length} models - maximum supported is 100 models. For very large schemas, consider splitting into multiple schemas or importing in batches.`);
  }

  if (tables.length > 50) {
    console.warn(`Schema has ${tables.length} models - this may impact performance. Consider using auto-layout to organize them.`);
  }

  // VALIDATION LAYER: Schema-level validations
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  // Check 1: Duplicate model names
  const modelNames = tables.map(t => t.name.toLowerCase());
  const duplicates = modelNames.filter((name, index) => modelNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    validationErrors.push(`Duplicate model names: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check 2: Duplicate column names within model
  tables.forEach(table => {
    const colNames = table.columns.map(c => c.name.toLowerCase());
    const dupCols = colNames.filter((name, index) => colNames.indexOf(name) !== index);
    if (dupCols.length > 0) {
      validationErrors.push(`Model "${table.name}" has duplicate field names: ${[...new Set(dupCols)].join(', ')}`);
    }
  });

  // Check 3: Multiple AUTO_INCREMENT per model
  tables.forEach(table => {
    const autoIncrementCols = table.columns.filter(c => c.autoIncrement);
    if (autoIncrementCols.length > 1) {
      validationErrors.push(`Model "${table.name}" has ${autoIncrementCols.length} @default(autoincrement()) fields (${autoIncrementCols.map(c => c.name).join(', ')}). Only one is allowed per model.`);
    }
  });

  // Throw errors if any critical issues found
  if (validationErrors.length > 0) {
    throw new Error(`Prisma schema validation failed:\n\n${validationErrors.join('\n\n')}\n\nPlease fix these issues and try again.`);
  }

  // Log warnings (non-blocking)
  if (validationWarnings.length > 0) {
    console.warn('Prisma schema imported with warnings:');
    validationWarnings.forEach(warn => console.warn(`- ${warn}`));
  }

  return {
    name: 'Imported Prisma Schema',
    description: `Imported ${tables.length} model${tables.length !== 1 ? 's' : ''} from Prisma${validationWarnings.length > 0 ? ` (${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''})` : ''}`,
    tables,
  };
}

/**
 * Parse a single Prisma model
 */
function parsePrismaModel(
  modelName: string,
  modelBody: string,
  index: number,
  yPosition: number
): SchemaTable {
  const columns: SchemaColumn[] = [];
  const indexes: any[] = [];
  
  // Split into lines
  const lines = modelBody.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  
  // Track composite PKs and indexes
  let compositePK: string[] = [];
  
  lines.forEach(line => {
    // Skip block-level attributes
    if (line.startsWith('@@')) {
      // @@id([field1, field2]) - composite PK
      if (line.startsWith('@@id')) {
        const match = line.match(/@@id\(\[([^\]]+)\]\)/);
        if (match) {
          compositePK = match[1].split(',').map(f => f.trim());
        }
      }
      // @@index or @@unique
      else if (line.startsWith('@@index') || line.startsWith('@@unique')) {
        const isUnique = line.startsWith('@@unique');
        const match = line.match(/@@(?:index|unique)\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/);
        if (match) {
          const cols = match[1].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const indexName = match[2] || `idx_${modelName}_${cols.join('_')}`;
          indexes.push({
            id: `idx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: indexName,
            columns: cols,
            type: 'BTREE',
            unique: isUnique,
            comment: 'Imported from Prisma',
          });
        }
      }
      return;
    }
    
    // Parse field definition
    const column = parsePrismaField(line, modelName);
    if (column) {
      columns.push(column);
    }
  });
  
  // Validate model has columns
  if (columns.length === 0) {
    console.warn(`Model "${modelName}" has no fields - skipping`);
    throw new Error(`Model "${modelName}" has no valid fields. Each model must have at least one field.`);
  }

  // Apply composite PK
  if (compositePK.length > 0) {
    columns.forEach(col => {
      if (compositePK.includes(col.name)) {
        col.primaryKey = true;
        col.nullable = false;
        col.autoIncrement = false;
      }
    });
  }

  // Validate at least one primary key exists
  const hasPrimaryKey = columns.some(c => c.primaryKey);
  if (!hasPrimaryKey) {
    console.warn(`Model "${modelName}" has no @id field - consider adding one`);
  }

  return {
    id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${modelName}`,
    name: modelName.toLowerCase(),
    columns,
    indexes: indexes || [], // Initialize empty array
    position: {
      x: 100 + ((index % 3) * 400),
      y: yPosition,
    },
  };
}

/**
 * Parse a Prisma field
 */
function parsePrismaField(line: string, modelName: string): SchemaColumn | null {
  // Field format: name Type @attributes
  const match = line.match(/^(\w+)\s+(\w+)(\??)\s*(.*)/);
  if (!match) return null;
  
  const fieldName = match[1];
  const typeName = match[2];
  const isOptional = match[3] === '?';
  const attributes = match[4];
  
  // Map Prisma type to SQL type
  const typeInfo = mapPrismaTypeToSQL(typeName);
  if (!typeInfo) {
    console.warn(`Unknown Prisma type "${typeName}" for field "${fieldName}" in model "${modelName}" - skipping field`);
    return null;
  }
  
  const column: SchemaColumn = {
    id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${fieldName}`,
    name: fieldName,
    type: typeInfo.type,
    length: typeInfo.length,
    precision: typeInfo.precision,
    scale: typeInfo.scale,
    nullable: isOptional,
    unique: /@unique/i.test(attributes),
    primaryKey: /@id(?!\()/i.test(attributes), // @id but not @@id
    autoIncrement: /@default\s*\(\s*autoincrement\s*\(\s*\)\s*\)/i.test(attributes),
  };
  
  // Extract default value
  const defaultMatch = attributes.match(/@default\s*\(\s*([^)]+)\s*\)/i);
  if (defaultMatch && !column.autoIncrement) {
    let defaultValue = defaultMatch[1].trim();
    // Handle Prisma functions
    if (defaultValue === 'now()') {
      defaultValue = 'NOW()';
    } else if (defaultValue === 'uuid()') {
      column.type = 'UUID';
    } else {
      // Remove quotes
      defaultValue = defaultValue.replace(/^["']|["']$/g, '');
    }
    column.defaultValue = defaultValue;
  }
  
  // Extract foreign key (stored in comment for second pass)
  const relationMatch = attributes.match(/@relation.*?references:\s*\[(\w+)\]/i);
  if (relationMatch) {
    const referencedField = relationMatch[1];
    // Store FK info in comment for second pass (need to find which model this relates to)
    // This is a simplified approach - proper implementation would parse @relation fully
    column.comment = `FK:${typeName}.${referencedField}`;
  }
  
  return column;
}

/**
 * Map Prisma type to SQL type
 */
function mapPrismaTypeToSQL(prismaType: string): {
  type: SQLDataType;
  length?: number;
  precision?: number;
  scale?: number;
} | null {
  const typeMap: Record<string, { type: SQLDataType; length?: number; precision?: number; scale?: number }> = {
    'Int': { type: 'INTEGER' },
    'BigInt': { type: 'BIGINT' },
    'String': { type: 'VARCHAR', length: 255 },
    'Boolean': { type: 'BOOLEAN' },
    'Float': { type: 'FLOAT' },
    'Decimal': { type: 'DECIMAL', precision: 10, scale: 2 },
    'DateTime': { type: 'TIMESTAMP' },
    'Json': { type: 'JSONB' },
    'Bytes': { type: 'BYTEA' },
  };
  
  return typeMap[prismaType] || null;
}

