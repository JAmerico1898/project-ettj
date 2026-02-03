# Feature 8: Data Table Screen - Contract Details and Curve Data Display

## Overview
Build a comprehensive data table screen that displays detailed information about DI1 contracts and calculated curve points in a tabular format. This screen allows users to explore the raw data, search, filter, sort, and export the information.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 5** completed (API client)
- **Feature 6** completed (home screen)
- **Feature 7** completed (chart screen)
- Navigation configured

---

## Objectives
- Display DI1 contracts in sortable table
- Show curve points in separate table
- Toggle between contract data and curve data
- Search/filter functionality
- Sort by any column
- Pagination for large datasets
- Export to CSV/Excel
- Copy individual values to clipboard
- Show detailed contract information
- Display calculation metadata
- Support both portrait and landscape orientations
- Responsive table design
- Highlight/select rows for comparison

---

## Screen Design

### Layout Structure
```
┌─────────────────────────────────┐
│ ← Dados dos Contratos           │ Header
├─────────────────────────────────┤
│                                 │
│ [Contratos DI1] [Curva Calc.]   │ Tab Selector
│                                 │
│ 🔍 [Buscar...]        [📊][📤]  │ Search & Actions
│                                 │
│ ┌──────────────────────────┐   │
│ │ Código │ Venc. │ Taxa    │   │ Table Header
│ ├────────┼───────┼─────────┤   │
│ │ DI1F25 │ 03/03 │ 10.25%↑│   │ Table Rows
│ │ DI1G25 │ 01/04 │ 10.50% │   │ (Scrollable)
│ │ DI1H25 │ 02/05 │ 10.65% │   │
│ │ ...    │ ...   │ ...    │   │
│ └──────────────────────────┘   │
│                                 │
│ Mostrando 1-20 de 60            │ Pagination Info
│ [< Anterior] [1][2][3] [Próx>] │ Pagination
│                                 │
│ 📋 Resumo:                      │ Summary Stats
│ Min: 10.25% | Máx: 11.35%      │
│ Média: 10.87% | Contratos: 60   │
│                                 │
├─────────────────────────────────┤
│ [📤 Exportar CSV] [📋 Copiar]   │ Action Buttons
└─────────────────────────────────┘
```

---

## Implementation

### File Structure
```
mobile/
├── app/
│   └── data.tsx               # Data screen (NEW)
├── components/
│   ├── DataTable.tsx          # Generic table component (NEW)
│   ├── ContractsTable.tsx     # DI1 contracts table (NEW)
│   ├── CurveTable.tsx         # Curve points table (NEW)
│   ├── TableSearch.tsx        # Search component (NEW)
│   ├── TablePagination.tsx    # Pagination controls (NEW)
│   └── TableSummary.tsx       # Summary statistics (NEW)
├── utils/
│   ├── tableUtils.ts          # Table utilities (NEW)
│   └── clipboardUtils.ts      # Clipboard utilities (NEW)
└── styles/
    └── dataScreen.ts          # Screen styles (NEW)
```

---

## Code Implementation

### `mobile/utils/tableUtils.ts` (NEW FILE)
```typescript
/**
 * Table utilities for sorting, filtering, and pagination
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

export function sortData<T extends Record<string, any>>(
  data: T[],
  sortConfig: SortConfig
): T[] {
  if (!sortConfig.direction) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // Handle null/undefined
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Numeric comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    }

    // String comparison
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (sortConfig.direction === 'asc') {
      return aString.localeCompare(bString, 'pt-BR');
    } else {
      return bString.localeCompare(aString, 'pt-BR');
    }
  });
}

export function filterData<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchableKeys: string[]
): T[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const lowerSearch = searchTerm.toLowerCase();

  return data.filter(item => {
    return searchableKeys.some(key => {
      const value = item[key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    });
  });
}

export function paginateData<T>(
  data: T[],
  config: PaginationConfig
): T[] {
  const startIndex = config.page * config.itemsPerPage;
  const endIndex = startIndex + config.itemsPerPage;
  return data.slice(startIndex, endIndex);
}

export function getTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}

export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let startPage = Math.max(0, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(0, endPage - maxVisible + 1);
  }

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (value: any, row: T) => string;
}

export function formatValue<T>(
  value: any,
  column: TableColumn<T>,
  row: T
): string {
  if (column.format) {
    return column.format(value, row);
  }

  if (value == null) {
    return '-';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }

  return String(value);
}
```

### `mobile/utils/clipboardUtils.ts` (NEW FILE)
```typescript
/**
 * Clipboard utilities
 */
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
    Alert.alert('Sucesso', 'Texto copiado para a área de transferência');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    Alert.alert('Erro', 'Não foi possível copiar o texto');
  }
}

export async function copyTableToClipboard(
  data: any[],
  columns: string[]
): Promise<void> {
  try {
    // Format as TSV (Tab-Separated Values)
    const header = columns.join('\t');
    const rows = data.map(row => 
      columns.map(col => row[col] ?? '').join('\t')
    );
    const tsv = [header, ...rows].join('\n');

    await Clipboard.setStringAsync(tsv);
    Alert.alert('Sucesso', `${data.length} linhas copiadas`);
  } catch (error) {
    console.error('Error copying table:', error);
    Alert.alert('Erro', 'Não foi possível copiar a tabela');
  }
}
```

### `mobile/components/DataTable.tsx` (NEW FILE)
```typescript
/**
 * Generic data table component with sorting
 */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, DataTable as PaperDataTable } from 'react-native-paper';
import type { TableColumn, SortConfig, SortDirection } from '@/utils/tableUtils';
import { formatValue } from '@/utils/tableUtils';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onRowPress?: (row: T) => void;
  selectedRow?: T;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  sortConfig,
  onSort,
  onRowPress,
  selectedRow,
}: DataTableProps<T>) {
  const getSortIcon = (columnKey: string): string | null => {
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  return (
    <ScrollView horizontal style={styles.horizontalScroll}>
      <PaperDataTable style={styles.table}>
        {/* Header */}
        <PaperDataTable.Header>
          {columns.map(column => (
            <PaperDataTable.Title
              key={String(column.key)}
              style={[
                styles.headerCell,
                column.width && { width: column.width },
              ]}
              sortDirection={
                sortConfig.key === column.key
                  ? sortConfig.direction || undefined
                  : undefined
              }
              onPress={
                column.sortable !== false
                  ? () => onSort(String(column.key))
                  : undefined
              }
              numeric={column.align === 'right'}
            >
              <Text variant="labelMedium" style={styles.headerText}>
                {column.label}
              </Text>
            </PaperDataTable.Title>
          ))}
        </PaperDataTable.Header>

        {/* Rows */}
        <ScrollView style={styles.verticalScroll}>
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Nenhum dado disponível
              </Text>
            </View>
          ) : (
            data.map((row, index) => {
              const isSelected = selectedRow === row;
              return (
                <PaperDataTable.Row
                  key={index}
                  onPress={onRowPress ? () => onRowPress(row) : undefined}
                  style={[
                    styles.row,
                    isSelected && styles.selectedRow,
                  ]}
                >
                  {columns.map(column => (
                    <PaperDataTable.Cell
                      key={String(column.key)}
                      style={[
                        styles.cell,
                        column.width && { width: column.width },
                      ]}
                      numeric={column.align === 'right'}
                    >
                      <Text variant="bodyMedium" style={styles.cellText}>
                        {formatValue(row[column.key], column, row)}
                      </Text>
                    </PaperDataTable.Cell>
                  ))}
                </PaperDataTable.Row>
              );
            })
          )}
        </ScrollView>
      </PaperDataTable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    maxHeight: 500,
  },
  table: {
    backgroundColor: 'white',
  },
  headerCell: {
    minWidth: 100,
  },
  headerText: {
    fontWeight: 'bold',
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedRow: {
    backgroundColor: '#E8DEF8',
  },
  cell: {
    minWidth: 100,
  },
  cellText: {
    fontSize: 13,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});
```

### `mobile/components/ContractsTable.tsx` (NEW FILE)
```typescript
/**
 * DI1 Contracts table component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable } from './DataTable';
import type { DI1Contract } from '@/types/api';
import type { TableColumn, SortConfig } from '@/utils/tableUtils';

interface ContractsTableProps {
  contracts: DI1Contract[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onRowPress?: (contract: DI1Contract) => void;
  selectedContract?: DI1Contract;
}

export function ContractsTable({
  contracts,
  sortConfig,
  onSort,
  onRowPress,
  selectedContract,
}: ContractsTableProps) {
  const columns: TableColumn<DI1Contract>[] = [
    {
      key: 'code',
      label: 'Código',
      width: 100,
      align: 'left',
      sortable: true,
    },
    {
      key: 'expiry_date',
      label: 'Vencimento',
      width: 120,
      align: 'center',
      sortable: true,
      format: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      key: 'business_days',
      label: 'Dias Úteis',
      width: 110,
      align: 'right',
      sortable: true,
    },
    {
      key: 'years',
      label: 'Anos',
      width: 100,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(2),
    },
    {
      key: 'rate_percent',
      label: 'Taxa (%)',
      width: 100,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(2) + '%',
    },
    {
      key: 'rate',
      label: 'Taxa (Decimal)',
      width: 130,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(6),
    },
  ];

  return (
    <DataTable
      data={contracts}
      columns={columns}
      sortConfig={sortConfig}
      onSort={onSort}
      onRowPress={onRowPress}
      selectedRow={selectedContract}
    />
  );
}
```

### `mobile/components/CurveTable.tsx` (NEW FILE)
```typescript
/**
 * Curve points table component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable } from './DataTable';
import type { CurvePoint } from '@/types/api';
import type { TableColumn, SortConfig } from '@/utils/tableUtils';

interface CurveTableProps {
  points: CurvePoint[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export function CurveTable({
  points,
  sortConfig,
  onSort,
}: CurveTableProps) {
  const columns: TableColumn<CurvePoint>[] = [
    {
      key: 'business_days',
      label: 'Dias Úteis',
      width: 110,
      align: 'right',
      sortable: true,
    },
    {
      key: 'years',
      label: 'Anos',
      width: 100,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(4),
    },
    {
      key: 'rate_percent',
      label: 'Taxa (%)',
      width: 100,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(4) + '%',
    },
    {
      key: 'rate',
      label: 'Taxa (Decimal)',
      width: 130,
      align: 'right',
      sortable: true,
      format: (value) => value.toFixed(6),
    },
  ];

  return (
    <DataTable
      data={points}
      columns={columns}
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
}
```

### `mobile/components/TableSearch.tsx` (NEW FILE)
```typescript
/**
 * Table search component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, IconButton } from 'react-native-paper';

interface TableSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function TableSearch({
  value,
  onChangeText,
  onClear,
  placeholder = 'Buscar...',
}: TableSearchProps) {
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.searchbar}
        inputStyle={styles.input}
        icon="magnify"
        clearIcon={value ? 'close' : undefined}
        onClearIconPress={onClear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  input: {
    fontSize: 14,
  },
});
```

### `mobile/components/TablePagination.tsx` (NEW FILE)
```typescript
/**
 * Table pagination component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { getPageNumbers, getTotalPages } from '@/utils/tableUtils';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = getTotalPages(totalItems, itemsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" style={styles.info}>
        Mostrando {startItem}-{endItem} de {totalItems}
      </Text>

      <View style={styles.controls}>
        <IconButton
          icon="chevron-left"
          size={20}
          disabled={currentPage === 0}
          onPress={() => onPageChange(currentPage - 1)}
        />

        {pageNumbers.map(pageNum => (
          <Button
            key={pageNum}
            mode={pageNum === currentPage ? 'contained' : 'text'}
            compact
            onPress={() => onPageChange(pageNum)}
            style={styles.pageButton}
          >
            {pageNum + 1}
          </Button>
        ))}

        <IconButton
          icon="chevron-right"
          size={20}
          disabled={currentPage === totalPages - 1}
          onPress={() => onPageChange(currentPage + 1)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  info: {
    opacity: 0.7,
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    minWidth: 40,
  },
});
```

### `mobile/components/TableSummary.tsx` (NEW FILE)
```typescript
/**
 * Table summary statistics component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface TableSummaryProps {
  stats: {
    count: number;
    minRate?: number;
    maxRate?: number;
    avgRate?: number;
  };
}

export function TableSummary({ stats }: TableSummaryProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="labelMedium" style={styles.title}>
          📋 Resumo
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {stats.count}
            </Text>
          </View>

          {stats.minRate !== undefined && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Mínima
              </Text>
              <Text variant="bodyLarge" style={styles.statValue}>
                {stats.minRate.toFixed(2)}%
              </Text>
            </View>
          )}

          {stats.maxRate !== undefined && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Máxima
              </Text>
              <Text variant="bodyLarge" style={styles.statValue}>
                {stats.maxRate.toFixed(2)}%
              </Text>
            </View>
          )}

          {stats.avgRate !== undefined && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Média
              </Text>
              <Text variant="bodyLarge" style={styles.statValue}>
                {stats.avgRate.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    backgroundColor: '#F3E5F5',
  },
  title: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
});
```

### `mobile/app/data.tsx` (COMPLETE FILE)
```typescript
/**
 * Data Screen - Detailed table view
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Appbar, SegmentedButtons, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ContractsTable } from '@/components/ContractsTable';
import { CurveTable } from '@/components/CurveTable';
import { TableSearch } from '@/components/TableSearch';
import { TablePagination } from '@/components/TablePagination';
import { TableSummary } from '@/components/TableSummary';
import { LoadingOverlay } from '@/components/LoadingOverlay';

import {
  sortData,
  filterData,
  paginateData,
  type SortConfig,
  type SortDirection,
} from '@/utils/tableUtils';
import { copyTableToClipboard } from '@/utils/clipboardUtils';
import { exportDataAsCSV } from '@/utils/exportUtils';
import type { WorkflowResponse, DI1Contract, CurvePoint } from '@/types/api';

type ViewMode = 'contracts' | 'curve';

export default function DataScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse workflow data
  const workflowData: WorkflowResponse | null = params.data
    ? JSON.parse(params.data as string)
    : null;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'business_days',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(20);
  const [selectedContract, setSelectedContract] = useState<DI1Contract | null>(null);
  const [exporting, setExporting] = useState(false);

  // Get current data based on view mode
  const currentData = useMemo(() => {
    return viewMode === 'contracts'
      ? workflowData?.original_points || []
      : workflowData?.curve_points || [];
  }, [viewMode, workflowData]);

  // Search/filter data
  const searchableKeys = viewMode === 'contracts'
    ? ['code', 'expiry_date']
    : [];

  const filteredData = useMemo(() => {
    return filterData(currentData, searchTerm, searchableKeys);
  }, [currentData, searchTerm, searchableKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    return sortData(filteredData, sortConfig);
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    return paginateData(sortedData, {
      page: currentPage,
      itemsPerPage,
      totalItems: sortedData.length,
    });
  }, [sortedData, currentPage, itemsPerPage]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (sortedData.length === 0) {
      return { count: 0 };
    }

    const rates = sortedData.map((d: any) => d.rate_percent);
    return {
      count: sortedData.length,
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      avgRate: rates.reduce((sum, r) => sum + r, 0) / rates.length,
    };
  }, [sortedData]);

  // Handlers
  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
    setCurrentPage(0);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as ViewMode);
    setSearchTerm('');
    setCurrentPage(0);
    setSelectedContract(null);
  };

  const handleCopyTable = async () => {
    try {
      const columns = viewMode === 'contracts'
        ? ['code', 'expiry_date', 'business_days', 'years', 'rate_percent', 'rate']
        : ['business_days', 'years', 'rate_percent', 'rate'];

      await copyTableToClipboard(paginatedData, columns);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar a tabela');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      if (viewMode === 'contracts' && workflowData) {
        await exportDataAsCSV(
          workflowData.original_points,
          [],
          `contratos-di1-${workflowData.reference_date}.csv`
        );
      } else if (workflowData) {
        await exportDataAsCSV(
          [],
          workflowData.curve_points,
          `curva-calculada-${workflowData.reference_date}.csv`
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar os dados');
    } finally {
      setExporting(false);
    }
  };

  const handleRowPress = (contract: DI1Contract) => {
    setSelectedContract(
      selectedContract === contract ? null : contract
    );
  };

  if (!workflowData) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Dados" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text>Nenhum dado disponível</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Voltar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Dados dos Contratos" />
        <Appbar.Action icon="chart-line" onPress={() => router.back()} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* View Mode Selector */}
        <SegmentedButtons
          value={viewMode}
          onValueChange={handleViewModeChange}
          buttons={[
            {
              value: 'contracts',
              label: `Contratos DI1 (${workflowData.original_points.length})`,
              icon: 'file-document',
            },
            {
              value: 'curve',
              label: `Curva Calculada (${workflowData.curve_points.length})`,
              icon: 'chart-bell-curve',
            },
          ]}
          style={styles.segmented}
        />

        {/* Search (only for contracts) */}
        {viewMode === 'contracts' && (
          <TableSearch
            value={searchTerm}
            onChangeText={handleSearch}
            onClear={() => handleSearch('')}
            placeholder="Buscar por código ou vencimento..."
          />
        )}

        {/* Summary Statistics */}
        <TableSummary stats={stats} />

        <Divider style={styles.divider} />

        {/* Table */}
        {viewMode === 'contracts' ? (
          <ContractsTable
            contracts={paginatedData as DI1Contract[]}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowPress={handleRowPress}
            selectedContract={selectedContract}
          />
        ) : (
          <CurveTable
            points={paginatedData as CurvePoint[]}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={sortedData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />

        <Divider style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleExport}
            icon="download"
            style={styles.actionButton}
            disabled={exporting}
          >
            Exportar CSV
          </Button>

          <Button
            mode="outlined"
            onPress={handleCopyTable}
            icon="content-copy"
            style={styles.actionButton}
          >
            Copiar Página
          </Button>
        </View>

        {/* Selected Contract Details */}
        {selectedContract && (
          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.detailsTitle}>
                Detalhes do Contrato
              </Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Código
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedContract.code}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Vencimento
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {new Date(selectedContract.expiry_date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Dias Úteis
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedContract.business_days}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Anos
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedContract.years.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Taxa (%)
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedContract.rate_percent.toFixed(4)}%
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Taxa (Decimal)
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {selectedContract.rate.toFixed(6)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <LoadingOverlay visible={exporting} message="Exportando dados..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  detailsCard: {
    marginTop: 16,
    backgroundColor: '#E8DEF8',
  },
  detailsTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
});
```

### Update `mobile/package.json` (ADD DEPENDENCY)
```json
{
  "dependencies": {
    "expo-clipboard": "~6.0.3"
  }
}
```

---

## Testing

### Manual Testing Checklist

```markdown
# Data Table Testing Checklist

## View Modes
- [ ] Switch between Contracts and Curve views
- [ ] Contract count displayed correctly
- [ ] Curve points count displayed correctly
- [ ] Data updates when switching views

## Contracts Table
- [ ] All columns display correctly
- [ ] Contract codes visible
- [ ] Expiry dates formatted correctly (DD/MM/YYYY)
- [ ] Business days shown
- [ ] Years displayed with 2 decimals
- [ ] Rates shown in both formats
- [ ] Sort by code works
- [ ] Sort by date works
- [ ] Sort by business days works
- [ ] Sort by rate works
- [ ] Sort direction indicators correct

## Curve Table
- [ ] All columns display correctly
- [ ] Business days shown
- [ ] Years displayed with 4 decimals
- [ ] Rates shown in both formats
- [ ] Sorting works on all columns

## Search (Contracts)
- [ ] Search by contract code works
- [ ] Search by expiry date works
- [ ] Clear search button works
- [ ] Search filters data correctly
- [ ] Pagination resets on search

## Pagination
- [ ] Shows correct item range
- [ ] Shows total items count
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Page numbers clickable
- [ ] Correct page highlighted
- [ ] Navigation between pages works

## Summary Statistics
- [ ] Total count correct
- [ ] Min rate correct
- [ ] Max rate correct
- [ ] Average rate correct
- [ ] Statistics update with filtering/sorting

## Row Selection (Contracts)
- [ ] Tap row to select
- [ ] Selected row highlighted
- [ ] Tap again to deselect
- [ ] Details card shows on selection
- [ ] All contract details displayed

## Export/Copy
- [ ] Export CSV creates file
- [ ] CSV contains all data
- [ ] CSV format correct
- [ ] Copy page copies current page
- [ ] Paste works in spreadsheet
- [ ] Success messages shown

## Navigation
- [ ] Back button returns to chart
- [ ] Chart icon navigates to chart
- [ ] Navigation preserves data

## Responsive Design
- [ ] Table scrolls horizontally
- [ ] Table scrolls vertically
- [ ] Works in portrait mode
- [ ] Works in landscape mode
- [ ] Columns sized appropriately

## Performance
- [ ] Table loads quickly
- [ ] Sorting is instant
- [ ] Pagination smooth
- [ ] Search responsive
- [ ] No lag with large datasets
```

---

## Acceptance Criteria

- ✅ Displays both contracts and curve data
- ✅ Sortable by any column
- ✅ Search/filter works for contracts
- ✅ Pagination for large datasets (20 items per page)
- ✅ Summary statistics calculated correctly
- ✅ Export to CSV functional
- ✅ Copy to clipboard works
- ✅ Row selection shows details
- ✅ Responsive horizontal and vertical scrolling
- ✅ Works in portrait and landscape
- ✅ All text in Portuguese
- ✅ Loading states during export
- ✅ Error handling for exports
- ✅ Smooth performance with 1000+ rows

---

## Performance Optimization

### Virtual Scrolling (Future Enhancement)
```typescript
// For very large datasets (5000+ rows)
import { FlatList } from 'react-native';

<FlatList
  data={paginatedData}
  renderItem={({ item }) => <TableRow data={item} />}
  keyExtractor={(item, index) => index.toString()}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Memoization
```typescript
// Already implemented in the spec
const sortedData = useMemo(() => {
  return sortData(filteredData, sortConfig);
}, [filteredData, sortConfig]);
```

---

## Future Enhancements

1. **Advanced Filtering**
   - Date range filter
   - Rate range filter
   - Multiple filters at once

2. **Column Customization**
   - Show/hide columns
   - Reorder columns
   - Resize columns

3. **Bulk Operations**
   - Select multiple rows
   - Bulk export selected
   - Bulk copy selected

4. **Data Comparison**
   - Compare two contracts
   - Highlight differences
   - Side-by-side view

5. **Export Formats**
   - Excel (XLSX)
   - PDF report
   - JSON format

---

## Dependencies

```json
{
  "expo-clipboard": "~6.0.3"
}
```

---

## Next Steps

After Feature 8:
- **Feature 9**: Settings and configuration screen
- **Feature 10**: Error handling and offline support
- **Feature 11**: Educational content and help

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 8 |