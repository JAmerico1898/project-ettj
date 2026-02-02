/**
 * Home screen - Date picker and method selector
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Card, Surface, SegmentedButtons, Banner, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/config';
import { useApp } from '../context/AppContext';
import { SmoothingMethod } from '../types';

// Conditionally import DateTimePicker only for native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    selectedDate,
    actualDate,
    selectedMethod,
    contracts,
    isLoading,
    error,
    setSelectedDate,
    setSelectedMethod,
    loadData,
    loadMethods,
    clearError,
  } = useApp();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateValue, setWebDateValue] = useState('');

  // Load methods on mount
  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  // Sync web date input with selected date
  useEffect(() => {
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setWebDateValue(`${yyyy}-${mm}-${dd}`);
    } else {
      setWebDateValue('');
    }
  }, [selectedDate]);

  const handleNativeDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleWebDateChange = (dateStr: string) => {
    setWebDateValue(dateStr);
    if (dateStr) {
      const date = new Date(dateStr + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    } else {
      setSelectedDate(null);
    }
  };

  const handleLoadData = async () => {
    await loadData();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Último dia útil';
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateISO = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getTodayString = (): string => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Method categories for segmented display
  const methodCategories = [
    { value: 'parametric', label: 'Paramétrico' },
    { value: 'splines', label: 'Splines' },
    { value: 'simple', label: 'Simples' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('parametric');

  const methodsByCategory: Record<string, { value: SmoothingMethod; label: string }[]> = {
    parametric: [
      { value: 'nelson_siegel_svensson', label: 'NS-Svensson' },
      { value: 'nelson_siegel', label: 'Nelson-Siegel' },
    ],
    splines: [
      { value: 'cubic_spline', label: 'Cubic' },
      { value: 'akima', label: 'Akima' },
      { value: 'pchip', label: 'PCHIP' },
      { value: 'smoothing_spline', label: 'Smoothing' },
    ],
    simple: [
      { value: 'linear', label: 'Linear' },
    ],
  };

  // Render date picker based on platform
  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webDateContainer}>
          <Text variant="bodySmall" style={styles.dateLabel}>
            Selecione uma data ou deixe vazio para último dia útil:
          </Text>
          <View style={styles.webDateRow}>
            <input
              type="date"
              value={webDateValue}
              onChange={(e) => handleWebDateChange(e.target.value)}
              max={getTodayString()}
              style={{
                width: 180,
                padding: 10,
                fontSize: 14,
                borderRadius: 4,
                border: `1px solid ${COLORS.primary}`,
                marginTop: 8,
              }}
            />
            {selectedDate && (
              <Button
                mode="text"
                onPress={() => {
                  setSelectedDate(null);
                  setWebDateValue('');
                }}
                compact
              >
                Limpar
              </Button>
            )}
          </View>
        </View>
      );
    }

    // Native platforms (iOS/Android)
    return (
      <>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          style={styles.dateButton}
        >
          {formatDate(selectedDate)}
        </Button>
        {selectedDate && (
          <Button
            mode="text"
            onPress={() => setSelectedDate(null)}
            compact
            style={styles.clearButton}
          >
            Usar último dia útil
          </Button>
        )}
        {showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleNativeDateChange}
            maximumDate={new Date()}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineMedium" style={styles.title}>
          Estrutura a Termo
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Taxa de Juros DI - B3
        </Text>
      </Surface>

      {error && (
        <Banner
          visible={true}
          actions={[{ label: 'Fechar', onPress: clearError }]}
          icon="alert-circle"
          style={styles.errorBanner}
        >
          {error}
        </Banner>
      )}

      {/* Date Selection Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Data de Referência
          </Text>
          {renderDatePicker()}
        </Card.Content>
      </Card>

      {/* Method Selection Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Método de Suavização
          </Text>
          <SegmentedButtons
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            buttons={methodCategories}
            style={styles.categoryButtons}
          />
          <View style={styles.methodButtons}>
            {methodsByCategory[selectedCategory]?.map((method) => (
              <Button
                key={method.value}
                mode={selectedMethod === method.value ? 'contained' : 'outlined'}
                onPress={() => setSelectedMethod(method.value)}
                compact
                style={styles.methodButton}
              >
                {method.label}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Load Data Button */}
      <Button
        mode="contained"
        onPress={handleLoadData}
        style={styles.loadButton}
        icon="download"
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Carregando...' : 'Carregar Dados'}
      </Button>

      {/* Data Status */}
      {contracts.length > 0 && (
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.statusText}>
              {contracts.length} contratos carregados
            </Text>
            {actualDate && (
              <Text variant="bodySmall" style={styles.statusSubtext}>
                Data dos dados: {formatDateISO(actualDate)}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push('/chart')}
          style={styles.button}
          icon="chart-line"
          disabled={contracts.length === 0}
        >
          Ver Curva
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push('/data')}
          style={styles.button}
          icon="table"
          disabled={contracts.length === 0}
        >
          Ver Dados
        </Button>
      </View>

      <Surface style={styles.footer} elevation={0}>
        <Text variant="bodySmall" style={styles.footerText}>
          Coppead/UFRJ - Ferramenta Educacional
        </Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    marginBottom: 8,
    backgroundColor: '#FFEBEE',
  },
  card: {
    marginVertical: 8,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    marginBottom: 12,
    color: COLORS.text,
  },
  webDateContainer: {
    marginBottom: 4,
  },
  webDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    color: COLORS.textSecondary,
  },
  dateButton: {
    marginBottom: 4,
  },
  clearButton: {
    marginTop: 4,
  },
  categoryButtons: {
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    marginBottom: 4,
  },
  loadButton: {
    marginVertical: 16,
    paddingVertical: 4,
  },
  statusCard: {
    backgroundColor: '#E3F2FD',
    marginBottom: 8,
  },
  statusText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusSubtext: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  button: {
    paddingVertical: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  footerText: {
    color: COLORS.textSecondary,
  },
});
