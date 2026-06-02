import { useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, Bot, RefreshCw } from 'lucide-react';
import PortfolioPicker from '../components/PaperTrading/PortfolioPicker';
import PortfolioSummary from '../components/PaperTrading/PortfolioSummary';
import EquityCurveChart from '../components/PaperTrading/EquityCurveChart';
import HoldingsTable from '../components/PaperTrading/HoldingsTable';
import TradePanel from '../components/PaperTrading/TradePanel';
import BenchmarkComparison from '../components/PaperTrading/BenchmarkComparison';
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
      <div className="product-page-heading">
        <div>
          <p>Simulation Engine</p>
          <h1>Paper Trading</h1>
        </div>
        <span>Virtual portfolios with persisted trades, live Yahoo Finance prices, and quantitative performance reporting.</span>
      </div>

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
          <section className="workflow-card paper-ai-note">
            <div className="workflow-card-header">
              <div>
                <span className="label-upper">AI Simulation Note</span>
                <h2>Portfolio Read</h2>
              </div>
              <Bot size={18} />
            </div>
            <p>
              This module is a virtual investing lab. Metrics are calculated from historical returns and benchmark comparisons,
              but outputs remain educational and should be independently verified.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
