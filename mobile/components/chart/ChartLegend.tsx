/**
 * Chart legend component showing curve and original points indicators
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../../constants/config';

interface LegendItem {
  color: string;
  label: string;
  isDashed?: boolean;
}

interface ChartLegendProps {
  items?: LegendItem[];
}

const DEFAULT_ITEMS: LegendItem[] = [
  { color: COLORS.primary, label: 'Curva Suavizada' },
  { color: '#FF5722', label: 'Pontos Originais', isDashed: true },
];

export function ChartLegend({ items = DEFAULT_ITEMS }: ChartLegendProps) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: item.color },
              item.isDashed && styles.dashedIndicator,
            ]}
          />
          <Text variant="labelSmall" style={styles.label}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  dashedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: COLORS.textSecondary,
  },
});
