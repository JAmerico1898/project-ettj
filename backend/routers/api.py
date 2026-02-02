"""API router with DI1 and curve endpoints."""

from fastapi import APIRouter, Query, HTTPException
from datetime import date
from typing import List, Optional

from schemas.contracts import (
    DI1Response,
    CurveRequest,
    CurveResponse,
    MethodInfo,
    SmoothingMethod,
)
from services.data import di1_service

router = APIRouter(prefix="/api", tags=["API"])


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
async def calculate_curve(request: CurveRequest) -> CurveResponse:
    """
    Calculate smoothed yield curve using specified method.

    Placeholder endpoint - will be implemented in Feature 3.
    """
    # Placeholder response for testing
    return CurveResponse(
        reference_date=request.reference_date,
        method=request.method,
        points=[],
        parameters=None,
    )
