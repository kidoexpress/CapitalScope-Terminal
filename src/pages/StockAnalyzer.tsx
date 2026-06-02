// ============================================================
// Stock Analyzer — redesigned for premium, spacious UX
// Hero → Chart → Metrics → AI Panel
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Star, StarOff,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';
import PriceChart from '../components/charts/PriceChart';
import type { StockQuote, AIInsight } from '../types';
import { getStockQuote, getStockHistory, simulateLivePrice } from '../utils/api';
import { calcAllMetrics, formatMarketCap, formatVolume, formatPercent, formatCurrency } from '../utils/finance';
import { usePortfolioStore } from '../store/portfolioStore';

// ─── Insight generation ───────────────────────────────────────

function generateInsights(quote: StockQuote, metrics: ReturnType<typeof calcAllMetrics>): AIInsight[] {
  const insights: AIInsight[] = [];
  if (metrics.sharpeRatio > 1.5)
    insights.push({ type: 'opportunity', title: 'Strong Risk-Adjusted Returns', body: `${quote.symbol} delivers a Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)}, placing it in the top quartile of risk-adjusted performers. The return per unit of volatility is compelling.`, metric: metrics.sharpeRatio.toFixed(2), metricLabel: 'Sharpe' });
  else if (metrics.sharpeRatio < 0.5)
    insights.push({ type: 'warning', title: 'Weak Risk-Adjusted Performance', body: `Sharpe of ${metrics.sharpeRatio.toFixed(2)} means ${quote.symbol} isn't adequately compensating investors for its volatility. The risk-to-reward tradeoff warrants scrutiny.`, metric: metrics.sharpeRatio.toFixed(2), metricLabel: 'Sharpe' });
  if (metrics.volatility > 40)
    insights.push({ type: 'risk', title: 'Elevated Volatility', body: `Annualized volatility of ${metrics.volatility.toFixed(1)}% is well above the S&P 500's ~15%. Expect meaningful short-term price swings — position sizing matters here.`, metric: `${metrics.volatility.toFixed(1)}%`, metricLabel: 'Vol' });
  if (metrics.maxDrawdown < -30)
    insights.push({ type: 'risk', title: 'Deep Historical Drawdown', body: `The maximum drawdown of ${metrics.maxDrawdown.toFixed(1)}% required significant conviction to hold through. Consider whether your thesis survives a similar correction.`, metric: `${metrics.maxDrawdown.toFixed(1)}%`, metricLabel: 'Max DD' });
  if (metrics.cagr > 20)
    insights.push({ type: 'opportunity', title: 'Compounding at Scale', body: `A CAGR of ${metrics.cagr.toFixed(1)}% substantially outpaces historical market returns (~8–10%). This reflects either sustained fundamental outperformance or multiple expansion — worth distinguishing.`, metric: `${metrics.cagr.toFixed(1)}%`, metricLabel: 'CAGR' });
  if (quote.beta > 1.5)
    insights.push({ type: 'info', title: 'High Beta — Amplified Moves', body: `Beta of ${quote.beta.toFixed(2)} means ${quote.symbol} historically moves ~${((quote.beta - 1) * 100).toFixed(0)}% more than the market. In a bull run this accelerates gains; drawdowns are equally amplified.`, metric: `β ${quote.beta.toFixed(2)}`, metricLabel: 'Beta' });
  else if (quote.beta < 0.6)
    insights.push({ type: 'info', title: 'Defensive Characteristics', body: `Beta of ${quote.beta.toFixed(2)} — ${quote.symbol} moves less than the broad market. Useful as a volatility dampener in a high-beta portfolio, though upside participation is muted in strong rallies.`, metric: `β ${quote.beta.toFixed(2)}`, metricLabel: 'Beta' });
  return insights.slice(0, 4);
}

// ─── Sub-components ───────────────────────────────────────────

function StatPill({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color = positive === undefined ? 'var(--text-mid)'
    : positive ? 'var(--green)' : 'var(--red)';
  return (
    <div className="flex flex-col gap-1">
      <span className="label-upper">{label}</span>
      <span className="font-mono text-base font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function MetricTile({ label, value, sub, hint, positive }: {
  label: string; value: string; sub?: string; hint?: string; positive?: boolean;
}) {
  const valColor = positive === undefined ? 'var(--text-hi)'
    : positive ? 'var(--green)' : 'var(--red)';
  return (
    <div className="metric-card flex flex-col gap-2" title={hint}>
      <span className="label-upper">{label}</span>
      <span className="font-mono text-2xl font-bold leading-none" style={{ color: valColor }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--text-lo)' }}>{sub}</span>}
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const [open, setOpen] = useState(false);
  const cfg = {
    opportunity: { dot: 'var(--green)',  bg: 'rgba(34,197,94,0.07)',  label: 'Opportunity' },
    risk:        { dot: 'var(--red)',    bg: 'rgba(244,63,94,0.07)',   label: 'Risk'        },
    warning:     { dot: 'var(--amber)', bg: 'rgba(245,158,11,0.07)',  label: 'Watch'       },
    info:        { dot: 'var(--accent)', bg: 'var(--accent-dim)',       label: 'Note'        },
  }[insight.type] ?? { dot: 'var(--text-lo)', bg: 'var(--bg-raised)', label: 'Note' };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all cursor-pointer"
      style={{ border: '1px solid var(--border-dim)', background: open ? cfg.bg : 'transparent' }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-hi)' }}>{insight.title}</span>
            <span
              className="pill text-[10px] shrink-0"
              style={{ background: cfg.bg, borderColor: 'transparent', color: cfg.dot, padding: '1px 7px' }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs font-bold" style={{ color: cfg.dot }}>{insight.metric}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>{insight.metricLabel}</span>
          </div>
        </div>
        {open ? <ChevronUp size={13} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />
               : <ChevronDown size={13} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />}
      </div>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>{insight.body}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

const DEFAULT_SYMBOL = 'AAPL';

export default function StockAnalyzer() {
  const [searchParams] = useSearchParams();
  const paramTicker = searchParams.get('ticker');
  const [symbol, setSymbol] = useState(paramTicker ?? DEFAULT_SYMBOL);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReturnType<typeof calcAllMetrics> | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const prevSymbol = useRef(symbol);
  const { addToWatchlist, watchlist } = usePortfolioStore();
  const inWatchlist = watchlist.includes(symbol);

  // Sync URL param changes
  useEffect(() => {
    if (paramTicker && paramTicker !== symbol) setSymbol(paramTicker);
  }, [paramTicker]);

  const loadStock = useCallback(async (sym: string) => {
    setLoading(true);
    const [q, history, spyHistory] = await Promise.all([
      getStockQuote(sym),
      getStockHistory(sym, '1Y'),
      getStockHistory('SPY', '1Y'),
    ]);
    if (q) {
      setQuote(q);
      const prices = history.map(p => p.close);
      const spyPrices = spyHistory.map(p => p.close);
      const m = calcAllMetrics(prices, spyPrices, 1);
      m.symbol = sym;
      setMetrics(m);
      setInsights(generateInsights(q, m));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (symbol !== prevSymbol.current) prevSymbol.current = symbol;
    loadStock(symbol);
  }, [symbol]);

  // Live price simulation
  useEffect(() => {
    if (!quote) return;
    const interval = setInterval(() => {
      setQuote(q => q ? { ...q, price: simulateLivePrice(q.price, 0.0007) } : q);
    }, 3500);
    return () => clearInterval(interval);
  }, [quote?.symbol]);

  const isUp = (quote?.changePercent ?? 0) >= 0;

  // ─── Loading skeleton ─────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="shimmer rounded-2xl" style={{ height: 140 }} />
        <div className="shimmer rounded-2xl" style={{ height: 400 }} />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="shimmer rounded-xl" style={{ height: 96 }} />)}
        </div>
      </div>
    );
  }

  if (!quote) return (
    <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-lo)' }}>
      No data available
    </div>
  );

  const dayRangePct = ((quote.price - quote.dayLow) / ((quote.dayHigh - quote.dayLow) || 1)) * 100;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">

      {/* ── SECTION 1: HERO ─────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-sub)',
          position: 'relative',
        }}
      >
        {/* Subtle gradient glow on positive/negative */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isUp
              ? 'radial-gradient(ellipse 60% 80% at 85% 50%, rgba(34,197,94,0.06) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 60% 80% at 85% 50%, rgba(244,63,94,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative px-8 py-7">
          <div className="flex items-start justify-between gap-6">
            {/* Left — company identity */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="font-bold tracking-tight"
                  style={{ fontSize: 48, color: 'var(--text-hi)', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  {quote.symbol}
                </span>
                <span
                  className="pill pill-accent"
                  style={{ fontSize: 11, marginTop: 6 }}
                >
                  {quote.sector}
                </span>
              </div>
              <div>
                <div className="text-base font-medium" style={{ color: 'var(--text-mid)' }}>{quote.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-lo)' }}>{quote.industry}</div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className="pill transition-all"
                  style={{
                    background: compareMode ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
                    borderColor: compareMode ? 'rgba(124,108,240,0.3)' : 'var(--border-sub)',
                    color: compareMode ? 'var(--accent)' : 'var(--text-mid)',
                    fontSize: 11, padding: '4px 12px',
                  }}
                >
                  vs S&P 500
                </button>
                <button
                  onClick={() => addToWatchlist(symbol)}
                  className="pill transition-all flex items-center gap-1.5"
                  style={{
                    background: inWatchlist ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.05)',
                    borderColor: inWatchlist ? 'rgba(245,158,11,0.25)' : 'var(--border-sub)',
                    color: inWatchlist ? 'var(--amber)' : 'var(--text-mid)',
                    fontSize: 11, padding: '4px 12px',
                  }}
                >
                  {inWatchlist
                    ? <><Star size={11} fill="currentColor" /> Watching</>
                    : <><StarOff size={11} /> Watch</>
                  }
                </button>
              </div>
            </div>

            {/* Right — price */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div
                className="font-mono font-bold"
                style={{ fontSize: 48, color: 'var(--text-hi)', letterSpacing: '-0.04em', lineHeight: 1 }}
              >
                {formatCurrency(quote.price)}
              </div>
              <div className="flex items-center gap-2">
                {isUp
                  ? <TrendingUp size={16} style={{ color: 'var(--green)' }} />
                  : <TrendingDown size={16} style={{ color: 'var(--red)' }} />
                }
                <span
                  className="font-mono text-lg font-semibold"
                  style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}
                >
                  {isUp ? '+' : ''}{formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: 'var(--green)' }} />
                <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--text-lo)', letterSpacing: '0.08em' }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Day range */}
          <div className="mt-6 flex items-center gap-3">
            <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
              {formatCurrency(quote.dayLow)}
            </span>
            <div className="flex-1 relative h-1 rounded-full" style={{ background: 'var(--bg-raised)' }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${dayRangePct}%`,
                  background: isUp ? 'var(--green)' : 'var(--red)',
                  boxShadow: `0 0 8px ${isUp ? 'rgba(34,197,94,0.6)' : 'rgba(244,63,94,0.6)'}`,
                }}
              />
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--text-lo)' }}>
              {formatCurrency(quote.dayHigh)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-lo)' }}>Day range</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: CHART ─────────────────────────────────── */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-hi)' }}>
              {compareMode ? `${quote.symbol} vs SPY — % Return` : 'Price History'}
            </div>
            {compareMode && (
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ background: isUp ? 'var(--green)' : 'var(--red)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>{quote.symbol}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded-full" style={{ background: 'var(--accent)', opacity: 0.7 }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>SPY</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <PriceChart
          symbol={quote.symbol}
          currentPrice={quote.price}
          compareSymbol={compareMode ? 'SPY' : undefined}
          height={460}
        />
      </div>

      {/* ── SECTION 3: PRIMARY METRICS ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricTile
          label="Market Cap"
          value={formatMarketCap(quote.marketCap)}
          hint="Total market capitalization"
        />
        <MetricTile
          label="P/E Ratio"
          value={quote.peRatio > 0 ? `${quote.peRatio.toFixed(1)}×` : 'N/A'}
          hint="Price-to-earnings ratio"
        />
        <MetricTile
          label="52W Range"
          value={`${formatCurrency(quote.low52w)} – ${formatCurrency(quote.high52w)}`}
          hint="52-week price range"
        />
        <MetricTile
          label="Volume"
          value={formatVolume(quote.volume)}
          sub="shares traded"
          hint="Daily trading volume"
        />
      </div>

      {/* ── SECTION 4: PERFORMANCE + AI ──────────────────────── */}
      {metrics && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Performance metrics — 3 cols */}
          <div
            className="xl:col-span-3 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', padding: '24px' }}
          >
            <div className="label-upper mb-5">Performance Metrics (1Y)</div>
            <div className="grid grid-cols-3 gap-6">
              <StatPill
                label="ROI"
                value={`${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(1)}%`}
                positive={metrics.roi >= 0}
              />
              <StatPill
                label="CAGR"
                value={`${metrics.cagr >= 0 ? '+' : ''}${metrics.cagr.toFixed(1)}%`}
                positive={metrics.cagr >= 0}
              />
              <StatPill
                label="Sharpe Ratio"
                value={metrics.sharpeRatio.toFixed(2)}
                positive={metrics.sharpeRatio > 1}
              />
              <StatPill
                label="Volatility"
                value={`${metrics.volatility.toFixed(1)}%`}
                positive={metrics.volatility < 25}
              />
              <StatPill
                label="Max Drawdown"
                value={`${metrics.maxDrawdown.toFixed(1)}%`}
                positive={false}
              />
              <StatPill
                label="Sortino Ratio"
                value={metrics.sortinoRatio.toFixed(2)}
                positive={metrics.sortinoRatio > 1}
              />
            </div>

            {/* Secondary metrics toggle */}
            <button
              onClick={() => setShowSecondary(!showSecondary)}
              className="flex items-center gap-1.5 mt-6 text-xs transition-colors"
              style={{ color: 'var(--text-lo)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-mid)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-lo)')}
            >
              {showSecondary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showSecondary ? 'Hide' : 'Show'} additional metrics
            </button>

            {showSecondary && (
              <div
                className="mt-4 pt-4 grid grid-cols-3 gap-4 animate-fade-in"
                style={{ borderTop: '1px solid var(--border-dim)' }}
              >
                {[
                  { label: 'Beta',           value: quote.beta.toFixed(2),                          hint: 'Market sensitivity' },
                  { label: 'EPS',            value: quote.eps > 0 ? formatCurrency(quote.eps) : 'N/A', hint: 'Earnings per share' },
                  { label: 'Div Yield',      value: quote.dividendYield > 0 ? `${quote.dividendYield.toFixed(2)}%` : 'N/A', hint: 'Annual dividend yield' },
                  { label: 'Previous Close', value: formatCurrency(quote.previousClose),             hint: '' },
                  { label: 'Open',           value: formatCurrency(quote.open),                     hint: '' },
                  { label: '52W High',       value: formatCurrency(quote.high52w),                  hint: '' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-1" title={item.hint}>
                    <span className="label-upper">{item.label}</span>
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights — 2 cols */}
          <div
            className="xl:col-span-2 rounded-2xl flex flex-col"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', padding: '24px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="label-upper">AI Insights</div>
              <span
                className="pill pill-accent text-[9px]"
                style={{ padding: '2px 8px' }}
              >
                EDUCATIONAL ONLY
              </span>
            </div>

            {insights.length > 0 ? (
              <div className="flex flex-col gap-1 flex-1">
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--text-lo)' }}>
                No notable signals for this period
              </div>
            )}

            <div
              className="mt-4 pt-4 flex items-start gap-2"
              style={{ borderTop: '1px solid var(--border-dim)' }}
            >
              <Info size={11} style={{ color: 'var(--text-lo)', marginTop: 1, flexShrink: 0 }} />
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-lo)' }}>
                AI-generated signals are for educational purposes only. Not financial advice.
                Verify all data independently before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
