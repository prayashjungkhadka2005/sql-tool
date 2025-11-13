/**
 * Schema History Hook
 * Implements undo/redo functionality for Schema Designer
 * 
 * Features:
 * - Undo/Redo with Cmd+Z / Cmd+Shift+Z
 * - Action tracking with descriptive names
 * - Memory-efficient (max 50 actions)
 * - Deep cloning to prevent mutations
 * - Table move debouncing
 */

import { useState, useCallback, useRef } from 'react';
import { SchemaState } from '../types';

interface HistoryState {
  past: SchemaState[];
  present: SchemaState;
  future: SchemaState[];
}

const MAX_HISTORY = 50;

/**
 * Deep clone schema to prevent mutations
 */
function deepClone(schema: SchemaState): SchemaState {
  return JSON.parse(JSON.stringify(schema));
}

/**
 * useSchemaHistory Hook
 * Drop-in replacement for useState with undo/redo functionality
 */
export function useSchemaHistory(initialSchema: SchemaState) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: deepClone(initialSchema),
    future: [],
  });
  
  // Track last action name for debugging/UI
  const [lastActionName, setLastActionName] = useState<string | null>(null);
  
  // Debounce timer for table moves
  const moveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Get current schema
   */
  const schema = history.present;
  
  /**
   * Update schema with action tracking
   * Action name is optional for backward compatibility
   */
  const setSchema = useCallback((
    newSchema: SchemaState | ((prev: SchemaState) => SchemaState),
    actionName?: string
  ) => {
    setHistory(prev => {
      // Resolve new schema (handle function or direct value)
      const resolvedSchema = typeof newSchema === 'function'
        ? newSchema(prev.present)
        : newSchema;
      
      // Check if schema actually changed
      const hasChanged = JSON.stringify(resolvedSchema) !== JSON.stringify(prev.present);
      if (!hasChanged) return prev;
      
      // Add current state to past
      const newPast = [...prev.past, deepClone(prev.present)];
      
      // Limit history size (drop oldest if exceeded)
      const trimmedPast = newPast.length > MAX_HISTORY
        ? newPast.slice(-MAX_HISTORY)
        : newPast;
      
      // Update state and clear future (new branch)
      return {
        past: trimmedPast,
        present: deepClone(resolvedSchema),
        future: [], // Clear redo stack on new action
      };
    });
    
    if (actionName) {
      setLastActionName(actionName);
    }
  }, []);
  
  /**
   * Update schema for table moves (debounced to avoid excessive history entries)
   */
  const setSchemaDebounced = useCallback((
    newSchema: SchemaState | ((prev: SchemaState) => SchemaState),
    actionName?: string
  ) => {
    // Clear previous debounce
    if (moveDebounceRef.current) {
      clearTimeout(moveDebounceRef.current);
    }
    
    // Apply change immediately to UI (optimistic update)
    setHistory(prev => ({
      ...prev,
      present: typeof newSchema === 'function' ? newSchema(prev.present) : deepClone(newSchema),
    }));
    
    // Add to history after debounce (500ms)
    moveDebounceRef.current = setTimeout(() => {
      setHistory(prev => {
        // Add to past
        const newPast = [...prev.past, deepClone(prev.present)];
        const trimmedPast = newPast.length > MAX_HISTORY
          ? newPast.slice(-MAX_HISTORY)
          : newPast;
        
        return {
          ...prev,
          past: trimmedPast,
          future: [], // Clear redo stack
        };
      });
      
      if (actionName) {
        setLastActionName(actionName);
      }
    }, 500);
  }, []);
  
  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      // Get previous state
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      
      // Move current to future
      return {
        past: newPast,
        present: deepClone(previous),
        future: [deepClone(prev.present), ...prev.future],
      };
    });
    
    setLastActionName('Undo');
  }, []);
  
  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      // Get next state
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      // Move current to past
      return {
        past: [...prev.past, deepClone(prev.present)],
        present: deepClone(next),
        future: newFuture,
      };
    });
    
    setLastActionName('Redo');
  }, []);
  
  /**
   * Check if can undo
   */
  const canUndo = history.past.length > 0;
  
  /**
   * Check if can redo
   */
  const canRedo = history.future.length > 0;
  
  /**
   * Clear all history (useful for reset/import)
   */
  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }));
    setLastActionName(null);
  }, []);
  
  /**
   * Replace schema without adding to history (for restore/import)
   */
  const replaceSchema = useCallback((newSchema: SchemaState) => {
    setHistory({
      past: [],
      present: deepClone(newSchema),
      future: [],
    });
    setLastActionName(null);
  }, []);
  
  return {
    schema,
    setSchema,
    setSchemaDebounced,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    replaceSchema,
    lastActionName,
    historySize: history.past.length + 1 + history.future.length,
  };
}

