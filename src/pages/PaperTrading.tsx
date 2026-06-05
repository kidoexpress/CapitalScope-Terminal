import { useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, RefreshCw, WalletCards } from 'lucide-react';
import PortfolioPicker from '../components/PaperTrading/PortfolioPicker';
import PortfolioSummary from '../components/PaperTrading/PortfolioSummary';
import EquityCurveChart from '../components/PaperTrading/EquityCurveChart';
import HoldingsTable from '../components/PaperTrading/HoldingsTable';
import TradePanel from '../components/PaperTrading/TradePanel';
import BenchmarkComparison from '../components/PaperTrading/BenchmarkComparison';
import { ActionButton, DataSourcePill, EmptyState, InsightMemo, PageHeader } from '../components/ui/product';
import { usePaperTradingStore } from '../store/paperTradingStore';
import { formatCurrency } from '../utils/finance';

export default function PaperTrading() {
  const {
    portfolios,
    activePortfolioId,
    activePortfolio,
    report,
    loading,
    error,
    period,
    loadPortfolios,
    createNewPortfolio,
    selectPortfolio,
    refreshActivePortfolio,
    runTrade,
    loadReport,
    setPeriod,
    clearError,
  } = usePaperTradingStore();

  // Guard against React StrictMode double-invocation, which would cause
  // loading shimmer to flash twice (true→false→true→false on mount).
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void loadPortfolios();
  }, [loadPortfolios]);

  // Stable array/null references — avoids passing a new [] on every render
  // which would cause recharts to unnecessarily re-animate the chart.
  const equityCurve  = useMemo(() => report?.equityCurve      ?? [], [report]);
  const holdings     = useMemo(() => activePortfolio?.holdings ?? [], [activePortfolio]);
  const benchRows    = useMemo(() => report?.benchmarkComparison ?? [], [report]);

  return (
    <div className="workflow-page paper-page animate-fade-in-up">
      <PageHeader
        eyebrow="Simulation Engine"
        title="Paper Trading"
        description="Create a virtual book, execute simulated trades, and compare risk-adjusted performance against market benchmarks."
        meta={(
          <DataSourcePill
            label="Yahoo Finance prices · Simulation mode"
            status="simulation"
            onRefresh={() => { void refreshActivePortfolio(); void loadReport(); }}
            refreshing={loading}
          />
        )}
      />

      {error && (
        <div className="paper-error-banner">
          <AlertTriangle size={17} />
          <div>
            <strong>Paper trading data unavailable</strong>
            <span>{error}</span>
          </div>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {!loading && portfolios.length === 0 && (
        <EmptyState
          icon={<WalletCards size={22} />}
          title="Start with a virtual portfolio"
          description="Create a paper portfolio to track cash, holdings, P&L, benchmark comparison, and risk-adjusted returns without executing real trades."
          action={(
            <ActionButton onClick={() => void createNewPortfolio('Research Portfolio', 100000)}>
              Create $100k portfolio
            </ActionButton>
          )}
        />
      )}

      {activePortfolio?.hasMixedCurrencies && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--amber)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span>⚠</span>
          <span>
            This portfolio contains assets in multiple currencies ({activePortfolio.currencies?.join(', ')}).
            Total value is summed without FX conversion — figures may not be comparable.
            Use single-market portfolios for accurate P&L tracking.
          </span>
        </div>
      )}

      <section className="paper-hero">
        <div className="paper-hero-main">
          <div className="market-open-pill"><span className="pulse-live" /> Simulation mode · No real trades</div>
          <h2>{activePortfolio?.name ?? 'Create a portfolio'}</h2>
          <p>Build a virtual book, execute simulated trades, and compare risk-adjusted performance against institutional benchmarks.</p>
          <PortfolioPicker
            portfolios={portfolios}
            activeId={activePortfolioId}
            onSelect={selectPortfolio}
            onCreate={createNewPortfolio}
            loading={loading}
          />
        </div>
        <div className="paper-hero-balance">
          <span>Portfolio Value</span>
          <strong>{formatCurrency(activePortfolio?.totalValue ?? 0)}</strong>
          <em>Cash balance: {formatCurrency(activePortfolio?.cash ?? 0)}</em>
          <em className={(activePortfolio?.totalPnl ?? 0) >= 0 ? 'positive' : 'negative'}>
            Total P&L: {formatCurrency(activePortfolio?.totalPnl ?? 0)} ({(activePortfolio?.totalPnlPct ?? 0).toFixed(2)}%)
          </em>
          <em>Realized: {formatCurrency(activePortfolio?.realizedPnl ?? 0)} · Unrealized: {formatCurrency(activePortfolio?.unrealizedPnl ?? 0)}</em>
          <button onClick={() => { void refreshActivePortfolio(); void loadReport(); }} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      <div className="paper-layout-grid">
        <main className="paper-main-stack">
          <PortfolioSummary metrics={report?.metrics ?? null} loading={loading && !report} />
          <EquityCurveChart
            data={equityCurve}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading && !report}
          />
          <div className="paper-lower-grid">
            <HoldingsTable holdings={holdings} totalValue={activePortfolio?.totalValue ?? 0} loading={loading && !activePortfolio} />
            <BenchmarkComparison metrics={report?.metrics ?? null} rows={benchRows} />
          </div>
        </main>

        <aside className="paper-side-stack">
          <TradePanel portfolio={activePortfolio} onTrade={runTrade} loading={loading} />
          <InsightMemo
            eyebrow="AI Simulation Note"
            title="Portfolio Read"
            summary="This virtual lab estimates portfolio behavior from historical returns, current Yahoo Finance prices, and benchmark-relative metrics."
            items={[
              { label: 'Review mode', value: 'Human review required' },
              { label: 'Trade execution', value: 'Disabled' },
              { label: 'Primary risks', value: 'Data delays, model assumptions, and market regime shifts' },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
