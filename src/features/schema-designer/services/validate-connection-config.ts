import { DatabaseConnectionConfig } from './database-service';

export function validateConnectionConfig(body: any): { valid: boolean; error?: string; config?: DatabaseConnectionConfig } {
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

