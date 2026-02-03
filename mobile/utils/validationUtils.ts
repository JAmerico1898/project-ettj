/**
 * API response validation utilities
 * Validates API responses before using them in the app
 */

import {
  DI1Response,
  DI1Contract,
  CurveResponse,
  CurvePoint,
  WorkflowResponse,
  SmoothingMethod,
} from '../types/api';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create a successful validation result
 */
function valid(): ValidationResult {
  return { isValid: true, errors: [] };
}

/**
 * Create a failed validation result
 */
function invalid(errors: string[]): ValidationResult {
  return { isValid: false, errors };
}

/**
 * Valid smoothing methods
 */
const VALID_METHODS: SmoothingMethod[] = [
  'linear',
  'cubic_spline',
  'akima',
  'pchip',
  'smoothing_spline',
  'nelson_siegel',
  'nelson_siegel_svensson',
];

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string): boolean {
  if (typeof date !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;

  // Check if it's a valid date
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate a DI1 contract object
 */
export function validateDI1Contract(contract: unknown): ValidationResult {
  const errors: string[] = [];

  if (!contract || typeof contract !== 'object') {
    return invalid(['Contract must be an object']);
  }

  const c = contract as Record<string, unknown>;

  if (typeof c.ticker !== 'string' || c.ticker.length === 0) {
    errors.push('Contract must have a valid ticker');
  }

  if (typeof c.maturity_date !== 'string' || !validateDateFormat(c.maturity_date)) {
    errors.push('Contract must have a valid maturity_date');
  }

  if (typeof c.business_days !== 'number' || c.business_days < 0) {
    errors.push('Contract must have valid business_days');
  }

  if (typeof c.rate !== 'number' || isNaN(c.rate)) {
    errors.push('Contract must have a valid rate');
  }

  if (typeof c.rate_percent !== 'number' || isNaN(c.rate_percent)) {
    errors.push('Contract must have a valid rate_percent');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate a DI1Response
 */
export function validateDI1Response(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return invalid(['Response must be an object']);
  }

  const d = data as Record<string, unknown>;

  // Check required fields
  if (typeof d.reference_date !== 'string' || !validateDateFormat(d.reference_date)) {
    errors.push('Response must have a valid reference_date');
  }

  if (typeof d.actual_date !== 'string' || !validateDateFormat(d.actual_date)) {
    errors.push('Response must have a valid actual_date');
  }

  if (typeof d.count !== 'number' || d.count < 0) {
    errors.push('Response must have a valid count');
  }

  // Validate contracts array
  if (!Array.isArray(d.contracts)) {
    errors.push('Response must have a contracts array');
  } else {
    // Validate first few contracts (performance optimization)
    const contractsToValidate = d.contracts.slice(0, 5);
    for (let i = 0; i < contractsToValidate.length; i++) {
      const contractResult = validateDI1Contract(contractsToValidate[i]);
      if (!contractResult.isValid) {
        errors.push(`Invalid contract at index ${i}: ${contractResult.errors.join(', ')}`);
      }
    }

    // Check count matches
    if (d.count !== d.contracts.length) {
      errors.push(`Count mismatch: expected ${d.count}, got ${d.contracts.length}`);
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate a CurvePoint
 */
export function validateCurvePoint(point: unknown): ValidationResult {
  const errors: string[] = [];

  if (!point || typeof point !== 'object') {
    return invalid(['Point must be an object']);
  }

  const p = point as Record<string, unknown>;

  if (typeof p.business_days !== 'number' || p.business_days < 0) {
    errors.push('Point must have valid business_days');
  }

  if (typeof p.years !== 'number' || p.years < 0) {
    errors.push('Point must have valid years');
  }

  if (typeof p.rate !== 'number' || isNaN(p.rate)) {
    errors.push('Point must have a valid rate');
  }

  if (typeof p.rate_percent !== 'number' || isNaN(p.rate_percent)) {
    errors.push('Point must have a valid rate_percent');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate a CurveResponse
 */
export function validateCurveResponse(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return invalid(['Response must be an object']);
  }

  const d = data as Record<string, unknown>;

  // Check required fields
  if (typeof d.reference_date !== 'string' || !validateDateFormat(d.reference_date)) {
    errors.push('Response must have a valid reference_date');
  }

  if (typeof d.method !== 'string' || !VALID_METHODS.includes(d.method as SmoothingMethod)) {
    errors.push('Response must have a valid method');
  }

  if (typeof d.method_name !== 'string') {
    errors.push('Response must have a method_name');
  }

  if (typeof d.method_type !== 'string') {
    errors.push('Response must have a method_type');
  }

  // Validate original_points array
  if (!Array.isArray(d.original_points)) {
    errors.push('Response must have an original_points array');
  } else if (d.original_points.length > 0) {
    const pointResult = validateCurvePoint(d.original_points[0]);
    if (!pointResult.isValid) {
      errors.push(`Invalid original_points: ${pointResult.errors.join(', ')}`);
    }
  }

  // Validate curve_points array
  if (!Array.isArray(d.curve_points)) {
    errors.push('Response must have a curve_points array');
  } else if (d.curve_points.length > 0) {
    const pointResult = validateCurvePoint(d.curve_points[0]);
    if (!pointResult.isValid) {
      errors.push(`Invalid curve_points: ${pointResult.errors.join(', ')}`);
    }
  }

  // Validate metrics
  if (!d.metrics || typeof d.metrics !== 'object') {
    errors.push('Response must have metrics');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Validate a WorkflowResponse
 */
export function validateWorkflowResponse(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return invalid(['Response must be an object']);
  }

  const d = data as Record<string, unknown>;

  // Check required fields
  if (typeof d.reference_date !== 'string' || !validateDateFormat(d.reference_date)) {
    errors.push('Response must have a valid reference_date');
  }

  if (typeof d.actual_date !== 'string' || !validateDateFormat(d.actual_date)) {
    errors.push('Response must have a valid actual_date');
  }

  if (typeof d.method !== 'string' || !VALID_METHODS.includes(d.method as SmoothingMethod)) {
    errors.push('Response must have a valid method');
  }

  if (typeof d.method_name !== 'string') {
    errors.push('Response must have a method_name');
  }

  if (typeof d.method_type !== 'string') {
    errors.push('Response must have a method_type');
  }

  if (typeof d.contracts_count !== 'number' || d.contracts_count < 0) {
    errors.push('Response must have a valid contracts_count');
  }

  // Validate original_points array
  if (!Array.isArray(d.original_points)) {
    errors.push('Response must have an original_points array');
  } else if (d.original_points.length === 0) {
    errors.push('original_points cannot be empty');
  }

  // Validate curve_points array
  if (!Array.isArray(d.curve_points)) {
    errors.push('Response must have a curve_points array');
  } else if (d.curve_points.length === 0) {
    errors.push('curve_points cannot be empty');
  }

  // Validate metrics
  if (!d.metrics || typeof d.metrics !== 'object') {
    errors.push('Response must have metrics');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * Check if data has minimum required contracts
 */
export function hasMinimumData(contracts: DI1Contract[], minContracts: number = 3): boolean {
  return Array.isArray(contracts) && contracts.length >= minContracts;
}

/**
 * Check if curve points are monotonic (increasing business days)
 */
export function isMonotonicCurve(points: CurvePoint[]): boolean {
  if (!Array.isArray(points) || points.length < 2) {
    return true;
  }

  for (let i = 1; i < points.length; i++) {
    if (points[i].business_days <= points[i - 1].business_days) {
      return false;
    }
  }

  return true;
}

/**
 * Validate that rates are within reasonable bounds
 * Brazilian DI rates typically range from -2% to 50%
 */
export function areRatesReasonable(
  points: Array<{ rate_percent: number }>,
  minRate: number = -2,
  maxRate: number = 50
): boolean {
  if (!Array.isArray(points)) return false;

  return points.every((p) => {
    const rate = p.rate_percent;
    return typeof rate === 'number' && rate >= minRate && rate <= maxRate;
  });
}

/**
 * Sanitize response data by removing NaN and Infinity values
 */
export function sanitizeNumericValues<T extends object>(data: T): T {
  const sanitize = (value: unknown): unknown => {
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return 0;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = sanitize(v);
      }
      return result;
    }
    return value;
  };

  return sanitize(data) as T;
}
