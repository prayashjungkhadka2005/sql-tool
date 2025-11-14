/**
 * Database Connection API Route
 * Handles reverse engineering requests from the frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { reverseEngineerDatabase } from '@/features/schema-designer/services/database-service';
import { validateConnectionConfig } from '@/features/schema-designer/services/validate-connection-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max duration for Vercel

/**
 * POST /api/database/connect
 * Reverse engineer a database schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateConnectionConfig(body);
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

