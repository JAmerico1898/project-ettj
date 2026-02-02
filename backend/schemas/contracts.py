"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
from datetime import date
from enum import Enum


# Minimum data points required for each method
METHOD_MIN_POINTS: Dict[str, int] = {
    "linear": 2,
    "cubic_spline": 3,
    "akima": 5,
    "pchip": 2,
    "smoothing_spline": 2,
    "nelson_siegel": 4,
    "nelson_siegel_svensson": 6,
}


class SmoothingMethod(str, Enum):
    """Available smoothing/interpolation methods."""
    LINEAR = "linear"
    CUBIC_SPLINE = "cubic_spline"
    AKIMA = "akima"
    PCHIP = "pchip"
    SMOOTHING_SPLINE = "smoothing_spline"
    NELSON_SIEGEL = "nelson_siegel"
    NELSON_SIEGEL_SVENSSON = "nelson_siegel_svensson"


class DI1Contract(BaseModel):
    """DI1 futures contract data."""
    ticker: str = Field(..., description="Contract ticker (e.g., DI1F25)")
    maturity_date: date = Field(..., description="Contract maturity date")
    business_days: int = Field(..., ge=1, description="Business days to maturity")
    rate: float = Field(..., ge=0, description="Annualized rate (as decimal)")
    rate_percent: float = Field(..., ge=0, description="Annualized rate (as percentage)")


class DI1Response(BaseModel):
    """Response for DI1 data endpoint."""
    reference_date: date = Field(..., description="Originally requested date")
    actual_date: date = Field(..., description="Date data was actually retrieved for")
    contracts: List[DI1Contract]
    count: int


class CurvePoint(BaseModel):
    """Single point on the yield curve."""
    business_days: int = Field(..., ge=0)
    years: float = Field(..., ge=0, description="Time to maturity in years")
    rate: float = Field(..., ge=0, description="Rate as decimal")
    rate_percent: float = Field(..., ge=0, description="Rate as percentage")


class CurveRequest(BaseModel):
    """Request for curve calculation."""
    reference_date: date
    method: SmoothingMethod
    contracts: List[DI1Contract]
    smoothing_parameter: Optional[float] = Field(
        None,
        ge=0,
        le=1,
        description="Smoothing parameter for smoothing spline method"
    )


class CurveResponse(BaseModel):
    """Response for curve calculation."""
    model_config = ConfigDict(populate_by_name=True)

    reference_date: date
    method: SmoothingMethod
    method_name: str = Field(..., description="Human-readable method name")
    method_type: str = Field(..., description="Method category: simple, spline, or parametric")
    original_points: List[CurvePoint] = Field(..., description="Original input data points")
    curve_points: List[CurvePoint] = Field(alias="points", description="Smoothed curve points")
    parameters: Optional[Dict[str, Any]] = Field(
        None,
        description="Fitted parameters for parametric methods"
    )
    metrics: Dict[str, float] = Field(..., description="Goodness-of-fit metrics (MAE, RMSE, R-squared)")
    num_original_points: int = Field(..., description="Number of original data points")
    num_curve_points: int = Field(..., description="Number of curve points generated")


class MethodInfo(BaseModel):
    """Information about a smoothing method."""
    id: SmoothingMethod
    name: str
    description: str
    category: str
    has_parameters: bool = False
    min_points: int = Field(2, description="Minimum data points required")
    parameters: Optional[Dict[str, Any]] = Field(
        None,
        description="Available parameters for this method",
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"


class APIInfoResponse(BaseModel):
    """API information response."""
    name: str = "ETTJ API"
    version: str = "1.0.0"
    description: str = "Term structure of Brazilian DI interest rates"


class WorkflowRequest(BaseModel):
    """Request for end-to-end workflow (fetch DI1 + calculate curve)."""
    date: str = Field(
        ...,
        description="Reference date in YYYY-MM-DD format",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    )
    method: SmoothingMethod = Field(
        ...,
        description="Smoothing/interpolation method to use",
    )
    max_business_days: int = Field(
        1260,
        ge=1,
        le=2520,
        description="Maximum business days to maturity (default 1260 = 5 years)",
    )
    parameters: Optional[Dict[str, Any]] = Field(
        None,
        description="Method-specific parameters (e.g., smoothing for smoothing_spline)",
    )
    num_points: int = Field(
        1260,
        ge=10,
        le=2520,
        description="Number of points in the output curve",
    )


class WorkflowResponse(BaseModel):
    """Response for end-to-end workflow."""
    reference_date: date
    actual_date: date
    method: SmoothingMethod
    method_name: str
    method_type: str
    contracts_count: int
    original_points: List[CurvePoint]
    curve_points: List[CurvePoint]
    parameters: Optional[Dict[str, Any]] = None
    metrics: Dict[str, float]


class DI1SummaryResponse(BaseModel):
    """Summary statistics for DI1 data."""
    reference_date: date
    actual_date: date
    count: int
    min_maturity_days: int
    max_maturity_days: int
    min_rate_percent: float
    max_rate_percent: float
    avg_rate_percent: float
    spread_bps: float = Field(
        ...,
        description="Spread between max and min rate in basis points",
    )


class CompareMethodsRequest(BaseModel):
    """Request for comparing multiple methods."""
    date: str = Field(
        ...,
        description="Reference date in YYYY-MM-DD format",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    )
    methods: List[SmoothingMethod] = Field(
        ...,
        min_length=1,
        max_length=7,
        description="List of methods to compare",
    )
    max_business_days: int = Field(
        1260,
        ge=1,
        le=2520,
        description="Maximum business days to maturity",
    )
    num_points: int = Field(
        252,
        ge=10,
        le=2520,
        description="Number of points in the output curve",
    )


class MethodComparisonResult(BaseModel):
    """Result for a single method in comparison."""
    method: SmoothingMethod
    method_name: str
    method_type: str
    success: bool
    error: Optional[str] = None
    curve_points: Optional[List[CurvePoint]] = None
    parameters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, float]] = None


class CompareMethodsResponse(BaseModel):
    """Response for comparing multiple methods."""
    reference_date: date
    actual_date: date
    contracts_count: int
    original_points: List[CurvePoint]
    results: List[MethodComparisonResult]
