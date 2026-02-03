/**
 * Quick date selection buttons for common date choices
 * Provides shortcuts for: Today, Yesterday, Last Week
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { COLORS } from '../constants/config';
import {
  getTodayOrLastBusinessDay,
  getPreviousBusinessDay,
  getLastWeek,
  getLastBusinessDayOnOrBefore,
  isWeekend,
  formatDateBR,
} from '../utils/dateUtils';

interface QuickDateButtonsProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  disabled?: boolean;
  showLabels?: boolean;
}

export function QuickDateButtons({
  onDateSelect,
  selectedDate,
  disabled = false,
  showLabels = true,
}: QuickDateButtonsProps) {
  const handleToday = useCallback(() => {
    const date = getTodayOrLastBusinessDay();
    onDateSelect(date);
  }, [onDateSelect]);

  const handleYesterday = useCallback(() => {
    const today = getTodayOrLastBusinessDay();
    const yesterday = getPreviousBusinessDay(today);
    onDateSelect(yesterday);
  }, [onDateSelect]);

  const handleLastWeek = useCallback(() => {
    const lastWeek = getLastWeek();
    // Ensure it's a business day
    const businessDay = getLastBusinessDayOnOrBefore(lastWeek);
    onDateSelect(businessDay);
  }, [onDateSelect]);

  // Check if a button date matches the selected date
  const isSelected = (buttonDate: Date): boolean => {
    if (!selectedDate) return false;
    return (
      buttonDate.getFullYear() === selectedDate.getFullYear() &&
      buttonDate.getMonth() === selectedDate.getMonth() &&
      buttonDate.getDate() === selectedDate.getDate()
    );
  };

  const todayDate = getTodayOrLastBusinessDay();
  const yesterdayDate = getPreviousBusinessDay(todayDate);
  const lastWeekDate = getLastBusinessDayOnOrBefore(getLastWeek());

  return (
    <View style={styles.container}>
      {showLabels && (
        <Text variant="labelSmall" style={styles.label}>
          Atalhos:
        </Text>
      )}
      <View style={styles.buttonRow}>
        <Button
          mode={isSelected(todayDate) ? 'contained' : 'outlined'}
          onPress={handleToday}
          disabled={disabled}
          compact
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Hoje
        </Button>
        <Button
          mode={isSelected(yesterdayDate) ? 'contained' : 'outlined'}
          onPress={handleYesterday}
          disabled={disabled}
          compact
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Ontem
        </Button>
        <Button
          mode={isSelected(lastWeekDate) ? 'contained' : 'outlined'}
          onPress={handleLastWeek}
          disabled={disabled}
          compact
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Semana Passada
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 12,
  },
});

export default QuickDateButtons;
