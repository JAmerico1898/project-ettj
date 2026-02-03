/**
 * API error handling utilities
 */

import { AxiosError } from 'axios';
import {
  ApiError,
  ApiErrorCode,
  NetworkError,
  TimeoutError,
  ValidationError,
  ServerError,
  NotFoundError,
} from '../types/errors';
import { ErrorResponse } from '../types/api';

/**
 * Convert an Axios error or unknown error to a typed ApiError
 * @param error - The error to convert
 * @returns A typed ApiError instance
 */
export function handleApiError(error: unknown): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Axios error
  if (isAxiosError(error)) {
    return convertAxiosError(error);
  }

  // Generic Error
  if (error instanceof Error) {
    return new ApiError(error.message, ApiErrorCode.UNKNOWN_ERROR);
  }

  // Unknown error type
  return new ApiError(
    'Um erro inesperado ocorreu.',
    ApiErrorCode.UNKNOWN_ERROR,
    undefined,
    { originalError: String(error) }
  );
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError<ErrorResponse> {
  return (
    error !== null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as { isAxiosError: boolean }).isAxiosError === true
  );
}

/**
 * Convert an Axios error to a typed ApiError
 */
function convertAxiosError(error: AxiosError<ErrorResponse>): ApiError {
  // Network error (no response received)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new TimeoutError('A requisição excedeu o tempo limite. Tente novamente.');
    }

    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      return new NetworkError('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    return new NetworkError('Não foi possível conectar ao servidor.');
  }

  const { status, data } = error.response;
  const detail = data?.detail || error.message;

  // Handle specific status codes
  switch (status) {
    case 400:
      return new ValidationError(
        detail || 'Dados inválidos. Verifique os parâmetros e tente novamente.',
        data?.validation_errors,
        { response: data }
      );

    case 401:
      return new ApiError(
        'Não autorizado. Faça login novamente.',
        ApiErrorCode.UNAUTHORIZED,
        401,
        { response: data }
      );

    case 404:
      return new NotFoundError(detail || 'Recurso não encontrado.');

    case 408:
      return new TimeoutError('A requisição excedeu o tempo limite.');

    case 422:
      return new ValidationError(
        detail || 'Erro de validação.',
        data?.validation_errors,
        { response: data }
      );

    case 429:
      return new ApiError(
        'Muitas requisições. Aguarde um momento e tente novamente.',
        ApiErrorCode.SERVER_ERROR,
        429,
        { response: data }
      );

    case 500:
      return new ServerError('Erro interno do servidor. Tente novamente mais tarde.', 500);

    case 502:
      return new ServerError('Serviço temporariamente indisponível.', 502);

    case 503:
      return new ServerError('Serviço em manutenção. Tente novamente em alguns minutos.', 503);

    case 504:
      return new ServerError('O servidor demorou muito para responder.', 504);

    default:
      if (status >= 500) {
        return new ServerError(detail || 'Erro do servidor.', status);
      }
      return new ApiError(detail || 'Erro desconhecido.', ApiErrorCode.UNKNOWN_ERROR, status);
  }
}

/**
 * Get a user-friendly error message in Portuguese
 * @param error - The error to get message from
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const apiError = handleApiError(error);
  return apiError.message;
}

/**
 * Get error details for logging
 * @param error - The error to get details from
 */
export function getErrorDetails(error: unknown): Record<string, unknown> {
  const apiError = handleApiError(error);
  return {
    name: apiError.name,
    message: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    details: apiError.details,
    stack: apiError.stack,
  };
}

/**
 * Check if an error indicates the user should retry
 */
export function shouldRetry(error: unknown): boolean {
  const apiError = handleApiError(error);
  return apiError.isRetryable();
}

/**
 * Portuguese error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_OFFLINE: 'Você está offline. Conecte-se à internet para continuar.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  TIMEOUT: 'A requisição demorou muito. Tente novamente.',
  SERVER_ERROR: 'Erro no servidor. Nossa equipe foi notificada.',

  // Validation errors
  VALIDATION_ERROR: 'Os dados informados são inválidos.',
  INSUFFICIENT_DATA: 'Dados insuficientes para calcular a curva. Mínimo de 3 contratos necessários.',
  CORRUPTED_DATA: 'Os dados recebidos estão corrompidos. Tente novamente.',

  // Date errors
  NOT_FOUND: 'Dados não encontrados para a data selecionada.',
  WEEKEND_DATE: 'A data selecionada é um fim de semana. Selecione um dia útil.',
  HOLIDAY_DATE: 'A data selecionada é um feriado. Selecione um dia útil.',
  FUTURE_DATE: 'A data selecionada é no futuro. Selecione uma data passada.',
  DATE_TOO_OLD: 'A data selecionada é muito antiga. Dados não disponíveis.',
  NO_DATA: 'Não há dados disponíveis para a data selecionada.',

  // Calculation errors
  CALCULATION_FAILED: 'Falha no cálculo da curva. Verifique os parâmetros e tente novamente.',
  INVALID_PARAMETERS: 'Parâmetros inválidos para o método selecionado.',

  // Cache errors
  CACHE_ERROR: 'Erro ao acessar dados em cache. Usando dados do servidor.',
  CACHE_EXPIRED: 'Dados em cache expirados. Atualizando...',

  // Generic errors
  UNKNOWN: 'Um erro inesperado ocorreu. Tente novamente.',
  RETRY_FAILED: 'Não foi possível completar a operação após várias tentativas.',
} as const;

/**
 * Error code type for type-safe access
 */
export type ErrorMessageCode = keyof typeof ERROR_MESSAGES;

/**
 * Get error message by code with fallback
 */
export function getMessageByCode(code: string): string {
  if (code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as ErrorMessageCode];
  }
  return ERROR_MESSAGES.UNKNOWN;
}
