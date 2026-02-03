/**
 * Method information bar showing method name, type, and date
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { COLORS } from '../../constants/config';
import { METHOD_DISPLAY_NAMES, METHOD_CATEGORIES, METHOD_TO_CATEGORY } from '../../utils/validation';
import { SmoothingMethod } from '../../types';

interface MethodInfoBarProps {
  method: SmoothingMethod;
  methodName: string;
  methodType: string;
  date: string;
  contractsCount: number;
}

export function MethodInfoBar({
  method,
  methodName,
  methodType,
  date,
  contractsCount,
}: MethodInfoBarProps) {
  const displayName = METHOD_DISPLAY_NAMES[method] || methodName;
  const category = METHOD_TO_CATEGORY[method];
  const categoryName = METHOD_CATEGORIES[category] || methodType;

  // Format date to Brazilian format
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {displayName}
        </Text>
        <Chip
          mode="flat"
          compact
          style={styles.chip}
          textStyle={styles.chipText}
        >
          {categoryName}
        </Chip>
      </View>

      <View style={styles.infoRow}>
        <InfoItem icon="calendar" label="Data" value={formatDate(date)} />
        <InfoItem icon="chart-line" label="Contratos" value={`${contractsCount}`} />
      </View>
    </View>
  );
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <Text variant="labelSmall" style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 11,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    color: COLORS.textSecondary,
  },
  infoValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
});
