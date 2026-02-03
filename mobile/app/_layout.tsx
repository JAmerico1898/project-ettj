/**
 * Root layout for the ETTJ app
 * Sets up navigation and global providers
 */

import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/config';
import { AppProvider } from '../context/AppContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { lightTheme, darkTheme } from '../constants/themes';

/**
 * Inner layout component that uses settings context
 */
function AppLayout() {
  const { isDarkMode, effectiveTheme } = useSettings();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const headerBg = isDarkMode ? '#1E1E1E' : COLORS.primary;

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
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
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </SettingsProvider>
  );
}
