# Feature 10: Error Handling and Offline Support

## Overview
Implement comprehensive error handling, offline support, and resilience features throughout the application. This feature ensures the app gracefully handles network failures, API errors, invalid data, and provides a good user experience even when offline or experiencing connectivity issues.

---

## Prerequisites
- **All Features 1-9** completed
- Full application functional
- API client with error handling
- Settings system in place

---

## Objectives
- Implement global error boundary
- Add comprehensive offline detection
- Create offline mode with cached data
- Implement retry mechanisms
- Add error recovery strategies
- Create user-friendly error messages
- Log errors for debugging
- Add network status indicator
- Implement graceful degradation
- Cache API responses
- Handle edge cases and corner cases
- Provide clear user feedback
- Add error reporting (optional)
- Implement connection quality monitoring

---

## Architecture

### Error Handling Layers
```
┌─────────────────────────────────┐
│   React Error Boundary          │ ← UI crashes
├─────────────────────────────────┤
│   Network Layer                 │ ← API errors
├─────────────────────────────────┤
│   Data Validation Layer         │ ← Invalid data
├─────────────────────────────────┤
│   Business Logic Layer          │ ← Calculation errors
└─────────────────────────────────┘
```

---

## Implementation

### File Structure
```
mobile/
├── components/
│   ├── ErrorBoundary.tsx          # Error boundary (NEW)
│   ├── OfflineBanner.tsx          # Offline indicator (NEW)
│   ├── NetworkStatusBar.tsx       # Network status (NEW)
│   ├── RetryButton.tsx            # Retry component (NEW)
│   └── ErrorFallback.tsx          # Error fallback UI (NEW)
├── hooks/
│   ├── useNetworkStatus.ts        # Network hook (NEW)
│   ├── useOfflineQueue.ts         # Offline queue (NEW)
│   └── useErrorHandler.ts         # Error handler hook (NEW)
├── services/
│   ├── cacheService.ts            # Cache management (NEW)
│   ├── errorLogger.ts             # Error logging (NEW)
│   └── offlineManager.ts          # Offline operations (NEW)
├── utils/
│   ├── errorUtils.ts              # Error utilities (NEW)
│   ├── retryUtils.ts              # Retry logic (NEW)
│   └── validationUtils.ts         # Data validation (NEW)
└── constants/
    └── errorMessages.ts           # Error messages (NEW)
```

---

## Code Implementation

### `mobile/constants/errorMessages.ts` (NEW FILE)
```typescript
/**
 * User-friendly error messages
 */

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  TIMEOUT_ERROR: 'A requisição demorou muito. Verifique sua conexão.',
  SERVER_UNAVAILABLE: 'Servidor temporariamente indisponível. Tente novamente em alguns minutos.',
  
  // API errors
  INVALID_DATE: 'Data inválida. Selecione um dia útil (segunda a sexta).',
  NO_DATA_AVAILABLE: 'Não há dados disponíveis para esta data. Pode ser feriado ou fim de semana.',
  INSUFFICIENT_DATA: 'Dados insuficientes para calcular a curva. Tente outra data.',
  CALCULATION_FAILED: 'Erro ao calcular a curva. Tente outro método de interpolação.',
  
  // Validation errors
  INVALID_INPUT: 'Entrada inválida. Verifique os valores e tente novamente.',
  DATE_IN_FUTURE: 'A data não pode ser no futuro.',
  DATE_TOO_OLD: 'A data não pode ser mais de 10 anos no passado.',
  WEEKEND_DATE: 'Selecione um dia útil. Fins de semana não têm dados disponíveis.',
  
  // Data errors
  INVALID_RESPONSE: 'Resposta inválida do servidor. Tente novamente.',
  CORRUPTED_DATA: 'Dados corrompidos. Limpe o cache nas configurações.',
  CACHE_ERROR: 'Erro ao acessar dados armazenados.',
  
  // Unknown errors
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
  
  // Recovery suggestions
  RETRY_SUGGESTION: 'Toque em "Tentar Novamente" ou volte e tente com outra data.',
  OFFLINE_SUGGESTION: 'Você está offline. Conecte-se à internet para buscar dados atualizados.',
  SETTINGS_SUGGESTION: 'Verifique as configurações de API em Configurações > Avançado.',
};

export const ERROR_TITLES = {
  NETWORK_ERROR: 'Sem Conexão',
  API_ERROR: 'Erro do Servidor',
  VALIDATION_ERROR: 'Dados Inválidos',
  CALCULATION_ERROR: 'Erro de Cálculo',
  UNKNOWN_ERROR: 'Erro Inesperado',
};

export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function getErrorTitle(errorCode: string): string {
  // Map error codes to titles
  if (errorCode.includes('NETWORK')) return ERROR_TITLES.NETWORK_ERROR;
  if (errorCode.includes('API') || errorCode.includes('SERVER')) return ERROR_TITLES.API_ERROR;
  if (errorCode.includes('INVALID') || errorCode.includes('VALIDATION')) return ERROR_TITLES.VALIDATION_ERROR;
  if (errorCode.includes('CALCULATION')) return ERROR_TITLES.CALCULATION_ERROR;
  return ERROR_TITLES.UNKNOWN_ERROR;
}
```

### `mobile/hooks/useNetworkStatus.ts` (NEW FILE)
```typescript
/**
 * Network status monitoring hook
 */
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
  strength: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
    isWifi: false,
    isCellular: false,
    strength: 'unknown',
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        strength: getConnectionStrength(state),
      });
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        strength: getConnectionStrength(state),
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

function getConnectionStrength(state: NetInfoState): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (!state.isConnected) return 'poor';
  
  // For WiFi, use details if available
  if (state.type === 'wifi' && state.details) {
    const details = state.details as any;
    if (details.strength !== undefined) {
      if (details.strength >= 80) return 'excellent';
      if (details.strength >= 60) return 'good';
      if (details.strength >= 40) return 'fair';
      return 'poor';
    }
  }
  
  // For cellular, use details if available
  if (state.type === 'cellular' && state.details) {
    const details = state.details as any;
    if (details.cellularGeneration === '5g') return 'excellent';
    if (details.cellularGeneration === '4g') return 'good';
    if (details.cellularGeneration === '3g') return 'fair';
    return 'poor';
  }
  
  return 'unknown';
}
```

### `mobile/services/cacheService.ts` (NEW FILE)
```typescript
/**
 * Cache service for offline support
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@ettj_cache_';
const CACHE_METADATA_KEY = '@ettj_cache_metadata';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheMetadata {
  keys: string[];
  totalSize: number;
}

export class CacheService {
  private defaultTTL: number = 3600000; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const stored = await AsyncStorage.getItem(cacheKey);
      
      if (!stored) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl || this.defaultTTL),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      await this.updateMetadata(key, 'add');
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);
      await this.updateMetadata(key, 'remove');
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      const keys = metadata.keys.map(k => CACHE_PREFIX + k);
      await AsyncStorage.multiRemove(keys);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  async getMetadata(): Promise<CacheMetadata> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (!stored) {
        return { keys: [], totalSize: 0 };
      }
      return JSON.parse(stored);
    } catch (error) {
      return { keys: [], totalSize: 0 };
    }
  }

  private async updateMetadata(key: string, action: 'add' | 'remove'): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      
      if (action === 'add') {
        if (!metadata.keys.includes(key)) {
          metadata.keys.push(key);
        }
      } else {
        metadata.keys = metadata.keys.filter(k => k !== key);
      }

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Metadata update error:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      let totalSize = 0;

      for (const key of metadata.keys) {
        const cacheKey = CACHE_PREFIX + key;
        const value = await AsyncStorage.getItem(cacheKey);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async cleanExpired(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      let cleanedCount = 0;

      for (const key of metadata.keys) {
        const data = await this.get(key);
        if (data === null) {
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      return 0;
    }
  }
}

export const cacheService = new CacheService();
```

### `mobile/services/errorLogger.ts` (NEW FILE)
```typescript
/**
 * Error logging service
 */
import * as FileSystem from 'expo-file-system';

interface ErrorLog {
  timestamp: string;
  errorCode: string;
  message: string;
  stack?: string;
  context?: any;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private logFilePath = `${FileSystem.documentDirectory}error-logs.json`;

  async log(
    errorCode: string,
    message: string,
    error?: Error,
    context?: any
  ): Promise<void> {
    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      errorCode,
      message,
      stack: error?.stack,
      context,
    };

    // Add to memory
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('[ErrorLogger]', logEntry);
    }

    // Persist to file
    try {
      await this.persistLogs();
    } catch (e) {
      console.error('Failed to persist error logs:', e);
    }
  }

  async getLogs(): Promise<ErrorLog[]> {
    return this.logs;
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    try {
      await FileSystem.deleteAsync(this.logFilePath, { idempotent: true });
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  private async persistLogs(): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        this.logFilePath,
        JSON.stringify(this.logs)
      );
    } catch (error) {
      // Fail silently - don't want logging errors to crash the app
    }
  }

  async loadLogs(): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(this.logFilePath);
        this.logs = JSON.parse(content);
      }
    } catch (error) {
      // Start with empty logs if loading fails
      this.logs = [];
    }
  }
}

export const errorLogger = new ErrorLogger();
```

### `mobile/components/ErrorBoundary.tsx` (NEW FILE)
```typescript
/**
 * React Error Boundary component
 */
import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { errorLogger } from '@/services/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    errorLogger.log(
      'REACT_ERROR_BOUNDARY',
      error.message,
      error,
      { componentStack: errorInfo.componentStack }
    );

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.title}>
                  😔 Algo deu errado
                </Text>
                <Text variant="bodyMedium" style={styles.message}>
                  O aplicativo encontrou um erro inesperado.
                </Text>

                {__DEV__ && this.state.error && (
                  <>
                    <Text variant="labelMedium" style={styles.debugTitle}>
                      Detalhes do erro (apenas em desenvolvimento):
                    </Text>
                    <View style={styles.debugBox}>
                      <Text variant="bodySmall" style={styles.debugText}>
                        {this.state.error.toString()}
                      </Text>
                      {this.state.errorInfo && (
                        <Text variant="bodySmall" style={styles.debugText}>
                          {this.state.errorInfo.componentStack}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </Card.Content>
              <Card.Actions>
                <Button mode="contained" onPress={this.handleRetry}>
                  Tentar Novamente
                </Button>
              </Card.Actions>
            </Card>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 16,
    color: '#B00020',
  },
  message: {
    marginBottom: 16,
  },
  debugTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  debugBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    maxHeight: 300,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
```

### `mobile/components/OfflineBanner.tsx` (NEW FILE)
```typescript
/**
 * Offline mode banner
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const networkStatus = useNetworkStatus();
  const [visible, setVisible] = React.useState(!networkStatus.isConnected);

  React.useEffect(() => {
    setVisible(!networkStatus.isConnected);
  }, [networkStatus.isConnected]);

  if (!visible) {
    return null;
  }

  return (
    <Banner
      visible={visible}
      icon="wifi-off"
      style={styles.banner}
    >
      Você está offline. Algumas funcionalidades podem estar limitadas.
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9800',
  },
});
```

### `mobile/components/NetworkStatusBar.tsx` (NEW FILE)
```typescript
/**
 * Network status indicator bar
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkStatusBar() {
  const status = useNetworkStatus();

  if (status.isConnected && status.isInternetReachable) {
    return null; // Don't show anything when connected
  }

  const getMessage = () => {
    if (!status.isConnected) {
      return '📡 Sem conexão';
    }
    if (status.isInternetReachable === false) {
      return '⚠️ Conectado, mas sem acesso à internet';
    }
    return '🔄 Verificando conexão...';
  };

  const getBackgroundColor = () => {
    if (!status.isConnected) return '#F44336';
    if (status.isInternetReachable === false) return '#FF9800';
    return '#2196F3';
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text variant="bodySmall" style={styles.text}>
        {getMessage()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```

### `mobile/components/RetryButton.tsx` (NEW FILE)
```typescript
/**
 * Retry button component with loading state
 */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface RetryButtonProps {
  onRetry: () => Promise<void>;
  label?: string;
  disabled?: boolean;
}

export function RetryButton({
  onRetry,
  label = 'Tentar Novamente',
  disabled = false,
}: RetryButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    try {
      setLoading(true);
      await onRetry();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleRetry}
      loading={loading}
      disabled={disabled || loading}
      icon="refresh"
      style={styles.button}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
});
```

### `mobile/utils/retryUtils.ts` (NEW FILE)
```typescript
/**
 * Retry utilities with exponential backoff
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === opts.maxAttempts - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      // Notify about retry
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function shouldRetryNetworkError(error: any): boolean {
  // Retry on network errors and 5xx server errors
  if (error.name === 'NetworkError') return true;
  if (error.statusCode && error.statusCode >= 500) return true;
  if (error.code === 'ECONNABORTED') return true;
  
  // Don't retry on 4xx client errors (except 408 timeout)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return error.statusCode === 408;
  }
  
  return false;
}
```

### `mobile/utils/validationUtils.ts` (NEW FILE)
```typescript
/**
 * Data validation utilities
 */
import type { DI1Response, CurveResponse, WorkflowResponse } from '@/types/api';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateDI1Response(data: any): data is DI1Response {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Resposta inválida do servidor');
  }

  if (!data.reference_date || typeof data.reference_date !== 'string') {
    throw new ValidationError('Data de referência ausente', 'reference_date');
  }

  if (!Array.isArray(data.contracts)) {
    throw new ValidationError('Lista de contratos ausente', 'contracts');
  }

  if (typeof data.count !== 'number') {
    throw new ValidationError('Contagem de contratos ausente', 'count');
  }

  // Validate each contract
  for (const contract of data.contracts) {
    if (!contract.code || typeof contract.code !== 'string') {
      throw new ValidationError('Código do contrato inválido');
    }
    if (typeof contract.rate !== 'number' || contract.rate < 0 || contract.rate > 1) {
      throw new ValidationError('Taxa do contrato inválida');
    }
  }

  return true;
}

export function validateCurveResponse(data: any): data is CurveResponse {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Resposta inválida do servidor');
  }

  if (!data.method || typeof data.method !== 'string') {
    throw new ValidationError('Método ausente', 'method');
  }

  if (!Array.isArray(data.original_points)) {
    throw new ValidationError('Pontos originais ausentes', 'original_points');
  }

  if (!Array.isArray(data.curve_points)) {
    throw new ValidationError('Pontos da curva ausentes', 'curve_points');
  }

  if (!data.metrics || typeof data.metrics !== 'object') {
    throw new ValidationError('Métricas ausentes', 'metrics');
  }

  return true;
}

export function validateWorkflowResponse(data: any): data is WorkflowResponse {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Resposta inválida do servidor');
  }

  // Check all required fields
  const requiredFields = [
    'reference_date',
    'num_contracts',
    'method',
    'original_points',
    'curve_points',
    'metrics',
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new ValidationError(`Campo obrigatório ausente: ${field}`, field);
    }
  }

  return true;
}

export function sanitizeDate(date: string): string {
  // Remove any non-numeric characters except hyphens
  return date.replace(/[^\d-]/g, '');
}

export function validateDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
}
```

### Update `mobile/services/api.ts` (ENHANCE ERROR HANDLING)
```typescript
// Add validation to API responses
async fetchDI1Data(date: string, maxBusinessDays: number = 1260): Promise<DI1Response> {
  return this.requestWithRetry(async () => {
    // Check cache first if enabled
    if (this.settings?.cacheEnabled) {
      const cached = await cacheService.get<DI1Response>(`di1_${date}`);
      if (cached) {
        console.log('[API] Using cached DI1 data');
        return cached;
      }
    }

    const response = await this.client.get<DI1Response>(API_ENDPOINTS.di1, {
      params: { date, max_business_days: maxBusinessDays },
    });

    // Validate response
    validateDI1Response(response.data);

    // Cache response if enabled
    if (this.settings?.cacheEnabled) {
      await cacheService.set(`di1_${date}`, response.data);
    }

    return response.data;
  });
}
```

### Update `mobile/app/_layout.tsx` (ADD ERROR BOUNDARY)
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkStatusBar } from '@/components/NetworkStatusBar';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <PaperProvider>
          <NetworkStatusBar />
          <Stack>
            {/* ... existing screens */}
          </Stack>
        </PaperProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
```

### `mobile/components/ErrorFallback.tsx` (NEW FILE)
```typescript
/**
 * Reusable error fallback component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { getErrorMessage, getErrorTitle } from '@/constants/errorMessages';

interface ErrorFallbackProps {
  error?: Error;
  errorCode?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  errorCode = 'UNKNOWN_ERROR',
  message,
  onRetry,
  onDismiss,
  showDetails = false,
}: ErrorFallbackProps) {
  const title = getErrorTitle(errorCode);
  const defaultMessage = getErrorMessage(errorCode);
  const displayMessage = message || error?.message || defaultMessage;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            {displayMessage}
          </Text>

          {showDetails && error && __DEV__ && (
            <View style={styles.details}>
              <Text variant="labelSmall" style={styles.detailsTitle}>
                Detalhes (desenvolvimento):
              </Text>
              <Text variant="bodySmall" style={styles.detailsText}>
                {error.stack || error.toString()}
              </Text>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          {onDismiss && (
            <Button onPress={onDismiss}>Fechar</Button>
          )}
          {onRetry && (
            <Button mode="contained" onPress={onRetry}>
              Tentar Novamente
            </Button>
          )}
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFEBEE',
  },
  title: {
    color: '#C62828',
    marginBottom: 12,
  },
  message: {
    color: '#B71C1C',
  },
  details: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
```

---

## Testing

### Manual Testing Checklist

```markdown
# Error Handling Testing Checklist

## Network Errors
- [ ] Disconnect WiFi - shows offline banner
- [ ] Reconnect - banner disappears
- [ ] Try API call while offline - shows error
- [ ] Retry after reconnecting - succeeds
- [ ] Slow connection - timeout handled

## API Errors
- [ ] Invalid date - shows validation error
- [ ] Weekend date - shows weekend error
- [ ] Future date - shows future date error
- [ ] Server error (500) - shows server error
- [ ] Server unavailable - retries then fails

## Data Validation
- [ ] Corrupted cache - handled gracefully
- [ ] Invalid API response - validated and rejected
- [ ] Missing fields - validation error shown
- [ ] Invalid values - validation error shown

## React Errors
- [ ] Component crash - error boundary catches
- [ ] Error boundary shows fallback UI
- [ ] Retry from error boundary works
- [ ] Error details shown in dev mode

## Offline Mode
- [ ] Cached data available offline
- [ ] Offline indicator shown
- [ ] Can view cached charts offline
- [ ] Cannot fetch new data offline
- [ ] Clear message when trying to fetch offline

## Recovery
- [ ] Retry button works
- [ ] Automatic retry with backoff
- [ ] Returns to normal after recovery
- [ ] No data loss on errors
- [ ] State preserved through errors

## Error Messages
- [ ] All errors have Portuguese messages
- [ ] Messages are user-friendly
- [ ] Technical details hidden from users
- [ ] Clear next steps provided
- [ ] Errors logged in dev mode

## Cache Management
- [ ] Cache enables when toggled in settings
- [ ] Cached data returned when available
- [ ] Expired cache cleaned automatically
- [ ] Clear cache works
- [ ] Cache size displayed correctly

## Edge Cases
- [ ] Multiple rapid errors handled
- [ ] Error during error handling
- [ ] Network status changes during request
- [ ] App backgrounded during request
- [ ] Low memory situation
```

---

## Acceptance Criteria

- ✅ Global error boundary catches all React errors
- ✅ Network status monitored continuously
- ✅ Offline banner shows when disconnected
- ✅ All API responses validated
- ✅ User-friendly Portuguese error messages
- ✅ Retry mechanisms with exponential backoff
- ✅ Cache service for offline support
- ✅ Error logging for debugging
- ✅ Graceful degradation when features unavailable
- ✅ Clear recovery paths for users
- ✅ No app crashes from errors
- ✅ Error details available in dev mode
- ✅ Network quality indicator
- ✅ Automatic cache cleanup

---

## Error Scenarios and Handling

| Scenario | Detection | User Feedback | Recovery |
|----------|-----------|---------------|----------|
| No internet | NetInfo | Offline banner | Auto-reconnect |
| API timeout | Axios timeout | Timeout error message | Retry button |
| Server error (5xx) | HTTP status | Server unavailable | Retry with backoff |
| Invalid data | Validation | Data error message | Return to home |
| Weekend date | Validation | Weekend error | Date picker |
| React crash | Error boundary | Fallback UI | Retry component |
| Cache error | Try/catch | Cache error message | Clear cache |
| Invalid input | Validation | Validation error | Fix input |

---

## Performance Impact

### Cache Storage
- Max 50MB for cached responses
- Auto-cleanup of expired entries
- Configurable TTL per cache entry

### Network Monitoring
- Minimal battery impact
- Event-based updates (not polling)
- Efficient state management

### Error Logging
- Max 100 error entries
- Circular buffer (oldest removed)
- Async file operations

---

## Future Enhancements

1. **Advanced Offline Mode**
   - Queue requests for when online
   - Sync queued operations
   - Conflict resolution

2. **Error Analytics**
   - Send anonymized error reports
   - Track error frequency
   - Monitor app health

3. **Smart Retry**
   - Circuit breaker pattern
   - Adaptive retry delays
   - Failure prediction

4. **User Feedback**
   - In-app bug reporting
   - Screenshot on error
   - User comments

---

## Dependencies

All dependencies already included in previous features:
- `@react-native-community/netinfo`
- `@react-native-async-storage/async-storage`
- `expo-file-system`

---

## Next Steps

After Feature 10:
- **Feature 11**: Educational content and tutorials
- **Feature 12**: Final polish and deployment preparation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 10 |