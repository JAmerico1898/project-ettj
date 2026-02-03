/**
 * Statistics card displaying curve metrics and statistics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { COLORS } from '../../constants/config';
import {
  ChartStats,
  formatMetricLabel,
  formatMetricValue,
  getPrimaryMetrics,
} from '../../utils/chartUtils';

interface StatisticsCardProps {
  stats: ChartStats;
  metrics: Record<string, number>;
}

export function StatisticsCard({ stats, metrics }: StatisticsCardProps) {
  const primaryMetrics = getPrimaryMetrics(metrics);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleSmall" style={styles.title}>
          Estatisticas
        </Text>

        {/* Rate Statistics */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Taxas
          </Text>
          <View style={styles.statsGrid}>
            <StatItem label="Minima" value={`${stats.minRate.toFixed(2)}%`} />
            <StatItem label="Maxima" value={`${stats.maxRate.toFixed(2)}%`} />
            <StatItem label="Media" value={`${stats.avgRate.toFixed(2)}%`} />
            <StatItem label="Amplitude" value={`${stats.range.toFixed(2)}%`} />
          </View>
        </View>

        {Object.keys(primaryMetrics).length > 0 && (
          <>
            <Divider style={styles.divider} />

            {/* Model Metrics */}
            <View style={styles.section}>
              <Text variant="labelMedium" style={styles.sectionTitle}>
                Metricas do Modelo
              </Text>
              <View style={styles.statsGrid}>
                {Object.entries(primaryMetrics).map(([key, value]) => (
                  <StatItem
                    key={key}
                    label={formatMetricLabel(key)}
                    value={formatMetricValue(key, value)}
                  />
                ))}
              </View>
            </View>
          </>
        )}
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
    marginVertical: 8,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  statValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
});
