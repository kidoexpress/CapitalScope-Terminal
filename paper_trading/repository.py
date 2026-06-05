from __future__ import annotations

import json
import sqlite3
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Iterable

from .portfolio import PaperPortfolio


STATE_PATH = Path(__file__).resolve().parent / "portfolios_state.json"
DB_PATH = Path(__file__).resolve().parent / "paper_trading.db"


class PortfolioRepository(ABC):
    @abstractmethod
    def load(self) -> dict[str, PaperPortfolio]:
        raise NotImplementedError

    @abstractmethod
    def save(self, portfolios: Iterable[PaperPortfolio]) -> None:
        raise NotImplementedError


class JsonPortfolioRepository(PortfolioRepository):
    def __init__(self, state_path: Path = STATE_PATH) -> None:
        self.state_path = state_path

    def load(self) -> dict[str, PaperPortfolio]:
        if not self.state_path.exists():
            return {}
        data = json.loads(self.state_path.read_text())
        return {
            item["portfolio_id"]: PaperPortfolio.from_dict(item)
            for item in data.get("portfolios", [])
        }

    def save(self, portfolios: Iterable[PaperPortfolio]) -> None:
        self.state_path.write_text(json.dumps({
            "portfolios": [portfolio.to_dict() for portfolio in portfolios]
        }, indent=2))


class SQLitePortfolioRepository(PortfolioRepository):
    def __init__(
        self,
        db_path: Path = DB_PATH,
        fallback: PortfolioRepository | None = None,
    ) -> None:
        self.db_path = db_path
        self.fallback = fallback
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _init_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS portfolios (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    initial_cash REAL NOT NULL,
                    cash_balance REAL NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS holdings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    portfolio_id TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    shares REAL NOT NULL,
                    avg_cost REAL NOT NULL,
                    current_price REAL NOT NULL,
                    UNIQUE(portfolio_id, ticker),
                    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    portfolio_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL,
                    action TEXT NOT NULL,
                    ticker TEXT NOT NULL,
                    shares REAL NOT NULL,
                    price REAL NOT NULL,
                    notional REAL NOT NULL,
                    realized_pnl REAL NOT NULL DEFAULT 0,
                    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS cash_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    portfolio_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL,
                    type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    cash_balance_after REAL NOT NULL,
                    description TEXT NOT NULL,
                    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
                );
                """
            )

    def _is_empty(self) -> bool:
        with self._connect() as connection:
            row = connection.execute("SELECT COUNT(*) AS count FROM portfolios").fetchone()
            return int(row["count"]) == 0

    def load(self) -> dict[str, PaperPortfolio]:
        if self.fallback and self._is_empty():
            migrated = self.fallback.load()
            if migrated:
                self.save(migrated.values())
                return migrated

        with self._connect() as connection:
            portfolio_rows = connection.execute("SELECT * FROM portfolios").fetchall()
            holdings_rows = connection.execute("SELECT * FROM holdings ORDER BY ticker").fetchall()
            transaction_rows = connection.execute("SELECT * FROM transactions ORDER BY timestamp, id").fetchall()
            ledger_rows = connection.execute("SELECT * FROM cash_ledger ORDER BY timestamp, id").fetchall()

        holdings_by_portfolio: dict[str, dict[str, dict[str, float]]] = {}
        for row in holdings_rows:
            holdings_by_portfolio.setdefault(row["portfolio_id"], {})[row["ticker"]] = {
                "shares": float(row["shares"]),
                "avg_cost": float(row["avg_cost"]),
                "current_price": float(row["current_price"]),
            }

        transactions_by_portfolio: dict[str, list[dict]] = {}
        for row in transaction_rows:
            transactions_by_portfolio.setdefault(row["portfolio_id"], []).append({
                "timestamp": row["timestamp"],
                "date": row["date"],
                "action": row["action"],
                "ticker": row["ticker"],
                "shares": float(row["shares"]),
                "price": float(row["price"]),
                "notional": float(row["notional"]),
                "realized_pnl": float(row["realized_pnl"]),
            })

        ledger_by_portfolio: dict[str, list[dict]] = {}
        for row in ledger_rows:
            ledger_by_portfolio.setdefault(row["portfolio_id"], []).append({
                "timestamp": row["timestamp"],
                "date": row["date"],
                "type": row["type"],
                "amount": float(row["amount"]),
                "cash_balance_after": float(row["cash_balance_after"]),
                "description": row["description"],
            })

        portfolios: dict[str, PaperPortfolio] = {}
        for row in portfolio_rows:
            portfolio = PaperPortfolio(
                portfolio_id=row["id"],
                name=row["name"],
                initial_cash=float(row["initial_cash"]),
                cash_balance=float(row["cash_balance"]),
                created_at=row["created_at"],
                holdings=holdings_by_portfolio.get(row["id"], {}),
                transactions=transactions_by_portfolio.get(row["id"], []),
                cash_ledger=ledger_by_portfolio.get(row["id"], []),
            )
            portfolios[portfolio.portfolio_id] = portfolio
        return portfolios

    def save(self, portfolios: Iterable[PaperPortfolio]) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM cash_ledger")
            connection.execute("DELETE FROM transactions")
            connection.execute("DELETE FROM holdings")
            connection.execute("DELETE FROM portfolios")
            for portfolio in portfolios:
                connection.execute(
                    """
                    INSERT INTO portfolios (id, name, initial_cash, cash_balance, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        portfolio.portfolio_id,
                        portfolio.name,
                        float(portfolio.initial_cash),
                        float(portfolio.cash_balance),
                        portfolio.created_at,
                    ),
                )
                for ticker, holding in portfolio.holdings.items():
                    connection.execute(
                        """
                        INSERT INTO holdings (portfolio_id, ticker, shares, avg_cost, current_price)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            portfolio.portfolio_id,
                            ticker,
                            float(holding["shares"]),
                            float(holding["avg_cost"]),
                            float(holding.get("current_price", holding["avg_cost"])),
                        ),
                    )
                for transaction in portfolio.transactions:
                    connection.execute(
                        """
                        INSERT INTO transactions (
                            portfolio_id, timestamp, date, action, ticker,
                            shares, price, notional, realized_pnl
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            portfolio.portfolio_id,
                            transaction["timestamp"],
                            transaction["date"],
                            transaction["action"],
                            transaction["ticker"],
                            float(transaction["shares"]),
                            float(transaction["price"]),
                            float(transaction["notional"]),
                            float(transaction.get("realized_pnl", 0.0)),
                        ),
                    )
                for entry in portfolio.cash_ledger:
                    connection.execute(
                        """
                        INSERT INTO cash_ledger (
                            portfolio_id, timestamp, date, type, amount,
                            cash_balance_after, description
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            portfolio.portfolio_id,
                            entry["timestamp"],
                            entry["date"],
                            entry["type"],
                            float(entry["amount"]),
                            float(entry["cash_balance_after"]),
                            entry["description"],
                        ),
                    )
