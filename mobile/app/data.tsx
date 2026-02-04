/**
 * Data screen - Comprehensive data table with sorting, filtering, pagination
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, SegmentedButtons, Button, Divider, ActivityIndicator } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { COLORS } from '../constants/config';
import { useApp } from '../context/AppContext';
import { DI1Contract, CurvePoint } from '../types';
import {
  TableSearch,
  TablePagination,
  TableSummary,
  ContractsTable,
  CurveTable,
} from '../components';
import type { TableStats } from '../components';
import {
  SortConfig,
  sortData,
  filterData,
  paginateData,
  getNextSortDirection,
  DEFAULT_ITEMS_PER_PAGE,
} from '../utils/tableUtils';
import { copyTableToClipboard } from '../utils/clipboardUtils';
import { contractsToCSV, curveToCSV } from '../utils/chartUtils';
import { formatDateBR } from '../utils/dateUtils';

type ViewMode = 'contracts' | 'curve';

export default function DataScreen() {
  const { contracts, workflowResult, actualDate, selectedDate, loadData, isLoading, setSelectedDate } = useApp();
  const curvePoints = workflowResult?.curve_points ?? [];
  const originalPoints = workflowResult?.original_points ?? [];

  // Use actualDate from context, or fallback to workflowResult
  // For display, also consider selectedDate
  const displayDate = actualDate || workflowResult?.actual_date || (selectedDate ? selectedDate.toISOString().split('T')[0] : null);

  // Track if we need to trigger loading
  const [pendingLoad, setPendingLoad] = useState(false);
  const hasInitialized = useRef(false);

  // Auto-load contracts when screen mounts if:
  // 1. Contracts are empty
  // 2. Either we have a displayDate (from workflow) or selectedDate (from home screen)
  // 3. Not already loading
  useEffect(() => {
    if (hasInitialized.current) return;
    if (contracts.length === 0 && !isLoading) {
      // Try to use displayDate first, then selectedDate
      const dateToUse = displayDate || (selectedDate ? selectedDate.toISOString().split('T')[0] : null);

      if (dateToUse) {
        hasInitialized.current = true;
        const date = new Date(dateToUse + 'T12:00:00');
        setSelectedDate(date);
        setPendingLoad(true);
      } else if (selectedDate) {
        // selectedDate is already a Date object
        hasInitialized.current = true;
        setPendingLoad(true);
      } else {
        // No date at all - load with server default
        hasInitialized.current = true;
        setPendingLoad(true);
      }
    }
  }, [contracts.length, displayDate, selectedDate, isLoading, setSelectedDate]);

  // Phase 2: Load data after date is set (loadData will have the new date)
  useEffect(() => {
    if (pendingLoad && !isLoading) {
      setPendingLoad(false);
      loadData();
    }
  }, [pendingLoad, isLoading, loadData]);

  // View mode - default to 'contracts' (more common entry point)
  const hasContracts = contracts.length > 0;
  const hasCurve = curvePoints.length > 0;
  const [viewMode, setViewMode] = useState<ViewMode>('contracts');

  // Search (contracts only)
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state per view
  const [contractsSortConfig, setContractsSortConfig] = useState<SortConfig<DI1Contract>>({
    key: null,
    direction: null,
  });
  const [curveSortConfig, setCurveSortConfig] = useState<SortConfig<CurvePoint>>({
    key: null,
    direction: null,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Selected contract for details
  const [selectedContract, setSelectedContract] = useState<DI1Contract | null>(null);

  // Export/copy state
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return formatDateBR(date);
  };

  // Process contracts data
  const processedContracts = useMemo(() => {
    let data = contracts;

    // Filter by search term
    if (searchTerm) {
      data = filterData(data, searchTerm, ['ticker']);
    }

    // Sort
    data = sortData(data, contractsSortConfig);

    return data;
  }, [contracts, searchTerm, contractsSortConfig]);

  // Process curve data
  const processedCurve = useMemo(() => {
    return sortData(curvePoints, curveSortConfig);
  }, [curvePoints, curveSortConfig]);

  // Paginate contracts
  const paginatedContracts = useMemo(() => {
    return paginateData(processedContracts, currentPage, DEFAULT_ITEMS_PER_PAGE);
  }, [processedContracts, currentPage]);

  // Paginate curve points
  const paginatedCurve = useMemo(() => {
    return paginateData(processedCurve, currentPage, DEFAULT_ITEMS_PER_PAGE);
  }, [processedCurve, currentPage]);

  // Get current pagination info
  const paginationInfo = viewMode === 'contracts' ? paginatedContracts.info : paginatedCurve.info;

  // Calculate stats
  const contractStats = useMemo((): TableStats => {
    if (processedContracts.length === 0) {
      return { count: 0 };
    }
    const rates = processedContracts.map((c) => c.rate_percent);
    return {
      count: processedContracts.length,
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      avgRate: rates.reduce((a, b) => a + b, 0) / rates.length,
    };
  }, [processedContracts]);

  const curveStats = useMemo((): TableStats => {
    if (curvePoints.length === 0) {
      return { count: 0 };
    }
    const rates = curvePoints.map((p) => p.rate_percent);
    return {
      count: curvePoints.length,
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      avgRate: rates.reduce((a, b) => a + b, 0) / rates.length,
    };
  }, [curvePoints]);

  // Handlers
  const handleViewModeChange = (value: string) => {
    setViewMode(value as ViewMode);
    setCurrentPage(0);
    setSelectedContract(null);
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setCurrentPage(0);
  };

  const handleContractsSort = (key: keyof DI1Contract) => {
    setContractsSortConfig((prev) => ({
      key,
      direction: prev.key === key ? getNextSortDirection(prev.direction) : 'asc',
    }));
    setCurrentPage(0);
  };

  const handleCurveSort = (key: keyof CurvePoint) => {
    setCurveSortConfig((prev) => ({
      key,
      direction: prev.key === key ? getNextSortDirection(prev.direction) : 'asc',
    }));
    setCurrentPage(0);
  };

  const handleContractPress = (contract: DI1Contract) => {
    setSelectedContract((prev) =>
      prev?.ticker === contract.ticker ? null : contract
    );
  };

  // Export CSV - download on web, share on native
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const dateStr = displayDate || 'unknown';
      let csvContent: string;
      let fileName: string;

      if (viewMode === 'contracts') {
        csvContent = contractsToCSV(contracts, dateStr);
        fileName = `contratos_di1_${dateStr}`;
      } else {
        const method = workflowResult?.method || 'unknown';
        csvContent = curveToCSV(curvePoints, originalPoints, method, dateStr);
        fileName = `curva_${method}_${dateStr}`;
      }

      // Web platform - use download link
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Sucesso', 'Arquivo CSV baixado.');
        return;
      }

      // Native platform - use file system and sharing
      const csvFile = new File(Paths.cache, `${fileName}.csv`);
      await csvFile.write(csvContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(csvFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar dados CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'Exportacao indisponivel',
          'A exportacao nao esta disponivel neste dispositivo.'
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error exporting CSV:', error);
      }
      Alert.alert('Erro', 'Nao foi possivel exportar os dados.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    try {
      let success: boolean;

      if (viewMode === 'contracts') {
        success = await copyTableToClipboard(processedContracts, [
          { key: 'ticker', label: 'Contrato' },
          { key: 'maturity_date', label: 'Vencimento' },
          { key: 'business_days', label: 'DU' },
          { key: 'rate_percent', label: 'Taxa (%)', format: (v) => (v as number).toFixed(4) },
        ]);
      } else {
        success = await copyTableToClipboard(processedCurve, [
          { key: 'business_days', label: 'DU' },
          { key: 'years', label: 'Anos', format: (v) => (v as number).toFixed(4) },
          { key: 'rate_percent', label: 'Taxa (%)', format: (v) => (v as number).toFixed(4) },
        ]);
      }

      if (success) {
        Alert.alert('Copiado', 'Dados copiados para a area de transferencia.');
      } else {
        Alert.alert('Erro', 'Nao foi possivel copiar os dados.');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error copying to clipboard:', error);
      }
      Alert.alert('Erro', 'Nao foi possivel copiar os dados.');
    } finally {
      setIsCopying(false);
    }
  };

  // Check if current view has data
  const hasData = viewMode === 'contracts' ? hasContracts : hasCurve;

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Dados DI1
          </Text>
          {(displayDate || hasContracts || hasCurve) && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {displayDate && `Data: ${formatDate(displayDate)}`}
              {hasContracts && ` | ${contracts.length} contratos`}
              {hasCurve && ` | ${curvePoints.length} pontos na curva`}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* View Toggle */}
      <SegmentedButtons
        value={viewMode}
        onValueChange={handleViewModeChange}
        buttons={[
          {
            value: 'contracts',
            label: 'Contratos',
            icon: 'file-document',
          },
          {
            value: 'curve',
            label: 'Curva',
            icon: 'chart-line',
          },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Search (contracts only) */}
      {viewMode === 'contracts' && hasContracts && (
        <TableSearch
          value={searchTerm}
          onChangeText={handleSearchChange}
          placeholder="Buscar por contrato..."
        />
      )}

      {/* Summary Stats */}
      {hasData && (
        <TableSummary
          stats={viewMode === 'contracts' ? contractStats : curveStats}
          title={viewMode === 'contracts' ? 'Resumo dos Contratos' : 'Resumo da Curva'}
        />
      )}

      {/* Empty State or Loading */}
      {!hasData && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            {isLoading && viewMode === 'contracts' ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text variant="bodyMedium" style={styles.loadingText}>
                  Carregando contratos...
                </Text>
              </View>
            ) : (
              <>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {viewMode === 'contracts'
                    ? 'Nenhum contrato carregado'
                    : 'Nenhuma curva calculada'}
                </Text>
                <Text variant="bodySmall" style={styles.emptySubtext}>
                  {viewMode === 'contracts'
                    ? 'Volte a tela inicial e carregue os dados'
                    : 'Calcule uma curva na tela do grafico'}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Data Table */}
      {hasData && (
        <Card style={styles.tableCard}>
          <Card.Content>
            {viewMode === 'contracts' ? (
              <ContractsTable
                contracts={paginatedContracts.items}
                sortConfig={contractsSortConfig}
                onSort={handleContractsSort}
                onRowPress={handleContractPress}
                selectedContract={selectedContract}
              />
            ) : (
              <CurveTable
                points={paginatedCurve.items}
                sortConfig={curveSortConfig}
                onSort={handleCurveSort}
              />
            )}

            {/* Pagination */}
            <TablePagination
              info={paginationInfo}
              onPageChange={setCurrentPage}
            />
          </Card.Content>
        </Card>
      )}

      {/* Selected Contract Details */}
      {selectedContract && viewMode === 'contracts' && (
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.detailsTitle}>
              Detalhes do Contrato
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.detailsGrid}>
              <DetailItem label="Contrato" value={selectedContract.ticker} />
              <DetailItem
                label="Vencimento"
                value={formatDate(selectedContract.maturity_date)}
              />
              <DetailItem
                label="Dias Uteis"
                value={String(selectedContract.business_days)}
              />
              <DetailItem
                label="Taxa"
                value={`${selectedContract.rate_percent.toFixed(4)}%`}
                highlight
              />
              <DetailItem
                label="Taxa (decimal)"
                value={selectedContract.rate.toFixed(6)}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      {hasData && (
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={handleExportCSV}
            loading={isExporting}
            disabled={isExporting || isCopying}
            icon="file-export"
            style={styles.actionButton}
            accessibilityLabel="Exportar dados para CSV"
            accessibilityHint="Exporta os dados da tabela para um arquivo CSV"
            accessibilityRole="button"
          >
            Exportar CSV
          </Button>
          <Button
            mode="outlined"
            onPress={handleCopyToClipboard}
            loading={isCopying}
            disabled={isExporting || isCopying}
            icon="content-copy"
            style={styles.actionButton}
            accessibilityLabel="Copiar dados"
            accessibilityHint="Copia os dados da tabela para a area de transferencia"
            accessibilityRole="button"
          >
            Copiar
          </Button>
        </View>
      )}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.infoText}>
            DU = Dias Uteis ate o vencimento
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Taxa = Taxa anualizada (base 252 dias uteis)
          </Text>
          {viewMode === 'contracts' && (
            <Text variant="bodySmall" style={styles.infoText}>
              Toque em uma linha para ver detalhes
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailItem({ label, value, highlight }: DetailItemProps) {
  return (
    <View style={styles.detailItem}>
      <Text variant="labelSmall" style={styles.detailLabel}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.detailValue, highlight && styles.highlightValue]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  detailsTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: '500',
  },
  highlightValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    borderColor: COLORS.primary,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  infoText: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 20,
  },
});
