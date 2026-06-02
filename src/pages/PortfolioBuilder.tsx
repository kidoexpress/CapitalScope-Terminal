import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioStore, getTotalValue, getTotalGainLoss } from '../store/portfolioStore';
import { getStockQuote } from '../utils/api';
import { formatCurrency, formatPercent, calcDiversificationScore } from '../utils/finance';
import AllocationChart from '../components/charts/AllocationChart';
import RiskReturnScatter from '../components/charts/RiskReturnScatter';
import { AIInsightPanel } from '../components/ui/AIInsightCard';
import type { AIInsight, PortfolioHolding } from '../types';
import Disclaimer from '../components/ui/Disclaimer';
import StockSearch from '../components/ui/StockSearch';
import { STOCK_DATABASE, SECTOR_COLORS } from '../data/mockStocks';

function generatePortfolioInsights(holdings: PortfolioHolding[], diversScore: number): AIInsight[] {
  const insights: AIInsight[] = [];

  const techWeight = holdings.filter(h => h.sector === 'Technology').reduce((s, h) => s + h.weight, 0);
  if (techWeight > 0.5) {
    insights.push({ type: 'warning', title: 'Technology Overexposure', body: `${(techWeight * 100).toFixed(0)}% of your portfolio is in Technology. This creates concentration risk — a tech sector correction could significantly impact your returns.` });
  }

  if (diversScore < 40) {
    insights.push({ type: 'risk', title: 'Low Diversification', body: `Your diversification score of ${diversScore}/100 suggests concentrated risk. Consider spreading across more sectors or reducing position sizes in top holdings.`, metric: `${diversScore}/100`, metricLabel: 'Diversification' });
  } else if (diversScore > 75) {
    insights.push({ type: 'opportunity', title: 'Well Diversified Portfolio', body: `Excellent diversification score of ${diversScore}/100. Your portfolio spreads risk across sectors and position sizes, which tends to reduce volatility over time.`, metric: `${diversScore}/100`, metricLabel: 'Diversification' });
  }

  const topHolder = holdings.reduce((max, h) => h.weight > max.weight ? h : max, holdings[0]);
  if (topHolder && topHolder.weight > 0.35) {
    insights.push({ type: 'warning', title: `Single-Stock Concentration Risk`, body: `${topHolder.symbol} represents ${(topHolder.weight * 100).toFixed(0)}% of your portfolio. A 20% decline in this stock alone would reduce your portfolio by ${(topHolder.weight * 20).toFixed(1)}%. Consider trimming.` });
  }

  const sectors = new Set(holdings.map(h => h.sector));
  if (sectors.size <= 2) {
    insights.push({ type: 'info', title: 'Sector Concentration', body: `Your portfolio spans only ${sectors.size} sector(s). Adding exposure to defensive sectors like Healthcare, Consumer Staples, or Utilities could reduce portfolio beta.` });
  }

  return insights;
}

interface AddHoldingForm {
  symbol: string;
  shares: number;
  avgCost: number;
  weight: number;
}

export default function PortfolioBuilder() {
  const { holdings, addHolding, removeHolding, updateWeight, normalizeWeights } = usePortfolioStore();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddHoldingForm>({ symbol: '', shares: 10, avgCost: 100, weight: 0.1 });
  const [addLoading, setAddLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [viewMode, setViewMode] = useState<'stock' | 'sector'>('stock');

  const totalValue = getTotalValue(holdings);
  const { amount: totalGL, percent: totalGLPct } = getTotalGainLoss(holdings);

  // Diversification score
  const diversScore = calcDiversificationScore(
    holdings.map(h => h.weight),
    holdings.map(() => holdings.map(() => 0.5)), // simplified
    holdings.map(h => h.sector)
  );

  useEffect(() => {
    setInsights(generatePortfolioInsights(holdings, diversScore));
  }, [holdings.length, diversScore]);

  const handleAdd = async () => {
    if (!form.symbol) return;
    setAddLoading(true);
    const quote = await getStockQuote(form.symbol);
    const price = quote?.price || STOCK_DATABASE[form.symbol]?.price || form.avgCost;
    addHolding({
      symbol: form.symbol,
      name: quote?.name || STOCK_DATABASE[form.symbol]?.name || form.symbol,
      weight: form.weight,
      shares: form.shares,
      avgCost: form.avgCost,
      currentPrice: price,
      sector: quote?.sector || STOCK_DATABASE[form.symbol]?.sector || 'Technology',
    });
    setForm({ symbol: '', shares: 10, avgCost: 100, weight: 0.1 });
    setAdding(false);
    setAddLoading(false);
  };

  const scatterData = holdings.map(h => {
    const stock = STOCK_DATABASE[h.symbol];
    return {
      symbol: h.symbol,
      risk: 15 + (stock?.beta || 1) * 8,
      return: h.gainLossPercent,
      weight: h.weight,
      sector: h.sector,
    };
  });

  const bestPerformer = holdings.length > 0 ? holdings.reduce((best, h) => h.gainLossPercent > best.gainLossPercent ? h : best, holdings[0]) : null;
  const worstPerformer = holdings.length > 0 ? holdings.reduce((worst, h) => h.gainLossPercent < worst.gainLossPercent ? h : worst, holdings[0]) : null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Portfolio summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>TOTAL PORTFOLIO VALUE</div>
          <div className="text-3xl font-mono font-bold mb-1" style={{ color: '#e2e8f0' }}>{formatCurrency(totalValue)}</div>
          <div className="flex items-center gap-1.5 text-sm font-mono">
            {totalGL >= 0 ? <TrendingUp size={13} style={{ color: '#10b981' }} /> : <TrendingDown size={13} style={{ color: '#ef4444' }} />}
            <span style={{ color: totalGL >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(totalGL)} ({formatPercent(totalGLPct)})
            </span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>DIVERSIFICATION</div>
          <div className="text-2xl font-mono font-bold mb-1" style={{ color: diversScore > 60 ? '#10b981' : diversScore > 40 ? '#f59e0b' : '#ef4444' }}>{diversScore}<span className="text-base font-normal" style={{ color: '#334155' }}>/100</span></div>
          <div className="h-1.5 rounded-full mt-1" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${diversScore}%`, background: diversScore > 60 ? '#10b981' : diversScore > 40 ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>HOLDINGS</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#e2e8f0' }}>{holdings.length}</div>
          <div className="text-xs mt-1" style={{ color: '#475569' }}>
            {new Set(holdings.map(h => h.sector)).size} sectors
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Holdings table */}
        <div className="col-span-2 flex flex-col gap-3">
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
              <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>HOLDINGS</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={normalizeWeights}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all"
                  style={{ background: 'rgba(99,102,241,0.06)', color: '#64748b', border: '1px solid rgba(99,102,241,0.1)' }}
                  title="Normalize weights to sum to 100%"
                >
                  <RefreshCw size={10} />
                  Normalize
                </button>
                <button
                  onClick={() => setAdding(!adding)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ background: adding ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: adding ? '#ef4444' : '#10b981', border: `1px solid ${adding ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}
                >
                  <Plus size={11} />
                  {adding ? 'Cancel' : 'Add Stock'}
                </button>
              </div>
            </div>

            {/* Add form */}
            {adding && (
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.04)', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                <StockSearch
                  onSelect={sym => setForm(f => ({ ...f, symbol: sym, avgCost: STOCK_DATABASE[sym]?.price || 100 }))}
                  placeholder="Ticker..."
                  className="w-44"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px]" style={{ color: '#475569' }}>Shares</span>
                  <input
                    type="number"
                    value={form.shares}
                    onChange={e => setForm(f => ({ ...f, shares: +e.target.value }))}
                    className="w-16 px-2 py-1 rounded-md text-xs font-mono"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]" style={{ color: '#475569' }}>Avg Cost</span>
                  <input
                    type="number"
                    value={form.avgCost}
                    onChange={e => setForm(f => ({ ...f, avgCost: +e.target.value }))}
                    className="w-20 px-2 py-1 rounded-md text-xs font-mono"
                    min={0.01} step={0.01}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!form.symbol || addLoading}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', opacity: !form.symbol ? 0.5 : 1 }}
                >
                  {addLoading ? '...' : 'Add'}
                </button>
              </div>
            )}

            {/* Holdings list */}
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                    {['Symbol', 'Shares', 'Avg Cost', 'Current', 'Value', 'P&L', 'Weight', ''].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => (
                    <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(99,102,241,0.04)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 rounded-sm" style={{ background: SECTOR_COLORS[h.sector] || '#6366f1' }} />
                          <div>
                            <div className="text-xs font-mono font-bold" style={{ color: '#e2e8f0' }}>{h.symbol}</div>
                            <div className="text-[9px]" style={{ color: '#334155' }}>{h.sector}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#94a3b8' }}>{h.shares}</td>
                      <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#94a3b8' }}>{formatCurrency(h.avgCost)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono font-semibold" style={{ color: '#e2e8f0' }}>{formatCurrency(h.currentPrice)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#94a3b8' }}>{formatCurrency(h.value)}</td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-mono font-semibold" style={{ color: h.gainLoss >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatPercent(h.gainLossPercent)}
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: h.gainLoss >= 0 ? '#065f46' : '#7f1d1d' }}>
                          {h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 rounded-full" style={{ background: 'rgba(99,102,241,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${h.weight * 100}%`, background: '#6366f1' }} />
                          </div>
                          <input
                            type="number"
                            value={(h.weight * 100).toFixed(0)}
                            onChange={e => updateWeight(h.symbol, +e.target.value / 100)}
                            className="w-12 px-1 py-0.5 rounded text-[10px] font-mono text-center"
                            min={0} max={100}
                          />
                          <span className="text-[9px]" style={{ color: '#334155' }}>%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeHolding(h.symbol)} className="w-5 h-5 flex items-center justify-center rounded transition-all" style={{ color: '#334155' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {holdings.length === 0 && (
                <div className="flex items-center justify-center py-12 text-xs" style={{ color: '#334155' }}>
                  No holdings yet. Add stocks to build your portfolio.
                </div>
              )}
            </div>
          </div>

          {/* Risk/Return scatter */}
          {holdings.length >= 2 && (
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>RISK / RETURN PROFILE</h3>
              <RiskReturnScatter data={scatterData} height={220} />
              <p className="text-[9px] mt-1 text-center" style={{ color: '#334155' }}>Bubble size = portfolio weight</p>
            </div>
          )}

          {/* Best / Worst performers */}
          {holdings.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4 rounded-xl" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#065f46' }}>BEST PERFORMER</div>
                <div className="text-xl font-mono font-bold" style={{ color: '#10b981' }}>{bestPerformer?.symbol}</div>
                <div className="text-xs font-mono" style={{ color: '#10b981' }}>{formatPercent(bestPerformer?.gainLossPercent ?? 0)}</div>
              </div>
              <div className="glass-panel p-4 rounded-xl" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#7f1d1d' }}>WORST PERFORMER</div>
                <div className="text-xl font-mono font-bold" style={{ color: '#ef4444' }}>{worstPerformer?.symbol}</div>
                <div className="text-xs font-mono" style={{ color: '#ef4444' }}>{formatPercent(worstPerformer?.gainLossPercent ?? 0)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3">
          {/* Allocation chart */}
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>ALLOCATION</h3>
              <div className="flex items-center gap-1 ml-auto">
                {(['stock', 'sector'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className="px-2 py-0.5 rounded text-[9px] font-medium transition-all capitalize"
                    style={{ background: viewMode === m ? 'rgba(99,102,241,0.15)' : 'transparent', color: viewMode === m ? '#a5b4fc' : '#475569' }}
                  >{m}</button>
                ))}
              </div>
            </div>
            <AllocationChart holdings={holdings} type={viewMode} size={200} />
          </div>

          {/* AI Insights */}
          <AIInsightPanel insights={insights} title="Portfolio Analysis" />

          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
