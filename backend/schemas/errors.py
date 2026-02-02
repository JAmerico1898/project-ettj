"""Error response schemas for ETTJ API."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standardized error response format."""

    error_code: str = Field(
        ...,
        description="Machine-readable error code (e.g., 'VALIDATION_ERROR', 'HTTP_404')",
    )
    message: str = Field(
        ...,
        description="Human-readable error message",
    )
    timestamp: datetime = Field(
        ...,
        description="UTC timestamp when the error occurred",
    )
    details: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details (field errors, path, etc.)",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error_code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "timestamp": "2025-01-31T12:00:00Z",
                    "details": {
                        "path": "/api/v1/di1",
                        "errors": [
                            {
                                "field": "date",
                                "message": "Invalid date format",
                                "type": "value_error",
                            }
                        ],
                    },
                }
            ]
        }
    }
