import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Command } from 'lucide-react';
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
    <header className="topbar-shell">
      <div className="topbar-inner">
      <div className="topbar-title">
        <span>{meta.title}</span>
        {meta.crumb && (
          <>
            <small>/</small>
            <em>{meta.crumb}</em>
          </>
        )}
      </div>

      <div ref={containerRef} className="topbar-search">
        <div className={focused ? 'topbar-search-box focused' : 'topbar-search-box'}>
          <Search size={13} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            placeholder="Search ticker or company…"
            className="flex-1 bg-transparent text-xs outline-none"
          />
          <div className="topbar-kbd">
            <Command size={9} />
            <span className="font-mono text-[9px]">K</span>
          </div>
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div className="topbar-results">
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

      <div className="topbar-actions">
        <div className="market-date">
          <div className="w-1.5 h-1.5 rounded-full pulse-live" />
          <span className="font-mono text-[10px] font-semibold">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {[Bell].map((Icon, i) => (
          <button
            key={i}
            className="topbar-icon-button"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      </div>
    </header>
  );
}
