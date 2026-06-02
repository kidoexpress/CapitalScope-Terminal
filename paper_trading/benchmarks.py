from __future__ import annotations

import pandas as pd

from .data_feed import get_historical_prices


BENCHMARK_TICKERS = {
    "SPY": "SPY",
    "QQQ": "QQQ",
    "BRK-B": "BRK-B",
    "ARKK": "ARKK",
}


def get_benchmarks(start: str, end: str) -> dict[str, pd.Series]:
    prices = get_historical_prices(list(BENCHMARK_TICKERS.values()), start, end)
    returns: dict[str, pd.Series] = {}
    for label, ticker in BENCHMARK_TICKERS.items():
      column = ticker.replace("-", ".") if ticker == "BRK-B" else ticker
      if column in prices:
          series = prices[column].pct_change().dropna()
          if not series.empty:
              returns[label] = series
    return returns
