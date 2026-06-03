from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .benchmarks import get_benchmarks
from .data_feed import get_historical_prices, get_latest_prices
from .metrics import calculate_metrics
from .portfolio import PaperPortfolio


STATE_PATH = Path(__file__).resolve().parent / "portfolios_state.json"


class PaperTradingEngine:
    def __init__(self, state_path: Path = STATE_PATH) -> None:
        self.state_path = state_path
        self.portfolios: dict[str, PaperPortfolio] = {}
        self.load_state()

    def load_state(self) -> None:
        if not self.state_path.exists():
            self.portfolios = {}
            return
        data = json.loads(self.state_path.read_text())
        self.portfolios = {
            item["portfolio_id"]: PaperPortfolio.from_dict(item)
            for item in data.get("portfolios", [])
        }

    def save_state(self) -> None:
        self.state_path.write_text(json.dumps({
            "portfolios": [portfolio.to_dict() for portfolio in self.portfolios.values()]
        }, indent=2))

    def create_portfolio(self, name: str, initial_cash: float) -> PaperPortfolio:
        if initial_cash <= 0:
            raise ValueError("Initial cash must be greater than zero.")
        portfolio = PaperPortfolio(name=name, initial_cash=float(initial_cash))
        self.portfolios[portfolio.portfolio_id] = portfolio
        self.save_state()
        return portfolio

    def delete_portfolio(self, portfolio_id: str) -> None:
        if portfolio_id not in self.portfolios:
            raise KeyError("Portfolio not found.")
        del self.portfolios[portfolio_id]
        self.save_state()

    def get_portfolio(self, portfolio_id: str) -> PaperPortfolio:
        if portfolio_id not in self.portfolios:
            raise KeyError("Portfolio not found.")
        return self.portfolios[portfolio_id]

    def execute_trade(self, portfolio_id: str, action: str, ticker: str, shares: float, date: str | None = None) -> dict[str, Any]:
        portfolio = self.get_portfolio(portfolio_id)
        price = get_latest_prices([ticker]).get(ticker.upper())
        if price is None:
            raise ValueError(f"Could not retrieve latest price for {ticker}.")

        if action == "buy":
            transaction = portfolio.buy(ticker, shares, price, date)
        elif action == "sell":
            transaction = portfolio.sell(ticker, shares, price, date)
        else:
            raise ValueError("Action must be 'buy' or 'sell'.")

        if ticker.upper() in portfolio.holdings:
            portfolio.holdings[ticker.upper()]["current_price"] = price
        self.save_state()
        return transaction

    def summarize_portfolio(self, portfolio_id: str) -> dict[str, Any]:
        portfolio = self.get_portfolio(portfolio_id)
        tickers = list(portfolio.holdings.keys())
        latest_prices = get_latest_prices(tickers) if tickers else {}
        total_value = portfolio.get_total_value(latest_prices)
        holdings = []
        for ticker, holding in portfolio.holdings.items():
            current_price = latest_prices.get(ticker, holding.get("current_price", holding["avg_cost"]))
            holding["current_price"] = current_price
            market_value = holding["shares"] * current_price
            pnl = market_value - holding["shares"] * holding["avg_cost"]
            holdings.append({
                "ticker": ticker,
                "shares": holding["shares"],
                "avg_cost": holding["avg_cost"],
                "current_price": current_price,
                "pnl": pnl,
                "pnl_pct": (current_price / holding["avg_cost"] - 1.0) * 100 if holding["avg_cost"] else 0.0,
                "weight": market_value / total_value * 100 if total_value else 0.0,
            })
        self.save_state()
        return {
            "portfolio_id": portfolio.portfolio_id,
            "name": portfolio.name,
            "cash": portfolio.cash_balance,
            "initial_cash": portfolio.initial_cash,
            "created_at": portfolio.created_at,
            "holdings": holdings,
            "total_value": total_value,
            "weights": {item["ticker"]: item["weight"] for item in holdings},
            "transactions": portfolio.transactions,
        }

    def run_backtest(self, portfolio_id: str, start_date: str, end_date: str) -> dict[str, Any]:
        portfolio = self.get_portfolio(portfolio_id)
        tickers = list(portfolio.holdings.keys())
        if not tickers:
            raise ValueError("Portfolio has no holdings to backtest.")

        prices = get_historical_prices(tickers, start_date, end_date)
        prices = prices.rename(columns={col: str(col).replace(".", "-") for col in prices.columns})
        available_tickers = [t for t in tickers if t in prices.columns]
        if not available_tickers:
            raise ValueError("No matching price columns found for current holdings.")

        # Use prices at START of backtest period for historically accurate weights.
        # This prevents look-ahead bias from applying today's prices to a 1-year backtest.
        first_prices = prices[available_tickers].dropna(how="all").iloc[0]
        start_values = {
            t: portfolio.holdings[t]["shares"] * float(first_prices[t])
            for t in available_tickers
            if pd.notna(first_prices.get(t))
        }
        total_start_value = sum(start_values.values()) + portfolio.cash_balance
        if total_start_value <= 0:
            raise ValueError("Cannot compute weights — total start value is zero.")

        weights = pd.Series({t: v / total_start_value for t, v in start_values.items()})
        asset_returns = prices[weights.index].pct_change().dropna(how="all").fillna(0)
        portfolio_returns = asset_returns.mul(weights, axis=1).sum(axis=1)
        equity = (1 + portfolio_returns).cumprod() * portfolio.initial_cash
        benchmarks = get_benchmarks(start_date, end_date)
        spy_returns = benchmarks.get("SPY")
        metrics = calculate_metrics(portfolio_returns, spy_returns)

        benchmark_comparison = {}
        for label, returns in benchmarks.items():
            benchmark_comparison[label] = calculate_metrics(returns, spy_returns)

        return {
            "returns": portfolio_returns,
            "equity": equity,
            "metrics": metrics,
            "benchmark_comparison": benchmark_comparison,
            "benchmark_returns": benchmarks,
        }

    def get_performance_report(self, portfolio_id: str, start: str | None = None, end: str | None = None) -> dict[str, Any]:
        end_date = end or datetime.now(timezone.utc).date().isoformat()
        start_date = start or (datetime.now(timezone.utc).date() - timedelta(days=365)).isoformat()
        result = self.run_backtest(portfolio_id, start_date, end_date)
        equity = result["equity"]
        benchmark_returns = result["benchmark_returns"]

        equity_curve = []
        if equity.empty or equity.isna().all():
            raise ValueError("Equity curve is empty — no price data for the given period.")
        first_valid_values = equity.dropna()
        if first_valid_values.empty or float(first_valid_values.iloc[0]) == 0:
            raise ValueError("Equity curve base value is zero — cannot normalise.")
        base_portfolio = float(first_valid_values.iloc[0])
        benchmark_curves = {
            label: (1 + returns).cumprod() * 100
            for label, returns in benchmark_returns.items()
        }
        for date, value in equity.items():
            if pd.isna(value):
                continue
            point = {
                "date": pd.Timestamp(date).strftime("%Y-%m-%d"),
                "portfolio_value": float(value / base_portfolio * 100),
            }
            for label, curve in benchmark_curves.items():
                nearest = curve.reindex(curve.index.union([date])).sort_index().ffill().get(date)
                point[f"{label.lower().replace('-', '_')}_value"] = float(nearest) if pd.notna(nearest) else None
            equity_curve.append(point)

        return {
            "metrics": result["metrics"],
            "benchmark_comparison": result["benchmark_comparison"],
            "equity_curve": equity_curve,
        }


engine = PaperTradingEngine()
