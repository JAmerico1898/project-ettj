/**
 * Summary statistics card for table data
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { COLORS } from '../constants/config';

export interface TableStats {
  count: number;
  minRate?: number;
  maxRate?: number;
  avgRate?: number;
}

interface TableSummaryProps {
  stats: TableStats;
  title?: string;
}

export function TableSummary({ stats, title = 'Resumo' }: TableSummaryProps) {
  const hasRateStats =
    stats.minRate !== undefined &&
    stats.maxRate !== undefined &&
    stats.avgRate !== undefined;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleSmall" style={styles.title}>
          {title}
        </Text>

        <View style={styles.statsRow}>
          <StatItem label="Total" value={String(stats.count)} />
          {hasRateStats && (
            <>
              <StatItem label="Min" value={`${stats.minRate!.toFixed(2)}%`} />
              <StatItem label="Max" value={`${stats.maxRate!.toFixed(2)}%`} />
              <StatItem label="Media" value={`${stats.avgRate!.toFixed(2)}%`} />
            </>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text variant="labelSmall" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  statValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
});
