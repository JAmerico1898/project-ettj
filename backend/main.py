"""ETTJ API - Term Structure of Brazilian DI Interest Rates.

FastAPI backend for the ETTJ mobile application.
Provides endpoints for DI1 futures data and yield curve fitting.
"""

import time
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from utils.config import settings
from routers.api_v1 import router as api_v1_router
from routers.health import router as health_router
from middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
)
from schemas.contracts import APIInfoResponse

app = FastAPI(
    title=settings.APP_NAME,
    description="API for modeling the term structure of Brazilian DI (CDI) interest rates",
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add X-Process-Time header to all responses."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response


# Register global exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(health_router)

# Include API v1 router with versioned prefix
app.include_router(api_v1_router, prefix="/api/v1")

# Also mount at /api for backward compatibility with existing mobile app
app.include_router(api_v1_router, prefix="/api")


@app.get("/", response_model=APIInfoResponse)
async def root() -> APIInfoResponse:
    """Root endpoint - returns API information."""
    return APIInfoResponse(
        name=settings.APP_NAME,
        version=settings.API_VERSION,
        description="Term structure of Brazilian DI interest rates using DI1 futures from B3",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
