from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd


CACHE_DIR = Path(__file__).resolve().parent / ".cache"
CACHE_DIR.mkdir(exist_ok=True)


def _cache_path(tickers: list[str], start: str, end: str) -> Path:
    key = "_".join(sorted(t.replace(".", "-").replace("-", "_") for t in tickers))
    return CACHE_DIR / f"prices_{key}_{start}_{end}.json"


def _is_fresh(path: Path) -> bool:
    if not path.exists():
        return False
    modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
    return datetime.now(timezone.utc) - modified < timedelta(hours=1)


def get_historical_prices(tickers: list[str], start: str, end: str) -> pd.DataFrame:
    normalized = [ticker.upper().replace("-", ".") if ticker.upper() == "BRK-B" else ticker.upper() for ticker in tickers]
    if not normalized:
        raise ValueError("At least one ticker is required.")

    cache_file = _cache_path(normalized, start, end)
    if _is_fresh(cache_file):
        payload = json.loads(cache_file.read_text())
        frame = pd.DataFrame(payload)
        frame.index = pd.to_datetime(frame.pop("date"))
        return frame.astype(float)

    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("yfinance is not installed. Run: pip install -r requirements.txt") from exc

    raw = yf.download(
        normalized,
        start=start,
        end=end,
        auto_adjust=True,
        progress=False,
        threads=True,
    )
    if raw.empty:
        raise ValueError(f"No historical price data returned for {', '.join(tickers)}.")

    if isinstance(raw.columns, pd.MultiIndex):
        close = raw["Close"] if "Close" in raw.columns.get_level_values(0) else raw["Adj Close"]
    else:
        close = raw[["Close"]].rename(columns={"Close": normalized[0]})

    close = close.dropna(how="all").ffill().dropna(how="all")
    if close.empty:
        raise ValueError("Historical price data contained no usable close prices.")

    payload = close.reset_index().rename(columns={"Date": "date"})
    payload["date"] = payload["date"].dt.strftime("%Y-%m-%d")
    cache_file.write_text(payload.to_json(orient="records"))
    return close


def get_latest_prices(tickers: list[str]) -> dict[str, float]:
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=7)
    prices = get_historical_prices(tickers, start.isoformat(), (end + timedelta(days=1)).isoformat())
    latest = prices.ffill().iloc[-1]
    return {str(ticker).replace(".", "-"): float(price) for ticker, price in latest.items() if pd.notna(price)}

