"""ETTJ API - Term Structure of Brazilian DI Interest Rates.

FastAPI backend for the ETTJ mobile application.
Provides endpoints for DI1 futures data and yield curve fitting.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.config import settings
from routers.api import router as api_router
from schemas.contracts import HealthResponse, APIInfoResponse

app = FastAPI(
    title="ETTJ API",
    description="API for modeling the term structure of Brazilian DI (CDI) interest rates",
    version="1.0.0",
)

# Configure CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)


@app.get("/", response_model=APIInfoResponse)
async def root() -> APIInfoResponse:
    """Root endpoint - returns API information."""
    return APIInfoResponse(
        name="ETTJ API",
        version="1.0.0",
        description="Term structure of Brazilian DI interest rates using DI1 futures from B3",
    )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="healthy")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
