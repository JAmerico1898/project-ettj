"""Interpolation and smoothing methods for yield curve modeling."""

from typing import List, Dict, Optional
import numpy as np
from scipy import interpolate

from services.optimization import (
    fit_nelson_siegel,
    fit_nelson_siegel_svensson,
    nelson_siegel,
    nelson_siegel_svensson
)
from services.metrics import calculate_metrics

# Business days per year (Brazilian convention)
BUSINESS_DAYS_PER_YEAR = 252


class YieldCurveModel:
    """Base class for yield curve models."""

    def __init__(self, name: str, method_type: str):
        self.name = name
        self.method_type = method_type  # 'simple', 'spline', 'parametric'

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """
        Fit the model to data.

        Args:
            x: Maturities (in years)
            y: Rates (as decimals)
            **kwargs: Method-specific parameters

        Returns:
            Dictionary with fitted parameters and metadata
        """
        raise NotImplementedError

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """
        Predict rates for given maturities.

        Args:
            x: Maturities (in years)
            params: Fitted parameters from fit()

        Returns:
            Predicted rates (as decimals)
        """
        raise NotImplementedError


class LinearInterpolation(YieldCurveModel):
    """Simple linear interpolation."""

    def __init__(self):
        super().__init__("Linear Interpolation", "simple")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Fit linear interpolation (just store the data)."""
        return {
            'x_data': x.tolist(),
            'y_data': y.tolist(),
            'method': 'linear'
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using linear interpolation."""
        x_data = np.array(params['x_data'])
        y_data = np.array(params['y_data'])

        # Use scipy interp1d
        f = interpolate.interp1d(
            x_data, y_data,
            kind='linear',
            fill_value='extrapolate'
        )

        return f(x)


class CubicSpline(YieldCurveModel):
    """Cubic spline interpolation."""

    def __init__(self):
        super().__init__("Cubic Spline", "spline")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Fit cubic spline."""
        # Create spline object
        cs = interpolate.CubicSpline(x, y, bc_type='natural')

        return {
            'x_data': x.tolist(),
            'y_data': y.tolist(),
            'coefficients': cs.c.tolist(),
            'method': 'cubic'
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using cubic spline."""
        x_data = np.array(params['x_data'])
        y_data = np.array(params['y_data'])

        cs = interpolate.CubicSpline(x_data, y_data, bc_type='natural')
        return cs(x)


class AkimaSpline(YieldCurveModel):
    """Akima spline interpolation."""

    def __init__(self):
        super().__init__("Akima Spline", "spline")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Fit Akima spline."""
        return {
            'x_data': x.tolist(),
            'y_data': y.tolist(),
            'method': 'akima'
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using Akima spline."""
        x_data = np.array(params['x_data'])
        y_data = np.array(params['y_data'])

        akima = interpolate.Akima1DInterpolator(x_data, y_data)
        return akima(x)


class PCHIPInterpolation(YieldCurveModel):
    """PCHIP (Piecewise Cubic Hermite) interpolation."""

    def __init__(self):
        super().__init__("PCHIP", "spline")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """Fit PCHIP interpolation."""
        return {
            'x_data': x.tolist(),
            'y_data': y.tolist(),
            'method': 'pchip'
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using PCHIP."""
        x_data = np.array(params['x_data'])
        y_data = np.array(params['y_data'])

        pchip = interpolate.PchipInterpolator(x_data, y_data)
        return pchip(x)


class SmoothingSpline(YieldCurveModel):
    """Smoothing spline with regularization."""

    def __init__(self):
        super().__init__("Smoothing Spline", "spline")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """
        Fit smoothing spline.

        kwargs:
            smoothing: Smoothing factor (0 = interpolation, higher = smoother)
        """
        smoothing = kwargs.get('smoothing', 0.5)

        # Use UnivariateSpline with smoothing parameter
        # s parameter controls smoothing (0 = interpolating spline)
        # Heuristic: s = len(x) * smoothing_factor
        s = len(x) * smoothing if smoothing > 0 else 0

        return {
            'x_data': x.tolist(),
            'y_data': y.tolist(),
            'smoothing': smoothing,
            's_parameter': s,
            'method': 'smoothing'
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using smoothing spline."""
        x_data = np.array(params['x_data'])
        y_data = np.array(params['y_data'])
        s = params.get('s_parameter', 0)

        spl = interpolate.UnivariateSpline(x_data, y_data, s=s)
        return spl(x)


class NelsonSiegelModel(YieldCurveModel):
    """Nelson-Siegel parametric model."""

    def __init__(self):
        super().__init__("Nelson-Siegel", "parametric")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """
        Fit Nelson-Siegel model.

        kwargs:
            initial_params: Optional initial parameter guess [beta0, beta1, beta2, tau]
            bounds: Optional parameter bounds
        """
        initial_params = kwargs.get('initial_params', None)
        bounds = kwargs.get('bounds', None)

        # Fit the model
        result = fit_nelson_siegel(x, y, initial_params, bounds)

        if not result['success']:
            raise ValueError(f"Nelson-Siegel optimization failed: {result['message']}")

        beta0, beta1, beta2, tau = result['parameters']

        return {
            'beta0': beta0,
            'beta1': beta1,
            'beta2': beta2,
            'tau': tau,
            'method': 'nelson_siegel',
            'rmse': result['rmse'],
            'success': result['success'],
            'message': result['message'],
            'iterations': result.get('iterations', None)
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using Nelson-Siegel model."""
        beta0 = params['beta0']
        beta1 = params['beta1']
        beta2 = params['beta2']
        tau = params['tau']

        return nelson_siegel(x, beta0, beta1, beta2, tau)


class NelsonSiegelSvenssonModel(YieldCurveModel):
    """Nelson-Siegel-Svensson parametric model."""

    def __init__(self):
        super().__init__("Nelson-Siegel-Svensson", "parametric")

    def fit(self, x: np.ndarray, y: np.ndarray, **kwargs) -> Dict:
        """
        Fit Nelson-Siegel-Svensson model.

        kwargs:
            initial_params: Optional initial parameter guess [beta0, beta1, beta2, beta3, tau1, tau2]
            bounds: Optional parameter bounds
        """
        initial_params = kwargs.get('initial_params', None)
        bounds = kwargs.get('bounds', None)

        # Fit the model
        result = fit_nelson_siegel_svensson(x, y, initial_params, bounds)

        if not result['success']:
            raise ValueError(f"Nelson-Siegel-Svensson optimization failed: {result['message']}")

        beta0, beta1, beta2, beta3, tau1, tau2 = result['parameters']

        return {
            'beta0': beta0,
            'beta1': beta1,
            'beta2': beta2,
            'beta3': beta3,
            'tau1': tau1,
            'tau2': tau2,
            'method': 'nelson_siegel_svensson',
            'rmse': result['rmse'],
            'success': result['success'],
            'message': result['message'],
            'iterations': result.get('iterations', None)
        }

    def predict(self, x: np.ndarray, params: Dict) -> np.ndarray:
        """Predict using Nelson-Siegel-Svensson model."""
        beta0 = params['beta0']
        beta1 = params['beta1']
        beta2 = params['beta2']
        beta3 = params['beta3']
        tau1 = params['tau1']
        tau2 = params['tau2']

        return nelson_siegel_svensson(x, beta0, beta1, beta2, beta3, tau1, tau2)


# Model registry
MODELS = {
    'linear': LinearInterpolation(),
    'cubic_spline': CubicSpline(),
    'akima': AkimaSpline(),
    'pchip': PCHIPInterpolation(),
    'smoothing_spline': SmoothingSpline(),
    'nelson_siegel': NelsonSiegelModel(),
    'nelson_siegel_svensson': NelsonSiegelSvenssonModel()
}


def calculate_curve(
    method: str,
    contracts: List[Dict],
    parameters: Optional[Dict] = None,
    num_points: int = 1260
) -> Dict:
    """
    Calculate smoothed yield curve using specified method.

    Args:
        method: Method ID ('linear', 'cubic_spline', etc.)
        contracts: List of contracts with 'years' and 'rate' fields
        parameters: Optional method-specific parameters
        num_points: Number of points in output curve (default 1260 = 5 years daily)

    Returns:
        Dictionary with original points, curve points, parameters, and metrics
    """
    if method not in MODELS:
        raise ValueError(f"Unknown method: {method}. Available: {list(MODELS.keys())}")

    if len(contracts) < 2:
        raise ValueError("Need at least 2 contracts to fit a curve")

    # Extract data
    x_data = np.array([c['years'] for c in contracts])
    y_data = np.array([c['rate'] for c in contracts])

    # Sort by maturity
    sort_idx = np.argsort(x_data)
    x_data = x_data[sort_idx]
    y_data = y_data[sort_idx]

    # Check for minimum data points based on method
    min_points = {
        'cubic_spline': 3,
        'akima': 5,
        'nelson_siegel': 4,
        'nelson_siegel_svensson': 6
    }

    if method in min_points and len(contracts) < min_points[method]:
        raise ValueError(
            f"Method '{method}' requires at least {min_points[method]} data points, "
            f"got {len(contracts)}"
        )

    # Get model
    model = MODELS[method]

    # Prepare parameters
    fit_params = parameters or {}

    # Fit the model
    try:
        fitted_params = model.fit(x_data, y_data, **fit_params)
    except Exception as e:
        raise ValueError(f"Error fitting model: {str(e)}")

    # Generate curve points
    max_maturity = x_data[-1]
    min_maturity = max(x_data[0], 0.001)  # Avoid zero for parametric models
    x_curve = np.linspace(min_maturity, max_maturity, num_points)
    y_curve = model.predict(x_curve, fitted_params)

    # Convert to business days
    business_days_curve = (x_curve * BUSINESS_DAYS_PER_YEAR).astype(int)
    business_days_data = (x_data * BUSINESS_DAYS_PER_YEAR).astype(int)

    # Calculate metrics
    y_fitted = model.predict(x_data, fitted_params)
    metrics = calculate_metrics(y_data, y_fitted)

    # Prepare original points
    original_points = [
        {
            'business_days': int(bd),
            'years': float(x),
            'rate': float(y),
            'rate_percent': float(y * 100)
        }
        for bd, x, y in zip(business_days_data, x_data, y_data)
    ]

    # Prepare curve points
    curve_points = [
        {
            'business_days': int(bd),
            'years': float(x),
            'rate': float(y),
            'rate_percent': float(y * 100)
        }
        for bd, x, y in zip(business_days_curve, x_curve, y_curve)
    ]

    return {
        'method': method,
        'method_name': model.name,
        'method_type': model.method_type,
        'original_points': original_points,
        'curve_points': curve_points,
        'parameters_used': fitted_params,
        'metrics': metrics,
        'num_original_points': len(original_points),
        'num_curve_points': len(curve_points)
    }
