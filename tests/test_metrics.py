import math

import numpy as np
import pandas as pd

from paper_trading.metrics import calculate_metrics


def test_empty_returns_are_safe_zeroes():
    metrics = calculate_metrics(pd.Series(dtype=float))

    assert metrics == {
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


def test_core_metric_formulas_match_deterministic_series():
    returns = pd.Series([0.10, -0.05, 0.02, -0.01])
    benchmark = pd.Series([0.08, -0.04, 0.01, -0.01])

    metrics = calculate_metrics(returns, benchmark)
    cumulative = (1.0 + returns).cumprod()
    expected_total_return = (cumulative.iloc[-1] - 1.0) * 100
    expected_max_drawdown = ((cumulative / cumulative.cummax()) - 1.0).min() * 100
    expected_volatility = returns.std(ddof=1) * np.sqrt(252) * 100
    expected_var_95 = np.percentile(returns, 5) * 100

    assert math.isclose(metrics["total_return"], expected_total_return, rel_tol=1e-12)
    assert math.isclose(metrics["max_drawdown"], expected_max_drawdown, rel_tol=1e-12)
    assert math.isclose(metrics["volatility_annual"], expected_volatility, rel_tol=1e-12)
    assert math.isclose(metrics["var_95"], expected_var_95, rel_tol=1e-12)
    assert metrics["win_rate"] == 50.0
    assert metrics["best_day"] == 10.0
    assert metrics["worst_day"] == -5.0


def test_beta_is_one_when_portfolio_matches_benchmark():
    returns = pd.Series([0.01, -0.02, 0.015, 0.005, -0.01])

    metrics = calculate_metrics(returns, returns)

    assert math.isclose(metrics["beta"], 1.0, rel_tol=1e-12)
    assert abs(metrics["alpha"]) < 1e-9
