/**
 * Chart utility functions for data formatting and statistics calculation
 */

import { CurvePoint, DI1Contract } from '../types';
import { BUSINESS_DAYS_PER_YEAR } from '../constants/config';

/**
 * Chart statistics interface
 */
export interface ChartStats {
  minRate: number;
  maxRate: number;
  avgRate: number;
  range: number;
}

/**
 * Display mode options
 */
export type XAxisMode = 'years' | 'days';
export type YAxisMode = 'percent' | 'decimal';

/**
 * Calculate statistics from curve points
 */
export function calculateChartStats(points: CurvePoint[]): ChartStats {
  if (points.length === 0) {
    return { minRate: 0, maxRate: 0, avgRate: 0, range: 0 };
  }

  const rates = points.map((p) => p.rate_percent);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const range = maxRate - minRate;

  return { minRate, maxRate, avgRate, range };
}

/**
 * Format rate value based on display mode
 */
export function formatRate(rate: number, mode: YAxisMode): string {
  if (mode === 'percent') {
    return `${rate.toFixed(2)}%`;
  }
  return (rate / 100).toFixed(4);
}

/**
 * Format x-axis value based on display mode
 */
export function formatXValue(businessDays: number, mode: XAxisMode): string {
  if (mode === 'years') {
    const years = businessDays / BUSINESS_DAYS_PER_YEAR;
    if (years < 1) {
      const months = Math.round(years * 12);
      return `${months}M`;
    }
    return `${years.toFixed(1)}A`;
  }
  return `${businessDays}`;
}

/**
 * Generate x-axis labels for the chart
 */
export function generateXLabels(points: CurvePoint[], mode: XAxisMode, maxLabels: number = 6): string[] {
  if (points.length === 0) return [];

  // Select evenly spaced points for labels
  const step = Math.max(1, Math.floor(points.length / maxLabels));
  const labels: string[] = [];

  for (let i = 0; i < points.length; i += step) {
    labels.push(formatXValue(points[i].business_days, mode));
  }

  // Always include the last point
  const lastLabel = formatXValue(points[points.length - 1].business_days, mode);
  if (labels[labels.length - 1] !== lastLabel) {
    labels.push(lastLabel);
  }

  return labels;
}

/**
 * Prepare chart data for react-native-chart-kit LineChart
 */
export function prepareChartData(
  curvePoints: CurvePoint[],
  originalPoints: CurvePoint[],
  xMode: XAxisMode,
  yMode: YAxisMode
) {
  // Get rates based on display mode
  const getCurveRates = () =>
    curvePoints.map((p) => (yMode === 'percent' ? p.rate_percent : p.rate));

  const getOriginalRates = () =>
    originalPoints.map((p) => (yMode === 'percent' ? p.rate_percent : p.rate));

  // Sample curve points for labels (too many would clutter the axis)
  const labels = generateXLabels(curvePoints, xMode, 6);

  return {
    labels,
    datasets: [
      {
        data: getCurveRates(),
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`, // Primary blue
        strokeWidth: 2,
      },
      {
        data: getOriginalRates(),
        color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`, // Orange
        strokeWidth: 0, // No line, only dots
        withDots: true,
      },
    ],
    legend: ['Curva Suavizada', 'Pontos Originais'],
  };
}

/**
 * Metric label translations (Portuguese)
 */
const METRIC_LABELS: Record<string, string> = {
  r_squared: 'R\u00B2',
  rmse: 'RMSE',
  rmse_percent: 'RMSE (%)',
  mae: 'MAE',
  mae_percent: 'MAE (%)',
  max_error: 'Erro M\u00E1x',
  max_error_percent: 'Erro M\u00E1x (%)',
  computation_time_ms: 'Tempo (ms)',
  beta0: '\u03B20 (n\u00EDvel)',
  beta1: '\u03B21 (inclina\u00E7\u00E3o)',
  beta2: '\u03B22 (curvatura)',
  beta3: '\u03B23 (curvatura 2)',
  lambda1: '\u03BB1',
  lambda2: '\u03BB2',
};

/**
 * Get display label for a metric key
 */
export function formatMetricLabel(key: string): string {
  return METRIC_LABELS[key] || key;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(key: string, value: number): string {
  // R-squared: show as percentage
  if (key === 'r_squared') {
    return `${(value * 100).toFixed(2)}%`;
  }

  // Percentage metrics
  if (key.includes('percent')) {
    return `${value.toFixed(4)}%`;
  }

  // Time metrics
  if (key.includes('time')) {
    return `${value.toFixed(0)} ms`;
  }

  // Beta and lambda parameters
  if (key.startsWith('beta') || key.startsWith('lambda')) {
    return value.toFixed(4);
  }

  // Default: 4 decimal places
  return value.toFixed(4);
}

/**
 * Filter metrics for display (exclude internal ones)
 */
export function filterDisplayMetrics(metrics: Record<string, number>): Record<string, number> {
  const excludeKeys = ['computation_time_ms'];
  return Object.fromEntries(
    Object.entries(metrics).filter(([key]) => !excludeKeys.includes(key))
  );
}

/**
 * Get primary metrics for display (R2, RMSE, MAE)
 */
export function getPrimaryMetrics(metrics: Record<string, number>): Record<string, number> {
  const primaryKeys = ['r_squared', 'rmse_percent', 'mae_percent', 'max_error_percent'];
  return Object.fromEntries(
    Object.entries(metrics).filter(([key]) => primaryKeys.includes(key))
  );
}

/**
 * Convert curve data to CSV format
 */
export function curveToCSV(
  curvePoints: CurvePoint[],
  originalPoints: CurvePoint[],
  method: string,
  date: string
): string {
  const lines: string[] = [];

  // Header
  lines.push('# ETTJ DI1 - Curva de Juros');
  lines.push(`# Data: ${date}`);
  lines.push(`# Metodo: ${method}`);
  lines.push('');

  // Curve points section
  lines.push('## Curva Suavizada');
  lines.push('dias_uteis,anos,taxa,taxa_percent');
  curvePoints.forEach((p) => {
    lines.push(`${p.business_days},${p.years.toFixed(4)},${p.rate.toFixed(6)},${p.rate_percent.toFixed(4)}`);
  });

  lines.push('');

  // Original points section
  lines.push('## Pontos Originais');
  lines.push('dias_uteis,anos,taxa,taxa_percent');
  originalPoints.forEach((p) => {
    lines.push(`${p.business_days},${p.years.toFixed(4)},${p.rate.toFixed(6)},${p.rate_percent.toFixed(4)}`);
  });

  return lines.join('\n');
}

/**
 * Format business days to years string
 */
export function businessDaysToYears(days: number): string {
  const years = days / BUSINESS_DAYS_PER_YEAR;
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} meses`;
  }
  return `${years.toFixed(1)} anos`;
}

/**
 * Convert DI1 contracts data to CSV format
 */
export function contractsToCSV(contracts: DI1Contract[], date: string): string {
  const lines: string[] = [];

  // Header
  lines.push('# ETTJ DI1 - Contratos');
  lines.push(`# Data: ${date}`);
  lines.push(`# Total: ${contracts.length} contratos`);
  lines.push('');

  // CSV header
  lines.push('ticker,vencimento,dias_uteis,taxa,taxa_percent');

  // Data rows
  contracts.forEach((c) => {
    lines.push(
      `${c.ticker},${c.maturity_date},${c.business_days},${c.rate.toFixed(6)},${c.rate_percent.toFixed(4)}`
    );
  });

  return lines.join('\n');
}
