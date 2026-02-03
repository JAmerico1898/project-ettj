/**
 * API client for ETTJ backend
 * Features: retry logic, network checks, interceptors, comprehensive error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from './apiConfig';
import { handleApiError, getErrorMessage as getErrorMsg } from './apiErrors';
import { checkInternetConnection, sleep } from '../utils/network';
import { NetworkError, ApiError, isRetryableError } from '../types/errors';
import {
  DI1Response,
  DI1SummaryResponse,
  CurveRequest,
  CurveResponse,
  MethodInfo,
  HealthResponse,
  DetailedHealthResponse,
  APIInfoResponse,
  WorkflowRequest,
  WorkflowResponse,
  CompareMethodsRequest,
  CompareMethodsResponse,
} from '../types';

/**
 * Request metadata for retry logic
 */
interface RequestMeta {
  retryCount: number;
  startTime: number;
}

/**
 * Extended request config with metadata
 */
interface ExtendedRequestConfig extends InternalAxiosRequestConfig {
  meta?: RequestMeta;
}

/**
 * API Client class with retry logic and comprehensive error handling
 */
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.baseURL;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const extConfig = config as ExtendedRequestConfig;

        // Initialize retry metadata
        if (!extConfig.meta) {
          extConfig.meta = {
            retryCount: 0,
            startTime: Date.now(),
          };
        }

        // Check network connectivity before making request
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
          throw new NetworkError('Você está offline. Conecte-se à internet para continuar.');
        }

        // Log request in development
        if (API_CONFIG.enableLogging) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        if (API_CONFIG.enableLogging) {
          console.error('[API] Request error:', error);
        }
        return Promise.reject(handleApiError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (API_CONFIG.enableLogging) {
          const extConfig = response.config as ExtendedRequestConfig;
          const duration = extConfig.meta ? Date.now() - extConfig.meta.startTime : 0;
          console.log(`[API] Response ${response.status} (${duration}ms)`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as ExtendedRequestConfig | undefined;

        // Log error in development
        if (API_CONFIG.enableLogging) {
          console.error('[API] Response error:', error.message, error.response?.data);
        }

        // Convert to typed error
        const apiError = handleApiError(error);

        // Check if we should retry
        if (config && config.meta && this.shouldRetry(apiError, config.meta.retryCount)) {
          config.meta.retryCount += 1;
          const delay = this.calculateRetryDelay(config.meta.retryCount);

          if (API_CONFIG.enableLogging) {
            console.log(`[API] Retrying request (attempt ${config.meta.retryCount}/${API_CONFIG.retryAttempts}) after ${delay}ms`);
          }

          await sleep(delay);
          return this.client.request(config);
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: ApiError, currentAttempt: number): boolean {
    if (currentAttempt >= API_CONFIG.retryAttempts) {
      return false;
    }

    return isRetryableError(error);
  }

  /**
   * Calculate delay before next retry using exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, API_CONFIG.maxRetryDelay);
  }

  // ==================== Root Endpoints ====================

  /**
   * Get API information
   */
  async getInfo(): Promise<APIInfoResponse> {
    const response = await this.client.get<APIInfoResponse>(API_ENDPOINTS.ROOT);
    return response.data;
  }

  /**
   * Basic health check
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    return response.data;
  }

  /**
   * Detailed health check with system status
   */
  async healthCheckDetailed(): Promise<DetailedHealthResponse> {
    const response = await this.client.get<DetailedHealthResponse>(API_ENDPOINTS.HEALTH_DETAILED);
    return response.data;
  }

  // ==================== DI1 Data Endpoints ====================

  /**
   * Fetch DI1 futures data for a specific date
   * @param date - Optional reference date in YYYY-MM-DD format
   * @param maxBusinessDays - Optional max business days filter (default 1260 = 5 years)
   */
  async fetchDI1Data(date?: string, maxBusinessDays?: number): Promise<DI1Response> {
    const params: Record<string, string | number> = {};
    if (date) {
      params.date = date;
    }
    if (maxBusinessDays !== undefined) {
      params.max_business_days = maxBusinessDays;
    }
    const response = await this.client.get<DI1Response>(API_ENDPOINTS.DI1, { params });
    return response.data;
  }

  /**
   * Fetch DI1 summary statistics
   * @param date - Optional reference date in YYYY-MM-DD format
   */
  async fetchDI1Summary(date?: string): Promise<DI1SummaryResponse> {
    const params: Record<string, string> = {};
    if (date) {
      params.date = date;
    }
    const response = await this.client.get<DI1SummaryResponse>(API_ENDPOINTS.DI1_SUMMARY, { params });
    return response.data;
  }

  // ==================== Methods Endpoint ====================

  /**
   * Get available smoothing methods
   */
  async getAvailableMethods(): Promise<MethodInfo[]> {
    const response = await this.client.get<MethodInfo[]>(API_ENDPOINTS.METHODS);
    return response.data;
  }

  // ==================== Curve Calculation ====================

  /**
   * Calculate smoothed yield curve
   * @param request - Curve calculation request
   */
  async calculateCurve(request: CurveRequest): Promise<CurveResponse> {
    const response = await this.client.post<CurveResponse>(API_ENDPOINTS.CURVE, request);
    return response.data;
  }

  // ==================== Workflow Endpoints ====================

  /**
   * Execute complete workflow: fetch data + calculate curve
   * @param request - Workflow request parameters
   */
  async workflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await this.client.post<WorkflowResponse>(API_ENDPOINTS.WORKFLOW, request);
    return response.data;
  }

  /**
   * Compare multiple smoothing methods
   * @param request - Compare methods request
   */
  async compareMethods(request: CompareMethodsRequest): Promise<CompareMethodsResponse> {
    const response = await this.client.post<CompareMethodsResponse>(API_ENDPOINTS.COMPARE_METHODS, request);
    return response.data;
  }

  // ==================== Utility Methods ====================

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Update base URL (useful for switching between local/production)
   * @param url - New base URL
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * Update request timeout
   * @param timeout - New timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  // ==================== Backward Compatibility ====================

  /**
   * @deprecated Use fetchDI1Data instead
   */
  async getDI1Data(date?: string, maxBusinessDays?: number): Promise<DI1Response> {
    return this.fetchDI1Data(date, maxBusinessDays);
  }

  /**
   * @deprecated Use getAvailableMethods instead
   */
  async getMethods(): Promise<MethodInfo[]> {
    return this.getAvailableMethods();
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export alias for backward compatibility
export const api = apiClient;

// Export class for testing and custom instances
export { ApiClient };

// Re-export error handling utilities
export { getErrorMsg as getErrorMessage };
