"""Optimization routines for parametric yield curve models."""

import numpy as np
from scipy.optimize import minimize
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
        'message': result.message if hasattr(result, 'message') else str(result.message),
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
        'message': result.message if hasattr(result, 'message') else str(result.message),
        'rmse': float(rmse),
        'iterations': result.nit
    }
