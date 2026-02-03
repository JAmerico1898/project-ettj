# Feature 7: Chart Screen - Yield Curve Visualization

## Overview
Build an interactive chart screen that visualizes the yield curve data calculated from the home screen. This screen displays both the original DI1 contract points and the smoothed interpolated curve, with interactive features for exploring the data.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 5** completed (API client)
- **Feature 6** completed (home screen with workflow)
- Chart libraries installed
- Navigation configured

---

## Objectives
- Display interactive line chart of yield curve
- Show original data points as scatter plot overlay
- Display curve and original points with different colors
- Add touch interaction to view specific point values
- Show chart legend distinguishing curve from data points
- Display summary statistics (min, max, average rates)
- Add zoom and pan capabilities
- Support both business days and years on x-axis
- Toggle between rate formats (decimal vs percentage)
- Export/share chart as image
- Show method information and parameters used
- Display goodness-of-fit metrics
- Add comparison view for multiple methods (optional)
- Responsive design for different screen sizes

---

## Screen Design

### Layout Structure
```
┌─────────────────────────────────┐
│ ← Curva de Juros                │ Header
├─────────────────────────────────┤
│                                 │
│  📊 Nelson-Siegel               │ Method Info Bar
│  31/01/2025 • R² = 0.998        │
│                                 │
│  ┌──────────────────────────┐  │
│  │        📈 Chart          │  │ Main Chart
│  │                          │  │
│  │    [Interactive Line     │  │
│  │     and Scatter Plot]    │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                 │
│  Legenda:                       │ Legend
│  ─── Curva Suavizada            │
│  ••• Contratos DI1              │
│                                 │
│  📊 Estatísticas                │ Statistics Card
│  ┌──────────────────────────┐  │
│  │ Min: 10.25% | Max: 11.35%│  │
│  │ Média: 10.87% | RMSE: 0.05│  │
│  └──────────────────────────┘  │
│                                 │
│  ⚙️ Opções de Visualização      │ Display Options
│  [Anos] [Dias Úteis]            │
│  [%] [Decimal]                  │
│                                 │
├─────────────────────────────────┤
│  [📤 Compartilhar] [📋 Dados]  │ Action Buttons
└─────────────────────────────────┘
```

---

## Implementation

### File Structure
```
mobile/
├── app/
│   └── chart.tsx              # Chart screen (UPDATE)
├── components/
│   ├── YieldCurveChart.tsx    # Main chart component (NEW)
│   ├── ChartLegend.tsx        # Chart legend (NEW)
│   ├── StatsCard.tsx          # Statistics display (NEW)
│   ├── ChartControls.tsx      # Display controls (NEW)
│   ├── MethodInfoBar.tsx      # Method info banner (NEW)
│   └── PointTooltip.tsx       # Touch point tooltip (NEW)
├── utils/
│   ├── chartUtils.ts          # Chart utilities (NEW)
│   └── exportUtils.ts         # Export/share utilities (NEW)
└── styles/
    └── chartScreen.ts         # Screen styles (NEW)
```

---

## Code Implementation

### `mobile/utils/chartUtils.ts` (NEW FILE)
```typescript
/**
 * Chart utilities and data formatting
 */
import type { CurvePoint } from '@/types/api';

export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartDataset {
  data: ChartDataPoint[];
  color: string;
  strokeWidth: number;
  type: 'line' | 'scatter';
}

export function formatCurveForChart(
  points: CurvePoint[],
  useYears: boolean = true,
  usePercent: boolean = true
): ChartDataPoint[] {
  return points.map(point => ({
    x: useYears ? point.years : point.business_days,
    y: usePercent ? point.rate_percent : point.rate,
  }));
}

export function getChartDomain(
  data: ChartDataPoint[]
): { x: [number, number]; y: [number, number] } {
  if (data.length === 0) {
    return { x: [0, 1], y: [0, 1] };
  }

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  // Add 5% padding
  const xPadding = (xMax - xMin) * 0.05;
  const yPadding = (yMax - yMin) * 0.05;

  return {
    x: [Math.max(0, xMin - xPadding), xMax + xPadding],
    y: [yMin - yPadding, yMax + yPadding],
  };
}

export function formatXAxisLabel(value: number, useYears: boolean): string {
  if (useYears) {
    return value.toFixed(1);
  } else {
    return Math.round(value).toString();
  }
}

export function formatYAxisLabel(value: number, usePercent: boolean): string {
  if (usePercent) {
    return `${value.toFixed(2)}%`;
  } else {
    return value.toFixed(4);
  }
}

export function findNearestPoint(
  x: number,
  data: ChartDataPoint[]
): ChartDataPoint | null {
  if (data.length === 0) return null;

  let nearest = data[0];
  let minDistance = Math.abs(x - data[0].x);

  for (const point of data) {
    const distance = Math.abs(x - point.x);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  }

  return nearest;
}

export interface ChartStatistics {
  minRate: number;
  maxRate: number;
  avgRate: number;
  rangeRate: number;
}

export function calculateStatistics(points: CurvePoint[]): ChartStatistics {
  if (points.length === 0) {
    return { minRate: 0, maxRate: 0, avgRate: 0, rangeRate: 0 };
  }

  const rates = points.map(p => p.rate_percent);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const rangeRate = maxRate - minRate;

  return { minRate, maxRate, avgRate, rangeRate };
}
```

### `mobile/utils/exportUtils.ts` (NEW FILE)
```typescript
/**
 * Export and share utilities
 */
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

export async function shareChartImage(
  chartRef: any,
  fileName: string = 'yield-curve.png'
): Promise<void> {
  try {
    // Capture chart as image
    const uri = await captureRef(chartRef, {
      format: 'png',
      quality: 1,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartilhar Gráfico',
      });
    } else {
      throw new Error('Sharing not available on this device');
    }
  } catch (error) {
    console.error('Error sharing chart:', error);
    throw error;
  }
}

export function formatDataAsCSV(
  originalPoints: any[],
  curvePoints: any[]
): string {
  let csv = 'Tipo,Anos,Dias Úteis,Taxa (%),Taxa (Decimal)\n';

  originalPoints.forEach(point => {
    csv += `Original,${point.years},${point.business_days},${point.rate_percent},${point.rate}\n`;
  });

  curvePoints.forEach(point => {
    csv += `Curva,${point.years},${point.business_days},${point.rate_percent},${point.rate}\n`;
  });

  return csv;
}

export async function exportDataAsCSV(
  originalPoints: any[],
  curvePoints: any[],
  fileName: string = 'yield-curve-data.csv'
): Promise<void> {
  try {
    const csv = formatDataAsCSV(originalPoints, curvePoints);
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csv);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Dados',
      });
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
}
```

### `mobile/components/YieldCurveChart.tsx` (NEW FILE)
```typescript
/**
 * Main yield curve chart component using Victory Native
 */
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryScatter, VictoryAxis, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import type { CurvePoint } from '@/types/api';
import { formatCurveForChart, formatXAxisLabel, formatYAxisLabel } from '@/utils/chartUtils';

interface YieldCurveChartProps {
  originalPoints: CurvePoint[];
  curvePoints: CurvePoint[];
  useYears?: boolean;
  usePercent?: boolean;
}

export function YieldCurveChart({
  originalPoints,
  curvePoints,
  useYears = true,
  usePercent = true,
}: YieldCurveChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 300;

  // Format data for chart
  const originalData = formatCurveForChart(originalPoints, useYears, usePercent);
  const curveData = formatCurveForChart(curvePoints, useYears, usePercent);

  // Sample curve data for better performance (show every nth point)
  const samplingFactor = Math.max(1, Math.floor(curveData.length / 200));
  const sampledCurveData = curveData.filter((_, i) => i % samplingFactor === 0);

  return (
    <View style={styles.container}>
      <VictoryChart
        width={screenWidth - 32}
        height={chartHeight}
        theme={VictoryTheme.material}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum }) => 
              `${formatXAxisLabel(datum.x, useYears)}: ${formatYAxisLabel(datum.y, usePercent)}`
            }
            labelComponent={
              <VictoryTooltip
                cornerRadius={4}
                flyoutStyle={{
                  fill: 'rgba(0, 0, 0, 0.8)',
                  stroke: 'white',
                  strokeWidth: 1,
                }}
                style={{
                  fill: 'white',
                  fontSize: 12,
                }}
              />
            }
          />
        }
      >
        {/* X Axis */}
        <VictoryAxis
          label={useYears ? 'Anos' : 'Dias Úteis'}
          style={{
            axisLabel: { fontSize: 12, padding: 30 },
            tickLabels: { fontSize: 10 },
          }}
          tickFormat={(t) => formatXAxisLabel(t, useYears)}
        />

        {/* Y Axis */}
        <VictoryAxis
          dependentAxis
          label={usePercent ? 'Taxa (%)' : 'Taxa (Decimal)'}
          style={{
            axisLabel: { fontSize: 12, padding: 40 },
            tickLabels: { fontSize: 10 },
          }}
          tickFormat={(t) => formatYAxisLabel(t, usePercent)}
        />

        {/* Smoothed Curve Line */}
        <VictoryLine
          data={sampledCurveData}
          style={{
            data: {
              stroke: '#6750A4',
              strokeWidth: 2,
            },
          }}
        />

        {/* Original Data Points */}
        <VictoryScatter
          data={originalData}
          size={5}
          style={{
            data: {
              fill: '#D32F2F',
              stroke: 'white',
              strokeWidth: 1,
            },
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginVertical: 16,
  },
});
```

### `mobile/components/ChartLegend.tsx` (NEW FILE)
```typescript
/**
 * Chart legend component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export function ChartLegend() {
  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.title}>
        Legenda:
      </Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: '#6750A4' }]} />
          <Text variant="bodySmall">Curva Suavizada</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#D32F2F' }]} />
          <Text variant="bodySmall">Contratos DI1</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
});
```

### `mobile/components/StatsCard.tsx` (NEW FILE)
```typescript
/**
 * Statistics card component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { CurveMetrics } from '@/types/api';
import { calculateStatistics } from '@/utils/chartUtils';
import type { CurvePoint } from '@/types/api';

interface StatsCardProps {
  originalPoints: CurvePoint[];
  metrics: CurveMetrics;
}

export function StatsCard({ originalPoints, metrics }: StatsCardProps) {
  const stats = calculateStatistics(originalPoints);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          📊 Estatísticas
        </Text>

        <View style={styles.statsGrid}>
          {/* Rate Statistics */}
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Taxa Mínima
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {stats.minRate.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Taxa Máxima
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {stats.maxRate.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Taxa Média
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {stats.avgRate.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Amplitude
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {stats.rangeRate.toFixed(2)}pp
            </Text>
          </View>
        </View>

        {/* Goodness of Fit Metrics */}
        <View style={styles.divider} />
        
        <Text variant="labelMedium" style={styles.metricsTitle}>
          Qualidade do Ajuste
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              R²
            </Text>
            <Text variant="bodyMedium" style={styles.metricValue}>
              {metrics.r_squared.toFixed(4)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              RMSE
            </Text>
            <Text variant="bodyMedium" style={styles.metricValue}>
              {metrics.rmse_percent.toFixed(3)}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              MAE
            </Text>
            <Text variant="bodyMedium" style={styles.metricValue}>
              {metrics.mae_percent.toFixed(3)}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              Erro Máx.
            </Text>
            <Text variant="bodyMedium" style={styles.metricValue}>
              {metrics.max_error_percent.toFixed(3)}%
            </Text>
          </View>
        </View>

        {/* R² Interpretation */}
        <Text variant="bodySmall" style={styles.interpretation}>
          {metrics.r_squared >= 0.99
            ? '✓ Excelente ajuste'
            : metrics.r_squared >= 0.95
            ? '✓ Bom ajuste'
            : metrics.r_squared >= 0.90
            ? '⚠ Ajuste moderado'
            : '⚠ Ajuste fraco'}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  metricsTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: 'bold',
  },
  interpretation: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 8,
  },
});
```

### `mobile/components/ChartControls.tsx` (NEW FILE)
```typescript
/**
 * Chart display controls
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

interface ChartControlsProps {
  useYears: boolean;
  onUseYearsChange: (value: boolean) => void;
  usePercent: boolean;
  onUsePercentChange: (value: boolean) => void;
}

export function ChartControls({
  useYears,
  onUseYearsChange,
  usePercent,
  onUsePercentChange,
}: ChartControlsProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        Eixo X (Maturidade)
      </Text>
      <SegmentedButtons
        value={useYears ? 'years' : 'days'}
        onValueChange={(value) => onUseYearsChange(value === 'years')}
        buttons={[
          {
            value: 'years',
            label: 'Anos',
            icon: 'calendar',
          },
          {
            value: 'days',
            label: 'Dias Úteis',
            icon: 'calendar-today',
          },
        ]}
        style={styles.segmented}
      />

      <Text variant="labelMedium" style={styles.label}>
        Eixo Y (Taxa)
      </Text>
      <SegmentedButtons
        value={usePercent ? 'percent' : 'decimal'}
        onValueChange={(value) => onUsePercentChange(value === 'percent')}
        buttons={[
          {
            value: 'percent',
            label: 'Percentual',
            icon: 'percent',
          },
          {
            value: 'decimal',
            label: 'Decimal',
            icon: 'numeric',
          },
        ]}
        style={styles.segmented}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmented: {
    marginBottom: 8,
  },
});
```

### `mobile/components/MethodInfoBar.tsx` (NEW FILE)
```typescript
/**
 * Method information banner
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

interface MethodInfoBarProps {
  methodName: string;
  methodType: 'simple' | 'spline' | 'parametric';
  referenceDate: string;
  rSquared: number;
  numContracts: number;
}

export function MethodInfoBar({
  methodName,
  methodType,
  referenceDate,
  rSquared,
  numContracts,
}: MethodInfoBarProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      simple: '#4CAF50',
      spline: '#2196F3',
      parametric: '#FF9800',
    };
    return colors[type as keyof typeof colors] || '#757575';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      simple: 'Simples',
      spline: 'Spline',
      parametric: 'Paramétrico',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.methodName}>
          📊 {methodName}
        </Text>
        <Chip
          mode="flat"
          style={[styles.typeChip, { backgroundColor: getTypeColor(methodType) }]}
          textStyle={styles.typeChipText}
        >
          {getTypeLabel(methodType)}
        </Chip>
      </View>

      <View style={styles.infoRow}>
        <Text variant="bodySmall" style={styles.infoText}>
          📅 {referenceDate}
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          • {numContracts} contratos
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          • R² = {rSquared.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8DEF8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodName: {
    fontWeight: 'bold',
    flex: 1,
  },
  typeChip: {
    height: 28,
  },
  typeChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoText: {
    opacity: 0.8,
  },
});
```

### `mobile/app/chart.tsx` (COMPLETE REWRITE)
```typescript
/**
 * Chart Screen - Yield Curve Visualization
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, IconButton, Appbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';

import { YieldCurveChart } from '@/components/YieldCurveChart';
import { ChartLegend } from '@/components/ChartLegend';
import { StatsCard } from '@/components/StatsCard';
import { ChartControls } from '@/components/ChartControls';
import { MethodInfoBar } from '@/components/MethodInfoBar';
import { LoadingOverlay } from '@/components/LoadingOverlay';

import { shareChartImage, exportDataAsCSV } from '@/utils/exportUtils';
import { formatDateBR } from '@/utils/dateUtils';
import type { WorkflowResponse } from '@/types/api';

export default function ChartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chartRef = useRef(null);

  // Parse workflow response from params
  const workflowData: WorkflowResponse = params.data
    ? JSON.parse(params.data as string)
    : null;

  // State
  const [useYears, setUseYears] = useState(true);
  const [usePercent, setUsePercent] = useState(true);
  const [sharing, setSharing] = useState(false);

  if (!workflowData) {
    return (
      <View style={styles.errorContainer}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Erro" />
        </Appbar.Header>
        <View style={styles.errorContent}>
          <Text>Nenhum dado disponível</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Voltar
          </Button>
        </View>
      </View>
    );
  }

  const handleShareChart = async () => {
    try {
      setSharing(true);
      await shareChartImage(chartRef, 'curva-juros.png');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o gráfico');
    } finally {
      setSharing(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSharing(true);
      await exportDataAsCSV(
        workflowData.original_points,
        workflowData.curve_points,
        `curva-juros-${workflowData.reference_date}.csv`
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar os dados');
    } finally {
      setSharing(false);
    }
  };

  const handleViewData = () => {
    router.push({
      pathname: '/data',
      params: {
        data: JSON.stringify(workflowData),
      },
    });
  };

  // Format reference date for display
  const dateParts = workflowData.reference_date.split('-');
  const displayDate = formatDateBR(
    new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    )
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Curva de Juros" />
        <Appbar.Action icon="share-variant" onPress={handleShareChart} />
        <Appbar.Action icon="download" onPress={handleExportData} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Method Info */}
        <MethodInfoBar
          methodName={workflowData.method_name}
          methodType={workflowData.method_type}
          referenceDate={displayDate}
          rSquared={workflowData.metrics.r_squared}
          numContracts={workflowData.num_contracts}
        />

        {/* Chart */}
        <ViewShot ref={chartRef} options={{ format: 'png', quality: 1 }}>
          <YieldCurveChart
            originalPoints={workflowData.original_points}
            curvePoints={workflowData.curve_points}
            useYears={useYears}
            usePercent={usePercent}
          />
        </ViewShot>

        {/* Legend */}
        <ChartLegend />

        {/* Statistics */}
        <StatsCard
          originalPoints={workflowData.original_points}
          metrics={workflowData.metrics}
        />

        {/* Display Controls */}
        <ChartControls
          useYears={useYears}
          onUseYearsChange={setUseYears}
          usePercent={usePercent}
          onUsePercentChange={setUsePercent}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleViewData}
            icon="table"
            style={styles.actionButton}
          >
            Ver Tabela de Dados
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            icon="pencil"
            style={styles.actionButton}
          >
            Nova Análise
          </Button>
        </View>

        {/* Parameters Info (if any) */}
        {Object.keys(workflowData.parameters_used).length > 0 && (
          <View style={styles.parametersCard}>
            <Text variant="labelMedium" style={styles.parametersTitle}>
              Parâmetros Utilizados
            </Text>
            {Object.entries(workflowData.parameters_used).map(([key, value]) => (
              <Text key={key} variant="bodySmall" style={styles.parameterItem}>
                • {key}: {typeof value === 'number' ? value.toFixed(4) : value}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <LoadingOverlay visible={sharing} message="Compartilhando..." />
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
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  parametersCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  parametersTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  parameterItem: {
    marginLeft: 8,
    opacity: 0.8,
  },
});
```

### Update `mobile/package.json` (ADD DEPENDENCIES)
```json
{
  "dependencies": {
    "victory-native": "^36.9.2",
    "react-native-svg": "14.1.0",
    "react-native-view-shot": "^3.8.0",
    "expo-sharing": "~12.0.1",
    "expo-file-system": "~17.0.1"
  }
}
```

---

## Alternative Chart Libraries

### Option 1: Victory Native (Recommended)
**Pros:**
- React Native native components
- Good performance
- Comprehensive chart types
- Touch interactions built-in
- Active maintenance

**Cons:**
- Larger bundle size
- Learning curve

### Option 2: React Native Chart Kit
```typescript
import { LineChart } from 'react-native-chart-kit';

<LineChart
  data={{
    labels: xLabels,
    datasets: [
      { data: curveYValues },
      { data: originalYValues },
    ],
  }}
  width={screenWidth}
  height={300}
  chartConfig={{
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
  }}
/>
```

**Pros:**
- Simpler API
- Smaller bundle size
- Good for basic charts

**Cons:**
- Less customization
- Limited interactivity
- Less active development

---

## Testing

### Manual Testing Checklist

```markdown
# Chart Screen Testing Checklist

## Chart Display
- [ ] Chart renders correctly with data
- [ ] Line shows smoothed curve
- [ ] Scatter points show original data
- [ ] Both datasets visible and distinguishable
- [ ] Chart scales appropriately
- [ ] No data clipping or overflow

## Interactivity
- [ ] Touch shows tooltip with values
- [ ] Tooltip displays correct data
- [ ] Tooltip disappears on touch release
- [ ] Chart responds smoothly to touch

## Display Controls
- [ ] Switch to years shows correct x-axis
- [ ] Switch to business days updates x-axis
- [ ] Switch to percent shows rates as %
- [ ] Switch to decimal shows rates as decimal
- [ ] All combinations work correctly

## Legend and Info
- [ ] Legend shows correct colors
- [ ] Legend matches chart colors
- [ ] Method info displays correctly
- [ ] Date displays in Brazilian format
- [ ] R² value displays correctly
- [ ] Contract count is accurate

## Statistics
- [ ] Min rate calculated correctly
- [ ] Max rate calculated correctly
- [ ] Average rate calculated correctly
- [ ] Range calculated correctly
- [ ] RMSE displays correctly
- [ ] R² interpretation shows

## Export/Share
- [ ] Share chart creates image
- [ ] Image quality is good
- [ ] Share dialog opens
- [ ] Export data creates CSV
- [ ] CSV contains all data
- [ ] CSV format is correct

## Navigation
- [ ] Back button returns to home
- [ ] View data button navigates to data screen
- [ ] New analysis returns to home
- [ ] Navigation preserves state

## Error Handling
- [ ] No data shows error message
- [ ] Invalid data handled gracefully
- [ ] Share errors show alert
- [ ] Export errors show alert

## Performance
- [ ] Chart loads in < 2 seconds
- [ ] Interactions are smooth
- [ ] No lag when switching views
- [ ] Memory usage reasonable

## UI/UX
- [ ] Layout works on small screens
- [ ] Layout works on large screens
- [ ] Colors are distinguishable
- [ ] Text is readable
- [ ] Touch targets large enough
- [ ] Scrolling smooth
```

---

## Acceptance Criteria

- ✅ Chart displays yield curve and original points
- ✅ Interactive tooltips show point values
- ✅ Legend clearly identifies curve vs points
- ✅ Statistics calculated and displayed
- ✅ Display controls work (years/days, %/decimal)
- ✅ Method information shown prominently
- ✅ Goodness-of-fit metrics displayed
- ✅ Share chart as image works
- ✅ Export data as CSV works
- ✅ Navigate to data table works
- ✅ Parameters shown when applicable
- ✅ Responsive on different screen sizes
- ✅ Smooth performance with large datasets
- ✅ Error states handled gracefully
- ✅ All text in Portuguese

---

## Performance Optimization

### Data Sampling
```typescript
// For large datasets, sample points for better performance
const samplingFactor = Math.max(1, Math.floor(curveData.length / 200));
const sampledData = curveData.filter((_, i) => i % samplingFactor === 0);
```

### Memoization
```typescript
import { useMemo } from 'react';

const chartData = useMemo(
  () => formatCurveForChart(curvePoints, useYears, usePercent),
  [curvePoints, useYears, usePercent]
);
```

---

## Future Enhancements

1. **Multiple Curve Comparison**
   - Overlay multiple methods
   - Side-by-side comparison
   - Difference visualization

2. **Advanced Interactions**
   - Pinch to zoom
   - Pan to explore
   - Select range for details

3. **Animation**
   - Animate curve drawing
   - Smooth transitions between views

4. **Additional Views**
   - Forward rates
   - Discount factors
   - Spread analysis

---

## Dependencies

```json
{
  "victory-native": "^36.9.2",
  "react-native-svg": "14.1.0",
  "react-native-view-shot": "^3.8.0",
  "expo-sharing": "~12.0.1",
  "expo-file-system": "~17.0.1"
}
```

---

## Next Steps

After Feature 7:
- **Feature 8**: Build Data table screen
- **Feature 9**: Add settings and configuration
- **Feature 10**: Implement error handling

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 7 |