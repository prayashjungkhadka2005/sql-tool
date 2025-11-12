/**
 * SQL Formatter Utility
 * Beautifies and formats SQL queries with proper indentation
 * 
 * Edge cases handled:
 * - Escaped quotes ('', \')
 * - Semicolons in strings
 * - Comments inside strings
 * - Multi-line strings
 * - Mixed quote types
 * - Empty input
 * - Malformed SQL
 */

export interface FormatOptions {
  indentSize?: number;
  uppercase?: boolean;
  linesBetweenQueries?: number;
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'USING',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC',
  'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'IS', 'NULL',
  'UNION', 'ALL', 'CREATE', 'TABLE', 'DROP', 'ALTER',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT',
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'TRIM',
  'DATE', 'NOW', 'YEAR', 'MONTH', 'DAY',
  'CONCAT', 'COALESCE', 'CAST', 'ROUND',
]);

/**
 * Format SQL query with proper indentation and line breaks
 */
export function formatSQL(sql: string, options: FormatOptions = {}): string {
  const {
    indentSize = 2,
    uppercase = true,
    linesBetweenQueries = 2,
  } = options;

  if (!sql || sql.trim() === '') {
    return '';
  }

  try {
    // Split by semicolons BUT ONLY outside of strings
    const queries = splitBySemicolon(sql);
    
    const formattedQueries = queries.map(query => {
      if (!query.trim()) return '';
      return formatSingleQuery(query.trim(), indentSize, uppercase);
    }).filter(q => q);
    
    // Join multiple queries with spacing
    if (formattedQueries.length === 0) return '';
    return formattedQueries.join(';\n' + '\n'.repeat(linesBetweenQueries)) + ';';
  } catch (error) {
    console.error('Failed to format SQL:', error);
    return sql; // Return original if formatting fails
  }
}

/**
 * Split SQL by semicolon, respecting string literals
 */
function splitBySemicolon(sql: string): string[] {
  const queries: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // Handle string literals
    if ((char === "'" || char === '"' || char === '`') && !inString) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }
    
    if (char === stringChar && inString) {
      // Check for escaped quote ('' or \')
      if (nextChar === stringChar || (i > 0 && sql[i - 1] === '\\')) {
        current += char;
        if (nextChar === stringChar) {
          current += nextChar;
          i++;
        }
        continue;
      }
      current += char;
      inString = false;
      stringChar = '';
      continue;
    }
    
    // Split on semicolon ONLY outside strings
    if (char === ';' && !inString) {
      if (current.trim()) {
        queries.push(current.trim());
      }
      current = '';
      continue;
    }
    
    current += char;
  }
  
  // Add remaining query
  if (current.trim()) {
    queries.push(current.trim());
  }
  
  return queries;
}

/**
 * Format a single SQL query
 */
function formatSingleQuery(sql: string, indentSize: number, uppercase: boolean): string {
  const indent = ' '.repeat(indentSize);
  let formatted = '';
  const tokens = tokenize(sql);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const prevToken = tokens[i - 1];
    
    // Skip empty tokens
    if (!token) continue;
    
    const upper = uppercase ? token.toUpperCase() : token;
    const isKeyword = SQL_KEYWORDS.has(token.toUpperCase());
    const isFunction = SQL_FUNCTIONS.has(token.toUpperCase());
    const isString = token.startsWith("'") || token.startsWith('"') || token.startsWith('`');
    
    // Preserve string literals as-is
    if (isString) {
      formatted += token;
      if (nextToken && nextToken !== ',' && nextToken !== ')' && nextToken !== ';') {
        formatted += ' ';
      }
      continue;
    }
    
    // Handle major keywords that start new lines
    if (isKeyword && isMajorKeyword(token)) {
      // Add newline before major keywords (except at start)
      if (formatted.trim() !== '') {
        formatted += '\n';
      }
      formatted += upper;
      
      // Add space after keyword
      if (nextToken && nextToken !== '(' && nextToken !== ',') {
        formatted += ' ';
      }
    }
    // Handle sub-keywords (AND, OR, etc.)
    else if (isKeyword && isSubKeyword(token)) {
      formatted += '\n' + indent + upper;
      if (nextToken && nextToken !== '(') {
        formatted += ' ';
      }
    }
    // Handle commas
    else if (token === ',') {
      formatted += ',';
      // Only add line breaks for SELECT column lists
      // Keep inline for IN clauses, VALUES, function arguments
      if (shouldBreakAfterComma(prevToken, nextToken)) {
        formatted += '\n' + indent;
      } else {
        formatted += ' ';
      }
    }
    // Handle opening parenthesis
    else if (token === '(') {
      formatted += '(';
      // No space after (
    }
    // Handle closing parenthesis
    else if (token === ')') {
      formatted += ')';
      if (nextToken && nextToken !== ',' && nextToken !== ';' && nextToken !== ')') {
        formatted += ' ';
      }
    }
    // Handle ON for JOINs
    else if (token.toUpperCase() === 'ON' && prevToken && prevToken.toUpperCase().includes('JOIN')) {
      formatted += '\n' + indent + upper + ' ';
    }
    // Handle regular tokens
    else {
      if (isKeyword) {
        formatted += upper;
      } else if (isFunction) {
        formatted += uppercase ? upper : token;
      } else {
        formatted += token;
      }
      
      // Add space after token (unless followed by comma or paren)
      if (nextToken && nextToken !== ',' && nextToken !== ')' && nextToken !== '(') {
        formatted += ' ';
      }
    }
  }
  
  return formatted.trim();
}

/**
 * Check if keyword should start a new line
 */
function isMajorKeyword(token: string): boolean {
  const major = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
                 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL'];
  return major.includes(token.toUpperCase());
}

/**
 * Check if keyword is a sub-clause (AND, OR)
 */
function isSubKeyword(token: string): boolean {
  return ['AND', 'OR'].includes(token.toUpperCase());
}

/**
 * Determine if comma should be followed by line break
 */
function shouldBreakAfterComma(prevToken: string | undefined, nextToken: string | undefined): boolean {
  if (!prevToken || !nextToken) return false;
  
  // Don't break inside parentheses (for IN clauses, function args, etc.)
  if (nextToken === ')') return false;
  
  // Don't break for VALUES lists in INSERT
  const prevUpper = prevToken.toUpperCase();
  if (prevUpper === 'VALUES' || prevToken === '(') return false;
  
  // Don't break inside function calls
  if (prevToken === '(' || nextToken === '(') return false;
  
  // Break for column lists in SELECT and other main-level commas
  return true;
}

/**
 * Enhanced tokenizer that handles all edge cases
 */
function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let prevChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // Handle string literals (single, double, backtick quotes)
    if ((char === "'" || char === '"' || char === '`') && !inString) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      inString = true;
      stringChar = char;
      current = char;
      prevChar = char;
      continue;
    }
    
    if (char === stringChar && inString) {
      current += char;
      
      // Check for escaped quote ('' or \')
      if (nextChar === stringChar) {
        // SQL-style escape (double quote)
        current += nextChar;
        i++;
        prevChar = nextChar;
        continue;
      }
      
      if (prevChar === '\\') {
        // Backslash escape (MySQL style)
        prevChar = char;
        continue;
      }
      
      // End of string
      tokens.push(current);
      current = '';
      inString = false;
      stringChar = '';
      prevChar = char;
      continue;
    }
    
    if (inString) {
      current += char;
      prevChar = char;
      continue;
    }
    
    // Handle special characters
    if (char === '(' || char === ')' || char === ',' || char === ';') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
      prevChar = char;
      continue;
    }
    
    // Handle whitespace
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      prevChar = char;
      continue;
    }
    
    // Build current token
    current += char;
    prevChar = char;
  }
  
  // Push remaining token
  if (current.trim()) {
    tokens.push(current.trim());
  }
  
  return tokens.filter(t => t); // Remove empty tokens
}

/**
 * Enhanced validation with better edge case handling
 */
export function validateSQL(sql: string): { valid: boolean; error?: string } {
  if (!sql || sql.trim() === '') {
    return { valid: false, error: 'SQL is empty' };
  }
  
  // Basic length check
  if (sql.length > 100000) {
    return { valid: false, error: 'SQL is too long (max 100,000 characters)' };
  }
  
  const upper = sql.toUpperCase();
  
  // Check for basic SQL structure
  if (!upper.includes('SELECT') && !upper.includes('INSERT') && 
      !upper.includes('UPDATE') && !upper.includes('DELETE') &&
      !upper.includes('CREATE') && !upper.includes('DROP') &&
      !upper.includes('ALTER') && !upper.includes('TRUNCATE')) {
    return { valid: false, error: 'Not a valid SQL query. Must contain a SQL command (SELECT, INSERT, UPDATE, etc.).' };
  }
  
  // Check for balanced parentheses (accounting for strings)
  let parenCount = 0;
  let inString = false;
  let stringChar = '';
  let prevChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // Track strings
    if ((char === "'" || char === '"' || char === '`') && !inString && prevChar !== '\\') {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      if (nextChar === stringChar) {
        i++; // Skip doubled quote
      } else if (prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
    
    // Count parentheses ONLY outside strings
    if (!inString) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses - extra closing parenthesis' };
      }
    }
    
    prevChar = char;
  }
  
  if (parenCount > 0) {
    return { valid: false, error: `Unbalanced parentheses - missing ${parenCount} closing parenthesis${parenCount > 1 ? 'es' : ''}` };
  }
  
  // Check for unclosed strings
  if (inString) {
    return { valid: false, error: `Unclosed string - missing closing ${stringChar} quote` };
  }
  
  return { valid: true };
}

/**
 * Minify SQL with proper string handling
 */
export function minifySQL(sql: string): string {
  if (!sql || sql.trim() === '') return '';
  
  try {
    let minified = '';
    let inString = false;
    let stringChar = '';
    let prevChar = '';
    let inComment = false;
    let commentType = '';
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      // Handle string literals - preserve them exactly
      if ((char === "'" || char === '"' || char === '`') && !inString && !inComment) {
        inString = true;
        stringChar = char;
        minified += char;
        prevChar = char;
        continue;
      }
      
      if (char === stringChar && inString) {
        minified += char;
        if (nextChar === stringChar) {
          minified += nextChar;
          i++;
          prevChar = nextChar;
          continue;
        }
        if (prevChar !== '\\') {
          inString = false;
          stringChar = '';
        }
        prevChar = char;
        continue;
      }
      
      if (inString) {
        minified += char;
        prevChar = char;
        continue;
      }
      
      // Handle comments ONLY outside strings
      if (char === '-' && nextChar === '-' && !inComment) {
        inComment = true;
        commentType = '--';
        i++; // Skip next dash
        prevChar = char;
        continue;
      }
      
      if (char === '/' && nextChar === '*' && !inComment) {
        inComment = true;
        commentType = '/*';
        i++; // Skip *
        prevChar = char;
        continue;
      }
      
      if (inComment) {
        if (commentType === '--' && (char === '\n' || char === '\r')) {
          inComment = false;
          commentType = '';
        }
        if (commentType === '/*' && prevChar === '*' && char === '/') {
          inComment = false;
          commentType = '';
        }
        prevChar = char;
        continue;
      }
      
      // Minify: remove extra whitespace
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // Keep single space if needed
        if (prevChar !== ' ' && prevChar !== '(' && prevChar !== ',' && 
            nextChar !== ')' && nextChar !== ',' && nextChar !== ';') {
          if (minified && minified[minified.length - 1] !== ' ') {
            minified += ' ';
          }
        }
        prevChar = char;
        continue;
      }
      
      // Remove spaces around special chars
      if (char === '(' || char === ',' || char === ';') {
        // Remove trailing space before these chars
        if (minified[minified.length - 1] === ' ') {
          minified = minified.slice(0, -1);
        }
      }
      
      minified += char;
      prevChar = char;
    }
    
    return minified.trim();
  } catch (error) {
    console.error('Minify failed:', error);
    return sql;
  }
}
