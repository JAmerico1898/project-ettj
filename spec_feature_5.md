# Feature 5: Mobile API Client - Complete Integration

## Overview
Implement a comprehensive TypeScript API client for the mobile application that integrates with all backend endpoints. This feature provides a robust, type-safe interface between the mobile app and the backend API, with proper error handling, retry logic, and offline support.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 4** completed (complete backend API)
- Mobile app running with Expo
- Backend server accessible from mobile device

---

## Objectives
- Create type-safe API client using TypeScript
- Implement all API endpoint methods
- Add comprehensive error handling
- Implement retry logic for network failures
- Add request/response interceptors
- Support offline detection
- Implement request caching (optional)
- Add request timeout handling
- Create mock data for testing
- Add loading state management
- Implement proper TypeScript interfaces for all API responses

---

## Implementation

### File Structure
```
mobile/
├── services/
│   ├── api.ts                 # Main API client (UPDATE)
│   ├── apiConfig.ts           # Configuration (NEW)
│   ├── apiErrors.ts           # Error handling (NEW)
│   └── apiMocks.ts            # Mock data for testing (NEW)
├── types/
│   ├── index.ts               # Main types (UPDATE)
│   ├── api.ts                 # API-specific types (NEW)
│   └── errors.ts              # Error types (NEW)
├── hooks/
│   ├── useApi.ts              # Generic API hook (NEW)
│   ├── useDI1Data.ts          # DI1 data hook (NEW)
│   ├── useCurve.ts            # Curve calculation hook (NEW)
│   └── useWorkflow.ts         # Workflow hook (NEW)
├── utils/
│   ├── network.ts             # Network utilities (NEW)
│   └── storage.ts             # Local storage (NEW)
└── constants/
    └── config.ts              # Update with API config
```

---

## Code Implementation

### `mobile/types/api.ts` (NEW FILE)
```typescript
/**
 * API-specific TypeScript interfaces
 */

// DI1 Endpoints
export interface DI1Contract {
  code: string;
  expiry_date: string;
  business_days: number;
  years: number;
  rate: number;
  rate_percent: number;
}

export interface DI1Response {
  reference_date: string;
  contracts: DI1Contract[];
  count: number;
}

export interface DI1Summary {
  reference_date: string;
  count: number;
  min_rate_percent: number;
  max_rate_percent: number;
  avg_rate_percent: number;
  min_maturity_days: number;
  max_maturity_days: number;
  min_maturity_years: number;
  max_maturity_years: number;
}

// Curve Endpoints
export interface CurvePoint {
  business_days: number;
  years: number;
  rate: number;
  rate_percent: number;
}

export interface CurveMetrics {
  mae: number;
  rmse: number;
  r_squared: number;
  max_error: number;
  mean_error: number;
  mae_percent: number;
  rmse_percent: number;
  max_error_percent: number;
}

export interface CurveRequest {
  method: string;
  data: Array<{
    years: number;
    rate: number;
    business_days: number;
  }>;
  parameters?: Record<string, any>;
  num_points?: number;
}

export interface CurveResponse {
  method: string;
  method_name: string;
  method_type: 'simple' | 'spline' | 'parametric';
  original_points: CurvePoint[];
  curve_points: CurvePoint[];
  parameters_used: Record<string, any>;
  metrics: CurveMetrics;
  num_original_points: number;
  num_curve_points: number;
}

// Methods Endpoint
export interface MethodParameter {
  type: string;
  default?: any;
  description: string;
}

export interface MethodInfo {
  id: string;
  name: string;
  type: 'simple' | 'spline' | 'parametric';
  description: string;
  min_points: number;
  parameters: Record<string, MethodParameter>;
}

// Workflow Endpoint
export interface WorkflowRequest {
  date: string;
  method: string;
  max_business_days?: number;
  parameters?: Record<string, any>;
  num_points?: number;
}

export interface WorkflowResponse {
  reference_date: string;
  num_contracts: number;
  method: string;
  method_name: string;
  method_type: 'simple' | 'spline' | 'parametric';
  original_points: CurvePoint[];
  curve_points: CurvePoint[];
  parameters_used: Record<string, any>;
  metrics: CurveMetrics;
}

// Compare Methods
export interface CompareMethodsRequest {
  date: string;
  methods: string[];
  max_business_days?: number;
  num_points?: number;
}

export interface CompareMethodsResponse {
  reference_date: string;
  num_contracts: number;
  results: CurveResponse[];
  num_methods: number;
}

// Health Check
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  dependencies?: Record<string, {
    status: string;
    version?: string;
    error?: string;
  }>;
}
```

### `mobile/types/errors.ts` (NEW FILE)
```typescript
/**
 * Error types and classes
 */

export interface ApiErrorResponse {
  error_code: string;
  message: string;
  timestamp: string;
  details?: any;
}

export class ApiError extends Error {
  public errorCode: string;
  public timestamp: string;
  public details?: any;
  public statusCode?: number;

  constructor(
    message: string,
    errorCode: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 'SERVER_ERROR', 500, details);
    this.name = 'ServerError';
  }
}
```

### `mobile/services/apiConfig.ts` (NEW FILE)
```typescript
/**
 * API configuration
 */
import Constants from 'expo-constants';

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableMocks: boolean;
}

const getBaseURL = (): string => {
  // Priority: Environment variable > Expo config > Default
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // For development, use local IP
  // Replace with your computer's IP address
  const DEV_API_URL = 'http://192.168.1.100:8000';
  
  // For production, use deployed backend
  const PROD_API_URL = 'https://api.yourdomain.com';
  
  return __DEV__ ? DEV_API_URL : PROD_API_URL;
};

export const apiConfig: ApiConfig = {
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableMocks: false, // Set to true for testing without backend
};

export const API_ENDPOINTS = {
  // Health
  health: '/health',
  healthDetailed: '/health/detailed',
  
  // DI1
  di1: '/api/v1/di1',
  di1Summary: '/api/v1/di1/summary',
  
  // Methods
  methods: '/api/v1/methods',
  
  // Curve
  curve: '/api/v1/curve',
  workflow: '/api/v1/workflow',
  compareMethod: '/api/v1/curve/compare',
} as const;
```

### `mobile/services/apiErrors.ts` (NEW FILE)
```typescript
/**
 * API error handling utilities
 */
import axios, { AxiosError } from 'axios';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ServerError,
  ApiErrorResponse,
} from '@/types/errors';

export function handleApiError(error: unknown): ApiError {
  // Network error (no response)
  if (axios.isAxiosError(error) && !error.response) {
    if (error.code === 'ECONNABORTED') {
      return new TimeoutError();
    }
    return new NetworkError(error.message);
  }

  // Axios error with response
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as ApiErrorResponse;

    // Use backend error response if available
    if (data && data.error_code && data.message) {
      return new ApiError(
        data.message,
        data.error_code,
        status,
        data.details
      );
    }

    // Fallback error messages
    switch (status) {
      case 400:
        return new ApiError(
          'Invalid request',
          'BAD_REQUEST',
          400
        );
      case 404:
        return new ApiError(
          'Resource not found',
          'NOT_FOUND',
          404
        );
      case 422:
        return new ValidationError(
          'Validation failed',
          data
        );
      case 500:
        return new ServerError(
          'Server error occurred',
          data
        );
      default:
        return new ApiError(
          `HTTP error ${status}`,
          `HTTP_${status}`,
          status
        );
    }
  }

  // Unknown error
  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unknown error occurred');
}

export function getErrorMessage(error: ApiError): string {
  // User-friendly error messages
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    TIMEOUT_ERROR: 'A requisição demorou muito tempo. Tente novamente.',
    VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
    SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
    INVALID_INPUT: 'Dados inválidos fornecidos.',
    DATA_UNAVAILABLE: 'Dados não disponíveis para esta data.',
  };

  return errorMessages[error.errorCode] || error.message;
}
```

### `mobile/utils/network.ts` (NEW FILE)
```typescript
/**
 * Network utilities
 */
import NetInfo from '@react-native-community/netinfo';

export async function checkInternetConnection(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

export async function waitForConnection(
  timeout: number = 5000
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### `mobile/services/api.ts` (COMPLETE REWRITE)
```typescript
/**
 * Main API client for ETTJ DI1 application
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { apiConfig, API_ENDPOINTS } from './apiConfig';
import { handleApiError } from './apiErrors';
import { checkInternetConnection, sleep } from '@/utils/network';
import type {
  DI1Response,
  DI1Summary,
  CurveRequest,
  CurveResponse,
  MethodInfo,
  WorkflowRequest,
  WorkflowResponse,
  CompareMethodsRequest,
  CompareMethodsResponse,
  HealthResponse,
} from '@/types/api';

class ApiClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.retryAttempts = apiConfig.retryAttempts;
    this.retryDelay = apiConfig.retryDelay;

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Log requests in development
        if (__DEV__) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (__DEV__) {
          console.log(
            `[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`
          );
        }
        return response;
      },
      (error) => {
        // Log errors in development
        if (__DEV__) {
          console.error(
            `[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            error.response?.status || 'Network Error'
          );
        }
        return Promise.reject(error);
      }
    );
  }

  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      // Check internet connection before request
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        throw new Error('No internet connection');
      }

      return await requestFn();
    } catch (error) {
      // Don't retry validation errors or client errors
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw handleApiError(error);
      }

      // Retry on network errors or server errors
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`[API] Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.retryAttempts})`);
        await sleep(delay);
        return this.requestWithRetry(requestFn, attempt + 1);
      }

      throw handleApiError(error);
    }
  }

  // ============================================================================
  // Health Endpoints
  // ============================================================================

  async healthCheck(): Promise<HealthResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<HealthResponse>(API_ENDPOINTS.health);
      return response.data;
    });
  }

  async healthCheckDetailed(): Promise<HealthResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<HealthResponse>(API_ENDPOINTS.healthDetailed);
      return response.data;
    });
  }

  // ============================================================================
  // DI1 Data Endpoints
  // ============================================================================

  async fetchDI1Data(
    date: string,
    maxBusinessDays: number = 1260
  ): Promise<DI1Response> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<DI1Response>(API_ENDPOINTS.di1, {
        params: { date, max_business_days: maxBusinessDays },
      });
      return response.data;
    });
  }

  async fetchDI1Summary(date: string): Promise<DI1Summary> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<DI1Summary>(API_ENDPOINTS.di1Summary, {
        params: { date },
      });
      return response.data;
    });
  }

  // ============================================================================
  // Methods Endpoint
  // ============================================================================

  async getAvailableMethods(): Promise<MethodInfo[]> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<MethodInfo[]>(API_ENDPOINTS.methods);
      return response.data;
    });
  }

  // ============================================================================
  // Curve Calculation Endpoints
  // ============================================================================

  async calculateCurve(request: CurveRequest): Promise<CurveResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.client.post<CurveResponse>(
        API_ENDPOINTS.curve,
        request
      );
      return response.data;
    });
  }

  async workflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.client.post<WorkflowResponse>(
        API_ENDPOINTS.workflow,
        request
      );
      return response.data;
    });
  }

  async compareMethods(request: CompareMethodsRequest): Promise<CompareMethodsResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.client.post<CompareMethodsResponse>(
        API_ENDPOINTS.compareMethod,
        request
      );
      return response.data;
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getBaseURL(): string {
    return apiConfig.baseURL;
  }

  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
```

### `mobile/hooks/useApi.ts` (NEW FILE)
```typescript
/**
 * Generic API hook for managing API calls
 */
import { useState, useCallback } from 'react';
import { ApiError } from '@/types/errors';
import { getErrorMessage } from '@/services/apiErrors';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  errorMessage: string | null;
}

export interface UseApiActions<T, P extends any[]> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
}

export type UseApiResult<T, P extends any[]> = UseApiState<T> & UseApiActions<T, P>;

export function useApi<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<T>
): UseApiResult<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        setErrorMessage(null);

        const result = await apiFunction(...params);
        setData(result);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        setErrorMessage(getErrorMessage(apiError));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setErrorMessage(null);
  }, []);

  return {
    data,
    loading,
    error,
    errorMessage,
    execute,
    reset,
  };
}
```

### `mobile/hooks/useDI1Data.ts` (NEW FILE)
```typescript
/**
 * Hook for fetching DI1 data
 */
import { apiClient } from '@/services/api';
import { useApi } from './useApi';
import type { DI1Response } from '@/types/api';

export function useDI1Data() {
  return useApi<DI1Response, [string, number?]>(
    (date: string, maxBusinessDays?: number) =>
      apiClient.fetchDI1Data(date, maxBusinessDays)
  );
}

export function useDI1Summary() {
  return useApi((date: string) => apiClient.fetchDI1Summary(date));
}
```

### `mobile/hooks/useCurve.ts` (NEW FILE)
```typescript
/**
 * Hook for curve calculations
 */
import { apiClient } from '@/services/api';
import { useApi } from './useApi';
import type { CurveRequest, CurveResponse } from '@/types/api';

export function useCurve() {
  return useApi<CurveResponse, [CurveRequest]>(
    (request: CurveRequest) => apiClient.calculateCurve(request)
  );
}
```

### `mobile/hooks/useWorkflow.ts` (NEW FILE)
```typescript
/**
 * Hook for end-to-end workflow
 */
import { apiClient } from '@/services/api';
import { useApi } from './useApi';
import type { WorkflowRequest, WorkflowResponse } from '@/types/api';

export function useWorkflow() {
  return useApi<WorkflowResponse, [WorkflowRequest]>(
    (request: WorkflowRequest) => apiClient.workflow(request)
  );
}

export function useCompareMethods() {
  return useApi((request) => apiClient.compareMethods(request));
}
```

### `mobile/services/apiMocks.ts` (NEW FILE)
```typescript
/**
 * Mock data for testing without backend
 */
import type {
  DI1Response,
  MethodInfo,
  WorkflowResponse,
} from '@/types/api';

export const mockDI1Data: DI1Response = {
  reference_date: '2025-01-31',
  count: 6,
  contracts: [
    {
      code: 'DI1F25',
      expiry_date: '2025-03-03',
      business_days: 21,
      years: 0.0833,
      rate: 0.1025,
      rate_percent: 10.25,
    },
    {
      code: 'DI1G25',
      expiry_date: '2025-04-01',
      business_days: 42,
      years: 0.1667,
      rate: 0.1050,
      rate_percent: 10.50,
    },
    {
      code: 'DI1H25',
      expiry_date: '2025-05-02',
      business_days: 63,
      years: 0.25,
      rate: 0.1065,
      rate_percent: 10.65,
    },
    {
      code: 'DI1J25',
      expiry_date: '2025-07-01',
      business_days: 105,
      years: 0.4167,
      rate: 0.1085,
      rate_percent: 10.85,
    },
    {
      code: 'DI1F26',
      expiry_date: '2026-01-02',
      business_days: 231,
      years: 0.9167,
      rate: 0.1110,
      rate_percent: 11.10,
    },
    {
      code: 'DI1F27',
      expiry_date: '2027-01-04',
      business_days: 483,
      years: 1.9167,
      rate: 0.1135,
      rate_percent: 11.35,
    },
  ],
};

export const mockMethods: MethodInfo[] = [
  {
    id: 'linear',
    name: 'Linear Interpolation',
    type: 'simple',
    description: 'Simple linear interpolation',
    min_points: 2,
    parameters: {},
  },
  {
    id: 'cubic',
    name: 'Cubic Spline',
    type: 'spline',
    description: 'Smooth cubic spline',
    min_points: 3,
    parameters: {},
  },
  {
    id: 'nelson_siegel',
    name: 'Nelson-Siegel',
    type: 'parametric',
    description: '4-parameter model',
    min_points: 4,
    parameters: {},
  },
];

// Add more mocks as needed...
```

### Update `mobile/package.json` (ADD DEPENDENCY)
```json
{
  "dependencies": {
    "@react-native-community/netinfo": "^11.3.1",
    // ... existing dependencies
  }
}
```

---

## Testing

### `mobile/__tests__/api.test.ts` (NEW FILE)
```typescript
/**
 * API client tests
 */
import { ApiClient } from '@/services/api';
import { apiConfig } from '@/services/apiConfig';

// Mock axios
jest.mock('axios');

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
  });

  describe('Configuration', () => {
    it('should initialize with correct base URL', () => {
      expect(client.getBaseURL()).toBe(apiConfig.baseURL);
    });

    it('should allow changing base URL', () => {
      const newURL = 'http://test.com';
      client.setBaseURL(newURL);
      expect(client.getBaseURL()).toBe(newURL);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Test network error handling
      // Implementation depends on your testing setup
    });

    it('should retry failed requests', async () => {
      // Test retry logic
    });
  });
});
```

### Manual Testing Checklist

Create `mobile/TESTING.md`:

```markdown
# API Client Testing Checklist

## Prerequisites
- [ ] Backend server running at configured URL
- [ ] Mobile device on same network as backend
- [ ] Correct IP address in .env file

## Connection Tests
- [ ] Health check succeeds
- [ ] Can fetch DI1 data for valid date
- [ ] Error message shown for invalid date
- [ ] Error message shown when backend is down

## DI1 Data Tests
- [ ] Fetch DI1 data for today (or recent business day)
- [ ] Fetch with custom max_business_days
- [ ] Fetch summary statistics
- [ ] Handle weekend date error
- [ ] Handle future date error

## Methods Tests
- [ ] Fetch available methods
- [ ] Verify all 7 methods returned
- [ ] Verify method metadata correct

## Curve Tests
- [ ] Calculate curve with linear method
- [ ] Calculate curve with Nelson-Siegel
- [ ] Handle insufficient data error
- [ ] Handle invalid method error

## Workflow Tests
- [ ] Run complete workflow (fetch + calculate)
- [ ] Verify data and curve returned
- [ ] Test with different methods
- [ ] Test with different dates

## Error Handling Tests
- [ ] Network disconnection shows proper message
- [ ] Timeout shows proper message
- [ ] Validation errors show details
- [ ] Server errors handled gracefully

## Performance Tests
- [ ] DI1 fetch completes in < 5 seconds
- [ ] Curve calculation completes in < 2 seconds
- [ ] Workflow completes in < 7 seconds
- [ ] Retry logic works (disconnect during request)

## Offline Tests
- [ ] Detect when offline
- [ ] Show appropriate message
- [ ] Retry when connection restored
```

---

## Usage Examples

### Example 1: Fetch DI1 Data in Component
```typescript
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDI1Data } from '@/hooks/useDI1Data';

export function DI1DataExample() {
  const { data, loading, errorMessage, execute } = useDI1Data();

  useEffect(() => {
    execute('2025-01-31');
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (errorMessage) {
    return <Text style={{ color: 'red' }}>{errorMessage}</Text>;
  }

  if (!data) {
    return <Text>No data</Text>;
  }

  return (
    <View>
      <Text>Date: {data.reference_date}</Text>
      <Text>Contracts: {data.count}</Text>
    </View>
  );
}
```

### Example 2: Workflow with User Input
```typescript
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { useWorkflow } from '@/hooks/useWorkflow';

export function WorkflowExample() {
  const [date, setDate] = useState('2025-01-31');
  const [method, setMethod] = useState('nelson_siegel');
  const { data, loading, execute } = useWorkflow();

  const handleCalculate = async () => {
    await execute({
      date,
      method,
      max_business_days: 1260,
      num_points: 1260,
    });
  };

  return (
    <View>
      {/* Date and method pickers */}
      <Button
        title="Calculate"
        onPress={handleCalculate}
        disabled={loading}
      />
      {/* Display results */}
    </View>
  );
}
```

### Example 3: Compare Methods
```typescript
import React from 'react';
import { useCompareMethods } from '@/hooks/useWorkflow';

export function ComparisonExample() {
  const { data, loading, execute } = useCompareMethods();

  const handleCompare = async () => {
    await execute({
      date: '2025-01-31',
      methods: ['linear', 'cubic', 'nelson_siegel'],
      max_business_days: 1260,
      num_points: 100,
    });
  };

  // Render comparison results
}
```

---

## Error Handling Patterns

### Pattern 1: Display Error to User
```typescript
function MyComponent() {
  const { data, errorMessage, execute } = useDI1Data();

  if (errorMessage) {
    return (
      <View>
        <Text style={styles.error}>{errorMessage}</Text>
        <Button title="Retry" onPress={() => execute(date)} />
      </View>
    );
  }
  
  // ... rest of component
}
```

### Pattern 2: Silent Error Recovery
```typescript
async function fetchWithFallback() {
  const { execute } = useDI1Data();
  
  const result = await execute(primaryDate);
  
  if (!result) {
    // Try fallback date
    return await execute(fallbackDate);
  }
  
  return result;
}
```

### Pattern 3: Error Logging
```typescript
import * as Sentry from 'sentry-expo';

function handleError(error: ApiError) {
  // Log to console in dev
  if (__DEV__) {
    console.error('API Error:', error);
  }
  
  // Log to Sentry in production
  if (!__DEV__) {
    Sentry.captureException(error);
  }
}
```

---

## Performance Optimization

### Caching Strategy (Future Enhancement)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class CachedApiClient extends ApiClient {
  async fetchDI1DataCached(date: string) {
    const cacheKey = `di1_${date}`;
    
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from API
    const data = await this.fetchDI1Data(date);
    
    // Store in cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    
    return data;
  }
}
```

---

## Acceptance Criteria

### API Client
- ✅ All backend endpoints accessible
- ✅ Type-safe TypeScript interfaces
- ✅ Retry logic with exponential backoff
- ✅ Network error detection
- ✅ Timeout handling
- ✅ Request/response logging in dev mode
- ✅ Singleton pattern for global access

### React Hooks
- ✅ Generic useApi hook works
- ✅ Specialized hooks for each endpoint
- ✅ Loading states managed correctly
- ✅ Error states with user-friendly messages
- ✅ Reset functionality works

### Error Handling
- ✅ Network errors caught and displayed
- ✅ Validation errors show details
- ✅ Server errors handled gracefully
- ✅ Timeout errors detected
- ✅ Portuguese error messages

### Testing
- ✅ Unit tests for error handling
- ✅ Manual testing checklist completed
- ✅ All endpoints tested with real backend
- ✅ Offline behavior tested

---

## Troubleshooting

### Issue: "Network request failed"
**Causes:**
- Backend not running
- Wrong IP address in config
- Firewall blocking connection
- Devices on different networks

**Solutions:**
1. Verify backend is running: `curl http://YOUR_IP:8000/health`
2. Check IP address in `.env` matches computer's IP
3. Ensure devices on same WiFi network
4. Check firewall settings

### Issue: "Request timeout"
**Solutions:**
- Increase timeout in apiConfig.ts
- Check backend performance
- Verify network speed

### Issue: TypeScript errors
**Solutions:**
- Run `npm install` to ensure all types installed
- Restart TypeScript server
- Check all imports are correct

---

## Next Steps

After Feature 5:
- **Feature 6**: Build Home screen UI using these hooks
- **Feature 7**: Create Chart screen with data visualization
- **Feature 8**: Implement Data table using fetched data

---

## Dependencies

```json
{
  "axios": "^1.6.5",
  "@react-native-community/netinfo": "^11.3.1",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 5 |