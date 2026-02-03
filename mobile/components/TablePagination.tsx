/**
 * Pagination controls for tables
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { PaginationInfo, getPageNumbers } from '../utils/tableUtils';

interface TablePaginationProps {
  info: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function TablePagination({ info, onPageChange }: TablePaginationProps) {
  const { currentPage, totalPages, totalItems, startIndex, endIndex, hasNext, hasPrevious } = info;

  if (totalItems === 0) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages, 5);

  return (
    <View style={styles.container}>
      <Text variant="bodySmall" style={styles.info}>
        Mostrando {startIndex}-{endIndex} de {totalItems}
      </Text>

      <View style={styles.controls}>
        <IconButton
          icon="chevron-left"
          size={20}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          iconColor={hasPrevious ? COLORS.primary : COLORS.textSecondary}
        />

        <View style={styles.pageNumbers}>
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              mode={pageNum === currentPage ? 'contained' : 'text'}
              onPress={() => onPageChange(pageNum)}
              compact
              style={[
                styles.pageButton,
                pageNum === currentPage && styles.activePageButton,
              ]}
              labelStyle={[
                styles.pageButtonLabel,
                pageNum === currentPage && styles.activePageButtonLabel,
              ]}
            >
              {pageNum + 1}
            </Button>
          ))}
        </View>

        <IconButton
          icon="chevron-right"
          size={20}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          iconColor={hasNext ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  info: {
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 2,
  },
  pageButton: {
    minWidth: 32,
    marginHorizontal: 1,
  },
  activePageButton: {
    backgroundColor: COLORS.primary,
  },
  pageButtonLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  activePageButtonLabel: {
    color: COLORS.surface,
  },
});
