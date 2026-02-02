/**
 * Root layout for the ETTJ app
 * Sets up navigation and global providers
 */

import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/config';
import { AppProvider } from '../context/AppContext';

// Custom theme based on app colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
  },
};

export default function RootLayout() {
  return (
    <AppProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.primary,
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
        </Stack>
      </PaperProvider>
    </AppProvider>
  );
}
