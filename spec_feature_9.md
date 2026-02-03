# Feature 9: Settings and Configuration Screen

## Overview
Build a comprehensive settings and configuration screen that allows users to customize the application behavior, manage preferences, view app information, and configure advanced options. This screen provides control over display settings, data preferences, API configuration, and educational resources.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 5** completed (API client)
- **Feature 6** completed (home screen)
- All core features operational

---

## Objectives
- Configure display preferences (theme, language, units)
- Manage default calculation parameters
- Configure API endpoint and timeout settings
- View application information and version
- Access help and documentation
- Manage data cache and storage
- Export/import user preferences
- View educational resources
- Provide feedback mechanism
- Privacy and data management
- About screen with credits
- Tutorial/onboarding toggle
- Developer options (debug mode)

---

## Screen Design

### Layout Structure
```
┌─────────────────────────────────┐
│ ← Configurações                 │ Header
├─────────────────────────────────┤
│                                 │
│ 👤 Preferências                 │ Section Header
│ ┌──────────────────────────┐   │
│ │ 🌓 Tema                  │   │ Settings Group
│ │    Escuro              ▶ │   │
│ │                          │   │
│ │ 🌍 Idioma                │   │
│ │    Português (BR)      ▶ │   │
│ │                          │   │
│ │ 📊 Unidades Padrão       │   │
│ │    Anos / Percentual   ▶ │   │
│ └──────────────────────────┘   │
│                                 │
│ 📈 Padrões de Cálculo           │ Section Header
│ ┌──────────────────────────┐   │
│ │ 🎯 Método Favorito       │   │
│ │    Nelson-Siegel       ▶ │   │
│ │                          │   │
│ │ 📅 Maturidade Máxima     │   │
│ │    5 anos (1260 dias)  ▶ │   │
│ │                          │   │
│ │ 🔢 Pontos da Curva       │   │
│ │    1260 pontos         ▶ │   │
│ └──────────────────────────┘   │
│                                 │
│ 🔧 Avançado                     │ Section Header
│ ┌──────────────────────────┐   │
│ │ 🌐 Servidor API          │   │
│ │ 💾 Gerenciar Cache       │   │
│ │ 🔄 Redefinir Padrões     │   │
│ └──────────────────────────┘   │
│                                 │
│ 📚 Recursos                     │ Section Header
│ ┌──────────────────────────┐   │
│ │ 📖 Tutorial              │   │
│ │ ❓ Ajuda e FAQ           │   │
│ │ 📄 Documentação          │   │
│ └──────────────────────────┘   │
│                                 │
│ ℹ️ Sobre                        │ Section Header
│ ┌──────────────────────────┐   │
│ │ 📱 Versão 1.0.0          │   │
│ │ 👨‍💻 Créditos              │   │
│ │ 📜 Licença               │   │
│ │ 🔒 Privacidade           │   │
│ └──────────────────────────┘   │
└─────────────────────────────────┘
```

---

## Implementation

### File Structure
```
mobile/
├── app/
│   ├── settings.tsx           # Settings screen (NEW)
│   ├── about.tsx              # About screen (NEW)
│   └── help.tsx               # Help/FAQ screen (NEW)
├── components/
│   ├── SettingsSection.tsx    # Settings section (NEW)
│   ├── SettingItem.tsx        # Individual setting (NEW)
│   ├── ThemeSelector.tsx      # Theme picker (NEW)
│   ├── MethodPicker.tsx       # Default method picker (NEW)
│   └── ApiConfig.tsx          # API configuration (NEW)
├── hooks/
│   ├── useSettings.ts         # Settings hook (NEW)
│   └── useTheme.ts            # Theme hook (NEW)
├── contexts/
│   ├── SettingsContext.tsx    # Settings context (NEW)
│   └── ThemeContext.tsx       # Theme context (NEW)
├── utils/
│   ├── settingsStorage.ts     # Settings persistence (NEW)
│   └── themeUtils.ts          # Theme utilities (NEW)
└── constants/
    ├── defaultSettings.ts     # Default values (NEW)
    └── themes.ts              # Theme definitions (NEW)
```

---

## Code Implementation

### `mobile/constants/defaultSettings.ts` (NEW FILE)
```typescript
/**
 * Default application settings
 */

export interface AppSettings {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
  useYears: boolean;
  usePercent: boolean;
  
  // Calculation defaults
  defaultMethod: string;
  maxBusinessDays: number;
  curvePoints: number;
  
  // Advanced settings
  apiBaseUrl: string;
  apiTimeout: number;
  cacheEnabled: boolean;
  cacheDuration: number; // milliseconds
  
  // Feature toggles
  showTutorial: boolean;
  enableNotifications: boolean;
  debugMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Display preferences
  theme: 'auto',
  language: 'pt-BR',
  useYears: true,
  usePercent: true,
  
  // Calculation defaults
  defaultMethod: 'nelson_siegel',
  maxBusinessDays: 1260,
  curvePoints: 1260,
  
  // Advanced settings
  apiBaseUrl: 'http://192.168.1.100:8000',
  apiTimeout: 30000,
  cacheEnabled: false,
  cacheDuration: 3600000, // 1 hour
  
  // Feature toggles
  showTutorial: true,
  enableNotifications: false,
  debugMode: false,
};

export const SETTINGS_STORAGE_KEY = '@ettj_settings';
```

### `mobile/constants/themes.ts` (NEW FILE)
```typescript
/**
 * Theme definitions
 */
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    error: '#B00020',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    background: '#1C1B1F',
    surface: '#2B2930',
    error: '#F2B8B5',
  },
};
```

### `mobile/utils/settingsStorage.ts` (NEW FILE)
```typescript
/**
 * Settings persistence utilities
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type AppSettings } from '@/constants/defaultSettings';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    
    const parsed = JSON.parse(stored);
    
    // Merge with defaults to handle new settings
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export async function resetSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
}

export async function exportSettings(): Promise<string> {
  const settings = await loadSettings();
  return JSON.stringify(settings, null, 2);
}

export async function importSettings(jsonString: string): Promise<void> {
  try {
    const settings = JSON.parse(jsonString) as AppSettings;
    await saveSettings(settings);
  } catch (error) {
    console.error('Failed to import settings:', error);
    throw new Error('Invalid settings format');
  }
}
```

### `mobile/contexts/SettingsContext.tsx` (NEW FILE)
```typescript
/**
 * Settings context provider
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppSettings } from '@/constants/defaultSettings';
import { DEFAULT_SETTINGS } from '@/constants/defaultSettings';
import { loadSettings, saveSettings } from '@/utils/settingsStorage';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialSettings();
  }, []);

  const loadInitialSettings = async () => {
    try {
      const loaded = await loadSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const resetSettingsHandler = async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings: resetSettingsHandler,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
```

### `mobile/components/SettingsSection.tsx` (NEW FILE)
```typescript
/**
 * Settings section component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';

interface SettingsSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {icon && `${icon} `}{title}
        </Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
      <Divider style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  divider: {
    marginTop: 16,
  },
});
```

### `mobile/components/SettingItem.tsx` (NEW FILE)
```typescript
/**
 * Individual setting item component
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { List, Switch } from 'react-native-paper';

interface SettingItemProps {
  title: string;
  description?: string;
  icon?: string;
  value?: string;
  type?: 'navigation' | 'toggle' | 'info';
  toggleValue?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export function SettingItem({
  title,
  description,
  icon,
  value,
  type = 'navigation',
  toggleValue,
  onPress,
  onToggle,
}: SettingItemProps) {
  if (type === 'toggle') {
    return (
      <List.Item
        title={title}
        description={description}
        left={icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined}
        right={() => (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
          />
        )}
      />
    );
  }

  if (type === 'info') {
    return (
      <List.Item
        title={title}
        description={description}
        left={icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined}
        right={() => <List.Icon icon="" />} // Empty to align
      />
    );
  }

  return (
    <List.Item
      title={title}
      description={description || value}
      left={icon ? (props) => <List.Icon {...props} icon={icon} /> : undefined}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={onPress}
    />
  );
}
```

### `mobile/components/ThemeSelector.tsx` (NEW FILE)
```typescript
/**
 * Theme selector dialog
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, RadioButton, Text, Button } from 'react-native-paper';

interface ThemeSelectorProps {
  visible: boolean;
  currentTheme: 'light' | 'dark' | 'auto';
  onDismiss: () => void;
  onSelect: (theme: 'light' | 'dark' | 'auto') => void;
}

export function ThemeSelector({
  visible,
  currentTheme,
  onDismiss,
  onSelect,
}: ThemeSelectorProps) {
  const [selected, setSelected] = useState(currentTheme);

  const handleConfirm = () => {
    onSelect(selected);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Escolher Tema</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group value={selected} onValueChange={(value) => setSelected(value as any)}>
            <RadioButton.Item label="Claro" value="light" />
            <RadioButton.Item label="Escuro" value="dark" />
            <RadioButton.Item label="Automático (Sistema)" value="auto" />
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleConfirm}>Confirmar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
```

### `mobile/components/ApiConfig.tsx` (NEW FILE)
```typescript
/**
 * API configuration component
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, TextInput, Button, Text, HelperText } from 'react-native-paper';

interface ApiConfigProps {
  visible: boolean;
  currentUrl: string;
  currentTimeout: number;
  onDismiss: () => void;
  onSave: (url: string, timeout: number) => void;
}

export function ApiConfig({
  visible,
  currentUrl,
  currentTimeout,
  onDismiss,
  onSave,
}: ApiConfigProps) {
  const [url, setUrl] = useState(currentUrl);
  const [timeout, setTimeout] = useState(currentTimeout.toString());
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (!validateUrl(url)) {
      setUrlError('URL inválida');
      return;
    }

    const timeoutNum = parseInt(timeout, 10);
    if (isNaN(timeoutNum) || timeoutNum < 5000 || timeoutNum > 120000) {
      return;
    }

    onSave(url, timeoutNum);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Configurar API</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="URL do Servidor"
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              setUrlError('');
            }}
            mode="outlined"
            placeholder="http://192.168.1.100:8000"
            error={!!urlError}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          {urlError && <HelperText type="error">{urlError}</HelperText>}

          <TextInput
            label="Timeout (ms)"
            value={timeout}
            onChangeText={setTimeout}
            mode="outlined"
            keyboardType="numeric"
            placeholder="30000"
            style={styles.input}
          />
          <HelperText type="info">
            Entre 5000 e 120000 milissegundos
          </HelperText>

          <Text variant="bodySmall" style={styles.note}>
            ⚠️ Alterações exigem reiniciar o aplicativo
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleSave}>Salvar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },
  note: {
    marginTop: 16,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
```

### `mobile/app/settings.tsx` (NEW FILE)
```typescript
/**
 * Settings Screen
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Appbar, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { SettingsSection } from '@/components/SettingsSection';
import { SettingItem } from '@/components/SettingItem';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ApiConfig } from '@/components/ApiConfig';
import { useSettings } from '@/contexts/SettingsContext';
import { exportSettings, importSettings } from '@/utils/settingsStorage';
import { apiClient } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetSettings } = useSettings();
  
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [apiDialogVisible, setApiDialogVisible] = useState(false);

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    await updateSettings({ theme });
  };

  const handleApiConfigSave = async (url: string, timeout: number) => {
    await updateSettings({ apiBaseUrl: url, apiTimeout: timeout });
    apiClient.setBaseURL(url);
    apiClient.setTimeout(timeout);
    
    Alert.alert('Sucesso', 'Configurações da API atualizadas');
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Deseja limpar todos os dados em cache?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Sucesso', 'Cache limpo com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar o cache');
            }
          },
        },
      ]
    );
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Redefinir Padrões',
      'Isso irá restaurar todas as configurações para os valores padrão. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Sucesso', 'Configurações redefinidas');
          },
        },
      ]
    );
  };

  const handleExportSettings = async () => {
    try {
      const json = await exportSettings();
      const fileUri = `${FileSystem.documentDirectory}ettj-settings.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Configurações',
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar as configurações');
    }
  };

  const getThemeLabel = (theme: string) => {
    const labels = {
      light: 'Claro',
      dark: 'Escuro',
      auto: 'Automático',
    };
    return labels[theme as keyof typeof labels] || theme;
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Configurações" />
      </Appbar.Header>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Display Preferences */}
        <SettingsSection title="Preferências" icon="👤">
          <SettingItem
            title="Tema"
            icon="brightness-6"
            value={getThemeLabel(settings.theme)}
            onPress={() => setThemeDialogVisible(true)}
          />
          <Divider />
          <SettingItem
            title="Unidades de Maturidade"
            icon="calendar"
            value={settings.useYears ? 'Anos' : 'Dias Úteis'}
            onPress={() => updateSettings({ useYears: !settings.useYears })}
          />
          <Divider />
          <SettingItem
            title="Formato de Taxa"
            icon="percent"
            value={settings.usePercent ? 'Percentual' : 'Decimal'}
            onPress={() => updateSettings({ usePercent: !settings.usePercent })}
          />
        </SettingsSection>

        {/* Calculation Defaults */}
        <SettingsSection title="Padrões de Cálculo" icon="📈">
          <SettingItem
            title="Maturidade Máxima"
            icon="clock-outline"
            value={`${settings.maxBusinessDays} dias (${(settings.maxBusinessDays / 252).toFixed(1)} anos)`}
            onPress={() => {
              // Could open a picker dialog
              Alert.alert('Info', 'Configuração de maturidade máxima');
            }}
          />
          <Divider />
          <SettingItem
            title="Pontos da Curva"
            icon="chart-line"
            value={`${settings.curvePoints} pontos`}
            onPress={() => {
              Alert.alert('Info', 'Número de pontos na curva calculada');
            }}
          />
        </SettingsSection>

        {/* Advanced Settings */}
        <SettingsSection title="Avançado" icon="🔧">
          <SettingItem
            title="Servidor API"
            icon="server"
            value={settings.apiBaseUrl}
            onPress={() => setApiDialogVisible(true)}
          />
          <Divider />
          <SettingItem
            title="Cache de Dados"
            icon="database"
            type="toggle"
            toggleValue={settings.cacheEnabled}
            onToggle={(value) => updateSettings({ cacheEnabled: value })}
          />
          <Divider />
          <SettingItem
            title="Modo Desenvolvedor"
            icon="code-tags"
            type="toggle"
            toggleValue={settings.debugMode}
            onToggle={(value) => updateSettings({ debugMode: value })}
          />
          <Divider />
          <SettingItem
            title="Gerenciar Cache"
            icon="delete"
            onPress={handleClearCache}
          />
          <Divider />
          <SettingItem
            title="Redefinir Padrões"
            icon="restore"
            onPress={handleResetDefaults}
          />
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="Gerenciamento de Dados" icon="💾">
          <SettingItem
            title="Exportar Configurações"
            icon="export"
            onPress={handleExportSettings}
          />
        </SettingsSection>

        {/* Resources */}
        <SettingsSection title="Recursos" icon="📚">
          <SettingItem
            title="Tutorial"
            icon="school"
            onPress={() => {
              updateSettings({ showTutorial: true });
              router.push('/');
            }}
          />
          <Divider />
          <SettingItem
            title="Ajuda e FAQ"
            icon="help-circle"
            onPress={() => router.push('/help')}
          />
          <Divider />
          <SettingItem
            title="Documentação"
            icon="file-document"
            onPress={() => {
              Alert.alert('Documentação', 'Abrindo documentação...');
            }}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="Sobre" icon="ℹ️">
          <SettingItem
            title="Versão"
            icon="information"
            type="info"
            description="1.0.0"
          />
          <Divider />
          <SettingItem
            title="Sobre o Aplicativo"
            icon="information-outline"
            onPress={() => router.push('/about')}
          />
          <Divider />
          <SettingItem
            title="Licença"
            icon="license"
            onPress={() => {
              Alert.alert('Licença', 'MIT License');
            }}
          />
          <Divider />
          <SettingItem
            title="Privacidade"
            icon="shield-lock"
            onPress={() => {
              Alert.alert(
                'Privacidade',
                'Este aplicativo não coleta dados pessoais. Todos os dados são armazenados localmente no dispositivo.'
              );
            }}
          />
        </SettingsSection>
      </ScrollView>

      {/* Dialogs */}
      <ThemeSelector
        visible={themeDialogVisible}
        currentTheme={settings.theme}
        onDismiss={() => setThemeDialogVisible(false)}
        onSelect={handleThemeChange}
      />

      <ApiConfig
        visible={apiDialogVisible}
        currentUrl={settings.apiBaseUrl}
        currentTimeout={settings.apiTimeout}
        onDismiss={() => setApiDialogVisible(false)}
        onSave={handleApiConfigSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
```

### `mobile/app/about.tsx` (NEW FILE)
```typescript
/**
 * About Screen
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Appbar, Card, Text, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

export default function AboutScreen() {
  const router = useRouter();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Sobre" />
      </Appbar.Header>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* App Icon and Name */}
        <View style={styles.header}>
          <View style={styles.iconPlaceholder}>
            <Text variant="displayMedium">📊</Text>
          </View>
          <Text variant="headlineMedium" style={styles.appName}>
            ETTJ DI1
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Estrutura a Termo da Taxa de Juros
          </Text>
          <Text variant="bodySmall" style={styles.version}>
            Versão 1.0.0
          </Text>
        </View>

        {/* Description */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Descrição
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Aplicativo educacional para modelagem da estrutura a termo da taxa de juros 
              brasileira usando contratos futuros DI1 da B3.
            </Text>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium" style={styles.description}>
              Desenvolvido na Coppead/UFRJ como ferramenta educacional para cursos de 
              finanças e renda fixa.
            </Text>
          </Card.Content>
        </Card>

        {/* Features */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Funcionalidades
            </Text>
            <View style={styles.featureList}>
              <Text variant="bodyMedium">✓ 7 métodos de interpolação</Text>
              <Text variant="bodyMedium">✓ Dados em tempo real da B3</Text>
              <Text variant="bodyMedium">✓ Visualização interativa</Text>
              <Text variant="bodyMedium">✓ Exportação de dados</Text>
              <Text variant="bodyMedium">✓ Análise de qualidade do ajuste</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Credits */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Créditos
            </Text>
            <Text variant="bodyMedium" style={styles.credit}>
              <Text style={styles.creditLabel}>Desenvolvedor:</Text>{'\n'}
              Coppead/UFRJ
            </Text>
            <Text variant="bodyMedium" style={styles.credit}>
              <Text style={styles.creditLabel}>Dados:</Text>{'\n'}
              B3 - Brasil, Bolsa, Balcão
            </Text>
            <Text variant="bodyMedium" style={styles.credit}>
              <Text style={styles.creditLabel}>Bibliotecas:</Text>{'\n'}
              React Native, Expo, Victory Native
            </Text>
          </Card.Content>
        </Card>

        {/* Legal */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Licença
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Este software é distribuído sob a licença MIT.
            </Text>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.disclaimer}>
              Este aplicativo é fornecido apenas para fins educacionais. Não constitui 
              aconselhamento financeiro ou recomendação de investimento.
            </Text>
          </Card.Content>
        </Card>

        {/* Links */}
        <View style={styles.links}>
          <Button
            mode="outlined"
            icon="github"
            onPress={() => openLink('https://github.com')}
            style={styles.linkButton}
          >
            GitHub
          </Button>
          <Button
            mode="outlined"
            icon="web"
            onPress={() => openLink('https://coppead.ufrj.br')}
            style={styles.linkButton}
          >
            Coppead/UFRJ
          </Button>
        </View>

        {/* Copyright */}
        <Text variant="bodySmall" style={styles.copyright}>
          © 2025 Coppead/UFRJ. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    opacity: 0.5,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6750A4',
  },
  description: {
    lineHeight: 22,
  },
  divider: {
    marginVertical: 12,
  },
  featureList: {
    gap: 8,
  },
  credit: {
    marginBottom: 12,
    lineHeight: 20,
  },
  creditLabel: {
    fontWeight: 'bold',
  },
  disclaimer: {
    fontStyle: 'italic',
    opacity: 0.7,
    lineHeight: 18,
  },
  links: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  linkButton: {
    flex: 1,
  },
  copyright: {
    textAlign: 'center',
    opacity: 0.5,
  },
});
```

### `mobile/app/help.tsx` (NEW FILE)
```typescript
/**
 * Help/FAQ Screen
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, List } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Ajuda e FAQ" />
      </Appbar.Header>

      <ScrollView style={styles.container}>
        <List.Section>
          <List.Subheader>Primeiros Passos</List.Subheader>
          
          <List.Accordion
            title="Como usar o aplicativo?"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
          >
            <List.Item
              title="1. Selecione uma data de referência"
              description="Escolha um dia útil para análise"
            />
            <List.Item
              title="2. Escolha o método de interpolação"
              description="7 métodos disponíveis (Nelson-Siegel recomendado)"
            />
            <List.Item
              title="3. Calcule a curva"
              description="O app buscará dados da B3 e calculará a curva"
            />
            <List.Item
              title="4. Visualize os resultados"
              description="Gráfico interativo e tabela de dados"
            />
          </List.Accordion>

          <List.Accordion
            title="O que são os métodos de interpolação?"
            left={(props) => <List.Icon {...props} icon="chart-bell-curve" />}
          >
            <List.Item
              description="Métodos matemáticos para criar uma curva suave a partir dos pontos discretos dos contratos DI1"
            />
          </List.Accordion>
        </List.Section>

        <List.Section>
          <List.Subheader>Problemas Comuns</List.Subheader>
          
          <List.Accordion
            title="Erro ao buscar dados"
            left={(props) => <List.Icon {...props} icon="alert-circle" />}
          >
            <List.Item
              title="Verifique sua conexão"
              description="Certifique-se de estar conectado à internet"
            />
            <List.Item
              title="Data inválida"
              description="Use apenas dias úteis (segunda a sexta)"
            />
            <List.Item
              title="Servidor offline"
              description="Aguarde alguns minutos e tente novamente"
            />
          </List.Accordion>

          <List.Accordion
            title="Dados não aparecem"
            left={(props) => <List.Icon {...props} icon="database-remove" />}
          >
            <List.Item
              title="Feriados"
              description="Não há dados para feriados brasileiros"
            />
            <List.Item
              title="Fins de semana"
              description="Escolha um dia útil"
            />
          </List.Accordion>
        </List.Section>

        <List.Section>
          <List.Subheader>Sobre os Dados</List.Subheader>
          
          <List.Accordion
            title="O que são contratos DI1?"
            left={(props) => <List.Icon {...props} icon="file-document" />}
          >
            <List.Item
              description="Contratos futuros de taxa de juros DI (Depósito Interbancário) negociados na B3"
            />
          </List.Accordion>

          <List.Accordion
            title="Convenções do mercado brasileiro"
            left={(props) => <List.Icon {...props} icon="calendar" />}
          >
            <List.Item
              title="252 dias úteis por ano"
              description="Convenção brasileira para cálculo de juros"
            />
            <List.Item
              title="Vencimento mensal"
              description="Contratos vencem no primeiro dia útil de cada mês"
            />
          </List.Accordion>
        </List.Section>

        <List.Section>
          <List.Subheader>Contato</List.Subheader>
          <List.Item
            title="Reportar problema"
            description="Entre em contato com o suporte"
            left={(props) => <List.Icon {...props} icon="email" />}
          />
        </List.Section>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
```

### Update `mobile/app/_layout.tsx` (WRAP WITH PROVIDER)
```typescript
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <PaperProvider>
        <Stack>
          {/* ... existing screens */}
          <Stack.Screen 
            name="settings" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="about" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="help" 
            options={{ headerShown: false }} 
          />
        </Stack>
      </PaperProvider>
    </SettingsProvider>
  );
}
```

---

## Testing

### Manual Testing Checklist

```markdown
# Settings Screen Testing Checklist

## Theme Settings
- [ ] Open theme selector dialog
- [ ] Select light theme - app updates
- [ ] Select dark theme - app updates
- [ ] Select auto theme - follows system
- [ ] Theme persists after app restart

## Display Preferences
- [ ] Toggle years/days - updates default
- [ ] Toggle percent/decimal - updates default
- [ ] Settings persist after restart

## Calculation Defaults
- [ ] View max maturity setting
- [ ] View curve points setting
- [ ] Values used in new calculations

## API Configuration
- [ ] Open API config dialog
- [ ] Enter invalid URL - shows error
- [ ] Enter valid URL - saves
- [ ] Change timeout value
- [ ] Settings persist

## Cache Management
- [ ] Toggle cache enabled/disabled
- [ ] Clear cache shows confirmation
- [ ] Clear cache actually clears data
- [ ] App works after clearing cache

## Reset Defaults
- [ ] Tap reset - shows confirmation
- [ ] Confirm reset - restores defaults
- [ ] All settings back to default
- [ ] App works normally after reset

## Export Settings
- [ ] Export creates JSON file
- [ ] Share dialog opens
- [ ] File contains settings
- [ ] JSON format valid

## Navigation
- [ ] All menu items clickable
- [ ] Back button returns
- [ ] Help screen opens
- [ ] About screen opens

## Settings Persistence
- [ ] Change multiple settings
- [ ] Close app completely
- [ ] Reopen app
- [ ] All settings preserved

## About Screen
- [ ] Version number displays
- [ ] All sections visible
- [ ] Links clickable
- [ ] Copyright info shown

## Help Screen
- [ ] All FAQ sections expand
- [ ] Content readable
- [ ] Navigation works
- [ ] Back button works
```

---

## Acceptance Criteria

- ✅ Settings screen accessible from main menu
- ✅ Theme selection works (light/dark/auto)
- ✅ All preferences persist across sessions
- ✅ API configuration functional
- ✅ Cache management works
- ✅ Reset to defaults functional
- ✅ Export settings creates valid JSON
- ✅ About screen shows app info
- ✅ Help/FAQ screen comprehensive
- ✅ All navigation functional
- ✅ Settings validate properly
- ✅ Confirmation dialogs for destructive actions
- ✅ All text in Portuguese
- ✅ Responsive on different screen sizes

---

## Next Steps

After Feature 9:
- **Feature 10**: Error handling and offline support
- **Feature 11**: Educational content and tutorials
- **Feature 12**: Final polish and deployment

---

## Dependencies

```json
{
  "expo-linking": "~6.3.1",
  "expo-sharing": "~12.0.1",
  "expo-file-system": "~17.0.1"
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 9 |