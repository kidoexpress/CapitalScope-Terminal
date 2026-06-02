"""Paper trading engine for CapitalScope Terminal."""

from .routes import router  # noqa: F401 — re-export for app.include_router()

__all__ = ["router"]
