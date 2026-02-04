/**
 * Performance utilities for the ETTJ mobile app
 * Includes debounce, throttle, and memoization helpers
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   api.search(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns The throttled function
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event');
 * }, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Simple memoization function for expensive computations
 *
 * @param func - The function to memoize
 * @param keyResolver - Optional function to resolve the cache key
 * @returns The memoized function
 *
 * @example
 * const memoizedCalculation = memoize((data: number[]) => {
 *   return data.reduce((a, b) => a + b, 0);
 * });
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyResolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Request deduplication - prevents duplicate API calls for the same request
 *
 * @param func - The async function to deduplicate
 * @returns The deduplicated function
 *
 * @example
 * const deduplicatedFetch = deduplicateRequest(async (id: string) => {
 *   return await api.getData(id);
 * });
 */
export function deduplicateRequest<T extends (...args: any[]) => Promise<any>>(
  func: T
): T {
  const pendingRequests = new Map<string, Promise<any>>();

  return async function deduplicated(...args: Parameters<T>): Promise<ReturnType<T>> {
    const key = JSON.stringify(args);

    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }

    const promise = func(...args).finally(() => {
      pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
  } as T;
}

/**
 * Measures the execution time of a function
 *
 * @param func - The function to measure
 * @param label - Optional label for logging
 * @returns The result of the function
 */
export async function measureTime<T>(
  func: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await func();
  const duration = performance.now() - start;

  if (__DEV__ && label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Batch multiple operations into a single execution
 *
 * @param operations - Array of functions to execute
 * @param batchSize - Number of operations per batch
 * @param delayBetweenBatches - Delay in ms between batches
 */
export async function batchOperations<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5,
  delayBetweenBatches: number = 0
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);

    if (delayBetweenBatches > 0 && i + batchSize < operations.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Creates a function that will only execute after being called n times
 *
 * @param n - Number of calls before executing
 * @param func - The function to execute
 */
export function after<T extends (...args: any[]) => any>(n: number, func: T): T {
  let count = 0;

  return function afterN(...args: Parameters<T>): ReturnType<T> | undefined {
    count++;
    if (count >= n) {
      return func(...args);
    }
    return undefined;
  } as T;
}
