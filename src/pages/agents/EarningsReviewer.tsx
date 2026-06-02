// ============================================================
// Earnings Reviewer Agent
// Reviews latest earnings vs. investment thesis, outputs
// Intact / Weakened / Materially Changed / Needs More Review
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { FileText, Search, AlertTriangle, TrendingUp, TrendingDown, ChevronRight, RotateCcw, Info } from 'lucide-react';
import { runEarningsReview, type EarningsReviewParams, type EarningsReviewResult } from '../../services/claudeService';
import { StreamingText, ThesisBadge, AgentSection, SignalCard, AgentSkeleton } from '../../components/agents/StreamingText';
import { COMPANY_FUNDAMENTALS } from '../../data/financialData';

const SUPPORTED_TICKERS = Object.keys(COMPANY_FUNDAMENTALS);

const EXAMPLE_THESES: Record<string, string> = {
  AAPL: 'Apple is a services-driven platform business with high switching costs, pricing power, and world-class capital allocation. Growing services segment (App Store, iCloud, Apple TV+) reduces hardware cyclicality. Share buybacks and dividend growth provide shareholder returns.',
  MSFT: 'Microsoft\'s transformation to cloud-first (Azure + M365) creates a durable recurring revenue base. Copilot AI integration across the suite drives ARPU expansion. Enterprise stickiness and market share gains in cloud infrastructure justify premium multiples.',
  NVDA: 'NVIDIA dominates the AI/ML accelerator market with an entrenched CUDA ecosystem that competitors cannot easily replicate. Datacenter growth is driven by hyperscaler capex and sovereign AI build-outs. NIM software margins provide additional upside.',
  GOOGL: 'Alphabet\'s Search monopoly generates durable high-margin cash flows that fund long-term bets in Cloud (GCP), YouTube, and Waymo. AI integration through Gemini protects the core business while cloud revenues show accelerating growth.',
  TSLA: 'Tesla leads EV adoption with superior software/OTA capabilities, a proprietary Supercharger network, and energy storage as a second growth engine. FSD monetization and the Robotaxi network represent long-term call options on autonomy.',
  META: 'Meta\'s Family of Apps (Facebook, Instagram, WhatsApp) generates an unmatched social graph with 3.2B+ DAUs. Ad-tech efficiency and Advantage+ AI-driven creative deliver superior ROAS. Reality Labs optionality provides upside if spatial computing scales.',
  AMZN: 'Amazon is a capital-compounding machine: AWS is the hyperscale infrastructure layer for the internet (>$100B run rate), Prime creates a flywheel for retail and advertising, and Advertising is the highest-margin segment growing 20%+ annually.',
};

export default function EarningsReviewer() {
  const [ticker, setTicker] = useState('AAPL');
  const [thesis, setThesis] = useState(EXAMPLE_THESES['AAPL']);
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [entryPrice, setEntryPrice] = useState(175);
  const [entryDate, setEntryDate] = useState('2024-01-01');

  const [result, setResult] = useState<EarningsReviewResult | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);

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
      entryDate,
    };

    try {
      const res = await runEarningsReview(params, (chunk) => {
        setStreamText(prev => prev + chunk);
        // Auto-scroll
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [ticker, thesis, investmentAmount, entryPrice, entryDate]);

  const handleReset = () => {
    setResult(null);
    setStreamText('');
    setError(null);
  };

  const shares = investmentAmount / entryPrice;

  return (
    <div className="min-h-screen bg-[#03030a] text-slate-100 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <FileText size={16} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings Reviewer</h1>
          <span className="px-2 py-0.5 text-xs bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded font-mono">
            AI AGENT
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          Reviews a company's latest earnings against your original investment thesis. Assesses whether the thesis
          remains intact, has weakened, or materially changed based on financial results and guidance.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/80">
          <Info size={12} />
          Educational analysis only. Not financial advice. Verify all data independently.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input Panel ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Ticker Selection */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Company
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {SUPPORTED_TICKERS.map(sym => (
                <button
                  key={sym}
                  onClick={() => handleTickerChange(sym)}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-semibold transition-all ${
                    ticker === sym
                      ? 'bg-blue-500/25 border border-blue-500/50 text-blue-300'
                      : 'border border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Position Details */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Position Details
            </label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Investment Amount ($)</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={e => setInvestmentAmount(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={e => setEntryPrice(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Entry Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>
            <div className="pt-1 border-t border-slate-700/40">
              <div className="text-xs text-slate-500">Implied position size</div>
              <div className="text-sm font-mono text-slate-300 mt-0.5">
                {shares.toFixed(1)} shares @ ${entryPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={result ? handleReset : handleRun}
            disabled={isRunning}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              result
                ? 'bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700/70'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : result ? (
              <>
                <RotateCcw size={14} />
                Reset Analysis
              </>
            ) : (
              <>
                <Search size={14} />
                Run Earnings Review
              </>
            )}
          </button>
        </div>

        {/* ── Thesis + Output Panel ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thesis Input */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Investment Thesis
            </label>
            <textarea
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              rows={5}
              placeholder="Describe your original investment thesis for this company..."
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2.5 text-sm text-slate-200 resize-none focus:outline-none focus:border-blue-500/60 leading-relaxed"
            />
          </div>

          {/* Output */}
          {error && (
            <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-red-300">Analysis Error</div>
                <div className="text-xs text-red-400/80 mt-1">{error}</div>
              </div>
            </div>
          )}

          {(isRunning || streamText) && !result && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                <div className="pulse-live w-2 h-2 rounded-full bg-blue-400" />
                Earnings Reviewer Agent is analyzing...
              </div>
              {streamText ? (
                <StreamingText text={streamText} isStreaming={isStreaming} />
              ) : (
                <AgentSkeleton lines={8} />
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4" ref={outputRef}>
              {/* Thesis Status Banner */}
              <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Thesis Assessment</div>
                    <ThesisBadge status={result.thesisStatus} large />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Confidence Score</div>
                    <div className="text-2xl font-bold font-mono text-slate-200">
                      {result.confidenceScore}/10
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">analyst confidence</div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Review */}
              {result.keyMetrics && result.keyMetrics.length > 0 && (
                <AgentSection title="Key Metrics Review" accent="blue">
                  <div className="space-y-2">
                    {result.keyMetrics.map((m, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-700/30 last:border-0">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-300">{m.metric}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-mono">Est: {m.estimate}</span>
                            <ChevronRight size={10} className="text-slate-600" />
                            <span className="text-xs font-mono text-slate-300">Act: {m.actual}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold font-mono ${
                            m.surprise.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {m.surprise}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                            m.beatMiss === 'BEAT' ? 'bg-emerald-500/15 text-emerald-400' :
                            m.beatMiss === 'MISS' ? 'bg-red-500/15 text-red-400' :
                            'bg-slate-500/15 text-slate-400'
                          }`}>
                            {m.beatMiss}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </AgentSection>
              )}

              {/* Signals */}
              {(result.positiveSignals?.length > 0 || result.negativeSignals?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.positiveSignals?.length > 0 && (
                    <AgentSection title="Positive Signals" accent="green">
                      <div className="space-y-2">
                        {result.positiveSignals.map((sig, i) => (
                          <SignalCard key={i} type="bullish" title={`Signal ${i + 1}`} body={sig} />
                        ))}
                      </div>
                    </AgentSection>
                  )}
                  {result.negativeSignals?.length > 0 && (
                    <AgentSection title="Negative Signals" accent="red">
                      <div className="space-y-2">
                        {result.negativeSignals.map((sig, i) => (
                          <SignalCard key={i} type="bearish" title={`Signal ${i + 1}`} body={sig} />
                        ))}
                      </div>
                    </AgentSection>
                  )}
                </div>
              )}

              {/* Guidance Update */}
              {result.guidanceUpdate && (
                <AgentSection title="Guidance & Forward Outlook" accent="amber">
                  <p className="text-sm text-slate-300 leading-relaxed">{result.guidanceUpdate}</p>
                </AgentSection>
              )}

              {/* Full Analysis */}
              <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Full Earnings Review
                </div>
                <StreamingText
                  text={result.fullAnalysis}
                  isStreaming={false}
                  className="text-slate-300"
                />
              </div>

              {/* Thesis Pillars */}
              {result.thesisPillars && result.thesisPillars.length > 0 && (
                <AgentSection title="Thesis Pillar Assessment" accent="purple">
                  <div className="space-y-3">
                    {result.thesisPillars.map((p, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          p.status === 'intact'   ? 'bg-emerald-500' :
                          p.status === 'weakened' ? 'bg-amber-500'   : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-300">{p.pillar}</div>
                          <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{p.assessment}</div>
                        </div>
                        <span className={`text-xs font-bold uppercase ${
                          p.status === 'intact'   ? 'text-emerald-400' :
                          p.status === 'weakened' ? 'text-amber-400'   : 'text-red-400'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </AgentSection>
              )}

              {/* Valuation Impact */}
              {result.valuationImpact && (
                <AgentSection title="Valuation Impact" accent="blue">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.valuationImpact.impliedUpside !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Implied Upside</div>
                        <div className={`text-xl font-bold font-mono ${
                          result.valuationImpact.impliedUpside >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {result.valuationImpact.impliedUpside >= 0 ? '+' : ''}{result.valuationImpact.impliedUpside.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {result.valuationImpact.revisedTargetLow && result.valuationImpact.revisedTargetHigh && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Revised Target Range</div>
                        <div className="text-base font-bold font-mono text-slate-200">
                          ${result.valuationImpact.revisedTargetLow}–${result.valuationImpact.revisedTargetHigh}
                        </div>
                      </div>
                    )}
                    {result.valuationImpact.multExpansionLikely !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Multiple Expansion</div>
                        <div className={`text-sm font-semibold ${
                          result.valuationImpact.multExpansionLikely ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {result.valuationImpact.multExpansionLikely ? 'Likely' : 'Unlikely'}
                        </div>
                      </div>
                    )}
                  </div>
                </AgentSection>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-slate-600 text-center border-t border-slate-800/60 pt-4">
                Educational analysis only. Not financial advice. This output is AI-generated based on illustrative
                data and should not be used to make investment decisions. Verify all data independently.
              </div>
            </div>
          )}

          {/* Idle state */}
          {!isRunning && !streamText && !result && !error && (
            <div className="glass-panel p-10 rounded-xl border border-slate-800/40 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={20} className="text-blue-400" />
              </div>
              <div className="text-sm font-semibold text-slate-400 mb-2">Ready to review earnings</div>
              <div className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Enter your investment thesis above, verify the position details, then click{' '}
                <span className="text-blue-400">Run Earnings Review</span> to begin analysis.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
