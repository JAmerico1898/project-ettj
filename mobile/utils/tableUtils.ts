/**
 * Table utility functions for sorting, filtering, and pagination
 */

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort configuration for a column
 */
export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

/**
 * Column definition for tables
 */
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  numeric?: boolean;
  width?: number;
  format?: (value: T[keyof T], item: T) => string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Sort data by a given key and direction
 */
export function sortData<T>(
  data: T[],
  config: SortConfig<T>
): T[] {
  if (!config.key || !config.direction) {
    return data;
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[config.key!];
    const bVal = b[config.key!];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return config.direction === 'asc' ? -1 : 1;
    if (bVal == null) return config.direction === 'asc' ? 1 : -1;

    // Compare values
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return config.direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Filter data by a search term across specified keys
 */
export function filterData<T>(
  data: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();

  return data.filter((item) =>
    searchKeys.some((key) => {
      const value = item[key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(term);
    })
  );
}

/**
 * Paginate data and return pagination info
 */
export function paginateData<T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number
): { items: T[]; info: PaginationInfo } {
  const totalItems = data.length;
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  // Clamp current page
  const validPage = Math.max(0, Math.min(currentPage, totalPages - 1));

  const startIndex = validPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const items = data.slice(startIndex, endIndex);

  return {
    items,
    info: {
      currentPage: validPage,
      totalPages,
      totalItems,
      startIndex: totalItems > 0 ? startIndex + 1 : 0, // 1-indexed for display
      endIndex,
      hasNext: validPage < totalPages - 1,
      hasPrevious: validPage > 0,
    },
  };
}

/**
 * Calculate total pages
 */
export function getTotalPages(totalItems: number, itemsPerPage: number): number {
  if (totalItems === 0) return 1;
  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Generate array of page numbers to display
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(0, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible);

  // Adjust start if we're near the end
  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible);
  }

  return Array.from({ length: end - start }, (_, i) => start + i);
}

/**
 * Get next sort direction (cycles: null -> asc -> desc -> null)
 */
export function getNextSortDirection(current: SortDirection): SortDirection {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}

/**
 * Default items per page
 */
export const DEFAULT_ITEMS_PER_PAGE = 20;
