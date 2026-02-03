/**
 * TutorialProgress - Progress dots indicator for tutorial
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettings } from '../../context/SettingsContext';

interface TutorialProgressProps {
  total: number;
  current: number;
}

export function TutorialProgress({ total, current }: TutorialProgressProps) {
  const { isDarkMode } = useSettings();

  const colors = {
    active: '#1976D2',
    inactive: isDarkMode ? '#424242' : '#E0E0E0',
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === current ? colors.active : colors.inactive,
              width: index === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
