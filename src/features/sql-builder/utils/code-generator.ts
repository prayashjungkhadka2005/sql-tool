/**
 * Code Generator Utility
 * Converts SQL queries to ORM code (Prisma, TypeORM, Sequelize, etc.)
 */

import { QueryState } from "../types";

export type ORMType = 'prisma' | 'typeorm' | 'sequelize' | 'mongoose' | 'drizzle';

/**
 * Generate ORM code from query state
 */
export function generateORMCode(queryState: QueryState, orm: ORMType): string {
  switch (orm) {
    case 'prisma':
      return generatePrismaCode(queryState);
    case 'typeorm':
      return generateTypeORMCode(queryState);
    case 'sequelize':
      return generateSequelizeCode(queryState);
    case 'mongoose':
      return generateMongooseCode(queryState);
    case 'drizzle':
      return generateDrizzleCode(queryState);
    default:
      return '';
  }
}

/**
 * Generate Prisma code
 */
function generatePrismaCode(state: QueryState): string {
  if (!state.table) return '';
  
  // Validate state has minimum requirements
  if (!state.queryType) return '';
  
  const modelName = toPascalCase(state.table);
  const lines: string[] = [];
  
  if (state.queryType === 'SELECT') {
    // Check if this is an aggregate query with GROUP BY
    const hasAggregates = state.aggregates && state.aggregates.length > 0;
    const hasGroupBy = state.groupBy && state.groupBy.length > 0;
    const hasJoins = state.joins && state.joins.length > 0;
    
    if (hasAggregates && hasGroupBy) {
      // Use groupBy API for aggregation
      lines.push(`await prisma.${state.table}.groupBy({`);
      
      // GROUP BY columns
      lines.push(`  by: [${state.groupBy.map(col => {
        const cleanCol = col.split('.').pop() || col;
        return `'${cleanCol}'`;
      }).join(', ')}],`);
      
      // Aggregate functions
      state.aggregates.forEach(agg => {
        const func = agg.function.toLowerCase();
        const col = agg.column === '*' ? undefined : (agg.column.split('.').pop() || agg.column);
        
        if (func === 'count') {
          if (col && col !== '*') {
            lines.push(`  _count: {`);
            lines.push(`    ${col}: true,`);
            lines.push(`  },`);
          } else {
            lines.push(`  _count: true,`);
          }
        } else if (func === 'sum' && col) {
          lines.push(`  _sum: {`);
          lines.push(`    ${col}: true,`);
          lines.push(`  },`);
        } else if (func === 'avg' && col) {
          lines.push(`  _avg: {`);
          lines.push(`    ${col}: true,`);
          lines.push(`  },`);
        } else if (func === 'min' && col) {
          lines.push(`  _min: {`);
          lines.push(`    ${col}: true,`);
          lines.push(`  },`);
        } else if (func === 'max' && col) {
          lines.push(`  _max: {`);
          lines.push(`    ${col}: true,`);
          lines.push(`  },`);
        }
      });
      
      // WHERE conditions (pre-aggregation)
      if (state.whereConditions && state.whereConditions.length > 0) {
        lines.push(`  where: {`);
        state.whereConditions.forEach((cond, idx) => {
          const col = cond.column.split('.').pop() || cond.column;
          const operator = prismaOperator(cond.operator);
          const value = formatPrismaValue(cond.value, cond.operator);
          
          if (idx === 0) {
            lines.push(`    ${col}: { ${operator}: ${value} },`);
          } else if (cond.conjunction === 'AND') {
            lines.push(`    ${col}: { ${operator}: ${value} },`);
          }
        });
        lines.push(`  },`);
      }
      
      // HAVING (post-aggregation filters)
      if (state.having && state.having.length > 0) {
        lines.push(`  having: {`);
        state.having.forEach(h => {
          const func = h.function.toLowerCase();
          const col = h.column.split('.').pop() || h.column;
          const operator = prismaOperator(h.operator);
          const value = h.value;
          
          lines.push(`    ${col}: {`);
          lines.push(`      _${func}: { ${operator}: ${value} }`);
          lines.push(`    },`);
        });
        lines.push(`  },`);
      }
      
      // ORDER BY
      if (state.orderBy && state.orderBy.length > 0) {
        const orderCol = state.orderBy[0].column.split('.').pop() || state.orderBy[0].column;
        const direction = state.orderBy[0].direction.toLowerCase();
        
        // Check if ordering by aggregate
        const isAggregateOrder = state.aggregates.some(agg => 
          agg.alias === orderCol || agg.column.split('.').pop() === orderCol
        );
        
        if (isAggregateOrder) {
          const agg = state.aggregates.find(a => a.alias === orderCol || a.column.split('.').pop() === orderCol);
          if (agg) {
            const func = agg.function.toLowerCase();
            const col = agg.column === '*' ? undefined : (agg.column.split('.').pop() || agg.column);
            if (col) {
              lines.push(`  orderBy: {`);
              lines.push(`    _${func}: {`);
              lines.push(`      ${col}: '${direction}'`);
              lines.push(`    }`);
              lines.push(`  },`);
            }
          }
        } else {
          lines.push(`  orderBy: { ${orderCol}: '${direction}' },`);
        }
      }
      
      // LIMIT
      if (state.limit) {
        lines.push(`  take: ${state.limit},`);
      }
      
      // OFFSET
      if (state.offset) {
        lines.push(`  skip: ${state.offset},`);
      }
      
      lines.push(`})`);
      
      // Add note about JOINs if present
      if (hasJoins) {
        lines.push(``);
        lines.push(`// Note: Prisma groupBy doesn't support joins directly.`);
        lines.push(`// Consider using raw SQL or restructure with include:`);
        lines.push(`// await prisma.$queryRaw\`...\``);
      }
    } else {
      // Regular findMany query
      lines.push(`await prisma.${state.table}.findMany({`);
      
      // Include for JOINs
      if (hasJoins) {
        lines.push(`  include: {`);
        state.joins.forEach(join => {
          const relationName = join.table;
          lines.push(`    ${relationName}: true,`);
        });
        lines.push(`  },`);
      }
      
      // Select specific columns
      if (state.columns && state.columns.length > 0 && !state.columns.includes('*')) {
        lines.push(`  select: {`);
        state.columns.forEach(col => {
          const cleanCol = col.split('.').pop() || col;
          // Sanitize column names for valid JavaScript
          const safeCol = cleanCol.replace(/[^a-zA-Z0-9_]/g, '_');
          lines.push(`    ${safeCol}: true,`);
        });
        
        // Add _count for JOINs if needed
        if (hasJoins && hasAggregates) {
          state.joins.forEach(join => {
            lines.push(`    _count: {`);
            lines.push(`      select: { ${join.table}: true }`);
            lines.push(`    },`);
          });
        }
        
        lines.push(`  },`);
      }
      
      // WHERE conditions
      if (state.whereConditions && state.whereConditions.length > 0) {
        lines.push(`  where: {`);
        state.whereConditions.forEach((cond, idx) => {
          const col = cond.column.split('.').pop() || cond.column;
          const operator = prismaOperator(cond.operator);
          const value = formatPrismaValue(cond.value, cond.operator);
          
          if (idx === 0) {
            lines.push(`    ${col}: { ${operator}: ${value} },`);
          } else if (cond.conjunction === 'AND') {
            lines.push(`    ${col}: { ${operator}: ${value} },`);
          }
        });
        lines.push(`  },`);
      }
      
      // ORDER BY
      if (state.orderBy && state.orderBy.length > 0) {
        if (state.orderBy.length === 1) {
          const col = state.orderBy[0].column.split('.').pop() || state.orderBy[0].column;
          lines.push(`  orderBy: { ${col}: '${state.orderBy[0].direction.toLowerCase()}' },`);
        } else {
          lines.push(`  orderBy: [`);
          state.orderBy.forEach(order => {
            const col = order.column.split('.').pop() || order.column;
            lines.push(`    { ${col}: '${order.direction.toLowerCase()}' },`);
          });
          lines.push(`  ],`);
        }
      }
      
      // LIMIT
      if (state.limit) {
        lines.push(`  take: ${state.limit},`);
      }
      
      // OFFSET
      if (state.offset) {
        lines.push(`  skip: ${state.offset},`);
      }
      
      lines.push(`})`);
    }
  } else if (state.queryType === 'INSERT') {
    lines.push(`await prisma.${state.table}.create({`);
    lines.push(`  data: {`);
    Object.entries(state.insertValues).forEach(([key, value]) => {
      lines.push(`    ${key}: ${formatPrismaValue(value)},`);
    });
    lines.push(`  }`);
    lines.push(`})`);
  }
  
  return lines.join('\n');
}

/**
 * Generate TypeORM code
 */
function generateTypeORMCode(state: QueryState): string {
  if (!state.table) return '';
  
  const className = toPascalCase(state.table);
  const repoName = toCamelCase(state.table) + 'Repository';
  const lines: string[] = [];
  
  if (state.queryType === 'SELECT') {
    const hasAggregates = state.aggregates && state.aggregates.length > 0;
    const hasGroupBy = state.groupBy && state.groupBy.length > 0;
    const hasJoins = state.joins && state.joins.length > 0;
    
    // Use QueryBuilder for aggregates, GROUP BY, or JOINs
    if (hasAggregates || hasGroupBy || hasJoins) {
      lines.push(`await ${repoName}`);
      lines.push(`  .createQueryBuilder('${state.table}')`);
      
      // JOINs
      if (hasJoins) {
        state.joins.forEach(join => {
          const joinType = join.type.toLowerCase() + 'Join';
          const leftCol = join.onLeft.replace(`${state.table}.`, '');
          const rightCol = join.onRight.replace(`${join.table}.`, '');
          lines.push(`  .${joinType}('${state.table}.${join.table}', '${join.table}')`);
        });
      }
      
      // SELECT columns
      if (state.columns && state.columns.length > 0 && !state.columns.includes('*')) {
        const selectCols = state.columns.map(col => {
          const [table, column] = col.includes('.') ? col.split('.') : [state.table, col];
          return `'${table}.${column}'`;
        }).join(', ');
        lines.push(`  .select([${selectCols}])`);
      }
      
      // Aggregates
      if (hasAggregates) {
        state.aggregates.forEach(agg => {
          const func = agg.function.toUpperCase();
          const col = agg.column === '*' ? '*' : agg.column;
          const alias = agg.alias || `${func.toLowerCase()}_${col.split('.').pop()}`;
          lines.push(`  .addSelect('${func}(${col})', '${alias}')`);
        });
      }
      
      // WHERE
      if (state.whereConditions && state.whereConditions.length > 0) {
        state.whereConditions.forEach((cond, idx) => {
          const col = cond.column;
          const paramName = `param${idx}`;
          if (idx === 0) {
            lines.push(`  .where('${col} ${typeormOperator(cond.operator)} :${paramName}', { ${paramName}: ${formatTypeORMValue(cond.value, cond.operator)} })`);
          } else if (cond.conjunction === 'AND') {
            lines.push(`  .andWhere('${col} ${typeormOperator(cond.operator)} :${paramName}', { ${paramName}: ${formatTypeORMValue(cond.value, cond.operator)} })`);
          } else {
            lines.push(`  .orWhere('${col} ${typeormOperator(cond.operator)} :${paramName}', { ${paramName}: ${formatTypeORMValue(cond.value, cond.operator)} })`);
          }
        });
      }
      
      // GROUP BY
      if (hasGroupBy) {
        const groupCols = state.groupBy.join(', ');
        lines.push(`  .groupBy('${groupCols}')`);
      }
      
      // HAVING
      if (state.having && state.having.length > 0) {
        state.having.forEach((h, idx) => {
          const func = h.function.toUpperCase();
          const col = h.column;
          const op = typeormOperator(h.operator);
          if (idx === 0) {
            lines.push(`  .having('${func}(${col}) ${op} ${h.value}')`);
          } else {
            lines.push(`  .andHaving('${func}(${col}) ${op} ${h.value}')`);
          }
        });
      }
      
      // ORDER BY
      if (state.orderBy && state.orderBy.length > 0) {
        state.orderBy.forEach((order, idx) => {
          if (idx === 0) {
            lines.push(`  .orderBy('${order.column}', '${order.direction}')`);
          } else {
            lines.push(`  .addOrderBy('${order.column}', '${order.direction}')`);
          }
        });
      }
      
      // LIMIT/OFFSET
      if (state.limit) {
        lines.push(`  .limit(${state.limit})`);
      }
      if (state.offset) {
        lines.push(`  .offset(${state.offset})`);
      }
      
      // Get results (use getRawMany for aggregates, getMany for regular)
      if (hasAggregates || hasGroupBy) {
        lines.push(`  .getRawMany()`);
      } else {
        lines.push(`  .getMany()`);
      }
    } else {
      // Simple find() for basic queries
      lines.push(`await ${repoName}.find({`);
      
      // Select columns
      if (state.columns.length > 0 && !state.columns.includes('*')) {
        lines.push(`  select: [`);
        state.columns.forEach(col => {
          const cleanCol = col.split('.').pop() || col;
          lines.push(`    '${cleanCol}',`);
        });
        lines.push(`  ],`);
      }
      
      // WHERE
      if (state.whereConditions.length > 0) {
        lines.push(`  where: {`);
        state.whereConditions.forEach(cond => {
          const col = cond.column.split('.').pop() || cond.column;
          lines.push(`    ${col}: ${formatTypeORMValue(cond.value, cond.operator)},`);
        });
        lines.push(`  },`);
      }
      
      // ORDER
      if (state.orderBy.length > 0) {
        lines.push(`  order: {`);
        state.orderBy.forEach(order => {
          const col = order.column.split('.').pop() || order.column;
          lines.push(`    ${col}: '${order.direction}',`);
        });
        lines.push(`  },`);
      }
      
      // LIMIT/OFFSET
      if (state.limit) {
        lines.push(`  take: ${state.limit},`);
      }
      if (state.offset) {
        lines.push(`  skip: ${state.offset},`);
      }
      
      lines.push(`})`);
    }
  }
  
  return lines.join('\n');
}

// Helper for TypeORM operators
function typeormOperator(op: string): string {
  switch (op) {
    case '=': return '=';
    case '!=': return '!=';
    case '>': return '>';
    case '<': return '<';
    case '>=': return '>=';
    case '<=': return '<=';
    case 'LIKE': return 'LIKE';
    case 'IN': return 'IN';
    case 'NOT IN': return 'NOT IN';
    default: return '=';
  }
}

/**
 * Generate Sequelize code
 */
function generateSequelizeCode(state: QueryState): string {
  if (!state.table) return '';
  
  const modelName = toPascalCase(state.table);
  const lines: string[] = [];
  
  if (state.queryType === 'SELECT') {
    const hasAggregates = state.aggregates && state.aggregates.length > 0;
    const hasGroupBy = state.groupBy && state.groupBy.length > 0;
    const hasJoins = state.joins && state.joins.length > 0;
    
    lines.push(`await ${modelName}.findAll({`);
    
    // Attributes (columns + aggregates)
    if (hasAggregates || (state.columns.length > 0 && !state.columns.includes('*'))) {
      lines.push(`  attributes: [`);
      
      // Regular columns
      state.columns.forEach(col => {
        const cleanCol = col.split('.').pop() || col;
        lines.push(`    '${cleanCol}',`);
      });
      
      // Aggregate functions
      if (hasAggregates) {
        state.aggregates.forEach(agg => {
          const func = agg.function.toUpperCase();
          const col = agg.column === '*' ? '*' : (agg.column.split('.').pop() || agg.column);
          const alias = agg.alias || `${func.toLowerCase()}_${col}`;
          if (col === '*') {
            lines.push(`    [sequelize.fn('${func}', sequelize.col('*')), '${alias}'],`);
          } else {
            lines.push(`    [sequelize.fn('${func}', sequelize.col('${col}')), '${alias}'],`);
          }
        });
      }
      
      lines.push(`  ],`);
    }
    
    // Includes (JOINs)
    if (hasJoins) {
      lines.push(`  include: [`);
      state.joins.forEach(join => {
        const joinModel = toPascalCase(join.table);
        lines.push(`    { model: ${joinModel}, as: '${join.table}' },`);
      });
      lines.push(`  ],`);
    }
    
    // WHERE
    if (state.whereConditions.length > 0) {
      lines.push(`  where: {`);
      state.whereConditions.forEach(cond => {
        const col = cond.column.split('.').pop() || cond.column;
        lines.push(`    ${col}: ${formatSequelizeValue(cond.value, cond.operator)},`);
      });
      lines.push(`  },`);
    }
    
    // GROUP BY
    if (hasGroupBy) {
      lines.push(`  group: [${state.groupBy.map(col => `'${col.split('.').pop() || col}'`).join(', ')}],`);
    }
    
    // HAVING
    if (state.having && state.having.length > 0) {
      lines.push(`  having: sequelize.where(`);
      const h = state.having[0];
      const func = h.function.toUpperCase();
      const col = h.column.split('.').pop() || h.column;
      lines.push(`    sequelize.fn('${func}', sequelize.col('${col}')),`);
      lines.push(`    '${h.operator}',`);
      lines.push(`    ${h.value}`);
      lines.push(`  ),`);
    }
    
    // ORDER
    if (state.orderBy.length > 0) {
      lines.push(`  order: [`);
      state.orderBy.forEach(order => {
        const col = order.column.split('.').pop() || order.column;
        // Check if ordering by aggregate alias
        const isAggregate = state.aggregates?.some(agg => agg.alias === col);
        if (isAggregate) {
          lines.push(`    [sequelize.literal('${col}'), '${order.direction}'],`);
        } else {
          lines.push(`    ['${col}', '${order.direction}'],`);
        }
      });
      lines.push(`  ],`);
    }
    
    // LIMIT/OFFSET
    if (state.limit) {
      lines.push(`  limit: ${state.limit},`);
    }
    if (state.offset) {
      lines.push(`  offset: ${state.offset},`);
    }
    
    lines.push(`})`);
  }
  
  return lines.join('\n');
}

/**
 * Generate Mongoose code
 */
function generateMongooseCode(state: QueryState): string {
  if (!state.table) return '';
  
  const modelName = toPascalCase(state.table);
  const lines: string[] = [];
  
  if (state.queryType === 'SELECT') {
    lines.push(`await ${modelName}.find({`);
    
    // WHERE
    if (state.whereConditions.length > 0) {
      state.whereConditions.forEach(cond => {
        const col = cond.column.split('.').pop() || cond.column;
        lines.push(`  ${col}: ${formatMongooseValue(cond.value, cond.operator)},`);
      });
    }
    
    lines.push(`})`);
    
    // Select
    if (state.columns.length > 0 && !state.columns.includes('*')) {
      const cols = state.columns.map(c => c.split('.').pop() || c).join(' ');
      lines.push(`.select('${cols}')`);
    }
    
    // Sort
    if (state.orderBy.length > 0) {
      const sortObj = state.orderBy.map(o => {
        const col = o.column.split('.').pop() || o.column;
        return `{ ${col}: ${o.direction === 'ASC' ? 1 : -1} }`;
      }).join(', ');
      lines.push(`.sort(${sortObj})`);
    }
    
    // Limit/Skip
    if (state.limit) {
      lines.push(`.limit(${state.limit})`);
    }
    if (state.offset) {
      lines.push(`.skip(${state.offset})`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate Drizzle code
 */
function generateDrizzleCode(state: QueryState): string {
  if (!state.table) return '';
  
  const tableName = state.table;
  const lines: string[] = [];
  
  if (state.queryType === 'SELECT') {
    lines.push(`await db.select({`);
    
    // Columns
    if (state.columns.length > 0 && !state.columns.includes('*')) {
      state.columns.forEach(col => {
        const cleanCol = col.split('.').pop() || col;
        lines.push(`  ${cleanCol}: ${tableName}.${cleanCol},`);
      });
    } else {
      lines.push(`  // All columns selected`);
    }
    
    lines.push(`})`);
    lines.push(`.from(${tableName})`);
    
    // WHERE
    if (state.whereConditions.length > 0) {
      state.whereConditions.forEach((cond, idx) => {
        const col = cond.column.split('.').pop() || cond.column;
        const operator = drizzleOperator(cond.operator);
        const value = formatDrizzleValue(cond.value);
        
        if (idx === 0) {
          lines.push(`.where(${operator}(${tableName}.${col}, ${value}))`);
        }
      });
    }
    
    // ORDER
    if (state.orderBy.length > 0) {
      const orderFn = state.orderBy[0].direction === 'ASC' ? 'asc' : 'desc';
      const col = state.orderBy[0].column.split('.').pop() || state.orderBy[0].column;
      lines.push(`.orderBy(${orderFn}(${tableName}.${col}))`);
    }
    
    // LIMIT
    if (state.limit) {
      lines.push(`.limit(${state.limit})`);
    }
    
    // OFFSET
    if (state.offset) {
      lines.push(`.offset(${state.offset})`);
    }
  }
  
  return lines.join('\n');
}

// Helper functions
function toPascalCase(str: string): string {
  return str.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function prismaOperator(op: string): string {
  const map: Record<string, string> = {
    '=': 'equals',
    '!=': 'not',
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    'LIKE': 'contains',
    'IN': 'in',
    'NOT IN': 'notIn',
  };
  return map[op] || 'equals';
}

function drizzleOperator(op: string): string {
  const map: Record<string, string> = {
    '=': 'eq',
    '!=': 'ne',
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    'LIKE': 'like',
    'IN': 'inArray',
  };
  return map[op] || 'eq';
}

function formatPrismaValue(value: string, operator?: string): string {
  if (!value) return 'null';
  
  // Check if it's a number
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return value;
  }
  
  // Handle IN operator
  if (operator === 'IN' || operator === 'NOT IN') {
    const values = value.split(',').map(v => {
      const trimmed = v.trim().replace(/['"]/g, '');
      return `'${trimmed}'`;
    });
    return `[${values.join(', ')}]`;
  }
  
  return `'${value}'`;
}

function formatTypeORMValue(value: string, operator: string): string {
  if (operator === '=') return `'${value}'`;
  if (operator === 'LIKE') return `Like('%${value}%')`;
  if (operator === 'IN') {
    const values = value.split(',').map(v => `'${v.trim().replace(/['"]/g, '')}'`);
    return `In([${values.join(', ')}])`;
  }
  return `'${value}'`;
}

function formatSequelizeValue(value: string, operator: string): string {
  if (operator === 'LIKE') return `{ [Op.like]: '%${value}%' }`;
  if (operator === '>') return `{ [Op.gt]: ${value} }`;
  if (operator === '<') return `{ [Op.lt]: ${value} }`;
  if (operator === '>=') return `{ [Op.gte]: ${value} }`;
  if (operator === '<=') return `{ [Op.lte]: ${value} }`;
  if (operator === '!=') return `{ [Op.ne]: ${value} }`;
  if (operator === 'IN') {
    const values = value.split(',').map(v => `'${v.trim().replace(/['"]/g, '')}'`);
    return `{ [Op.in]: [${values.join(', ')}] }`;
  }
  
  return `'${value}'`;
}

function formatMongooseValue(value: string, operator: string): string {
  if (operator === '>') return `{ $gt: ${value} }`;
  if (operator === '<') return `{ $lt: ${value} }`;
  if (operator === '>=') return `{ $gte: ${value} }`;
  if (operator === '<=') return `{ $lte: ${value} }`;
  if (operator === '!=') return `{ $ne: '${value}' }`;
  if (operator === 'LIKE') return `{ $regex: '${value}', $options: 'i' }`;
  if (operator === 'IN') {
    const values = value.split(',').map(v => `'${v.trim().replace(/['"]/g, '')}'`);
    return `{ $in: [${values.join(', ')}] }`;
  }
  
  return `'${value}'`;
}

function formatDrizzleValue(value: string): string {
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return value;
  }
  return `'${value}'`;
}

/**
 * Get ORM installation command
 */
export function getORMInstallCommand(orm: ORMType): string {
  const commands: Record<ORMType, string> = {
    prisma: 'npm install @prisma/client && npx prisma init',
    typeorm: 'npm install typeorm reflect-metadata',
    sequelize: 'npm install sequelize',
    mongoose: 'npm install mongoose',
    drizzle: 'npm install drizzle-orm',
  };
  return commands[orm];
}

/**
 * Get ORM documentation link
 */
export function getORMDocsLink(orm: ORMType): string {
  const links: Record<ORMType, string> = {
    prisma: 'https://www.prisma.io/docs',
    typeorm: 'https://typeorm.io',
    sequelize: 'https://sequelize.org/docs',
    mongoose: 'https://mongoosejs.com/docs',
    drizzle: 'https://orm.drizzle.team/docs',
  };
  return links[orm];
}

