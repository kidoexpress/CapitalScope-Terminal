from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .engine import engine
from .market_data import get_fundamentals as fetch_fundamentals


router = APIRouter(prefix="/portfolio", tags=["paper-trading"])


class CreatePortfolioRequest(BaseModel):
    name: str = Field(min_length=1)
    initial_cash: float = Field(gt=0)


class TradeRequest(BaseModel):
    action: Literal["buy", "sell"]
    ticker: str = Field(min_length=1)
    shares: float = Field(gt=0)
    date: Optional[str] = None


def api_error(exc: Exception) -> HTTPException:
    status = 404 if isinstance(exc, KeyError) else 400
    return HTTPException(status_code=status, detail=str(exc).strip("'"))


# ── Static routes first (must be before /{portfolio_id}) ──────────────────────

@router.post("/create")
def create_portfolio(payload: CreatePortfolioRequest):
    try:
        portfolio = engine.create_portfolio(payload.name, payload.initial_cash)
        return {
            "portfolio_id": portfolio.portfolio_id,
            "name": portfolio.name,
            "cash": portfolio.cash_balance,
            "initial_cash": portfolio.initial_cash,
            "total_value": portfolio.cash_balance,
            "holdings": [],
            "created_at": portfolio.created_at,
        }
    except Exception as exc:
        raise api_error(exc)


@router.get("/list")
def list_portfolios():
    rows = []
    for portfolio in engine.portfolios.values():
        try:
            summary = engine.summarize_portfolio(portfolio.portfolio_id)
        except Exception:
            summary = {
                "portfolio_id": portfolio.portfolio_id,
                "name": portfolio.name,
                "cash": portfolio.cash_balance,
                "total_value": portfolio.cash_balance,
                "holdings": [],
            }
        rows.append(summary)
    return rows


@router.get("/fx-rate")
def get_fx_rate(base: str = "USD", target: str = "USD"):
    """Return the exchange rate from base to target currency using yfinance."""
    if base == target:
        return {"rate": 1.0, "pair": f"{base}/{target}"}
    try:
        import yfinance as yf
        pair = f"{base}{target}=X"
        ticker = yf.Ticker(pair)
        rate = ticker.fast_info.last_price
        if not rate or rate <= 0:
            inv_pair = f"{target}{base}=X"
            inv_rate = yf.Ticker(inv_pair).fast_info.last_price
            rate = 1.0 / inv_rate if inv_rate and inv_rate > 0 else 1.0
        return {"rate": float(rate), "pair": f"{base}/{target}"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/default-dates")
def default_dates():
    """Return a sensible default start/end date range (1 year back)."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=365)
    return {"start": start.isoformat(), "end": end.isoformat()}


@router.get("/fundamentals/{ticker}")
def get_fundamentals(ticker: str):
    """Return live fundamental data for a single ticker via yfinance."""
    try:
        return fetch_fundamentals(ticker)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ── Parameterised routes ───────────────────────────────────────────────────────

@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: str):
    try:
        return engine.summarize_portfolio(portfolio_id)
    except Exception as exc:
        raise api_error(exc)


@router.post("/{portfolio_id}/trade")
def trade(portfolio_id: str, payload: TradeRequest):
    try:
        transaction = engine.execute_trade(
            portfolio_id, payload.action, payload.ticker, payload.shares, payload.date
        )
        return {
            "transaction": transaction,
            "updated_portfolio": engine.summarize_portfolio(portfolio_id),
        }
    except Exception as exc:
        raise api_error(exc)


@router.get("/{portfolio_id}/metrics")
def metrics(
    portfolio_id: str,
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    benchmark: Optional[str] = Query(default=None),
):
    try:
        return engine.get_performance_report(portfolio_id, start, end, benchmark_ticker=benchmark)
    except Exception as exc:
        raise api_error(exc)


@router.get("/{portfolio_id}/equity-curve")
def equity_curve(
    portfolio_id: str,
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    benchmark: Optional[str] = Query(default=None),
):
    try:
        report = engine.get_performance_report(portfolio_id, start, end, benchmark_ticker=benchmark)
        return report["equity_curve"]
    except Exception as exc:
        raise api_error(exc)


@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: str):
    try:
        engine.delete_portfolio(portfolio_id)
        return {"deleted": True, "portfolio_id": portfolio_id}
    except Exception as exc:
        raise api_error(exc)
