import { useMemo, useState } from 'react';
import type { Holding } from '../../types/portfolio';
import { formatCurrency, formatPercent, formatPrice } from '../../utils/finance';

interface Props {
  holdings: Holding[];
  totalValue: number;
  loading?: boolean;
}

type SortKey = keyof Pick<Holding, 'ticker' | 'shares' | 'avgCost' | 'currentPrice' | 'pnl' | 'pnlPct' | 'weight'>;

export default function HoldingsTable({ holdings, totalValue, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('weight');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => [...holdings].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
  }), [holdings, sortKey, sortDir]);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(dir => dir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <section className="workflow-card paper-holdings-card">
      <div className="workflow-card-header">
        <div>
          <span className="label-upper">Holdings</span>
          <h2>Open Positions</h2>
        </div>
      </div>
      {loading ? (
        <div className="shimmer h-48 rounded-2xl" />
      ) : holdings.length === 0 ? (
        <div className="intentional-empty-state"><strong>No holdings yet.</strong><span>Use the trade panel to buy AAPL, NVDA, MSFT or any listed ticker.</span></div>
      ) : (
        <div className="clean-table-wrap">
          <table className="clean-holdings-table paper-table">
            <thead>
              <tr>
                {[
                  ['ticker', 'Ticker'], ['shares', 'Shares'], ['avgCost', 'Avg Cost'], ['currentPrice', 'Current'],
                  ['pnl', 'P&L'], ['pnlPct', 'P&L %'], ['weight', 'Weight'],
                ].map(([key, label]) => (
                  <th key={key} onClick={() => changeSort(key as SortKey)}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(holding => (
                <tr key={holding.ticker}>
                  <td><strong>{holding.ticker}</strong></td>
                  <td>{holding.shares.toFixed(2)}</td>
                  <td>{formatPrice(holding.avgCost, holding.ticker)}</td>
                  <td>{formatPrice(holding.currentPrice, holding.ticker)}</td>
                  <td className={holding.pnl >= 0 ? 'positive' : 'negative'}>{formatPrice(holding.pnl, holding.ticker)}</td>
                  <td className={holding.pnlPct >= 0 ? 'positive' : 'negative'}>{formatPercent(holding.pnlPct)}</td>
                  <td>{holding.weight.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="paper-total-row">
                <td>Total</td>
                <td />
                <td />
                <td />
                <td>{formatCurrency(sorted.reduce((sum, h) => sum + h.pnl, 0))}</td>
                <td />
                <td>{formatCurrency(totalValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

