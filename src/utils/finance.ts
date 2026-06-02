import type { StockMetrics } from '../types';

/** Calculate simple ROI */
export function calcROI(startPrice: number, endPrice: number): number {
  return ((endPrice - startPrice) / startPrice) * 100;
}

/** Calculate CAGR */
export function calcCAGR(startPrice: number, endPrice: number, years: number): number {
  if (years <= 0) return 0;
  return (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
}

/** Calculate annualized volatility from daily returns */
export function calcVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * 252) * 100; // annualized %
}

/** Calculate max drawdown */
export function calcMaxDrawdown(prices: number[]): number {
  let peak = prices[0];
  let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return -maxDD * 100; // negative %
}

/** Calculate Sharpe ratio */
export function calcSharpe(prices: number[], riskFreeRate: number = 0.05): number {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const annualReturn = returns.reduce((a, b) => a + b, 0) / returns.length * 252;
  const vol = calcVolatility(prices) / 100;
  if (vol === 0) return 0;
  return (annualReturn - riskFreeRate) / vol;
}

/** Calculate Sortino ratio (uses downside deviation) */
export function calcSortino(prices: number[], riskFreeRate: number = 0.05): number {
  if (prices.length < 2) return 0;
  const dailyRFR = riskFreeRate / 252;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const annualReturn = returns.reduce((a, b) => a + b, 0) / returns.length * 252;
  const downside = returns.filter(r => r < dailyRFR);
  if (downside.length === 0) return 10; // perfect
  const downsideVar = downside.reduce((s, r) => s + (r - dailyRFR) ** 2, 0) / downside.length;
  const downsideVol = Math.sqrt(downsideVar * 252);
  if (downsideVol === 0) return 10;
  return (annualReturn - riskFreeRate) / downsideVol;
}

/** Calculate beta relative to market */
export function calcBeta(stockReturns: number[], marketReturns: number[]): number {
  const n = Math.min(stockReturns.length, marketReturns.length);
  if (n < 2) return 1;
  const sr = stockReturns.slice(0, n);
  const mr = marketReturns.slice(0, n);
  const sMean = sr.reduce((a, b) => a + b, 0) / n;
  const mMean = mr.reduce((a, b) => a + b, 0) / n;
  let cov = 0, mVar = 0;
  for (let i = 0; i < n; i++) {
    cov += (sr[i] - sMean) * (mr[i] - mMean);
    mVar += (mr[i] - mMean) ** 2;
  }
  return mVar === 0 ? 1 : cov / mVar;
}

/** Pearson correlation */
export function calcCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const as = a.slice(0, n), bs = b.slice(0, n);
  const am = as.reduce((s, x) => s + x, 0) / n;
  const bm = bs.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (as[i] - am) * (bs[i] - bm);
    da += (as[i] - am) ** 2;
    db += (bs[i] - bm) ** 2;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : num / denom;
}

/** Build daily returns array from price array */
export function getDailyReturns(prices: number[]): number[] {
  const r = [];
  for (let i = 1; i < prices.length; i++) {
    r.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return r;
}

/** Full metrics for a stock vs market */
export function calcAllMetrics(
  prices: number[],
  marketPrices: number[],
  years: number = 1
): StockMetrics {
  const stockReturns = getDailyReturns(prices);
  const marketReturns = getDailyReturns(marketPrices);
  return {
    symbol: '',
    roi: calcROI(prices[0], prices[prices.length - 1]),
    cagr: calcCAGR(prices[0], prices[prices.length - 1], years),
    volatility: calcVolatility(prices),
    maxDrawdown: calcMaxDrawdown(prices),
    sharpeRatio: calcSharpe(prices),
    beta: calcBeta(stockReturns, marketReturns),
    alpha: 0,
    sortinoRatio: calcSortino(prices),
  };
}

/** Portfolio weighted return */
export function calcPortfolioReturn(holdings: { weight: number; returnPct: number }[]): number {
  return holdings.reduce((sum, h) => sum + h.weight * h.returnPct / 100, 0) * 100;
}

/** Diversification score 0-100 */
export function calcDiversificationScore(
  weights: number[],
  correlations: number[][],
  sectors: string[]
): number {
  if (weights.length === 0) return 0;
  // Herfindahl-Hirschman Index for concentration
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const concentrationScore = 1 - hhi; // 0 to 1

  // Sector diversity
  const uniqueSectors = new Set(sectors).size;
  const sectorScore = Math.min(uniqueSectors / 6, 1);

  // Average correlation
  let avgCorr = 0, count = 0;
  for (let i = 0; i < correlations.length; i++) {
    for (let j = i + 1; j < correlations[i].length; j++) {
      avgCorr += Math.abs(correlations[i][j]);
      count++;
    }
  }
  const corrScore = count > 0 ? 1 - avgCorr / count : 1;

  return Math.round((concentrationScore * 0.4 + sectorScore * 0.35 + corrScore * 0.25) * 100);
}

/** Format large numbers */
export function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

export function formatCurrency(n: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(n: number, digits = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}
