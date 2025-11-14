import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max duration for Vercel

interface ExecuteRequest {
  type: 'postgresql' | 'mysql';
  connectionConfig: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    connectionString?: string;
  };
  sql: string[]; // Array of SQL statements
}

function validateConfig(body: any): { valid: boolean; config?: ExecuteRequest; error?: string } {
  if (!body.type || !['postgresql', 'mysql'].includes(body.type)) {
    return { valid: false, error: 'Invalid database type. Must be postgresql or mysql.' };
  }

  if (!body.connectionConfig) {
    return { valid: false, error: 'Connection configuration is required.' };
  }

  if (!body.sql || !Array.isArray(body.sql) || body.sql.length === 0) {
    return { valid: false, error: 'SQL statements array is required and must not be empty.' };
  }

  const config = body.connectionConfig;
  if (!config.connectionString && (!config.host || !config.database || !config.username)) {
    return { valid: false, error: 'Either connectionString or host/database/username must be provided.' };
  }

  return { valid: true, config: body as ExecuteRequest };
}

function parsePostgreSQLConnectionString(connectionString: string): Partial<ExecuteRequest['connectionConfig']> {
  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    const sslMode = params.get('sslmode') || 'prefer';
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  } catch (error) {
    throw new Error('Invalid PostgreSQL connection string format');
  }
}

function getSSLConfig(connectionString?: string): boolean | { rejectUnauthorized: boolean } {
  if (!connectionString) {
    return { rejectUnauthorized: false };
  }
  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    const sslMode = params.get('sslmode')?.toLowerCase();
    switch (sslMode) {
      case 'require': case 'prefer': return { rejectUnauthorized: false };
      case 'verify-full': case 'verify-ca': return { rejectUnauthorized: true };
      case 'disable': return false;
      default: return { rejectUnauthorized: false };
    }
  } catch {
    return { rejectUnauthorized: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateConfig(body);
    
    if (!validation.valid || !validation.config) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }

    const { type, connectionConfig, sql } = validation.config;

    if (type === 'postgresql') {
      let pgConfig: any = {
        host: connectionConfig.host,
        port: connectionConfig.port || 5432,
        database: connectionConfig.database,
        user: connectionConfig.username,
        password: connectionConfig.password,
        connectionTimeoutMillis: 30000,
      };

      if (connectionConfig.connectionString) {
        const parsed = parsePostgreSQLConnectionString(connectionConfig.connectionString);
        pgConfig = {
          ...pgConfig,
          ...parsed,
          user: parsed.username || pgConfig.user,
        };
      }

      const sslConfig = getSSLConfig(connectionConfig.connectionString);
      if (sslConfig !== false) {
        pgConfig.ssl = sslConfig;
      }

      const client = new Client(pgConfig);

      try {
        await client.connect();
        
        // Execute SQL statements in a transaction
        await client.query('BEGIN');
        
        const results: any[] = [];
        for (const statement of sql) {
          // Skip empty statements and comments
          const trimmed = statement.trim();
          if (!trimmed || trimmed.startsWith('--')) {
            continue;
          }
          
          try {
            const result = await client.query(trimmed);
            results.push({
              statement: trimmed.substring(0, 100), // First 100 chars for logging
              success: true,
              rowCount: result.rowCount,
            });
          } catch (error: any) {
            // Rollback on error
            await client.query('ROLLBACK');
            throw new Error(`Error executing SQL: ${error.message}\nStatement: ${trimmed.substring(0, 200)}`);
          }
        }
        
        await client.query('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: `Successfully executed ${results.length} statement(s)`,
          results,
        });
      } catch (error: any) {
        // Ensure rollback on any error
        try {
          await client.query('ROLLBACK');
        } catch {}
        throw error;
      } finally {
        await client.end();
      }
    } else if (type === 'mysql') {
      let mysqlConfig: any = {
        host: connectionConfig.host,
        port: connectionConfig.port || 3306,
        database: connectionConfig.database,
        user: connectionConfig.username,
        password: connectionConfig.password,
        connectTimeout: 30000,
      };

      if (connectionConfig.connectionString) {
        // MySQL connection string parsing would go here
        // For now, use direct config
      }

      const connection = await mysql.createConnection(mysqlConfig);

      try {
        await connection.beginTransaction();
        
        const results: any[] = [];
        for (const statement of sql) {
          const trimmed = statement.trim();
          if (!trimmed || trimmed.startsWith('--')) {
            continue;
          }
          
          try {
            const [result]: any = await connection.execute(trimmed);
            results.push({
              statement: trimmed.substring(0, 100),
              success: true,
              affectedRows: result.affectedRows,
            });
          } catch (error: any) {
            await connection.rollback();
            throw new Error(`Error executing SQL: ${error.message}\nStatement: ${trimmed.substring(0, 200)}`);
          }
        }
        
        await connection.commit();
        
        return NextResponse.json({
          success: true,
          message: `Successfully executed ${results.length} statement(s)`,
          results,
        });
      } catch (error: any) {
        try {
          await connection.rollback();
        } catch {}
        throw error;
      } finally {
        await connection.end();
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported database type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Database execution error:', error);
    let errorMessage = 'Failed to execute SQL';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please check if the database server is running.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please check your network connection.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the hostname.';
    } else if (error.code === '28P01' || error.message?.includes('password')) {
      errorMessage = 'Authentication failed. Please check your credentials.';
    } else if (error.code === '3D000' || error.message?.includes('database')) {
      errorMessage = 'Database not found. Please check the database name.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

