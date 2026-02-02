"""API v1 router with DI1, curve, workflow, and comparison endpoints."""

from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from datetime import date
from typing import List, Optional

from schemas.contracts import (
    DI1Response,
    DI1SummaryResponse,
    CurveRequest,
    CurveResponse,
    CurvePoint,
    MethodInfo,
    SmoothingMethod,
    WorkflowRequest,
    WorkflowResponse,
    CompareMethodsRequest,
    CompareMethodsResponse,
    MethodComparisonResult,
    METHOD_MIN_POINTS,
)
from services.data import di1_service
from services.models import calculate_curve, MODELS
from utils.validators import validate_date_string, validate_method

router = APIRouter(tags=["API v1"])

# Business days per year (Brazilian convention)
BUSINESS_DAYS_PER_YEAR = 252

# Method definitions with metadata
METHODS: List[MethodInfo] = [
    MethodInfo(
        id=SmoothingMethod.LINEAR,
        name="Linear",
        description="Simple linear interpolation between points",
        category="Simple",
        min_points=METHOD_MIN_POINTS["linear"],
    ),
    MethodInfo(
        id=SmoothingMethod.CUBIC_SPLINE,
        name="Cubic Spline",
        description="Cubic spline interpolation with natural boundary conditions",
        category="Splines",
        min_points=METHOD_MIN_POINTS["cubic_spline"],
    ),
    MethodInfo(
        id=SmoothingMethod.AKIMA,
        name="Akima",
        description="Akima interpolation - reduces oscillations near outliers",
        category="Splines",
        min_points=METHOD_MIN_POINTS["akima"],
    ),
    MethodInfo(
        id=SmoothingMethod.PCHIP,
        name="PCHIP",
        description="Piecewise Cubic Hermite Interpolating Polynomial - monotonicity preserving",
        category="Splines",
        min_points=METHOD_MIN_POINTS["pchip"],
    ),
    MethodInfo(
        id=SmoothingMethod.SMOOTHING_SPLINE,
        name="Smoothing Spline",
        description="Smoothing spline with adjustable smoothness parameter",
        category="Splines",
        has_parameters=True,
        min_points=METHOD_MIN_POINTS["smoothing_spline"],
        parameters={"smoothing": {"type": "float", "min": 0, "max": 1, "default": 0.5}},
    ),
    MethodInfo(
        id=SmoothingMethod.NELSON_SIEGEL,
        name="Nelson-Siegel",
        description="Parametric model with level, slope, and curvature factors",
        category="Parametric",
        min_points=METHOD_MIN_POINTS["nelson_siegel"],
    ),
    MethodInfo(
        id=SmoothingMethod.NELSON_SIEGEL_SVENSSON,
        name="Nelson-Siegel-Svensson",
        description="Extended Nelson-Siegel with additional curvature term",
        category="Parametric",
        min_points=METHOD_MIN_POINTS["nelson_siegel_svensson"],
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


@router.get("/di1/summary", response_model=DI1SummaryResponse)
async def get_di1_summary(
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
) -> DI1SummaryResponse:
    """
    Get summary statistics for DI1 futures data.

    Returns count, maturity range, rate statistics, and spread information.
    """
    try:
        data = di1_service.fetch_di1_data(date, max_business_days)
        contracts = data["contracts"]

        if not contracts:
            raise HTTPException(
                status_code=404,
                detail="No DI1 contracts found for the specified date",
            )

        rates = [c.rate_percent for c in contracts]
        maturities = [c.business_days for c in contracts]

        min_rate = min(rates)
        max_rate = max(rates)
        spread_bps = (max_rate - min_rate) * 100  # Convert percentage points to bps

        return DI1SummaryResponse(
            reference_date=data["reference_date"],
            actual_date=data["actual_date"],
            count=data["count"],
            min_maturity_days=min(maturities),
            max_maturity_days=max(maturities),
            min_rate_percent=min_rate,
            max_rate_percent=max_rate,
            avg_rate_percent=sum(rates) / len(rates),
            spread_bps=spread_bps,
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


@router.post("/workflow", response_model=WorkflowResponse)
async def workflow(request: WorkflowRequest) -> WorkflowResponse:
    """
    End-to-end workflow: fetch DI1 data and calculate smoothed curve.

    Combines the /di1 and /curve endpoints into a single request.
    Useful for mobile apps to minimize round trips.
    """
    try:
        # Validate and parse date string
        parsed_date = validate_date_string(request.date)

        # Fetch DI1 data
        data = di1_service.fetch_di1_data(parsed_date, request.max_business_days)
        contracts = data["contracts"]

        if not contracts:
            raise HTTPException(
                status_code=404,
                detail="No DI1 contracts found for the specified date",
            )

        # Validate method
        method_str = request.method.value
        if method_str not in MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown method: {method_str}. "
                       f"Available methods: {list(MODELS.keys())}"
            )

        # Check minimum points
        min_pts = METHOD_MIN_POINTS.get(method_str, 2)
        if len(contracts) < min_pts:
            raise HTTPException(
                status_code=400,
                detail=f"Method '{method_str}' requires at least {min_pts} data points, "
                       f"but only {len(contracts)} contracts available",
            )

        # Convert contracts to dict format
        contracts_data = [
            {
                'years': c.business_days / BUSINESS_DAYS_PER_YEAR,
                'rate': c.rate
            }
            for c in contracts
        ]

        # Prepare parameters
        params = request.parameters or {}

        # Calculate curve
        result = calculate_curve(
            method=method_str,
            contracts=contracts_data,
            parameters=params,
            num_points=request.num_points
        )

        # Convert to response objects
        original_points = [CurvePoint(**pt) for pt in result['original_points']]
        curve_points = [CurvePoint(**pt) for pt in result['curve_points']]

        return WorkflowResponse(
            reference_date=data["reference_date"],
            actual_date=data["actual_date"],
            method=request.method,
            method_name=result['method_name'],
            method_type=result['method_type'],
            contracts_count=len(contracts),
            original_points=original_points,
            curve_points=curve_points,
            parameters=result['parameters_used'],
            metrics=result['metrics'],
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in workflow: {str(e)}"
        )


@router.post("/curve/compare", response_model=CompareMethodsResponse)
async def compare_methods(request: CompareMethodsRequest) -> CompareMethodsResponse:
    """
    Compare multiple smoothing methods on the same DI1 data.

    Useful for analyzing which method best fits the data or for
    educational comparison of different approaches.
    """
    try:
        # Validate and parse date string
        parsed_date = validate_date_string(request.date)

        # Fetch DI1 data
        data = di1_service.fetch_di1_data(parsed_date, request.max_business_days)
        contracts = data["contracts"]

        if not contracts:
            raise HTTPException(
                status_code=404,
                detail="No DI1 contracts found for the specified date",
            )

        # Convert contracts to dict format
        contracts_data = [
            {
                'years': c.business_days / BUSINESS_DAYS_PER_YEAR,
                'rate': c.rate
            }
            for c in contracts
        ]

        # Build original points
        original_points = [
            CurvePoint(
                business_days=c.business_days,
                years=c.business_days / BUSINESS_DAYS_PER_YEAR,
                rate=c.rate,
                rate_percent=c.rate_percent,
            )
            for c in contracts
        ]

        # Process each method
        results: List[MethodComparisonResult] = []
        for method in request.methods:
            method_str = method.value
            method_info = next((m for m in METHODS if m.id == method), None)
            method_name = method_info.name if method_info else method_str
            method_type = method_info.category.lower() if method_info else "unknown"

            # Check minimum points
            min_pts = METHOD_MIN_POINTS.get(method_str, 2)
            if len(contracts) < min_pts:
                results.append(MethodComparisonResult(
                    method=method,
                    method_name=method_name,
                    method_type=method_type,
                    success=False,
                    error=f"Requires at least {min_pts} data points, got {len(contracts)}",
                ))
                continue

            try:
                result = calculate_curve(
                    method=method_str,
                    contracts=contracts_data,
                    parameters=None,
                    num_points=request.num_points
                )

                curve_points = [CurvePoint(**pt) for pt in result['curve_points']]

                results.append(MethodComparisonResult(
                    method=method,
                    method_name=result['method_name'],
                    method_type=result['method_type'],
                    success=True,
                    curve_points=curve_points,
                    parameters=result['parameters_used'],
                    metrics=result['metrics'],
                ))
            except Exception as e:
                results.append(MethodComparisonResult(
                    method=method,
                    method_name=method_name,
                    method_type=method_type,
                    success=False,
                    error=str(e),
                ))

        return CompareMethodsResponse(
            reference_date=data["reference_date"],
            actual_date=data["actual_date"],
            contracts_count=len(contracts),
            original_points=original_points,
            results=results,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error comparing methods: {str(e)}"
        )
