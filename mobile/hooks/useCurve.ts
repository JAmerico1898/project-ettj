/**
 * Hooks for calculating yield curves
 */

import { useCallback, useMemo } from 'react';
import { useApi, UseApiOptions } from './useApi';
import { apiClient } from '../services/api';
import { CurveRequest, CurveResponse, CurvePoint, DI1Contract, SmoothingMethod } from '../types';

/**
 * Options for curve calculation hook
 */
export interface UseCurveOptions extends UseApiOptions<CurveResponse> {}

/**
 * Hook for calculating smoothed yield curves
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { data, loading, error, calculateCurve } = useCurve();
 *
 * // Calculate curve with contracts and method
 * await calculateCurve({
 *   reference_date: '2024-01-15',
 *   method: 'nelson_siegel_svensson',
 *   contracts: di1Contracts,
 * });
 * ```
 */
export function useCurve(options: UseCurveOptions = {}) {
  const result = useApi<CurveResponse, [CurveRequest]>(
    (request: CurveRequest) => apiClient.calculateCurve(request),
    options
  );

  return {
    ...result,
    /** Calculate a curve */
    calculateCurve: result.execute,
    /** The calculated curve points */
    points: result.data?.points ?? [],
    /** The method used */
    method: result.data?.method ?? null,
    /** Model parameters (for parametric methods) */
    parameters: result.data?.parameters ?? null,
    /** Reference date */
    referenceDate: result.data?.reference_date ?? null,
  };
}

/**
 * Simplified hook for curve calculation with individual parameters
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * const { points, loading, calculate } = useSimpleCurve();
 *
 * // Calculate with individual params
 * await calculate(contracts, 'nelson_siegel', '2024-01-15');
 * ```
 */
export function useSimpleCurve(options: UseCurveOptions = {}) {
  const apiFunction = useCallback(
    (
      contracts: DI1Contract[],
      method: SmoothingMethod,
      referenceDate: string,
      smoothingParameter?: number
    ) => {
      const request: CurveRequest = {
        reference_date: referenceDate,
        method,
        contracts,
        smoothing_parameter: smoothingParameter,
      };
      return apiClient.calculateCurve(request);
    },
    []
  );

  const result = useApi<
    CurveResponse,
    [DI1Contract[], SmoothingMethod, string, number?]
  >(apiFunction, options);

  return {
    ...result,
    /** Calculate curve with individual parameters */
    calculate: result.execute,
    /** The calculated curve points */
    points: result.data?.points ?? [],
    /** The method used */
    method: result.data?.method ?? null,
    /** Model parameters */
    parameters: result.data?.parameters ?? null,
    /** Reference date */
    referenceDate: result.data?.reference_date ?? null,
  };
}

/**
 * Transform curve points for charting
 */
export function useCurveChartData(points: CurvePoint[]) {
  return useMemo(() => {
    if (!points.length) {
      return {
        labels: [] as string[],
        data: [] as number[],
        xValues: [] as number[],
        yValues: [] as number[],
      };
    }

    // Sample points for chart display (too many points makes chart unreadable)
    const maxPoints = 50;
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    const sampledPoints = points.filter((_, i) => i % step === 0);

    // Format business days as labels (e.g., "6M", "1Y", "2Y")
    const formatLabel = (bd: number): string => {
      const years = bd / 252;
      if (years < 1) {
        const months = Math.round(bd / 21);
        return `${months}M`;
      }
      return `${years.toFixed(1)}Y`;
    };

    return {
      /** Labels for x-axis (formatted business days) */
      labels: sampledPoints.map((p) => formatLabel(p.business_days)),
      /** Rate values in percentage */
      data: sampledPoints.map((p) => p.rate_percent),
      /** Raw business days values */
      xValues: sampledPoints.map((p) => p.business_days),
      /** Raw rate percentage values */
      yValues: sampledPoints.map((p) => p.rate_percent),
    };
  }, [points]);
}

/**
 * Find interpolated rate for a specific business day
 */
export function useInterpolatedRate(points: CurvePoint[], businessDays: number): number | null {
  return useMemo(() => {
    if (!points.length || businessDays < 0) return null;

    // Find surrounding points
    let lower: CurvePoint | null = null;
    let upper: CurvePoint | null = null;

    for (const point of points) {
      if (point.business_days <= businessDays) {
        lower = point;
      }
      if (point.business_days >= businessDays && !upper) {
        upper = point;
        break;
      }
    }

    // Exact match
    if (lower && lower.business_days === businessDays) {
      return lower.rate_percent;
    }

    // Interpolate between lower and upper
    if (lower && upper && lower !== upper) {
      const t = (businessDays - lower.business_days) / (upper.business_days - lower.business_days);
      return lower.rate_percent + t * (upper.rate_percent - lower.rate_percent);
    }

    // Extrapolate (use nearest point)
    if (lower) return lower.rate_percent;
    if (upper) return upper.rate_percent;

    return null;
  }, [points, businessDays]);
}
