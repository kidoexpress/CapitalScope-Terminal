import { useEffect, useState } from 'react';
import { MARKET_INDICES } from '../../data/mockStocks';

export default function MarketTicker() {
  const [indices, setIndices] = useState(MARKET_INDICES);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(prev => prev.map(idx => ({
        ...idx,
        price:  idx.price  * (1 + (Math.random() - 0.5) * 0.0018),
        change: idx.change + (Math.random() - 0.5) * 0.03,
      })));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const items = [...indices, ...indices];

  return (
    <div
      className="h-7 overflow-hidden flex items-center shrink-0"
      style={{ background: 'rgba(7,7,11,0.98)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* LIVE badge */}
      <div
        className="flex items-center gap-1.5 px-3 shrink-0"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live" />
        <span className="font-mono text-[10px] font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>LIVE</span>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden flex-1">
        <div className="ticker-scroll flex items-center gap-0 whitespace-nowrap w-fit">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4"
              style={{ borderRight: '1px solid rgba(255,255,255,0.04)', height: 28 }}
            >
              <span className="font-mono text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.symbol}</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {item.symbol === 'EUR/USD'
                  ? item.price.toFixed(4)
                  : item.price >= 1000
                    ? item.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : item.price.toFixed(2)}
              </span>
              <span
                className="font-mono text-[10px]"
                style={{ color: item.change >= 0 ? 'rgba(34,197,94,0.85)' : 'rgba(244,63,94,0.85)' }}
              >
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
