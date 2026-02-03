/**
 * Input validation utilities
 */

import { SmoothingMethod, MethodInfo } from '../types';

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Method categories and their descriptions
 */
export const METHOD_CATEGORIES: Record<string, string> = {
  parametric: 'Paramétrico',
  splines: 'Splines',
  simple: 'Simples',
};

/**
 * Method category mapping
 */
export const METHOD_TO_CATEGORY: Record<SmoothingMethod, string> = {
  nelson_siegel: 'parametric',
  nelson_siegel_svensson: 'parametric',
  cubic_spline: 'splines',
  akima: 'splines',
  pchip: 'splines',
  smoothing_spline: 'splines',
  linear: 'simple',
};

/**
 * Method display names in Portuguese
 */
export const METHOD_DISPLAY_NAMES: Record<SmoothingMethod, string> = {
  nelson_siegel: 'Nelson-Siegel',
  nelson_siegel_svensson: 'Nelson-Siegel-Svensson',
  cubic_spline: 'Spline Cúbico',
  akima: 'Akima',
  pchip: 'PCHIP',
  smoothing_spline: 'Smoothing Spline',
  linear: 'Linear',
};

/**
 * Method descriptions in Portuguese
 */
export const METHOD_DESCRIPTIONS: Record<SmoothingMethod, string> = {
  nelson_siegel:
    'Modelo paramétrico clássico com 4 parâmetros. Captura nível, inclinação e curvatura da curva de juros.',
  nelson_siegel_svensson:
    'Extensão do modelo NS com 6 parâmetros. Adiciona flexibilidade para capturar duas curvaturas.',
  cubic_spline:
    'Interpolação suave que passa por todos os pontos observados. Continuidade até segunda derivada.',
  akima:
    'Spline que evita oscilações indesejadas. Mais estável que spline cúbico tradicional.',
  pchip:
    'Interpolação monotônica que preserva a forma dos dados. Evita overshoot entre pontos.',
  smoothing_spline:
    'Spline com parâmetro de suavização. Balanceia ajuste aos dados e suavidade da curva.',
  linear:
    'Interpolação linear simples entre pontos adjacentes. Mais simples mas pode ter descontinuidades.',
};

/**
 * Minimum points required for each method
 */
export const METHOD_MIN_POINTS: Record<SmoothingMethod, number> = {
  nelson_siegel: 4,
  nelson_siegel_svensson: 6,
  cubic_spline: 4,
  akima: 5,
  pchip: 2,
  smoothing_spline: 4,
  linear: 2,
};

/**
 * Methods that have configurable parameters
 */
export const METHODS_WITH_PARAMETERS: SmoothingMethod[] = ['smoothing_spline'];

/**
 * Default smoothing parameter value
 */
export const DEFAULT_SMOOTHING_PARAMETER = 0.5;

/**
 * Smoothing parameter constraints
 */
export const SMOOTHING_PARAMETER_MIN = 0.0;
export const SMOOTHING_PARAMETER_MAX = 1.0;

/**
 * Validate method selection
 */
export function validateMethodSelection(
  method: SmoothingMethod | null,
  availableMethods?: MethodInfo[]
): ValidationResult {
  const errors: string[] = [];

  if (!method) {
    errors.push('Selecione um método de suavização.');
    return { isValid: false, errors };
  }

  // Check if method is valid
  const validMethods: SmoothingMethod[] = [
    'linear',
    'cubic_spline',
    'akima',
    'pchip',
    'smoothing_spline',
    'nelson_siegel',
    'nelson_siegel_svensson',
  ];

  if (!validMethods.includes(method)) {
    errors.push(`Método inválido: ${method}`);
    return { isValid: false, errors };
  }

  // If available methods are provided, check if method is in the list
  if (availableMethods && availableMethods.length > 0) {
    const methodIds = availableMethods.map((m) => m.id);
    if (!methodIds.includes(method)) {
      errors.push('O método selecionado não está disponível.');
      return { isValid: false, errors };
    }
  }

  return { isValid: true, errors };
}

/**
 * Parameter values interface
 */
export interface MethodParameters {
  smoothingParameter?: number;
  maxBusinessDays?: number;
}

/**
 * Validate parameters for a specific method
 */
export function validateParameters(
  method: SmoothingMethod,
  parameters: MethodParameters
): ValidationResult {
  const errors: string[] = [];

  // Validate smoothing parameter for smoothing_spline
  if (method === 'smoothing_spline' && parameters.smoothingParameter !== undefined) {
    const sp = parameters.smoothingParameter;

    if (typeof sp !== 'number' || isNaN(sp)) {
      errors.push('O parâmetro de suavização deve ser um número.');
    } else if (sp < SMOOTHING_PARAMETER_MIN || sp > SMOOTHING_PARAMETER_MAX) {
      errors.push(
        `O parâmetro de suavização deve estar entre ${SMOOTHING_PARAMETER_MIN} e ${SMOOTHING_PARAMETER_MAX}.`
      );
    }
  }

  // Validate max business days
  if (parameters.maxBusinessDays !== undefined) {
    const maxDays = parameters.maxBusinessDays;

    if (typeof maxDays !== 'number' || isNaN(maxDays)) {
      errors.push('O prazo máximo deve ser um número.');
    } else if (maxDays < 1) {
      errors.push('O prazo máximo deve ser maior que zero.');
    } else if (maxDays > 5000) {
      errors.push('O prazo máximo não pode exceder 5000 dias úteis.');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Check if a method has configurable parameters
 */
export function methodHasParameters(method: SmoothingMethod): boolean {
  return METHODS_WITH_PARAMETERS.includes(method);
}

/**
 * Get the category display name for a method
 */
export function getMethodCategoryName(method: SmoothingMethod): string {
  const category = METHOD_TO_CATEGORY[method];
  return METHOD_CATEGORIES[category] || 'Outro';
}

/**
 * Validate that we have enough contracts for the selected method
 */
export function validateContractsForMethod(
  method: SmoothingMethod,
  contractCount: number
): ValidationResult {
  const minPoints = METHOD_MIN_POINTS[method] || 2;
  const errors: string[] = [];

  if (contractCount < minPoints) {
    errors.push(
      `O método ${METHOD_DISPLAY_NAMES[method]} requer no mínimo ${minPoints} contratos. ` +
        `Atualmente há ${contractCount} contratos disponíveis.`
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
