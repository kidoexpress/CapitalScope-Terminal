export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  high52w: number;
  low52w: number;
  avgVolume: number;
  beta: number;
  sector: string;
  industry: string;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  eps: number;
  dividendYield: number;
}

export interface PricePoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface StockMetrics {
  symbol: string;
  roi: number;
  cagr: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  beta: number;
  alpha: number;
  sortinoRatio: number;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  weight: number;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  createdAt: string;
}

export interface MonteCarloResult {
  paths: number[][];
  percentiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  expectedReturn: number;
  downsideRisk: number;
  probabilityProfit: number;
  finalValues: number[];
  timeLabels: string[];
}

export interface CorrelationData {
  symbols: string[];
  matrix: number[][];
}

export interface ScenarioImpact {
  symbol: string;
  name: string;
  basePrice: number;
  impactedPrice: number;
  changePercent: number;
  sector: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  impacts: Record<string, number>;
  explanation: string;
  affectedSectors: string[];
  severity: 'low' | 'medium' | 'high' | 'extreme';
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  sector: string;
  marketCap: number;
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

export interface AIInsight {
  type: 'info' | 'warning' | 'opportunity' | 'risk';
  title: string;
  body: string;
  metric?: string;
  metricLabel?: string;
}
