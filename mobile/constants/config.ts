/**
 * Application configuration constants
 */

// API Configuration
// When testing on physical device, replace with your computer's local IP
// e.g., http://192.168.1.100:8000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// API timeout in milliseconds
export const API_TIMEOUT = 30000;

// Brazilian market constants
export const BUSINESS_DAYS_PER_YEAR = 252;
export const MAX_TERM_YEARS = 5;
export const MAX_TERM_DAYS = 1260; // 5 years * 252 days

// Chart configuration
export const CHART_CONFIG = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#1976D2',
  },
};

// App theme colors
export const COLORS = {
  primary: '#1976D2',
  secondary: '#424242',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#B00020',
  text: '#000000',
  textSecondary: '#757575',
};
