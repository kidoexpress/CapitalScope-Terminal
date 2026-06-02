// ============================================================
// Market Research Agent
// Generates institutional-style research briefings for stocks
// Analyst sentiment, bullish/bearish signals, comparison table
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { BarChart2, Search, Info, RotateCcw, Plus, X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { runMarketResearch, type MarketResearchParams } from '../../services/claudeService';
import { getAnalystRatings, getRatingBreakdown, type AnalystRating } from '../../services/analystRatingsService';
import { StreamingText, AgentSection, SignalCard, AgentSkeleton } from '../../components/agents/StreamingText';
import { COMPANY_FUNDAMENTALS } from '../../data/financialData';

const ALL_TICKERS = Object.keys(COMPANY_FUNDAMENTALS);

type ResearchFocus = 'comprehensive' | 'valuation' | 'growth' | 'competitive' | 'catalyst';

const FOCUS_OPTIONS: { value: ResearchFocus; label: string; desc: string }[] = [
  { value: 'comprehensive', label: 'Full Coverage',      desc: 'Complete institutional research briefing' },
  { value: 'valuation',     label: 'Valuation Deep-Dive', desc: 'Multiples, DCF assumptions, peer comps' },
  { value: 'growth',        label: 'Growth Analysis',    desc: 'Revenue drivers, TAM, expansion vectors' },
  { value: 'competitive',   label: 'Competitive Moat',   desc: 'Industry position, barriers to entry' },
  { value: 'catalyst',      label: 'Near-Term Catalysts', desc: 'Upcoming events, earnings, product launches' },
];

export default function MarketResearchAgent() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['AAPL', 'MSFT']);
  const [focus, setFocus] = useState<ResearchFocus>('comprehensive');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'medium' | 'long'>('medium');
  const [customQuery, setCustomQuery] = useState('');
  const [includeComps, setIncludeComps] = useState(true);

  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, AnalystRating>>({});
  const [done, setDone] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const toggleTicker = (sym: string) => {
    setSelectedTickers(prev =>
      prev.includes(sym)
        ? prev.filter(t => t !== sym)
        : prev.length < 5 ? [...prev, sym] : prev
    );
  };

  const handleRun = useCallback(async () => {
    if (selectedTickers.length === 0) return;
    setIsRunning(true);
    setIsStreaming(true);
    setOutput('');
    setDone(false);
    setError(null);

    // Fetch analyst ratings in parallel
    const ratingPromises = selectedTickers.map(sym =>
      getAnalystRatings(sym).then(r => r ? [sym, r] as [string, AnalystRating] : null)
    );
    const ratingResults = await Promise.all(ratingPromises);
    const ratingMap: Record<string, AnalystRating> = {};
    ratingResults.forEach(r => { if (r) ratingMap[r[0]] = r[1]; });
    setRatings(ratingMap);

    const params: MarketResearchParams = {
      symbols: selectedTickers,
      focus,
      timeHorizon,
      customQuery: customQuery.trim() || undefined,
      includeComps,
    };

    try {
      await runMarketResearch(params, (chunk) => {
        setOutput(prev => prev + chunk);
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Research generation failed');
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [selectedTickers, focus, timeHorizon, customQuery, includeComps]);

  const handleReset = () => {
    setOutput('');
    setDone(false);
    setError(null);
    setRatings({});
  };

  return (
    <div className="min-h-screen bg-[#03030a] text-slate-100 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <BarChart2 size={16} className="text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Market Research Agent</h1>
          <span className="px-2 py-0.5 text-xs bg-purple-500/15 border border-purple-500/30 text-purple-400 rounded font-mono">
            AI AGENT
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          Generates institutional-grade equity research briefings. Select up to 5 tickers and a research focus
          to receive analyst sentiment, bullish/bearish signal analysis, and peer comparison.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/80">
          <Info size={12} />
          Educational analysis only. Not financial advice. Analyst ratings may be illustrative estimates.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input Panel ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Ticker Selection */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Companies
              </label>
              <span className="text-xs text-slate-600">{selectedTickers.length}/5 selected</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {ALL_TICKERS.map(sym => {
                const selected = selectedTickers.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() => toggleTicker(sym)}
                    disabled={!selected && selectedTickers.length >= 5}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-semibold transition-all relative ${
                      selected
                        ? 'bg-purple-500/25 border border-purple-500/50 text-purple-300'
                        : 'border border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300 disabled:opacity-40'
                    }`}
                  >
                    {sym}
                    {selected && <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center"><span className="text-white" style={{fontSize:'7px'}}>✓</span></span>}
                  </button>
                );
              })}
            </div>
            {selectedTickers.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700/40">
                {selectedTickers.map(sym => (
                  <span key={sym} className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 rounded text-xs text-purple-300 font-mono">
                    {sym}
                    <button onClick={() => toggleTicker(sym)} className="hover:text-white"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Research Focus */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Research Focus
            </label>
            <div className="space-y-1.5">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFocus(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    focus === opt.value
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className={`mt-0.5 ${focus === opt.value ? 'text-purple-400/70' : 'text-slate-600'}`}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Options
            </label>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Time Horizon</label>
              <div className="flex gap-1.5">
                {(['short', 'medium', 'long'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => setTimeHorizon(h)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize transition-all ${
                      timeHorizon === h
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                        : 'border border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Include peer comparison</span>
              <button
                onClick={() => setIncludeComps(!includeComps)}
                className={`w-9 h-5 rounded-full transition-all relative ${includeComps ? 'bg-purple-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${includeComps ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Custom focus query (optional)</label>
              <input
                type="text"
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder="e.g. AI revenue exposure, China risk..."
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={done ? handleReset : handleRun}
            disabled={isRunning || selectedTickers.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              done
                ? 'bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700/70'
                : 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating research...
              </>
            ) : done ? (
              <><RotateCcw size={14} /> New Research</>
            ) : (
              <><Search size={14} /> Generate Research Briefing</>
            )}
          </button>
        </div>

        {/* ── Output Panel ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Analyst Ratings Panel */}
          {Object.keys(ratings).length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Analyst Consensus
              </div>
              <div className="space-y-3">
                {Object.entries(ratings).map(([sym, rating]) => {
                  const breakdown = getRatingBreakdown(rating);
                  const bullPct = ((rating.strongBuy + rating.buy) / rating.totalAnalysts) * 100;
                  return (
                    <div key={sym} className="border border-slate-700/40 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-200">{sym}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rating.consensus === 'Strong Buy' ? 'bg-emerald-500/15 text-emerald-400' :
                            rating.consensus === 'Buy'        ? 'bg-green-500/15 text-green-400'    :
                            rating.consensus === 'Hold'       ? 'bg-amber-500/15 text-amber-400'    :
                            'bg-red-500/15 text-red-400'
                          }`}>
                            {rating.consensus}
                          </span>
                          {rating.source === 'mock' && (
                            <span className="text-xs text-slate-600 italic">est.</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {rating.totalAnalysts} analysts · ${rating.avgTarget.toFixed(0)} avg target
                        </div>
                      </div>
                      {/* Stacked bar */}
                      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                        {breakdown.map(b => (
                          <div
                            key={b.label}
                            style={{ width: `${b.pct}%`, backgroundColor: b.color }}
                            title={`${b.label}: ${b.count}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>{bullPct.toFixed(0)}% bullish</span>
                        <span>${rating.lowTarget}–${rating.highTarget} range</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Streaming Output */}
          {(isRunning || output) && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800/60" ref={outputRef}>
              {isRunning && !output && (
                <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                  <div className="pulse-live w-2 h-2 rounded-full bg-purple-400" />
                  Market Research Agent is generating briefing...
                </div>
              )}
              {isRunning && !output ? (
                <AgentSkeleton lines={10} />
              ) : (
                <>
                  {isRunning && (
                    <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                      <div className="pulse-live w-2 h-2 rounded-full bg-purple-400" />
                      Streaming research output...
                    </div>
                  )}
                  <StreamingText text={output} isStreaming={isStreaming} className="text-slate-300" />
                </>
              )}
            </div>
          )}

          {/* Comparison Table */}
          {done && selectedTickers.length > 1 && includeComps && (
            <AgentSection title="Peer Snapshot" accent="purple">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/40">
                      <th className="text-left py-2 pr-4">Ticker</th>
                      <th className="text-right py-2 px-2">Sector</th>
                      <th className="text-right py-2 px-2">Rev Growth</th>
                      <th className="text-right py-2 px-2">EBITDA Mrg</th>
                      <th className="text-right py-2 px-2">FCF Mrg</th>
                      <th className="text-right py-2 pl-2">Analyst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTickers.map(sym => {
                      const fund = COMPANY_FUNDAMENTALS[sym];
                      const rating = ratings[sym];
                      if (!fund) return null;
                      const lastIncome = fund.incomeStatements[0];
                      const lastCF = fund.cashFlows[0];
                      return (
                        <tr key={sym} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                          <td className="py-2 pr-4 font-mono font-bold text-slate-200">{sym}</td>
                          <td className="text-right py-2 px-2 text-slate-400">{fund.sector}</td>
                          <td className={`text-right py-2 px-2 font-mono ${lastIncome?.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {lastIncome?.revenueGrowth !== undefined ? `${lastIncome.revenueGrowth >= 0 ? '+' : ''}${lastIncome.revenueGrowth.toFixed(1)}%` : '—'}
                          </td>
                          <td className="text-right py-2 px-2 font-mono text-slate-300">
                            {lastIncome?.ebitdaMargin !== undefined ? `${lastIncome.ebitdaMargin.toFixed(1)}%` : '—'}
                          </td>
                          <td className="text-right py-2 px-2 font-mono text-slate-300">
                            {lastCF?.fcfMargin !== undefined ? `${lastCF.fcfMargin.toFixed(1)}%` : '—'}
                          </td>
                          <td className="text-right py-2 pl-2">
                            {rating ? (
                              <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                rating.consensus === 'Strong Buy' ? 'bg-emerald-500/15 text-emerald-400' :
                                rating.consensus === 'Buy'        ? 'bg-green-500/15 text-green-400'    :
                                rating.consensus === 'Hold'       ? 'bg-amber-500/15 text-amber-400'    :
                                'bg-red-500/15 text-red-400'
                              }`}>
                                {rating.consensus}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AgentSection>
          )}

          {done && (
            <div className="text-xs text-slate-600 text-center border-t border-slate-800/60 pt-4">
              Educational analysis only. Not financial advice. Analyst ratings may reflect illustrative estimates.
              Verify all data independently before making investment decisions.
            </div>
          )}

          {/* Idle state */}
          {!isRunning && !output && !error && (
            <div className="glass-panel p-10 rounded-xl border border-slate-800/40 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <BarChart2 size={20} className="text-purple-400" />
              </div>
              <div className="text-sm font-semibold text-slate-400 mb-2">Institutional Research Briefing</div>
              <div className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Select 1–5 tickers and a research focus, then click{' '}
                <span className="text-purple-400">Generate Research Briefing</span> to begin.
              </div>
            </div>
          )}

          {error && (
            <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5">
              <div className="text-sm font-semibold text-red-300 mb-1">Research Error</div>
              <div className="text-xs text-red-400/80">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
