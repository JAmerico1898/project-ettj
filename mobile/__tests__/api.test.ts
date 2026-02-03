/**
 * Unit tests for API client
 *
 * Note: These tests require jest and related dependencies.
 * Install with: npm install --save-dev jest @types/jest ts-jest
 */

import { ApiClient } from '../services/api';
import {
  ApiError,
  ApiErrorCode,
  NetworkError,
  TimeoutError,
  ValidationError,
  ServerError,
  isApiError,
  isRetryableError,
} from '../types/errors';
import { handleApiError, getErrorMessage } from '../services/apiErrors';
import {
  MOCK_DI1_RESPONSE,
  MOCK_METHODS,
  MOCK_CURVE_RESPONSE,
  MOCK_HEALTH_RESPONSE,
} from '../services/apiMocks';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {
      baseURL: '',
      timeout: 30000,
    },
  })),
  isAxiosError: jest.fn((error) => error?.isAxiosError === true),
}));

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
  NetworkStateType: {
    NONE: 'NONE',
    UNKNOWN: 'UNKNOWN',
    CELLULAR: 'CELLULAR',
    WIFI: 'WIFI',
  },
}));

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create an error with default code', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
      expect(error.statusCode).toBeUndefined();
    });

    it('should create an error with custom code and status', () => {
      const error = new ApiError('Server error', ApiErrorCode.SERVER_ERROR, 500);
      expect(error.message).toBe('Server error');
      expect(error.code).toBe(ApiErrorCode.SERVER_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should include details', () => {
      const details = { field: 'email', reason: 'invalid' };
      const error = new ApiError('Validation failed', ApiErrorCode.VALIDATION_ERROR, 400, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('NetworkError', () => {
    it('should be retryable', () => {
      const error = new NetworkError();
      expect(error.isRetryable()).toBe(true);
      expect(error.code).toBe(ApiErrorCode.NETWORK_ERROR);
    });

    it('should have default Portuguese message', () => {
      const error = new NetworkError();
      expect(error.message).toContain('conexão');
    });
  });

  describe('TimeoutError', () => {
    it('should be retryable', () => {
      const error = new TimeoutError();
      expect(error.isRetryable()).toBe(true);
      expect(error.code).toBe(ApiErrorCode.TIMEOUT_ERROR);
      expect(error.statusCode).toBe(408);
    });
  });

  describe('ValidationError', () => {
    it('should not be retryable', () => {
      const error = new ValidationError();
      expect(error.isRetryable()).toBe(false);
      expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should include validation errors', () => {
      const validationErrors = [{ field: 'date', message: 'Invalid date format' }];
      const error = new ValidationError('Validation failed', validationErrors);
      expect(error.validationErrors).toEqual(validationErrors);
    });
  });

  describe('ServerError', () => {
    it('should be retryable for 5xx errors', () => {
      const error = new ServerError('Internal error', 500);
      expect(error.isRetryable()).toBe(true);
    });

    it('should be retryable for 503 errors', () => {
      const error = new ServerError('Service unavailable', 503);
      expect(error.isRetryable()).toBe(true);
    });
  });

  describe('isApiError', () => {
    it('should return true for ApiError instances', () => {
      expect(isApiError(new ApiError('test'))).toBe(true);
      expect(isApiError(new NetworkError())).toBe(true);
      expect(isApiError(new ValidationError())).toBe(true);
    });

    it('should return false for non-ApiError instances', () => {
      expect(isApiError(new Error('test'))).toBe(false);
      expect(isApiError('string error')).toBe(false);
      expect(isApiError(null)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(new NetworkError())).toBe(true);
      expect(isRetryableError(new TimeoutError())).toBe(true);
      expect(isRetryableError(new ServerError('error', 500))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(new ValidationError())).toBe(false);
      expect(isRetryableError(new Error('test'))).toBe(false);
    });
  });
});

describe('handleApiError', () => {
  it('should pass through ApiError instances', () => {
    const original = new NetworkError('Test');
    const result = handleApiError(original);
    expect(result).toBe(original);
  });

  it('should convert network errors', () => {
    const axiosError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      response: undefined,
    };

    const result = handleApiError(axiosError);
    expect(result).toBeInstanceOf(NetworkError);
  });

  it('should convert timeout errors', () => {
    const axiosError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
      response: undefined,
    };

    const result = handleApiError(axiosError);
    expect(result).toBeInstanceOf(TimeoutError);
  });

  it('should convert 400 errors to ValidationError', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        status: 400,
        data: { detail: 'Invalid date format' },
      },
    };

    const result = handleApiError(axiosError);
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.message).toBe('Invalid date format');
  });

  it('should convert 500 errors to ServerError', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        status: 500,
        data: { detail: 'Internal server error' },
      },
    };

    const result = handleApiError(axiosError);
    expect(result).toBeInstanceOf(ServerError);
    expect(result.statusCode).toBe(500);
  });

  it('should handle generic errors', () => {
    const result = handleApiError(new Error('Unknown error'));
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toBe('Unknown error');
  });

  it('should handle string errors', () => {
    const result = handleApiError('Something went wrong');
    expect(result).toBeInstanceOf(ApiError);
  });
});

describe('getErrorMessage', () => {
  it('should return message from ApiError', () => {
    const error = new NetworkError('Custom network message');
    expect(getErrorMessage(error)).toBe('Custom network message');
  });

  it('should return user-friendly message for axios errors', () => {
    const axiosError = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      response: undefined,
    };

    const message = getErrorMessage(axiosError);
    expect(message).toContain('conexão');
  });
});

describe('Mock Data', () => {
  describe('MOCK_DI1_RESPONSE', () => {
    it('should have valid structure', () => {
      expect(MOCK_DI1_RESPONSE).toHaveProperty('reference_date');
      expect(MOCK_DI1_RESPONSE).toHaveProperty('actual_date');
      expect(MOCK_DI1_RESPONSE).toHaveProperty('contracts');
      expect(MOCK_DI1_RESPONSE).toHaveProperty('count');
      expect(Array.isArray(MOCK_DI1_RESPONSE.contracts)).toBe(true);
      expect(MOCK_DI1_RESPONSE.count).toBe(MOCK_DI1_RESPONSE.contracts.length);
    });

    it('should have valid contract structure', () => {
      const contract = MOCK_DI1_RESPONSE.contracts[0];
      expect(contract).toHaveProperty('ticker');
      expect(contract).toHaveProperty('maturity_date');
      expect(contract).toHaveProperty('business_days');
      expect(contract).toHaveProperty('rate');
      expect(contract).toHaveProperty('rate_percent');
      expect(contract.rate_percent).toBeCloseTo(contract.rate * 100, 2);
    });
  });

  describe('MOCK_METHODS', () => {
    it('should have 7 methods', () => {
      expect(MOCK_METHODS).toHaveLength(7);
    });

    it('should include nelson_siegel_svensson', () => {
      const nss = MOCK_METHODS.find((m) => m.id === 'nelson_siegel_svensson');
      expect(nss).toBeDefined();
      expect(nss?.category).toBe('Paramétrico');
    });
  });

  describe('MOCK_CURVE_RESPONSE', () => {
    it('should have valid structure', () => {
      expect(MOCK_CURVE_RESPONSE).toHaveProperty('reference_date');
      expect(MOCK_CURVE_RESPONSE).toHaveProperty('method');
      expect(MOCK_CURVE_RESPONSE).toHaveProperty('points');
      expect(Array.isArray(MOCK_CURVE_RESPONSE.points)).toBe(true);
    });

    it('should have parameters for parametric method', () => {
      expect(MOCK_CURVE_RESPONSE.parameters).toBeDefined();
      expect(MOCK_CURVE_RESPONSE.parameters).toHaveProperty('beta0');
      expect(MOCK_CURVE_RESPONSE.parameters).toHaveProperty('tau1');
    });
  });

  describe('MOCK_HEALTH_RESPONSE', () => {
    it('should indicate healthy status', () => {
      expect(MOCK_HEALTH_RESPONSE.status).toBe('ok');
    });
  });
});

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://test-api.com');
  });

  describe('constructor', () => {
    it('should create client with default URL', () => {
      const defaultClient = new ApiClient();
      expect(defaultClient.getBaseURL()).toBeDefined();
    });

    it('should create client with custom URL', () => {
      expect(client.getBaseURL()).toBe('http://test-api.com');
    });
  });

  describe('setBaseURL', () => {
    it('should update base URL', () => {
      client.setBaseURL('http://new-url.com');
      expect(client.getBaseURL()).toBe('http://new-url.com');
    });
  });
});

// Run tests
if (typeof jest !== 'undefined') {
  // Tests will run via jest
} else {
  console.log('To run these tests, install jest and run: npx jest');
}
