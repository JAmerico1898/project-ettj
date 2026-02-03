/**
 * Root layout for the ETTJ app
 * Sets up navigation and global providers
 */

import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/config';
import { AppProvider } from '../context/AppContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { lightTheme, darkTheme } from '../constants/themes';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NetworkStatusBar } from '../components/NetworkStatusBar';

/**
 * Inner layout component that uses settings context
 */
function AppLayout() {
  const { isDarkMode, effectiveTheme } = useSettings();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const headerBg = isDarkMode ? '#1E1E1E' : COLORS.primary;

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
        <NetworkStatusBar />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: headerBg,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'ETTJ - Curva de Juros',
            }}
          />
          <Stack.Screen
            name="chart"
            options={{
              title: 'Curva',
            }}
          />
          <Stack.Screen
            name="data"
            options={{
              title: 'Dados',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Configuracoes',
            }}
          />
          <Stack.Screen
            name="about"
            options={{
              title: 'Sobre',
            }}
          />
          <Stack.Screen
            name="help"
            options={{
              title: 'Ajuda',
            }}
          />
        </Stack>
      </View>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SettingsProvider>
          <AppProvider>
            <AppLayout />
          </AppProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
