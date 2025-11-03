import { useState, useCallback } from "react";
import { QueryState, WhereCondition, OrderByClause } from "../types";

/**
 * Custom hook for managing SQL query builder state
 * Centralizes all state management logic for better maintainability
 */
export function useQueryBuilder(initialState?: Partial<QueryState>) {
  const [queryState, setQueryState] = useState<QueryState>({
    queryType: "SELECT",
    table: "",
    columns: [],
    whereConditions: [],
    joins: [],
    orderBy: [],
    limit: null,
    offset: null,
    ...initialState,
  });

  // Generic field updater
  const updateField = useCallback(<K extends keyof QueryState>(
    field: K,
    value: QueryState[K]
  ) => {
    setQueryState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update query type
  const updateQueryType = useCallback((type: QueryState["queryType"]) => {
    setQueryState(prev => ({ ...prev, queryType: type }));
  }, []);

  // Update table (also resets columns when table changes)
  const updateTable = useCallback((table: string) => {
    setQueryState(prev => ({ ...prev, table, columns: [] }));
  }, []);

  // Update columns
  const updateColumns = useCallback((columns: string[]) => {
    setQueryState(prev => ({ ...prev, columns }));
  }, []);

  // Update WHERE conditions
  const updateWhereConditions = useCallback((conditions: WhereCondition[]) => {
    setQueryState(prev => ({ ...prev, whereConditions: conditions }));
  }, []);

  // Update ORDER BY
  const updateOrderBy = useCallback((orderBy: OrderByClause[]) => {
    setQueryState(prev => ({ ...prev, orderBy }));
  }, []);

  // Update LIMIT
  const updateLimit = useCallback((limit: number | null) => {
    setQueryState(prev => ({ ...prev, limit }));
  }, []);

  // Update OFFSET
  const updateOffset = useCallback((offset: number | null) => {
    setQueryState(prev => ({ ...prev, offset }));
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      whereConditions: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
    });
  }, []);

  // Load template
  const loadTemplate = useCallback((templateState: Partial<QueryState>) => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      whereConditions: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
      ...templateState,
    });
  }, []);

  return {
    queryState,
    updateField,
    updateQueryType,
    updateTable,
    updateColumns,
    updateWhereConditions,
    updateOrderBy,
    updateLimit,
    updateOffset,
    reset,
    loadTemplate,
  };
}

