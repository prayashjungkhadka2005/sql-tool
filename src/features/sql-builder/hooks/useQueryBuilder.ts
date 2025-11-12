import { useState, useCallback } from "react";
import { QueryState, WhereCondition, OrderByClause, AggregateColumn, HavingCondition, JoinClause } from "../types";

/**
 * Custom hook for managing SQL query builder state
 * Centralizes all state management logic for better maintainability
 */
export function useQueryBuilder(initialState?: Partial<QueryState>) {
  const [queryState, setQueryState] = useState<QueryState>({
    queryType: "SELECT",
    table: "",
    columns: [],
    aggregates: [],
    distinct: false,
    whereConditions: [],
    joins: [],
    groupBy: [],
    having: [],
    orderBy: [],
    limit: null,
    offset: null,
    insertValues: {},
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

  // Update table (also resets ALL query components when table changes)
  const updateTable = useCallback((table: string) => {
    setQueryState(prev => ({ 
      ...prev, 
      table, 
      columns: [],
      aggregates: [],
      whereConditions: [],
      joins: [],
      groupBy: [],
      having: [],
      orderBy: [],
      insertValues: {},
    }));
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

  // Update aggregates
  const updateAggregates = useCallback((aggregates: AggregateColumn[]) => {
    setQueryState(prev => ({ ...prev, aggregates }));
  }, []);

  // Update GROUP BY
  const updateGroupBy = useCallback((groupBy: string[]) => {
    setQueryState(prev => ({ ...prev, groupBy }));
  }, []);

  // Update HAVING
  const updateHaving = useCallback((having: HavingCondition[]) => {
    setQueryState(prev => ({ ...prev, having }));
  }, []);

  // Update DISTINCT
  const updateDistinct = useCallback((distinct: boolean) => {
    setQueryState(prev => ({ ...prev, distinct }));
  }, []);

  // Update INSERT values
  const updateInsertValues = useCallback((insertValues: Record<string, string>) => {
    setQueryState(prev => ({ ...prev, insertValues }));
  }, []);

  // Update JOINs
  const updateJoins = useCallback((joins: JoinClause[]) => {
    setQueryState(prev => ({ ...prev, joins }));
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      aggregates: [],
      distinct: false,
      whereConditions: [],
      joins: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: null,
      offset: null,
      insertValues: {},
    });
  }, []);

  // Load template
  const loadTemplate = useCallback((templateState: Partial<QueryState>) => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      aggregates: [],
      distinct: false,
      whereConditions: [],
      joins: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: null,
      offset: null,
      insertValues: {},
      ...templateState,
    });
  }, []);

  return {
    queryState,
    updateField,
    updateQueryType,
    updateTable,
    updateColumns,
    updateAggregates,
    updateDistinct,
    updateWhereConditions,
    updateJoins,
    updateGroupBy,
    updateHaving,
    updateOrderBy,
    updateLimit,
    updateOffset,
    updateInsertValues,
    reset,
    loadTemplate,
  };
}

