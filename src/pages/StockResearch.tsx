// ============================================================
// Stock Research Report — 4-Part Deep Dive + Peer Comparison
// Light-mode document aesthetic inside dark app shell
// ============================================================

import { useState } from 'react';
import { Zap, AlertTriangle, FileSearch } from 'lucide-react';
import { generateDeepDive, buildPeerComparison } from '../services/researchService';
import type {
  DeepDiveResult, PeerRow, DeepDiveParams, ResearchBullet, ResearchSection,
} from '../services/researchService';

// ─── Light-mode document tokens ─────────────────────────────
const D = {
  bg:     '#f7f6f2',
  card:   '#ffffff',
  border: '#e8e7e3',
  hi:     '#111827',
  mid:    '#374151',
  lo:     '#6b7280',
  xlo:    '#9ca3af',
};

const BULLET_DOT: Record<string, string> = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  orange: '#f97316',
  red:    '#ef4444',
  purple: '#a855f7',
};

const SECT_ACCENT = ['#2563eb', '#7c3aed', '#16a34a', '#d97706'];
const SECT_TINT   = ['#dbeafe', '#ede9fe', '#dcfce7', '#fef3c7'];

const SCORE_PILL: Record<string, React.CSSProperties> = {
  Best:    { background: '#dcfce7', color: '#15803d' },
  Peer:    { background: '#fef9c3', color: '#92400e' },
  Premium: { background: '#fee2e2', color: '#b91c1c' },
  'N/A':   { background: '#f1f5f9', color: '#64748b' },
};

const HORIZONS: Array<DeepDiveParams['horizon']> = ['1Y', '3Y', '5Y', '10Y'];

const RISK_LEVELS: Array<{ value: DeepDiveParams['riskTolerance']; label: string }> = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate',     label: 'Moderate'     },
  { value: 'aggressive',   label: 'Aggressive'   },
];

// ─── Form primitives ─────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--text-lo)', marginBottom: 5,
    }}>
      {children}
    </p>
  );
}

function StyledInput({
  value, onChange, placeholder, mono = true,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full outline-none rounded-lg px-3"
      style={{
        height: 34,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-sub)',
        color: 'var(--text-hi)',
        fontSize: 12,
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'system-ui, sans-serif',
      }}
    />
  );
}

// ─── Document sub-components ─────────────────────────────────

function DocMetricTile({ label, value, note, positive }: {
  label: string; value: string; note: string; positive?: boolean;
}) {
  return (
    <div style={{
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{ fontSize: 9, color: D.lo, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 19, fontWeight: 800, color: positive === false ? '#dc2626' : D.hi, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 10, color: D.lo }}>{note}</p>
    </div>
  );
}

function BulletItem({ bullet }: { bullet: ResearchBullet }) {
  const dot = BULLET_DOT[bullet.color] ?? '#6b7280';
  return (
    <div style={{ display: 'flex', gap: 12, padding: '13px 0', borderBottom: `1px solid ${D.border}` }}>
      <div style={{ paddingTop: 6, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: D.hi, marginBottom: 5, lineHeight: 1.4 }}>{bullet.title}</p>
        <p style={{ fontSize: 12.5, color: D.mid, lineHeight: 1.75 }}>{bullet.body}</p>
      </div>
    </div>
  );
}

function SectionCard({ section, idx }: { section: ResearchSection; idx: number }) {
  const accent = SECT_ACCENT[idx] ?? '#2563eb';

  return (
    <div style={{
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderBottom: `1px solid ${D.border}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>{idx + 1}</span>
        </div>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: D.hi, letterSpacing: '-0.01em' }}>{section.title}</h3>
      </div>

      {/* Bullets */}
      <div style={{ padding: '0 20px' }}>
        {section.bullets.length > 0
          ? section.bullets.map((b, i) => <BulletItem key={i} bullet={b} />)
          : (
            <p style={{ fontSize: 11.5, color: D.lo, padding: '14px 0' }}>
              Analysis not extracted for this section.
            </p>
          )
        }
      </div>
    </div>
  );
}

function PeerTable({ rows }: { rows: PeerRow[] }) {
  if (!rows.length) return null;
  const COL_HEADERS = ['#', 'Ticker', 'Company', 'P/S TTM', 'Fwd P/S', 'EV/EBITDA', 'Gr. Margin', 'YoY Growth', 'V/G Score'];

  return (
    <div style={{
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${D.border}` }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: D.hi, marginBottom: 3 }}>Peer Comparison</h3>
        <p style={{ fontSize: 10.5, color: D.lo }}>
          Value/Growth Score = P/S TTM ÷ YoY Revenue Growth % — lower is more efficient
        </p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          <thead>
            <tr style={{ background: '#faf9f6' }}>
              {COL_HEADERS.map(h => (
                <th key={h} style={{
                  padding: '8px 12px',
                  textAlign: h === 'Company' ? 'left' : 'center',
                  color: D.lo, fontWeight: 600,
                  borderBottom: `1px solid ${D.border}`,
                  whiteSpace: 'nowrap', fontSize: 9.5,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const gmNum = parseFloat(row.grossMargin);
              return (
                <tr
                  key={row.ticker}
                  style={{
                    background: row.isMain ? '#f0f7ff' : 'transparent',
                    borderBottom: `1px solid ${D.border}`,
                  }}
                >
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: D.lo }}>{row.rank}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: row.isMain ? 800 : 600, color: row.isMain ? '#1d4ed8' : D.hi }}>{row.ticker}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', color: D.mid, fontFamily: 'system-ui, sans-serif', fontSize: 12, whiteSpace: 'nowrap' }}>{row.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: D.hi, fontWeight: 600 }}>{row.psTTM}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: D.mid }}>{row.forwardPS}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: D.mid }}>{row.evEbitda}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: !isNaN(gmNum) && gmNum > 60 ? '#15803d' : D.mid, fontWeight: !isNaN(gmNum) && gmNum > 60 ? 700 : 400 }}>{row.grossMargin}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: row.yoyGrowth.startsWith('+') ? '#15803d' : row.yoyGrowth.startsWith('-') ? '#b91c1c' : D.mid, fontWeight: 600 }}>{row.yoyGrowth}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      ...SCORE_PILL[row.scoreLabel],
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}>
                      {row.valueGrowthScore} · {row.scoreLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── State panels ─────────────────────────────────────────────

function EmptyDoc() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, opacity: 0.45 }}>
      <FileSearch size={52} strokeWidth={1} style={{ color: 'var(--text-lo)' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Enter a ticker and run a deep dive</p>
        <p style={{ color: 'var(--text-lo)', fontSize: 12 }}>4-part analysis: Business Model · Moat · Catalysts · Asymmetry</p>
      </div>
    </div>
  );
}

function LoadingDoc({ ticker, progress }: { ticker: string; progress: string }) {
  return (
    <div style={{ background: D.bg, borderRadius: 16, padding: '28px 32px' }}>
      {/* Animated header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div className="shimmer" style={{ width: 100, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: 80, height: 22, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
            {progress || `Analyzing ${ticker.toUpperCase()}…`}
          </span>
        </div>
      </div>
      {/* Metric shimmer */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ flex: 1, height: 72, borderRadius: 10 }} />)}
      </div>
      {/* Section shimmer */}
      {[180, 220, 200, 190].map((h, i) => (
        <div key={i} className="shimmer" style={{ height: h, borderRadius: 12, marginBottom: 14 }} />
      ))}
    </div>
  );
}

function ReportDocument({ result, peers }: { result: DeepDiveResult; peers: PeerRow[] }) {
  return (
    <div style={{ background: D.bg, borderRadius: 16, padding: '28px 32px' }}>
      {/* ── Document header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${D.border}`, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 800, color: D.hi, letterSpacing: '-0.03em' }}>
              {result.ticker}
            </span>
            <span style={{ fontSize: 11.5, background: '#eef2ff', color: '#4338ca', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              {result.sector}
            </span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: D.mid }}>{result.companyName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, color: D.lo, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Analysis Date</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: D.hi, fontFamily: 'JetBrains Mono, monospace' }}>{result.analysisDate}</p>
          <p style={{ fontSize: 10, color: D.lo, marginTop: 2 }}>Educational Analysis Only</p>
        </div>
      </div>

      {/* ── Key metrics ── */}
      {result.keyMetrics.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
          {result.keyMetrics.map((m, i) => (
            <DocMetricTile key={i} label={m.label} value={m.value} note={m.note} positive={m.positive} />
          ))}
        </div>
      )}

      {/* ── 4 Research sections ── */}
      {result.sections.length > 0
        ? result.sections.map((s, i) => <SectionCard key={i} section={s} idx={s.number - 1} />)
        : (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24, marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: D.lo }}>Section data could not be parsed. Check the console for the raw output.</p>
          </div>
        )
      }

      {/* ── Thesis summary ── */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
          Investment Thesis Summary
        </p>
        <p style={{ fontSize: 13, color: D.hi, lineHeight: 1.8 }}>{result.thesisSummary}</p>
      </div>

      {/* ── Key risks ── */}
      {result.risks.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 20px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <AlertTriangle size={12} style={{ color: '#ea580c' }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
              Key Risks
            </p>
          </div>
          {result.risks.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < result.risks.length - 1 ? 9 : 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', flexShrink: 0, marginTop: 6 }} />
              <p style={{ fontSize: 12, color: D.mid, lineHeight: 1.7 }}>{r}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Peer comparison ── */}
      {peers.length > 0 && <PeerTable rows={peers} />}

      {/* ── Disclaimer ── */}
      <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 14, marginTop: 6 }}>
        <p style={{ fontSize: 10, color: D.lo, lineHeight: 1.7 }}>
          Educational analysis only. Not financial advice. This report was generated by an AI model and may contain inaccuracies. Verify all data independently before making investment decisions.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function StockResearch() {
  const [ticker, setTicker]     = useState('NVDA');
  const [comp1, setComp1]       = useState('AMD');
  const [comp2, setComp2]       = useState('INTC');
  const [thesis, setThesis]     = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [horizon, setHorizon]   = useState<DeepDiveParams['horizon']>('3Y');
  const [risk, setRisk]         = useState<DeepDiveParams['riskTolerance']>('moderate');

  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult]     = useState<DeepDiveResult | null>(null);
  const [peers, setPeers]       = useState<PeerRow[]>([]);

  const handleRun = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setProgress(`Initializing ${t} analysis…`);
    setResult(null);
    setPeers([]);

    const comp = [comp1, comp2]
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    try {
      const res = await generateDeepDive(
        {
          ticker: t,
          competitors: comp,
          thesis:           thesis     || undefined,
          horizon,
          riskTolerance:    risk,
          portfolioProfile: portfolio  || undefined,
        },
        chunk => {
          if (chunk.includes('SECTION_1')) setProgress('Analyzing business model…');
          else if (chunk.includes('SECTION_2')) setProgress('Evaluating competitive moat…');
          else if (chunk.includes('SECTION_3')) setProgress('Identifying catalysts…');
          else if (chunk.includes('SECTION_4')) setProgress('Running asymmetry analysis…');
          else if (chunk.includes('THESIS')) setProgress('Synthesizing thesis…');
        }
      );
      setResult(res);
      if (comp.length > 0) setPeers(buildPeerComparison(t, comp));
    } catch (err) {
      console.error('[StockResearch] error:', err);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', minHeight: 0 }}>

      {/* ── Left: Input form ── */}
      <div style={{ width: 288, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

        {/* Form card */}
        <div className="surface-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <p style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Deep Dive</p>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Stock Research<br />Report
            </h2>
          </div>

          {/* Primary ticker */}
          <div>
            <FieldLabel>Primary Ticker</FieldLabel>
            <StyledInput
              value={ticker}
              onChange={v => setTicker(v.toUpperCase())}
              placeholder="NVDA"
            />
          </div>

          {/* Competitors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <FieldLabel>Competitor 1</FieldLabel>
              <StyledInput value={comp1} onChange={v => setComp1(v.toUpperCase())} placeholder="AMD" />
            </div>
            <div>
              <FieldLabel>Competitor 2</FieldLabel>
              <StyledInput value={comp2} onChange={v => setComp2(v.toUpperCase())} placeholder="INTC" />
            </div>
          </div>

          {/* Time horizon */}
          <div>
            <FieldLabel>Investment Horizon</FieldLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {HORIZONS.map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  style={{
                    flex: 1, height: 28,
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    background: horizon === h ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${horizon === h ? 'var(--accent)' : 'var(--border-sub)'}`,
                    color: horizon === h ? 'var(--accent)' : 'var(--text-lo)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Risk tolerance */}
          <div>
            <FieldLabel>Risk Tolerance</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {RISK_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRisk(value)}
                  style={{
                    height: 28, borderRadius: 8, fontSize: 10, fontWeight: 600,
                    background: risk === value ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${risk === value ? 'var(--accent)' : 'var(--border-sub)'}`,
                    color: risk === value ? 'var(--accent)' : 'var(--text-lo)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Investor thesis */}
          <div>
            <FieldLabel>Investor Thesis (optional)</FieldLabel>
            <textarea
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              placeholder="e.g. AI accelerator supercycle with CUDA ecosystem lock-in…"
              rows={3}
              style={{
                width: '100%', resize: 'vertical', outline: 'none',
                background: 'var(--bg-raised)', border: '1px solid var(--border-sub)',
                borderRadius: 8, padding: '8px 10px', fontSize: 11,
                color: 'var(--text-hi)', fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.65, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Portfolio context */}
          <div>
            <FieldLabel>Portfolio Context (optional)</FieldLabel>
            <StyledInput
              value={portfolio}
              onChange={setPortfolio}
              placeholder="e.g. 60% tech, seeking diversification"
              mono={false}
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading || !ticker.trim()}
            style={{
              width: '100%', height: 40, borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              background: loading || !ticker.trim() ? 'var(--accent-dim)' : 'var(--accent)',
              color: loading || !ticker.trim() ? 'var(--accent)' : '#fff',
              border: 'none',
              cursor: loading || !ticker.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Analyzing…
              </>
            ) : (
              <>
                <Zap size={13} />
                Run Deep Dive
              </>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.14)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, color: 'rgba(245,158,11,0.75)', lineHeight: 1.65 }}>
            Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.
          </p>
        </div>
      </div>

      {/* ── Right: Document viewer ── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {loading && <LoadingDoc ticker={ticker} progress={progress} />}
        {!loading && result && <ReportDocument result={result} peers={peers} />}
        {!loading && !result && <EmptyDoc />}
      </div>
    </div>
  );
}
