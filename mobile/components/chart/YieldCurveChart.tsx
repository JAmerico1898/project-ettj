/**
 * Main yield curve chart component using react-native-chart-kit
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle } from 'react-native-svg';
import { CurvePoint } from '../../types';
import { COLORS, CHART_CONFIG } from '../../constants/config';
import { XAxisMode, YAxisMode } from '../../utils/chartUtils';

const screenWidth = Dimensions.get('window').width;
const CHART_PADDING_LEFT = 64; // Approximate padding for y-axis labels
const CHART_PADDING_RIGHT = 16;
const CHART_HEIGHT = 220;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 40; // Space for x-axis labels

interface YieldCurveChartProps {
  curvePoints: CurvePoint[];
  originalPoints: CurvePoint[];
  xMode: XAxisMode;
  yMode: YAxisMode;
}

export function YieldCurveChart({
  curvePoints,
  originalPoints,
  xMode,
  yMode,
}: YieldCurveChartProps) {
  if (curvePoints.length === 0) {
    return null;
  }

  const chartWidth = screenWidth - 32;

  // Prepare data for the chart
  const getRateValue = (point: CurvePoint) =>
    yMode === 'percent' ? point.rate_percent : point.rate;

  // Sample points for labels (max 6 to avoid clutter)
  const labelStep = Math.max(1, Math.floor(curvePoints.length / 6));
  const labels: string[] = [];

  for (let i = 0; i < curvePoints.length; i += labelStep) {
    const point = curvePoints[i];
    if (xMode === 'years') {
      const years = point.years;
      if (years < 1) {
        labels.push(`${Math.round(years * 12)}M`);
      } else {
        labels.push(`${years.toFixed(1)}A`);
      }
    } else {
      labels.push(`${point.business_days}`);
    }
  }

  // Add last label if not already included
  const lastPoint = curvePoints[curvePoints.length - 1];
  const lastLabel = xMode === 'years'
    ? (lastPoint.years < 1 ? `${Math.round(lastPoint.years * 12)}M` : `${lastPoint.years.toFixed(1)}A`)
    : `${lastPoint.business_days}`;

  if (labels[labels.length - 1] !== lastLabel) {
    labels.push(lastLabel);
  }

  // Sample curve data to match labels
  const curveData: number[] = [];
  for (let i = 0; i < curvePoints.length; i += labelStep) {
    curveData.push(getRateValue(curvePoints[i]));
  }
  if (curveData.length < labels.length) {
    curveData.push(getRateValue(lastPoint));
  }

  // Create chart data
  const chartData = {
    labels,
    datasets: [
      {
        data: curveData,
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Calculate Y axis bounds for positioning original points
  const allRates = [...curvePoints, ...originalPoints].map(getRateValue);
  const minY = Math.min(...allRates);
  const maxY = Math.max(...allRates);

  // X-axis bounds (business days)
  const minX = curvePoints[0].business_days;
  const maxX = curvePoints[curvePoints.length - 1].business_days;

  // Chart drawing area dimensions
  const drawingWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const drawingHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Function to convert data coordinates to pixel coordinates
  const dataToPixel = (businessDays: number, rate: number) => {
    const xRatio = (businessDays - minX) / (maxX - minX);
    const yRatio = (rate - minY) / (maxY - minY);

    const x = CHART_PADDING_LEFT + xRatio * drawingWidth;
    const y = CHART_PADDING_TOP + (1 - yRatio) * drawingHeight; // Invert Y axis

    return { x, y };
  };

  // Decorator to render original points as orange circles
  const renderDecorator = () => {
    return originalPoints.map((point, index) => {
      const rate = getRateValue(point);
      const { x, y } = dataToPixel(point.business_days, rate);

      return (
        <Circle
          key={`original-${index}`}
          cx={x}
          cy={y}
          r={5}
          fill="#FF5722"
          stroke="#FFFFFF"
          strokeWidth={1}
        />
      );
    });
  };

  const chartConfig = {
    ...CHART_CONFIG,
    decimalPlaces: yMode === 'percent' ? 2 : 4,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={chartWidth}
        height={CHART_HEIGHT}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={false}
        fromZero={false}
        yAxisSuffix={yMode === 'percent' ? '%' : ''}
        yAxisInterval={1}
        segments={5}
        decorator={renderDecorator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
});
