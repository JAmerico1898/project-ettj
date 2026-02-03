/**
 * Generic API hook for data fetching with loading and error states
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError, isApiError } from '../types/errors';
import { getErrorMessage } from '../services/apiErrors';

/**
 * State returned by useApi hook
 */
export interface UseApiState<T> {
  /** The fetched data, null if not yet fetched or on error */
  data: T | null;
  /** Whether a request is in progress */
  loading: boolean;
  /** The error object if request failed */
  error: ApiError | null;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Whether the request has been executed at least once */
  hasExecuted: boolean;
}

/**
 * Actions returned by useApi hook
 */
export interface UseApiActions<T, Args extends unknown[]> {
  /** Execute the API call */
  execute: (...args: Args) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Set data manually (useful for optimistic updates) */
  setData: (data: T | null) => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Complete return type for useApi hook
 */
export type UseApiReturn<T, Args extends unknown[]> = UseApiState<T> & UseApiActions<T, Args>;

/**
 * Options for useApi hook
 */
export interface UseApiOptions<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Callback when request succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when request fails */
  onError?: (error: ApiError) => void;
  /** Whether to throw errors instead of storing them */
  throwOnError?: boolean;
}

/**
 * Generic hook for API calls with loading and error state management
 *
 * @param apiFunction - The API function to call
 * @param options - Hook options
 * @returns State and actions for the API call
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApi(api.fetchDI1Data);
 *
 * // Execute with arguments
 * await execute('2024-01-15');
 *
 * // Render based on state
 * if (loading) return <Loading />;
 * if (error) return <Error message={errorMessage} />;
 * if (data) return <DataView data={data} />;
 * ```
 */
export function useApi<T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, Args> {
  const {
    initialData = null,
    onSuccess,
    onError,
    throwOnError = false,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  // Keep track of mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!isMounted.current) return null;

      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);

        if (!isMounted.current) return null;

        setData(result);
        setHasExecuted(true);
        onSuccess?.(result);

        return result;
      } catch (err) {
        if (!isMounted.current) return null;

        const apiError = isApiError(err)
          ? err
          : new ApiError(getErrorMessage(err));

        setError(apiError);
        setHasExecuted(true);
        onError?.(apiError);

        if (throwOnError) {
          throw apiError;
        }

        return null;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [apiFunction, onSuccess, onError, throwOnError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setHasExecuted(false);
  }, [initialData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const errorMessage = error ? getErrorMessage(error) : null;

  return {
    data,
    loading,
    error,
    errorMessage,
    hasExecuted,
    execute,
    reset,
    setData,
    clearError,
  };
}

/**
 * Hook for API calls that execute immediately on mount
 *
 * @param apiFunction - The API function to call
 * @param args - Arguments to pass to the API function
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useApiOnMount(api.getAvailableMethods);
 * ```
 */
export function useApiOnMount<T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  args: Args = [] as unknown as Args,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, Args> {
  const result = useApi(apiFunction, options);
  const { execute, hasExecuted } = result;

  useEffect(() => {
    if (!hasExecuted) {
      execute(...args);
    }
  }, [execute, hasExecuted, ...args]);

  return result;
}

/**
 * Hook for lazy API calls that need to be triggered manually
 * Alias for useApi with clearer intent
 */
export const useLazyApi = useApi;
