/**
 * Error Boundary component for catching React render errors
 * Shows fallback UI and logs errors for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { errorLogger } from '../services/errorLogger';

/**
 * Props for ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary class component
 * Must be a class component to use getDerivedStateFromError and componentDidCatch
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log the error
    errorLogger.log(
      'REACT_RENDER_ERROR',
      error.message,
      error,
      {
        componentStack: errorInfo.componentStack,
      }
    );

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          showDetails={this.props.showDetails ?? __DEV__}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Props for ErrorFallback
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  showDetails?: boolean;
}

/**
 * Default fallback UI component
 */
function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  showDetails = false,
}: ErrorFallbackProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Algo deu errado
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </Text>

          {showDetails && error && (
            <ScrollView style={styles.detailsContainer}>
              <Text variant="labelMedium" style={styles.detailsLabel}>
                Detalhes do erro:
              </Text>
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {error.message}
              </Text>

              {errorInfo?.componentStack && (
                <>
                  <Text variant="labelMedium" style={[styles.detailsLabel, styles.stackLabel]}>
                    Component Stack:
                  </Text>
                  <ScrollView horizontal>
                    <Text variant="bodySmall" style={styles.stackText}>
                      {errorInfo.componentStack}
                    </Text>
                  </ScrollView>
                </>
              )}
            </ScrollView>
          )}
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button mode="contained" onPress={onRetry}>
            Tentar novamente
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  detailsContainer: {
    maxHeight: 200,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  detailsLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stackLabel: {
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'monospace',
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
  actions: {
    justifyContent: 'center',
    paddingTop: 8,
  },
});

/**
 * Export the ErrorBoundary component
 */
export function ErrorBoundary(props: ErrorBoundaryProps): React.ReactElement {
  return <ErrorBoundaryClass {...props} />;
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}
