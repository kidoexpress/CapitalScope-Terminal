# CapitalScope Terminal

A quantitative stock analysis platform supporting 7 global markets with AI-powered research agents, paper trading simulation, and real-time price data.

## Features

- **Multi-market**: US (NYSE/NASDAQ), Brasil (B3), UK (LSE), Germany (XETRA), France (Euronext), Japan (TSE), Hong Kong (HKEX)
- **Stock Analyzer**: Real-time prices via Yahoo Finance, technical metrics, AI insights
- **Portfolio Builder**: Holdings manager with real historical performance vs benchmark
- **Risk Dashboard**: VaR, correlation matrix (1Y historical), sector exposure
- **Monte Carlo**: GBM simulation with fan chart and percentile bands
- **Scenario Simulator**: Macro stress tests (rate hike, recession, oil shock, etc.)
- **Paper Trading**: Virtual portfolios with real yfinance prices, Sharpe/Alpha/MDD metrics
- **Gold Mining Scanner**: AI-powered stock discovery with live fundamentals
- **AI Research Agents**: Earnings Reviewer, Market Research, Model Builder (Claude API)
- **Watchlist**: Live price tracking with sparklines and market sentiment

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| State | Zustand (with localStorage persistence) |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| Data | yfinance (Yahoo Finance) |
| AI | Anthropic Claude (claude-opus-4-5) |

## Setup

### Prerequisites

- Node.js 20+
- Python 3.10+
- An Anthropic API key (optional — AI agents work in demo mode without it)

### 1. Clone and install

```bash
git clone https://github.com/kidoexpress/CapitalScope-Terminal.git
cd CapitalScope-Terminal
npm install
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and add your keys
```

Required:
- `VITE_ANTHROPIC_API_KEY` — for live AI analysis (Gold Scanner, Deep Dive, Earnings Reviewer, Market Research, Model Builder). Without this, all AI agents run in demo mode with clearly labeled mock data.

Optional:
- `VITE_FMP_API_KEY` — Financial Modeling Prep for analyst ratings
- `VITE_FINNHUB_API_KEY` — Finnhub for news sentiment

### 3. Run (both servers must run simultaneously)

**Terminal 1 — Backend (FastAPI)**

```bash
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend (Vite)**

```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for production

```bash
npm run build
uvicorn main:app --port 8000
# Serve the dist/ folder with any static host or nginx
```

Note: In production, Yahoo Finance data routes through the FastAPI backend proxy (`/api/yahoo/*`). No Vite dev server is needed.

## Architecture

```
CapitalScope-Terminal/
├── src/
│   ├── config/markets.ts       # 7 market definitions (suffix, currency, benchmark)
│   ├── pages/                  # 14 page components
│   ├── components/             # Reusable UI components
│   ├── services/               # API clients (paperTradingApi, claudeService, etc.)
│   ├── store/                  # Zustand stores (portfolioStore, paperTradingStore)
│   ├── utils/                  # Helpers (finance, api, priceHistory, marketHours)
│   └── data/                   # Static data (mockStocks, financialData)
├── paper_trading/
│   ├── engine.py               # PaperTradingEngine — backtest + metrics
│   ├── portfolio.py            # PaperPortfolio — buy/sell/holdings
│   ├── metrics.py              # Quantitative metrics from scratch (Sharpe, MDD, Alpha...)
│   ├── data_feed.py            # yfinance + 1h local cache
│   ├── benchmarks.py           # SPY, QQQ, BOVA11, FTSE100, DAX returns
│   ├── routes.py               # FastAPI endpoints
│   └── proxy.py                # Yahoo Finance production proxy
└── main.py                     # FastAPI app entry point
```

## Paper Trading API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/portfolio/create` | Create virtual portfolio |
| GET | `/api/portfolio/list` | List all portfolios |
| GET | `/api/portfolio/{id}` | Get portfolio snapshot with live P&L |
| POST | `/api/portfolio/{id}/trade` | Execute buy or sell |
| GET | `/api/portfolio/{id}/metrics` | Performance report (Sharpe, Alpha, MDD...) |
| GET | `/api/portfolio/{id}/equity-curve` | Equity curve vs benchmarks |
| GET | `/api/portfolio/fx-rate` | FX conversion rates |
| GET | `/api/portfolio/fundamentals/{ticker}` | Live fundamentals via yfinance |
| DELETE | `/api/portfolio/{id}` | Delete portfolio |
| GET | `/api/yahoo/{path}` | Yahoo Finance proxy (production) |

## Educational disclaimer

All analysis, metrics, and AI-generated content are for educational purposes only. Not financial advice. Verify all data independently before making investment decisions.
