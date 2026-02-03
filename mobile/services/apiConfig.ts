/**
 * API Configuration
 * Centralized configuration for the API client
 */

import { API_BASE_URL, API_TIMEOUT } from '../constants/config';

/**
 * API client configuration
 */
export const API_CONFIG = {
  /** Base URL for API requests */
  baseURL: API_BASE_URL,

  /** Request timeout in milliseconds */
  timeout: API_TIMEOUT,

  /** Number of retry attempts for failed requests */
  retryAttempts: 3,

  /** Base delay between retries in milliseconds (will be multiplied by attempt number) */
  retryDelay: 1000,

  /** Maximum retry delay in milliseconds */
  maxRetryDelay: 10000,

  /** HTTP status codes that should trigger a retry */
  retryStatusCodes: [408, 429, 500, 502, 503, 504],

  /** Whether to enable request/response logging in development */
  enableLogging: __DEV__,
} as const;

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Root endpoints
  ROOT: '/',
  HEALTH: '/health',
  HEALTH_DETAILED: '/health/detailed',

  // API v1 endpoints
  DI1: '/api/di1',
  DI1_SUMMARY: '/api/di1/summary',
  METHODS: '/api/methods',
  CURVE: '/api/curve',
  WORKFLOW: '/api/workflow',
  COMPARE_METHODS: '/api/compare',
} as const;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

/**
 * Content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;

/**
 * Type for endpoint keys
 */
export type ApiEndpoint = keyof typeof API_ENDPOINTS;

/**
 * Get full URL for an endpoint
 */
export function getEndpointUrl(endpoint: ApiEndpoint, baseUrl?: string): string {
  const base = baseUrl || API_CONFIG.baseURL;
  return `${base}${API_ENDPOINTS[endpoint]}`;
}
