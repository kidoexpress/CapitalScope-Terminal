import { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Trash2, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolioStore';
import { getStockQuote, simulateLivePrice } from '../utils/api';
import { generateSparkline } from '../data/mockStocks';
import { formatCurrency, formatMarketCap, formatVolume, formatPercent } from '../utils/finance';
import StockSearch from '../components/ui/StockSearch';
import Sparkline from '../components/charts/Sparkline';
import type { StockQuote } from '../types';

interface WatchlistQuote extends StockQuote {
  sparkline: number[];
}

export default function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolioStore();
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<'symbol' | 'price' | 'changePercent' | 'marketCap' | 'volume'>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const loadQuotes = async (syms: string[]) => {
    const results: Record<string, WatchlistQuote> = {};
    await Promise.all(syms.map(async sym => {
      const q = await getStockQuote(sym);
      if (q) {
        results[sym] = {
          ...q,
          sparkline: generateSparkline(sym, q.price),
        };
      }
    }));
    setQuotes(results);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadQuotes(watchlist); }, [watchlist.join(',')]);

  // Live price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuotes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(sym => {
          const q = updated[sym];
          const newPrice = simulateLivePrice(q.price, 0.0006);
          const diff = newPrice - q.previousClose;
          updated[sym] = {
            ...q,
            price: newPrice,
            change: diff,
            changePercent: (diff / q.previousClose) * 100,
          };
        });
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuotes(watchlist);
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = Object.values(quotes).sort((a, b) => {
    let va: number | string = sortKey === 'symbol' ? a.symbol : a[sortKey];
    let vb: number | string = sortKey === 'symbol' ? b.symbol : b[sortKey];
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const SortIcon = ({ k }: { k: typeof sortKey }) => {
    if (sortKey !== k) return <span className="text-[8px]" style={{ color: '#334155' }}>⇅</span>;
    return <span className="text-[8px]" style={{ color: '#6366f1' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const gainers = sorted.filter(q => q.changePercent > 0).length;
  const losers = sorted.filter(q => q.changePercent < 0).length;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>WATCHING</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#e2e8f0' }}>{watchlist.length}</div>
          <div className="text-[10px]" style={{ color: '#475569' }}>stocks tracked</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>GAINERS</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#10b981' }}>{gainers}</div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#065f46' }}>
            <TrendingUp size={10} /> in the green
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>LOSERS</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#ef4444' }}>{losers}</div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: '#7f1d1d' }}>
            <TrendingDown size={10} /> in the red
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>MARKET MOOD</div>
          <div className="text-xl font-mono font-bold" style={{ color: gainers > losers ? '#10b981' : '#ef4444' }}>
            {gainers > losers ? 'Bullish' : gainers < losers ? 'Bearish' : 'Mixed'}
          </div>
          <div className="text-[10px]" style={{ color: '#475569' }}>
            {gainers}/{watchlist.length} advancing
          </div>
        </div>
      </div>

      {/* Add + Refresh */}
      <div className="flex items-center gap-3">
        <StockSearch
          onSelect={sym => addToWatchlist(sym)}
          placeholder="Add ticker to watchlist..."
          className="w-72"
        />
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.06)', color: '#64748b', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#334155' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
          Prices updating live
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
              {[
                { key: 'symbol', label: 'Symbol' },
                { key: null, label: '7-Day' },
                { key: 'price', label: 'Price' },
                { key: 'changePercent', label: 'Change' },
                { key: 'volume', label: 'Volume' },
                { key: 'marketCap', label: 'Mkt Cap' },
                { key: null, label: 'P/E' },
                { key: null, label: 'Beta' },
                { key: null, label: '52W Range' },
                { key: null, label: '' },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: '#334155', cursor: key ? 'pointer' : 'default' }}
                  onClick={() => key && handleSort(key as typeof sortKey)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon k={key as typeof sortKey} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(7)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-4 py-2.5">
                    <div className="shimmer h-6 rounded" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-xs" style={{ color: '#334155' }}>
                Your watchlist is empty. Search and add tickers above.
              </td></tr>
            ) : (
              sorted.map(q => {
                const range52 = q.high52w - q.low52w;
                const rangePos = range52 > 0 ? ((q.price - q.low52w) / range52) * 100 : 50;
                return (
                  <tr
                    key={q.symbol}
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.04)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Star size={10} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                        <div>
                          <div className="text-xs font-mono font-bold" style={{ color: '#e2e8f0' }}>{q.symbol}</div>
                          <div className="text-[9px] max-w-[100px] truncate" style={{ color: '#334155' }}>{q.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Sparkline data={q.sparkline} positive={q.changePercent >= 0} width={70} height={28} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#e2e8f0' }}>
                      {formatCurrency(q.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {q.changePercent >= 0
                          ? <TrendingUp size={10} style={{ color: '#10b981' }} />
                          : <TrendingDown size={10} style={{ color: '#ef4444' }} />}
                        <span className="text-xs font-mono font-semibold" style={{ color: q.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatPercent(q.changePercent)}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono" style={{ color: q.change >= 0 ? '#065f46' : '#7f1d1d' }}>
                        {q.change >= 0 ? '+' : ''}{formatCurrency(q.change)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#64748b' }}>
                      {formatVolume(q.volume)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#64748b' }}>
                      {formatMarketCap(q.marketCap)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#64748b' }}>
                      {q.peRatio > 0 ? q.peRatio.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: q.beta > 1.3 ? '#f59e0b' : '#64748b' }}>
                      {q.beta.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono shrink-0" style={{ color: '#334155' }}>{formatCurrency(q.low52w)}</span>
                        <div className="w-14 h-1 rounded-full" style={{ background: 'rgba(99,102,241,0.1)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, rangePos))}%`, background: '#6366f1' }}
                          />
                        </div>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: '#334155' }}>{formatCurrency(q.high52w)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/analyzer?ticker=${q.symbol}`)}
                          className="w-6 h-6 flex items-center justify-center rounded transition-all"
                          style={{ color: '#334155' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6366f1'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          title="Analyze"
                        >
                          <Eye size={11} />
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(q.symbol)}
                          className="w-6 h-6 flex items-center justify-center rounded transition-all"
                          style={{ color: '#334155' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          title="Remove"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
