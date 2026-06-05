from paper_trading.portfolio import PaperPortfolio
from paper_trading.repository import SQLitePortfolioRepository


def test_sqlite_repository_persists_portfolio_transactions_and_cash_ledger(tmp_path):
    repository = SQLitePortfolioRepository(tmp_path / "paper.db")
    portfolio = PaperPortfolio(name="SQLite Book", initial_cash=10_000)
    portfolio.buy("AAPL", 10, 100, "2026-01-02")
    portfolio.sell("AAPL", 5, 110, "2026-01-03")

    repository.save([portfolio])
    loaded = repository.load()[portfolio.portfolio_id]

    assert loaded.name == "SQLite Book"
    assert loaded.cash_balance == 9_550
    assert loaded.holdings["AAPL"]["shares"] == 5
    assert loaded.transactions[-1]["realized_pnl"] == 50
    assert loaded.cash_ledger[-1]["cash_balance_after"] == 9_550
