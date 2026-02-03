/**
 * Custom error classes for API error handling
 */

/**
 * Error codes for API errors
 */
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base class for all API errors
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper stack trace for where our error was thrown (only in V8 environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return (
      this.code === ApiErrorCode.NETWORK_ERROR ||
      this.code === ApiErrorCode.TIMEOUT_ERROR ||
      (this.statusCode !== undefined && this.statusCode >= 500)
    );
  }
}

/**
 * Network connectivity error (no internet, DNS failure, etc.)
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Erro de conexão. Verifique sua internet.', details?: Record<string, unknown>) {
    super(message, ApiErrorCode.NETWORK_ERROR, undefined, details);
    this.name = 'NetworkError';
  }
}

/**
 * Request timeout error
 */
export class TimeoutError extends ApiError {
  constructor(message: string = 'A requisição excedeu o tempo limite.', details?: Record<string, unknown>) {
    super(message, ApiErrorCode.TIMEOUT_ERROR, 408, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends ApiError {
  public readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor(
    message: string = 'Dados inválidos.',
    validationErrors?: Array<{ field: string; message: string }>,
    details?: Record<string, unknown>
  ) {
    super(message, ApiErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Server error (5xx responses)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = 'Erro interno do servidor.',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message, ApiErrorCode.SERVER_ERROR, statusCode, details);
    this.name = 'ServerError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Recurso não encontrado.', details?: Record<string, unknown>) {
    super(message, ApiErrorCode.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.isRetryable();
  }
  return false;
}
