import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, Search, Command } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { STOCK_DATABASE } from '../../data/mockStocks';

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/':                  { title: 'CapitalScope',    crumb: 'Home'        },
  '/analyzer':          { title: 'Stock Analyzer',  crumb: 'Analyzer'    },
  '/portfolio':         { title: 'Portfolio',       crumb: 'Builder'     },
  '/risk':              { title: 'Risk',             crumb: 'Dashboard'   },
  '/montecarlo':        { title: 'Monte Carlo',      crumb: 'Lab'         },
  '/scenarios':         { title: 'Scenarios',        crumb: 'Simulator'   },
  '/watchlist':         { title: 'Watchlist',        crumb: 'Tracker'     },
  '/agents/earnings':   { title: 'Earnings Reviewer', crumb: 'AI Agent'  },
  '/agents/research':   { title: 'Market Research',  crumb: 'AI Agent'   },
  '/agents/model':      { title: 'Model Builder',    crumb: 'AI Agent'   },
  '/research':          { title: 'Deep Dive',    crumb: 'Research'  },
  '/scanner':           { title: 'Gold Scanner', crumb: 'Discovery' },
  '/terminal':          { title: 'Terminal',         crumb: 'Command Mode'},
};

const ALL_TICKERS = Object.keys(STOCK_DATABASE);

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname] ?? { title: 'CapitalScope', crumb: '' };

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 1
    ? ALL_TICKERS.filter(t =>
        t.includes(query.toUpperCase()) ||
        (STOCK_DATABASE[t]?.name ?? '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setFocused(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (ticker: string) => {
    navigate(`/analyzer?ticker=${ticker}`);
    setQuery('');
    setOpen(false);
    setFocused(false);
  };

  return (
    <header
      className="shrink-0 flex items-center gap-4 px-5"
      style={{
        height: 52,
        background: 'rgba(9,9,14,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Page title */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>
          {meta.title}
        </span>
        {meta.crumb && (
          <>
            <span style={{ color: 'var(--text-off)', fontSize: 13 }}>/</span>
            <span className="text-xs" style={{ color: 'var(--text-lo)' }}>{meta.crumb}</span>
          </>
        )}
      </div>

      {/* Search */}
      <div ref={containerRef} className="flex-1 max-w-sm relative">
        <div
          className="flex items-center gap-2 rounded-xl px-3 transition-all duration-200"
          style={{
            height: 34,
            background: focused ? 'var(--bg-raised)' : 'var(--bg-surface)',
            border: `1px solid ${focused ? 'var(--border-strong)' : 'var(--border-dim)'}`,
          }}
        >
          <Search size={13} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            placeholder="Search ticker or company…"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-hi)', caretColor: 'var(--accent)' }}
          />
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Command size={9} style={{ color: 'var(--text-lo)' }} />
            <span className="font-mono text-[9px]" style={{ color: 'var(--text-lo)' }}>K</span>
          </div>
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div
            className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-soft)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {results.map(ticker => {
              const stock = STOCK_DATABASE[ticker];
              return (
                <button
                  key={ticker}
                  onClick={() => handleSelect(ticker)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="font-mono text-xs font-bold w-12 shrink-0" style={{ color: 'var(--accent)' }}>
                    {ticker}
                  </span>
                  <span className="text-xs truncate" style={{ color: 'var(--text-mid)' }}>
                    {stock?.name ?? ticker}
                  </span>
                  <span className="ml-auto text-[10px]" style={{ color: 'var(--text-lo)' }}>
                    {stock?.sector ?? ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1">
        {/* Market status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 rounded-lg mr-2"
          style={{
            height: 28,
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.14)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: 'var(--green)' }} />
          <span className="font-mono text-[10px] font-semibold" style={{ color: 'rgba(34,197,94,0.8)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {[Bell, Settings].map((Icon, i) => (
          <button
            key={i}
            className="flex items-center justify-center rounded-lg transition-all"
            style={{ width: 32, height: 32, color: 'var(--text-lo)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-lo)'; }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </header>
  );
}
