/**
 * Service exports for clean imports
 *
 * Usage:
 * import { apiClient, cacheService, errorLogger } from '../services';
 */

// API client
export { apiClient, api, ApiClient, getErrorMessage } from './api';

// API configuration
export { API_CONFIG, API_ENDPOINTS } from './apiConfig';

// Error handling
export {
  handleApiError,
  getErrorMessage as getApiErrorMessage,
  getErrorDetails,
  shouldRetry,
  ERROR_MESSAGES,
  getMessageByCode,
  type ErrorMessageCode,
} from './apiErrors';

// Cache service
export {
  cacheService,
  CacheService,
  CacheKeys,
  CacheTTL,
  type CacheStats,
} from './cacheService';

// Error logger
export {
  errorLogger,
  ErrorLogger,
  logError,
  type ErrorLog,
} from './errorLogger';
