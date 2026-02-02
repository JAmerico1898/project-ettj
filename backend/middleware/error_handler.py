"""Global exception handlers for ETTJ API."""

from datetime import datetime, timezone
from typing import Union

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from schemas.errors import ErrorResponse


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
) -> JSONResponse:
    """Handle HTTP exceptions with consistent error format."""
    error_response = ErrorResponse(
        error_code=f"HTTP_{exc.status_code}",
        message=str(exc.detail),
        timestamp=datetime.now(timezone.utc),
        details={"path": str(request.url.path)},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(mode="json"),
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors with detailed feedback."""
    errors = []
    for error in exc.errors():
        loc = " -> ".join(str(l) for l in error["loc"])
        errors.append({
            "field": loc,
            "message": error["msg"],
            "type": error["type"],
        })

    error_response = ErrorResponse(
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        timestamp=datetime.now(timezone.utc),
        details={
            "path": str(request.url.path),
            "errors": errors,
        },
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(mode="json"),
    )


async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions."""
    error_response = ErrorResponse(
        error_code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        timestamp=datetime.now(timezone.utc),
        details={
            "path": str(request.url.path),
            "error_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(mode="json"),
    )
