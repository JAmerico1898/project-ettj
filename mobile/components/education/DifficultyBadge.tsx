/**
 * DifficultyBadge - Beginner/Intermediate/Advanced chip
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { DifficultyLevel, DIFFICULTY_LABELS } from '../../constants/educationalContent';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  size?: 'small' | 'medium';
}

export function DifficultyBadge({ difficulty, size = 'small' }: DifficultyBadgeProps) {
  const { label, color } = DIFFICULTY_LABELS[difficulty];

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '20',
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        variant={isSmall ? 'labelSmall' : 'labelMedium'}
        style={[styles.text, { color }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
