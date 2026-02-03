/**
 * Settings section container with title and icon
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';

interface SettingsSectionProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: ReactNode;
  showDivider?: boolean;
}

export function SettingsSection({
  title,
  icon,
  children,
  showDivider = true,
}: SettingsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={COLORS.primary}
            style={styles.icon}
          />
        )}
        <Text variant="titleSmall" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
      {showDivider && <Divider style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  content: {
    backgroundColor: COLORS.surface,
  },
  divider: {
    marginTop: 8,
  },
});
