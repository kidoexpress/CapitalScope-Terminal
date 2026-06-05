import math

import pandas as pd

from paper_trading.engine import PaperTradingEngine
from paper_trading.repository import JsonPortfolioRepository


def test_transaction_equity_curve_replays_cash_and_trades(monkeypatch, tmp_path):
    dates = pd.to_datetime(["2026-01-02", "2026-01-05", "2026-01-06"])
    prices = pd.DataFrame({"AAPL": [100.0, 110.0, 120.0]}, index=dates)

    def fake_prices(tickers, start, end):
        assert tickers == ["AAPL"]
        return prices

    def fake_benchmarks(start, end):
        return {
            "SPY": pd.Series([0.01, 0.01], index=dates[1:]),
            "QQQ": pd.Series([0.02, -0.01], index=dates[1:]),
            "BRK-B": pd.Series([0.0, 0.005], index=dates[1:]),
            "ARKK": pd.Series([-0.01, 0.03], index=dates[1:]),
        }

    monkeypatch.setattr("paper_trading.engine.get_historical_prices", fake_prices)
    monkeypatch.setattr("paper_trading.engine.get_benchmarks", fake_benchmarks)

    engine = PaperTradingEngine(repository=JsonPortfolioRepository(tmp_path / "state.json"))
    portfolio = engine.create_portfolio("Replay Book", 10_000)
    portfolio.buy("AAPL", 10, 100, "2026-01-02")
    portfolio.sell("AAPL", 5, 120, "2026-01-06")
    engine.save_state()

    report = engine.get_performance_report(portfolio.portfolio_id, "2026-01-02", "2026-01-07")
    curve = report["equity_curve"]

    assert curve[0]["portfolio_value"] == 100.0
    assert math.isclose(curve[1]["portfolio_value"], 101.0)
    assert math.isclose(curve[2]["portfolio_value"], 102.0)
    assert report["assumptions"]
    assert report["data_quality_notes"]


def test_cash_only_portfolio_gets_flat_equity_curve(monkeypatch, tmp_path):
    dates = pd.to_datetime(["2026-01-02", "2026-01-05"])

    def fake_benchmarks(start, end):
        return {"SPY": pd.Series([0.01], index=dates[1:])}

    monkeypatch.setattr("paper_trading.engine.get_benchmarks", fake_benchmarks)

    engine = PaperTradingEngine(repository=JsonPortfolioRepository(tmp_path / "state.json"))
    portfolio = engine.create_portfolio("Cash Book", 5_000)
    report = engine.get_performance_report(portfolio.portfolio_id, "2026-01-02", "2026-01-06")

    assert len(report["equity_curve"]) == 1
    assert report["equity_curve"][0]["portfolio_value"] == 100.0
    assert report["metrics"]["total_return"] == 0.0
