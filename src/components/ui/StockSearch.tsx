import { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { searchStocks } from '../../utils/api';
import { POPULAR_TICKERS, STOCK_DATABASE } from '../../data/mockStocks';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search ticker or company...', className = '' }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string; sector: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const r = searchStocks(query);
      setResults(r);
      setOpen(true);
    } else {
      // Show popular tickers
      setResults(POPULAR_TICKERS.slice(0, 8).map(s => ({
        symbol: s,
        name: STOCK_DATABASE[s]?.name || s,
        sector: STOCK_DATABASE[s]?.sector || 'Technology',
      })));
      setOpen(focused);
    }
  }, [query, focused]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0].symbol);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(12,12,26,0.8)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.15)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
        }}
      >
        <Search size={14} style={{ color: '#475569', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none font-mono"
          style={{ color: '#e2e8f0', caretColor: '#6366f1', minWidth: 0 }}
        />
        {query && (
          <button onClick={() => setQuery('')}>
            <X size={12} style={{ color: '#475569' }} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(8,8,20,0.98)',
            border: '1px solid rgba(99,102,241,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {!query && (
            <div className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold tracking-wider" style={{ color: '#334155', letterSpacing: '0.1em' }}>
              POPULAR TICKERS
            </div>
          )}
          {results.map((r) => {
            const stock = STOCK_DATABASE[r.symbol];
            const change = stock?.changePercent ?? 0;
            return (
              <button
                key={r.symbol}
                onMouseDown={() => handleSelect(r.symbol)}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-100"
                style={{ color: '#e2e8f0' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div className="w-9 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <span className="text-[10px] font-mono font-bold" style={{ color: '#a5b4fc' }}>{r.symbol.slice(0, 4)}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold font-mono" style={{ color: '#e2e8f0' }}>{r.symbol}</div>
                  <div className="text-[10px] truncate" style={{ color: '#475569' }}>{r.name}</div>
                </div>
                <div className="text-right shrink-0">
                  {stock?.price && (
                    <div className="text-xs font-mono" style={{ color: '#94a3b8' }}>${stock.price.toFixed(2)}</div>
                  )}
                  {change !== undefined && (
                    <div className="flex items-center gap-0.5 justify-end">
                      {change >= 0 ? <TrendingUp size={9} style={{ color: '#10b981' }} /> : <TrendingDown size={9} style={{ color: '#ef4444' }} />}
                      <span className="text-[10px] font-mono" style={{ color: change >= 0 ? '#10b981' : '#ef4444' }}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
