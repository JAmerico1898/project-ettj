# Feature 3: Mathematical Models - Interpolation and Smoothing Methods

## Overview
Implement seven different interpolation and smoothing methods to generate smooth yield curves from discrete DI1 futures contract data points. This feature provides the mathematical foundation for term structure modeling, enabling comparison of different curve-fitting approaches.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 2** completed (DI1 data fetching)
- Backend server running with real DI1 data available
- Understanding of interpolation methods and optimization

---

## Objectives
- Implement 7 smoothing/interpolation methods:
  - **Simple**: Linear interpolation
  - **Spline**: Cubic, Akima, PCHIP, Smoothing Spline
  - **Parametric**: Nelson-Siegel, Nelson-Siegel-Svensson
- Generate smooth curves with configurable granularity
- Optimize parametric models using L-BFGS-B algorithm
- Handle edge cases (insufficient data, optimization failures)
- Provide consistent API across all methods
- Calculate goodness-of-fit metrics
- Support extrapolation for parametric models

---

## Mathematical Background

### Method Categories

#### 1. Simple Interpolation
**Linear Interpolation**
- Straight lines between consecutive points
- No smoothness guarantee (discontinuous derivatives)
- Fast and simple
- Good for visualization of raw data

#### 2. Spline Methods
**Cubic Spline**
- Third-degree polynomial between points
- Continuous second derivative (smooth)
- Can have oscillations with many points

**Akima Spline**
- Modified cubic spline
- Reduces oscillations near steep gradients
- Better for non-uniform data

**PCHIP (Piecewise Cubic Hermite Interpolating Polynomial)**
- Monotonic interpolation
- Preserves shape of data
- No overshooting

**Smoothing Spline**
- Regularized spline with smoothing parameter
- Balances fit vs. smoothness
- User-configurable smoothing factor

#### 3. Parametric Models
**Nelson-Siegel Model** (4 parameters: β₀, β₁, β₂, τ)
```
r(m) = β₀ + β₁ * ((1 - exp(-m/τ)) / (m/τ)) + β₂ * ((1 - exp(-m/τ)) / (m/τ) - exp(-m/τ))

where:
- r(m) = rate at maturity m (in years)
- β₀ = long-term rate (level)
- β₁ = short-term component (slope)
- β₂ = medium-term component (curvature)
- τ = decay factor
```

**Nelson-Siegel-Svensson Model** (6 parameters: β₀, β₁, β₂, β₃, τ₁, τ₂)
```
r(m) = β₀ + β₁ * ((1 - exp(-m/τ₁)) / (m/τ₁)) 
          + β₂ * ((1 - exp(-m/τ₁)) / (m/τ₁) - exp(-m/τ₁))
          + β₃ * ((1 - exp(-m/τ₂)) / (m/τ₂) - exp(-m/τ₂))

where:
- β₃ = second curvature component
- τ₂ = second decay factor
```

---

## Implementation

### File Structure
```
backend/
├── services/
│   ├── models.py              # Main implementation (THIS FEATURE)
│   ├── optimization.py        # Parametric model optimization (NEW)
│   └── metrics.py             # Goodness-of-fit metrics (NEW)
├── routers/
│   └── api.py                 # Update /api/curve endpoint
└── tests/
    ├── test_models.py         # Unit tests (NEW)
    └── test_optimization.py   # Optimization tests (NEW)
```

---

## Code Implementation

### `backend/services/models.py` (NEW FILE)
```python
"""
Interpolation and smoothing methods for yield curve modeling.
"""
from typing import List, Dict, Tuple, Optional, Callable
import numpy as np
from scipy import interpolate
from scipy.optimize import minimize, least_squares
from .optimization import (
    fit_nelson_siegel,
    fit_nelson_siegel_svensson,
    nelson_siegel,
    nelson_siegel_svensson
)
from .metrics import calculate_metrics

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
    'cubic': CubicSpline(),
    'akima': AkimaSpline(),
    'pchip': PCHIPInterpolation(),
    'smoothing': SmoothingSpline(),
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
        method: Method ID ('linear', 'cubic', etc.)
        contracts: List of DI1 contracts with 'years' and 'rate' fields
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
        'cubic': 3,
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
    x_curve = np.linspace(0, max_maturity, num_points)
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
```

### `backend/services/optimization.py` (NEW FILE)
```python
"""
Optimization routines for parametric yield curve models.
"""
import numpy as np
from scipy.optimize import minimize, OptimizeResult
from typing import Tuple, Optional, List, Dict

def nelson_siegel(
    m: np.ndarray,
    beta0: float,
    beta1: float,
    beta2: float,
    tau: float
) -> np.ndarray:
    """
    Nelson-Siegel yield curve model.
    
    Args:
        m: Maturities in years
        beta0: Long-term level
        beta1: Short-term component
        beta2: Medium-term component (curvature)
        tau: Decay factor
        
    Returns:
        Predicted rates
    """
    # Avoid division by zero
    m = np.maximum(m, 1e-10)
    
    factor1 = (1 - np.exp(-m / tau)) / (m / tau)
    factor2 = factor1 - np.exp(-m / tau)
    
    return beta0 + beta1 * factor1 + beta2 * factor2


def nelson_siegel_svensson(
    m: np.ndarray,
    beta0: float,
    beta1: float,
    beta2: float,
    beta3: float,
    tau1: float,
    tau2: float
) -> np.ndarray:
    """
    Nelson-Siegel-Svensson yield curve model.
    
    Args:
        m: Maturities in years
        beta0: Long-term level
        beta1: Short-term component
        beta2: First curvature component
        beta3: Second curvature component
        tau1: First decay factor
        tau2: Second decay factor
        
    Returns:
        Predicted rates
    """
    # Avoid division by zero
    m = np.maximum(m, 1e-10)
    
    factor1 = (1 - np.exp(-m / tau1)) / (m / tau1)
    factor2 = factor1 - np.exp(-m / tau1)
    factor3 = (1 - np.exp(-m / tau2)) / (m / tau2) - np.exp(-m / tau2)
    
    return beta0 + beta1 * factor1 + beta2 * factor2 + beta3 * factor3


def fit_nelson_siegel(
    x: np.ndarray,
    y: np.ndarray,
    initial_params: Optional[np.ndarray] = None,
    bounds: Optional[List[Tuple]] = None
) -> Dict:
    """
    Fit Nelson-Siegel model using L-BFGS-B optimization.
    
    Args:
        x: Maturities (in years)
        y: Observed rates (as decimals)
        initial_params: Initial guess [beta0, beta1, beta2, tau]
        bounds: Parameter bounds [(min, max), ...]
        
    Returns:
        Dictionary with optimization results
    """
    # Default initial parameters
    if initial_params is None:
        beta0_init = y[-1]  # Use longest rate as level
        beta1_init = y[0] - y[-1]  # Short-long spread
        beta2_init = 0.0
        tau_init = 1.0
        initial_params = np.array([beta0_init, beta1_init, beta2_init, tau_init])
    
    # Default bounds
    if bounds is None:
        bounds = [
            (-0.5, 0.5),   # beta0: -50% to 50%
            (-0.5, 0.5),   # beta1
            (-0.5, 0.5),   # beta2
            (0.1, 10.0)    # tau: positive, reasonable range
        ]
    
    # Objective function: minimize sum of squared errors
    def objective(params):
        beta0, beta1, beta2, tau = params
        y_pred = nelson_siegel(x, beta0, beta1, beta2, tau)
        return np.sum((y - y_pred) ** 2)
    
    # Optimize
    result = minimize(
        objective,
        initial_params,
        method='L-BFGS-B',
        bounds=bounds,
        options={'maxiter': 1000}
    )
    
    # Calculate RMSE
    y_pred = nelson_siegel(x, *result.x)
    rmse = np.sqrt(np.mean((y - y_pred) ** 2))
    
    return {
        'parameters': result.x.tolist(),
        'success': result.success,
        'message': result.message,
        'rmse': float(rmse),
        'iterations': result.nit
    }


def fit_nelson_siegel_svensson(
    x: np.ndarray,
    y: np.ndarray,
    initial_params: Optional[np.ndarray] = None,
    bounds: Optional[List[Tuple]] = None
) -> Dict:
    """
    Fit Nelson-Siegel-Svensson model using L-BFGS-B optimization.
    
    Args:
        x: Maturities (in years)
        y: Observed rates (as decimals)
        initial_params: Initial guess [beta0, beta1, beta2, beta3, tau1, tau2]
        bounds: Parameter bounds [(min, max), ...]
        
    Returns:
        Dictionary with optimization results
    """
    # Default initial parameters
    if initial_params is None:
        beta0_init = y[-1]
        beta1_init = y[0] - y[-1]
        beta2_init = 0.0
        beta3_init = 0.0
        tau1_init = 1.0
        tau2_init = 3.0
        initial_params = np.array([
            beta0_init, beta1_init, beta2_init, beta3_init, tau1_init, tau2_init
        ])
    
    # Default bounds
    if bounds is None:
        bounds = [
            (-0.5, 0.5),   # beta0
            (-0.5, 0.5),   # beta1
            (-0.5, 0.5),   # beta2
            (-0.5, 0.5),   # beta3
            (0.1, 10.0),   # tau1
            (0.1, 10.0)    # tau2
        ]
    
    # Objective function
    def objective(params):
        beta0, beta1, beta2, beta3, tau1, tau2 = params
        y_pred = nelson_siegel_svensson(x, beta0, beta1, beta2, beta3, tau1, tau2)
        return np.sum((y - y_pred) ** 2)
    
    # Optimize
    result = minimize(
        objective,
        initial_params,
        method='L-BFGS-B',
        bounds=bounds,
        options={'maxiter': 1000}
    )
    
    # Calculate RMSE
    y_pred = nelson_siegel_svensson(x, *result.x)
    rmse = np.sqrt(np.mean((y - y_pred) ** 2))
    
    return {
        'parameters': result.x.tolist(),
        'success': result.success,
        'message': result.message,
        'rmse': float(rmse),
        'iterations': result.nit
    }
```

### `backend/services/metrics.py` (NEW FILE)
```python
"""
Goodness-of-fit metrics for yield curve models.
"""
import numpy as np
from typing import Dict

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """
    Calculate goodness-of-fit metrics.
    
    Args:
        y_true: Observed values
        y_pred: Predicted values
        
    Returns:
        Dictionary with metrics
    """
    # Residuals
    residuals = y_true - y_pred
    
    # Mean Absolute Error
    mae = float(np.mean(np.abs(residuals)))
    
    # Root Mean Squared Error
    rmse = float(np.sqrt(np.mean(residuals ** 2)))
    
    # R-squared
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r_squared = float(1 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0
    
    # Maximum Absolute Error
    max_error = float(np.max(np.abs(residuals)))
    
    # Mean Error (bias)
    mean_error = float(np.mean(residuals))
    
    return {
        'mae': mae,
        'rmse': rmse,
        'r_squared': r_squared,
        'max_error': max_error,
        'mean_error': mean_error,
        'mae_percent': mae * 100,  # Convert to percentage points
        'rmse_percent': rmse * 100,
        'max_error_percent': max_error * 100
    }
```

### `backend/routers/api.py` (UPDATE)
Update the `/api/curve` endpoint:

```python
from fastapi import APIRouter, HTTPException, Body
from typing import Optional, Dict, List
from services.models import calculate_curve, MODELS
from schemas.contracts import CurveRequest, CurveResponse, CurvePoint

@router.post("/curve", response_model=CurveResponse)
async def calculate_yield_curve(
    request: CurveRequest = Body(...)
):
    """
    Calculate smoothed yield curve using selected method.
    
    Request body:
        - method: Interpolation method ID
        - data: List of DI1 contracts
        - parameters: Optional method-specific parameters
    
    Returns:
        CurveResponse with original points, curve points, and metrics
    """
    try:
        # Validate method
        if request.method not in MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown method: {request.method}. "
                       f"Available methods: {list(MODELS.keys())}"
            )
        
        # Calculate curve
        result = calculate_curve(
            method=request.method,
            contracts=request.data,
            parameters=request.parameters or {}
        )
        
        # Convert to response model
        original_points = [CurvePoint(**pt) for pt in result['original_points']]
        curve_points = [CurvePoint(**pt) for pt in result['curve_points']]
        
        return CurveResponse(
            method=result['method'],
            method_name=result['method_name'],
            method_type=result['method_type'],
            original_points=original_points,
            curve_points=curve_points,
            parameters_used=result['parameters_used'],
            metrics=result['metrics'],
            num_original_points=result['num_original_points'],
            num_curve_points=result['num_curve_points']
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating curve: {str(e)}"
        )
```

### `backend/schemas/contracts.py` (UPDATE)
Add fields to CurveResponse:

```python
class CurveResponse(BaseModel):
    """Response for curve calculation endpoint"""
    method: str = Field(..., description="Method ID used")
    method_name: str = Field(..., description="Human-readable method name")
    method_type: str = Field(..., description="Method type: simple, spline, or parametric")
    original_points: List[CurvePoint] = Field(..., description="Original data points")
    curve_points: List[CurvePoint] = Field(..., description="Smoothed curve points")
    parameters_used: Dict = Field(..., description="Parameters used for fitting")
    metrics: Dict = Field(..., description="Goodness-of-fit metrics")
    num_original_points: int = Field(..., description="Number of original points")
    num_curve_points: int = Field(..., description="Number of curve points")
    
    class Config:
        json_schema_extra = {
            "example": {
                "method": "nelson_siegel",
                "method_name": "Nelson-Siegel",
                "method_type": "parametric",
                "original_points": [...],
                "curve_points": [...],
                "parameters_used": {
                    "beta0": 0.105,
                    "beta1": -0.02,
                    "beta2": 0.01,
                    "tau": 1.5
                },
                "metrics": {
                    "rmse": 0.0005,
                    "mae": 0.0003,
                    "r_squared": 0.998
                },
                "num_original_points": 60,
                "num_curve_points": 1260
            }
        }
```

---

## Testing

### `backend/tests/test_models.py` (NEW FILE)
```python
"""
Unit tests for interpolation models.
"""
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

@pytest.fixture
def sample_data():
    """Sample yield curve data."""
    x = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0])
    y = np.array([0.10, 0.102, 0.105, 0.108, 0.110, 0.112])
    return x, y

@pytest.fixture
def sample_contracts():
    """Sample DI1 contracts."""
    return [
        {'years': 0.25, 'rate': 0.10, 'business_days': 63},
        {'years': 0.5, 'rate': 0.102, 'business_days': 126},
        {'years': 1.0, 'rate': 0.105, 'business_days': 252},
        {'years': 2.0, 'rate': 0.108, 'business_days': 504},
        {'years': 3.0, 'rate': 0.110, 'business_days': 756},
        {'years': 5.0, 'rate': 0.112, 'business_days': 1260}
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
```

### `backend/tests/test_optimization.py` (NEW FILE)
```python
"""
Tests for optimization routines.
"""
import pytest
import numpy as np
from services.optimization import (
    nelson_siegel,
    nelson_siegel_svensson,
    fit_nelson_siegel,
    fit_nelson_siegel_svensson
)

def test_nelson_siegel_function():
    """Test Nelson-Siegel function calculation."""
    m = np.array([0.5, 1.0, 2.0, 5.0])
    beta0, beta1, beta2, tau = 0.10, -0.02, 0.01, 1.5
    
    rates = nelson_siegel(m, beta0, beta1, beta2, tau)
    
    assert len(rates) == len(m)
    assert np.all(rates > 0)
    assert np.all(rates < 1)

def test_nelson_siegel_svensson_function():
    """Test Nelson-Siegel-Svensson function calculation."""
    m = np.array([0.5, 1.0, 2.0, 5.0])
    beta0, beta1, beta2, beta3, tau1, tau2 = 0.10, -0.02, 0.01, 0.005, 1.0, 3.0
    
    rates = nelson_siegel_svensson(m, beta0, beta1, beta2, beta3, tau1, tau2)
    
    assert len(rates) == len(m)
    assert np.all(rates > 0)
    assert np.all(rates < 1)

def test_fit_nelson_siegel_convergence():
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
    assert abs(fitted_params[0] - true_params[0]) < 0.01

def test_fit_nelson_siegel_svensson_convergence():
    """Test that NSS optimization converges."""
    true_params = [0.10, -0.02, 0.01, 0.005, 1.0, 3.0]
    m = np.linspace(0.25, 5.0, 25)
    y_true = nelson_siegel_svensson(m, *true_params)
    
    np.random.seed(42)
    y_noisy = y_true + np.random.normal(0, 0.0001, len(y_true))
    
    result = fit_nelson_siegel_svensson(m, y_noisy)
    
    assert result['success'] == True
    assert result['rmse'] < 0.001
```

---

## Manual Testing

### Test Case 1: Linear Interpolation
```bash
# First, get DI1 data
curl "http://localhost:8000/api/di1?date=2025-01-31" > di1_data.json

# Extract contracts (manually or with jq)
# Then call curve endpoint
curl -X POST "http://localhost:8000/api/curve" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "linear",
    "data": [
      {"years": 0.25, "rate": 0.10},
      {"years": 0.5, "rate": 0.102},
      {"years": 1.0, "rate": 0.105},
      {"years": 2.0, "rate": 0.108}
    ]
  }'

# Expected: Smooth response with curve_points
```

### Test Case 2: Nelson-Siegel with Parameters
```bash
curl -X POST "http://localhost:8000/api/curve" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "nelson_siegel",
    "data": [
      {"years": 0.25, "rate": 0.10},
      {"years": 0.5, "rate": 0.102},
      {"years": 1.0, "rate": 0.105},
      {"years": 2.0, "rate": 0.108},
      {"years": 3.0, "rate": 0.110},
      {"years": 5.0, "rate": 0.112}
    ],
    "parameters": {
      "initial_params": [0.10, -0.01, 0.005, 1.5]
    }
  }'

# Expected: Response with fitted beta0, beta1, beta2, tau
```

### Test Case 3: Smoothing Spline with Custom Smoothing
```bash
curl -X POST "http://localhost:8000/api/curve" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "smoothing",
    "data": [...],
    "parameters": {
      "smoothing": 0.8
    }
  }'
```

### Test Case 4: Error - Insufficient Data
```bash
curl -X POST "http://localhost:8000/api/curve" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "cubic",
    "data": [
      {"years": 1.0, "rate": 0.10},
      {"years": 2.0, "rate": 0.11}
    ]
  }'

# Expected: 400 error - cubic needs at least 3 points
```

---

## Acceptance Criteria

### Backend
- ✅ All 7 methods implemented and working
- ✅ Linear interpolation produces straight lines between points
- ✅ Cubic spline passes through all data points smoothly
- ✅ PCHIP maintains monotonicity where appropriate
- ✅ Nelson-Siegel optimization converges successfully
- ✅ Nelson-Siegel-Svensson optimization converges successfully
- ✅ Goodness-of-fit metrics calculated correctly
- ✅ Error handling for insufficient data points
- ✅ Error handling for optimization failures
- ✅ Curve points generated with configurable granularity
- ✅ Parameters returned for transparency
- ✅ Unit tests pass for all methods
- ✅ Integration tests with real DI1 data pass

---

## Performance Benchmarks

### Expected Performance
- **Simple/Spline methods**: < 100ms
- **Nelson-Siegel**: 100-500ms (optimization)
- **Nelson-Siegel-Svensson**: 200-1000ms (more complex optimization)

### Optimization Iterations
- **Nelson-Siegel**: Typically 20-100 iterations
- **Nelson-Siegel-Svensson**: Typically 50-200 iterations

---

## Mathematical Validation

### Visual Checks
1. **Smoothness**: Curve should be visually smooth, no sudden jumps
2. **Fit**: Curve should pass through or near original points
3. **Extrapolation**: Parametric models can extrapolate reasonably

### Numerical Checks
1. **RMSE**: Should be < 0.01 (1%) for good fit
2. **R²**: Should be > 0.95 for parametric models
3. **No NaN/Inf**: All predictions must be finite numbers

---

## Known Limitations

1. **Optimization Convergence**: Parametric models may fail to converge with poor initial guesses or bad data

2. **Extrapolation**: Spline methods should not be used for extrapolation (unreliable beyond data range)

3. **Oscillations**: Cubic spline can oscillate with many data points

4. **Parameter Bounds**: Current bounds are heuristic; may need adjustment for extreme market conditions

---

## Future Enhancements

1. **Additional Methods**
   - B-splines with knot selection
   - Kernel regression
   - Gaussian process regression

2. **Robustness**
   - Outlier detection and handling
   - Multiple initial guesses for optimization
   - Constraint on monotonicity for parametric models

3. **Performance**
   - Caching of fitted parameters
   - Parallel optimization with multiple seeds
   - JIT compilation with numba

4. **Validation**
   - Cross-validation scores
   - Forward rates calculation
   - Arbitrage-free constraints

---

## Dependencies

```txt
scipy>=1.11.4       # Optimization and interpolation
numpy>=1.26.3       # Numerical operations
```

---

## Documentation References

- [Nelson-Siegel Model](https://en.wikipedia.org/wiki/Nelson%E2%80%93Siegel%E2%80%93Svensson_model)
- [SciPy Interpolation](https://docs.scipy.org/doc/scipy/reference/interpolate.html)
- [SciPy Optimization](https://docs.scipy.org/doc/scipy/reference/optimize.html)
- [L-BFGS-B Algorithm](https://en.wikipedia.org/wiki/Limited-memory_BFGS)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 3 |