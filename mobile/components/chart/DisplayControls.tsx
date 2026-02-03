/**
 * Display mode controls for chart (years/days, percent/decimal)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { COLORS } from '../../constants/config';
import { XAxisMode, YAxisMode } from '../../utils/chartUtils';

interface DisplayControlsProps {
  xMode: XAxisMode;
  yMode: YAxisMode;
  onXModeChange: (mode: XAxisMode) => void;
  onYModeChange: (mode: YAxisMode) => void;
}

export function DisplayControls({
  xMode,
  yMode,
  onXModeChange,
  onYModeChange,
}: DisplayControlsProps) {
  return (
    <View style={styles.container}>
      {/* X-Axis Control */}
      <View style={styles.controlGroup}>
        <Text variant="labelSmall" style={styles.label}>
          Eixo X
        </Text>
        <SegmentedButtons
          value={xMode}
          onValueChange={(value) => onXModeChange(value as XAxisMode)}
          buttons={[
            { value: 'years', label: 'Anos' },
            { value: 'days', label: 'Dias' },
          ]}
          style={styles.segmented}
          density="small"
        />
      </View>

      {/* Y-Axis Control */}
      <View style={styles.controlGroup}>
        <Text variant="labelSmall" style={styles.label}>
          Eixo Y
        </Text>
        <SegmentedButtons
          value={yMode}
          onValueChange={(value) => onYModeChange(value as YAxisMode)}
          buttons={[
            { value: 'percent', label: '%' },
            { value: 'decimal', label: 'Decimal' },
          ]}
          style={styles.segmented}
          density="small"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    gap: 16,
  },
  controlGroup: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  segmented: {
    maxWidth: 160,
  },
});
