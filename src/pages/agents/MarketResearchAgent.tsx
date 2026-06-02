import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, BarChart2, Check, FileSearch, Info, RotateCcw, Search, X } from 'lucide-react';
import { runMarketResearch, type MarketResearchParams } from '../../services/claudeService';
import { getAnalystRatings, type AnalystRating } from '../../services/analystRatingsService';
import { AgentSkeleton, StreamingText } from '../../components/agents/StreamingText';
import { COMPANY_FUNDAMENTALS } from '../../data/financialData';

const ALL_TICKERS = Object.keys(COMPANY_FUNDAMENTALS);

type ResearchFocus = 'comprehensive' | 'valuation' | 'growth' | 'competitive' | 'catalyst';

const DEPTH_OPTIONS: { value: ResearchFocus; label: string; desc: string }[] = [
  { value: 'comprehensive', label: 'Full Brief', desc: 'Business, valuation, catalysts, risks' },
  { value: 'valuation', label: 'Valuation', desc: 'Multiples, margin quality, valuation pressure' },
  { value: 'growth', label: 'Growth', desc: 'Revenue drivers, market expansion, durability' },
  { value: 'competitive', label: 'Moat', desc: 'Positioning, share, barriers, substitutes' },
  { value: 'catalyst', label: 'Catalysts', desc: 'Near-term events and watch items' },
];

function SectionPreview({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="memo-section">
      <span className="label-upper">{title}</span>
      {children}
    </div>
  );
}

export default function MarketResearchAgent() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['AAPL', 'MSFT', 'NVDA']);
  const [focus, setFocus] = useState<ResearchFocus>('comprehensive');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'medium' | 'long'>('medium');
  const [customQuery, setCustomQuery] = useState('');
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

    const ratingResults = await Promise.all(
      selectedTickers.map(sym => getAnalystRatings(sym).then(r => r ? [sym, r] as [string, AnalystRating] : null))
    );
    const nextRatings: Record<string, AnalystRating> = {};
    ratingResults.forEach(item => {
      if (item) nextRatings[item[0]] = item[1];
    });
    setRatings(nextRatings);

    const params: MarketResearchParams = {
      symbols: selectedTickers,
      focus,
      timeHorizon,
      customQuery: customQuery.trim() || undefined,
      includeComps: true,
    };

    try {
      await runMarketResearch(params, chunk => {
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
  }, [selectedTickers, focus, timeHorizon, customQuery]);

  const reset = () => {
    setOutput('');
    setDone(false);
    setError(null);
    setRatings({});
  };

  return (
    <div className="workflow-page animate-fade-in-up">
      <div className="product-page-heading">
        <div>
          <p>Research Desk</p>
          <h1>Market Research Agent</h1>
        </div>
        <span>Generate an institutional-style briefing with comparisons, signals, catalysts, risks, and valuation notes.</span>
      </div>

      <div className="research-layout">
        <section className="workflow-card research-setup-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Research Setup</span>
              <h2>Brief Generator</h2>
            </div>
            <FileSearch size={20} />
          </div>

          <div className="setup-block">
            <div className="setup-label-row">
              <span>Companies</span>
              <em>{selectedTickers.length}/5 selected</em>
            </div>
            <div className="ticker-chip-grid compact">
              {ALL_TICKERS.map(sym => (
                <button
                  key={sym}
                  onClick={() => toggleTicker(sym)}
                  disabled={!selectedTickers.includes(sym) && selectedTickers.length >= 5}
                  className={`ticker-chip ${selectedTickers.includes(sym) ? 'active' : ''}`}
                >
                  {selectedTickers.includes(sym) && <Check size={11} />}
                  {sym}
                </button>
              ))}
            </div>
            <div className="selected-ticker-row">
              {selectedTickers.map(sym => (
                <button key={sym} onClick={() => toggleTicker(sym)}>
                  {sym}<X size={12} />
                </button>
              ))}
            </div>
          </div>

          <div className="setup-block">
            <span className="setup-title">Research depth</span>
            <div className="research-depth-grid">
              {DEPTH_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFocus(opt.value)} className={focus === opt.value ? 'active' : ''}>
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-two-col">
            <div className="setup-block">
              <span className="setup-title">Time horizon</span>
              <div className="segmented-control">
                {(['short', 'medium', 'long'] as const).map(h => (
                  <button key={h} onClick={() => setTimeHorizon(h)} className={timeHorizon === h ? 'active' : ''}>{h}</button>
                ))}
              </div>
            </div>
            <div className="setup-block">
              <span className="setup-title">Question</span>
              <input
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder="Optional: AI exposure, margin risk, China demand..."
              />
            </div>
          </div>

          <button onClick={done ? reset : handleRun} disabled={isRunning || selectedTickers.length === 0} className="workflow-primary-action">
            {isRunning ? <span className="button-spinner" /> : done ? <RotateCcw size={16} /> : <Search size={16} />}
            {isRunning ? 'Generating briefing...' : done ? 'New Briefing' : 'Generate Research Briefing'}
          </button>
        </section>

        <section className="workflow-card memo-preview-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Preview</span>
              <h2>Memo Structure</h2>
            </div>
            <BarChart2 size={20} />
          </div>
          <SectionPreview title="Executive Summary">
            <p>One-page desk-style view of the selected companies, market positioning, and the current risk tone.</p>
          </SectionPreview>
          <SectionPreview title="Company Comparison">
            <div className="mini-comparison-table">
              {selectedTickers.map(sym => {
                const fund = COMPANY_FUNDAMENTALS[sym];
                return (
                  <div key={sym}>
                    <strong>{sym}</strong>
                    <span>{fund?.sector ?? 'Sector'}</span>
                    <em>{fund?.keyMetrics?.peRatio ? `${fund.keyMetrics.peRatio.toFixed(1)}x P/E` : 'Valuation pending'}</em>
                  </div>
                );
              })}
            </div>
          </SectionPreview>
          <SectionPreview title="Output Sections">
            <div className="memo-tags">
              {['Analyst-Style Sentiment', 'Bullish Signals', 'Bearish Signals', 'Catalysts', 'Risks', 'Valuation Notes'].map(tag => <span key={tag}>{tag}</span>)}
            </div>
          </SectionPreview>
          <div className="workflow-disclaimer"><Info size={13} /> Synthetic analysis is labeled when real ratings are unavailable.</div>
        </section>
      </div>

      <section className="workflow-output research-output" ref={outputRef}>
        <div className="workflow-output-header">
          <div>
            <span className="label-upper">Institutional Memo</span>
            <h2>Research Briefing</h2>
          </div>
          {done && <span className="review-required">Educational only</span>}
        </div>

        {error && <div className="workflow-error"><AlertTriangle size={16} /> {error}</div>}

        {(isRunning || output) ? (
          <div className="workflow-card research-memo">
            {isRunning && !output ? (
              <>
                <div className="streaming-status"><span className="pulse-live" /> Preparing research memo...</div>
                <AgentSkeleton lines={10} />
              </>
            ) : (
              <>
                {isRunning && <div className="streaming-status"><span className="pulse-live" /> Streaming research output...</div>}
                <StreamingText text={output} isStreaming={isStreaming} />
              </>
            )}
          </div>
        ) : (
          <div className="intentional-empty-state">
            <FileSearch size={22} />
            <strong>No memo generated yet.</strong>
            <span>Select companies, choose depth, and generate a briefing.</span>
          </div>
        )}

        {Object.keys(ratings).length > 0 && (
          <div className="workflow-card analyst-strip">
            {Object.entries(ratings).map(([sym, rating]) => (
              <div key={sym}>
                <strong>{sym}</strong>
                <span>{rating.consensus}</span>
                <em>{rating.totalAnalysts} analysts · ${rating.avgTarget.toFixed(0)} avg target</em>
              </div>
            ))}
          </div>
        )}

        {done && (
          <p className="workflow-footnote">Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.</p>
        )}
      </section>
    </div>
  );
}
