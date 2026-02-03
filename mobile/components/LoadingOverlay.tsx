/**
 * LoadingOverlay component for blocking UI during async operations
 * Displays a modal overlay with an ActivityIndicator and custom message
 */

import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { COLORS } from '../constants/config';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  submessage?: string;
}

export function LoadingOverlay({
  visible,
  message = 'Carregando...',
  submessage,
}: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Surface style={styles.container} elevation={4}>
          <ActivityIndicator
            animating
            size="large"
            color={COLORS.primary}
            style={styles.indicator}
          />
          <Text variant="titleMedium" style={styles.message}>
            {message}
          </Text>
          {submessage && (
            <Text variant="bodySmall" style={styles.submessage}>
              {submessage}
            </Text>
          )}
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 280,
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    color: COLORS.text,
    textAlign: 'center',
  },
  submessage: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LoadingOverlay;
