# CapitalScope Terminal

CapitalScope Terminal is an AI-powered investment research and paper trading platform. It combines stock analysis, watchlists, portfolio construction, scenario simulation, risk intelligence, Monte Carlo forecasting, agent-style research workflows, and a virtual paper trading engine.

All outputs are educational analysis only. CapitalScope does not execute trades, does not provide personalized financial advice, and does not guarantee returns.

## Product Modules

- Landing page with market/research positioning
- Stock Analyzer with quote, chart, benchmark, and risk metrics
- Watchlist with market monitoring and contextual stock insight
- Portfolio Builder and Risk Intelligence for allocation, exposure, drawdown, VaR, and correlation review
- Monte Carlo Forecast Lab for probability cones, distributions, and downside ranges
- Scenario Simulator for macro shock analysis
- AI agent workflows: Earnings Reviewer, Market Research Agent, Model Builder, Scenario Analyst, Portfolio Analyst
- Gold Mining Scanner and Stock Research surfaces
- Paper Trading for virtual portfolios, simulated trades, holdings, equity curves, and benchmark comparison
- Terminal commands for fast ticker and workflow access

## Architecture

Frontend:

- React + TypeScript + Vite
- Tailwind CSS tokens and shared product UI primitives
- Recharts for visualization
- Zustand for paper trading state
- Lazy-loaded app routes to reduce initial bundle cost

Backend:

- FastAPI
- `paper_trading/` quantitative engine
- Yahoo Finance via `yfinance`
- SQLite persistence for current paper trading state, with JSON fallback/import
- Deterministic backend tests for core metrics and virtual portfolio accounting

Important backend files:

- `paper_trading/portfolio.py` virtual holdings, cash, and transaction logic
- `paper_trading/metrics.py` total return, CAGR, volatility, Sharpe, Sortino, drawdown, Calmar, alpha, beta, win rate, VaR
- `paper_trading/data_feed.py` Yahoo Finance historical and latest price access with local cache
- `paper_trading/market_data.py` normalized backend market data wrapper
- `paper_trading/benchmarks.py` benchmark return series
- `paper_trading/engine.py` portfolio management, persistence, reports, and equity curves
- `paper_trading/repository.py` SQLite and JSON persistence repositories
- `paper_trading/routes.py` FastAPI routes under `/api/portfolio`

## Market Data

Yahoo Finance is the primary market data source for the current build. Prices and fundamentals may be delayed, incomplete, rate-limited, or unavailable depending on Yahoo Finance behavior. The app should label unavailable or synthetic data clearly and should not silently present mock values as live market data.

Frontend market data is centralized through `src/services/marketDataService.ts`. Paper Trading uses the backend `paper_trading/data_feed.py` wrapper around `yfinance`.

## Local Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Run the frontend:

```bash
npm run dev
```

Run the backend:

```bash
python3 -m uvicorn main:app --reload --port 8000
```

Open the app at the Vite localhost URL, usually:

```text
http://127.0.0.1:5174/
```

## Environment Variables

No API key is required for Yahoo Finance. If future providers are added, store provider keys in `.env` files only and do not hardcode secrets.

Common frontend variable:

```bash
VITE_PAPER_TRADING_API_URL=http://127.0.0.1:8000/api
```

If unset, the frontend defaults to the local FastAPI backend URL.

## Paper Trading

Paper Trading is simulation-only. It supports:

- Portfolio creation with initial cash
- Virtual buy/sell transactions
- Cash balance tracking
- Cash ledger tracking
- Realized and unrealized P&L
- Current holdings from Yahoo Finance prices
- P&L, weights, total value, and benchmark-relative reports
- Equity curves compared with SPY, QQQ, BRK-B, and ARKK
- Transaction-based equity curve replay

State is currently persisted to SQLite:

```text
paper_trading/paper_trading.db
```

JSON remains available as a fallback/import path:

```text
paper_trading/portfolios_state.json
```

Migration behavior:

1. SQLite schema is created automatically on startup.
2. If SQLite is empty and `portfolios_state.json` exists, the backend imports JSON portfolios.
3. Imported portfolios are saved into SQLite.
4. JSON is not deleted automatically.

SQLite schema:

- `portfolios`
- `holdings`
- `transactions`
- `cash_ledger`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture.

## Testing

Run frontend build:

```bash
npm run build
```

Compile backend:

```bash
python3 -m compileall paper_trading main.py
```

Run backend tests:

```bash
python3 -m pytest
```

CI runs the frontend build, backend compile check, and backend unit tests. Network-dependent Yahoo Finance calls should not be used in CI tests; use deterministic fixtures or monkeypatching for future API tests.

## Financial Logic Covered By Tests

Current deterministic backend tests cover:

- empty return handling
- total return
- volatility
- max drawdown
- VaR 95
- beta
- alpha sanity when portfolio equals benchmark
- buy accounting
- sell accounting
- realized P&L
- cash ledger
- insufficient cash and oversell errors
- latest-price portfolio value and weights
- SQLite persistence
- transaction-based equity curve replay
- cash-only equity reports

## Known Limitations

- Yahoo Finance can rate-limit or return incomplete data.
- Paper Trading equity curves replay simulated transactions, but live broker-grade tax lots, dividends, splits beyond Yahoo adjustments, and fees are not yet modeled.
- SQLite is suitable for local development and demos; production deployments should consider Postgres plus migrations.
- AI-style memos are structured educational research summaries and require human review.
- The app does not execute trades and should not be used as a broker.

## Roadmap

- API smoke tests with mocked market data
- More consistent data-source labels across every market-data surface
- Deeper agent output validation with explicit assumptions, confidence levels, and citations/source notes
- More aggressive route and chart bundle splitting
- Broader UI rollout of the shared product component system

## Disclaimer

Educational analysis only. Not financial advice. Verify all data independently before making investment decisions. CapitalScope Terminal does not execute trades, does not provide personalized investment recommendations, and does not guarantee returns.
