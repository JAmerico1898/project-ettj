/**
 * Search input for table filtering
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { COLORS } from '../constants/config';

interface TableSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export function TableSearch({
  value,
  onChangeText,
  onClear,
  placeholder = 'Buscar...',
}: TableSearchProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onClearIconPress={handleClear}
      style={styles.searchbar}
      inputStyle={styles.input}
      iconColor={COLORS.primary}
    />
  );
}

const styles = StyleSheet.create({
  searchbar: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    elevation: 1,
  },
  input: {
    fontSize: 14,
  },
});
