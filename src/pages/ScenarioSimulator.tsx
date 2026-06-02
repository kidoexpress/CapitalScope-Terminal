import { useState, useMemo } from 'react';
import { Zap, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SCENARIOS, applyScenario, calcPortfolioScenarioImpact } from '../utils/scenarios';
import { usePortfolioStore, getTotalValue } from '../store/portfolioStore';
import { formatCurrency, formatPercent } from '../utils/finance';
import { STOCK_DATABASE, SECTOR_COLORS } from '../data/mockStocks';
import Disclaimer from '../components/ui/Disclaimer';
import type { AIInsight } from '../types';
import { AIInsightPanel } from '../components/ui/AIInsightCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(99,102,241,0.25)' }}>
      <p className="text-[10px] font-mono mb-1" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-xs font-mono font-semibold" style={{ color: val >= 0 ? '#10b981' : '#ef4444' }}>
        {val >= 0 ? '+' : ''}{val.toFixed(2)}%
      </p>
    </div>
  );
};

export default function ScenarioSimulator() {
  const { holdings } = usePortfolioStore();
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const totalValue = getTotalValue(holdings);

  const scenario = SCENARIOS.find(s => s.id === selectedScenario)!;

  const quotes = useMemo(() => Object.fromEntries(
    holdings.map(h => [h.symbol, { ...STOCK_DATABASE[h.symbol], price: h.currentPrice, name: h.name, sector: h.sector } as any])
  ), [holdings]);

  const weights = useMemo(() => Object.fromEntries(holdings.map(h => [h.symbol, h.weight])), [holdings]);

  const impacts = useMemo(() =>
    applyScenario(holdings.map(h => h.symbol), quotes, selectedScenario),
    [selectedScenario, holdings]
  );

  const portfolioImpact = useMemo(() =>
    calcPortfolioScenarioImpact(impacts, weights),
    [impacts, weights]
  );

  const portfolioImpactValue = totalValue * portfolioImpact / 100;

  // Sector-level impact
  const sectorImpacts = useMemo(() => {
    return Object.entries(scenario.impacts)
      .map(([sector, impact]) => ({ sector, impact: impact * 100 }))
      .sort((a, b) => a.impact - b.impact);
  }, [scenario]);

  const insights: AIInsight[] = [
    {
      type: portfolioImpact < -10 ? 'risk' : portfolioImpact < -5 ? 'warning' : 'info',
      title: `Portfolio Impact: ${portfolioImpact.toFixed(1)}%`,
      body: `Under the "${scenario.name}" scenario, your portfolio is estimated to ${portfolioImpact >= 0 ? 'gain' : 'lose'} ${Math.abs(portfolioImpact).toFixed(1)}% — equivalent to ${portfolioImpact >= 0 ? '+' : '-'}${formatCurrency(Math.abs(portfolioImpactValue))} in value.`,
      metric: formatPercent(portfolioImpact),
    },
    {
      type: 'info',
      title: 'Affected Sectors',
      body: `This scenario most impacts: ${scenario.affectedSectors.join(', ')}. ${scenario.explanation.split('.')[0]}.`,
    },
    {
      type: 'info',
      title: 'Methodology Note',
      body: `Impact estimates use historical sector betas and factor sensitivities. Actual outcomes will vary based on duration, market regime, and company-specific factors not captured in this model.`,
    },
  ];

  const SEVERITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', extreme: '#dc2626' };

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Zap size={14} style={{ color: '#f59e0b' }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: '#94a3b8' }}>Scenario Stress Tester — What-If Analysis</h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Scenario selector */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[9px] font-semibold uppercase tracking-wider px-1 mb-1" style={{ color: '#334155' }}>SELECT SCENARIO</div>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-150"
              style={{
                background: selectedScenario === s.id ? 'rgba(245,158,11,0.1)' : 'rgba(12,12,26,0.6)',
                border: `1px solid ${selectedScenario === s.id ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.1)'}`,
              }}
              onMouseEnter={e => { if (selectedScenario !== s.id) (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)'; }}
              onMouseLeave={e => { if (selectedScenario !== s.id) (e.currentTarget as HTMLElement).style.background = 'rgba(12,12,26,0.6)'; }}
            >
              <span className="text-base">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate" style={{ color: selectedScenario === s.id ? '#fbbf24' : '#94a3b8' }}>
                  {s.name}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: SEVERITY_COLORS[s.severity] }} />
                  <span className="text-[9px] capitalize" style={{ color: '#475569' }}>{s.severity} severity</span>
                </div>
              </div>
              {selectedScenario === s.id && <ChevronRight size={10} style={{ color: '#f59e0b' }} />}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="col-span-3 flex flex-col gap-3">
          {/* Portfolio impact banner */}
          <div className="glass-panel p-4 rounded-xl" style={{ borderColor: portfolioImpact < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{scenario.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{scenario.name}</h3>
                    <p className="text-[10px]" style={{ color: '#64748b' }}>{scenario.description}</p>
                  </div>
                </div>
                <p className="text-xs mt-2 max-w-lg leading-relaxed" style={{ color: '#64748b' }}>
                  {scenario.explanation}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#475569' }}>ESTIMATED PORTFOLIO IMPACT</div>
                <div className="text-4xl font-mono font-bold" style={{ color: portfolioImpact >= 0 ? '#10b981' : '#ef4444' }}>
                  {portfolioImpact >= 0 ? '+' : ''}{portfolioImpact.toFixed(1)}%
                </div>
                <div className="text-sm font-mono mt-1" style={{ color: portfolioImpact >= 0 ? '#065f46' : '#7f1d1d' }}>
                  {portfolioImpactValue >= 0 ? '+' : ''}{formatCurrency(portfolioImpactValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Stock-level impacts */}
          {impacts.length > 0 && (
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>STOCK-LEVEL IMPACT</h3>
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                      {['Stock', 'Sector', 'Current Price', 'Scenario Price', 'Impact', 'Portfolio Effect'].map(h => (
                        <th key={h} className="pb-2 text-left text-[9px] font-semibold uppercase tracking-wider pr-4" style={{ color: '#334155' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {impacts
                      .sort((a, b) => a.changePercent - b.changePercent)
                      .map(imp => {
                        const weight = weights[imp.symbol] || 0;
                        const portfolioEffect = weight * imp.changePercent;
                        return (
                          <tr key={imp.symbol}
                            style={{ borderBottom: '1px solid rgba(99,102,241,0.04)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-4 rounded-sm" style={{ background: SECTOR_COLORS[imp.sector] || '#6366f1' }} />
                                <span className="text-xs font-mono font-bold" style={{ color: '#e2e8f0' }}>{imp.symbol}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 text-[10px]" style={{ color: '#475569' }}>{imp.sector}</td>
                            <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: '#94a3b8' }}>{formatCurrency(imp.basePrice)}</td>
                            <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: imp.changePercent >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(imp.impactedPrice)}</td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-1">
                                {imp.changePercent >= 0 ? <TrendingUp size={10} style={{ color: '#10b981' }} /> : <TrendingDown size={10} style={{ color: '#ef4444' }} />}
                                <span className="text-xs font-mono font-semibold" style={{ color: imp.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
                                  {formatPercent(imp.changePercent)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-xs font-mono" style={{ color: portfolioEffect >= 0 ? '#065f46' : '#7f1d1d' }}>
                              {portfolioEffect >= 0 ? '+' : ''}{portfolioEffect.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sector impact chart */}
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>SECTOR IMPACT MAP</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorImpacts} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false}
                  tick={{ fill: '#334155', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `${v.toFixed(0)}%`}
                />
                <YAxis type="category" dataKey="sector" tickLine={false} axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke="rgba(99,102,241,0.2)" />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {sectorImpacts.map((entry, index) => (
                    <Cell key={index} fill={entry.impact >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AIInsightPanel insights={insights} title="Scenario Analysis" />
            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
}
