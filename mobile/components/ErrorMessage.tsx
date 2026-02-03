/**
 * ErrorMessage component for displaying errors with optional retry/dismiss actions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { COLORS } from '../constants/config';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
  showIcon?: boolean;
}

export function ErrorMessage({
  message,
  title = 'Erro',
  onRetry,
  onDismiss,
  retryLabel = 'Tentar novamente',
  dismissLabel = 'Fechar',
  showIcon = true,
}: ErrorMessageProps) {
  return (
    <Card style={styles.container} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          {showIcon && (
            <IconButton
              icon="alert-circle"
              iconColor={COLORS.error}
              size={24}
              style={styles.icon}
            />
          )}
          <View style={styles.textContainer}>
            <Text variant="titleSmall" style={styles.title}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              {message}
            </Text>
          </View>
        </View>
        {(onRetry || onDismiss) && (
          <View style={styles.actions}>
            {onRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                icon="refresh"
                style={styles.retryButton}
                buttonColor={COLORS.primary}
              >
                {retryLabel}
              </Button>
            )}
            {onDismiss && (
              <Button
                mode="text"
                onPress={onDismiss}
                style={styles.dismissButton}
              >
                {dismissLabel}
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

/**
 * Compact error message for inline display
 */
export function ErrorMessageCompact({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <View style={styles.compactContainer}>
      <IconButton
        icon="alert-circle-outline"
        iconColor={COLORS.error}
        size={18}
        style={styles.compactIcon}
      />
      <Text variant="bodySmall" style={styles.compactMessage} numberOfLines={2}>
        {message}
      </Text>
      {onDismiss && (
        <IconButton
          icon="close"
          size={16}
          onPress={onDismiss}
          style={styles.compactDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    margin: 0,
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    color: COLORS.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  retryButton: {
    minWidth: 140,
  },
  dismissButton: {
    minWidth: 80,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  compactIcon: {
    margin: 0,
    marginRight: 4,
  },
  compactMessage: {
    flex: 1,
    color: COLORS.error,
    fontSize: 12,
  },
  compactDismiss: {
    margin: 0,
    marginLeft: 4,
  },
});

export default ErrorMessage;
