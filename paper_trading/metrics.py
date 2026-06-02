from __future__ import annotations

import numpy as np
import pandas as pd


TRADING_DAYS = 252
RISK_FREE_RATE = 0.05


def _clean_returns(returns: pd.Series) -> pd.Series:
    return pd.Series(returns, dtype="float64").replace([np.inf, -np.inf], np.nan).dropna()


def calculate_metrics(returns_series: pd.Series, benchmark_returns: pd.Series | None = None) -> dict[str, float]:
    returns = _clean_returns(returns_series)
    benchmark = _clean_returns(benchmark_returns) if benchmark_returns is not None else pd.Series(dtype="float64")
    aligned = pd.concat([returns.rename("portfolio"), benchmark.rename("benchmark")], axis=1).dropna()
    portfolio_aligned = aligned["portfolio"] if not aligned.empty else returns
    benchmark_aligned = aligned["benchmark"] if not aligned.empty else benchmark

    if returns.empty:
        return {
            "total_return": 0.0,
            "annualized_return": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "max_drawdown": 0.0,
            "calmar_ratio": 0.0,
            "volatility_annual": 0.0,
            "alpha": 0.0,
            "beta": 0.0,
            "win_rate": 0.0,
            "best_day": 0.0,
            "worst_day": 0.0,
            "var_95": 0.0,
        }

    # Total return: cumulative compounded return, Π(1+r_t)-1.
    cumulative = (1.0 + returns).cumprod()
    total_return = cumulative.iloc[-1] - 1.0

    # CAGR: (ending value / beginning value)^(252 / observed days)-1.
    years = max(len(returns) / TRADING_DAYS, 1 / TRADING_DAYS)
    annualized_return = (1.0 + total_return) ** (1.0 / years) - 1.0

    # Volatility: sample daily standard deviation annualized by sqrt(252).
    volatility_annual = returns.std(ddof=1) * np.sqrt(TRADING_DAYS) if len(returns) > 1 else 0.0

    # Sharpe: (annualized return - annual risk-free rate) / annualized volatility.
    sharpe_ratio = (annualized_return - RISK_FREE_RATE) / volatility_annual if volatility_annual else 0.0

    # Sortino: excess annualized return / annualized downside deviation.
    daily_rf = RISK_FREE_RATE / TRADING_DAYS
    downside = returns[returns < daily_rf]
    downside_dev = np.sqrt(((downside - daily_rf) ** 2).mean() * TRADING_DAYS) if not downside.empty else 0.0
    sortino_ratio = (annualized_return - RISK_FREE_RATE) / downside_dev if downside_dev else 0.0

    # Max drawdown: minimum percentage drop from prior equity peak.
    running_max = cumulative.cummax()
    drawdowns = cumulative / running_max - 1.0
    max_drawdown = float(drawdowns.min())

    # Calmar: CAGR divided by absolute max drawdown.
    calmar_ratio = annualized_return / abs(max_drawdown) if max_drawdown < 0 else 0.0

    beta = 0.0
    alpha = 0.0
    if len(portfolio_aligned) > 1 and len(benchmark_aligned) > 1 and benchmark_aligned.var(ddof=1) != 0:
        # Beta: covariance(portfolio, benchmark) / variance(benchmark).
        beta = float(portfolio_aligned.cov(benchmark_aligned) / benchmark_aligned.var(ddof=1))
        # Alpha: annualized portfolio return minus CAPM expected return.
        benchmark_total = (1.0 + benchmark_aligned).prod() - 1.0
        benchmark_years = max(len(benchmark_aligned) / TRADING_DAYS, 1 / TRADING_DAYS)
        benchmark_annual = (1.0 + benchmark_total) ** (1.0 / benchmark_years) - 1.0
        alpha = annualized_return - (RISK_FREE_RATE + beta * (benchmark_annual - RISK_FREE_RATE))

    # Win rate: positive-return observations divided by total observations.
    win_rate = (returns > 0).mean()

    # Historical VaR 95: 5th percentile daily return.
    var_95 = float(np.percentile(returns, 5))

    return {
        "total_return": float(total_return * 100),
        "annualized_return": float(annualized_return * 100),
        "sharpe_ratio": float(sharpe_ratio),
        "sortino_ratio": float(sortino_ratio),
        "max_drawdown": float(max_drawdown * 100),
        "calmar_ratio": float(calmar_ratio),
        "volatility_annual": float(volatility_annual * 100),
        "alpha": float(alpha * 100),
        "beta": float(beta),
        "win_rate": float(win_rate * 100),
        "best_day": float(returns.max() * 100),
        "worst_day": float(returns.min() * 100),
        "var_95": float(var_95 * 100),
    }

