/**
 * Sortable table for curve points
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { CurvePoint } from '../types';
import { SortConfig } from '../utils/tableUtils';

interface CurveTableProps {
  points: CurvePoint[];
  sortConfig: SortConfig<CurvePoint>;
  onSort: (key: keyof CurvePoint) => void;
}

export function CurveTable({ points, sortConfig, onSort }: CurveTableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <DataTable style={styles.table}>
        <DataTable.Header style={styles.header}>
          <SortableHeader
            label="DU"
            columnKey="business_days"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.duColumn}
            numeric
          />
          <SortableHeader
            label="Anos"
            columnKey="years"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.yearsColumn}
            numeric
          />
          <SortableHeader
            label="Taxa (%)"
            columnKey="rate_percent"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.rateColumn}
            numeric
          />
        </DataTable.Header>

        <ScrollView style={styles.body}>
          {points.map((point, index) => (
            <DataTable.Row key={`${point.business_days}-${index}`} style={styles.row}>
              <DataTable.Cell numeric style={styles.duColumn}>
                <Text style={styles.cellText}>{point.business_days}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.yearsColumn}>
                <Text style={styles.cellText}>{point.years.toFixed(2)}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.rateColumn}>
                <Text style={styles.rateText}>{point.rate_percent.toFixed(4)}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </ScrollView>
      </DataTable>
    </ScrollView>
  );
}

interface SortableHeaderProps {
  label: string;
  columnKey: keyof CurvePoint;
  sortConfig: SortConfig<CurvePoint>;
  onSort: (key: keyof CurvePoint) => void;
  style?: object;
  numeric?: boolean;
}

function SortableHeader({
  label,
  columnKey,
  sortConfig,
  onSort,
  style,
  numeric,
}: SortableHeaderProps) {
  const isActive = sortConfig.key === columnKey;
  const direction = isActive ? sortConfig.direction : null;

  const getSortIndicator = () => {
    if (!isActive || direction === null) return ' ';
    return direction === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <DataTable.Title
      numeric={numeric}
      style={style}
      onPress={() => onSort(columnKey)}
      sortDirection={
        isActive && direction
          ? direction === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
    >
      <Text style={[styles.headerText, isActive && styles.activeHeader]}>
        {label}
        {getSortIndicator()}
      </Text>
    </DataTable.Title>
  );
}

const styles = StyleSheet.create({
  table: {
    minWidth: 300,
  },
  header: {
    backgroundColor: '#f0f0f0',
  },
  body: {
    maxHeight: 300,
  },
  row: {
    backgroundColor: COLORS.surface,
  },
  duColumn: {
    width: 80,
  },
  yearsColumn: {
    width: 80,
  },
  rateColumn: {
    width: 100,
  },
  headerText: {
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  activeHeader: {
    color: COLORS.primary,
  },
  cellText: {
    color: COLORS.text,
    fontSize: 13,
  },
  rateText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
