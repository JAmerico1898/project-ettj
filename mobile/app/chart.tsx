/**
 * Chart screen - Interactive rate curve visualization
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { COLORS } from '../constants/config';
import { useApp } from '../context/AppContext';
import {
  YieldCurveChart,
  ChartLegend,
  StatisticsCard,
  MethodInfoBar,
  DisplayControls,
  ChartActions,
} from '../components/chart';
import { LoadingOverlay, ErrorMessage } from '../components';
import {
  XAxisMode,
  YAxisMode,
  calculateChartStats,
  curveToCSV,
} from '../utils/chartUtils';

export default function ChartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string; method: string }>();
  const { workflowResult } = useApp();

  // Display mode state
  const [xMode, setXMode] = useState<XAxisMode>('years');
  const [yMode, setYMode] = useState<YAxisMode>('percent');

  // Chart ref for screenshot
  const chartRef = useRef<View>(null);

  // Handle no data state
  if (!workflowResult) {
    return (
      <View style={styles.container}>
        <Surface style={styles.emptyState} elevation={1}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Nenhum dado disponível
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Calcule uma curva na tela inicial para visualizar o gráfico.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/')}
            style={styles.emptyButton}
            icon="home"
            accessibilityLabel="Voltar ao inicio"
            accessibilityHint="Retornar a tela inicial do aplicativo"
            accessibilityRole="button"
          >
            Voltar ao Inicio
          </Button>
        </Surface>
      </View>
    );
  }

  const {
    method,
    method_name,
    method_type,
    actual_date,
    contracts_count,
    curve_points,
    original_points,
    metrics,
  } = workflowResult;

  // Calculate statistics
  const stats = calculateChartStats(original_points);

  // Generate CSV content
  const csvContent = curveToCSV(curve_points, original_points, method_name, actual_date);
  const fileName = `ettj_${method}_${actual_date.replace(/-/g, '')}`;

  // Handle share image
  const handleShareImage = async (): Promise<string | null> => {
    if (!chartRef.current) {
      if (__DEV__) {
        console.error('Chart ref is null');
      }
      return null;
    }

    try {
      const uri = await captureRef(chartRef, {
        format: 'png',
        quality: 1,
        result: 'data-uri', // Ensure we get a data URI for web compatibility
      });
      return uri;
    } catch (error) {
      if (__DEV__) {
        console.error('Error capturing chart:', error);
        // On web, try alternative approach
        if (Platform.OS === 'web') {
          console.log('Trying alternative web capture...');
        }
      }
      return null;
    }
  };

  // Navigate to data screen
  const handleNavigateToData = () => {
    router.push('/data');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Method Info Header */}
        <MethodInfoBar
          method={method}
          methodName={method_name}
          methodType={method_type}
          date={actual_date}
          contractsCount={contracts_count}
        />

        {/* Chart Card */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Curva de Juros
            </Text>

            {/* Display Controls */}
            <DisplayControls
              xMode={xMode}
              yMode={yMode}
              onXModeChange={setXMode}
              onYModeChange={setYMode}
            />

            {/* Chart with ref for screenshot */}
            <View ref={chartRef} collapsable={false} style={styles.chartContainer}>
              <YieldCurveChart
                curvePoints={curve_points}
                originalPoints={original_points}
                xMode={xMode}
                yMode={yMode}
              />
              <ChartLegend />
            </View>
          </Card.Content>
        </Card>

        {/* Statistics Card */}
        <StatisticsCard stats={stats} metrics={metrics} />

        {/* Action Buttons */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <ChartActions
              onShareImage={handleShareImage}
              csvContent={csvContent}
              fileName={fileName}
              onNavigateToData={handleNavigateToData}
            />
          </Card.Content>
        </Card>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={() => router.push('/')}
            icon="arrow-left"
            style={styles.navButton}
            accessibilityLabel="Calcular nova curva"
            accessibilityHint="Voltar a tela inicial para calcular uma nova curva"
            accessibilityRole="button"
          >
            Nova Curva
          </Button>
        </View>

        {/* Footer */}
        <Surface style={styles.footer} elevation={0}>
          <Text variant="bodySmall" style={styles.footerText}>
            ETTJ DI1 - Prof. José Américo
          </Text>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  emptyTitle: {
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    marginVertical: 8,
  },
  chartTitle: {
    color: COLORS.text,
    marginBottom: 8,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    marginVertical: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  footerText: {
    color: COLORS.textSecondary,
  },
});
