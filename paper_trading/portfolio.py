from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class PaperPortfolio:
    name: str
    initial_cash: float
    portfolio_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: str = field(default_factory=utc_now_iso)
    holdings: dict[str, dict[str, float]] = field(default_factory=dict)
    cash_balance: float | None = None
    transactions: list[dict[str, Any]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.cash_balance is None:
            self.cash_balance = float(self.initial_cash)
        self.initial_cash = float(self.initial_cash)
        self.cash_balance = float(self.cash_balance)

    def buy(self, ticker: str, shares: float, price: float, date: str | None = None) -> dict[str, Any]:
        ticker = ticker.upper().strip()
        shares = float(shares)
        price = float(price)
        if shares <= 0:
            raise ValueError("Shares must be greater than zero.")
        if price <= 0:
            raise ValueError("Price must be greater than zero.")
        cost = shares * price
        if cost > self.cash_balance:
            raise ValueError(f"Insufficient cash. Required ${cost:,.2f}, available ${self.cash_balance:,.2f}.")

        current = self.holdings.get(ticker, {"shares": 0.0, "avg_cost": 0.0, "current_price": price})
        old_shares = float(current["shares"])
        new_shares = old_shares + shares
        avg_cost = ((old_shares * float(current["avg_cost"])) + cost) / new_shares

        self.cash_balance -= cost
        self.holdings[ticker] = {
            "shares": new_shares,
            "avg_cost": avg_cost,
            "current_price": price,
        }
        transaction = {
            "timestamp": utc_now_iso(),
            "date": date or utc_now_iso()[:10],
            "action": "buy",
            "ticker": ticker,
            "shares": shares,
            "price": price,
            "notional": cost,
        }
        self.transactions.append(transaction)
        return transaction

    def sell(self, ticker: str, shares: float, price: float, date: str | None = None) -> dict[str, Any]:
        ticker = ticker.upper().strip()
        shares = float(shares)
        price = float(price)
        if shares <= 0:
            raise ValueError("Shares must be greater than zero.")
        if price <= 0:
            raise ValueError("Price must be greater than zero.")
        if ticker not in self.holdings:
            raise ValueError(f"{ticker} is not currently held.")
        current = self.holdings[ticker]
        if shares > current["shares"]:
            raise ValueError(f"Cannot sell {shares:g} shares of {ticker}; only {current['shares']:g} available.")

        proceeds = shares * price
        self.cash_balance += proceeds
        current["shares"] -= shares
        current["current_price"] = price
        if current["shares"] <= 1e-9:
            del self.holdings[ticker]
        else:
            self.holdings[ticker] = current

        transaction = {
            "timestamp": utc_now_iso(),
            "date": date or utc_now_iso()[:10],
            "action": "sell",
            "ticker": ticker,
            "shares": shares,
            "price": price,
            "notional": proceeds,
        }
        self.transactions.append(transaction)
        return transaction

    def get_total_value(self, prices_dict: dict[str, float] | None = None) -> float:
        prices_dict = prices_dict or {}
        holdings_value = 0.0
        for ticker, holding in self.holdings.items():
            price = float(prices_dict.get(ticker, holding.get("current_price", holding["avg_cost"])))
            holdings_value += holding["shares"] * price
        return float(self.cash_balance + holdings_value)

    def get_portfolio_weights(self) -> dict[str, float]:
        total_value = self.get_total_value()
        if total_value <= 0:
            return {}
        return {
            ticker: (holding["shares"] * holding.get("current_price", holding["avg_cost"])) / total_value
            for ticker, holding in self.holdings.items()
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "portfolio_id": self.portfolio_id,
            "name": self.name,
            "initial_cash": self.initial_cash,
            "created_at": self.created_at,
            "holdings": self.holdings,
            "cash_balance": self.cash_balance,
            "transactions": self.transactions,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PaperPortfolio":
        return cls(
            portfolio_id=data["portfolio_id"],
            name=data["name"],
            initial_cash=float(data["initial_cash"]),
            created_at=data["created_at"],
            holdings=data.get("holdings", {}),
            cash_balance=float(data.get("cash_balance", data["initial_cash"])),
            transactions=data.get("transactions", []),
        )

