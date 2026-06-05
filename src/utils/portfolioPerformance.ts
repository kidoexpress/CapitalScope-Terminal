// src/utils/portfolioPerformance.ts
// Calculate real portfolio performance from historical price data.

import { fetchPriceHistory } from './priceHistory';
import type { PortfolioHolding } from '../types';

export interface PerformancePoint {
  month: string;
  portfolio: number;
  benchmark: number;
}

export async function buildRealPerformanceData(
  holdings: PortfolioHolding[],
  benchmarkTicker = 'SPY'
): Promise<PerformancePoint[]> {
  if (holdings.length === 0) return [];

  const tickers = [...holdings.map(h => h.symbol), benchmarkTicker];
  const priceMap = await fetchPriceHistory(tickers);

  // Find the common length (shortest series)
  const lengths = Object.values(priceMap).map(arr => arr.length);
  if (lengths.length === 0) return [];
  const len = Math.min(...lengths);
  if (len < 2) return [];

  // Calculate weighted portfolio return at each point
  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0) || 1;
  const normalizedWeights = holdings.map(h => h.weight / totalWeight);

  const portfolioValues: number[] = [];
  for (let i = 0; i < len; i++) {
    let value = 100; // base 100
    for (let j = 0; j < holdings.length; j++) {
      const sym = holdings[j].symbol;
      const prices = priceMap[sym];
      if (!prices || prices.length < len) continue;
      const returnFactor = prices[i] / prices[0];
      value += (normalizedWeights[j] * (returnFactor - 1)) * 100;
    }
    portfolioValues.push(Math.round(value * 100) / 100);
  }

  // Benchmark values
  const benchPrices = priceMap[benchmarkTicker] ?? [];
  const benchValues = benchPrices.slice(0, len).map(p =>
    Math.round((p / benchPrices[0]) * 10000) / 100
  );

  // Resample to ~12 monthly points
  const step = Math.max(1, Math.floor(len / 12));
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Array.from({ length: Math.min(12, Math.floor(len / step)) }, (_, i) => {
    const idx = i * step;
    return {
      month: monthLabels[i % 12],
      portfolio: portfolioValues[idx] ?? 100,
      benchmark: benchValues[idx] ?? 100,
    };
  });
}
