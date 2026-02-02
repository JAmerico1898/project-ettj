"""API router with DI1 and curve endpoints."""

from fastapi import APIRouter, Query, HTTPException
from datetime import date
from typing import List, Optional

from schemas.contracts import (
    DI1Response,
    CurveRequest,
    CurveResponse,
    CurvePoint,
    MethodInfo,
    SmoothingMethod,
)
from services.data import di1_service
from services.models import calculate_curve, MODELS

router = APIRouter(prefix="/api", tags=["API"])

# Business days per year (Brazilian convention)
BUSINESS_DAYS_PER_YEAR = 252

# Method definitions with metadata
METHODS: List[MethodInfo] = [
    MethodInfo(
        id=SmoothingMethod.LINEAR,
        name="Linear",
        description="Simple linear interpolation between points",
        category="Simple",
    ),
    MethodInfo(
        id=SmoothingMethod.CUBIC_SPLINE,
        name="Cubic Spline",
        description="Cubic spline interpolation with natural boundary conditions",
        category="Splines",
    ),
    MethodInfo(
        id=SmoothingMethod.AKIMA,
        name="Akima",
        description="Akima interpolation - reduces oscillations near outliers",
        category="Splines",
    ),
    MethodInfo(
        id=SmoothingMethod.PCHIP,
        name="PCHIP",
        description="Piecewise Cubic Hermite Interpolating Polynomial - monotonicity preserving",
        category="Splines",
    ),
    MethodInfo(
        id=SmoothingMethod.SMOOTHING_SPLINE,
        name="Smoothing Spline",
        description="Smoothing spline with adjustable smoothness parameter",
        category="Splines",
        has_parameters=True,
    ),
    MethodInfo(
        id=SmoothingMethod.NELSON_SIEGEL,
        name="Nelson-Siegel",
        description="Parametric model with level, slope, and curvature factors",
        category="Parametric",
    ),
    MethodInfo(
        id=SmoothingMethod.NELSON_SIEGEL_SVENSSON,
        name="Nelson-Siegel-Svensson",
        description="Extended Nelson-Siegel with additional curvature term",
        category="Parametric",
    ),
]


@router.get("/methods", response_model=List[MethodInfo])
async def get_methods() -> List[MethodInfo]:
    """Get list of available smoothing/interpolation methods."""
    return METHODS


@router.get("/di1", response_model=DI1Response)
async def get_di1_data(
    date: Optional[date] = Query(
        None,
        description="Reference date (YYYY-MM-DD). Defaults to last business day.",
    ),
    max_business_days: int = Query(
        1260,
        ge=1,
        le=2520,
        description="Maximum business days to maturity (default 1260 = 5 years)",
    ),
) -> DI1Response:
    """
    Fetch DI1 futures data for a given date.

    - If date not provided: returns data for the last business day
    - If date is a non-business day: automatically adjusts to previous business day
    - Response includes both reference_date (requested) and actual_date (data found)
    """
    try:
        data = di1_service.fetch_di1_data(date, max_business_days)
        return DI1Response(
            reference_date=data["reference_date"],
            actual_date=data["actual_date"],
            contracts=data["contracts"],
            count=data["count"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/curve", response_model=CurveResponse)
async def calculate_yield_curve(request: CurveRequest) -> CurveResponse:
    """
    Calculate smoothed yield curve using specified method.

    Takes DI1 contract data and applies the selected interpolation/smoothing method
    to generate a smooth yield curve.

    Returns curve points, fitted parameters (for parametric methods), and
    goodness-of-fit metrics.
    """
    try:
        # Validate method
        method_str = request.method.value
        if method_str not in MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown method: {method_str}. "
                       f"Available methods: {list(MODELS.keys())}"
            )

        # Convert DI1Contract to dict format expected by calculate_curve
        contracts_data = [
            {
                'years': c.business_days / BUSINESS_DAYS_PER_YEAR,
                'rate': c.rate
            }
            for c in request.contracts
        ]

        # Prepare parameters
        params = {}
        if request.smoothing_parameter is not None:
            params['smoothing'] = request.smoothing_parameter

        # Calculate curve
        result = calculate_curve(
            method=method_str,
            contracts=contracts_data,
            parameters=params if params else None
        )

        # Convert dict points to CurvePoint objects
        original_points = [CurvePoint(**pt) for pt in result['original_points']]
        curve_points = [CurvePoint(**pt) for pt in result['curve_points']]

        return CurveResponse(
            reference_date=request.reference_date,
            method=request.method,
            method_name=result['method_name'],
            method_type=result['method_type'],
            original_points=original_points,
            curve_points=curve_points,
            parameters=result['parameters_used'],
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
