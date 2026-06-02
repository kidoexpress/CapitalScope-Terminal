import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { Portfolio, TradeRequest } from '../../types/portfolio';

interface Props {
  portfolio: Portfolio | null;
  onTrade: (trade: TradeRequest) => Promise<void>;
  loading?: boolean;
}

export default function TradePanel({ portfolio, onTrade, loading }: Props) {
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [ticker, setTicker] = useState('AAPL');
  const [shares, setShares] = useState(1);
  const previewPrice = useMemo(() => portfolio?.holdings.find(h => h.ticker === ticker.toUpperCase())?.currentPrice ?? 0, [portfolio, ticker]);
  const estimated = previewPrice * shares;

  const submit = async () => {
    await onTrade({ action, ticker: ticker.toUpperCase(), shares });
  };

  return (
    <aside className="workflow-card paper-trade-panel">
      <div className="workflow-card-header">
        <div>
          <span className="label-upper">Trade Panel</span>
          <h2>Virtual Order</h2>
        </div>
      </div>

      <div className="segmented-control paper-action-toggle">
        <button className={action === 'buy' ? 'active' : ''} onClick={() => setAction('buy')}><ArrowUpRight size={14} /> Buy</button>
        <button className={action === 'sell' ? 'active' : ''} onClick={() => setAction('sell')}><ArrowDownRight size={14} /> Sell</button>
      </div>

      <label className="model-field">
        Ticker
        <input value={ticker} onChange={event => setTicker(event.target.value.toUpperCase())} placeholder="AAPL" />
      </label>
      <label className="model-field">
        Quantity
        <input type="number" min={0.0001} step={0.01} value={shares} onChange={event => setShares(Number(event.target.value))} />
      </label>

      <div className="paper-order-preview">
        <span>Estimated {action === 'buy' ? 'cost' : 'proceeds'}</span>
        <strong>{previewPrice ? `$${estimated.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Live quote on submit'}</strong>
        <p>Trades execute against Yahoo Finance latest available price. Educational simulation only.</p>
      </div>

      <button className="workflow-primary-action" disabled={!portfolio || loading || !ticker || shares <= 0} onClick={submit}>
        Confirm {action === 'buy' ? 'Buy' : 'Sell'}
      </button>
    </aside>
  );
}

