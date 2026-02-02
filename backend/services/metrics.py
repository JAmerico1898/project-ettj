"""Goodness-of-fit metrics for yield curve models."""

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
