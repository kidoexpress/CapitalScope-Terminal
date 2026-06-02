import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Info, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { runEarningsReview, type EarningsReviewParams, type EarningsReviewResult } from '../../services/claudeService';
import { AgentSkeleton, StreamingText } from '../../components/agents/StreamingText';
import { COMPANY_FUNDAMENTALS } from '../../data/financialData';

const SUPPORTED_TICKERS = Object.keys(COMPANY_FUNDAMENTALS);

const EXAMPLE_THESES: Record<string, string> = {
  AAPL: 'Apple remains a services-led platform business with high switching costs, resilient cash flow, and shareholder returns through buybacks. The thesis depends on Services growth offsetting hardware cyclicality.',
  MSFT: 'Microsoft should compound through Azure, M365, security, and AI-enabled ARPU expansion. The thesis depends on enterprise demand staying durable and cloud margins holding up.',
  NVDA: 'NVIDIA has a durable AI infrastructure position through CUDA, accelerated compute, and data center demand. The thesis depends on continued hyperscaler capex and limited margin pressure.',
  GOOGL: 'Alphabet can defend Search economics while using AI, YouTube, Cloud, and Waymo as growth vectors. The thesis depends on ad resilience and AI not eroding search margins.',
  META: 'Meta should benefit from ad efficiency, engagement, and disciplined opex while Reality Labs remains a long-dated option. The thesis depends on ad growth and capex control.',
};

function StatusCard({ result }: { result: EarningsReviewResult }) {
  const tone =
    result.thesisStatus === 'INTACT' ? 'positive' :
    result.thesisStatus === 'WEAKENED' ? 'caution' :
    result.thesisStatus === 'MATERIALLY CHANGED' ? 'negative' : 'neutral';

  return (
    <div className={`workflow-result-card thesis-status ${tone}`}>
      <span className="label-upper">Thesis Status</span>
      <strong>{result.thesisStatus.replace('_', ' ')}</strong>
      <p>Confidence score: {result.confidenceScore}/10. Human review required before acting on this analysis.</p>
    </div>
  );
}

function BulletCard({ title, items, fallback }: { title: string; items?: string[]; fallback: string }) {
  return (
    <div className="workflow-result-card">
      <span className="label-upper">{title}</span>
      <ul className="result-bullets">
        {(items?.length ? items : [fallback]).map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function EarningsReviewer() {
  const [ticker, setTicker] = useState('AAPL');
  const [thesis, setThesis] = useState(EXAMPLE_THESES.AAPL);
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [entryPrice, setEntryPrice] = useState(175);
  const [holdingPeriod, setHoldingPeriod] = useState('12-24 months');
  const [result, setResult] = useState<EarningsReviewResult | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const company = COMPANY_FUNDAMENTALS[ticker];
  const step = result ? 4 : thesis.trim() ? 3 : 2;
  const shares = investmentAmount && entryPrice ? investmentAmount / entryPrice : 0;

  const summaryMetrics = useMemo(() => {
    const income = company?.incomeStatements?.[0];
    const cash = company?.cashFlows?.[0];
    const balance = company?.balanceSheets?.[0];
    return [
      { label: 'Revenue growth', value: income?.revenueGrowth !== undefined ? `${income.revenueGrowth.toFixed(1)}%` : 'Pending' },
      { label: 'EBITDA margin', value: income?.ebitdaMargin !== undefined ? `${income.ebitdaMargin.toFixed(1)}%` : 'Pending' },
      { label: 'FCF margin', value: cash?.fcfMargin !== undefined ? `${cash.fcfMargin.toFixed(1)}%` : 'Pending' },
      { label: 'Net debt', value: balance?.netDebt !== undefined ? `$${(balance.netDebt / 1e3).toFixed(1)}B` : 'Pending' },
    ];
  }, [company]);

  const handleTickerChange = (sym: string) => {
    setTicker(sym);
    if (EXAMPLE_THESES[sym]) setThesis(EXAMPLE_THESES[sym]);
  };

  const handleRun = useCallback(async () => {
    if (!thesis.trim()) return;
    setIsRunning(true);
    setIsStreaming(true);
    setStreamText('');
    setResult(null);
    setError(null);

    const params: EarningsReviewParams = {
      symbol: ticker,
      thesis,
      investmentAmount,
      entryPrice,
      entryDate: holdingPeriod,
    };

    try {
      const res = await runEarningsReview(params, chunk => {
        setStreamText(prev => prev + chunk);
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [ticker, thesis, investmentAmount, entryPrice, holdingPeriod]);

  const reset = () => {
    setResult(null);
    setStreamText('');
    setError(null);
  };

  return (
    <div className="workflow-page animate-fade-in-up">
      <div className="product-page-heading">
        <div>
          <p>AI Research Workflow</p>
          <h1>Earnings Reviewer</h1>
        </div>
        <span>Review the latest quarter against your original thesis. No buy or sell instructions, only thesis status and evidence.</span>
      </div>

      <div className="workflow-steps" aria-label="Earnings reviewer steps">
        {['Select Company', 'Enter Thesis', 'Run Review', 'Read Results'].map((label, index) => (
          <div key={label} className={`workflow-step ${step >= index + 1 ? 'active' : ''}`}>
            <span>{index + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="earnings-workflow-grid">
        <section className="workflow-card primary-workflow-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Step 1</span>
              <h2>Select Company</h2>
            </div>
            <FileText size={20} />
          </div>

          <div className="ticker-chip-grid">
            {SUPPORTED_TICKERS.map(sym => (
              <button key={sym} onClick={() => handleTickerChange(sym)} className={`ticker-chip ${ticker === sym ? 'active' : ''}`}>
                {sym}
              </button>
            ))}
          </div>

          <div className="company-snapshot">
            <div>
              <strong>{ticker}</strong>
              <span>{company?.name ?? 'Company'} · {company?.sector ?? 'Sector'}</span>
            </div>
            <div className="snapshot-grid">
              {summaryMetrics.map(metric => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="workflow-card primary-workflow-card thesis-entry-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Step 2</span>
              <h2>Investment Thesis</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <textarea
            value={thesis}
            onChange={e => setThesis(e.target.value)}
            placeholder="Write the original thesis you want the earnings reviewer to test..."
            rows={8}
          />
          <div className="thesis-meta-row">
            <label>
              Entry price
              <input type="number" step="0.01" value={entryPrice} onChange={e => setEntryPrice(Number(e.target.value))} />
            </label>
            <label>
              Position size
              <input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(Number(e.target.value))} />
            </label>
            <label>
              Holding period
              <input type="text" value={holdingPeriod} onChange={e => setHoldingPeriod(e.target.value)} />
            </label>
          </div>
          <p className="workflow-help-text">{shares.toFixed(1)} implied shares. These assumptions are used only to frame thesis impact.</p>
        </section>

        <section className="workflow-card run-review-card">
          <span className="label-upper">Step 3</span>
          <h2>Run Review</h2>
          <p>Agent checks earnings, fundamentals, margin movement, debt, cash flow, and guidance signals against the stated thesis.</p>
          <button onClick={result ? reset : handleRun} disabled={isRunning || !thesis.trim()} className="workflow-primary-action">
            {isRunning ? <span className="button-spinner" /> : result ? <RotateCcw size={16} /> : <Search size={16} />}
            {isRunning ? 'Reviewing earnings...' : result ? 'Start New Review' : 'Run Earnings Review'}
          </button>
          <div className="workflow-disclaimer"><Info size={13} /> Educational analysis only. Not financial advice.</div>
        </section>
      </div>

      <section className="workflow-output" ref={outputRef}>
        <div className="workflow-output-header">
          <div>
            <span className="label-upper">Step 4</span>
            <h2>Results</h2>
          </div>
          {result && <span className="review-required"><CheckCircle2 size={14} /> Human review required</span>}
        </div>

        {error && (
          <div className="workflow-error"><AlertTriangle size={16} /> {error}</div>
        )}

        {(isRunning || streamText) && !result && (
          <div className="workflow-card">
            <div className="streaming-status"><span className="pulse-live" /> Earnings Reviewer is preparing the memo...</div>
            {streamText ? <StreamingText text={streamText} isStreaming={isStreaming} /> : <AgentSkeleton lines={7} />}
          </div>
        )}

        {!isRunning && !result && !error && (
          <div className="intentional-empty-state">
            <FileText size={22} />
            <strong>Ready when your thesis is ready.</strong>
            <span>Results stay hidden until the review runs so the workflow stays focused.</span>
          </div>
        )}

        {result && (
          <div className="workflow-results-grid">
            <StatusCard result={result} />
            <div className="workflow-result-card">
              <span className="label-upper">Earnings Highlights</span>
              <div className="metric-review-list">
                {result.keyMetrics.map(metric => (
                  <div key={metric.metric}>
                    <span>{metric.metric}</span>
                    <strong>{metric.beatMiss}</strong>
                    <em>{metric.surprise}</em>
                  </div>
                ))}
              </div>
            </div>
            <BulletCard title="What Supports The Thesis" items={result.positiveSignals} fallback="No explicit positive signals were extracted. Review the full memo before drawing conclusions." />
            <BulletCard title="What Weakens The Thesis" items={result.negativeSignals} fallback="No explicit negative signals were extracted. Review the full memo before drawing conclusions." />
            <div className="workflow-result-card">
              <span className="label-upper">Watch Items</span>
              <p>{result.guidanceUpdate}</p>
            </div>
            <div className="workflow-result-card">
              <span className="label-upper">Data Confidence</span>
              <strong className="confidence-value">{result.confidenceScore}/10</strong>
              <p>Based on available fundamentals, earnings context, and synthetic agent interpretation. Verify all data independently.</p>
            </div>
            <div className="workflow-result-card full-memo">
              <span className="label-upper">Full Research Memo</span>
              <StreamingText text={result.fullAnalysis} isStreaming={false} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
