/**
 * Settings context for managing app configuration
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  ThemeMode,
} from '../constants/defaultSettings';
import {
  loadSettings,
  saveSettings,
  resetSettings as resetStoredSettings,
  exportSettings as exportStoredSettings,
  importSettings as importStoredSettings,
  clearCache as clearStoredCache,
  getCacheSize,
} from '../utils/settingsStorage';
import { api } from '../services/api';

interface SettingsContextValue {
  // Settings state
  settings: AppSettings;
  isLoading: boolean;

  // Computed values
  isDarkMode: boolean;
  effectiveTheme: 'light' | 'dark';

  // Settings update methods
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Actions
  resetToDefaults: () => Promise<void>;
  exportSettings: () => Promise<void>;
  importSettings: (jsonString: string) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<string>;

  // Apply settings to API client
  applyApiSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate effective theme based on settings and system preference
  const effectiveTheme: 'light' | 'dark' =
    settings.theme === 'auto'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings.theme;

  const isDarkMode = effectiveTheme === 'dark';

  // Load settings on mount
  useEffect(() => {
    loadInitialSettings();
  }, []);

  // Apply API settings when they change
  useEffect(() => {
    applyApiSettings();
  }, [settings.apiBaseUrl, settings.apiTimeout]);

  const loadInitialSettings = async () => {
    try {
      setIsLoading(true);
      const loaded = await loadSettings();
      setSettings(loaded);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load settings:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyApiSettings = useCallback(() => {
    api.setBaseURL(settings.apiBaseUrl);
    api.setTimeout(settings.apiTimeout);
  }, [settings.apiBaseUrl, settings.apiTimeout]);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings]
  );

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings]
  );

  const resetToDefaults = useCallback(async () => {
    const defaults = await resetStoredSettings();
    setSettings(defaults);
  }, []);

  const handleExportSettings = useCallback(async () => {
    await exportStoredSettings(settings);
  }, [settings]);

  const handleImportSettings = useCallback(async (jsonString: string) => {
    const imported = await importStoredSettings(jsonString);
    setSettings(imported);
  }, []);

  const handleClearCache = useCallback(async () => {
    await clearStoredCache();
  }, []);

  const handleGetCacheSize = useCallback(async () => {
    return await getCacheSize();
  }, []);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    isDarkMode,
    effectiveTheme,
    updateSetting,
    updateSettings,
    resetToDefaults,
    exportSettings: handleExportSettings,
    importSettings: handleImportSettings,
    clearCache: handleClearCache,
    getCacheSize: handleGetCacheSize,
    applyApiSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
