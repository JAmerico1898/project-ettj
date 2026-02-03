/**
 * Hooks for workflow operations (combined data + curve operations)
 */

import { useCallback } from 'react';
import { useApi, useApiOnMount, UseApiOptions } from './useApi';
import { apiClient } from '../services/api';
import {
  WorkflowRequest,
  WorkflowResponse,
  CompareMethodsRequest,
  CompareMethodsResponse,
  SmoothingMethod,
} from '../types';

/**
 * Options for workflow hook
 */
export interface UseWorkflowOptions extends UseApiOptions<WorkflowResponse> {}

/**
 * Hook for executing end-to-end workflow (fetch data + calculate curve)
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { data, loading, error, executeWorkflow } = useWorkflow();
 *
 * // Execute workflow
 * await executeWorkflow({
 *   date: '2024-01-15',
 *   method: 'nelson_siegel_svensson',
 * });
 *
 * // Access results
 * console.log(data?.di1.contracts);
 * console.log(data?.curve.points);
 * ```
 */
export function useWorkflow(options: UseWorkflowOptions = {}) {
  const result = useApi<WorkflowResponse, [WorkflowRequest]>(
    (request: WorkflowRequest) => apiClient.workflow(request),
    options
  );

  return {
    ...result,
    /** Execute the workflow */
    executeWorkflow: result.execute,
    /** DI1 data from the workflow */
    di1: result.data?.di1 ?? null,
    /** Curve data from the workflow */
    curve: result.data?.curve ?? null,
    /** Calculation metrics */
    metrics: result.data?.metrics ?? null,
    /** Contracts from DI1 data */
    contracts: result.data?.di1?.contracts ?? [],
    /** Curve points */
    points: result.data?.curve?.points ?? [],
    /** Reference date */
    referenceDate: result.data?.di1?.reference_date ?? null,
    /** Actual date data was found for */
    actualDate: result.data?.di1?.actual_date ?? null,
  };
}

/**
 * Simplified workflow hook with individual parameters
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { executeWorkflow, contracts, points } = useSimpleWorkflow();
 *
 * await executeWorkflow('nelson_siegel_svensson', '2024-01-15');
 * ```
 */
export function useSimpleWorkflow(options: UseWorkflowOptions = {}) {
  const apiFunction = useCallback(
    (
      method: SmoothingMethod,
      date?: string,
      smoothingParameter?: number,
      maxBusinessDays?: number
    ) => {
      const request: WorkflowRequest = {
        date,
        method,
        smoothing_parameter: smoothingParameter,
        max_business_days: maxBusinessDays,
      };
      return apiClient.workflow(request);
    },
    []
  );

  const result = useApi<
    WorkflowResponse,
    [SmoothingMethod, string?, number?, number?]
  >(apiFunction, options);

  return {
    ...result,
    executeWorkflow: result.execute,
    di1: result.data?.di1 ?? null,
    curve: result.data?.curve ?? null,
    metrics: result.data?.metrics ?? null,
    contracts: result.data?.di1?.contracts ?? [],
    points: result.data?.curve?.points ?? [],
    referenceDate: result.data?.di1?.reference_date ?? null,
    actualDate: result.data?.di1?.actual_date ?? null,
  };
}

/**
 * Options for compare methods hook
 */
export interface UseCompareMethodsOptions extends UseApiOptions<CompareMethodsResponse> {}

/**
 * Hook for comparing multiple smoothing methods
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { data, loading, compareMethods } = useCompareMethods();
 *
 * // Compare multiple methods
 * await compareMethods({
 *   date: '2024-01-15',
 *   methods: ['nelson_siegel', 'nelson_siegel_svensson', 'cubic_spline'],
 * });
 *
 * // Access comparison results
 * data?.results.forEach(result => {
 *   console.log(result.method, result.metrics?.rmse);
 * });
 * ```
 */
export function useCompareMethods(options: UseCompareMethodsOptions = {}) {
  const result = useApi<CompareMethodsResponse, [CompareMethodsRequest]>(
    (request: CompareMethodsRequest) => apiClient.compareMethods(request),
    options
  );

  return {
    ...result,
    /** Execute comparison */
    compareMethods: result.execute,
    /** DI1 data used for comparison */
    di1: result.data?.di1 ?? null,
    /** Comparison results for each method */
    results: result.data?.results ?? [],
    /** Number of methods compared */
    methodCount: result.data?.results?.length ?? 0,
    /** Get result for a specific method */
    getMethodResult: (method: SmoothingMethod) =>
      result.data?.results?.find((r) => r.method === method) ?? null,
    /** Get the best method by RMSE */
    bestMethod: result.data?.results?.reduce((best, current) => {
      if (!best || !best.metrics?.rmse) return current;
      if (!current.metrics?.rmse) return best;
      return current.metrics.rmse < best.metrics.rmse ? current : best;
    }, result.data?.results?.[0] ?? null),
  };
}

/**
 * Simplified compare methods hook
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { compare, results, bestMethod } = useSimpleCompareMethods();
 *
 * await compare(
 *   ['nelson_siegel', 'nelson_siegel_svensson'],
 *   '2024-01-15'
 * );
 * ```
 */
export function useSimpleCompareMethods(options: UseCompareMethodsOptions = {}) {
  const apiFunction = useCallback(
    (
      methods: SmoothingMethod[],
      date?: string,
      smoothingParameter?: number,
      maxBusinessDays?: number
    ) => {
      const request: CompareMethodsRequest = {
        date,
        methods,
        smoothing_parameter: smoothingParameter,
        max_business_days: maxBusinessDays,
      };
      return apiClient.compareMethods(request);
    },
    []
  );

  const result = useApi<
    CompareMethodsResponse,
    [SmoothingMethod[], string?, number?, number?]
  >(apiFunction, options);

  return {
    ...result,
    compare: result.execute,
    di1: result.data?.di1 ?? null,
    results: result.data?.results ?? [],
    methodCount: result.data?.results?.length ?? 0,
    getMethodResult: (method: SmoothingMethod) =>
      result.data?.results?.find((r) => r.method === method) ?? null,
    bestMethod: result.data?.results?.reduce((best, current) => {
      if (!best || !best.metrics?.rmse) return current;
      if (!current.metrics?.rmse) return best;
      return current.metrics.rmse < best.metrics.rmse ? current : best;
    }, result.data?.results?.[0] ?? null),
  };
}

/**
 * Hook that executes workflow on mount with specified parameters
 *
 * @param method - Smoothing method to use
 * @param date - Optional date (defaults to latest business day)
 * @param options - Hook options
 */
export function useWorkflowOnMount(
  method: SmoothingMethod,
  date?: string,
  options: UseWorkflowOptions = {}
) {
  const apiFunction = useCallback(
    () =>
      apiClient.workflow({
        date,
        method,
      }),
    [date, method]
  );

  const result = useApiOnMount<WorkflowResponse, []>(apiFunction, [], options);

  return {
    ...result,
    executeWorkflow: result.execute,
    di1: result.data?.di1 ?? null,
    curve: result.data?.curve ?? null,
    metrics: result.data?.metrics ?? null,
    contracts: result.data?.di1?.contracts ?? [],
    points: result.data?.curve?.points ?? [],
    referenceDate: result.data?.di1?.reference_date ?? null,
    actualDate: result.data?.di1?.actual_date ?? null,
  };
}
