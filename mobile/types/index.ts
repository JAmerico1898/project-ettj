/**
 * TypeScript type definitions for the ETTJ mobile app
 * Re-exports all types from api.ts and errors.ts
 */

// Re-export all API types
export * from './api';

// Re-export all error types
export * from './errors';

// UI-specific types (not related to API)

// App state types
export interface AppState {
  selectedDate: Date;
  selectedMethod: import('./api').SmoothingMethod;
  contracts: import('./api').DI1Contract[];
  curvePoints: import('./api').CurvePoint[];
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

// Date range for historical analysis
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Theme configuration
export interface ThemeConfig {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  text: string;
  textSecondary: string;
}
