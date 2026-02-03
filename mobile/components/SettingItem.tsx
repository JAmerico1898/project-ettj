/**
 * Individual setting row component
 * Supports navigation, toggle, and info display types
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/config';

type SettingItemType = 'navigation' | 'toggle' | 'info' | 'action';

interface BaseSettingItemProps {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
}

interface NavigationSettingItemProps extends BaseSettingItemProps {
  type: 'navigation';
  value?: string;
  onPress: () => void;
}

interface ToggleSettingItemProps extends BaseSettingItemProps {
  type: 'toggle';
  value: boolean;
  onToggle: (value: boolean) => void;
}

interface InfoSettingItemProps extends BaseSettingItemProps {
  type: 'info';
  value: string;
}

interface ActionSettingItemProps extends BaseSettingItemProps {
  type: 'action';
  actionLabel?: string;
  onPress: () => void;
  destructive?: boolean;
}

type SettingItemProps =
  | NavigationSettingItemProps
  | ToggleSettingItemProps
  | InfoSettingItemProps
  | ActionSettingItemProps;

export function SettingItem(props: SettingItemProps) {
  const { title, description, icon, disabled = false, type } = props;

  const renderContent = () => {
    switch (type) {
      case 'navigation': {
        const { value, onPress } = props as NavigationSettingItemProps;
        return (
          <TouchableOpacity
            style={[styles.container, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
          >
            {renderLeft()}
            <View style={styles.right}>
              {value && (
                <Text variant="bodyMedium" style={styles.value}>
                  {value}
                </Text>
              )}
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={COLORS.textSecondary}
              />
            </View>
          </TouchableOpacity>
        );
      }

      case 'toggle': {
        const { value, onToggle } = props as ToggleSettingItemProps;
        return (
          <View style={[styles.container, disabled && styles.disabled]}>
            {renderLeft()}
            <Switch
              value={value}
              onValueChange={onToggle}
              disabled={disabled}
              color={COLORS.primary}
            />
          </View>
        );
      }

      case 'info': {
        const { value } = props as InfoSettingItemProps;
        return (
          <View style={[styles.container, disabled && styles.disabled]}>
            {renderLeft()}
            <Text variant="bodyMedium" style={styles.infoValue}>
              {value}
            </Text>
          </View>
        );
      }

      case 'action': {
        const { onPress, destructive } = props as ActionSettingItemProps;
        return (
          <TouchableOpacity
            style={[styles.container, disabled && styles.disabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
          >
            {renderLeft(destructive)}
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={destructive ? COLORS.error : COLORS.textSecondary}
            />
          </TouchableOpacity>
        );
      }

      default:
        return null;
    }
  };

  const renderLeft = (destructive = false) => (
    <View style={styles.left}>
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={destructive ? COLORS.error : COLORS.textSecondary}
          style={styles.icon}
        />
      )}
      <View style={styles.textContainer}>
        <Text
          variant="bodyLarge"
          style={[styles.title, destructive && styles.destructiveText]}
        >
          {title}
        </Text>
        {description && (
          <Text variant="bodySmall" style={styles.description}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
  },
  destructiveText: {
    color: COLORS.error,
  },
  description: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  infoValue: {
    color: COLORS.textSecondary,
  },
});
