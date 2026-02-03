/**
 * CategoryFilter - Horizontal chip filter bar
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { useSettings } from '../../context/SettingsContext';

interface CategoryItem {
  key: string;
  label: string;
  icon?: string;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  allLabel?: string;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  allLabel = 'Todos',
}: CategoryFilterProps) {
  const { isDarkMode } = useSettings();

  const colors = {
    selectedBg: '#1976D2',
    selectedText: '#FFFFFF',
    unselectedBg: isDarkMode ? '#2C2C2C' : '#F5F5F5',
    unselectedText: isDarkMode ? '#FFFFFF' : '#000000',
  };

  const handlePress = (key: string | null) => {
    onSelectCategory(key === selectedCategory ? null : key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All" chip */}
      <Chip
        mode="flat"
        selected={selectedCategory === null}
        onPress={() => handlePress(null)}
        style={[
          styles.chip,
          {
            backgroundColor: selectedCategory === null ? colors.selectedBg : colors.unselectedBg,
          },
        ]}
        textStyle={{
          color: selectedCategory === null ? colors.selectedText : colors.unselectedText,
        }}
      >
        {allLabel}
      </Chip>

      {/* Category chips */}
      {categories.map((category) => (
        <Chip
          key={category.key}
          mode="flat"
          selected={selectedCategory === category.key}
          onPress={() => handlePress(category.key)}
          icon={category.icon}
          style={[
            styles.chip,
            {
              backgroundColor:
                selectedCategory === category.key ? colors.selectedBg : colors.unselectedBg,
            },
          ]}
          textStyle={{
            color:
              selectedCategory === category.key ? colors.selectedText : colors.unselectedText,
          }}
        >
          {category.label}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
});
