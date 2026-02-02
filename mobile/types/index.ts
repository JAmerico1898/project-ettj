/**
 * TypeScript type definitions for the ETTJ mobile app
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

// API info response
export interface APIInfoResponse {
  name: string;
  version: string;
  description: string;
}

// App state types
export interface AppState {
  selectedDate: Date;
  selectedMethod: SmoothingMethod;
  contracts: DI1Contract[];
  curvePoints: CurvePoint[];
  isLoading: boolean;
  error: string | null;
}

// Chart data format for react-native-chart-kit
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}
