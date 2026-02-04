/**
 * Sortable table for DI1 contracts
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { DI1Contract } from '../types';
import { SortConfig, SortDirection, getNextSortDirection } from '../utils/tableUtils';

interface ContractsTableProps {
  contracts: DI1Contract[];
  sortConfig: SortConfig<DI1Contract>;
  onSort: (key: keyof DI1Contract) => void;
  onRowPress?: (contract: DI1Contract) => void;
  selectedContract?: DI1Contract | null;
}

function ContractsTableComponent({
  contracts,
  sortConfig,
  onSort,
  onRowPress,
  selectedContract,
}: ContractsTableProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getSortIcon = (key: keyof DI1Contract): string | undefined => {
    if (sortConfig.key !== key) return 'sort';
    if (sortConfig.direction === 'asc') return 'sort-ascending';
    if (sortConfig.direction === 'desc') return 'sort-descending';
    return 'sort';
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <DataTable style={styles.table}>
        <DataTable.Header style={styles.header}>
          <SortableHeader
            label="Contrato"
            columnKey="ticker"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.tickerColumn}
          />
          <SortableHeader
            label="Vencimento"
            columnKey="maturity_date"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.dateColumn}
            numeric
          />
          <SortableHeader
            label="DU"
            columnKey="business_days"
            sortConfig={sortConfig}
            onSort={onSort}
            style={styles.duColumn}
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
          {contracts.map((contract) => {
            const isSelected = selectedContract?.ticker === contract.ticker;
            return (
              <TouchableOpacity
                key={contract.ticker}
                onPress={() => onRowPress?.(contract)}
                activeOpacity={0.7}
              >
                <DataTable.Row
                  style={[styles.row, isSelected && styles.selectedRow]}
                >
                  <DataTable.Cell style={styles.tickerColumn}>
                    <Text style={[styles.tickerText, isSelected && styles.selectedText]}>
                      {contract.ticker}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.dateColumn}>
                    <Text style={[styles.cellText, isSelected && styles.selectedText]}>
                      {formatDate(contract.maturity_date)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.duColumn}>
                    <Text style={[styles.cellText, isSelected && styles.selectedText]}>
                      {contract.business_days}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.rateColumn}>
                    <Text style={[styles.rateText, isSelected && styles.selectedText]}>
                      {contract.rate_percent.toFixed(2)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </DataTable>
    </ScrollView>
  );
}

interface SortableHeaderProps {
  label: string;
  columnKey: keyof DI1Contract;
  sortConfig: SortConfig<DI1Contract>;
  onSort: (key: keyof DI1Contract) => void;
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

// Memoized component to prevent unnecessary re-renders
export const ContractsTable = memo(ContractsTableComponent, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.contracts === nextProps.contracts &&
    prevProps.sortConfig.key === nextProps.sortConfig.key &&
    prevProps.sortConfig.direction === nextProps.sortConfig.direction &&
    prevProps.selectedContract?.ticker === nextProps.selectedContract?.ticker
  );
});

const styles = StyleSheet.create({
  table: {
    minWidth: 400,
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
  selectedRow: {
    backgroundColor: `${COLORS.primary}20`,
  },
  tickerColumn: {
    width: 100,
  },
  dateColumn: {
    width: 100,
  },
  duColumn: {
    width: 70,
  },
  rateColumn: {
    width: 90,
  },
  headerText: {
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  activeHeader: {
    color: COLORS.primary,
  },
  tickerText: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 13,
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
  selectedText: {
    color: COLORS.primary,
  },
});
