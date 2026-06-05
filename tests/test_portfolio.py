import math

import pytest

from paper_trading.portfolio import PaperPortfolio


def test_buy_updates_cash_shares_and_weighted_average_cost():
    portfolio = PaperPortfolio(name="Test Book", initial_cash=10_000)

    first_trade = portfolio.buy("aapl", 10, 100, "2026-01-02")
    portfolio.buy("AAPL", 10, 120, "2026-01-03")

    holding = portfolio.holdings["AAPL"]
    assert first_trade["ticker"] == "AAPL"
    assert portfolio.cash_balance == 7_800
    assert holding["shares"] == 20
    assert holding["avg_cost"] == 110
    assert holding["current_price"] == 120
    assert len(portfolio.transactions) == 2
    assert first_trade["realized_pnl"] == 0.0
    assert portfolio.cash_ledger[0]["type"] == "trade_buy"
    assert portfolio.cash_ledger[0]["amount"] == -1_000


def test_sell_updates_cash_and_removes_closed_position():
    portfolio = PaperPortfolio(name="Test Book", initial_cash=5_000)
    portfolio.buy("MSFT", 5, 100, "2026-01-02")

    transaction = portfolio.sell("MSFT", 2, 110, "2026-01-03")
    assert portfolio.cash_balance == 4_720
    assert portfolio.holdings["MSFT"]["shares"] == 3
    assert portfolio.holdings["MSFT"]["current_price"] == 110
    assert transaction["realized_pnl"] == 20
    assert portfolio.cash_ledger[-1]["type"] == "trade_sell"
    assert portfolio.cash_ledger[-1]["cash_balance_after"] == portfolio.cash_balance

    portfolio.sell("MSFT", 3, 90, "2026-01-04")
    assert portfolio.cash_balance == 4_990
    assert "MSFT" not in portfolio.holdings


def test_invalid_trades_raise_clear_errors():
    portfolio = PaperPortfolio(name="Test Book", initial_cash=1_000)

    with pytest.raises(ValueError, match="Insufficient cash"):
        portfolio.buy("NVDA", 100, 100, "2026-01-02")

    with pytest.raises(ValueError, match="not currently held"):
        portfolio.sell("AAPL", 1, 100, "2026-01-02")

    portfolio.buy("MSFT", 1, 100, "2026-01-03")
    with pytest.raises(ValueError, match="only 1 available"):
        portfolio.sell("MSFT", 2, 100, "2026-01-04")


def test_total_value_and_weights_use_latest_prices():
    portfolio = PaperPortfolio(name="Test Book", initial_cash=1_000)
    portfolio.buy("AAPL", 2, 100, "2026-01-02")
    portfolio.buy("MSFT", 4, 50, "2026-01-03")

    total_value = portfolio.get_total_value({"AAPL": 150, "MSFT": 25})
    weights = portfolio.get_portfolio_weights({"AAPL": 150, "MSFT": 25})

    assert total_value == 1_000
    assert math.isclose(weights["AAPL"], 0.3)
    assert math.isclose(weights["MSFT"], 0.1)
