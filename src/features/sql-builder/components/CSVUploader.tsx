"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseCSVFile, validateCSVFile, formatFileSize } from "../utils/csv-parser";
import { storeCSVData, getAllCSVTablesInfo, deleteCSVData, clearAllCSVData } from "../utils/csv-data-manager";

interface CSVUploaderProps {
  onUploadSuccess: (tableName: string) => void;
  onDelete?: (tableName: string) => void;
}

export default function CSVUploader({ onUploadSuccess, onDelete }: CSVUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedTables, setUploadedTables] = useState(getAllCSVTablesInfo());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      // Validate file
      const validation = validateCSVFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        setIsUploading(false);
        return;
      }

      // Parse CSV
      const parsedData = await parseCSVFile(file);

      // Store in memory (this will overwrite if same name exists)
      storeCSVData(parsedData.tableName, parsedData);

      // Update uploaded tables list
      setUploadedTables(getAllCSVTablesInfo());

      // Show success message
      setSuccess(`${file.name} uploaded successfully! ${parsedData.rowCount.toLocaleString()} rows, ${parsedData.columns.length} columns.`);
      setTimeout(() => setSuccess(null), 4000);

      // Notify parent
      onUploadSuccess(parsedData.tableName);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV file";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFiles = files.filter(f => 
      f.name.endsWith('.csv') || f.type === 'text/csv'
    );

    if (csvFiles.length === 0) {
      setError("Please drop CSV files only");
      return;
    }

    if (csvFiles.length > 1) {
      setError("Please drop one CSV file at a time");
      return;
    }

    // Process single CSV file
    handleFile(csvFiles[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Clear input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleDeleteTable = useCallback((tableName: string) => {
    deleteCSVData(tableName);
    setUploadedTables(getAllCSVTablesInfo());
    // Notify parent to refresh dropdowns and clear if selected
    if (onDelete) {
      onDelete(tableName);
    }
  }, [onDelete]);

  const handleClearAll = useCallback(() => {
    // Get all table names before clearing
    const allTables = getAllCSVTablesInfo().map(t => t.name);
    
    // Clear all CSV data
    clearAllCSVData();
    
    setUploadedTables([]);
    
    // Notify parent for each deleted table to trigger refresh
    if (onDelete) {
      // Just trigger once with empty string to signal full refresh
      onDelete("");
    }
  }, [onDelete]);

  // Generate sample CSV
  const downloadSampleCSV = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file upload
    
    const sampleData = `id,name,email,age,city,status
1,John Doe,john@example.com,28,New York,active
2,Jane Smith,jane@example.com,34,Los Angeles,active
3,Bob Johnson,bob@example.com,45,Chicago,inactive
4,Alice Brown,alice@example.com,29,Houston,active
5,Charlie Wilson,charlie@example.com,52,Phoenix,active`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {isUploading ? (
            <>
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-foreground/70">
                Processing CSV...
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-foreground/50 font-mono mb-2">
                  Max 10MB • 50K rows • 100 columns
                </p>
                <button
                  onClick={downloadSampleCSV}
                  className="text-[10px] px-2 py-1 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded font-mono text-foreground/60 hover:text-foreground transition-all inline-flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Sample CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono flex-1">
                {success}
              </p>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-red-600 dark:text-red-400 font-mono flex-1">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Tables List */}
      {uploadedTables.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
              Uploaded Tables ({uploadedTables.length}/20)
            </div>
            {uploadedTables.length > 1 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 text-red-600 dark:text-red-400 rounded transition-all font-mono"
                title="Delete all uploaded CSVs"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-2">
            {uploadedTables.map((table) => (
              <motion.div
                key={table.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded-lg group hover:border-foreground/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-mono font-semibold text-foreground truncate" title={table.name}>
                      {table.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-foreground/50 font-mono mt-0.5">
                    {table.rowCount.toLocaleString()} rows • {table.columns} columns • {table.size}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.name)}
                  className="ml-2 p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Remove table"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Helpful Hint */}
          {uploadedTables.length > 0 && (
            <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono leading-relaxed">
                <span className="font-semibold">Tip:</span> Your CSV data is stored locally in your browser. It&apos;s 100% private and will be cleared when you refresh the page.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

