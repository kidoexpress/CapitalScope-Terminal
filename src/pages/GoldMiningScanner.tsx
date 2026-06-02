// ============================================================
// Gold Mining Scanner — AI-powered stock discovery
// Find high-potential stocks filtered by growth, quality & valuation
// ============================================================

import { useState } from 'react';
import { Zap, Filter, Shield, TrendingUp, Target, ScanSearch } from 'lucide-react';
import { runScanner } from '../services/researchService';
import type { ScannerResult, ScannerFilters } from '../services/researchService';

// ─── Constants ────────────────────────────────────────────────

const ALL_SECTORS = [
  'Technology', 'Semiconductors', 'Communication',
  'Consumer Disc.', 'Financials', 'Healthcare',
];

const DEFAULT_FILTERS: ScannerFilters = {
  sectors: [],
  minRevenueGrowth: 10,
  maxPS: 30,
  minGrossMargin: 40,
  marketCapTier: 'any',
  riskLevel: 'any',
};

const RISK_COLORS: Record<string, string> = {
  Low:    'var(--green)',
  Medium: 'var(--amber)',
  High:   'var(--red)',
};

const SCORE_BAR_COLORS: Record<string, string> = {
  growth:    'var(--green)',
  value:     'var(--accent)',
  portfolio: 'var(--amber)',
};

// ─── Sub-components ───────────────────────────────────────────

function ScoreBar({
  label, score, colorKey,
}: {
  label: string; score: number; colorKey: keyof typeof SCORE_BAR_COLORS;
}) {
  const color = SCORE_BAR_COLORS[colorKey];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(score * 10, 100)}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

function ResultCard({ item }: { item: ScannerResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="surface-card"
      style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'default' }}
    >
      {/* ── Header: rank + ticker + score ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {/* Rank badge */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{item.rank}</span>
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800, fontSize: 17,
              color: 'var(--text-hi)',
              letterSpacing: '-0.01em',
            }}>
              {item.ticker}
            </span>
            <span style={{
              fontSize: 9, color: 'var(--text-lo)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-sub)',
              padding: '2px 7px', borderRadius: 6,
              whiteSpace: 'nowrap',
            }}>
              {item.sector}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>{item.name}</p>
        </div>

        {/* Overall score */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
            {item.overallScore.toFixed(1)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-lo)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>/ 10.0</div>
        </div>
      </div>

      {/* ── Risk + why it appeared ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Shield size={11} style={{ color: RISK_COLORS[item.riskLevel], flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: RISK_COLORS[item.riskLevel], flexShrink: 0 }}>
          {item.riskLevel} Risk
        </span>
        <span style={{ fontSize: 1, color: 'var(--border-sub)' }}>|</span>
        <span style={{ fontSize: 10, color: 'var(--text-lo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.whyItAppeared.split('.')[0]}.
        </span>
      </div>

      {/* ── Score bars ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <ScoreBar label="Growth"    score={item.growthScore}       colorKey="growth"    />
        <ScoreBar label="Value"     score={item.valuationScore}    colorKey="value"     />
        <ScoreBar label="Portfolio" score={item.portfolioFitScore} colorKey="portfolio" />
      </div>

      {/* ── Key metrics ── */}
      <div style={{ display: 'flex', gap: 6 }}>
        {item.keyMetrics.map((m, i) => (
          <div
            key={i}
            style={{
              flex: 1, background: 'var(--bg-raised)', borderRadius: 8,
              padding: '7px 8px', border: '1px solid var(--border-dim)',
              minWidth: 0,
            }}
          >
            <p style={{ fontSize: 8.5, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
              {m.label}
            </p>
            <p style={{
              fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: m.positive === true
                ? 'var(--green)'
                : m.positive === false
                  ? 'var(--red)'
                  : 'var(--text-hi)',
            }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Thesis (collapsible) ── */}
      <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 12 }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            marginBottom: expanded ? 8 : 0,
          }}
        >
          <Target size={11} style={{ color: 'var(--text-lo)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Investment Thesis {expanded ? '▲' : '▼'}
          </span>
        </button>
        {expanded && (
          <p style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.75 }}>
            {item.thesisSummary}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Filter panel ─────────────────────────────────────────────

function SliderFilter({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 9, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </p>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 8.5, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>{min}{unit}</span>
        <span style={{ fontSize: 8.5, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function GoldMiningScanner() {
  const [filters, setFilters] = useState<ScannerFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [hasRun, setHasRun]   = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setHasRun(true);
    try {
      const res = await runScanner(filters);
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  const toggleSector = (s: string) => {
    setFilters(f => ({
      ...f,
      sectors: f.sectors.includes(s)
        ? f.sectors.filter(x => x !== s)
        : [...f.sectors, s],
    }));
  };

  const setRiskLevel = (r: ScannerFilters['riskLevel']) => {
    setFilters(f => ({ ...f, riskLevel: r }));
  };

  const activeSectorCount = filters.sectors.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <ScanSearch size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AI-Powered Discovery
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 5 }}>
          Gold Mining Scanner
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-lo)' }}>
          Discover high-potential stocks filtered by growth quality, margins, and valuation efficiency
        </p>
      </div>

      {/* ── Filter card ── */}
      <div className="surface-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <Filter size={13} style={{ color: 'var(--text-lo)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Scan Filters
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>

          {/* Sectors */}
          <div style={{ gridColumn: 'span 2' }}>
            <p style={{ fontSize: 9, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Sectors {activeSectorCount > 0 && <span style={{ color: 'var(--accent)' }}>({activeSectorCount} selected)</span>}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ALL_SECTORS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSector(s)}
                  style={{
                    fontSize: 10.5, padding: '5px 11px', borderRadius: 8, fontWeight: 600,
                    background: filters.sectors.includes(s) ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${filters.sectors.includes(s) ? 'var(--accent)' : 'var(--border-sub)'}`,
                    color: filters.sectors.includes(s) ? 'var(--accent)' : 'var(--text-lo)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {s}
                </button>
              ))}
              {activeSectorCount > 0 && (
                <button
                  onClick={() => setFilters(f => ({ ...f, sectors: [] }))}
                  style={{
                    fontSize: 10, padding: '5px 11px', borderRadius: 8,
                    background: 'transparent', border: '1px solid var(--border-dim)',
                    color: 'var(--text-lo)', cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Min revenue growth */}
          <SliderFilter
            label="Min Revenue Growth"
            value={filters.minRevenueGrowth}
            min={0} max={60} step={5} unit="%"
            onChange={v => setFilters(f => ({ ...f, minRevenueGrowth: v }))}
          />

          {/* Max P/S */}
          <SliderFilter
            label="Max P/S Ratio"
            value={filters.maxPS}
            min={2} max={60} step={2} unit="×"
            onChange={v => setFilters(f => ({ ...f, maxPS: v }))}
          />

          {/* Min gross margin */}
          <SliderFilter
            label="Min Gross Margin"
            value={filters.minGrossMargin}
            min={0} max={90} step={5} unit="%"
            onChange={v => setFilters(f => ({ ...f, minGrossMargin: v }))}
          />

          {/* Risk level */}
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Risk Level
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(['any', 'low', 'medium', 'high'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRiskLevel(r)}
                  style={{
                    height: 28, borderRadius: 8, fontSize: 10, fontWeight: 600,
                    background: filters.riskLevel === r ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${filters.riskLevel === r ? 'var(--accent)' : 'var(--border-sub)'}`,
                    color: filters.riskLevel === r ? 'var(--accent)' : 'var(--text-lo)',
                    cursor: 'pointer', transition: 'all 0.12s',
                    textTransform: 'capitalize',
                  }}
                >
                  {r === 'any' ? 'Any Risk' : `${r.charAt(0).toUpperCase()}${r.slice(1)} Only`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-dim)' }}>
          <button
            onClick={handleScan}
            disabled={loading}
            style={{
              height: 40, paddingInline: 24, borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              color: loading ? 'var(--accent)' : '#fff',
              border: 'none', cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Scanning…
              </>
            ) : (
              <>
                <Zap size={13} />
                Run Scan
              </>
            )}
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-lo)', lineHeight: 1.5 }}>
            {activeSectorCount === 0 ? 'All sectors' : filters.sectors.join(', ')}
            {' · '}Growth ≥{filters.minRevenueGrowth}%
            {' · '}P/S ≤{filters.maxPS}×
            {' · '}Margin ≥{filters.minGrossMargin}%
          </p>
        </div>
      </div>

      {/* ── Results ── */}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="shimmer" style={{ height: 340, borderRadius: 16 }} />
          ))}
        </div>
      )}

      {!loading && hasRun && results.length === 0 && (
        <div className="surface-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <TrendingUp size={40} strokeWidth={1} style={{ color: 'var(--text-lo)', margin: '0 auto 14px', display: 'block' }} />
          <p style={{ color: 'var(--text-mid)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            No stocks matched your filters
          </p>
          <p style={{ color: 'var(--text-lo)', fontSize: 12 }}>
            Try broadening your criteria — lower the min growth requirement or raise the max P/S.
          </p>
        </div>
      )}

      {!loading && !hasRun && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 0', opacity: 0.4 }}>
          <ScanSearch size={28} strokeWidth={1} style={{ color: 'var(--text-lo)' }} />
          <p style={{ fontSize: 13, color: 'var(--text-lo)' }}>Set your filters and run the scan to discover opportunities</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>
              {results.length} opportunities identified — ranked by overall score
            </span>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
            {results.map(r => <ResultCard key={r.ticker} item={r} />)}
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 10, color: 'var(--text-off)', textAlign: 'center', paddingBottom: 8, lineHeight: 1.65 }}>
            Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.
          </p>
        </>
      )}
    </div>
  );
}
