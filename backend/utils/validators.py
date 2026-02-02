"""Request validators for ETTJ API."""

import re
from datetime import date, datetime
from typing import Optional

from fastapi import HTTPException, status

from services.models import MODELS


def validate_date_string(date_str: str) -> date:
    """
    Validate and parse a date string in YYYY-MM-DD format.

    Args:
        date_str: Date string to validate

    Returns:
        Parsed date object

    Raises:
        HTTPException: If date format is invalid
    """
    if not date_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date is required",
        )

    pattern = r"^\d{4}-\d{2}-\d{2}$"
    if not re.match(pattern, date_str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {date_str}. Expected YYYY-MM-DD",
        )

    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date: {date_str}. {str(e)}",
        )

    if parsed_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date cannot be in the future: {date_str}",
        )

    return parsed_date


def validate_method(method: str) -> str:
    """
    Validate that a method exists in the MODELS registry.

    Args:
        method: Method identifier to validate

    Returns:
        Validated method string

    Raises:
        HTTPException: If method is not found
    """
    if not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Method is required",
        )

    method_lower = method.lower()
    if method_lower not in MODELS:
        available = ", ".join(sorted(MODELS.keys()))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown method: {method}. Available methods: {available}",
        )

    return method_lower
