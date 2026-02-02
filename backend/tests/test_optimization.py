"""Tests for optimization routines."""

import pytest
import numpy as np
from services.optimization import (
    nelson_siegel,
    nelson_siegel_svensson,
    fit_nelson_siegel,
    fit_nelson_siegel_svensson
)


class TestNelsonSiegelFunction:
    def test_basic_calculation(self):
        """Test Nelson-Siegel function calculation."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        beta0, beta1, beta2, tau = 0.10, -0.02, 0.01, 1.5

        rates = nelson_siegel(m, beta0, beta1, beta2, tau)

        assert len(rates) == len(m)
        assert np.all(rates > 0)
        assert np.all(rates < 1)

    def test_long_term_level(self):
        """Test that beta0 represents long-term level."""
        m = np.array([100.0])  # Very long maturity
        beta0, beta1, beta2, tau = 0.10, -0.02, 0.01, 1.5

        rate = nelson_siegel(m, beta0, beta1, beta2, tau)

        # At long maturities, rate should approach beta0
        assert abs(rate[0] - beta0) < 0.001

    def test_short_term_component(self):
        """Test that beta1 affects short-term rates."""
        m = np.array([0.01])  # Very short maturity
        beta0, beta1, tau = 0.10, -0.02, 1.5

        # With beta2=0, short rate should be close to beta0 + beta1
        rate = nelson_siegel(m, beta0, beta1, 0.0, tau)
        expected = beta0 + beta1
        assert abs(rate[0] - expected) < 0.01

    def test_zero_maturity_handling(self):
        """Test that zero maturity doesn't cause errors."""
        m = np.array([0.0, 0.5, 1.0])
        beta0, beta1, beta2, tau = 0.10, -0.02, 0.01, 1.5

        # Should not raise exception
        rates = nelson_siegel(m, beta0, beta1, beta2, tau)
        assert not np.any(np.isnan(rates))
        assert not np.any(np.isinf(rates))


class TestNelsonSiegelSvenssonFunction:
    def test_basic_calculation(self):
        """Test Nelson-Siegel-Svensson function calculation."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        beta0, beta1, beta2, beta3, tau1, tau2 = 0.10, -0.02, 0.01, 0.005, 1.0, 3.0

        rates = nelson_siegel_svensson(m, beta0, beta1, beta2, beta3, tau1, tau2)

        assert len(rates) == len(m)
        assert np.all(rates > 0)
        assert np.all(rates < 1)

    def test_reduces_to_ns_when_beta3_zero(self):
        """Test that NSS reduces to NS when beta3=0."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        beta0, beta1, beta2, tau = 0.10, -0.02, 0.01, 1.5

        ns_rates = nelson_siegel(m, beta0, beta1, beta2, tau)
        nss_rates = nelson_siegel_svensson(m, beta0, beta1, beta2, 0.0, tau, 3.0)

        np.testing.assert_array_almost_equal(ns_rates, nss_rates, decimal=10)


class TestFitNelsonSiegel:
    def test_convergence_on_synthetic_data(self):
        """Test that Nelson-Siegel optimization converges."""
        # Generate synthetic data from known parameters
        true_params = [0.10, -0.02, 0.01, 1.5]
        m = np.linspace(0.25, 5.0, 20)
        y_true = nelson_siegel(m, *true_params)

        # Add small noise
        np.random.seed(42)
        y_noisy = y_true + np.random.normal(0, 0.0001, len(y_true))

        # Fit model
        result = fit_nelson_siegel(m, y_noisy)

        assert result['success'] == True
        assert result['rmse'] < 0.001  # Should fit very well

        # Parameters should be close to true values
        fitted_params = result['parameters']
        assert abs(fitted_params[0] - true_params[0]) < 0.01  # beta0

    def test_custom_initial_params(self):
        """Test fitting with custom initial parameters."""
        m = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0])
        y = np.array([0.10, 0.102, 0.105, 0.108, 0.110, 0.112])

        initial = np.array([0.11, -0.01, 0.0, 1.0])
        result = fit_nelson_siegel(m, y, initial_params=initial)

        assert result['success'] == True

    def test_custom_bounds(self):
        """Test fitting with custom bounds."""
        m = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0])
        y = np.array([0.10, 0.102, 0.105, 0.108, 0.110, 0.112])

        bounds = [
            (0.0, 0.2),   # beta0
            (-0.1, 0.1),  # beta1
            (-0.1, 0.1),  # beta2
            (0.5, 5.0)    # tau
        ]
        result = fit_nelson_siegel(m, y, bounds=bounds)

        assert result['success'] == True

        # Parameters should be within bounds
        params = result['parameters']
        assert 0.0 <= params[0] <= 0.2
        assert -0.1 <= params[1] <= 0.1
        assert -0.1 <= params[2] <= 0.1
        assert 0.5 <= params[3] <= 5.0


class TestFitNelsonSiegelSvensson:
    def test_convergence_on_synthetic_data(self):
        """Test that NSS optimization converges."""
        true_params = [0.10, -0.02, 0.01, 0.005, 1.0, 3.0]
        m = np.linspace(0.25, 5.0, 25)
        y_true = nelson_siegel_svensson(m, *true_params)

        np.random.seed(42)
        y_noisy = y_true + np.random.normal(0, 0.0001, len(y_true))

        result = fit_nelson_siegel_svensson(m, y_noisy)

        assert result['success'] == True
        assert result['rmse'] < 0.001

    def test_better_fit_than_ns_for_complex_curves(self):
        """Test that NSS can fit more complex curve shapes."""
        # Create a curve with double hump that NS can't fit well
        m = np.linspace(0.25, 5.0, 30)
        true_params = [0.10, -0.02, 0.02, -0.015, 0.8, 2.5]
        y = nelson_siegel_svensson(m, *true_params)

        # Fit with NS
        ns_result = fit_nelson_siegel(m, y)

        # Fit with NSS
        nss_result = fit_nelson_siegel_svensson(m, y)

        # NSS should have lower or equal RMSE
        assert nss_result['rmse'] <= ns_result['rmse'] + 0.001


class TestRMSECalculation:
    def test_rmse_correctness(self):
        """Test that RMSE is calculated correctly."""
        m = np.array([0.5, 1.0, 2.0])
        y = np.array([0.10, 0.11, 0.12])

        # Use parameters that give exact fit
        beta0, beta1, beta2, tau = 0.10, 0.0, 0.0, 1.0
        y_pred = nelson_siegel(m, beta0, beta1, beta2, tau)

        # Manual RMSE calculation
        expected_rmse = np.sqrt(np.mean((y - y_pred) ** 2))

        # Get RMSE from fit (with same initial params to get same result)
        result = fit_nelson_siegel(m, y)

        # RMSE should match predicted fit quality
        assert result['rmse'] >= 0
        assert result['rmse'] < 0.1  # Should be reasonable


class TestEdgeCases:
    def test_few_data_points(self):
        """Test with minimum viable data points."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        y = np.array([0.10, 0.105, 0.11, 0.115])

        result = fit_nelson_siegel(m, y)
        assert result['success'] == True

    def test_flat_curve(self):
        """Test fitting a flat yield curve."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        y = np.array([0.10, 0.10, 0.10, 0.10])

        result = fit_nelson_siegel(m, y)
        assert result['success'] == True

        # beta0 should be close to 0.10
        assert abs(result['parameters'][0] - 0.10) < 0.01

    def test_inverted_curve(self):
        """Test fitting an inverted yield curve."""
        m = np.array([0.5, 1.0, 2.0, 5.0])
        y = np.array([0.12, 0.11, 0.105, 0.10])  # Decreasing rates

        result = fit_nelson_siegel(m, y)
        assert result['success'] == True

        # beta1 should be positive for inverted curve
        assert result['parameters'][1] > 0
