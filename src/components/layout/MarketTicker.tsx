import { useEffect, useState } from 'react';
import { MARKET_INDICES } from '../../data/mockStocks';

const FOCUS_SYMBOLS = ['SPY', 'QQQ', 'BTC', 'VIX', '10Y', 'DXY'];
const SYMBOL_ALIASES: Record<string, string> = {
  'S&P 500': 'SPY',
  NASDAQ: 'QQQ',
  'BTC/USD': 'BTC',
  '10Y YIELD': '10Y',
};

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

  const normalized = indices
    .map(item => ({ ...item, symbol: SYMBOL_ALIASES[item.symbol] ?? item.symbol }))
    .filter(item => FOCUS_SYMBOLS.includes(item.symbol));
  const order = Object.fromEntries(FOCUS_SYMBOLS.map((symbol, index) => [symbol, index]));
  const items = normalized.sort((a, b) => order[a.symbol] - order[b.symbol]);

  return (
    <div className="market-strip">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-center gap-1 px-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="market-strip-item"
            >
              <span className="market-strip-symbol">{item.symbol}</span>
              <span className="market-strip-price">
                {item.symbol === 'EUR/USD'
                  ? item.price.toFixed(4)
                  : item.price >= 1000
                    ? item.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : item.price.toFixed(2)}
              </span>
              <span className={item.change >= 0 ? 'market-strip-up' : 'market-strip-down'}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
