import type { StockQuote, PricePoint, TimeRange } from '../types';
import { STOCK_DATABASE, generatePriceHistory } from '../data/mockStocks';

const RANGE_MAP: Record<TimeRange, { range: string; interval: string; days: number }> = {
  '1D': { range: '1d', interval: '5m', days: 1 },
  '5D': { range: '5d', interval: '60m', days: 5 },
  '1M': { range: '1mo', interval: '1d', days: 21 },
  '3M': { range: '3mo', interval: '1d', days: 63 },
  '6M': { range: '6mo', interval: '1d', days: 126 },
  '1Y': { range: '1y', interval: '1d', days: 252 },
  '3Y': { range: '3y', interval: '1wk', days: 756 },
  '5Y': { range: '5y', interval: '1wk', days: 1260 },
};

/** Fetch real quote from Yahoo Finance via Vite proxy */
async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `/api/yahoo/v7/finance/quote?symbols=${symbol}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,averageVolume,beta,shortName,longName,sector,industry,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,epsTrailingTwelveMonths,dividendYield`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const q = json?.quoteResponse?.result?.[0];
    if (!q) return null;

    return {
      symbol: q.symbol,
      name: q.longName || q.shortName || symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume,
      marketCap: q.marketCap || 0,
      peRatio: q.trailingPE || 0,
      high52w: q.fiftyTwoWeekHigh || 0,
      low52w: q.fiftyTwoWeekLow || 0,
      avgVolume: q.averageVolume || 0,
      beta: q.beta || 1,
      sector: q.sector || 'Technology',
      industry: q.industry || '',
      previousClose: q.regularMarketPreviousClose || 0,
      open: q.regularMarketOpen || 0,
      dayHigh: q.regularMarketDayHigh || 0,
      dayLow: q.regularMarketDayLow || 0,
      eps: q.epsTrailingTwelveMonths || 0,
      dividendYield: (q.dividendYield || 0) * 100,
    };
  } catch {
    return null;
  }
}

/** Fetch real historical data from Yahoo Finance */
async function fetchYahooHistory(symbol: string, timeRange: TimeRange): Promise<PricePoint[] | null> {
  try {
    const { range, interval } = RANGE_MAP[timeRange];
    const res = await fetch(
      `/api/yahoo/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp;
    const ohlcv = result.indicators?.quote?.[0];
    if (!timestamps || !ohlcv) return null;

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      close: ohlcv.close?.[i] ?? 0,
      open: ohlcv.open?.[i] ?? 0,
      high: ohlcv.high?.[i] ?? 0,
      low: ohlcv.low?.[i] ?? 0,
      volume: ohlcv.volume?.[i] ?? 0,
    })).filter(p => p.close > 0);
  } catch {
    return null;
  }
}

/** Get stock quote — tries live API, falls back to mock */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  // Try live API first
  const live = await fetchYahooQuote(symbol.toUpperCase());
  if (live) return live;

  // Fall back to mock data
  const mock = STOCK_DATABASE[symbol.toUpperCase()];
  if (mock) {
    // Add small random jitter to simulate live data
    const jitter = (Math.random() - 0.5) * 0.004;
    return {
      ...mock,
      price: mock.price! * (1 + jitter),
      change: mock.change! + jitter * mock.price!,
      changePercent: mock.changePercent! + jitter * 100,
    } as StockQuote;
  }

  return null;
}

/** Get price history — tries live API, falls back to mock generator */
export async function getStockHistory(
  symbol: string,
  timeRange: TimeRange,
  currentPrice?: number
): Promise<PricePoint[]> {
  // Try live API first
  const live = await fetchYahooHistory(symbol.toUpperCase(), timeRange);
  if (live && live.length > 5) return live;

  // Generate mock data
  const days = RANGE_MAP[timeRange].days;
  const mockQuote = STOCK_DATABASE[symbol.toUpperCase()];
  const price = currentPrice || mockQuote?.price || 100;
  return generatePriceHistory(symbol.toUpperCase(), days, price);
}

/** Get multiple quotes at once */
export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, StockQuote | null>> {
  const results: Record<string, StockQuote | null> = {};
  // Batch fetch
  await Promise.all(symbols.map(async (sym) => {
    results[sym] = await getStockQuote(sym);
  }));
  return results;
}

/** Simulate live price update (small random walk from last price) */
export function simulateLivePrice(currentPrice: number, volatility: number = 0.002): number {
  const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
  return Math.max(0.01, currentPrice + change);
}

/** Search stocks by keyword */
export function searchStocks(query: string): Array<{ symbol: string; name: string; sector: string }> {
  const q = query.toLowerCase();
  return Object.values(STOCK_DATABASE)
    .filter(s =>
      s.symbol?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.sector?.toLowerCase().includes(q)
    )
    .map(s => ({ symbol: s.symbol!, name: s.name!, sector: s.sector! }))
    .slice(0, 8);
}
