"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
from enum import Enum


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
    business_days: int = Field(..., ge=1)
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
    reference_date: date
    method: SmoothingMethod
    points: List[CurvePoint]
    parameters: Optional[dict] = Field(
        None,
        description="Fitted parameters for parametric methods"
    )


class MethodInfo(BaseModel):
    """Information about a smoothing method."""
    id: SmoothingMethod
    name: str
    description: str
    category: str
    has_parameters: bool = False


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"


class APIInfoResponse(BaseModel):
    """API information response."""
    name: str = "ETTJ API"
    version: str = "1.0.0"
    description: str = "Term structure of Brazilian DI interest rates"
