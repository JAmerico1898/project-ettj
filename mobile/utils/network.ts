/**
 * Network utilities for connectivity checking
 */

import * as Network from 'expo-network';

/**
 * Network connection status
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
}

/**
 * Check if the device has internet connectivity
 * @returns Promise resolving to true if connected, false otherwise
 */
export async function checkInternetConnection(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable !== false;
  } catch (error) {
    // If we can't check network state, assume connected and let the request fail
    console.warn('Could not check network state:', error);
    return true;
  }
}

/**
 * Get detailed network status
 * @returns Promise resolving to NetworkStatus object
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return {
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? null,
      type: networkState.type ?? Network.NetworkStateType.UNKNOWN,
    };
  } catch (error) {
    console.warn('Could not get network status:', error);
    return {
      isConnected: false,
      isInternetReachable: null,
      type: Network.NetworkStateType.UNKNOWN,
    };
  }
}

/**
 * Wait for internet connection with timeout
 * @param timeout - Maximum time to wait in milliseconds
 * @param checkInterval - How often to check connectivity in milliseconds
 * @returns Promise resolving to true if connected within timeout, false otherwise
 */
export async function waitForConnection(
  timeout: number = 30000,
  checkInterval: number = 1000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isConnected = await checkInternetConnection();
    if (isConnected) {
      return true;
    }
    await sleep(checkInterval);
  }

  return false;
}

/**
 * Sleep utility - pause execution for specified duration
 * @param ms - Duration to sleep in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format network type for display
 * @param type - Network state type
 */
export function formatNetworkType(type: Network.NetworkStateType): string {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'Wi-Fi';
    case Network.NetworkStateType.CELLULAR:
      return 'Cellular';
    case Network.NetworkStateType.BLUETOOTH:
      return 'Bluetooth';
    case Network.NetworkStateType.ETHERNET:
      return 'Ethernet';
    case Network.NetworkStateType.VPN:
      return 'VPN';
    case Network.NetworkStateType.NONE:
      return 'Sem conexão';
    default:
      return 'Desconhecido';
  }
}

/**
 * Check if network type is metered (cellular)
 * Useful for warning users about large data transfers
 */
export async function isMeteredConnection(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.type === Network.NetworkStateType.CELLULAR;
  } catch {
    return false;
  }
}
