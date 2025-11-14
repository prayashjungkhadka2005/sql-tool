import { NextRequest } from 'next/server';
import { reverseEngineerDatabase } from '@/features/schema-designer/services/database-service';
import { validateConnectionConfig } from '@/features/schema-designer/services/validate-connection-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function deriveErrorMessage(error: any): string {
  if (!error) return 'Failed to connect to database';

  if (error.code === 'ECONNREFUSED') {
    return 'Connection refused. Please check if the database server is running and the host/port are correct.';
  }
  if (error.code === 'ETIMEDOUT') {
    return 'Connection timeout. Please check your network connection and database server.';
  }
  if (error.code === 'ENOTFOUND') {
    return 'Host not found. Please double-check the hostname.';
  }
  if (error.code === '28P01' || error.message?.includes('password')) {
    return 'Authentication failed. Please check your username and password.';
  }
  if (error.code === '3D000' || error.message?.includes('database')) {
    return 'Database not found. Please verify the database name.';
  }
  if (error.code === '28000' || error.message?.includes('pg_hba.conf') || error.message?.includes('no encryption')) {
    return 'SSL/TLS encryption required. This has been automatically enabled - please try again.';
  }
  if (typeof error.message === 'string') {
    return error.message;
  }
  return 'Failed to connect to database';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return new Response(JSON.stringify({ type: 'error', message: 'Invalid request body' }) + '\n', {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  const validation = validateConnectionConfig(body);
  if (!validation.valid || !validation.config) {
    return new Response(
      JSON.stringify({ type: 'error', message: validation.error || 'Invalid request' }) + '\n',
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      try {
        send({ type: 'log', message: 'Connecting to database...' });

        const schema = await reverseEngineerDatabase(validation.config!, (message) => {
          send({ type: 'log', message });
        });

        send({ type: 'done', schema });
      } catch (error: any) {
        console.error('Database connection stream error:', error);
        send({ type: 'error', message: deriveErrorMessage(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

