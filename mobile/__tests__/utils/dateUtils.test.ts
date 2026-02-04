/**
 * Tests for date utility functions
 */

import {
  formatDateBR,
  formatDateISO,
  parseDateBR,
  validateDateRange,
  isBusinessDay,
} from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDateBR', () => {
    it('should format date in Brazilian format (DD/MM/YYYY)', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDateBR(date)).toBe('15/01/2024');
    });

    it('should pad single digit day and month', () => {
      const date = new Date(2024, 5, 5); // June 5, 2024
      expect(formatDateBR(date)).toBe('05/06/2024');
    });
  });

  describe('formatDateISO', () => {
    it('should format date in ISO format (YYYY-MM-DD)', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDateISO(date)).toBe('2024-01-15');
    });
  });

  describe('parseDateBR', () => {
    it('should parse Brazilian date format', () => {
      const result = parseDateBR('15/01/2024');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for invalid format', () => {
      expect(parseDateBR('invalid')).toBeNull();
      expect(parseDateBR('2024-01-15')).toBeNull();
      expect(parseDateBR('01/32/2024')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDateBR('')).toBeNull();
    });
  });

  describe('validateDateRange', () => {
    it('should accept dates within valid range', () => {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() - 5); // 5 days ago
      const result = validateDateRange(validDate);
      expect(result.isValid).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const result = validateDateRange(futureDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('futura');
    });

    it('should reject dates too far in the past', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 15);
      const result = validateDateRange(oldDate);
      expect(result.isValid).toBe(false);
    });

    it('should accept null date (uses server default)', () => {
      const result = validateDateRange(null);
      expect(result.isValid).toBe(true);
    });
  });

  describe('isBusinessDay', () => {
    it('should return true for weekdays', () => {
      // Monday, January 15, 2024
      expect(isBusinessDay(new Date(2024, 0, 15))).toBe(true);
      // Friday, January 19, 2024
      expect(isBusinessDay(new Date(2024, 0, 19))).toBe(true);
    });

    it('should return false for weekends', () => {
      // Saturday, January 13, 2024
      expect(isBusinessDay(new Date(2024, 0, 13))).toBe(false);
      // Sunday, January 14, 2024
      expect(isBusinessDay(new Date(2024, 0, 14))).toBe(false);
    });
  });
});
