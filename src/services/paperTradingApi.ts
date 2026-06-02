import type {
  BenchmarkComparisonRow,
  EquityPoint,
  PerformanceMetrics,
  PerformanceReport,
  Portfolio,
  TradeRequest,
} from '../types/portfolio';

interface ApiHolding {
  ticker: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  pnl: number;
  pnl_pct: number;
  weight: number;
}

interface ApiPortfolio {
  portfolio_id: string;
  name: string;
  cash: number;
  initial_cash?: number;
  total_value?: number;
  holdings?: ApiHolding[];
  created_at: string;
}

type ApiMetrics = Record<string, number>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    let message = `Paper trading API error (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function mapPortfolio(raw: ApiPortfolio): Portfolio {
  return {
    id: raw.portfolio_id,
    name: raw.name,
    cash: raw.cash,
    initialCash: raw.initial_cash ?? raw.cash,
    totalValue: raw.total_value ?? raw.cash,
    createdAt: raw.created_at,
    holdings: (raw.holdings ?? []).map(holding => ({
      ticker: holding.ticker,
      shares: holding.shares,
      avgCost: holding.avg_cost,
      currentPrice: holding.current_price,
      pnl: holding.pnl,
      pnlPct: holding.pnl_pct,
      weight: holding.weight,
    })),
  };
}

function mapMetrics(raw: ApiMetrics): PerformanceMetrics {
  return {
    totalReturn: raw.total_return ?? 0,
    annualizedReturn: raw.annualized_return ?? 0,
    sharpeRatio: raw.sharpe_ratio ?? 0,
    sortinoRatio: raw.sortino_ratio ?? 0,
    maxDrawdown: raw.max_drawdown ?? 0,
    calmarRatio: raw.calmar_ratio ?? 0,
    volatilityAnnual: raw.volatility_annual ?? 0,
    alpha: raw.alpha ?? 0,
    beta: raw.beta ?? 0,
    winRate: raw.win_rate ?? 0,
    bestDay: raw.best_day ?? 0,
    worstDay: raw.worst_day ?? 0,
    var95: raw.var_95 ?? 0,
  };
}

function mapEquityPoint(raw: any): EquityPoint {
  return {
    date: raw.date,
    portfolioValue: raw.portfolio_value,
    spyValue: raw.spy_value,
    qqqValue: raw.qqq_value,
    brkBValue: raw.brk_b_value,
    arkkValue: raw.arkk_value,
  };
}

export async function createPortfolio(name: string, initialCash: number): Promise<Portfolio> {
  const created = await request<ApiPortfolio>('/api/portfolio/create', {
    method: 'POST',
    body: JSON.stringify({ name, initial_cash: initialCash }),
  });
  return mapPortfolio({ ...created, initial_cash: initialCash, total_value: initialCash, holdings: [] });
}

export async function listPortfolios(): Promise<Portfolio[]> {
  const rows = await request<ApiPortfolio[]>('/api/portfolio/list');
  return rows.map(mapPortfolio);
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  return mapPortfolio(await request<ApiPortfolio>(`/api/portfolio/${id}`));
}

export async function executeTrade(id: string, trade: TradeRequest): Promise<Portfolio> {
  const result = await request<{ updated_portfolio: ApiPortfolio }>(`/api/portfolio/${id}/trade`, {
    method: 'POST',
    body: JSON.stringify({
      action: trade.action,
      ticker: trade.ticker,
      shares: trade.shares,
      date: trade.date,
    }),
  });
  return mapPortfolio(result.updated_portfolio);
}

export async function deletePortfolio(id: string): Promise<void> {
  await request(`/api/portfolio/${id}`, { method: 'DELETE' });
}

export async function getPerformanceReport(id: string, start: string, end: string): Promise<PerformanceReport> {
  const report = await request<{
    metrics: ApiMetrics;
    benchmark_comparison: Record<string, ApiMetrics>;
    equity_curve: any[];
  }>(`/api/portfolio/${id}/metrics?start=${start}&end=${end}`);

  const benchmarkComparison: BenchmarkComparisonRow[] = [
    ['SPY', report.benchmark_comparison.SPY],
    ['QQQ', report.benchmark_comparison.QQQ],
    ['BRK-B', report.benchmark_comparison['BRK-B']],
    ['ARKK', report.benchmark_comparison.ARKK],
  ].filter(([, metrics]) => Boolean(metrics)).map(([name, metrics]) => ({
    name: name as string,
    totalReturn: (metrics as ApiMetrics).total_return ?? 0,
    sharpeRatio: (metrics as ApiMetrics).sharpe_ratio ?? 0,
    maxDrawdown: (metrics as ApiMetrics).max_drawdown ?? 0,
    alpha: null,
  }));

  return {
    metrics: mapMetrics(report.metrics),
    benchmarkComparison,
    equityCurve: report.equity_curve.map(mapEquityPoint),
  };
}

