"""Unit tests for interpolation models."""

import pytest
import numpy as np
from services.models import (
    LinearInterpolation,
    CubicSpline,
    AkimaSpline,
    PCHIPInterpolation,
    SmoothingSpline,
    NelsonSiegelModel,
    NelsonSiegelSvenssonModel,
    calculate_curve,
    MODELS
)
from services.metrics import calculate_metrics


@pytest.fixture
def sample_data():
    """Sample yield curve data."""
    x = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0])
    y = np.array([0.10, 0.102, 0.105, 0.108, 0.110, 0.112])
    return x, y


@pytest.fixture
def sample_contracts():
    """Sample DI1 contracts as dicts."""
    return [
        {'years': 0.25, 'rate': 0.10},
        {'years': 0.5, 'rate': 0.102},
        {'years': 1.0, 'rate': 0.105},
        {'years': 2.0, 'rate': 0.108},
        {'years': 3.0, 'rate': 0.110},
        {'years': 5.0, 'rate': 0.112}
    ]


class TestLinearInterpolation:
    def test_fit_and_predict(self, sample_data):
        x, y = sample_data
        model = LinearInterpolation()

        params = model.fit(x, y)
        assert 'x_data' in params
        assert 'y_data' in params

        # Predict at original points
        y_pred = model.predict(x, params)
        np.testing.assert_array_almost_equal(y, y_pred, decimal=10)

    def test_interpolation_between_points(self, sample_data):
        x, y = sample_data
        model = LinearInterpolation()
        params = model.fit(x, y)

        # Interpolate at midpoint between first two points
        x_mid = np.array([0.375])  # midpoint between 0.25 and 0.5
        y_mid = model.predict(x_mid, params)

        # Should be average of first two y values
        expected = (y[0] + y[1]) / 2
        assert abs(y_mid[0] - expected) < 1e-10


class TestCubicSpline:
    def test_fit_and_predict(self, sample_data):
        x, y = sample_data
        model = CubicSpline()

        params = model.fit(x, y)
        y_pred = model.predict(x, params)

        # Should pass through all points
        np.testing.assert_array_almost_equal(y, y_pred, decimal=10)

    def test_smoothness(self, sample_data):
        x, y = sample_data
        model = CubicSpline()
        params = model.fit(x, y)

        # Predict at many points
        x_fine = np.linspace(x[0], x[-1], 100)
        y_fine = model.predict(x_fine, params)

        # Should be smooth (no NaN or Inf)
        assert not np.any(np.isnan(y_fine))
        assert not np.any(np.isinf(y_fine))


class TestAkimaSpline:
    def test_fit_and_predict(self, sample_data):
        x, y = sample_data
        model = AkimaSpline()

        params = model.fit(x, y)
        y_pred = model.predict(x, params)

        # Should pass through all points
        np.testing.assert_array_almost_equal(y, y_pred, decimal=10)

    def test_requires_minimum_points(self):
        # Akima needs at least 5 points
        x = np.array([0.25, 0.5, 1.0, 2.0])
        y = np.array([0.10, 0.102, 0.105, 0.108])

        with pytest.raises(Exception):
            contracts = [{'years': xi, 'rate': yi} for xi, yi in zip(x, y)]
            calculate_curve('akima', contracts)


class TestPCHIPInterpolation:
    def test_fit_and_predict(self, sample_data):
        x, y = sample_data
        model = PCHIPInterpolation()

        params = model.fit(x, y)
        y_pred = model.predict(x, params)

        # Should pass through all points
        np.testing.assert_array_almost_equal(y, y_pred, decimal=10)

    def test_monotonicity_preservation(self):
        """PCHIP should preserve monotonicity."""
        x = np.array([0.25, 0.5, 1.0, 2.0, 3.0])
        y = np.array([0.08, 0.09, 0.10, 0.11, 0.12])  # Monotonically increasing

        model = PCHIPInterpolation()
        params = model.fit(x, y)

        # Predict at many points
        x_fine = np.linspace(x[0], x[-1], 100)
        y_fine = model.predict(x_fine, params)

        # Should be monotonically increasing
        assert np.all(np.diff(y_fine) >= -1e-10)


class TestSmoothingSpline:
    def test_fit_and_predict(self, sample_data):
        x, y = sample_data
        model = SmoothingSpline()

        params = model.fit(x, y, smoothing=0.0)  # No smoothing = interpolation
        y_pred = model.predict(x, params)

        # With smoothing=0, should pass through all points (or close)
        np.testing.assert_array_almost_equal(y, y_pred, decimal=5)

    def test_smoothing_parameter(self, sample_data):
        x, y = sample_data
        model = SmoothingSpline()

        # With high smoothing, curve should be smoother (not pass through points exactly)
        params = model.fit(x, y, smoothing=1.0)
        y_pred = model.predict(x, params)

        # Should not pass through all points exactly
        residuals = np.abs(y - y_pred)
        assert np.max(residuals) > 1e-10


class TestNelsonSiegel:
    def test_fit_success(self, sample_data):
        x, y = sample_data
        model = NelsonSiegelModel()

        params = model.fit(x, y)

        assert 'beta0' in params
        assert 'beta1' in params
        assert 'beta2' in params
        assert 'tau' in params
        assert params['success'] == True
        assert params['rmse'] < 0.01  # Should fit reasonably well

    def test_predict(self, sample_data):
        x, y = sample_data
        model = NelsonSiegelModel()

        params = model.fit(x, y)
        y_pred = model.predict(x, params)

        # Check predictions are reasonable
        assert len(y_pred) == len(y)
        assert np.all(y_pred > 0)
        assert np.all(y_pred < 1)


class TestNelsonSiegelSvensson:
    def test_fit_success(self, sample_data):
        x, y = sample_data
        model = NelsonSiegelSvenssonModel()

        params = model.fit(x, y)

        assert 'beta0' in params
        assert 'beta3' in params
        assert 'tau1' in params
        assert 'tau2' in params
        assert params['success'] == True


class TestCalculateCurve:
    def test_all_methods(self, sample_contracts):
        """Test that all methods work."""
        for method_id in MODELS.keys():
            # Skip methods that need more points
            if method_id == 'akima' and len(sample_contracts) < 5:
                continue
            if method_id == 'nelson_siegel_svensson' and len(sample_contracts) < 6:
                continue

            result = calculate_curve(method_id, sample_contracts)

            assert result['method'] == method_id
            assert len(result['original_points']) == len(sample_contracts)
            assert len(result['curve_points']) > 0
            assert 'metrics' in result
            assert 'parameters_used' in result

    def test_insufficient_data(self):
        """Test error handling for insufficient data."""
        contracts = [{'years': 1.0, 'rate': 0.10}]

        with pytest.raises(ValueError, match="at least 2 contracts"):
            calculate_curve('linear', contracts)

    def test_invalid_method(self, sample_contracts):
        """Test error for invalid method."""
        with pytest.raises(ValueError, match="Unknown method"):
            calculate_curve('invalid_method', sample_contracts)

    def test_metrics_calculation(self, sample_contracts):
        """Test that metrics are calculated."""
        result = calculate_curve('linear', sample_contracts)

        metrics = result['metrics']
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert 'r_squared' in metrics
        assert metrics['r_squared'] >= 0
        assert metrics['r_squared'] <= 1

    def test_curve_points_structure(self, sample_contracts):
        """Test curve points have correct structure."""
        result = calculate_curve('linear', sample_contracts)

        for point in result['curve_points']:
            assert 'business_days' in point
            assert 'years' in point
            assert 'rate' in point
            assert 'rate_percent' in point

    def test_original_points_sorted(self, sample_contracts):
        """Test that original points are sorted by maturity."""
        # Shuffle the input
        shuffled = sample_contracts.copy()
        shuffled.reverse()

        result = calculate_curve('linear', shuffled)

        # Original points should be sorted
        years = [p['years'] for p in result['original_points']]
        assert years == sorted(years)


class TestMetrics:
    def test_perfect_fit(self):
        """Test metrics for perfect fit."""
        y_true = np.array([0.10, 0.11, 0.12])
        y_pred = y_true.copy()

        metrics = calculate_metrics(y_true, y_pred)

        assert metrics['mae'] == 0.0
        assert metrics['rmse'] == 0.0
        assert metrics['r_squared'] == 1.0
        assert metrics['max_error'] == 0.0

    def test_non_perfect_fit(self):
        """Test metrics for non-perfect fit."""
        y_true = np.array([0.10, 0.11, 0.12])
        y_pred = np.array([0.10, 0.11, 0.13])  # Last value off by 0.01

        metrics = calculate_metrics(y_true, y_pred)

        assert metrics['mae'] > 0
        assert metrics['rmse'] > 0
        assert metrics['r_squared'] < 1.0
        assert abs(metrics['max_error'] - 0.01) < 1e-10
