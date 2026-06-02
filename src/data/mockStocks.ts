import type { StockQuote } from '../types';

// Realistic stock data for major tickers
export const STOCK_DATABASE: Record<string, Partial<StockQuote>> = {
  AAPL: {
    symbol: 'AAPL', name: 'Apple Inc.', price: 189.30, change: 2.14, changePercent: 1.14,
    volume: 52_430_000, marketCap: 2_940_000_000_000, peRatio: 29.4,
    high52w: 199.62, low52w: 164.08, beta: 1.19, sector: 'Technology',
    industry: 'Consumer Electronics', eps: 6.44, dividendYield: 0.52,
    open: 187.60, dayHigh: 190.12, dayLow: 187.20, previousClose: 187.16,
  },
  MSFT: {
    symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.20, change: 4.80, changePercent: 1.17,
    volume: 18_200_000, marketCap: 3_090_000_000_000, peRatio: 36.2,
    high52w: 468.35, low52w: 362.90, beta: 0.90, sector: 'Technology',
    industry: 'Software', eps: 11.48, dividendYield: 0.72,
    open: 412.50, dayHigh: 416.80, dayLow: 411.90, previousClose: 410.40,
  },
  GOOGL: {
    symbol: 'GOOGL', name: 'Alphabet Inc.', price: 172.45, change: -1.23, changePercent: -0.71,
    volume: 22_100_000, marketCap: 2_150_000_000_000, peRatio: 24.8,
    high52w: 191.75, low52w: 129.40, beta: 1.04, sector: 'Communication Services',
    industry: 'Internet Services', eps: 6.96, dividendYield: 0,
    open: 173.80, dayHigh: 174.20, dayLow: 171.60, previousClose: 173.68,
  },
  AMZN: {
    symbol: 'AMZN', name: 'Amazon.com Inc.', price: 192.80, change: 3.40, changePercent: 1.80,
    volume: 35_600_000, marketCap: 2_040_000_000_000, peRatio: 61.2,
    high52w: 201.20, low52w: 153.52, beta: 1.15, sector: 'Consumer Discretionary',
    industry: 'E-Commerce & Cloud', eps: 3.15, dividendYield: 0,
    open: 190.20, dayHigh: 193.50, dayLow: 189.80, previousClose: 189.40,
  },
  TSLA: {
    symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.20, changePercent: -2.05,
    volume: 98_400_000, marketCap: 794_000_000_000, peRatio: 78.4,
    high52w: 299.29, low52w: 138.80, beta: 2.34, sector: 'Consumer Discretionary',
    industry: 'Electric Vehicles', eps: 3.17, dividendYield: 0,
    open: 252.00, dayHigh: 254.60, dayLow: 246.20, previousClose: 253.70,
  },
  NVDA: {
    symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 22.30, changePercent: 2.62,
    volume: 42_800_000, marketCap: 2_160_000_000_000, peRatio: 72.8,
    high52w: 974.00, low52w: 393.78, beta: 1.68, sector: 'Technology',
    industry: 'Semiconductors', eps: 12.02, dividendYield: 0.03,
    open: 858.00, dayHigh: 880.20, dayLow: 856.40, previousClose: 853.10,
  },
  META: {
    symbol: 'META', name: 'Meta Platforms', price: 528.70, change: 8.40, changePercent: 1.62,
    volume: 15_300_000, marketCap: 1_360_000_000_000, peRatio: 28.2,
    high52w: 589.27, low52w: 392.40, beta: 1.27, sector: 'Communication Services',
    industry: 'Social Media', eps: 18.75, dividendYield: 0.38,
    open: 522.00, dayHigh: 530.80, dayLow: 521.40, previousClose: 520.30,
  },
  NFLX: {
    symbol: 'NFLX', name: 'Netflix Inc.', price: 692.40, change: 12.60, changePercent: 1.85,
    volume: 6_200_000, marketCap: 299_000_000_000, peRatio: 49.6,
    high52w: 736.00, low52w: 534.91, beta: 1.45, sector: 'Communication Services',
    industry: 'Streaming', eps: 13.95, dividendYield: 0,
    open: 682.00, dayHigh: 695.80, dayLow: 680.40, previousClose: 679.80,
  },
  JPM: {
    symbol: 'JPM', name: 'JPMorgan Chase', price: 198.60, change: 1.20, changePercent: 0.61,
    volume: 9_800_000, marketCap: 573_000_000_000, peRatio: 12.1,
    high52w: 220.82, low52w: 155.67, beta: 1.12, sector: 'Financials',
    industry: 'Banking', eps: 16.42, dividendYield: 2.32,
    open: 197.80, dayHigh: 199.40, dayLow: 197.20, previousClose: 197.40,
  },
  GS: {
    symbol: 'GS', name: 'Goldman Sachs', price: 448.20, change: 3.60, changePercent: 0.81,
    volume: 2_100_000, marketCap: 146_000_000_000, peRatio: 15.8,
    high52w: 521.22, low52w: 376.49, beta: 1.35, sector: 'Financials',
    industry: 'Investment Banking', eps: 28.36, dividendYield: 2.24,
    open: 445.60, dayHigh: 449.80, dayLow: 444.90, previousClose: 444.60,
  },
  XOM: {
    symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 112.40, change: -0.80, changePercent: -0.71,
    volume: 16_400_000, marketCap: 450_000_000_000, peRatio: 13.8,
    high52w: 123.75, low52w: 95.77, beta: 0.88, sector: 'Energy',
    industry: 'Oil & Gas', eps: 8.14, dividendYield: 3.36,
    open: 113.20, dayHigh: 113.60, dayLow: 112.00, previousClose: 113.20,
  },
  JNJ: {
    symbol: 'JNJ', name: 'Johnson & Johnson', price: 152.30, change: 0.50, changePercent: 0.33,
    volume: 7_200_000, marketCap: 367_000_000_000, peRatio: 16.4,
    high52w: 168.85, low52w: 142.52, beta: 0.58, sector: 'Healthcare',
    industry: 'Pharmaceuticals', eps: 9.28, dividendYield: 3.04,
    open: 151.90, dayHigh: 152.80, dayLow: 151.60, previousClose: 151.80,
  },
  KO: {
    symbol: 'KO', name: 'Coca-Cola Co.', price: 62.40, change: 0.20, changePercent: 0.32,
    volume: 14_600_000, marketCap: 269_000_000_000, peRatio: 22.6,
    high52w: 66.34, low52w: 56.00, beta: 0.58, sector: 'Consumer Staples',
    industry: 'Beverages', eps: 2.76, dividendYield: 3.14,
    open: 62.20, dayHigh: 62.60, dayLow: 62.00, previousClose: 62.20,
  },
  BRK: {
    symbol: 'BRK.B', name: 'Berkshire Hathaway B', price: 398.40, change: 1.80, changePercent: 0.45,
    volume: 4_200_000, marketCap: 868_000_000_000, peRatio: 21.2,
    high52w: 425.31, low52w: 339.39, beta: 0.88, sector: 'Financials',
    industry: 'Diversified Holdings', eps: 18.78, dividendYield: 0,
    open: 397.00, dayHigh: 399.20, dayLow: 396.60, previousClose: 396.60,
  },
  SPY: {
    symbol: 'SPY', name: 'S&P 500 ETF Trust', price: 524.80, change: 4.20, changePercent: 0.81,
    volume: 68_000_000, marketCap: 490_000_000_000, peRatio: 22.8,
    high52w: 565.16, low52w: 434.84, beta: 1.00, sector: 'ETF',
    industry: 'Index Fund', eps: 23.00, dividendYield: 1.28,
    open: 521.80, dayHigh: 525.40, dayLow: 521.40, previousClose: 520.60,
  },
  AMD: {
    symbol: 'AMD', name: 'Advanced Micro Devices', price: 168.20, change: 5.40, changePercent: 3.32,
    volume: 38_200_000, marketCap: 272_000_000_000, peRatio: 44.2,
    high52w: 227.30, low52w: 144.07, beta: 1.72, sector: 'Technology',
    industry: 'Semiconductors', eps: 3.80, dividendYield: 0,
    open: 163.80, dayHigh: 169.60, dayLow: 163.40, previousClose: 162.80,
  },
  INTC: {
    symbol: 'INTC', name: 'Intel Corporation', price: 31.20, change: -0.40, changePercent: -1.27,
    volume: 42_600_000, marketCap: 132_000_000_000, peRatio: 24.8,
    high52w: 51.28, low52w: 18.84, beta: 1.04, sector: 'Technology',
    industry: 'Semiconductors', eps: 1.26, dividendYield: 2.31,
    open: 31.60, dayHigh: 31.80, dayLow: 30.90, previousClose: 31.60,
  },
  V: {
    symbol: 'V', name: 'Visa Inc.', price: 278.40, change: 2.10, changePercent: 0.76,
    volume: 6_800_000, marketCap: 572_000_000_000, peRatio: 30.2,
    high52w: 290.96, low52w: 230.29, beta: 0.94, sector: 'Financials',
    industry: 'Payment Processing', eps: 9.22, dividendYield: 0.76,
    open: 276.80, dayHigh: 279.20, dayLow: 276.40, previousClose: 276.30,
  },
};

// Sector colors
export const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Communication Services': '#8b5cf6',
  'Consumer Discretionary': '#f59e0b',
  'Consumer Staples': '#10b981',
  'Financials': '#06b6d4',
  'Healthcare': '#ec4899',
  'Energy': '#f97316',
  'Utilities': '#84cc16',
  'Real Estate': '#a78bfa',
  'Industrials': '#64748b',
  'Materials': '#78716c',
  'ETF': '#94a3b8',
};

// Popular tickers for autocomplete
export const POPULAR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JPM', 'GS', 'XOM', 'JNJ', 'KO', 'AMD', 'INTC', 'V', 'BRK.B',
  'DIS', 'PYPL', 'UBER', 'SPOT', 'BABA', 'TSM', 'ASML', 'CRM',
];

// Generate realistic price history using GBM
export function generatePriceHistory(
  ticker: string,
  days: number = 252,
  startPrice?: number
): { date: string; close: number; open: number; high: number; low: number; volume: number }[] {
  const stock = STOCK_DATABASE[ticker];
  const currentPrice = startPrice || stock?.price || 100;
  const beta = stock?.beta || 1.0;

  // Annual params → daily
  const annualReturn = 0.08 + (beta - 1) * 0.05;
  const annualVol = 0.15 + Math.abs(beta - 1) * 0.12;
  const dt = 1 / 252;
  const mu = (annualReturn - 0.5 * annualVol * annualVol) * dt;
  const sigma = annualVol * Math.sqrt(dt);

  // Seed with ticker hash for determinism
  let seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const u1 = (seed >>> 0) / 0xffffffff;
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const u2 = (seed >>> 0) / 0xffffffff;
    return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  };

  // Work backwards from current price
  const result = [];
  const today = new Date();
  let price = currentPrice;
  const prices = [price];

  for (let i = 1; i <= days; i++) {
    price = price / Math.exp(mu + sigma * rng());
    prices.unshift(price);
  }

  // Forward pass to create OHLC
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - i - 1));
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const close = prices[i + 1];
    const open = prices[i] * (1 + (rng() * 0.008));
    const dayVol = annualVol / Math.sqrt(252) * close;
    const high = Math.max(open, close) + Math.abs(rng()) * dayVol * 0.5;
    const low = Math.min(open, close) - Math.abs(rng()) * dayVol * 0.5;
    const volume = Math.round((stock?.avgVolume || 10_000_000) * (0.7 + Math.abs(rng()) * 0.6));

    result.push({
      date: d.toISOString().split('T')[0],
      close: Math.max(0.01, close),
      open: Math.max(0.01, open),
      high: Math.max(0.01, high),
      low: Math.max(0.01, low),
      volume,
    });
  }

  return result;
}

// Sparkline data (20 points)
export function generateSparkline(ticker: string, currentPrice: number): number[] {
  const history = generatePriceHistory(ticker, 30, currentPrice);
  return history.slice(-20).map(p => p.close);
}

// Default watchlist
export const DEFAULT_WATCHLIST: string[] = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN'];

// Market indices for ticker bar
export const MARKET_INDICES = [
  { symbol: 'S&P 500', price: 5248.80, change: 0.81 },
  { symbol: 'NASDAQ', price: 16420.40, change: 1.14 },
  { symbol: 'DOW', price: 39120.60, change: 0.52 },
  { symbol: 'VIX', price: 14.82, change: -3.20 },
  { symbol: 'BTC/USD', price: 67840.00, change: 2.40 },
  { symbol: 'ETH/USD', price: 3620.40, change: 1.80 },
  { symbol: 'GOLD', price: 2340.80, change: 0.42 },
  { symbol: 'OIL', price: 78.40, change: -0.62 },
  { symbol: '10Y YIELD', price: 4.28, change: 0.08 },
  { symbol: 'DXY', price: 104.82, change: -0.22 },
  { symbol: 'EUR/USD', price: 1.0842, change: 0.18 },
];
