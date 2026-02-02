"""Utility functions for the DI1 data service."""

from datetime import date, timedelta


def format_date_for_pyield(d: date) -> str:
    """Format date as YYYY-MM-DD string for pyield API."""
    return d.strftime("%Y-%m-%d")


def business_days_to_years(business_days: int) -> float:
    """
    Convert business days to years using Brazilian market convention.

    Brazilian market uses 252 business days per year.
    """
    return business_days / 252.0


def rate_decimal_to_percent(rate: float) -> float:
    """Convert rate from decimal to percentage."""
    return rate * 100.0


def get_previous_day(d: date) -> date:
    """Get the previous calendar day."""
    return d - timedelta(days=1)
