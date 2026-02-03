/**
 * API type definitions for the ETTJ mobile app
 */

// Smoothing method identifiers
export type SmoothingMethod =
  | 'linear'
  | 'cubic_spline'
  | 'akima'
  | 'pchip'
  | 'smoothing_spline'
  | 'nelson_siegel'
  | 'nelson_siegel_svensson';

// DI1 futures contract
export interface DI1Contract {
  ticker: string;
  maturity_date: string; // ISO date string
  business_days: number;
  rate: number; // Decimal (e.g., 0.1234)
  rate_percent: number; // Percentage (e.g., 12.34)
}

// Response from /api/di1 endpoint
export interface DI1Response {
  reference_date: string; // Originally requested date
  actual_date: string; // Date data was actually retrieved for
  contracts: DI1Contract[];
  count: number;
}

// Summary statistics for DI1 data
export interface DI1SummaryResponse {
  reference_date: string;
  actual_date: string;
  count: number;
  min_rate_percent: number;
  max_rate_percent: number;
  avg_rate_percent: number;
  min_business_days: number;
  max_business_days: number;
  first_maturity: string;
  last_maturity: string;
}

// Single point on the yield curve
export interface CurvePoint {
  business_days: number;
  rate: number;
  rate_percent: number;
}

// Request body for /api/curve endpoint
export interface CurveRequest {
  reference_date: string;
  method: SmoothingMethod;
  contracts: DI1Contract[];
  smoothing_parameter?: number;
}

// Response from /api/curve endpoint
export interface CurveResponse {
  reference_date: string;
  method: SmoothingMethod;
  points: CurvePoint[];
  parameters?: Record<string, number>;
}

// Curve calculation metrics
export interface CurveMetrics {
  method: SmoothingMethod;
  rmse?: number; // Root mean squared error
  mae?: number; // Mean absolute error
  max_error?: number;
  r_squared?: number;
  computation_time_ms?: number;
}

// Method information
export interface MethodInfo {
  id: SmoothingMethod;
  name: string;
  description: string;
  category: string;
  has_parameters: boolean;
}

// API health check response
export interface HealthResponse {
  status: string;
}

// Detailed health check response
export interface DetailedHealthResponse {
  status: string;
  version: string;
  timestamp: string;
  database_status?: string;
  cache_status?: string;
  uptime_seconds?: number;
  checks?: Record<string, boolean>;
}

// API info response
export interface APIInfoResponse {
  name: string;
  version: string;
  description: string;
}

// Error response from API
export interface ErrorResponse {
  detail: string;
  error_code?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Workflow request - fetch data and calculate curve in one call
export interface WorkflowRequest {
  date?: string; // Optional, defaults to last business day
  method: SmoothingMethod;
  smoothing_parameter?: number;
  max_business_days?: number;
}

// Workflow response - combined DI1 data and curve
export interface WorkflowResponse {
  di1: DI1Response;
  curve: CurveResponse;
  metrics?: CurveMetrics;
}

// Compare methods request
export interface CompareMethodsRequest {
  date?: string;
  methods: SmoothingMethod[];
  smoothing_parameter?: number;
  max_business_days?: number;
}

// Single method comparison result
export interface MethodComparisonResult {
  method: SmoothingMethod;
  curve: CurveResponse;
  metrics?: CurveMetrics;
  error?: string;
}

// Compare methods response
export interface CompareMethodsResponse {
  di1: DI1Response;
  results: MethodComparisonResult[];
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

// Pagination params (for future use)
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Paginated response (for future use)
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
