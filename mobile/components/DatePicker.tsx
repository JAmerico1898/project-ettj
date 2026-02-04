/**
 * DatePicker component with Brazilian format (DD/MM/YYYY)
 * Supports native DateTimePicker on mobile and text input on web
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { TextInput, Text, HelperText, IconButton } from 'react-native-paper';
import { COLORS } from '../constants/config';
import {
  formatDateBR,
  parseDateBR,
  validateDateRange,
  formatDateISO,
} from '../utils/dateUtils';

// Conditionally import DateTimePicker only for native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  label = 'Data',
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  showClearButton = true,
  maxDate,
  minDate,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [textValue, setTextValue] = useState(value ? formatDateBR(value) : '');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync textValue with value prop
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value ? formatDateBR(value) : '');
    }
  }, [value, isFocused]);

  const handleNativeDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      // On Android, the picker closes automatically
      // On iOS, we keep it open until user dismisses
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }

      if (selectedDate) {
        const validation = validateDateRange(selectedDate);
        if (validation.isValid) {
          setError(null);
          setTextValue(formatDateBR(selectedDate));
          onChange(selectedDate);
        } else {
          setError(validation.error);
        }
      }
    },
    [onChange]
  );

  const handleTextChange = useCallback((text: string) => {
    // Allow typing while formatting
    setTextValue(text);

    // Auto-format as user types
    const digitsOnly = text.replace(/\D/g, '');
    let formatted = '';

    if (digitsOnly.length > 0) {
      formatted = digitsOnly.slice(0, 2);
    }
    if (digitsOnly.length >= 3) {
      formatted += '/' + digitsOnly.slice(2, 4);
    }
    if (digitsOnly.length >= 5) {
      formatted += '/' + digitsOnly.slice(4, 8);
    }

    if (formatted !== text && formatted.length > text.length) {
      setTextValue(formatted);
    }
  }, []);

  const handleTextBlur = useCallback(() => {
    setIsFocused(false);

    if (!textValue) {
      setError(null);
      onChange(null);
      return;
    }

    const parsed = parseDateBR(textValue);

    if (!parsed) {
      setError('Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    const validation = validateDateRange(parsed);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setTextValue(formatDateBR(parsed));
    onChange(parsed);
  }, [textValue, onChange]);

  const handleClear = useCallback(() => {
    setTextValue('');
    setError(null);
    onChange(null);
  }, [onChange]);

  const openPicker = useCallback(() => {
    if (!disabled) {
      setShowPicker(true);
    }
  }, [disabled]);

  const closePicker = useCallback(() => {
    setShowPicker(false);
  }, []);

  // Determine the date to show in the picker
  const pickerDate = value || new Date();

  // Calculate max/min dates with fallbacks
  const effectiveMaxDate = maxDate || new Date();
  const effectiveMinDate = minDate || (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 10);
    return date;
  })();

  // Render native picker for mobile platforms
  const renderNativePicker = () => {
    if (Platform.OS === 'web' || !DateTimePicker) {
      return null;
    }

    if (!showPicker) {
      return null;
    }

    return (
      <DateTimePicker
        value={pickerDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handleNativeDateChange}
        maximumDate={effectiveMaxDate}
        minimumDate={effectiveMinDate}
      />
    );
  };

  // Web-specific date input
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text variant="labelMedium" style={styles.label}>
          {label}
        </Text>
        <View style={styles.webInputContainer}>
          <input
            type="date"
            value={value ? formatDateISO(value) : ''}
            onChange={(e) => {
              const dateStr = e.target.value;
              if (dateStr) {
                const date = new Date(dateStr + 'T12:00:00');
                if (!isNaN(date.getTime())) {
                  const validation = validateDateRange(date);
                  if (validation.isValid) {
                    setError(null);
                    onChange(date);
                  } else {
                    setError(validation.error);
                  }
                }
              } else {
                setError(null);
                onChange(null);
              }
            }}
            max={formatDateISO(effectiveMaxDate)}
            min={formatDateISO(effectiveMinDate)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              borderRadius: 4,
              border: `1px solid ${error ? COLORS.error : COLORS.primary}`,
              backgroundColor: disabled ? '#f0f0f0' : '#fff',
            }}
          />
          {showClearButton && value && (
            <IconButton
              icon="close"
              size={20}
              onPress={handleClear}
              style={styles.clearButton}
            />
          )}
        </View>
        {error && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}
      </View>
    );
  }

  // Native mobile UI
  return (
    <View style={styles.container} accessibilityRole="none">
      <View style={styles.inputRow}>
        <Pressable
          style={styles.inputWrapper}
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Selecionar ${label}`}
          accessibilityHint="Toque para abrir o seletor de data"
        >
          <TextInput
            label={label}
            value={textValue}
            onChangeText={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleTextBlur}
            placeholder={placeholder}
            keyboardType="numeric"
            maxLength={10}
            disabled={disabled}
            error={!!error}
            mode="outlined"
            accessibilityLabel={`Campo de data ${label}`}
            accessibilityHint="Digite a data no formato dia barra mes barra ano"
            right={
              <TextInput.Icon
                icon="calendar"
                onPress={openPicker}
                disabled={disabled}
                accessibilityLabel="Abrir calendario"
              />
            }
            style={styles.input}
          />
        </Pressable>
        {showClearButton && value && (
          <IconButton
            icon="close-circle"
            size={24}
            onPress={handleClear}
            style={styles.clearIconButton}
            accessibilityLabel="Limpar data"
            accessibilityHint="Toque para remover a data selecionada"
          />
        )}
      </View>
      {error && (
        <HelperText type="error" visible={true} style={styles.errorText}>
          {error}
        </HelperText>
      )}
      {renderNativePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
  },
  clearIconButton: {
    marginLeft: -8,
  },
  clearButton: {
    marginLeft: 4,
  },
  errorText: {
    marginTop: -4,
  },
  webInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DatePicker;
