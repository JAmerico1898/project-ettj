"""Health check endpoints for ETTJ API."""

from typing import Dict, Any

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


def get_package_version(package_name: str) -> str:
    """Get version of an installed package."""
    try:
        from importlib.metadata import version
        return version(package_name)
    except Exception:
        return "unknown"


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Basic health check endpoint.

    Returns simple status indicating the API is running.
    """
    return {"status": "healthy"}


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with dependency versions.

    Returns API status along with versions of key dependencies
    (pyield, scipy, pandas, numpy, fastapi).
    """
    dependencies = {
        "pyield": get_package_version("python-yield"),
        "scipy": get_package_version("scipy"),
        "pandas": get_package_version("pandas"),
        "numpy": get_package_version("numpy"),
        "fastapi": get_package_version("fastapi"),
        "pydantic": get_package_version("pydantic"),
    }

    # Try to import pyield specifically since package name might differ
    try:
        import pyield
        dependencies["pyield"] = getattr(pyield, "__version__", "installed")
    except ImportError:
        dependencies["pyield"] = "not installed"

    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "dependencies": dependencies,
    }
