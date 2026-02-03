/**
 * Settings persistence utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../constants/defaultSettings';

/**
 * Load settings from AsyncStorage
 * Returns merged settings with defaults for any missing values
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      // Merge with defaults to handle new settings added in updates
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to AsyncStorage
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Nao foi possivel salvar as configuracoes');
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<AppSettings> {
  try {
    await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw new Error('Nao foi possivel redefinir as configuracoes');
  }
}

/**
 * Export settings to a JSON file and share it
 */
export async function exportSettings(settings: AppSettings): Promise<void> {
  try {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileName = `ettj-settings-${Date.now()}.json`;
    const file = new File(Paths.cache, fileName);

    // Write content to file
    await file.write(jsonContent);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar Configuracoes ETTJ',
      });
    } else {
      throw new Error('Compartilhamento nao disponivel neste dispositivo');
    }

    // Clean up temp file
    await file.delete();
  } catch (error) {
    console.error('Failed to export settings:', error);
    throw error instanceof Error
      ? error
      : new Error('Nao foi possivel exportar as configuracoes');
  }
}

/**
 * Import settings from a JSON string
 */
export async function importSettings(jsonString: string): Promise<AppSettings> {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data || typeof data !== 'object') {
      throw new Error('Formato de arquivo invalido');
    }

    // Support both direct settings and wrapped format
    const settings: Partial<AppSettings> = data.settings || data;

    // Validate required fields exist
    if (typeof settings !== 'object') {
      throw new Error('Configuracoes invalidas no arquivo');
    }

    // Merge with defaults to ensure all fields are present
    const mergedSettings: AppSettings = { ...DEFAULT_SETTINGS, ...settings };

    // Save the imported settings
    await saveSettings(mergedSettings);

    return mergedSettings;
  } catch (error) {
    console.error('Failed to import settings:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Arquivo JSON invalido');
    }
    throw error instanceof Error
      ? error
      : new Error('Nao foi possivel importar as configuracoes');
  }
}

/**
 * Clear all cached data (preferences, API cache, etc.)
 */
export async function clearCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    // Keep settings but clear other cached data
    const keysToRemove = allKeys.filter(
      (key) => key !== SETTINGS_STORAGE_KEY && key.startsWith('ettj_')
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw new Error('Nao foi possivel limpar o cache');
  }
}

/**
 * Get cache size estimation
 */
export async function getCacheSize(): Promise<string> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(
      (key) => key !== SETTINGS_STORAGE_KEY && key.startsWith('ettj_')
    );

    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // UTF-16 uses 2 bytes per character
      }
    }

    if (totalSize < 1024) {
      return `${totalSize} B`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (error) {
    return 'Desconhecido';
  }
}
