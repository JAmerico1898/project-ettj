/**
 * Tests for validation utility functions
 */

import {
  validateMethodSelection,
  validateParameters,
  combineValidationResults,
  METHOD_DISPLAY_NAMES,
  VALID_METHODS,
  methodHasParameters,
} from '../../utils/validation';

describe('validation', () => {
  describe('validateMethodSelection', () => {
    it('should accept valid methods', () => {
      VALID_METHODS.forEach((method) => {
        const result = validateMethodSelection(method);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid methods', () => {
      const result = validateMethodSelection('invalid_method' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should have display names for all valid methods', () => {
      VALID_METHODS.forEach((method) => {
        expect(METHOD_DISPLAY_NAMES[method]).toBeDefined();
        expect(METHOD_DISPLAY_NAMES[method].length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateParameters', () => {
    it('should validate smoothing_spline parameters', () => {
      const result = validateParameters('smoothing_spline', {
        smoothingParameter: 0.5,
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid smoothing parameter range', () => {
      const resultTooHigh = validateParameters('smoothing_spline', {
        smoothingParameter: 1.5,
      });
      expect(resultTooHigh.isValid).toBe(false);

      const resultTooLow = validateParameters('smoothing_spline', {
        smoothingParameter: -0.1,
      });
      expect(resultTooLow.isValid).toBe(false);
    });

    it('should accept methods without parameters', () => {
      const result = validateParameters('nelson_siegel', {});
      expect(result.isValid).toBe(true);
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple valid results', () => {
      const results = [
        { isValid: true, errors: [] },
        { isValid: true, errors: [] },
      ];
      const combined = combineValidationResults(results);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should combine mixed results', () => {
      const results = [
        { isValid: true, errors: [] },
        { isValid: false, errors: ['Error 1'] },
        { isValid: false, errors: ['Error 2'] },
      ];
      const combined = combineValidationResults(results);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toContain('Error 1');
      expect(combined.errors).toContain('Error 2');
    });
  });

  describe('methodHasParameters', () => {
    it('should return true for smoothing_spline', () => {
      expect(methodHasParameters('smoothing_spline')).toBe(true);
    });

    it('should return false for parametric methods', () => {
      expect(methodHasParameters('nelson_siegel')).toBe(false);
      expect(methodHasParameters('nelson_siegel_svensson')).toBe(false);
    });

    it('should return false for simple interpolation methods', () => {
      expect(methodHasParameters('linear')).toBe(false);
      expect(methodHasParameters('cubic_spline')).toBe(false);
    });
  });
});
