import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { STOCK_DATABASE } from '../../data/mockStocks';
import { MARKETS, addSuffix, displayTicker } from '../../config/markets';

interface Props {
  onSelect: (ticker: string) => void;
  placeholder?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search ticker...' }: Props) {
  const [query, setQuery] = useState('');
  const [marketId, setMarketId] = useState('US');
  const [showMarkets, setShowMarkets] = useState(false);
  const [results, setResults] = useState<{ symbol: string; name: string; sector: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const market = MARKETS.find(m => m.id === marketId) ?? MARKETS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowMarkets(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); return; }
    const q = value.toLowerCase();
    const filtered = Object.values(STOCK_DATABASE)
      .filter(s => {
        const sym = (s.symbol ?? '').toLowerCase();
        const name = (s.name ?? '').toLowerCase();
        if (marketId === 'US') {
          return !sym.includes('.') && (sym.includes(q) || name.includes(q));
        }
        return sym.endsWith(market.suffix.toLowerCase()) && (sym.includes(q) || name.includes(q) || displayTicker(sym).includes(q));
      })
      .map(s => ({ symbol: s.symbol ?? '', name: s.name ?? '', sector: s.sector ?? '' }))
      .slice(0, 8);

    // If no local results, build a live ticker from the input + suffix
    if (filtered.length === 0 && value.trim().length >= 1) {
      const rawTicker = value.trim().toUpperCase().replace(/\.(SA|L|DE|PA|T|HK)$/i, '');
      const withSuffix = addSuffix(rawTicker, marketId);
      filtered.push({ symbol: withSuffix, name: `Search: ${withSuffix}`, sector: market.name });
    }

    setResults(filtered);
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', gap: 6 }}>
      {/* Market selector button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMarkets(v => !v)}
          title={`Market: ${market.name}`}
          style={{
            height: 36, paddingInline: 10, borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', gap: 4,
            color: 'var(--color-text-primary)',
          }}
        >
          <span>{market.flag}</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{market.id}</span>
        </button>
        {showMarkets && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            {MARKETS.map(m => (
              <button
                key={m.id}
                onClick={() => { setMarketId(m.id); setShowMarkets(false); setQuery(''); setResults([]); }}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: m.id === marketId ? 'var(--color-background-secondary)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--color-text-primary)', fontSize: 13,
                }}
              >
                <span style={{ fontSize: 16 }}>{m.flag}</span>
                <span>{m.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{m.currencySymbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder={`${placeholder} (${market.currencySymbol})`}
          style={{ paddingLeft: 32 }}
        />
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 100,
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)', overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            {results.map(r => (
              <button
                key={r.symbol}
                onClick={() => handleSelect(r.symbol)}
                style={{
                  width: '100%', padding: '8px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)', minWidth: 80 }}>{displayTicker(r.symbol)}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{r.sector}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
