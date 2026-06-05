from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd

from .data_feed import get_historical_prices as _get_historical_prices
from .data_feed import get_latest_prices


DATA_SOURCE = "Yahoo Finance"


def normalize_ticker(ticker: str) -> str:
    cleaned = ticker.upper().strip()
    if not cleaned:
        raise ValueError("Ticker is required.")
    return cleaned.replace(".", "-")


def yfinance_symbol(ticker: str) -> str:
    normalized = normalize_ticker(ticker)
    return normalized.replace("-", ".") if normalized == "BRK-B" else normalized


def get_latest_quote(ticker: str) -> dict[str, Any]:
    symbol = normalize_ticker(ticker)
    prices = get_latest_prices([symbol])
    price = prices.get(symbol)
    if price is None:
        raise ValueError(f"Market data unavailable for {symbol}.")
    return {
        "ticker": symbol,
        "price": float(price),
        "change": None,
        "change_pct": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": DATA_SOURCE,
        "status": "delayed",
    }


def get_latest_quotes(tickers: list[str]) -> dict[str, dict[str, Any]]:
    symbols = [normalize_ticker(ticker) for ticker in tickers]
    prices = get_latest_prices(symbols)
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        symbol: {
            "ticker": symbol,
            "price": float(price),
            "change": None,
            "change_pct": None,
            "timestamp": timestamp,
            "source": DATA_SOURCE,
            "status": "delayed",
        }
        for symbol, price in prices.items()
    }


def get_historical_prices(tickers: list[str], start: str, end: str) -> pd.DataFrame:
    return _get_historical_prices([normalize_ticker(ticker) for ticker in tickers], start, end)


def get_fundamentals(ticker: str) -> dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("yfinance is not installed. Run: pip install -r requirements.txt") from exc

    symbol = normalize_ticker(ticker)
    info = yf.Ticker(yfinance_symbol(symbol)).info
    if not info:
        raise ValueError(f"Market data unavailable for {symbol}.")
    revenue = info.get("totalRevenue") or 0
    market_cap = info.get("marketCap") or 0
    revenue_growth = info.get("revenueGrowth")
    gross_margin = info.get("grossMargins")
    ev_ebitda = info.get("enterpriseToEbitda")
    return {
        "ticker": symbol,
        "name": info.get("longName") or info.get("shortName") or symbol,
        "sector": info.get("sector", "N/A"),
        "psTTM": round(market_cap / revenue, 2) if revenue > 0 else None,
        "evEbitda": round(ev_ebitda, 1) if ev_ebitda else None,
        "grossMargin": round(gross_margin * 100, 1) if gross_margin else None,
        "yoyGrowth": round(revenue_growth * 100, 1) if revenue_growth else None,
        "marketCap": market_cap,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": DATA_SOURCE,
        "status": "delayed",
    }


def validate_ticker(ticker: str) -> bool:
    symbol = normalize_ticker(ticker)
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=14)
    try:
        prices = get_historical_prices([symbol], start.isoformat(), (end + timedelta(days=1)).isoformat())
    except Exception:
        return False
    return not prices.empty
