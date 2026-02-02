"""Integration tests for ETTJ API endpoints."""

import pytest
from datetime import date
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from schemas.contracts import DI1Contract, SmoothingMethod


client = TestClient(app)


# Mock DI1 data for testing
MOCK_CONTRACTS = [
    DI1Contract(
        ticker="DI1F25",
        maturity_date=date(2025, 1, 2),
        business_days=21,
        rate=0.1025,
        rate_percent=10.25,
    ),
    DI1Contract(
        ticker="DI1G25",
        maturity_date=date(2025, 2, 3),
        business_days=42,
        rate=0.1050,
        rate_percent=10.50,
    ),
    DI1Contract(
        ticker="DI1H25",
        maturity_date=date(2025, 3, 3),
        business_days=63,
        rate=0.1075,
        rate_percent=10.75,
    ),
    DI1Contract(
        ticker="DI1J25",
        maturity_date=date(2025, 4, 1),
        business_days=84,
        rate=0.1100,
        rate_percent=11.00,
    ),
    DI1Contract(
        ticker="DI1K25",
        maturity_date=date(2025, 5, 2),
        business_days=105,
        rate=0.1125,
        rate_percent=11.25,
    ),
    DI1Contract(
        ticker="DI1M25",
        maturity_date=date(2025, 6, 2),
        business_days=126,
        rate=0.1150,
        rate_percent=11.50,
    ),
]

MOCK_DI1_RESPONSE = {
    "reference_date": date(2025, 1, 31),
    "actual_date": date(2025, 1, 31),
    "contracts": MOCK_CONTRACTS,
    "count": len(MOCK_CONTRACTS),
}


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_health_check(self):
        """Test basic health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_detailed_health_check(self):
        """Test detailed health check with dependencies."""
        response = client.get("/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "api_version" in data
        assert "dependencies" in data
        deps = data["dependencies"]
        assert "scipy" in deps
        assert "pandas" in deps
        assert "numpy" in deps
        assert "fastapi" in deps


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root(self):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "ETTJ API"
        assert "version" in data
        assert "description" in data

    def test_process_time_header(self):
        """Test that X-Process-Time header is present."""
        response = client.get("/")
        assert "X-Process-Time" in response.headers


class TestMethodsEndpoint:
    """Test methods listing endpoint."""

    def test_get_methods_v1(self):
        """Test methods endpoint with v1 prefix."""
        response = client.get("/api/v1/methods")
        assert response.status_code == 200
        methods = response.json()
        assert len(methods) == 7  # 7 available methods

        # Check all expected methods are present
        method_ids = [m["id"] for m in methods]
        assert "linear" in method_ids
        assert "cubic_spline" in method_ids
        assert "akima" in method_ids
        assert "pchip" in method_ids
        assert "smoothing_spline" in method_ids
        assert "nelson_siegel" in method_ids
        assert "nelson_siegel_svensson" in method_ids

    def test_get_methods_backward_compatible(self):
        """Test methods endpoint without version prefix (backward compatibility)."""
        response = client.get("/api/methods")
        assert response.status_code == 200
        methods = response.json()
        assert len(methods) == 7

    def test_method_info_structure(self):
        """Test method info contains required fields."""
        response = client.get("/api/v1/methods")
        methods = response.json()

        for method in methods:
            assert "id" in method
            assert "name" in method
            assert "description" in method
            assert "category" in method
            assert "has_parameters" in method
            assert "min_points" in method


class TestDI1Endpoints:
    """Test DI1 data endpoints."""

    @patch("routers.api_v1.di1_service")
    def test_get_di1_data(self, mock_service):
        """Test DI1 data endpoint."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        response = client.get("/api/v1/di1?date=2025-01-31")
        assert response.status_code == 200
        data = response.json()

        assert data["reference_date"] == "2025-01-31"
        assert data["actual_date"] == "2025-01-31"
        assert data["count"] == 6
        assert len(data["contracts"]) == 6

    @patch("routers.api_v1.di1_service")
    def test_get_di1_summary(self, mock_service):
        """Test DI1 summary endpoint."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        response = client.get("/api/v1/di1/summary?date=2025-01-31")
        assert response.status_code == 200
        data = response.json()

        assert data["count"] == 6
        assert data["min_maturity_days"] == 21
        assert data["max_maturity_days"] == 126
        assert data["min_rate_percent"] == 10.25
        assert data["max_rate_percent"] == 11.50
        assert "avg_rate_percent" in data
        assert "spread_bps" in data

    @patch("routers.api_v1.di1_service")
    def test_di1_error_handling(self, mock_service):
        """Test DI1 endpoint error handling."""
        mock_service.fetch_di1_data.side_effect = ValueError("No data found")

        response = client.get("/api/v1/di1?date=2025-01-31")
        assert response.status_code == 400


class TestCurveEndpoint:
    """Test curve calculation endpoint."""

    def test_calculate_curve_linear(self):
        """Test curve calculation with linear interpolation."""
        request_data = {
            "reference_date": "2025-01-31",
            "method": "linear",
            "contracts": [
                {
                    "ticker": "DI1F25",
                    "maturity_date": "2025-01-02",
                    "business_days": 21,
                    "rate": 0.1025,
                    "rate_percent": 10.25,
                },
                {
                    "ticker": "DI1G25",
                    "maturity_date": "2025-02-03",
                    "business_days": 42,
                    "rate": 0.1050,
                    "rate_percent": 10.50,
                },
                {
                    "ticker": "DI1H25",
                    "maturity_date": "2025-03-03",
                    "business_days": 63,
                    "rate": 0.1075,
                    "rate_percent": 10.75,
                },
            ],
        }

        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 200
        data = response.json()

        assert data["method"] == "linear"
        assert data["method_name"] == "Linear Interpolation"
        assert "original_points" in data
        assert "points" in data or "curve_points" in data
        assert "metrics" in data
        assert "mae" in data["metrics"]
        assert "rmse" in data["metrics"]

    def test_calculate_curve_invalid_method(self):
        """Test curve calculation with invalid method."""
        request_data = {
            "reference_date": "2025-01-31",
            "method": "invalid_method",
            "contracts": [
                {
                    "ticker": "DI1F25",
                    "maturity_date": "2025-01-02",
                    "business_days": 21,
                    "rate": 0.1025,
                    "rate_percent": 10.25,
                },
            ],
        }

        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 422  # Validation error

    def test_calculate_curve_insufficient_data(self):
        """Test curve calculation with insufficient data points."""
        request_data = {
            "reference_date": "2025-01-31",
            "method": "cubic_spline",  # Requires 3+ points
            "contracts": [
                {
                    "ticker": "DI1F25",
                    "maturity_date": "2025-01-02",
                    "business_days": 21,
                    "rate": 0.1025,
                    "rate_percent": 10.25,
                },
                {
                    "ticker": "DI1G25",
                    "maturity_date": "2025-02-03",
                    "business_days": 42,
                    "rate": 0.1050,
                    "rate_percent": 10.50,
                },
            ],
        }

        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 400


class TestWorkflowEndpoint:
    """Test workflow endpoint."""

    @patch("routers.api_v1.di1_service")
    def test_workflow_success(self, mock_service):
        """Test successful workflow execution."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        request_data = {
            "date": "2025-01-31",
            "method": "linear",
        }

        response = client.post("/api/v1/workflow", json=request_data)
        assert response.status_code == 200
        data = response.json()

        assert data["method"] == "linear"
        assert data["contracts_count"] == 6
        assert "original_points" in data
        assert "curve_points" in data
        assert "metrics" in data

    @patch("routers.api_v1.di1_service")
    def test_workflow_with_parameters(self, mock_service):
        """Test workflow with method-specific parameters."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        request_data = {
            "date": "2025-01-31",
            "method": "smoothing_spline",
            "parameters": {"smoothing": 0.3},
        }

        response = client.post("/api/v1/workflow", json=request_data)
        assert response.status_code == 200

    def test_workflow_invalid_date_format(self):
        """Test workflow with invalid date format."""
        request_data = {
            "date": "31-01-2025",  # Wrong format
            "method": "linear",
        }

        response = client.post("/api/v1/workflow", json=request_data)
        assert response.status_code == 422  # Validation error

    @patch("routers.api_v1.di1_service")
    def test_workflow_insufficient_data_for_method(self, mock_service):
        """Test workflow when method requires more data points than available."""
        # Return only 3 contracts
        mock_response = MOCK_DI1_RESPONSE.copy()
        mock_response["contracts"] = MOCK_CONTRACTS[:3]
        mock_response["count"] = 3
        mock_service.fetch_di1_data.return_value = mock_response

        request_data = {
            "date": "2025-01-31",
            "method": "nelson_siegel",  # Requires 4+ points
        }

        response = client.post("/api/v1/workflow", json=request_data)
        assert response.status_code == 400


class TestCompareMethodsEndpoint:
    """Test method comparison endpoint."""

    @patch("routers.api_v1.di1_service")
    def test_compare_methods_success(self, mock_service):
        """Test successful method comparison."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        request_data = {
            "date": "2025-01-31",
            "methods": ["linear", "cubic_spline", "pchip"],
        }

        response = client.post("/api/v1/curve/compare", json=request_data)
        assert response.status_code == 200
        data = response.json()

        assert data["contracts_count"] == 6
        assert "original_points" in data
        assert "results" in data
        assert len(data["results"]) == 3

        # Check each result
        for result in data["results"]:
            assert "method" in result
            assert "method_name" in result
            assert "success" in result

    @patch("routers.api_v1.di1_service")
    def test_compare_methods_partial_success(self, mock_service):
        """Test comparison where some methods fail due to insufficient data."""
        # Only 3 contracts - akima needs 5
        mock_response = MOCK_DI1_RESPONSE.copy()
        mock_response["contracts"] = MOCK_CONTRACTS[:3]
        mock_response["count"] = 3
        mock_service.fetch_di1_data.return_value = mock_response

        request_data = {
            "date": "2025-01-31",
            "methods": ["linear", "akima"],
        }

        response = client.post("/api/v1/curve/compare", json=request_data)
        assert response.status_code == 200
        data = response.json()

        # Linear should succeed, akima should fail
        linear_result = next(r for r in data["results"] if r["method"] == "linear")
        akima_result = next(r for r in data["results"] if r["method"] == "akima")

        assert linear_result["success"] is True
        assert akima_result["success"] is False
        assert "error" in akima_result

    def test_compare_methods_invalid_date(self):
        """Test comparison with invalid date."""
        request_data = {
            "date": "invalid-date",
            "methods": ["linear"],
        }

        response = client.post("/api/v1/curve/compare", json=request_data)
        assert response.status_code == 422


class TestErrorHandling:
    """Test error handling and response format."""

    def test_404_error_format(self):
        """Test 404 error response format."""
        response = client.get("/nonexistent/endpoint")
        assert response.status_code == 404
        data = response.json()

        assert "error_code" in data
        assert "message" in data
        assert "timestamp" in data

    def test_validation_error_format(self):
        """Test validation error response format."""
        request_data = {
            "date": "2025-01-31",
            "method": "invalid_method",  # Invalid enum value
            "contracts": [],
        }

        response = client.post("/api/v1/curve", json=request_data)
        assert response.status_code == 422
        data = response.json()

        assert "error_code" in data
        assert data["error_code"] == "VALIDATION_ERROR"
        assert "message" in data
        assert "details" in data
        assert "errors" in data["details"]


class TestBackwardCompatibility:
    """Test backward compatibility with /api prefix."""

    def test_methods_both_prefixes(self):
        """Test that both /api and /api/v1 work."""
        response_v1 = client.get("/api/v1/methods")
        response_legacy = client.get("/api/methods")

        assert response_v1.status_code == 200
        assert response_legacy.status_code == 200
        assert response_v1.json() == response_legacy.json()

    @patch("routers.api_v1.di1_service")
    def test_di1_both_prefixes(self, mock_service):
        """Test DI1 endpoint works with both prefixes."""
        mock_service.fetch_di1_data.return_value = MOCK_DI1_RESPONSE

        response_v1 = client.get("/api/v1/di1?date=2025-01-31")
        response_legacy = client.get("/api/di1?date=2025-01-31")

        assert response_v1.status_code == 200
        assert response_legacy.status_code == 200
