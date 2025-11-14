/**
 * Database Connection Modal
 * Connect to live databases and reverse engineer schemas
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchemaState } from '../types';
import { useToast } from '@/features/sql-builder/hooks/useToast';
import Toast from '@/features/sql-builder/components/ui/Toast';

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (schema: SchemaState, connectionConfig?: {
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    connectionString?: string;
  }) => void;
}

interface ConnectionConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  file?: File | null; // For SQLite
}

export default function DatabaseConnectionModal({
  isOpen,
  onClose,
  onConnect,
}: DatabaseConnectionModalProps) {
  const { toast, showToast, hideToast } = useToast();
  const [dbType, setDbType] = useState<DatabaseType>('postgresql');
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
  });
  const [sqliteFile, setSqliteFile] = useState<File | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfig({
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
      });
      setSqliteFile(null);
      setIsConnecting(false);
    } else {
      setDbType('postgresql');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConnecting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isConnecting, onClose]);

  const handleDbTypeChange = (type: DatabaseType) => {
    setDbType(type);
    setConfig({
      type,
      host: type === 'postgresql' ? 'localhost' : type === 'mysql' ? 'localhost' : undefined,
      port: type === 'postgresql' ? 5432 : type === 'mysql' ? 3306 : undefined,
      database: '',
      username: '',
      password: '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSqliteFile(file);
      setConfig(prev => ({ ...prev, file }));
    }
  };

  const validateConfig = (): boolean => {
    if (dbType === 'sqlite') {
      if (!sqliteFile) {
        showToast('Please select a SQLite database file', 'error');
        return false;
      }
      return true;
    }

    if (!config.host || !config.database) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }

    if (dbType === 'postgresql' || dbType === 'mysql') {
      if (!config.username) {
        showToast('Username is required', 'error');
        return false;
      }
    }

    return true;
  };

  const handleConnect = async () => {
    if (!validateConfig()) return;

    setIsConnecting(true);

    try {
      // For now, we'll use API routes for PostgreSQL/MySQL
      // SQLite will use sql.js in the browser
      let schema: SchemaState;

      let connectionConfig: {
        type: 'postgresql' | 'mysql' | 'sqlite';
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
        connectionString?: string;
      } | undefined = undefined;

      if (dbType === 'sqlite') {
        // SQLite: Use sql.js in browser
        schema = await connectSQLite(sqliteFile!);
        connectionConfig = { type: 'sqlite' };
      } else {
        // PostgreSQL/MySQL: Use API route
        schema = await connectDatabase(dbType, config);
        connectionConfig = {
          type: dbType,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: config.password,
          connectionString: config.connectionString,
        };
      }

      onConnect(schema, connectionConfig);
      showToast('Database connected successfully!', 'success');
      onClose();
    } catch (error: any) {
      console.error('Connection error:', error);
      showToast(
        error.message || 'Failed to connect to database. Please check your credentials.',
        'error'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="db-connection-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isConnecting && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div key="db-connection-modal-wrapper" className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border border-foreground/20 rounded-lg shadow-lg overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="db-connection-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 id="db-connection-title" className="text-lg font-semibold text-foreground font-mono">
                      Connect to Database
                    </h3>
                    <p className="text-xs text-foreground/60 font-mono mt-0.5">
                      Reverse engineer your existing database schema
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isConnecting}
                    className="p-2 hover:bg-foreground/10 rounded transition-colors disabled:opacity-50 active:scale-95"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Database Type Selection */}
                <div className="mb-6">
                  <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                    Database Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['postgresql', 'mysql', 'sqlite'] as DatabaseType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleDbTypeChange(type)}
                        disabled={isConnecting}
                        className={`px-4 py-3 border rounded-lg transition-all text-left active:scale-95 disabled:opacity-50 ${
                          dbType === type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-foreground/5 text-foreground border-foreground/10 hover:bg-foreground/10'
                        }`}
                      >
                        <div className="text-sm font-semibold font-mono capitalize">{type}</div>
                        <div className="text-[10px] font-mono opacity-70 mt-0.5">
                          {type === 'postgresql' && 'PostgreSQL'}
                          {type === 'mysql' && 'MySQL / MariaDB'}
                          {type === 'sqlite' && 'SQLite (File)'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connection Form */}
                {dbType === 'sqlite' ? (
                  /* SQLite File Upload */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                        Database File
                      </label>
                      <div className="border-2 border-dashed border-foreground/20 rounded-lg p-6 text-center hover:border-foreground/30 transition-colors">
                        <input
                          type="file"
                          accept=".db,.sqlite,.sqlite3"
                          onChange={handleFileChange}
                          disabled={isConnecting}
                          className="hidden"
                          id="sqlite-file-input"
                        />
                        <label
                          htmlFor="sqlite-file-input"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <svg className="w-8 h-8 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm font-mono text-foreground/70">
                            {sqliteFile ? sqliteFile.name : 'Click to select SQLite database file'}
                          </span>
                          <span className="text-xs font-mono text-foreground/40">
                            .db, .sqlite, .sqlite3
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PostgreSQL/MySQL Connection Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                          Host
                        </label>
                        <input
                          type="text"
                          value={config.host || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                          disabled={isConnecting}
                          placeholder="localhost"
                          className="w-full px-3 py-2 text-sm font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={config.port || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || undefined }))}
                          disabled={isConnecting}
                          placeholder={dbType === 'postgresql' ? '5432' : '3306'}
                          className="w-full px-3 py-2 text-sm font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                        Database Name
                      </label>
                      <input
                        type="text"
                        value={config.database || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, database: e.target.value }))}
                        disabled={isConnecting}
                        placeholder="my_database"
                        className="w-full px-3 py-2 text-sm font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={config.username || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                          disabled={isConnecting}
                          placeholder="postgres"
                          className="w-full px-3 py-2 text-sm font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={config.password || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                          disabled={isConnecting}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-sm font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <details className="text-xs font-mono text-foreground/50">
                        <summary className="cursor-pointer hover:text-foreground/70">Advanced: Connection String (Auto-fills fields)</summary>
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={config.connectionString || ''}
                            onChange={(e) => {
                              const connStr = e.target.value;
                              setConfig(prev => ({ ...prev, connectionString: connStr }));
                              
                              // Auto-parse connection string
                              if (connStr && (connStr.startsWith('postgresql://') || connStr.startsWith('postgres://') || connStr.startsWith('mysql://'))) {
                                try {
                                  const url = new URL(connStr);
                                  // Decode URL-encoded values (important for special characters in passwords)
                                  const username = decodeURIComponent(url.username);
                                  const password = decodeURIComponent(url.password);
                                  const host = url.hostname;
                                  const port = parseInt(url.port) || (dbType === 'postgresql' ? 5432 : 3306);
                                  const database = url.pathname.slice(1); // Remove leading /
                                  
                                  setConfig(prev => ({
                                    ...prev,
                                    host,
                                    port,
                                    database,
                                    username,
                                    password,
                                    connectionString: connStr,
                                  }));
                                } catch (err) {
                                  // Invalid URL, ignore silently
                                  console.warn('Failed to parse connection string:', err);
                                }
                              }
                            }}
                            disabled={isConnecting}
                            placeholder={dbType === 'postgresql' ? 'postgresql://user:pass@host:port/db' : 'mysql://user:pass@host:port/db'}
                            className="w-full px-3 py-2 text-xs font-mono bg-foreground/5 border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                          />
                          <p className="text-[10px] font-mono text-foreground/40">
                            Paste a connection string to auto-fill all fields above
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-mono text-yellow-700 dark:text-yellow-400 leading-relaxed">
                      <strong>Security Note:</strong> Connections are made directly from your browser. For production databases, use read-only credentials. Credentials are never stored or transmitted to our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-foreground/10 bg-white dark:bg-[#1a1a1a]">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    disabled={isConnecting}
                    className="px-4 py-2 text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg transition-all font-mono active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all font-mono flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Connect & Reverse Engineer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </>
  );
}

// Placeholder function for SQLite - will be implemented with sql.js
async function connectSQLite(file: File): Promise<SchemaState> {
  // TODO: Implement SQLite connection using sql.js
  throw new Error('SQLite connection not yet implemented. Please use PostgreSQL or MySQL for now.');
}

/**
 * Connect to PostgreSQL or MySQL database via API route
 */
async function connectDatabase(
  type: DatabaseType,
  config: ConnectionConfig
): Promise<SchemaState> {
  if (type === 'sqlite') {
    throw new Error('SQLite connections are handled separately');
  }

  // Prepare request body
  const requestBody: any = {
    type,
    host: config.host || '',
    port: config.port || (type === 'postgresql' ? 5432 : 3306),
    database: config.database || '',
    username: config.username || '',
    password: config.password || '',
  };

  // Use connection string if provided
  if (config.connectionString) {
    requestBody.connectionString = config.connectionString;
  }

  // Call API route with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch('/api/database/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to connect to ${type} database`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || `Failed to connect to ${type} database`);
    }

    if (!data.schema) {
      throw new Error('No schema data returned from server');
    }

    return data.schema;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timeout. The database server took too long to respond. Please check your connection and try again.');
    }
    throw error;
  }
}

