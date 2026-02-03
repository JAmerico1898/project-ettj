/**
 * Hooks for fetching DI1 futures data
 */

import { useCallback } from 'react';
import { useApi, useApiOnMount, UseApiOptions } from './useApi';
import { apiClient } from '../services/api';
import { DI1Response, DI1SummaryResponse } from '../types';

/**
 * Options for DI1 data hooks
 */
export interface UseDI1DataOptions extends UseApiOptions<DI1Response> {
  /** Maximum business days filter (default 1260 = 5 years) */
  maxBusinessDays?: number;
}

/**
 * Hook for fetching DI1 futures contracts
 *
 * @param options - Hook options
 * @returns API state and actions for DI1 data
 *
 * @example
 * ```tsx
 * const { data, loading, error, fetchData } = useDI1Data();
 *
 * // Fetch data for a specific date
 * await fetchData('2024-01-15');
 *
 * // Or fetch for the latest business day
 * await fetchData();
 * ```
 */
export function useDI1Data(options: UseDI1DataOptions = {}) {
  const { maxBusinessDays, ...apiOptions } = options;

  const apiFunction = useCallback(
    (date?: string) => apiClient.fetchDI1Data(date, maxBusinessDays),
    [maxBusinessDays]
  );

  const result = useApi<DI1Response, [string?]>(apiFunction, apiOptions);

  return {
    ...result,
    /** Fetch DI1 contracts for a date (or latest if not specified) */
    fetchData: result.execute,
    /** The fetched contracts */
    contracts: result.data?.contracts ?? [],
    /** Reference date for the data */
    referenceDate: result.data?.reference_date ?? null,
    /** Actual date the data was found for */
    actualDate: result.data?.actual_date ?? null,
    /** Number of contracts */
    count: result.data?.count ?? 0,
  };
}

/**
 * Hook that fetches DI1 data immediately on mount
 *
 * @param date - Optional date to fetch (defaults to latest business day)
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * // Fetch latest data on mount
 * const { contracts, loading, error } = useDI1DataOnMount();
 *
 * // Fetch specific date on mount
 * const { contracts } = useDI1DataOnMount('2024-01-15');
 * ```
 */
export function useDI1DataOnMount(date?: string, options: UseDI1DataOptions = {}) {
  const { maxBusinessDays, ...apiOptions } = options;

  const apiFunction = useCallback(
    (d?: string) => apiClient.fetchDI1Data(d, maxBusinessDays),
    [maxBusinessDays]
  );

  const result = useApiOnMount<DI1Response, [string?]>(
    apiFunction,
    [date],
    apiOptions
  );

  return {
    ...result,
    fetchData: result.execute,
    contracts: result.data?.contracts ?? [],
    referenceDate: result.data?.reference_date ?? null,
    actualDate: result.data?.actual_date ?? null,
    count: result.data?.count ?? 0,
  };
}

/**
 * Options for DI1 summary hook
 */
export interface UseDI1SummaryOptions extends UseApiOptions<DI1SummaryResponse> {}

/**
 * Hook for fetching DI1 summary statistics
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { summary, loading, fetchSummary } = useDI1Summary();
 *
 * await fetchSummary('2024-01-15');
 *
 * console.log(summary?.avg_rate_percent);
 * ```
 */
export function useDI1Summary(options: UseDI1SummaryOptions = {}) {
  const result = useApi<DI1SummaryResponse, [string?]>(
    (date?: string) => apiClient.fetchDI1Summary(date),
    options
  );

  return {
    ...result,
    /** Fetch summary for a date */
    fetchSummary: result.execute,
    /** The summary data */
    summary: result.data,
    /** Minimum rate in percentage */
    minRate: result.data?.min_rate_percent ?? null,
    /** Maximum rate in percentage */
    maxRate: result.data?.max_rate_percent ?? null,
    /** Average rate in percentage */
    avgRate: result.data?.avg_rate_percent ?? null,
  };
}

/**
 * Hook that fetches DI1 summary on mount
 *
 * @param date - Optional date to fetch
 * @param options - Hook options
 */
export function useDI1SummaryOnMount(date?: string, options: UseDI1SummaryOptions = {}) {
  const result = useApiOnMount<DI1SummaryResponse, [string?]>(
    (d?: string) => apiClient.fetchDI1Summary(d),
    [date],
    options
  );

  return {
    ...result,
    fetchSummary: result.execute,
    summary: result.data,
    minRate: result.data?.min_rate_percent ?? null,
    maxRate: result.data?.max_rate_percent ?? null,
    avgRate: result.data?.avg_rate_percent ?? null,
  };
}
