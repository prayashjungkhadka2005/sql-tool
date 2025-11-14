/**
 * Database Connection API Route
 * Handles reverse engineering requests from the frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { reverseEngineerDatabase, DatabaseConnectionConfig } from '@/features/schema-designer/services/database-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max duration for Vercel

/**
 * Validate connection configuration
 */
function validateConfig(body: any): { valid: boolean; error?: string; config?: DatabaseConnectionConfig } {
  if (!body.type || !['postgresql', 'mysql'].includes(body.type)) {
    return { valid: false, error: 'Invalid database type. Must be "postgresql" or "mysql"' };
  }

  if (!body.host || typeof body.host !== 'string') {
    return { valid: false, error: 'Host is required and must be a string' };
  }

  if (!body.port || typeof body.port !== 'number' || body.port < 1 || body.port > 65535) {
    return { valid: false, error: 'Port is required and must be a number between 1 and 65535' };
  }

  if (!body.database || typeof body.database !== 'string') {
    return { valid: false, error: 'Database name is required and must be a string' };
  }

  if (!body.username || typeof body.username !== 'string') {
    return { valid: false, error: 'Username is required and must be a string' };
  }

  if (typeof body.password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  return {
    valid: true,
    config: {
      type: body.type as 'postgresql' | 'mysql',
      host: body.host,
      port: body.port,
      database: body.database,
      username: body.username,
      password: body.password,
      connectionString: body.connectionString,
    },
  };
}

/**
 * POST /api/database/connect
 * Reverse engineer a database schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateConfig(body);
    if (!validation.valid || !validation.config) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }

    // Attempt to reverse engineer the database
    const schema = await reverseEngineerDatabase(validation.config);

    return NextResponse.json({
      success: true,
      schema,
    });
  } catch (error: any) {
    console.error('Database connection error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to connect to database';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please check if the database server is running and the host/port are correct.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please check your network connection and database server.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the hostname.';
    } else if (error.code === '28P01' || error.message?.includes('password')) {
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (error.code === '3D000' || error.message?.includes('database')) {
      errorMessage = 'Database not found. Please check the database name.';
    } else if (error.code === '28000' || error.message?.includes('pg_hba.conf') || error.message?.includes('no encryption')) {
      errorMessage = 'SSL/TLS encryption required. The database server requires an encrypted connection. This has been automatically enabled - please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

