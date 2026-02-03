/**
 * Settings screen - App configuration and preferences
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/config';
import {
  THEME_DISPLAY_NAMES,
  ThemeMode,
} from '../constants/defaultSettings';
import { useSettings } from '../context/SettingsContext';
import { SettingsSection } from '../components/SettingsSection';
import { SettingItem } from '../components/SettingItem';
import { ThemeSelector } from '../components/ThemeSelector';
import { ApiConfig } from '../components/ApiConfig';
import { METHOD_DISPLAY_NAMES } from '../utils/validation';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    exportSettings,
    clearCache,
    getCacheSize,
  } = useSettings();

  // Dialog visibility states
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [apiDialogVisible, setApiDialogVisible] = useState(false);

  // Cache size state
  const [cacheSize, setCacheSize] = useState<string>('...');

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load cache size on mount
  React.useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(size);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleThemeSelect = async (theme: ThemeMode) => {
    await updateSetting('theme', theme);
    showSnackbar('Tema atualizado');
  };

  const handleApiConfigSave = async (url: string, timeout: number) => {
    await updateSettings({
      apiBaseUrl: url,
      apiTimeout: timeout,
    });
    showSnackbar('Configuracoes da API atualizadas');
  };

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Limpar Cache',
      'Isso ira remover dados em cache e preferencias salvas (exceto configuracoes). Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              await loadCacheSize();
              showSnackbar('Cache limpo com sucesso');
            } catch (error) {
              showSnackbar('Erro ao limpar cache');
            }
          },
        },
      ]
    );
  }, [clearCache]);

  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Redefinir Configuracoes',
      'Isso ira restaurar todas as configuracoes para os valores padrao. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              showSnackbar('Configuracoes redefinidas');
            } catch (error) {
              showSnackbar('Erro ao redefinir configuracoes');
            }
          },
        },
      ]
    );
  }, [resetToDefaults]);

  const handleExportSettings = useCallback(async () => {
    try {
      await exportSettings();
      showSnackbar('Configuracoes exportadas');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao exportar';
      showSnackbar(message);
    }
  }, [exportSettings]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <SettingsSection title="Preferencias" icon="palette">
          <SettingItem
            type="navigation"
            title="Tema"
            description="Aparencia do aplicativo"
            icon="theme-light-dark"
            value={THEME_DISPLAY_NAMES[settings.theme]}
            onPress={() => setThemeDialogVisible(true)}
          />
          <SettingItem
            type="toggle"
            title="Animacoes do Grafico"
            description="Ativar animacoes ao exibir curvas"
            icon="animation"
            value={settings.chartAnimationsEnabled}
            onToggle={(value) => updateSetting('chartAnimationsEnabled', value)}
          />
          <SettingItem
            type="toggle"
            title="Carregar Dados Automaticamente"
            description="Buscar contratos ao abrir o app"
            icon="cloud-download"
            value={settings.autoLoadData}
            onToggle={(value) => updateSetting('autoLoadData', value)}
          />
        </SettingsSection>

        {/* Calculation Defaults Section */}
        <SettingsSection title="Padroes de Calculo" icon="calculator-variant">
          <SettingItem
            type="info"
            title="Metodo Padrao"
            description="Metodo de suavizacao inicial"
            icon="chart-bell-curve-cumulative"
            value={METHOD_DISPLAY_NAMES[settings.defaultMethod]}
          />
          <SettingItem
            type="info"
            title="Casas Decimais"
            description="Precisao na exibicao de taxas"
            icon="decimal"
            value={String(settings.decimalPlaces)}
          />
        </SettingsSection>

        {/* Advanced Section */}
        <SettingsSection title="Avancado" icon="cog">
          <SettingItem
            type="navigation"
            title="Configuracao da API"
            description="URL e timeout do servidor"
            icon="api"
            value=""
            onPress={() => setApiDialogVisible(true)}
          />
          <SettingItem
            type="toggle"
            title="Cache Habilitado"
            description="Armazenar dados localmente"
            icon="database"
            value={settings.cacheEnabled}
            onToggle={(value) => updateSetting('cacheEnabled', value)}
          />
          <SettingItem
            type="action"
            title="Limpar Cache"
            description={`Tamanho atual: ${cacheSize}`}
            icon="delete-sweep"
            onPress={handleClearCache}
          />
          <SettingItem
            type="action"
            title="Exportar Configuracoes"
            description="Salvar configuracoes em arquivo JSON"
            icon="export"
            onPress={handleExportSettings}
          />
          <SettingItem
            type="action"
            title="Redefinir Configuracoes"
            description="Restaurar valores padrao"
            icon="restore"
            onPress={handleResetSettings}
            destructive
          />
        </SettingsSection>

        {/* Resources Section */}
        <SettingsSection title="Recursos" icon="book-open-variant">
          <SettingItem
            type="navigation"
            title="Tutorial"
            description="Guia de introducao ao app"
            icon="school"
            onPress={() => router.push('/tutorial')}
          />
          <SettingItem
            type="navigation"
            title="Central de Aprendizado"
            description="Conceitos e explicacoes"
            icon="book-education"
            onPress={() => router.push('/learning')}
          />
          <SettingItem
            type="navigation"
            title="Glossario"
            description="Termos tecnicos explicados"
            icon="book-alphabet"
            onPress={() => router.push('/glossary')}
          />
          <SettingItem
            type="navigation"
            title="Ajuda e FAQ"
            description="Perguntas frequentes"
            icon="help-circle"
            onPress={() => router.push('/help')}
          />
          <SettingItem
            type="navigation"
            title="Sobre o App"
            description="Informacoes e creditos"
            icon="information"
            onPress={() => router.push('/about')}
          />
        </SettingsSection>
      </ScrollView>

      {/* Dialogs */}
      <ThemeSelector
        visible={themeDialogVisible}
        currentTheme={settings.theme}
        onSelect={handleThemeSelect}
        onDismiss={() => setThemeDialogVisible(false)}
      />

      <ApiConfig
        visible={apiDialogVisible}
        currentUrl={settings.apiBaseUrl}
        currentTimeout={settings.apiTimeout}
        onSave={handleApiConfigSave}
        onDismiss={() => setApiDialogVisible(false)}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
});
