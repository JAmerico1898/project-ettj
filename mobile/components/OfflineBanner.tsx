/**
 * Offline Banner component
 * Shows a warning banner when the device is offline
 */

import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Banner, useTheme } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Props for OfflineBanner
 */
interface OfflineBannerProps {
  /** Custom message to show when offline */
  message?: string;
  /** Whether the banner can be dismissed */
  dismissable?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
}

/**
 * OfflineBanner component
 * Automatically shows when device loses internet connection
 */
export function OfflineBanner({
  message = 'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
  dismissable = false,
  onDismiss,
}: OfflineBannerProps): React.ReactElement | null {
  const theme = useTheme();
  const { status, isLoading } = useNetworkStatus();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Reset dismissed state when connection is restored
  React.useEffect(() => {
    if (status.isOnline) {
      setIsDismissed(false);
    }
  }, [status.isOnline]);

  // Don't show while loading initial status
  if (isLoading) {
    return null;
  }

  // Don't show if online or dismissed
  if (status.isOnline || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Banner
      visible={!status.isOnline && !isDismissed}
      actions={
        dismissable
          ? [
              {
                label: 'Fechar',
                onPress: handleDismiss,
              },
            ]
          : []
      }
      icon="wifi-off"
      style={[styles.banner, { backgroundColor: theme.colors.errorContainer }]}
      contentStyle={styles.content}
    >
      {message}
    </Banner>
  );
}

/**
 * Compact offline indicator for tight spaces
 */
export function OfflineIndicator(): React.ReactElement | null {
  const theme = useTheme();
  const { status, isLoading } = useNetworkStatus();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: status.isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [status.isOnline, fadeAnim]);

  if (isLoading || status.isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          backgroundColor: theme.colors.error,
          opacity: fadeAnim,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 4,
  },
  content: {
    paddingVertical: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
