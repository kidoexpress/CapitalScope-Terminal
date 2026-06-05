export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  weight: number;
  sector?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  cash: number;
  initialCash: number;
  totalValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalPnlPct: number;
  holdings: Holding[];
  transactions?: Array<Record<string, unknown>>;
  cashLedger?: Array<Record<string, unknown>>;
  dataSource?: string;
  dataStatus?: string;
  lastUpdated?: string;
  createdAt: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  volatilityAnnual: number;
  alpha: number;
  beta: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
  var95: number;
}

export interface EquityPoint {
  date: string;
  portfolioValue: number;
  spyValue?: number | null;
  qqqValue?: number | null;
  brkBValue?: number | null;
  arkkValue?: number | null;
}

export interface BenchmarkComparisonRow {
  name: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  alpha?: number | null;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  benchmarkComparison: BenchmarkComparisonRow[];
  equityCurve: EquityPoint[];
  assumptions?: string[];
  dataQualityNotes?: string[];
}

export interface TradeRequest {
  action: 'buy' | 'sell';
  ticker: string;
  shares: number;
  date?: string;
}
