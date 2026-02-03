/**
 * ParameterEditor component for configuring method-specific parameters
 * Includes smoothing parameter input for smoothing_spline method
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, IconButton } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { SmoothingMethod } from '../types';
import {
  methodHasParameters,
  DEFAULT_SMOOTHING_PARAMETER,
  SMOOTHING_PARAMETER_MIN,
  SMOOTHING_PARAMETER_MAX,
  validateParameters,
} from '../utils/validation';

interface ParameterEditorProps {
  method: SmoothingMethod;
  smoothingParameter: number;
  onSmoothingParameterChange: (value: number) => void;
  maxBusinessDays?: number;
  onMaxBusinessDaysChange?: (value: number | undefined) => void;
  disabled?: boolean;
}

export function ParameterEditor({
  method,
  smoothingParameter,
  onSmoothingParameterChange,
  maxBusinessDays,
  onMaxBusinessDaysChange,
  disabled = false,
}: ParameterEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(smoothingParameter.toString());
  const [maxDaysInput, setMaxDaysInput] = useState(maxBusinessDays?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  const hasParameters = methodHasParameters(method);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSmoothingChange = useCallback((text: string) => {
    setInputValue(text);
    setError(null);
  }, []);

  const handleSmoothingBlur = useCallback(() => {
    const numValue = parseFloat(inputValue);

    if (isNaN(numValue)) {
      setError('Valor inválido. Digite um número entre 0 e 1.');
      return;
    }

    const validation = validateParameters(method, { smoothingParameter: numValue });
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setError(null);
    onSmoothingParameterChange(numValue);
  }, [inputValue, method, onSmoothingParameterChange]);

  const handleMaxDaysChange = useCallback((text: string) => {
    setMaxDaysInput(text);
  }, []);

  const handleMaxDaysBlur = useCallback(() => {
    if (!maxDaysInput || !onMaxBusinessDaysChange) {
      onMaxBusinessDaysChange?.(undefined);
      return;
    }

    const numValue = parseInt(maxDaysInput, 10);

    if (isNaN(numValue) || numValue < 1) {
      setMaxDaysInput('');
      onMaxBusinessDaysChange?.(undefined);
      return;
    }

    onMaxBusinessDaysChange(numValue);
  }, [maxDaysInput, onMaxBusinessDaysChange]);

  const handleResetDefaults = useCallback(() => {
    setInputValue(DEFAULT_SMOOTHING_PARAMETER.toString());
    onSmoothingParameterChange(DEFAULT_SMOOTHING_PARAMETER);
    setMaxDaysInput('');
    onMaxBusinessDaysChange?.(undefined);
    setError(null);
  }, [onSmoothingParameterChange, onMaxBusinessDaysChange]);

  // Don't render anything if method has no parameters and we're collapsed
  if (!hasParameters && !isExpanded) {
    return (
      <View style={styles.collapsedContainer}>
        <Button
          mode="text"
          icon="cog"
          onPress={toggleExpanded}
          compact
          style={styles.advancedButton}
          labelStyle={styles.advancedButtonLabel}
        >
          Configurações avançadas
        </Button>
      </View>
    );
  }

  return (
    <Card style={styles.container} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleSmall" style={styles.title}>
            Parâmetros
          </Text>
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            onPress={toggleExpanded}
          />
        </View>

        {(isExpanded || hasParameters) && (
          <View style={styles.content}>
            {/* Smoothing Parameter - only for smoothing_spline */}
            {method === 'smoothing_spline' && (
              <View style={styles.parameterRow}>
                <Text variant="labelMedium" style={styles.paramLabel}>
                  Parâmetro de Suavização
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={inputValue}
                    onChangeText={handleSmoothingChange}
                    onBlur={handleSmoothingBlur}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                    disabled={disabled}
                    style={styles.input}
                    error={!!error}
                  />
                </View>
                <HelperText type={error ? 'error' : 'info'} visible={true}>
                  {error || `Valor entre ${SMOOTHING_PARAMETER_MIN} (mais suave) e ${SMOOTHING_PARAMETER_MAX} (mais ajustado)`}
                </HelperText>
              </View>
            )}

            {/* Max Business Days - always available in expanded mode */}
            {isExpanded && (
              <View style={styles.parameterRow}>
                <Text variant="labelMedium" style={styles.paramLabel}>
                  Prazo Máximo (dias úteis)
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={maxDaysInput}
                    onChangeText={handleMaxDaysChange}
                    onBlur={handleMaxDaysBlur}
                    keyboardType="number-pad"
                    mode="outlined"
                    dense
                    disabled={disabled}
                    placeholder="1260 (5 anos)"
                    style={styles.input}
                  />
                </View>
                <HelperText type="info" visible={true}>
                  Deixe vazio para usar padrão (1260 dias = 5 anos)
                </HelperText>
              </View>
            )}

            {/* Reset Button */}
            <Button
              mode="text"
              icon="refresh"
              onPress={handleResetDefaults}
              disabled={disabled}
              compact
              style={styles.resetButton}
              labelStyle={styles.resetButtonLabel}
            >
              Restaurar padrões
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: '#FAFAFA',
  },
  collapsedContainer: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -8,
  },
  title: {
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    marginTop: 8,
  },
  advancedButton: {
    alignSelf: 'flex-start',
  },
  advancedButtonLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  parameterRow: {
    marginBottom: 8,
  },
  paramLabel: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputContainer: {
    maxWidth: 150,
  },
  input: {
    backgroundColor: '#fff',
    height: 44,
  },
  resetButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  resetButtonLabel: {
    fontSize: 12,
  },
});

export default ParameterEditor;
