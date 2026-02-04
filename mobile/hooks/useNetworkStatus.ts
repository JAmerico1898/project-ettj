/**
 * Real-time network status monitoring hook
 * Provides reactive network connectivity state using expo-network
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Network from 'expo-network';
import { getNetworkStatus, formatNetworkType, NetworkStatus as BaseNetworkStatus } from '../utils/network';

/**
 * Extended network status with convenience properties
 */
export interface NetworkStatus extends BaseNetworkStatus {
  isWifi: boolean;
  isCellular: boolean;
  isOnline: boolean;
  connectionDescription: string;
}

/**
 * Hook return type
 */
export interface UseNetworkStatusReturn {
  status: NetworkStatus;
  isLoading: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Default network status (optimistic - assume connected until proven otherwise)
 */
const defaultStatus: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  type: Network.NetworkStateType.UNKNOWN,
  isWifi: false,
  isCellular: false,
  isOnline: true,
  connectionDescription: 'Verificando...',
};

/**
 * Transform base network status to extended status
 */
function transformStatus(base: BaseNetworkStatus): NetworkStatus {
  const isWifi = base.type === Network.NetworkStateType.WIFI;
  const isCellular = base.type === Network.NetworkStateType.CELLULAR;
  const isOnline = base.isConnected && base.isInternetReachable !== false;

  let connectionDescription: string;
  if (!base.isConnected) {
    connectionDescription = 'Sem conexão';
  } else if (base.isInternetReachable === false) {
    connectionDescription = 'Conectado, sem internet';
  } else {
    connectionDescription = formatNetworkType(base.type);
  }

  return {
    ...base,
    isWifi,
    isCellular,
    isOnline,
    connectionDescription,
  };
}

/**
 * Hook for real-time network status monitoring
 *
 * @param pollingInterval - Optional polling interval in ms (default: 5000)
 * @returns NetworkStatus with isLoading, refresh function, and lastUpdated timestamp
 *
 * @example
 * ```tsx
 * const { status, isLoading, refresh } = useNetworkStatus();
 *
 * if (!status.isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useNetworkStatus(pollingInterval: number = 5000): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const baseStatus = await getNetworkStatus();
      if (mountedRef.current) {
        setStatus(transformStatus(baseStatus));
        setLastUpdated(new Date());
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[useNetworkStatus] Failed to refresh network status:', error);
      }
      // On error, assume connected to avoid false negatives
      if (mountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isOnline: true,
          connectionDescription: 'Status desconhecido',
        }));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    refresh();

    // Set up polling for network status
    // Note: expo-network doesn't have event-based subscriptions,
    // so we use polling as a fallback
    intervalRef.current = setInterval(refresh, pollingInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refresh, pollingInterval]);

  return {
    status,
    isLoading,
    refresh,
    lastUpdated,
  };
}

/**
 * Simple hook that just returns boolean online status
 *
 * @example
 * ```tsx
 * const isOnline = useIsOnline();
 * ```
 */
export function useIsOnline(): boolean {
  const { status } = useNetworkStatus();
  return status.isOnline;
}

/**
 * Hook that provides offline detection with debounce
 * Useful to avoid flickering UI on brief disconnections
 *
 * @param debounceMs - Time to wait before reporting offline (default: 2000ms)
 */
export function useOfflineDetection(debounceMs: number = 2000): {
  isOffline: boolean;
  isDefinitelyOffline: boolean;
} {
  const { status } = useNetworkStatus();
  const [isDefinitelyOffline, setIsDefinitelyOffline] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!status.isOnline) {
      // Start debounce timer
      timeoutRef.current = setTimeout(() => {
        setIsDefinitelyOffline(true);
      }, debounceMs);
    } else {
      // Clear timer and reset state
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsDefinitelyOffline(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status.isOnline, debounceMs]);

  return {
    isOffline: !status.isOnline,
    isDefinitelyOffline,
  };
}
