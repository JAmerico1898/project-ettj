# Feature 2: Data Service Layer - DI1 Data Fetching

## Overview
Implement the backend data service layer to fetch DI1 (Interbank Deposit) futures contracts from B3 (Brazilian Stock Exchange) using the `pyield` library. This feature provides the foundation for all yield curve calculations by retrieving real market data.

---

## Prerequisites
- **Feature 1** must be completed (project setup and infrastructure)
- Backend server running and accessible
- Python dependencies installed (especially `pyield`, `pandas`, `numpy`)

---

## Objectives
- Fetch DI1 futures contract data from B3 using pyield
- Convert PyArrow data structures to numpy/pandas
- Apply Brazilian market conventions (252 business days/year)
- Filter contracts to maximum 5 years (1260 business days)
- Calculate business days to expiry
- Convert rates between decimal and percentage formats
- Handle errors and edge cases (holidays, weekends, missing data)
- Implement GET /api/di1 endpoint with real data

---

## Technical Background

### DI1 Futures Contracts
- **DI1**: Brazilian Interbank Deposit futures traded on B3
- **Purpose**: Hedge against or speculate on changes in CDI (interbank deposit rate)
- **Settlement**: Cash-settled based on CDI rate
- **Quote**: Rates are annualized percentages
- **Trading**: Contracts expire on the first business day of each month

### Brazilian Market Conventions
- **Business days per year**: 252 (not 365)
- **Day count**: Business days (excludes weekends and Brazilian holidays)
- **Rate compounding**: Exponential (not simple interest)
- **Rate formula**: `(1 + rate)^(business_days/252) = future_value / present_value`

### pyield Library
- Python library for Brazilian fixed income data
- Fetches data directly from B3
- Returns data in PyArrow format (requires conversion)
- Documentation: https://github.com/crdcj/PYield

---

## Implementation

### File Structure
```
backend/
├── services/
│   ├── data.py              # Main implementation (THIS FEATURE)
│   └── utils.py             # Helper functions (NEW)
├── routers/
│   └── api.py               # Update endpoint implementation
└── tests/
    └── test_data.py         # Unit tests (NEW)
```

---

## Code Implementation

### `backend/services/utils.py` (NEW FILE)
```python
"""
Utility functions for date and rate calculations.
"""
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Tuple

# Brazilian business days per year
BUSINESS_DAYS_PER_YEAR = 252

def parse_date(date_str: str) -> datetime:
    """
    Parse date string in YYYY-MM-DD format.
    
    Args:
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        datetime object
        
    Raises:
        ValueError: If date format is invalid
    """
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")

def validate_date(date_obj: datetime) -> None:
    """
    Validate that date is not in the future and not too far in the past.
    
    Args:
        date_obj: datetime object to validate
        
    Raises:
        ValueError: If date is invalid
    """
    today = datetime.now().date()
    date_check = date_obj.date()
    
    if date_check > today:
        raise ValueError(f"Date cannot be in the future: {date_check}")
    
    # Don't allow dates more than 10 years in the past
    ten_years_ago = today - timedelta(days=365*10)
    if date_check < ten_years_ago:
        raise ValueError(f"Date too far in the past: {date_check}")

def is_weekend(date_obj: datetime) -> bool:
    """
    Check if date is a weekend.
    
    Args:
        date_obj: datetime object
        
    Returns:
        True if Saturday or Sunday
    """
    return date_obj.weekday() >= 5

def calculate_business_days(start_date: datetime, end_date: datetime) -> int:
    """
    Calculate number of business days between two dates.
    Uses pandas business day frequency (excludes weekends).
    
    Note: This is a simplified version. For production, should use
    Brazilian holiday calendar (anbima library).
    
    Args:
        start_date: Start datetime
        end_date: End datetime
        
    Returns:
        Number of business days
    """
    # Use pandas business day range (excludes weekends)
    bdays = pd.bdate_range(start=start_date, end=end_date)
    return len(bdays) - 1  # Exclude start date

def business_days_to_years(business_days: int) -> float:
    """
    Convert business days to years using Brazilian convention.
    
    Args:
        business_days: Number of business days
        
    Returns:
        Number of years (float)
    """
    return business_days / BUSINESS_DAYS_PER_YEAR

def rate_decimal_to_percent(rate_decimal: float) -> float:
    """
    Convert rate from decimal to percentage.
    
    Args:
        rate_decimal: Rate as decimal (e.g., 0.1025)
        
    Returns:
        Rate as percentage (e.g., 10.25)
    """
    return rate_decimal * 100

def rate_percent_to_decimal(rate_percent: float) -> float:
    """
    Convert rate from percentage to decimal.
    
    Args:
        rate_percent: Rate as percentage (e.g., 10.25)
        
    Returns:
        Rate as decimal (e.g., 0.1025)
    """
    return rate_percent / 100

def filter_max_maturity(
    contracts_df: pd.DataFrame,
    reference_date: datetime,
    max_business_days: int = 1260
) -> pd.DataFrame:
    """
    Filter contracts to maximum maturity (default 5 years = 1260 business days).
    
    Args:
        contracts_df: DataFrame with DI1 contracts
        reference_date: Reference date for calculation
        max_business_days: Maximum business days to expiry (default 1260)
        
    Returns:
        Filtered DataFrame
    """
    # Calculate business days for each contract
    contracts_df['business_days'] = contracts_df['maturity_date'].apply(
        lambda x: calculate_business_days(reference_date, x)
    )
    
    # Filter to max maturity
    filtered_df = contracts_df[contracts_df['business_days'] <= max_business_days].copy()
    
    return filtered_df
```

### `backend/services/data.py` (UPDATE FILE)
```python
"""
Data service for fetching DI1 futures contracts from B3.
"""
from datetime import datetime
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import pyield as pyd
from .utils import (
    parse_date,
    validate_date,
    is_weekend,
    calculate_business_days,
    business_days_to_years,
    rate_decimal_to_percent,
    filter_max_maturity
)

class DI1DataService:
    """Service for fetching and processing DI1 futures data."""
    
    def __init__(self):
        self.max_business_days = 1260  # 5 years
        
    def fetch_di1_data(
        self, 
        reference_date_str: str,
        max_business_days: Optional[int] = None
    ) -> Dict:
        """
        Fetch DI1 futures contracts for a given date.
        
        Args:
            reference_date_str: Date in YYYY-MM-DD format
            max_business_days: Maximum business days to expiry (default 1260)
            
        Returns:
            Dictionary with reference_date, contracts list, and count
            
        Raises:
            ValueError: If date is invalid or no data available
            Exception: If pyield fetch fails
        """
        # Use default if not provided
        if max_business_days is None:
            max_business_days = self.max_business_days
            
        # Parse and validate date
        reference_date = parse_date(reference_date_str)
        validate_date(reference_date)
        
        # Check if weekend
        if is_weekend(reference_date):
            raise ValueError(
                f"Reference date {reference_date_str} is a weekend. "
                "Please use a business day."
            )
        
        # Fetch data from B3 using pyield
        try:
            # Fetch DI1 futures data
            # pyield returns PyArrow Table, need to convert to pandas
            di1_data = pyd.futures_di(reference_date)
            
            if di1_data is None or len(di1_data) == 0:
                raise ValueError(
                    f"No DI1 data available for {reference_date_str}. "
                    "This might be a holiday or the market was closed."
                )
            
            # Convert PyArrow to pandas DataFrame
            df = di1_data.to_pandas()
            
        except Exception as e:
            raise Exception(f"Error fetching DI1 data from B3: {str(e)}")
        
        # Process the data
        processed_contracts = self._process_contracts(
            df, 
            reference_date, 
            max_business_days
        )
        
        if len(processed_contracts) == 0:
            raise ValueError(
                f"No DI1 contracts found within {max_business_days} business days "
                f"for date {reference_date_str}"
            )
        
        return {
            "reference_date": reference_date_str,
            "contracts": processed_contracts,
            "count": len(processed_contracts)
        }
    
    def _process_contracts(
        self,
        df: pd.DataFrame,
        reference_date: datetime,
        max_business_days: int
    ) -> List[Dict]:
        """
        Process raw DI1 data into structured contract list.
        
        Args:
            df: Raw DataFrame from pyield
            reference_date: Reference date for calculations
            max_business_days: Maximum maturity in business days
            
        Returns:
            List of processed contract dictionaries
        """
        # Rename columns to match our schema
        # pyield columns: ticker, maturity_date, current_rate, etc.
        df = df.rename(columns={
            'ticker': 'code',
            'maturity_date': 'expiry_date',
            'current_rate': 'rate'
        })
        
        # Ensure expiry_date is datetime
        if not pd.api.types.is_datetime64_any_dtype(df['expiry_date']):
            df['expiry_date'] = pd.to_datetime(df['expiry_date'])
        
        # Filter by max maturity and calculate business days
        df = filter_max_maturity(df, reference_date, max_business_days)
        
        # Calculate years to maturity
        df['years'] = df['business_days'].apply(business_days_to_years)
        
        # Convert rate to percentage
        # pyield returns rates as decimals (e.g., 0.1025 for 10.25%)
        df['rate_percent'] = df['rate'].apply(rate_decimal_to_percent)
        
        # Sort by maturity (ascending)
        df = df.sort_values('business_days')
        
        # Convert to list of dictionaries
        contracts = []
        for _, row in df.iterrows():
            contract = {
                'code': row['code'],
                'expiry_date': row['expiry_date'].strftime('%Y-%m-%d'),
                'business_days': int(row['business_days']),
                'years': round(row['years'], 4),
                'rate': round(row['rate'], 6),  # Decimal format
                'rate_percent': round(row['rate_percent'], 4)  # Percentage format
            }
            contracts.append(contract)
        
        return contracts
    
    def get_contract_summary(self, reference_date_str: str) -> Dict:
        """
        Get summary statistics for DI1 contracts on a given date.
        
        Args:
            reference_date_str: Date in YYYY-MM-DD format
            
        Returns:
            Dictionary with summary statistics
        """
        data = self.fetch_di1_data(reference_date_str)
        contracts = data['contracts']
        
        if len(contracts) == 0:
            return {
                'count': 0,
                'min_rate': None,
                'max_rate': None,
                'avg_rate': None,
                'min_maturity_days': None,
                'max_maturity_days': None
            }
        
        rates = [c['rate_percent'] for c in contracts]
        maturities = [c['business_days'] for c in contracts]
        
        return {
            'reference_date': reference_date_str,
            'count': len(contracts),
            'min_rate_percent': round(min(rates), 2),
            'max_rate_percent': round(max(rates), 2),
            'avg_rate_percent': round(sum(rates) / len(rates), 2),
            'min_maturity_days': min(maturities),
            'max_maturity_days': max(maturities),
            'min_maturity_years': round(min(maturities) / 252, 2),
            'max_maturity_years': round(max(maturities) / 252, 2)
        }

# Create singleton instance
di1_service = DI1DataService()

# Convenience function for backward compatibility
def fetch_di1_data(reference_date: str) -> Dict:
    """
    Fetch DI1 futures contracts for a given date.
    
    Args:
        reference_date: Date in YYYY-MM-DD format
        
    Returns:
        Dictionary with reference_date, contracts list, and count
    """
    return di1_service.fetch_di1_data(reference_date)
```

### `backend/routers/api.py` (UPDATE FILE)
Replace the placeholder `/api/di1` endpoint with:

```python
from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime
from typing import Optional
from services.data import di1_service
from schemas.contracts import DI1Response, DI1Contract

router = APIRouter()

@router.get("/di1", response_model=DI1Response)
async def get_di1_data(
    date: str = Query(
        ..., 
        description="Reference date in YYYY-MM-DD format",
        regex=r"^\d{4}-\d{2}-\d{2}$"
    ),
    max_business_days: Optional[int] = Query(
        1260,
        description="Maximum business days to expiry (default 1260 = 5 years)",
        ge=1,
        le=2520
    )
):
    """
    Fetch DI1 futures contracts for a given date.
    
    Args:
        date: Reference date in YYYY-MM-DD format
        max_business_days: Maximum business days to expiry (default 1260)
    
    Returns:
        DI1Response with list of contracts
        
    Raises:
        HTTPException: 400 for invalid input, 404 for no data, 500 for server errors
    """
    try:
        # Fetch data using service
        data = di1_service.fetch_di1_data(date, max_business_days)
        
        # Convert to response model
        contracts = [DI1Contract(**contract) for contract in data['contracts']]
        
        return DI1Response(
            reference_date=data['reference_date'],
            contracts=contracts,
            count=data['count']
        )
        
    except ValueError as e:
        # Invalid input or no data available
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Server error
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching DI1 data: {str(e)}"
        )

@router.get("/di1/summary")
async def get_di1_summary(
    date: str = Query(
        ..., 
        description="Reference date in YYYY-MM-DD format",
        regex=r"^\d{4}-\d{2}-\d{2}$"
    )
):
    """
    Get summary statistics for DI1 contracts on a given date.
    
    Args:
        date: Reference date in YYYY-MM-DD format
    
    Returns:
        Summary statistics dictionary
    """
    try:
        summary = di1_service.get_contract_summary(date)
        return summary
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting DI1 summary: {str(e)}"
        )

# Keep existing endpoints (methods, curve) as before
@router.post("/curve")
async def calculate_curve():
    """Calculate smoothed yield curve - placeholder for Feature 3"""
    return {
        "message": "Curve calculation endpoint (placeholder for Feature 3)",
        "curve": []
    }

@router.get("/methods")
async def get_available_methods():
    """Get list of available smoothing methods"""
    # ... existing implementation from Feature 1 ...
```

### `backend/schemas/contracts.py` (UPDATE FILE)
Update the Pydantic models:

```python
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import List, Optional

class DI1Contract(BaseModel):
    """Individual DI1 futures contract"""
    code: str = Field(..., description="Contract code (e.g., DI1F25)")
    expiry_date: str = Field(..., description="Contract expiry date (YYYY-MM-DD)")
    business_days: int = Field(..., description="Business days to expiry", ge=0)
    years: float = Field(..., description="Years to expiry", ge=0)
    rate: float = Field(..., description="Contract rate (as decimal)", ge=0, le=1)
    rate_percent: float = Field(..., description="Contract rate (as percentage)", ge=0, le=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "DI1F25",
                "expiry_date": "2025-03-03",
                "business_days": 21,
                "years": 0.0833,
                "rate": 0.1025,
                "rate_percent": 10.25
            }
        }

class DI1Response(BaseModel):
    """Response for DI1 data endpoint"""
    reference_date: str = Field(..., description="Reference date (YYYY-MM-DD)")
    contracts: List[DI1Contract] = Field(..., description="List of DI1 contracts")
    count: int = Field(..., description="Number of contracts", ge=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reference_date": "2025-02-03",
                "contracts": [
                    {
                        "code": "DI1F25",
                        "expiry_date": "2025-03-03",
                        "business_days": 21,
                        "years": 0.0833,
                        "rate": 0.1025,
                        "rate_percent": 10.25
                    }
                ],
                "count": 1
            }
        }

# Keep existing CurvePoint, CurveRequest, CurveResponse from Feature 1
```

---

## Testing

### `backend/tests/test_data.py` (NEW FILE)
```python
"""
Unit tests for DI1 data service.
"""
import pytest
from datetime import datetime, timedelta
from services.data import DI1DataService, di1_service
from services.utils import (
    parse_date,
    validate_date,
    is_weekend,
    calculate_business_days,
    business_days_to_years,
    rate_decimal_to_percent
)

class TestUtils:
    """Test utility functions"""
    
    def test_parse_date_valid(self):
        result = parse_date("2025-02-03")
        assert result.year == 2025
        assert result.month == 2
        assert result.day == 3
    
    def test_parse_date_invalid(self):
        with pytest.raises(ValueError):
            parse_date("03/02/2025")  # Wrong format
    
    def test_validate_date_future(self):
        future_date = datetime.now() + timedelta(days=10)
        with pytest.raises(ValueError):
            validate_date(future_date)
    
    def test_is_weekend(self):
        # Saturday
        assert is_weekend(datetime(2025, 2, 1)) == True
        # Monday
        assert is_weekend(datetime(2025, 2, 3)) == False
    
    def test_business_days_to_years(self):
        assert business_days_to_years(252) == 1.0
        assert business_days_to_years(126) == 0.5
        assert business_days_to_years(1260) == 5.0
    
    def test_rate_conversions(self):
        assert rate_decimal_to_percent(0.1025) == 10.25
        assert rate_decimal_to_percent(0.0) == 0.0
        assert rate_decimal_to_percent(1.0) == 100.0

class TestDI1DataService:
    """Test DI1 data service"""
    
    def test_fetch_di1_data_invalid_date_format(self):
        service = DI1DataService()
        with pytest.raises(ValueError):
            service.fetch_di1_data("03/02/2025")
    
    def test_fetch_di1_data_future_date(self):
        service = DI1DataService()
        future_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        with pytest.raises(ValueError):
            service.fetch_di1_data(future_date)
    
    def test_fetch_di1_data_weekend(self):
        service = DI1DataService()
        # Use a known Saturday
        with pytest.raises(ValueError):
            service.fetch_di1_data("2025-02-01")
    
    @pytest.mark.integration
    def test_fetch_di1_data_valid_date(self):
        """
        Integration test - requires internet connection and B3 data.
        Use a recent business day that should have data.
        """
        service = DI1DataService()
        
        # Use a recent business day (adjust as needed)
        # Note: This might fail if B3 was closed on this day
        test_date = "2025-01-31"  # Friday
        
        try:
            result = service.fetch_di1_data(test_date)
            
            # Verify structure
            assert 'reference_date' in result
            assert 'contracts' in result
            assert 'count' in result
            
            # Verify data
            assert result['reference_date'] == test_date
            assert result['count'] > 0
            assert len(result['contracts']) == result['count']
            
            # Verify first contract structure
            if result['count'] > 0:
                contract = result['contracts'][0]
                assert 'code' in contract
                assert 'expiry_date' in contract
                assert 'business_days' in contract
                assert 'years' in contract
                assert 'rate' in contract
                assert 'rate_percent' in contract
                
                # Verify rate conversion
                assert abs(contract['rate_percent'] - contract['rate'] * 100) < 0.01
                
        except Exception as e:
            pytest.skip(f"B3 data not available for {test_date}: {str(e)}")
    
    @pytest.mark.integration
    def test_get_contract_summary(self):
        """Integration test for summary statistics"""
        service = DI1DataService()
        test_date = "2025-01-31"
        
        try:
            summary = service.get_contract_summary(test_date)
            
            assert 'reference_date' in summary
            assert 'count' in summary
            assert 'min_rate_percent' in summary
            assert 'max_rate_percent' in summary
            assert 'avg_rate_percent' in summary
            
            if summary['count'] > 0:
                assert summary['min_rate_percent'] <= summary['max_rate_percent']
                assert summary['min_maturity_days'] <= summary['max_maturity_days']
                
        except Exception as e:
            pytest.skip(f"B3 data not available for {test_date}: {str(e)}")
```

### Running Tests
```bash
# Install pytest
pip install pytest pytest-cov

# Run all tests
pytest backend/tests/

# Run with coverage
pytest --cov=backend/services backend/tests/

# Run only unit tests (skip integration)
pytest backend/tests/ -m "not integration"

# Run only integration tests
pytest backend/tests/ -m integration
```

---

## Manual Testing

### Test Case 1: Valid Recent Business Day
```bash
# Request
curl "http://localhost:8000/api/di1?date=2025-01-31"

# Expected Response (example)
{
  "reference_date": "2025-01-31",
  "contracts": [
    {
      "code": "DI1F25",
      "expiry_date": "2025-03-03",
      "business_days": 21,
      "years": 0.0833,
      "rate": 0.1025,
      "rate_percent": 10.25
    },
    {
      "code": "DI1G25",
      "expiry_date": "2025-04-01",
      "business_days": 42,
      "years": 0.1667,
      "rate": 0.1050,
      "rate_percent": 10.50
    }
    // ... more contracts
  ],
  "count": 60
}
```

### Test Case 2: Weekend Date (Should Fail)
```bash
# Request
curl "http://localhost:8000/api/di1?date=2025-02-01"

# Expected Response
{
  "detail": "Reference date 2025-02-01 is a weekend. Please use a business day."
}
```

### Test Case 3: Future Date (Should Fail)
```bash
# Request
curl "http://localhost:8000/api/di1?date=2026-12-31"

# Expected Response
{
  "detail": "Date cannot be in the future: 2026-12-31"
}
```

### Test Case 4: Invalid Date Format (Should Fail)
```bash
# Request
curl "http://localhost:8000/api/di1?date=31/01/2025"

# Expected Response
{
  "detail": [
    {
      "type": "string_pattern_mismatch",
      "loc": ["query", "date"],
      "msg": "String should match pattern '^\\d{4}-\\d{2}-\\d{2}$'"
    }
  ]
}
```

### Test Case 5: Custom Max Business Days
```bash
# Request - Only contracts within 1 year
curl "http://localhost:8000/api/di1?date=2025-01-31&max_business_days=252"

# Expected Response
{
  "reference_date": "2025-01-31",
  "contracts": [
    // Only contracts expiring within 252 business days
  ],
  "count": 12  // Approximately 12 monthly contracts
}
```

### Test Case 6: Summary Statistics
```bash
# Request
curl "http://localhost:8000/api/di1/summary?date=2025-01-31"

# Expected Response
{
  "reference_date": "2025-01-31",
  "count": 60,
  "min_rate_percent": 9.85,
  "max_rate_percent": 11.20,
  "avg_rate_percent": 10.45,
  "min_maturity_days": 21,
  "max_maturity_days": 1260,
  "min_maturity_years": 0.08,
  "max_maturity_years": 5.0
}
```

---

## Error Handling

### Error Categories

1. **Input Validation Errors** (400 Bad Request)
   - Invalid date format
   - Future dates
   - Dates too far in the past
   - Weekend dates
   - Invalid max_business_days parameter

2. **Data Availability Errors** (400 Bad Request)
   - No contracts available for date (holiday)
   - No contracts within maturity filter

3. **External Service Errors** (500 Internal Server Error)
   - B3/pyield API unavailable
   - Network connectivity issues
   - Data parsing errors

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Performance Considerations

### Caching Strategy (Future Enhancement)
```python
# Example caching implementation (not in this feature)
from functools import lru_cache
from datetime import datetime, timedelta

@lru_cache(maxsize=100)
def fetch_di1_data_cached(reference_date: str, max_business_days: int):
    """Cached version of fetch_di1_data"""
    return di1_service.fetch_di1_data(reference_date, max_business_days)
```

### Expected Performance
- **First request**: 2-5 seconds (fetching from B3)
- **Cached request**: < 100ms
- **Data size**: Typical response ~60 contracts, ~10-15KB JSON

---

## Integration with Mobile App

### Mobile API Client Update
Update `mobile/services/api.ts`:

```typescript
async fetchDI1Data(date: string, maxBusinessDays?: number): Promise<DI1Response> {
  try {
    const params: any = { date };
    if (maxBusinessDays) {
      params.max_business_days = maxBusinessDays;
    }
    
    const response = await this.client.get('/api/di1', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Handle specific error cases
      if (error.response.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid request');
      }
      throw new Error('Failed to fetch DI1 data');
    }
    throw error;
  }
}

async fetchDI1Summary(date: string): Promise<any> {
  const response = await this.client.get('/api/di1/summary', {
    params: { date }
  });
  return response.data;
}
```

---

## Acceptance Criteria

### Backend
- ✅ `GET /api/di1` endpoint returns real DI1 data from B3
- ✅ Contracts filtered to max 5 years (1260 business days) by default
- ✅ Custom `max_business_days` parameter works
- ✅ Business days calculated correctly
- ✅ Rates provided in both decimal and percentage formats
- ✅ Contracts sorted by maturity (ascending)
- ✅ Weekend dates rejected with clear error message
- ✅ Future dates rejected with clear error message
- ✅ Invalid date formats rejected
- ✅ Holidays/closed market days handled gracefully
- ✅ Summary endpoint provides correct statistics
- ✅ All utility functions have unit tests
- ✅ Integration tests pass with real B3 data

### Mobile
- ✅ API client can successfully fetch DI1 data
- ✅ Error handling displays user-friendly messages
- ✅ Network errors caught and reported

---

## Known Limitations

1. **Holiday Calendar**: Currently uses pandas business day calculation (excludes weekends only). For production, should integrate Brazilian holiday calendar using `anbima` or `workalendar` libraries.

2. **PyArrow Conversion**: PyArrow to pandas conversion might have performance overhead for large datasets. Monitor and optimize if needed.

3. **Rate Precision**: Rates rounded to 4-6 decimal places. Verify if more precision needed for specific use cases.

4. **No Caching**: Every request fetches fresh data from B3. Consider adding caching layer for production.

5. **Time Zone**: Assumes all dates in Brazilian time zone. Consider explicit timezone handling.

---

## Future Enhancements

1. **Brazilian Holiday Calendar**
   ```bash
   pip install workalendar
   ```
   ```python
   from workalendar.america import Brazil
   cal = Brazil()
   ```

2. **Response Caching**
   - Redis for production
   - In-memory LRU cache for development

3. **Batch Requests**
   - Fetch multiple dates in single request
   - Date range queries

4. **Data Validation**
   - Sanity checks on rates (reasonable ranges)
   - Monotonicity checks on yield curve

5. **Historical Data Storage**
   - PostgreSQL for historical data
   - Track curve evolution over time

---

## Dependencies

### Required Python Packages
```txt
pyield>=1.3.0        # B3 data fetching
pandas>=2.1.4        # Data manipulation
numpy>=1.26.3        # Numerical operations
```

### Optional (for enhancements)
```txt
workalendar>=17.0.0  # Brazilian holiday calendar
redis>=5.0.0         # Caching layer
sqlalchemy>=2.0.0    # Database ORM
```

---

## Documentation References

- [pyield Documentation](https://github.com/crdcj/PYield)
- [B3 DI1 Contracts](https://www.b3.com.br/en_us/market-data-and-indices/indices/interest-rate-indices/di-x-pre.htm)
- [Brazilian Market Conventions](https://www.anbima.com.br/)
- [Pandas Business Day](https://pandas.pydata.org/docs/user_guide/timeseries.html#business-day)

---

## Troubleshooting

### Issue: "No module named 'pyield'"
**Solution**: 
```bash
pip install pyield
```

### Issue: "No DI1 data available for date"
**Causes**:
- Date is a Brazilian holiday
- Market was closed (special circumstances)
- Date is too far in the past (B3 historical data limit)

**Solution**: Try a different recent business day

### Issue: PyArrow conversion errors
**Solution**:
```bash
pip install --upgrade pyarrow pandas
```

### Issue: Slow response times
**Diagnosis**: 
- Network latency to B3
- Large dataset processing

**Solution**: Implement caching layer

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 2 |

---

## Next Steps

After completing Feature 2:
- **Feature 3**: Implement interpolation methods in `services/models.py`
- **Feature 4**: Complete `/api/curve` endpoint
- **Feature 6**: Build Home screen UI to select dates and fetch data