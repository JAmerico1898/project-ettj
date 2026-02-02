"""Tests for the DI1 data service."""

import pytest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from services.utils import (
    format_date_for_pyield,
    business_days_to_years,
    rate_decimal_to_percent,
    get_previous_day,
)
from services.data import DI1DataService


class TestUtils:
    """Unit tests for utility functions."""

    def test_format_date_for_pyield(self):
        """Test date formatting for pyield API."""
        d = date(2025, 1, 31)
        assert format_date_for_pyield(d) == "2025-01-31"

    def test_format_date_for_pyield_single_digits(self):
        """Test date formatting with single digit month/day."""
        d = date(2025, 3, 5)
        assert format_date_for_pyield(d) == "2025-03-05"

    def test_business_days_to_years(self):
        """Test business days to years conversion."""
        # 252 business days = 1 year
        assert business_days_to_years(252) == 1.0
        # 126 business days = 0.5 years
        assert business_days_to_years(126) == 0.5
        # 1260 business days = 5 years
        assert business_days_to_years(1260) == 5.0

    def test_rate_decimal_to_percent(self):
        """Test rate decimal to percentage conversion."""
        assert rate_decimal_to_percent(0.10) == 10.0
        assert rate_decimal_to_percent(0.1234) == 12.34
        assert rate_decimal_to_percent(0.0) == 0.0

    def test_get_previous_day(self):
        """Test getting previous calendar day."""
        d = date(2025, 1, 31)
        assert get_previous_day(d) == date(2025, 1, 30)

    def test_get_previous_day_month_boundary(self):
        """Test previous day across month boundary."""
        d = date(2025, 2, 1)
        assert get_previous_day(d) == date(2025, 1, 31)


class TestDI1DataService:
    """Tests for DI1DataService class."""

    def test_rejects_future_date(self):
        """Test that future dates are rejected."""
        service = DI1DataService()
        future_date = date.today() + timedelta(days=30)

        with pytest.raises(ValueError) as exc_info:
            service.fetch_di1_data(future_date)

        assert "cannot be in the future" in str(exc_info.value)

    @patch("services.data.yd.futures")
    def test_fetch_with_valid_business_day(self, mock_futures):
        """Test fetching data for a valid business day."""
        import pandas as pd

        # Mock successful response
        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25", "DI1G25"],
                "ExpirationDate": [date(2025, 1, 2), date(2025, 2, 3)],
                "BDaysToExp": [21, 42],
                "SettlementRate": [0.1025, 0.1050],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        test_date = date(2025, 1, 31)
        result = service.fetch_di1_data(test_date)

        assert result["reference_date"] == test_date
        assert result["actual_date"] == test_date
        assert result["count"] == 2
        assert len(result["contracts"]) == 2

    @patch("services.data.yd.futures")
    def test_fetch_with_weekend_falls_back(self, mock_futures):
        """Test that weekend dates fall back to previous business day."""
        import pandas as pd

        # First two calls return empty (Saturday, Sunday), third returns data (Friday)
        empty_df = pd.DataFrame()
        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25"],
                "ExpirationDate": [date(2025, 1, 2)],
                "BDaysToExp": [21],
                "SettlementRate": [0.1025],
            }
        )

        mock_polars_empty = MagicMock()
        mock_polars_empty.to_pandas.return_value = empty_df

        mock_polars_data = MagicMock()
        mock_polars_data.to_pandas.return_value = mock_df

        # Saturday -> empty, Friday -> data
        mock_futures.side_effect = [mock_polars_empty, mock_polars_data]

        service = DI1DataService()
        saturday = date(2025, 2, 1)  # Saturday
        friday = date(2025, 1, 31)  # Friday

        result = service.fetch_di1_data(saturday)

        assert result["reference_date"] == saturday  # Original request
        assert result["actual_date"] == friday  # Data found for Friday
        assert result["count"] == 1

    @patch("services.data.yd.futures")
    def test_fetch_with_no_date_returns_recent_data(self, mock_futures):
        """Test that None date uses today and finds recent data."""
        import pandas as pd

        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25"],
                "ExpirationDate": [date(2025, 1, 2)],
                "BDaysToExp": [21],
                "SettlementRate": [0.1025],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        result = service.fetch_di1_data(None)

        assert result["reference_date"] == date.today()
        assert result["count"] == 1

    @patch("services.data.yd.futures")
    def test_contracts_sorted_by_business_days(self, mock_futures):
        """Test that contracts are returned sorted by business_days ascending."""
        import pandas as pd

        # Data in wrong order
        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1H25", "DI1F25", "DI1G25"],
                "ExpirationDate": [date(2025, 3, 3), date(2025, 1, 2), date(2025, 2, 3)],
                "BDaysToExp": [63, 21, 42],
                "SettlementRate": [0.1075, 0.1025, 0.1050],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        result = service.fetch_di1_data(date(2025, 1, 31))

        contracts = result["contracts"]
        assert contracts[0].business_days == 21
        assert contracts[1].business_days == 42
        assert contracts[2].business_days == 63

    @patch("services.data.yd.futures")
    def test_contracts_filtered_by_max_business_days(self, mock_futures):
        """Test that contracts beyond max_business_days are filtered out."""
        import pandas as pd

        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25", "DI1F30"],
                "ExpirationDate": [date(2025, 1, 2), date(2030, 1, 2)],
                "BDaysToExp": [21, 1500],  # Second contract exceeds default max
                "SettlementRate": [0.1025, 0.1100],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        result = service.fetch_di1_data(date(2025, 1, 31))

        # Only contract within 1260 days should be included
        assert result["count"] == 1
        assert result["contracts"][0].ticker == "DI1F25"

    @patch("services.data.yd.futures")
    def test_max_business_days_parameter(self, mock_futures):
        """Test that max_business_days parameter is respected."""
        import pandas as pd

        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25", "DI1G25"],
                "ExpirationDate": [date(2025, 1, 2), date(2025, 2, 3)],
                "BDaysToExp": [21, 42],
                "SettlementRate": [0.1025, 0.1050],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        result = service.fetch_di1_data(date(2025, 1, 31), max_business_days=30)

        # Only contract with business_days <= 30 should be included
        assert result["count"] == 1
        assert result["contracts"][0].business_days == 21

    @patch("services.data.yd.futures")
    def test_rate_percent_calculated_correctly(self, mock_futures):
        """Test that rate_percent is calculated correctly from decimal rate."""
        import pandas as pd

        mock_df = pd.DataFrame(
            {
                "TickerSymbol": ["DI1F25"],
                "ExpirationDate": [date(2025, 1, 2)],
                "BDaysToExp": [21],
                "SettlementRate": [0.1234],
            }
        )
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = mock_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()
        result = service.fetch_di1_data(date(2025, 1, 31))

        contract = result["contracts"][0]
        assert contract.rate == 0.1234
        assert contract.rate_percent == 12.34

    @patch("services.data.yd.futures")
    def test_max_retry_attempts_exceeded(self, mock_futures):
        """Test error when no data found after max retries."""
        import pandas as pd

        # Always return empty data
        empty_df = pd.DataFrame()
        mock_polars = MagicMock()
        mock_polars.to_pandas.return_value = empty_df
        mock_futures.return_value = mock_polars

        service = DI1DataService()

        with pytest.raises(ValueError) as exc_info:
            service.fetch_di1_data(date(2025, 1, 31))

        assert "No DI1 data found" in str(exc_info.value)
        assert "10" in str(exc_info.value)  # Max attempts mentioned
