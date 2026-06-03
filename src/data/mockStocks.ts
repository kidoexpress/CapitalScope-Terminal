import type { StockQuote } from '../types';

// Static company metadata only. Current prices, market cap, volume, and charts
// must come from services/marketDataService.ts (Yahoo Finance).
export const STOCK_DATABASE: Record<string, Partial<StockQuote>> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', beta: 1.19, sector: 'Technology', industry: 'Consumer Electronics' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', beta: 0.9, sector: 'Technology', industry: 'Software' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', beta: 1.04, sector: 'Communication Services', industry: 'Internet Services' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', beta: 1.15, sector: 'Consumer Discretionary', industry: 'E-Commerce & Cloud' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', beta: 2.34, sector: 'Consumer Discretionary', industry: 'Electric Vehicles' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', beta: 1.68, sector: 'Technology', industry: 'Semiconductors' },
  META: { symbol: 'META', name: 'Meta Platforms', beta: 1.27, sector: 'Communication Services', industry: 'Social Media' },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', beta: 1.45, sector: 'Communication Services', industry: 'Streaming' },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase', beta: 1.12, sector: 'Financials', industry: 'Banking' },
  GS: { symbol: 'GS', name: 'Goldman Sachs', beta: 1.35, sector: 'Financials', industry: 'Investment Banking' },
  XOM: { symbol: 'XOM', name: 'Exxon Mobil Corp.', beta: 0.88, sector: 'Energy', industry: 'Oil & Gas' },
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', beta: 0.58, sector: 'Healthcare', industry: 'Pharmaceuticals' },
  KO: { symbol: 'KO', name: 'Coca-Cola Co.', beta: 0.58, sector: 'Consumer Staples', industry: 'Beverages' },
  BRK: { symbol: 'BRK.B', name: 'Berkshire Hathaway B', beta: 0.88, sector: 'Financials', industry: 'Diversified Holdings' },
  'BRK.B': { symbol: 'BRK.B', name: 'Berkshire Hathaway B', beta: 0.88, sector: 'Financials', industry: 'Diversified Holdings' },
  SPY: { symbol: 'SPY', name: 'S&P 500 ETF Trust', beta: 1, sector: 'ETF', industry: 'Index Fund' },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', beta: 1.72, sector: 'Technology', industry: 'Semiconductors' },
  INTC: { symbol: 'INTC', name: 'Intel Corporation', beta: 1.04, sector: 'Technology', industry: 'Semiconductors' },
  V: { symbol: 'V', name: 'Visa Inc.', beta: 0.94, sector: 'Financials', industry: 'Payment Processing' },
  DIS: { symbol: 'DIS', name: 'Walt Disney Co.', beta: 1.3, sector: 'Communication Services', industry: 'Entertainment' },
  PYPL: { symbol: 'PYPL', name: 'PayPal Holdings', beta: 1.42, sector: 'Financials', industry: 'Payments' },
  UBER: { symbol: 'UBER', name: 'Uber Technologies', beta: 1.36, sector: 'Technology', industry: 'Mobility' },
  SPOT: { symbol: 'SPOT', name: 'Spotify Technology', beta: 1.58, sector: 'Communication Services', industry: 'Streaming' },
  BABA: { symbol: 'BABA', name: 'Alibaba Group', beta: 0.39, sector: 'Consumer Discretionary', industry: 'E-Commerce' },
  TSM: { symbol: 'TSM', name: 'Taiwan Semiconductor', beta: 1.17, sector: 'Technology', industry: 'Semiconductors' },
  ASML: { symbol: 'ASML', name: 'ASML Holding', beta: 1.12, sector: 'Technology', industry: 'Semiconductor Equipment' },
  CRM: { symbol: 'CRM', name: 'Salesforce', beta: 1.28, sector: 'Technology', industry: 'Software' },
};

export const SECTOR_COLORS: Record<string, string> = {
  Technology: '#3b82f6',
  'Communication Services': '#8b5cf6',
  'Consumer Discretionary': '#f59e0b',
  'Consumer Staples': '#10b981',
  Financials: '#06b6d4',
  Healthcare: '#ec4899',
  Energy: '#f97316',
  Utilities: '#84cc16',
  'Real Estate': '#a78bfa',
  Industrials: '#64748b',
  Materials: '#78716c',
  ETF: '#94a3b8',
};

export const POPULAR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JPM', 'GS', 'XOM', 'JNJ', 'KO', 'AMD', 'INTC', 'V', 'BRK.B',
  'DIS', 'PYPL', 'UBER', 'SPOT', 'BABA', 'TSM', 'ASML', 'CRM',
];

export const DEFAULT_WATCHLIST: string[] = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN'];
