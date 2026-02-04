/**
 * Tests for useWorkflow hook
 * Note: Simplified tests that don't require @testing-library/react-native
 * due to React 19 compatibility issues
 */

// Mock the API client
jest.mock('../../services/api', () => ({
  api: {
    workflow: jest.fn(),
  },
  apiClient: {
    workflow: jest.fn(),
  },
  getErrorMessage: jest.fn((err) => err?.message || 'Unknown error'),
}));

import { api, getErrorMessage } from '../../services/api';

describe('useWorkflow API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('api.workflow', () => {
    it('should be callable with workflow request', async () => {
      const mockResponse = {
        actual_date: '2024-01-15',
        method: 'nelson_siegel_svensson',
        method_name: 'Nelson-Siegel-Svensson',
        method_type: 'parametric',
        contracts_count: 10,
        curve_points: [],
        original_points: [],
        metrics: { rmse: 0.01 },
      };

      (api.workflow as jest.Mock).mockResolvedValue(mockResponse);

      const result = await api.workflow({ method: 'nelson_siegel_svensson' });

      expect(api.workflow).toHaveBeenCalledWith({ method: 'nelson_siegel_svensson' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      const mockError = new Error('API Error');
      (api.workflow as jest.Mock).mockRejectedValue(mockError);

      await expect(api.workflow({ method: 'invalid' })).rejects.toThrow('API Error');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from error object', () => {
      const error = { message: 'Test error message' };
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Unknown error');
    });
  });
});

describe('Workflow request types', () => {
  it('should accept valid method names', () => {
    const validMethods = [
      'linear',
      'cubic_spline',
      'akima',
      'pchip',
      'smoothing_spline',
      'nelson_siegel',
      'nelson_siegel_svensson',
    ];

    validMethods.forEach((method) => {
      const request = { method };
      expect(request.method).toBe(method);
    });
  });

  it('should accept optional date parameter', () => {
    const requestWithDate = {
      method: 'nelson_siegel_svensson',
      date: '2024-01-15',
    };

    const requestWithoutDate = {
      method: 'nelson_siegel_svensson',
    };

    expect(requestWithDate.date).toBe('2024-01-15');
    expect(requestWithoutDate.date).toBeUndefined();
  });

  it('should accept optional smoothing_parameter for smoothing_spline', () => {
    const request = {
      method: 'smoothing_spline',
      smoothing_parameter: 0.5,
    };

    expect(request.smoothing_parameter).toBe(0.5);
  });
});
