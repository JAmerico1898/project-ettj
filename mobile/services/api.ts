/**
 * API client for ETTJ backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import {
  DI1Response,
  CurveRequest,
  CurveResponse,
  MethodInfo,
  HealthResponse,
  APIInfoResponse,
} from '../types';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get API information
   */
  async getInfo(): Promise<APIInfoResponse> {
    const response = await this.client.get<APIInfoResponse>('/');
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  /**
   * Get available smoothing methods
   */
  async getMethods(): Promise<MethodInfo[]> {
    const response = await this.client.get<MethodInfo[]>('/api/methods');
    return response.data;
  }

  /**
   * Fetch DI1 futures data for a specific date
   * @param date - Optional reference date in YYYY-MM-DD format. If not provided, returns last business day.
   * @param maxBusinessDays - Optional max business days filter (default 1260 = 5 years)
   */
  async getDI1Data(date?: string, maxBusinessDays?: number): Promise<DI1Response> {
    const params: Record<string, string | number> = {};
    if (date) {
      params.date = date;
    }
    if (maxBusinessDays !== undefined) {
      params.max_business_days = maxBusinessDays;
    }
    const response = await this.client.get<DI1Response>('/api/di1', { params });
    return response.data;
  }

  /**
   * Calculate smoothed yield curve
   * @param request - Curve calculation request
   */
  async calculateCurve(request: CurveRequest): Promise<CurveResponse> {
    const response = await this.client.post<CurveResponse>('/api/curve', request);
    return response.data;
  }

  /**
   * Update base URL (useful for switching between local/production)
   * @param url - New base URL
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }
}

// Export singleton instance
export const api = new APIClient();

// Export class for testing
export { APIClient };

// Error handling helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
