from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from .benchmarks import get_benchmarks
from .data_feed import get_historical_prices, get_latest_prices
from .metrics import calculate_metrics
from .portfolio import PaperPortfolio
from .repository import JsonPortfolioRepository, PortfolioRepository, SQLitePortfolioRepository


STATE_PATH = Path(__file__).resolve().parent / "portfolios_state.json"


class PaperTradingEngine:
    def __init__(
        self,
        state_path: Path = STATE_PATH,
        repository: PortfolioRepository | None = None,
    ) -> None:
        self.state_path = state_path
        self.repository = repository or SQLitePortfolioRepository(
            fallback=JsonPortfolioRepository(state_path)
        )
        self.portfolios: dict[str, PaperPortfolio] = {}
        self.load_state()

    def load_state(self) -> None:
        self.portfolios = self.repository.load()

    def save_state(self) -> None:
        self.repository.save(self.portfolios.values())

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
        total_unrealized_pnl = 0.0
        for ticker, holding in portfolio.holdings.items():
            current_price = latest_prices.get(ticker, holding.get("current_price", holding["avg_cost"]))
            holding["current_price"] = current_price
            market_value = holding["shares"] * current_price
            pnl = market_value - holding["shares"] * holding["avg_cost"]
            cost_basis = holding["shares"] * holding["avg_cost"]
            total_unrealized_pnl += pnl
            holdings.append({
                "ticker": ticker,
                "shares": holding["shares"],
                "avg_cost": holding["avg_cost"],
                "current_price": current_price,
                "pnl": pnl,
                "unrealized_pnl": pnl,
                "unrealized_pnl_pct": pnl / cost_basis * 100 if cost_basis else 0.0,
                "pnl_pct": (current_price / holding["avg_cost"] - 1.0) * 100 if holding["avg_cost"] else 0.0,
                "weight": market_value / total_value * 100 if total_value else 0.0,
            })
        total_realized_pnl = sum(float(txn.get("realized_pnl", 0.0)) for txn in portfolio.transactions)
        total_pnl = total_realized_pnl + total_unrealized_pnl
        invested_capital = max(portfolio.initial_cash, 1e-9)
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
            "realized_pnl": total_realized_pnl,
            "unrealized_pnl": total_unrealized_pnl,
            "total_pnl": total_pnl,
            "total_pnl_pct": total_pnl / invested_capital * 100,
            "transactions": portfolio.transactions,
            "cash_ledger": portfolio.cash_ledger,
            "data_source": "Yahoo Finance",
            "data_status": "delayed",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    def run_backtest(self, portfolio_id: str, start_date: str, end_date: str) -> dict[str, Any]:
        portfolio = self.get_portfolio(portfolio_id)
        tickers = sorted({
            str(txn.get("ticker", "")).upper().replace(".", "-")
            for txn in portfolio.transactions
            if txn.get("ticker")
        } | set(portfolio.holdings.keys()))

        benchmarks = get_benchmarks(start_date, end_date)
        spy_returns = benchmarks.get("SPY")

        if not tickers:
            index = self._report_index(start_date, end_date, benchmarks)
            equity = pd.Series(portfolio.initial_cash, index=index, dtype="float64")
            portfolio_returns = equity.pct_change().dropna().fillna(0)
        else:
            prices = get_historical_prices(tickers, start_date, end_date)
            prices = prices.rename(columns={col: str(col).replace(".", "-") for col in prices.columns})
            available_tickers = [t for t in tickers if t in prices.columns]
            if not available_tickers:
                raise ValueError("No matching price columns found for portfolio transaction history.")
            missing = sorted(set(tickers) - set(available_tickers))
            if missing:
                raise ValueError(f"Missing historical price data for: {', '.join(missing)}.")
            prices = prices[available_tickers].ffill().dropna(how="all")
            if prices.empty:
                raise ValueError("Historical price data contained no usable close prices.")
            if portfolio.transactions:
                equity = self._build_transaction_equity_curve(portfolio, prices)
            else:
                equity = self._build_legacy_holdings_equity_curve(portfolio, prices)
            portfolio_returns = equity.pct_change().replace([np.inf, -np.inf], np.nan).dropna().fillna(0)

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

    def _report_index(
        self,
        start_date: str,
        end_date: str,
        benchmarks: dict[str, pd.Series],
    ) -> pd.DatetimeIndex:
        for returns in benchmarks.values():
            if not returns.empty:
                return pd.DatetimeIndex(returns.index)
        return pd.date_range(start=start_date, end=end_date, freq="B")

    def _build_transaction_equity_curve(self, portfolio: PaperPortfolio, prices: pd.DataFrame) -> pd.Series:
        cash = float(portfolio.initial_cash)
        holdings: dict[str, dict[str, float]] = {}
        transactions = sorted(
            portfolio.transactions,
            key=lambda txn: (txn.get("date", ""), txn.get("timestamp", "")),
        )
        transaction_index = 0
        values: list[float] = []
        dates: list[pd.Timestamp] = []

        for date, row in prices.iterrows():
            current_day = pd.Timestamp(date).date().isoformat()
            while transaction_index < len(transactions) and transactions[transaction_index].get("date", "") <= current_day:
                txn = transactions[transaction_index]
                ticker = str(txn["ticker"]).upper().replace(".", "-")
                shares = float(txn["shares"])
                trade_price = float(txn["price"])
                notional = float(txn["notional"])
                if txn["action"] == "buy":
                    current = holdings.get(ticker, {"shares": 0.0, "avg_cost": 0.0})
                    new_shares = current["shares"] + shares
                    avg_cost = (
                        (current["shares"] * current["avg_cost"]) + notional
                    ) / new_shares if new_shares else 0.0
                    holdings[ticker] = {"shares": new_shares, "avg_cost": avg_cost}
                    cash -= notional
                elif txn["action"] == "sell":
                    current = holdings.get(ticker, {"shares": 0.0, "avg_cost": trade_price})
                    remaining = max(current["shares"] - shares, 0.0)
                    cash += notional
                    if remaining <= 1e-9:
                        holdings.pop(ticker, None)
                    else:
                        holdings[ticker] = {"shares": remaining, "avg_cost": current["avg_cost"]}
                transaction_index += 1

            holdings_value = 0.0
            for ticker, holding in holdings.items():
                price = row.get(ticker)
                if pd.isna(price):
                    raise ValueError(f"Missing historical close price for {ticker} on {current_day}.")
                holdings_value += holding["shares"] * float(price)
            dates.append(pd.Timestamp(date))
            values.append(cash + holdings_value)

        equity = pd.Series(values, index=pd.DatetimeIndex(dates), dtype="float64")
        if equity.empty or equity.isna().all():
            raise ValueError("Transaction equity curve is empty.")
        return equity

    def _build_legacy_holdings_equity_curve(self, portfolio: PaperPortfolio, prices: pd.DataFrame) -> pd.Series:
        values: list[float] = []
        dates: list[pd.Timestamp] = []
        for date, row in prices.iterrows():
            holdings_value = 0.0
            for ticker, holding in portfolio.holdings.items():
                price = row.get(ticker)
                if pd.isna(price):
                    raise ValueError(f"Missing historical close price for {ticker} on {pd.Timestamp(date).date().isoformat()}.")
                holdings_value += float(holding["shares"]) * float(price)
            dates.append(pd.Timestamp(date))
            values.append(float(portfolio.cash_balance) + holdings_value)
        return pd.Series(values, index=pd.DatetimeIndex(dates), dtype="float64")

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
            "assumptions": [
                "Portfolio equity is reconstructed from simulated transaction history.",
                "Historical closes are sourced from Yahoo Finance and forward-filled where Yahoo omits a market day.",
                "Benchmark series are normalized to the same report window when available.",
            ],
            "data_quality_notes": [
                "Yahoo Finance data may be delayed, adjusted, incomplete, or rate-limited.",
                "Outputs are educational analysis only and require independent verification.",
            ],
        }


engine = PaperTradingEngine()
