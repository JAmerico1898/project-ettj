/**
 * Clipboard utility functions
 */

import * as Clipboard from 'expo-clipboard';
import { TableColumn } from './tableUtils';

/**
 * Copy a single text value to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Copy table data to clipboard in TSV format (tab-separated values)
 * TSV works well with spreadsheet applications like Excel
 */
export async function copyTableToClipboard<T>(
  data: T[],
  columns: TableColumn<T>[]
): Promise<boolean> {
  try {
    // Create header row
    const headers = columns.map((col) => col.label);

    // Create data rows
    const rows = data.map((item) =>
      columns.map((col) => {
        const value = item[col.key];
        if (col.format) {
          return col.format(value, item);
        }
        return value != null ? String(value) : '';
      })
    );

    // Join with tabs for TSV format
    const tsvContent = [
      headers.join('\t'),
      ...rows.map((row) => row.join('\t')),
    ].join('\n');

    await Clipboard.setStringAsync(tsvContent);
    return true;
  } catch (error) {
    console.error('Failed to copy table to clipboard:', error);
    return false;
  }
}

/**
 * Get current clipboard content
 */
export async function getClipboardContent(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch (error) {
    console.error('Failed to get clipboard content:', error);
    return '';
  }
}
