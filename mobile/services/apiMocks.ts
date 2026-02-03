/**
 * Mock data for testing the API client without a backend
 */

import {
  DI1Response,
  DI1Contract,
  CurveResponse,
  CurvePoint,
  MethodInfo,
  HealthResponse,
  DetailedHealthResponse,
  APIInfoResponse,
  WorkflowResponse,
  CompareMethodsResponse,
  DI1SummaryResponse,
  SmoothingMethod,
} from '../types';

/**
 * Mock DI1 contracts
 */
export const MOCK_DI1_CONTRACTS: DI1Contract[] = [
  { ticker: 'DI1F25', maturity_date: '2025-01-02', business_days: 21, rate: 0.1134, rate_percent: 11.34 },
  { ticker: 'DI1G25', maturity_date: '2025-02-03', business_days: 42, rate: 0.1145, rate_percent: 11.45 },
  { ticker: 'DI1H25', maturity_date: '2025-03-03', business_days: 63, rate: 0.1156, rate_percent: 11.56 },
  { ticker: 'DI1J25', maturity_date: '2025-04-01', business_days: 84, rate: 0.1167, rate_percent: 11.67 },
  { ticker: 'DI1K25', maturity_date: '2025-05-02', business_days: 105, rate: 0.1178, rate_percent: 11.78 },
  { ticker: 'DI1M25', maturity_date: '2025-06-02', business_days: 126, rate: 0.1189, rate_percent: 11.89 },
  { ticker: 'DI1N25', maturity_date: '2025-07-01', business_days: 147, rate: 0.1200, rate_percent: 12.00 },
  { ticker: 'DI1Q25', maturity_date: '2025-08-01', business_days: 168, rate: 0.1211, rate_percent: 12.11 },
  { ticker: 'DI1U25', maturity_date: '2025-09-01', business_days: 189, rate: 0.1222, rate_percent: 12.22 },
  { ticker: 'DI1V25', maturity_date: '2025-10-01', business_days: 210, rate: 0.1233, rate_percent: 12.33 },
  { ticker: 'DI1X25', maturity_date: '2025-11-03', business_days: 231, rate: 0.1244, rate_percent: 12.44 },
  { ticker: 'DI1Z25', maturity_date: '2025-12-01', business_days: 252, rate: 0.1255, rate_percent: 12.55 },
  { ticker: 'DI1F26', maturity_date: '2026-01-02', business_days: 273, rate: 0.1266, rate_percent: 12.66 },
  { ticker: 'DI1F27', maturity_date: '2027-01-04', business_days: 525, rate: 0.1300, rate_percent: 13.00 },
  { ticker: 'DI1F28', maturity_date: '2028-01-03', business_days: 777, rate: 0.1320, rate_percent: 13.20 },
  { ticker: 'DI1F29', maturity_date: '2029-01-02', business_days: 1029, rate: 0.1330, rate_percent: 13.30 },
  { ticker: 'DI1F30', maturity_date: '2030-01-02', business_days: 1260, rate: 0.1335, rate_percent: 13.35 },
];

/**
 * Mock DI1 response
 */
export const MOCK_DI1_RESPONSE: DI1Response = {
  reference_date: '2024-12-02',
  actual_date: '2024-12-02',
  contracts: MOCK_DI1_CONTRACTS,
  count: MOCK_DI1_CONTRACTS.length,
};

/**
 * Mock DI1 summary response
 */
export const MOCK_DI1_SUMMARY: DI1SummaryResponse = {
  reference_date: '2024-12-02',
  actual_date: '2024-12-02',
  count: MOCK_DI1_CONTRACTS.length,
  min_rate_percent: 11.34,
  max_rate_percent: 13.35,
  avg_rate_percent: 12.23,
  min_business_days: 21,
  max_business_days: 1260,
  first_maturity: '2025-01-02',
  last_maturity: '2030-01-02',
};

/**
 * Generate mock curve points
 */
function generateMockCurvePoints(method: SmoothingMethod): CurvePoint[] {
  const points: CurvePoint[] = [];

  // Generate points from 1 to 1260 business days
  for (let bd = 1; bd <= 1260; bd += 21) {
    // Simple interpolation formula based on business days
    const baseRate = 0.11 + (bd / 1260) * 0.025;
    let rate = baseRate;

    // Add method-specific variation
    switch (method) {
      case 'nelson_siegel':
      case 'nelson_siegel_svensson':
        // Smooth parametric curve
        rate = baseRate + 0.005 * Math.sin((bd / 1260) * Math.PI);
        break;
      case 'cubic_spline':
        // Smooth with slight oscillation
        rate = baseRate + 0.002 * Math.sin((bd / 100) * Math.PI);
        break;
      case 'linear':
        // Pure linear
        break;
      default:
        // Small random variation for other methods
        rate = baseRate + (Math.random() - 0.5) * 0.001;
    }

    points.push({
      business_days: bd,
      years: bd / 252,
      rate: rate,
      rate_percent: rate * 100,
    });
  }

  return points;
}

/**
 * Mock curve response
 */
export const MOCK_CURVE_RESPONSE: CurveResponse = {
  reference_date: '2024-12-02',
  method: 'nelson_siegel_svensson',
  method_name: 'Nelson-Siegel-Svensson',
  method_type: 'parametric',
  original_points: MOCK_DI1_CONTRACTS.map(c => ({
    business_days: c.business_days,
    years: c.business_days / 252,
    rate: c.rate,
    rate_percent: c.rate_percent,
  })),
  curve_points: generateMockCurvePoints('nelson_siegel_svensson'),
  parameters: {
    beta0: 0.1335,
    beta1: -0.0201,
    beta2: 0.0156,
    beta3: 0.0089,
    tau1: 1.5,
    tau2: 5.0,
  },
  metrics: {
    rmse: 0.0012,
    mae: 0.0008,
    max_error: 0.0025,
    r_squared: 0.9987,
  },
  num_original_points: 17,
  num_curve_points: 61,
};

/**
 * Mock methods list
 */
export const MOCK_METHODS: MethodInfo[] = [
  {
    id: 'linear',
    name: 'Interpolação Linear',
    description: 'Interpolação linear simples entre pontos observados',
    category: 'Simples',
    has_parameters: false,
  },
  {
    id: 'cubic_spline',
    name: 'Spline Cúbico',
    description: 'Interpolação por splines cúbicos naturais',
    category: 'Splines',
    has_parameters: false,
  },
  {
    id: 'akima',
    name: 'Akima',
    description: 'Interpolação Akima - reduz oscilações',
    category: 'Splines',
    has_parameters: false,
  },
  {
    id: 'pchip',
    name: 'PCHIP',
    description: 'Interpolação monotônica por partes (PCHIP)',
    category: 'Splines',
    has_parameters: false,
  },
  {
    id: 'smoothing_spline',
    name: 'Spline Suavizado',
    description: 'Spline com parâmetro de suavização',
    category: 'Splines',
    has_parameters: true,
  },
  {
    id: 'nelson_siegel',
    name: 'Nelson-Siegel',
    description: 'Modelo paramétrico Nelson-Siegel (3 fatores)',
    category: 'Paramétrico',
    has_parameters: false,
  },
  {
    id: 'nelson_siegel_svensson',
    name: 'Nelson-Siegel-Svensson',
    description: 'Modelo paramétrico Nelson-Siegel-Svensson (4 fatores)',
    category: 'Paramétrico',
    has_parameters: false,
  },
];

/**
 * Mock health response
 */
export const MOCK_HEALTH_RESPONSE: HealthResponse = {
  status: 'ok',
};

/**
 * Mock detailed health response
 */
export const MOCK_DETAILED_HEALTH_RESPONSE: DetailedHealthResponse = {
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  uptime_seconds: 3600,
  checks: {
    database: true,
    cache: true,
    pyield: true,
  },
};

/**
 * Mock API info response
 */
export const MOCK_API_INFO_RESPONSE: APIInfoResponse = {
  name: 'ETTJ API',
  version: '1.0.0',
  description: 'API para estrutura a termo da taxa de juros brasileira',
};

/**
 * Mock workflow response
 */
export const MOCK_WORKFLOW_RESPONSE: WorkflowResponse = {
  reference_date: '2024-12-02',
  actual_date: '2024-12-02',
  method: 'nelson_siegel_svensson',
  method_name: 'Nelson-Siegel-Svensson',
  method_type: 'parametric',
  contracts_count: MOCK_DI1_CONTRACTS.length,
  original_points: MOCK_DI1_CONTRACTS.map(c => ({
    business_days: c.business_days,
    years: c.business_days / 252,
    rate: c.rate,
    rate_percent: c.rate_percent,
  })),
  curve_points: generateMockCurvePoints('nelson_siegel_svensson'),
  parameters: {
    beta0: 0.1335,
    beta1: -0.0201,
    beta2: 0.0156,
    beta3: 0.0089,
    tau1: 1.5,
    tau2: 5.0,
  },
  metrics: {
    rmse: 0.0012,
    mae: 0.0008,
    max_error: 0.0025,
    r_squared: 0.9987,
  },
};

/**
 * Mock compare methods response
 */
export const MOCK_COMPARE_METHODS_RESPONSE: CompareMethodsResponse = {
  reference_date: '2024-12-02',
  actual_date: '2024-12-02',
  contracts_count: MOCK_DI1_CONTRACTS.length,
  original_points: MOCK_DI1_CONTRACTS.map(c => ({
    business_days: c.business_days,
    years: c.business_days / 252,
    rate: c.rate,
    rate_percent: c.rate_percent,
  })),
  results: [
    {
      method: 'nelson_siegel',
      method_name: 'Nelson-Siegel',
      method_type: 'parametric',
      success: true,
      curve_points: generateMockCurvePoints('nelson_siegel'),
      metrics: {
        rmse: 0.0018,
        mae: 0.0012,
        r_squared: 0.9975,
      },
    },
    {
      method: 'nelson_siegel_svensson',
      method_name: 'Nelson-Siegel-Svensson',
      method_type: 'parametric',
      success: true,
      curve_points: generateMockCurvePoints('nelson_siegel_svensson'),
      parameters: {
        beta0: 0.1335,
        beta1: -0.0201,
        beta2: 0.0156,
        beta3: 0.0089,
        tau1: 1.5,
        tau2: 5.0,
      },
      metrics: {
        rmse: 0.0012,
        mae: 0.0008,
        r_squared: 0.9987,
      },
    },
    {
      method: 'cubic_spline',
      method_name: 'Cubic Spline',
      method_type: 'splines',
      success: true,
      curve_points: generateMockCurvePoints('cubic_spline'),
      metrics: {
        rmse: 0.0005,
        mae: 0.0003,
        r_squared: 0.9998,
      },
    },
  ],
};

/**
 * Get method display name
 */
function getMethodName(method: SmoothingMethod): string {
  const names: Record<SmoothingMethod, string> = {
    linear: 'Linear',
    cubic_spline: 'Cubic Spline',
    akima: 'Akima',
    pchip: 'PCHIP',
    smoothing_spline: 'Smoothing Spline',
    nelson_siegel: 'Nelson-Siegel',
    nelson_siegel_svensson: 'Nelson-Siegel-Svensson',
  };
  return names[method];
}

/**
 * Get method type
 */
function getMethodType(method: SmoothingMethod): string {
  if (method === 'linear') return 'simple';
  if (method.startsWith('nelson_siegel')) return 'parametric';
  return 'splines';
}

/**
 * Create a mock curve response for a specific method
 */
export function createMockCurveResponse(
  method: SmoothingMethod,
  referenceDate: string = '2024-12-02'
): CurveResponse {
  const curvePoints = generateMockCurvePoints(method);
  return {
    reference_date: referenceDate,
    method: method,
    method_name: getMethodName(method),
    method_type: getMethodType(method),
    original_points: MOCK_DI1_CONTRACTS.map(c => ({
      business_days: c.business_days,
      years: c.business_days / 252,
      rate: c.rate,
      rate_percent: c.rate_percent,
    })),
    curve_points: curvePoints,
    parameters: method.startsWith('nelson_siegel')
      ? {
          beta0: 0.1335,
          beta1: -0.0201,
          beta2: 0.0156,
          ...(method === 'nelson_siegel_svensson' ? { beta3: 0.0089 } : {}),
          tau1: 1.5,
          ...(method === 'nelson_siegel_svensson' ? { tau2: 5.0 } : {}),
        }
      : undefined,
    metrics: {
      rmse: 0.0012,
      mae: 0.0008,
      r_squared: 0.9987,
    },
    num_original_points: MOCK_DI1_CONTRACTS.length,
    num_curve_points: curvePoints.length,
  };
}

/**
 * Simulate API delay
 */
export function simulateDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
