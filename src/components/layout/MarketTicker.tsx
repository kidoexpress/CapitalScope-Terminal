import { useEffect, useState } from 'react';
import { getMarketSummary, type MarketSummaryItem } from '../../services/marketDataService';

function formatPrice(item: MarketSummaryItem) {
  if (item.price === null) return '—';
  if (item.symbol === 'DXY' || item.symbol === '10Y' || item.symbol === 'VIX') return item.price.toFixed(2);
  if (item.price >= 1000) return item.price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return item.price.toFixed(2);
}

export default function MarketTicker() {
  const [items, setItems] = useState<MarketSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(forceRefresh = false) {
    const summary = await getMarketSummary({ forceRefresh });
    setItems(summary);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="market-strip" title="Data source: Yahoo Finance">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-center gap-1 px-6">
        {(loading ? ['SPY', 'QQQ', 'BTC', 'VIX', '10Y', 'DXY'] : items.map(item => item.symbol)).map((symbol, index) => {
          const item = items.find(row => row.symbol === symbol);
          const change = item?.changePercent;
          return (
            <div key={symbol || index} className="market-strip-item">
              <span className="market-strip-symbol">{symbol}</span>
              <span className="market-strip-price">{item ? formatPrice(item) : '—'}</span>
              <span className={change === undefined || change === null || change >= 0 ? 'market-strip-up' : 'market-strip-down'}>
                {change === undefined || change === null ? 'Yahoo' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
