/**
 * Theme definitions for light and dark modes
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from './config';

/**
 * Light theme - based on existing COLORS
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: COLORS.text,
    onSurface: COLORS.text,
    onError: '#ffffff',
    outline: '#79747E',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: COLORS.textSecondary,
  },
  dark: false,
};

/**
 * Dark theme colors
 */
const darkColors = {
  primary: '#90CAF9', // Lighter blue for dark mode
  secondary: '#BDBDBD',
  background: '#121212',
  surface: '#1E1E1E',
  error: '#CF6679',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
};

/**
 * Dark theme
 */
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    error: darkColors.error,
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    onError: '#000000',
    outline: '#938F99',
    surfaceVariant: '#2D2D2D',
    onSurfaceVariant: darkColors.textSecondary,
  },
  dark: true,
};

/**
 * Get theme colors based on current theme
 */
export function getThemeColors(isDark: boolean) {
  if (isDark) {
    return {
      ...darkColors,
      card: darkColors.surface,
      border: '#333333',
      notification: darkColors.primary,
    };
  }
  return {
    ...COLORS,
    card: COLORS.surface,
    border: '#E0E0E0',
    notification: COLORS.primary,
  };
}
