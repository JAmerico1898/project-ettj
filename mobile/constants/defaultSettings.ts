/**
 * Default settings and types for app configuration
 */

import { API_BASE_URL, API_TIMEOUT } from './config';
import { SmoothingMethod } from '../types';

/**
 * Theme options for the app
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Application settings interface
 */
export interface AppSettings {
  // Theme settings
  theme: ThemeMode;

  // API configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Calculation defaults
  defaultMethod: SmoothingMethod;
  defaultSmoothingParameter: number;
  defaultMaxBusinessDays: number | null;

  // Data preferences
  autoLoadData: boolean;
  cacheEnabled: boolean;

  // Display preferences
  showRawData: boolean;
  chartAnimationsEnabled: boolean;
  decimalPlaces: number;

  // Tutorial state
  tutorialCompleted: boolean;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: AppSettings = {
  // Theme
  theme: 'light',

  // API
  apiBaseUrl: API_BASE_URL,
  apiTimeout: API_TIMEOUT,

  // Calculation defaults
  defaultMethod: 'nelson_siegel_svensson',
  defaultSmoothingParameter: 0.5,
  defaultMaxBusinessDays: null, // null = no limit (use all data)

  // Data preferences
  autoLoadData: true,
  cacheEnabled: true,

  // Display preferences
  showRawData: false,
  chartAnimationsEnabled: true,
  decimalPlaces: 4,

  // Tutorial state
  tutorialCompleted: false,
};

/**
 * Settings storage key
 */
export const SETTINGS_STORAGE_KEY = '@ettj_settings';

/**
 * Validation constraints for settings
 */
export const SETTINGS_CONSTRAINTS = {
  apiTimeout: {
    min: 5000,
    max: 120000,
  },
  smoothingParameter: {
    min: 0,
    max: 1,
  },
  maxBusinessDays: {
    min: 21,
    max: 2520, // 10 years
  },
  decimalPlaces: {
    min: 0,
    max: 8,
  },
};

/**
 * Theme display names
 */
export const THEME_DISPLAY_NAMES: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  auto: 'Automático',
};
