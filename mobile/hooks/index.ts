/**
 * React hooks for ETTJ mobile app
 * Re-exports all hooks for convenient importing
 */

// Generic API hook
export {
  useApi,
  useApiOnMount,
  useLazyApi,
  type UseApiState,
  type UseApiActions,
  type UseApiReturn,
  type UseApiOptions,
} from './useApi';

// DI1 data hooks
export {
  useDI1Data,
  useDI1DataOnMount,
  useDI1Summary,
  useDI1SummaryOnMount,
  type UseDI1DataOptions,
  type UseDI1SummaryOptions,
} from './useDI1Data';

// Curve calculation hooks
export {
  useCurve,
  useSimpleCurve,
  useCurveChartData,
  useInterpolatedRate,
  type UseCurveOptions,
} from './useCurve';

// Workflow hooks
export {
  useWorkflow,
  useSimpleWorkflow,
  useWorkflowOnMount,
  useCompareMethods,
  useSimpleCompareMethods,
  type UseWorkflowOptions,
  type UseCompareMethodsOptions,
} from './useWorkflow';

// Network status hooks
export {
  useNetworkStatus,
  useIsOnline,
  useOfflineDetection,
  type NetworkStatus,
  type UseNetworkStatusReturn,
} from './useNetworkStatus';
