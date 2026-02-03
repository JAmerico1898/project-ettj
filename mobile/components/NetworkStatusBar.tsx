/**
 * Network Status Bar component
 * Compact status bar showing connection issues at the top of the screen
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Status type for the network bar
 */
type NetworkBarStatus = 'online' | 'offline' | 'limited';

/**
 * Props for NetworkStatusBar
 */
interface NetworkStatusBarProps {
  /** Whether to show the bar even when online (for debugging) */
  alwaysShow?: boolean;
}

/**
 * Get status config based on network state
 */
function getStatusConfig(
  isConnected: boolean,
  isInternetReachable: boolean | null
): {
  status: NetworkBarStatus;
  message: string;
  icon: string;
} {
  if (!isConnected) {
    return {
      status: 'offline',
      message: 'Sem conexão',
      icon: 'wifi-off',
    };
  }

  if (isInternetReachable === false) {
    return {
      status: 'limited',
      message: 'Conectado, sem internet',
      icon: 'wifi-alert',
    };
  }

  return {
    status: 'online',
    message: 'Conectado',
    icon: 'wifi',
  };
}

/**
 * NetworkStatusBar component
 * Shows a colored bar when there are connection issues
 */
export function NetworkStatusBar({ alwaysShow = false }: NetworkStatusBarProps): React.ReactElement | null {
  const theme = useTheme();
  const { status: networkStatus, isLoading } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-50)).current;
  const [isVisible, setIsVisible] = React.useState(false);

  const statusConfig = getStatusConfig(
    networkStatus.isConnected,
    networkStatus.isInternetReachable
  );

  // Animate in/out based on status
  React.useEffect(() => {
    const shouldShow = alwaysShow || statusConfig.status !== 'online';

    if (shouldShow && !isLoading) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [statusConfig.status, isLoading, alwaysShow, slideAnim]);

  // Don't render anything if not visible
  if (!isVisible && !alwaysShow) {
    return null;
  }

  // Get background color based on status
  const getBackgroundColor = (): string => {
    switch (statusConfig.status) {
      case 'offline':
        return theme.colors.error;
      case 'limited':
        return theme.colors.tertiary || '#FF9800';
      case 'online':
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          paddingTop: insets.top > 0 ? insets.top : 4,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.text}>{statusConfig.message}</Text>
        {networkStatus.connectionDescription && statusConfig.status !== 'online' && (
          <Text style={styles.subtext}>
            {networkStatus.connectionDescription}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Minimal network dot indicator
 * Shows a small colored dot indicating network status
 */
export function NetworkDot(): React.ReactElement {
  const theme = useTheme();
  const { status: networkStatus } = useNetworkStatus();

  const getColor = (): string => {
    if (!networkStatus.isConnected) {
      return theme.colors.error;
    }
    if (networkStatus.isInternetReachable === false) {
      return theme.colors.tertiary || '#FF9800';
    }
    return theme.colors.primary;
  };

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: getColor(),
        },
      ]}
    />
  );
}

/**
 * Network status text component
 * Shows connection type (e.g., "Wi-Fi", "Cellular")
 */
export function NetworkStatusText(): React.ReactElement {
  const theme = useTheme();
  const { status: networkStatus } = useNetworkStatus();

  const getColor = (): string => {
    if (!networkStatus.isOnline) {
      return theme.colors.error;
    }
    return theme.colors.onSurface;
  };

  return (
    <View style={styles.statusTextContainer}>
      <NetworkDot />
      <Text
        variant="labelSmall"
        style={[styles.statusText, { color: getColor() }]}
      >
        {networkStatus.connectionDescription}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    opacity: 0.8,
  },
});
