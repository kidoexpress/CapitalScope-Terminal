import { usePortfolioStore } from '../store/portfolioStore';
import CorrelationMatrix from '../components/charts/CorrelationMatrix';
import { AIInsightPanel } from '../components/ui/AIInsightCard';
import { SECTOR_COLORS, STOCK_DATABASE } from '../data/mockStocks';
import { calcDiversificationScore, formatCurrency } from '../utils/finance';
import Disclaimer from '../components/ui/Disclaimer';
import type { AIInsight } from '../types';
import { AlertTriangle, Activity, BarChart2, Shield } from 'lucide-react';

const VaR_CONFIDENCE = [0.90, 0.95, 0.99];

function calcVaR(portfolioValue: number, volatility: number, confidence: number): number {
  // Normal approximation: VaR = V * σ * z * √t (1-day)
  const z = confidence === 0.90 ? 1.28 : confidence === 0.95 ? 1.645 : 2.326;
  return portfolioValue * volatility * z * Math.sqrt(1 / 252);
}

export default function RiskDashboard() {
  const { holdings } = usePortfolioStore();
  const symbols = holdings.map(h => h.symbol);
  const prices = Object.fromEntries(holdings.map(h => [h.symbol, h.currentPrice]));

  // Sector breakdown
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight; });

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  // Weighted portfolio volatility proxy using beta × market vol (15% annual)
  const MARKET_VOL = 0.15;
  const estVol = holdings.length > 0
    ? holdings.reduce((sum, h) => {
        const beta = (h as any).beta ?? STOCK_DATABASE[h.symbol]?.beta ?? 1.0;
        return sum + (h.weight / 100) * beta * MARKET_VOL;
      }, 0)
    : MARKET_VOL;

  const diversScore = calcDiversificationScore(
    holdings.map(h => h.weight),
    holdings.map(() => holdings.map(() => 0.5)),
    holdings.map(h => h.sector)
  );

  // Concentration risk
  const maxConcentration = holdings.reduce((max, h) => Math.max(max, h.weight), 0);
  const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0];
  const hhi = holdings.reduce((s, h) => s + h.weight * h.weight, 0);

  const insights: AIInsight[] = [
    ...(maxConcentration > 0.35 ? [{
      type: 'warning' as const,
      title: 'Single Stock Concentration',
      body: `Top holding represents ${(maxConcentration * 100).toFixed(0)}% of portfolio. Modern Portfolio Theory suggests max single-stock weight of 20-25% for optimal risk-adjusted returns.`,
      metric: `${(maxConcentration * 100).toFixed(0)}%`,
    }] : []),
    ...(topSector && topSector[1] > 0.5 ? [{
      type: 'risk' as const,
      title: `${topSector[0]} Sector Overweight`,
      body: `${topSector[0]} accounts for ${(topSector[1] * 100).toFixed(0)}% of your portfolio. A sector-specific event (regulation, competition, cycle) could trigger significant drawdown.`,
      metric: `${(topSector[1] * 100).toFixed(0)}%`,
    }] : []),
    {
      type: 'info' as const,
      title: 'Portfolio Volatility Estimate',
      body: `Estimated annualized portfolio volatility of ~${(estVol * 100).toFixed(0)}%. This means ~68% of the time, annual returns will be within ±${(estVol * 100).toFixed(0)}% of the expected return.`,
      metric: `${(estVol * 100).toFixed(0)}%`,
    },
    {
      type: diversScore > 60 ? 'opportunity' as const : 'warning' as const,
      title: diversScore > 60 ? 'Good Portfolio Diversification' : 'Consider Diversification',
      body: diversScore > 60
        ? `Your portfolio diversification score of ${diversScore}/100 shows healthy spread across sectors and positions.`
        : `Diversification score of ${diversScore}/100 suggests room to improve. Adding uncorrelated assets can reduce overall portfolio volatility without sacrificing returns (diversification "free lunch").`,
      metric: `${diversScore}/100`,
    },
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Risk metrics row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>DIVERSIFICATION</div>
          <div className="text-2xl font-mono font-bold" style={{ color: diversScore > 60 ? '#10b981' : diversScore > 40 ? '#f59e0b' : '#ef4444' }}>
            {diversScore}<span className="text-sm" style={{ color: '#334155' }}>/100</span>
          </div>
          <div className="h-1 rounded-full mt-2" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div style={{ width: `${diversScore}%`, height: '100%', borderRadius: 999, background: diversScore > 60 ? '#10b981' : diversScore > 40 ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>HHI CONCENTRATION</div>
          <div className="text-2xl font-mono font-bold" style={{ color: hhi > 0.25 ? '#ef4444' : hhi > 0.15 ? '#f59e0b' : '#10b981' }}>
            {(hhi * 100).toFixed(1)}<span className="text-sm" style={{ color: '#334155' }}>%²</span>
          </div>
          <div className="text-[9px] mt-1" style={{ color: '#475569' }}>
            {hhi > 0.25 ? 'High Concentration' : hhi > 0.15 ? 'Moderate' : 'Well Spread'}
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>VaR (95%, 1-Day)</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#ef4444' }}>
            -{formatCurrency(calcVaR(totalValue, estVol, 0.95))}
          </div>
          <div className="text-[9px] mt-1" style={{ color: '#475569' }}>5% chance of exceeding</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#475569' }}>VaR (99%, 1-Day)</div>
          <div className="text-2xl font-mono font-bold" style={{ color: '#f59e0b' }}>
            -{formatCurrency(calcVaR(totalValue, estVol, 0.99))}
          </div>
          <div className="text-[9px] mt-1" style={{ color: '#475569' }}>1% chance of exceeding</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-3">
          {/* Correlation matrix */}
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={13} style={{ color: '#8b5cf6' }} />
              <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>CORRELATION MATRIX (1Y daily returns)</h3>
            </div>
            {symbols.length >= 2 ? (
              <CorrelationMatrix symbols={symbols} prices={prices} />
            ) : (
              <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#334155' }}>
                Add at least 2 holdings to see correlations
              </div>
            )}
          </div>

          {/* Sector breakdown */}
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} style={{ color: '#3b82f6' }} />
              <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>SECTOR EXPOSURE</h3>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(sectorMap)
                .sort((a, b) => b[1] - a[1])
                .map(([sector, weight]) => (
                  <div key={sector} className="flex items-center gap-3">
                    <div className="w-20 text-[10px] font-mono text-right shrink-0" style={{ color: '#64748b' }}>{sector}</div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(99,102,241,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${weight * 100}%`, background: SECTOR_COLORS[sector] || '#6366f1' }}
                      />
                    </div>
                    <div className="w-10 text-[10px] font-mono font-semibold shrink-0" style={{ color: SECTOR_COLORS[sector] || '#94a3b8' }}>
                      {(weight * 100).toFixed(0)}%
                    </div>
                    {weight > 0.4 && <AlertTriangle size={10} style={{ color: '#f59e0b' }} />}
                  </div>
                ))}
            </div>
          </div>

          {/* VaR table */}
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} style={{ color: '#ef4444' }} />
              <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>VALUE AT RISK — CONFIDENCE LEVELS</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                  {['Confidence', '1-Day VaR', '1-Week VaR', '1-Month VaR', 'Interpretation'].map(h => (
                    <th key={h} className="pb-2 text-left text-[9px] font-semibold uppercase tracking-wider pr-4" style={{ color: '#334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VaR_CONFIDENCE.map(conf => {
                  const daily = calcVaR(totalValue, estVol, conf);
                  return (
                    <tr key={conf} className="text-xs font-mono" style={{ borderBottom: '1px solid rgba(99,102,241,0.04)' }}>
                      <td className="py-2 pr-4" style={{ color: '#94a3b8' }}>{(conf * 100).toFixed(0)}%</td>
                      <td className="py-2 pr-4" style={{ color: '#ef4444' }}>-{formatCurrency(daily)}</td>
                      <td className="py-2 pr-4" style={{ color: '#f59e0b' }}>-{formatCurrency(daily * Math.sqrt(5))}</td>
                      <td className="py-2 pr-4" style={{ color: '#f97316' }}>-{formatCurrency(daily * Math.sqrt(21))}</td>
                      <td className="py-2 text-[10px]" style={{ color: '#475569' }}>
                        {conf === 0.90 ? '10% chance/day' : conf === 0.95 ? '5% chance/day' : '1% chance/day'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3">
          <AIInsightPanel insights={insights} title="Risk Analysis" />
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
