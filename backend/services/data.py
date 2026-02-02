"""DI1 futures data fetching service.

This module handles fetching DI1 futures contract data from B3 using pyield,
with automatic fallback to previous business days when data is unavailable.
"""

from datetime import date, timedelta
from typing import Dict, List, Optional
import logging

import pandas as pd
import pyield as yd

from schemas.contracts import DI1Contract
from services.utils import format_date_for_pyield, rate_decimal_to_percent

logger = logging.getLogger(__name__)


class DI1DataService:
    """Service for fetching DI1 futures data from B3."""

    MAX_RETRY_ATTEMPTS = 10
    DEFAULT_MAX_BUSINESS_DAYS = 1260  # 5 years * 252 business days

    def fetch_di1_data(
        self,
        reference_date: Optional[date] = None,
        max_business_days: int = DEFAULT_MAX_BUSINESS_DAYS,
    ) -> Dict:
        """
        Fetch DI1 data with automatic fallback to previous business days.

        Args:
            reference_date: The date to fetch data for. If None, uses today.
            max_business_days: Maximum business days to maturity (default 1260 = 5 years).

        Returns:
            Dict with:
                - reference_date: Original requested date (or today if None)
                - actual_date: The date data was actually found for
                - contracts: List of DI1Contract objects
                - count: Number of contracts

        Raises:
            ValueError: If date is in the future or no data found after max retries.
        """
        # Default to today if no date provided
        if reference_date is None:
            reference_date = date.today()

        # Cannot fetch future dates
        if reference_date > date.today():
            raise ValueError(f"Date cannot be in the future: {reference_date}")

        # Try fetching with fallback
        current_date = reference_date
        attempts = 0

        while attempts < self.MAX_RETRY_ATTEMPTS:
            df = self._try_fetch_date(current_date)
            if df is not None and len(df) > 0:
                contracts = self._process_contracts(df, max_business_days)
                return {
                    "reference_date": reference_date,  # Original request
                    "actual_date": current_date,  # Date data was found
                    "contracts": contracts,
                    "count": len(contracts),
                }
            current_date = current_date - timedelta(days=1)
            attempts += 1

        raise ValueError(
            f"No DI1 data found for {reference_date} or the {self.MAX_RETRY_ATTEMPTS} "
            f"previous days. Please try an earlier date."
        )

    def _try_fetch_date(self, target_date: date) -> Optional[pd.DataFrame]:
        """
        Try to fetch data for a single date.

        Args:
            target_date: The date to attempt fetching.

        Returns:
            DataFrame with DI1 data, or None if unavailable.
        """
        try:
            date_str = format_date_for_pyield(target_date)
            logger.debug(f"Attempting to fetch DI1 data for {date_str}")

            # Fetch from pyield
            df_polars = yd.futures(contract_code="DI1", date=date_str)

            # Convert to pandas
            df = df_polars.to_pandas(use_pyarrow_extension_array=True)

            if df is not None and len(df) > 0:
                logger.info(f"Successfully fetched {len(df)} contracts for {date_str}")
                return df

        except Exception as e:
            logger.debug(f"Failed to fetch data for {target_date}: {e}")

        return None

    def _process_contracts(
        self, df: pd.DataFrame, max_business_days: int
    ) -> List[DI1Contract]:
        """
        Process DataFrame into list of DI1Contract objects.

        Args:
            df: Raw DataFrame from pyield.
            max_business_days: Maximum business days filter.

        Returns:
            List of DI1Contract objects, sorted by business_days ascending.
        """
        # Make a copy to avoid modifying original
        df_processed = df.copy()

        # Convert PyArrow arrays to numpy if needed
        if hasattr(df_processed["BDaysToExp"], "to_numpy"):
            df_processed["BDaysToExp"] = df_processed["BDaysToExp"].to_numpy()
        if hasattr(df_processed["SettlementRate"], "to_numpy"):
            df_processed["SettlementRate"] = df_processed["SettlementRate"].to_numpy()

        # Filter by max business days
        df_processed = df_processed[
            df_processed["BDaysToExp"] <= max_business_days
        ].copy()

        # Sort by business days ascending
        df_processed = df_processed.sort_values("BDaysToExp")

        # Convert to list of DI1Contract objects
        contracts = []
        for _, row in df_processed.iterrows():
            rate_decimal = float(row["SettlementRate"])
            contract = DI1Contract(
                ticker=str(row["TickerSymbol"]),
                maturity_date=row["ExpirationDate"].date()
                if hasattr(row["ExpirationDate"], "date")
                else row["ExpirationDate"],
                business_days=int(row["BDaysToExp"]),
                rate=rate_decimal,
                rate_percent=rate_decimal_to_percent(rate_decimal),
            )
            contracts.append(contract)

        return contracts

    def get_contract_summary(
        self,
        reference_date: Optional[date] = None,
        max_business_days: int = DEFAULT_MAX_BUSINESS_DAYS,
    ) -> Dict:
        """
        Get summary statistics for DI1 contracts.

        Args:
            reference_date: The date to fetch data for. If None, uses today.
            max_business_days: Maximum business days filter.

        Returns:
            Dict with summary statistics.
        """
        data = self.fetch_di1_data(reference_date, max_business_days)
        contracts = data["contracts"]

        if not contracts:
            return {
                **data,
                "min_rate_percent": None,
                "max_rate_percent": None,
                "min_business_days": None,
                "max_business_days": None,
            }

        rates = [c.rate_percent for c in contracts]
        business_days = [c.business_days for c in contracts]

        return {
            **data,
            "min_rate_percent": min(rates),
            "max_rate_percent": max(rates),
            "min_business_days": min(business_days),
            "max_business_days": max(business_days),
        }


# Singleton instance for use across the application
di1_service = DI1DataService()
