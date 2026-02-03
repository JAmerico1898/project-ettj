/**
 * Home screen - ETTJ DI1 main interface
 * Date selection, method configuration, and curve calculation
 */

import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, Surface, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/config';
import { useApp } from '../context/AppContext';
import { useWorkflow } from '../hooks/useWorkflow';
import { SmoothingMethod } from '../types';
import {
  DatePicker,
  QuickDateButtons,
  MethodSelector,
  ParameterEditor,
  LoadingOverlay,
  ErrorMessage,
} from '../components';
import {
  formatDateBR,
  formatDateISO,
  validateDateRange,
  getTodayOrLastBusinessDay,
} from '../utils/dateUtils';
import {
  validateMethodSelection,
  validateParameters,
  combineValidationResults,
  METHOD_DISPLAY_NAMES,
  DEFAULT_SMOOTHING_PARAMETER,
} from '../utils/validation';

// AsyncStorage keys for persisting user preferences
const STORAGE_KEYS = {
  LAST_DATE: 'ettj_lastSelectedDate',
  LAST_METHOD: 'ettj_lastSelectedMethod',
  LAST_PARAMS: 'ettj_lastParameters',
};

export default function HomeScreen() {
  const router = useRouter();
  const { loadMethods, setWorkflowResult, setSelectedDate: setContextDate, loadData } = useApp();

  // Local state for form inputs
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<SmoothingMethod>('nelson_siegel_svensson');
  const [smoothingParameter, setSmoothingParameter] = useState(DEFAULT_SMOOTHING_PARAMETER);
  const [maxBusinessDays, setMaxBusinessDays] = useState<number | undefined>(undefined);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Preferences loaded state
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Workflow hook for API calls
  const {
    loading: isLoading,
    errorMessage: workflowError,
    data: workflowResult,
    executeWorkflow,
    reset: resetWorkflow,
  } = useWorkflow({
    onSuccess: (data) => {
      // Store result in context and navigate to chart
      setWorkflowResult(data);
      router.push({
        pathname: '/chart',
        params: {
          date: data.actual_date,
          method: data.method,
        },
      });
    },
  });

  // Load methods on mount
  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (preferencesLoaded) {
      savePreferences();
    }
  }, [selectedDate, selectedMethod, smoothingParameter, preferencesLoaded]);

  // Load user preferences from AsyncStorage
  const loadPreferences = async () => {
    try {
      const [dateStr, methodStr, paramsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_METHOD),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_PARAMS),
      ]);

      if (dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        if (!isNaN(date.getTime())) {
          const validation = validateDateRange(date);
          if (validation.isValid) {
            setSelectedDate(date);
          }
        }
      }

      if (methodStr && isValidMethod(methodStr)) {
        setSelectedMethod(methodStr as SmoothingMethod);
      }

      if (paramsStr) {
        try {
          const params = JSON.parse(paramsStr);
          if (typeof params.smoothingParameter === 'number') {
            setSmoothingParameter(params.smoothingParameter);
          }
          if (typeof params.maxBusinessDays === 'number') {
            setMaxBusinessDays(params.maxBusinessDays);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    } finally {
      setPreferencesLoaded(true);
    }
  };

  // Save user preferences to AsyncStorage
  const savePreferences = async () => {
    try {
      await Promise.all([
        selectedDate
          ? AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, formatDateISO(selectedDate))
          : AsyncStorage.removeItem(STORAGE_KEYS.LAST_DATE),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_METHOD, selectedMethod),
        AsyncStorage.setItem(
          STORAGE_KEYS.LAST_PARAMS,
          JSON.stringify({
            smoothingParameter,
            maxBusinessDays,
          })
        ),
      ]);
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  };

  // Validate all inputs
  const validateInputs = useCallback((): boolean => {
    const errors: string[] = [];

    // Validate date
    const dateValidation = validateDateRange(selectedDate);
    if (!dateValidation.isValid && dateValidation.error) {
      errors.push(dateValidation.error);
    }

    // Validate method
    const methodValidation = validateMethodSelection(selectedMethod);
    if (!methodValidation.isValid) {
      errors.push(...methodValidation.errors);
    }

    // Validate parameters
    const paramsValidation = validateParameters(selectedMethod, {
      smoothingParameter,
      maxBusinessDays,
    });
    if (!paramsValidation.isValid) {
      errors.push(...paramsValidation.errors);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [selectedDate, selectedMethod, smoothingParameter, maxBusinessDays]);

  // Handle calculate button press
  const handleCalculate = async () => {
    // Clear previous errors
    setValidationErrors([]);
    resetWorkflow();

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    // Execute workflow
    await executeWorkflow({
      date: selectedDate ? formatDateISO(selectedDate) : undefined,
      method: selectedMethod,
      smoothing_parameter: selectedMethod === 'smoothing_spline' ? smoothingParameter : undefined,
      max_business_days: maxBusinessDays,
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setValidationErrors([]);
  };

  // Handle method change
  const handleMethodChange = (method: SmoothingMethod) => {
    setSelectedMethod(method);
    setValidationErrors([]);
  };

  // Clear all errors
  const clearErrors = () => {
    setValidationErrors([]);
    resetWorkflow();
  };

  // Handle navigating to data screen
  const handleViewData = async () => {
    // Set the date in context and load data
    setContextDate(selectedDate);
    // Navigate to data screen - it will auto-load contracts
    router.push('/data');
  };

  // Check if form is valid
  const isFormValid = validationErrors.length === 0;

  // Combine all error messages
  const allErrors = [
    ...validationErrors,
    ...(workflowError ? [workflowError] : []),
  ];

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={isLoading}
        message="Calculando curva..."
        submessage={`Método: ${METHOD_DISPLAY_NAMES[selectedMethod]}`}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineMedium" style={styles.title}>
            ETTJ DI1
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Estrutura a Termo das Taxas de Juros
          </Text>
        </Surface>

        {/* Error Display */}
        {allErrors.length > 0 && (
          <ErrorMessage
            title={workflowError ? 'Erro na API' : 'Erro de Validação'}
            message={allErrors.join('\n')}
            onRetry={workflowError ? handleCalculate : undefined}
            onDismiss={clearErrors}
          />
        )}

        {/* Date Selection Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Data de Referência
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              Selecione a data para buscar os contratos DI1
            </Text>

            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              label="Data"
              placeholder="DD/MM/AAAA ou deixe vazio"
              disabled={isLoading}
            />

            <QuickDateButtons
              selectedDate={selectedDate}
              onDateSelect={handleDateChange}
              disabled={isLoading}
            />

            {!selectedDate && (
              <Text variant="labelSmall" style={styles.defaultDateNote}>
                Usando último dia útil disponível
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Method Selection Card */}
        <Card style={styles.card}>
          <Card.Content>
            <MethodSelector
              value={selectedMethod}
              onChange={handleMethodChange}
              disabled={isLoading}
            />

            <ParameterEditor
              method={selectedMethod}
              smoothingParameter={smoothingParameter}
              onSmoothingParameterChange={setSmoothingParameter}
              maxBusinessDays={maxBusinessDays}
              onMaxBusinessDaysChange={setMaxBusinessDays}
              disabled={isLoading}
            />
          </Card.Content>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.summaryTitle}>
              Resumo
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Data:
              </Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {selectedDate ? formatDateBR(selectedDate) : 'Último dia útil'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Método:
              </Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {METHOD_DISPLAY_NAMES[selectedMethod]}
              </Text>
            </View>
            {maxBusinessDays && (
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.summaryLabel}>
                  Prazo máximo:
                </Text>
                <Text variant="bodyMedium" style={styles.summaryValue}>
                  {maxBusinessDays} dias úteis
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCalculate}
            style={styles.primaryButton}
            icon="chart-line"
            loading={isLoading}
            disabled={isLoading}
          >
            Calcular Curva
          </Button>

          <Button
            mode="outlined"
            onPress={handleViewData}
            style={styles.secondaryButton}
            icon="database"
            disabled={isLoading}
          >
            Ver Dados Históricos
          </Button>
        </View>

        {/* Footer */}
        <Surface style={styles.footer} elevation={0}>
          <Text variant="bodySmall" style={styles.footerText}>
            Coppead/UFRJ - Ferramenta Educacional
          </Text>
        </Surface>
      </ScrollView>
    </View>
  );
}

// Helper to validate method string
function isValidMethod(method: string): method is SmoothingMethod {
  const validMethods: SmoothingMethod[] = [
    'linear',
    'cubic_spline',
    'akima',
    'pchip',
    'smoothing_spline',
    'nelson_siegel',
    'nelson_siegel_svensson',
  ];
  return validMethods.includes(method as SmoothingMethod);
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
    padding: 16,
    paddingBottom: 32,
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
  card: {
    marginVertical: 8,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  defaultDateNote: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  summaryCard: {
    marginVertical: 8,
    backgroundColor: '#E3F2FD',
  },
  summaryTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
  },
  summaryValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 6,
  },
  secondaryButton: {
    paddingVertical: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  footerText: {
    color: COLORS.textSecondary,
  },
});
