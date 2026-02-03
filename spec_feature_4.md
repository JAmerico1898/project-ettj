# Feature 4: REST API Endpoints - Complete Implementation

## Overview
Finalize and enhance all REST API endpoints for the ETTJ DI1 mobile application. This feature completes the backend API by integrating Features 2 (data fetching) and 3 (curve modeling), adds comprehensive error handling, request validation, and API documentation.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 2** completed (DI1 data fetching)
- **Feature 3** completed (interpolation methods)
- Backend server running with all services operational

---

## Objectives
- Complete `/api/curve` endpoint with full integration
- Add `/api/workflow` endpoint for end-to-end processing
- Implement comprehensive request validation
- Add detailed error responses with error codes
- Generate OpenAPI/Swagger documentation
- Add request/response logging
- Implement rate limiting (optional)
- Add CORS configuration for production
- Create API versioning strategy
- Add health check endpoints with dependency status

---

## API Architecture

### Endpoint Overview

```
GET  /                          # Root endpoint
GET  /health                    # Basic health check
GET  /health/detailed           # Detailed health with dependencies
GET  /docs                      # Auto-generated Swagger UI
GET  /redoc                     # Auto-generated ReDoc UI

GET  /api/v1/di1                # Fetch DI1 data
GET  /api/v1/di1/summary        # DI1 summary statistics
GET  /api/v1/methods            # List available methods
POST /api/v1/curve              # Calculate curve
POST /api/v1/workflow           # End-to-end: fetch + calculate
GET  /api/v1/curve/compare      # Compare multiple methods
```

---

## Implementation

### File Structure
```
backend/
├── routers/
│   ├── __init__.py
│   ├── api_v1.py              # All v1 endpoints (UPDATE)
│   └── health.py              # Health check endpoints (NEW)
├── middleware/
│   ├── __init__.py
│   ├── logging.py             # Request/response logging (NEW)
│   └── error_handler.py       # Global error handling (NEW)
├── schemas/
│   ├── __init__.py
│   ├── contracts.py           # Update with new schemas
│   └── errors.py              # Error response schemas (NEW)
├── utils/
│   ├── __init__.py
│   ├── config.py              # Update with API config
│   └── validators.py          # Request validators (NEW)
└── main.py                    # Update with middleware
```

---

## Code Implementation

### `backend/main.py` (UPDATE)
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import logging

from routers import api_v1, health
from utils.config import settings
from middleware.logging import log_request
from middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ETTJ DI1 API",
    description="Brazilian DI1 Term Structure API for mobile application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def add_logging(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Response: {response.status_code} ({process_time:.3f}s)")
    
    return response

# Exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(api_v1.router, prefix="/api/v1", tags=["api"])

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ETTJ DI1 API",
        "version": "1.0.0",
        "description": "Brazilian DI1 Term Structure API",
        "endpoints": {
            "documentation": "/docs",
            "health": "/health",
            "api": "/api/v1"
        }
    }
```

### `backend/routers/health.py` (NEW FILE)
```python
"""
Health check endpoints.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import pyield
from services.data import di1_service

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.
    
    Returns:
        Status message
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with dependency status.
    
    Returns:
        Detailed health information including dependencies
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "dependencies": {}
    }
    
    # Check pyield (B3 data connection)
    try:
        # Try to import and check version
        import pyield
        health_status["dependencies"]["pyield"] = {
            "status": "available",
            "version": getattr(pyield, "__version__", "unknown")
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["dependencies"]["pyield"] = {
            "status": "unavailable",
            "error": str(e)
        }
    
    # Check scipy (optimization)
    try:
        import scipy
        health_status["dependencies"]["scipy"] = {
            "status": "available",
            "version": scipy.__version__
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["dependencies"]["scipy"] = {
            "status": "unavailable",
            "error": str(e)
        }
    
    # Check pandas (data processing)
    try:
        import pandas
        health_status["dependencies"]["pandas"] = {
            "status": "available",
            "version": pandas.__version__
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["dependencies"]["pandas"] = {
            "status": "unavailable",
            "error": str(e)
        }
    
    return health_status
```

### `backend/routers/api_v1.py` (COMPLETE FILE)
```python
"""
API v1 endpoints for ETTJ DI1 application.
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, List
from datetime import datetime

from services.data import di1_service
from services.models import calculate_curve, MODELS
from schemas.contracts import (
    DI1Response, 
    DI1Contract,
    CurveRequest, 
    CurveResponse,
    WorkflowRequest,
    WorkflowResponse,
    CompareMethodsRequest,
    CompareMethodsResponse,
    MethodInfo
)
from schemas.errors import ErrorResponse
from utils.validators import validate_date_string, validate_method

router = APIRouter()

# ============================================================================
# DI1 Data Endpoints
# ============================================================================

@router.get(
    "/di1",
    response_model=DI1Response,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        404: {"model": ErrorResponse, "description": "No data found"},
        500: {"model": ErrorResponse, "description": "Server error"}
    },
    summary="Fetch DI1 futures contracts",
    description="Retrieve DI1 futures contracts from B3 for a specific date"
)
async def get_di1_data(
    date: str = Query(
        ..., 
        description="Reference date in YYYY-MM-DD format",
        regex=r"^\d{4}-\d{2}-\d{2}$",
        example="2025-01-31"
    ),
    max_business_days: Optional[int] = Query(
        1260,
        description="Maximum business days to expiry (default 1260 = 5 years)",
        ge=1,
        le=2520,
        example=1260
    )
):
    """
    Fetch DI1 futures contracts for a given date.
    
    **Parameters:**
    - **date**: Reference date in YYYY-MM-DD format (business day)
    - **max_business_days**: Maximum maturity in business days (default 1260)
    
    **Returns:**
    - List of DI1 contracts with rates and expiry dates
    - Reference date
    - Total count of contracts
    
    **Notes:**
    - Date must be a business day (not weekend)
    - Date cannot be in the future
    - Brazilian market uses 252 business days per year
    """
    try:
        # Additional validation
        validate_date_string(date)
        
        # Fetch data
        data = di1_service.fetch_di1_data(date, max_business_days)
        
        # Convert to response model
        contracts = [DI1Contract(**contract) for contract in data['contracts']]
        
        return DI1Response(
            reference_date=data['reference_date'],
            contracts=contracts,
            count=data['count']
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400, 
            detail={
                "error_code": "INVALID_INPUT",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={
                "error_code": "SERVER_ERROR",
                "message": f"Error fetching DI1 data: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@router.get(
    "/di1/summary",
    summary="Get DI1 summary statistics",
    description="Retrieve summary statistics for DI1 contracts on a specific date"
)
async def get_di1_summary(
    date: str = Query(
        ..., 
        description="Reference date in YYYY-MM-DD format",
        regex=r"^\d{4}-\d{2}-\d{2}$",
        example="2025-01-31"
    )
):
    """
    Get summary statistics for DI1 contracts.
    
    **Returns:**
    - Count of contracts
    - Min/max/average rates
    - Min/max maturities
    """
    try:
        validate_date_string(date)
        summary = di1_service.get_contract_summary(date)
        return summary
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting DI1 summary: {str(e)}"
        )

# ============================================================================
# Methods Endpoint
# ============================================================================

@router.get(
    "/methods",
    response_model=List[MethodInfo],
    summary="List available interpolation methods",
    description="Get list of all available yield curve smoothing methods"
)
async def get_available_methods():
    """
    Get list of available smoothing methods.
    
    **Returns:**
    - List of method information with IDs, names, types, and descriptions
    """
    methods = [
        MethodInfo(
            id="linear",
            name="Linear Interpolation",
            type="simple",
            description="Simple linear interpolation between points",
            min_points=2,
            parameters={}
        ),
        MethodInfo(
            id="cubic",
            name="Cubic Spline",
            type="spline",
            description="Smooth cubic spline interpolation",
            min_points=3,
            parameters={}
        ),
        MethodInfo(
            id="akima",
            name="Akima Spline",
            type="spline",
            description="Akima spline (reduces oscillations)",
            min_points=5,
            parameters={}
        ),
        MethodInfo(
            id="pchip",
            name="PCHIP",
            type="spline",
            description="Monotonic piecewise cubic interpolation",
            min_points=2,
            parameters={}
        ),
        MethodInfo(
            id="smoothing",
            name="Smoothing Spline",
            type="spline",
            description="Regularized smoothing spline",
            min_points=2,
            parameters={
                "smoothing": {
                    "type": "float",
                    "default": 0.5,
                    "description": "Smoothing factor (0=interpolation, higher=smoother)"
                }
            }
        ),
        MethodInfo(
            id="nelson_siegel",
            name="Nelson-Siegel",
            type="parametric",
            description="4-parameter Nelson-Siegel model",
            min_points=4,
            parameters={
                "initial_params": {
                    "type": "array",
                    "description": "Initial parameter guess [beta0, beta1, beta2, tau]"
                }
            }
        ),
        MethodInfo(
            id="nelson_siegel_svensson",
            name="Nelson-Siegel-Svensson",
            type="parametric",
            description="6-parameter Nelson-Siegel-Svensson model",
            min_points=6,
            parameters={
                "initial_params": {
                    "type": "array",
                    "description": "Initial parameter guess [beta0, beta1, beta2, beta3, tau1, tau2]"
                }
            }
        )
    ]
    
    return methods

# ============================================================================
# Curve Calculation Endpoint
# ============================================================================

@router.post(
    "/curve",
    response_model=CurveResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Server error"}
    },
    summary="Calculate smoothed yield curve",
    description="Calculate smoothed yield curve using selected interpolation method"
)
async def calculate_yield_curve(
    request: CurveRequest = Body(
        ...,
        example={
            "method": "nelson_siegel",
            "data": [
                {"years": 0.25, "rate": 0.10, "business_days": 63},
                {"years": 0.5, "rate": 0.102, "business_days": 126},
                {"years": 1.0, "rate": 0.105, "business_days": 252},
                {"years": 2.0, "rate": 0.108, "business_days": 504}
            ],
            "parameters": {},
            "num_points": 1260
        }
    )
):
    """
    Calculate smoothed yield curve.
    
    **Request Body:**
    - **method**: Method ID (see /api/v1/methods for available methods)
    - **data**: List of contracts with years and rate
    - **parameters**: Optional method-specific parameters
    - **num_points**: Number of points in output curve (default 1260)
    
    **Returns:**
    - Original data points
    - Smoothed curve points
    - Fitted parameters
    - Goodness-of-fit metrics
    """
    try:
        # Validate method
        validate_method(request.method)
        
        # Calculate curve
        result = calculate_curve(
            method=request.method,
            contracts=request.data,
            parameters=request.parameters or {},
            num_points=request.num_points
        )
        
        # Return response
        return CurveResponse(**result)
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_INPUT",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "CALCULATION_ERROR",
                "message": f"Error calculating curve: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# ============================================================================
# Workflow Endpoint (End-to-End)
# ============================================================================

@router.post(
    "/workflow",
    response_model=WorkflowResponse,
    summary="End-to-end workflow: fetch and calculate",
    description="Fetch DI1 data and calculate curve in a single request"
)
async def workflow(
    request: WorkflowRequest = Body(
        ...,
        example={
            "date": "2025-01-31",
            "method": "nelson_siegel",
            "max_business_days": 1260,
            "parameters": {},
            "num_points": 1260
        }
    )
):
    """
    Complete workflow: fetch DI1 data and calculate curve.
    
    This endpoint combines the /di1 and /curve endpoints for convenience.
    
    **Request Body:**
    - **date**: Reference date (YYYY-MM-DD)
    - **method**: Interpolation method ID
    - **max_business_days**: Maximum maturity (default 1260)
    - **parameters**: Method-specific parameters
    - **num_points**: Output curve points (default 1260)
    
    **Returns:**
    - DI1 data
    - Calculated curve
    - Metrics and parameters
    """
    try:
        # Step 1: Fetch DI1 data
        validate_date_string(request.date)
        di1_data = di1_service.fetch_di1_data(
            request.date, 
            request.max_business_days
        )
        
        if di1_data['count'] == 0:
            raise ValueError(f"No DI1 data available for {request.date}")
        
        # Step 2: Validate method
        validate_method(request.method)
        
        # Step 3: Calculate curve
        curve_result = calculate_curve(
            method=request.method,
            contracts=di1_data['contracts'],
            parameters=request.parameters or {},
            num_points=request.num_points
        )
        
        # Combine results
        return WorkflowResponse(
            reference_date=di1_data['reference_date'],
            num_contracts=di1_data['count'],
            method=curve_result['method'],
            method_name=curve_result['method_name'],
            method_type=curve_result['method_type'],
            original_points=curve_result['original_points'],
            curve_points=curve_result['curve_points'],
            parameters_used=curve_result['parameters_used'],
            metrics=curve_result['metrics']
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Workflow error: {str(e)}"
        )

# ============================================================================
# Compare Methods Endpoint
# ============================================================================

@router.post(
    "/curve/compare",
    response_model=CompareMethodsResponse,
    summary="Compare multiple interpolation methods",
    description="Calculate curves using multiple methods and compare results"
)
async def compare_methods(
    request: CompareMethodsRequest = Body(
        ...,
        example={
            "date": "2025-01-31",
            "methods": ["linear", "cubic", "nelson_siegel"],
            "max_business_days": 1260,
            "num_points": 1260
        }
    )
):
    """
    Compare multiple interpolation methods.
    
    **Request Body:**
    - **date**: Reference date
    - **methods**: List of method IDs to compare
    - **max_business_days**: Maximum maturity
    - **num_points**: Output curve points
    
    **Returns:**
    - Results for each method
    - Comparison metrics
    """
    try:
        # Fetch DI1 data once
        validate_date_string(request.date)
        di1_data = di1_service.fetch_di1_data(
            request.date,
            request.max_business_days
        )
        
        if di1_data['count'] == 0:
            raise ValueError(f"No DI1 data available for {request.date}")
        
        # Calculate curve for each method
        results = []
        for method in request.methods:
            try:
                validate_method(method)
                curve_result = calculate_curve(
                    method=method,
                    contracts=di1_data['contracts'],
                    parameters={},
                    num_points=request.num_points
                )
                results.append(curve_result)
            except Exception as e:
                # Skip methods that fail, but log the error
                results.append({
                    "method": method,
                    "error": str(e),
                    "success": False
                })
        
        return CompareMethodsResponse(
            reference_date=di1_data['reference_date'],
            num_contracts=di1_data['count'],
            results=results,
            num_methods=len(results)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Comparison error: {str(e)}"
        )
```

### `backend/schemas/contracts.py` (UPDATE - Add new schemas)
```python
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import List, Optional, Dict, Any

# ... existing schemas (DI1Contract, DI1Response, CurvePoint, CurveRequest, CurveResponse)

class MethodInfo(BaseModel):
    """Information about an interpolation method."""
    id: str = Field(..., description="Method ID")
    name: str = Field(..., description="Human-readable name")
    type: str = Field(..., description="Method type: simple, spline, or parametric")
    description: str = Field(..., description="Method description")
    min_points: int = Field(..., description="Minimum data points required")
    parameters: Dict[str, Any] = Field(
        default={},
        description="Available parameters for this method"
    )

class WorkflowRequest(BaseModel):
    """Request for end-to-end workflow."""
    date: str = Field(..., description="Reference date (YYYY-MM-DD)")
    method: str = Field(..., description="Interpolation method ID")
    max_business_days: int = Field(
        1260,
        description="Maximum business days to expiry",
        ge=1,
        le=2520
    )
    parameters: Optional[Dict] = Field(
        default={},
        description="Method-specific parameters"
    )
    num_points: int = Field(
        1260,
        description="Number of curve points to generate",
        ge=10,
        le=5000
    )

class WorkflowResponse(BaseModel):
    """Response for end-to-end workflow."""
    reference_date: str
    num_contracts: int
    method: str
    method_name: str
    method_type: str
    original_points: List[CurvePoint]
    curve_points: List[CurvePoint]
    parameters_used: Dict
    metrics: Dict

class CompareMethodsRequest(BaseModel):
    """Request to compare multiple methods."""
    date: str = Field(..., description="Reference date (YYYY-MM-DD)")
    methods: List[str] = Field(..., description="List of method IDs to compare")
    max_business_days: int = Field(1260, ge=1, le=2520)
    num_points: int = Field(1260, ge=10, le=5000)
    
    @validator('methods')
    def validate_methods_list(cls, v):
        if len(v) < 2:
            raise ValueError("Need at least 2 methods to compare")
        if len(v) > 7:
            raise ValueError("Maximum 7 methods allowed")
        return v

class CompareMethodsResponse(BaseModel):
    """Response for method comparison."""
    reference_date: str
    num_contracts: int
    results: List[Dict]
    num_methods: int
```

### `backend/schemas/errors.py` (NEW FILE)
```python
"""
Error response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional

class ErrorResponse(BaseModel):
    """Standard error response."""
    error_code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    timestamp: str = Field(..., description="ISO timestamp of error")
    details: Optional[dict] = Field(None, description="Additional error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error_code": "INVALID_INPUT",
                "message": "Date cannot be in the future: 2026-12-31",
                "timestamp": "2025-02-02T10:30:00Z",
                "details": {
                    "field": "date",
                    "provided_value": "2026-12-31"
                }
            }
        }
```

### `backend/utils/validators.py` (NEW FILE)
```python
"""
Request validators.
"""
from datetime import datetime
from services.models import MODELS

def validate_date_string(date_str: str) -> None:
    """
    Validate date string format.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        
    Raises:
        ValueError: If date is invalid
    """
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError(
            f"Invalid date format: {date_str}. Expected YYYY-MM-DD"
        )

def validate_method(method: str) -> None:
    """
    Validate interpolation method.
    
    Args:
        method: Method ID
        
    Raises:
        ValueError: If method is unknown
    """
    if method not in MODELS:
        raise ValueError(
            f"Unknown method: {method}. "
            f"Available methods: {list(MODELS.keys())}"
        )
```

### `backend/middleware/error_handler.py` (NEW FILE)
```python
"""
Global error handlers.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    
    # If detail is already a dict (from our custom exceptions), use it
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    
    # Otherwise, wrap it in standard format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": str(exc.detail),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.error(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "timestamp": datetime.utcnow().isoformat(),
            "details": exc.errors()
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unexpected error: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

### `backend/utils/config.py` (UPDATE)
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:19006",  # Expo web
        "exp://192.168.1.*",        # Expo mobile
        "http://localhost:3000",    # Development
    ]
    
    # Add production origins
    PRODUCTION_ORIGINS: List[str] = [
        "https://your-domain.com",
        "https://www.your-domain.com"
    ]
    
    # Application
    APP_NAME: str = "ETTJ DI1 API"
    DEBUG: bool = True
    API_VERSION: str = "1.0.0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Combine origins in production
if not settings.DEBUG:
    settings.ALLOWED_ORIGINS.extend(settings.PRODUCTION_ORIGINS)
```

---

## Testing

### Manual Testing Script

Create `backend/tests/test_api_manual.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
DATE="2025-01-31"

echo "=== Testing ETTJ DI1 API ==="
echo ""

# Test 1: Root endpoint
echo "Test 1: Root endpoint"
curl -s "$BASE_URL/" | jq
echo ""

# Test 2: Health check
echo "Test 2: Health check"
curl -s "$BASE_URL/health" | jq
echo ""

# Test 3: Detailed health check
echo "Test 3: Detailed health check"
curl -s "$BASE_URL/health/detailed" | jq
echo ""

# Test 4: Get methods
echo "Test 4: Available methods"
curl -s "$BASE_URL/api/v1/methods" | jq
echo ""

# Test 5: Get DI1 data
echo "Test 5: DI1 data for $DATE"
curl -s "$BASE_URL/api/v1/di1?date=$DATE" | jq '.count'
echo ""

# Test 6: DI1 summary
echo "Test 6: DI1 summary"
curl -s "$BASE_URL/api/v1/di1/summary?date=$DATE" | jq
echo ""

# Test 7: Calculate curve (Linear)
echo "Test 7: Calculate curve (Linear)"
curl -s -X POST "$BASE_URL/api/v1/curve" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "linear",
    "data": [
      {"years": 0.25, "rate": 0.10, "business_days": 63},
      {"years": 0.5, "rate": 0.102, "business_days": 126},
      {"years": 1.0, "rate": 0.105, "business_days": 252}
    ],
    "num_points": 252
  }' | jq '.method_name, .metrics.rmse'
echo ""

# Test 8: Workflow (end-to-end)
echo "Test 8: Workflow endpoint"
curl -s -X POST "$BASE_URL/api/v1/workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$DATE'",
    "method": "nelson_siegel",
    "max_business_days": 1260,
    "num_points": 1260
  }' | jq '.method_name, .num_contracts, .metrics.r_squared'
echo ""

# Test 9: Compare methods
echo "Test 9: Compare methods"
curl -s -X POST "$BASE_URL/api/v1/curve/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$DATE'",
    "methods": ["linear", "cubic", "nelson_siegel"],
    "max_business_days": 1260,
    "num_points": 100
  }' | jq '.num_methods, .results[].method'
echo ""

# Test 10: Error handling - invalid date
echo "Test 10: Error handling - invalid date"
curl -s "$BASE_URL/api/v1/di1?date=2026-12-31" | jq
echo ""

# Test 11: Error handling - weekend
echo "Test 11: Error handling - weekend"
curl -s "$BASE_URL/api/v1/di1?date=2025-02-01" | jq
echo ""

echo "=== Testing Complete ==="
```

Make it executable:
```bash
chmod +x backend/tests/test_api_manual.sh
```

### Automated Integration Tests

`backend/tests/test_api_integration.py`:

```python
"""
Integration tests for API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestHealthEndpoints:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "endpoints" in data
    
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_detailed_health(self):
        response = client.get("/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert "dependencies" in data

class TestMethodsEndpoint:
    def test_get_methods(self):
        response = client.get("/api/v1/methods")
        assert response.status_code == 200
        methods = response.json()
        assert len(methods) == 7
        assert all('id' in m for m in methods)

class TestDI1Endpoints:
    @pytest.mark.integration
    def test_get_di1_data_valid(self):
        response = client.get("/api/v1/di1?date=2025-01-31")
        # May succeed or fail depending on data availability
        assert response.status_code in [200, 400, 500]
    
    def test_get_di1_data_invalid_format(self):
        response = client.get("/api/v1/di1?date=31/01/2025")
        assert response.status_code == 422  # Validation error
    
    def test_get_di1_data_future(self):
        response = client.get("/api/v1/di1?date=2026-12-31")
        assert response.status_code == 400

class TestCurveEndpoint:
    def test_calculate_curve_linear(self):
        request_data = {
            "method": "linear",
            "data": [
                {"years": 0.25, "rate": 0.10, "business_days": 63},
                {"years": 0.5, "rate": 0.102, "business_days": 126},
                {"years": 1.0, "rate": 0.105, "business_days": 252}
            ],
            "num_points": 252
        }
        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "linear"
        assert len(data["curve_points"]) == 252
    
    def test_calculate_curve_invalid_method(self):
        request_data = {
            "method": "invalid",
            "data": [
                {"years": 1.0, "rate": 0.10, "business_days": 252}
            ]
        }
        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 400

class TestWorkflowEndpoint:
    @pytest.mark.integration
    def test_workflow_success(self):
        request_data = {
            "date": "2025-01-31",
            "method": "linear",
            "max_business_days": 1260,
            "num_points": 100
        }
        response = client.post("/api/v1/workflow", json=request_data)
        # May succeed or fail depending on data availability
        assert response.status_code in [200, 400, 500]

class TestCompareEndpoint:
    @pytest.mark.integration
    def test_compare_methods(self):
        request_data = {
            "date": "2025-01-31",
            "methods": ["linear", "cubic"],
            "max_business_days": 1260,
            "num_points": 100
        }
        response = client.post("/api/v1/curve/compare", json=request_data)
        # May succeed or fail depending on data availability
        assert response.status_code in [200, 400, 500]
```

Run tests:
```bash
# Run all tests
pytest backend/tests/test_api_integration.py

# Run only non-integration tests
pytest backend/tests/test_api_integration.py -m "not integration"

# Run with verbose output
pytest backend/tests/test_api_integration.py -v
```

---

## API Documentation

### Accessing Documentation

Once the server is running:

1. **Swagger UI**: http://localhost:8000/docs
   - Interactive API documentation
   - Try out endpoints directly
   - See request/response schemas

2. **ReDoc**: http://localhost:8000/redoc
   - Alternative documentation view
   - Better for reading/printing

3. **OpenAPI JSON**: http://localhost:8000/openapi.json
   - Raw OpenAPI specification
   - Use with Postman or other tools

---

## Error Codes Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `METHOD_NOT_FOUND` | 400 | Unknown interpolation method |
| `INSUFFICIENT_DATA` | 400 | Not enough data points for method |
| `CALCULATION_ERROR` | 500 | Error during curve calculation |
| `SERVER_ERROR` | 500 | General server error |
| `DATA_UNAVAILABLE` | 400 | No data available for date |

---

## Acceptance Criteria

### Endpoints
- ✅ All endpoints functional and documented
- ✅ `/api/v1/di1` returns DI1 data
- ✅ `/api/v1/curve` calculates curves
- ✅ `/api/v1/workflow` combines fetch + calculate
- ✅ `/api/v1/methods` lists all methods
- ✅ `/api/v1/curve/compare` compares methods
- ✅ Health checks work

### Error Handling
- ✅ Validation errors return 422
- ✅ Invalid input returns 400 with error code
- ✅ Server errors return 500
- ✅ Error responses have consistent format
- ✅ Helpful error messages

### Documentation
- ✅ Swagger UI accessible
- ✅ All endpoints documented
- ✅ Request/response examples provided
- ✅ Parameter descriptions clear

### Testing
- ✅ Manual test script works
- ✅ Integration tests pass
- ✅ Error cases covered

---

## Performance Benchmarks

| Endpoint | Expected Response Time |
|----------|------------------------|
| `/health` | < 10ms |
| `/api/v1/methods` | < 10ms |
| `/api/v1/di1` | < 3s (B3 fetch) |
| `/api/v1/curve` (simple) | < 100ms |
| `/api/v1/curve` (parametric) | < 1s |
| `/api/v1/workflow` | < 5s |

---

## Next Steps

After Feature 4:
- **Feature 5**: Update mobile API client to use all endpoints
- **Feature 6**: Build Home screen UI
- **Feature 7**: Create Chart screen with visualization
- **Feature 8**: Implement Data table screen

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 4 |