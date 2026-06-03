import { useState, useCallback, useMemo } from 'react';
import { FlaskConical, Play, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { runMonteCarlo, buildHistogram } from '../utils/monteCarlo';
import MonteCarloChart from '../components/charts/MonteCarloChart';
import { formatCurrency, formatPercent } from '../utils/finance';
import { usePortfolioStore, getTotalValue } from '../store/portfolioStore';
import Disclaimer from '../components/ui/Disclaimer';
import { AIInsightPanel } from '../components/ui/AIInsightCard';
import type { AIInsight } from '../types';

const SIMULATIONS = 500;

export default function MonteCarloLab() {
  const { holdings } = usePortfolioStore();
  const totalValue = getTotalValue(holdings);

  const [params, setParams] = useState({
    initialValue: Math.round(totalValue) || 10000,
    annualReturn: 8,
    annualVol: 18,
    years: 10,
    numSims: SIMULATIONS,
  });

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(() =>
    runMonteCarlo(params.initialValue, params.annualReturn / 100, params.annualVol / 100, params.years, SIMULATIONS)
  );

  const runSimulation = useCallback(() => {
    setRunning(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const r = runMonteCarlo(
        params.initialValue,
        params.annualReturn / 100,
        params.annualVol / 100,
        params.years,
        params.numSims
      );
      setResult(r);
      setRunning(false);
    }, 50);
  }, [params]);

  const histogram = useMemo(() => buildHistogram(result.finalValues, 25), [result]);

  const insights: AIInsight[] = [
    {
      type: result.probabilityProfit > 70 ? 'opportunity' : result.probabilityProfit > 50 ? 'info' : 'warning',
      title: `${result.probabilityProfit.toFixed(0)}% Probability of Profit`,
      body: `Based on ${params.numSims} simulated paths over ${params.years} years, there is a ${result.probabilityProfit.toFixed(0)}% probability of ending above your initial investment of ${formatCurrency(params.initialValue)}.`,
      metric: `${result.probabilityProfit.toFixed(0)}%`,
    },
    {
      type: 'info',
      title: 'Median Expected Outcome',
      body: `The median portfolio value after ${params.years} years is ${formatCurrency(result.percentiles.p50[result.percentiles.p50.length - 1])}, representing a ${result.expectedReturn.toFixed(1)}% return. This is the "most likely" outcome under the given assumptions.`,
      metric: `+${result.expectedReturn.toFixed(1)}%`,
    },
    {
      type: 'risk',
      title: '5th Percentile Downside',
      body: `In the worst 5% of scenarios, the portfolio ends at ${formatCurrency(result.percentiles.p5[result.percentiles.p5.length - 1])} — a ${result.downsideRisk.toFixed(1)}% loss. This represents the tail risk of your investment strategy.`,
      metric: `${result.downsideRisk.toFixed(1)}%`,
    },
    {
      type: 'info',
      title: 'Simulation Assumptions',
      body: `This model uses Geometric Brownian Motion — a standard finance assumption of log-normally distributed returns. Real markets exhibit fat tails, serial correlation, and regime changes not captured here.`,
    },
  ];

  const finalP95 = result.percentiles.p95[result.percentiles.p95.length - 1];
  const finalP50 = result.percentiles.p50[result.percentiles.p50.length - 1];
  const finalP5 = result.percentiles.p5[result.percentiles.p5.length - 1];

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
          <FlaskConical size={14} style={{ color: '#06b6d4' }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: '#94a3b8' }}>Monte Carlo Simulation — Geometric Brownian Motion</h2>
        <span className="text-[9px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
          {params.numSims} PATHS
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Configuration */}
        <div className="flex flex-col gap-3">
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-xs font-semibold mb-4" style={{ color: '#94a3b8' }}>SIMULATION PARAMETERS</h3>
            <div className="flex flex-col gap-4">
              {/* Initial value */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Initial Value</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#e2e8f0' }}>{formatCurrency(params.initialValue)}</span>
                </div>
                <input type="range" min={1000} max={1000000} step={1000}
                  value={params.initialValue}
                  onChange={e => setParams(p => ({ ...p, initialValue: +e.target.value }))}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] mt-0.5" style={{ color: '#334155' }}>
                  <span>$1k</span><span>$1M</span>
                </div>
              </div>

              {/* Expected return */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Expected Annual Return</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#10b981' }}>{params.annualReturn}%</span>
                </div>
                <input type="range" min={-5} max={30} step={0.5}
                  value={params.annualReturn}
                  onChange={e => setParams(p => ({ ...p, annualReturn: +e.target.value }))}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] mt-0.5" style={{ color: '#334155' }}>
                  <span>-5%</span><span>30%</span>
                </div>
              </div>

              {/* Volatility */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Annual Volatility (σ)</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#f59e0b' }}>{params.annualVol}%</span>
                </div>
                <input type="range" min={5} max={80} step={1}
                  value={params.annualVol}
                  onChange={e => setParams(p => ({ ...p, annualVol: +e.target.value }))}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] mt-0.5" style={{ color: '#334155' }}>
                  <span>5% (bonds)</span><span>80% (crypto)</span>
                </div>
              </div>

              {/* Time horizon */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Time Horizon</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#8b5cf6' }}>{params.years} years</span>
                </div>
                <input type="range" min={1} max={30} step={1}
                  value={params.years}
                  onChange={e => setParams(p => ({ ...p, years: +e.target.value }))}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] mt-0.5" style={{ color: '#334155' }}>
                  <span>1 yr</span><span>30 yrs</span>
                </div>
              </div>

              {/* Simulations */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Simulation Paths</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#06b6d4' }}>{params.numSims.toLocaleString()}</span>
                </div>
                <input type="range" min={100} max={1000} step={100}
                  value={params.numSims}
                  onChange={e => setParams(p => ({ ...p, numSims: +e.target.value }))}
                  className="w-full"
                />
              </div>

              <button
                onClick={runSimulation}
                disabled={running}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mt-1"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: 'white', opacity: running ? 0.7 : 1, boxShadow: running ? 'none' : '0 4px 15px rgba(6,182,212,0.25)' }}
              >
                {running ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? 'Running...' : 'Run Simulation'}
              </button>
            </div>
          </div>

          {/* Preset scenarios */}
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>QUICK PRESETS</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'S&P 500 Historical', ret: 10, vol: 15 },
                { label: 'Aggressive Growth', ret: 15, vol: 25 },
                { label: 'Conservative', ret: 6, vol: 10 },
                { label: 'Crypto-style', ret: 20, vol: 65 },
                { label: 'Emerging Markets', ret: 12, vol: 22 },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setParams(p => ({ ...p, annualReturn: preset.ret, annualVol: preset.vol }))}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[10px] transition-all"
                  style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)', color: '#64748b' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                >
                  <span>{preset.label}</span>
                  <span className="font-mono">{preset.ret}% / {preset.vol}%σ</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-2 flex flex-col gap-3">
          {/* Outcome summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Best Case (P95)', value: formatCurrency(finalP95), sub: formatPercent((finalP95 / params.initialValue - 1) * 100), color: '#10b981' },
              { label: 'Expected (P50)', value: formatCurrency(finalP50), sub: `+${result.expectedReturn.toFixed(1)}%`, color: '#3b82f6' },
              { label: 'Worst Case (P5)', value: formatCurrency(finalP5), sub: formatPercent((finalP5 / params.initialValue - 1) * 100), color: '#ef4444' },
              { label: 'Profit Probability', value: `${result.probabilityProfit.toFixed(0)}%`, sub: `${params.years}-year horizon`, color: result.probabilityProfit > 70 ? '#10b981' : '#f59e0b' },
            ].map(m => (
              <div key={m.label} className="glass-panel p-3 rounded-xl">
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#334155' }}>{m.label}</div>
                <div className="text-lg font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] font-mono" style={{ color: m.color + 'aa' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Fan chart */}
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>SIMULATION FAN CHART — PERCENTILE BANDS</h3>
            <div className="flex items-center gap-4 mb-3 text-[9px] font-mono flex-wrap">
              {[
                { label: 'P95 Bull', color: '#10b981' },
                { label: 'P75', color: '#6ee7b7' },
                { label: 'P50 Median', color: '#3b82f6' },
                { label: 'P25', color: '#fbbf24' },
                { label: 'P5 Bear', color: '#ef4444' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-4 h-0.5" style={{ background: l.color }} />
                  <span style={{ color: '#475569' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <MonteCarloChart result={result} initialValue={params.initialValue} height={260} />
          </div>

          {/* Distribution histogram */}
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>FINAL VALUE DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={histogram} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#334155', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#334155', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  formatter={(v) => [`${v}`, 'Paths']}
                  contentStyle={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <ReferenceLine
                  x={(() => {
                    if (!histogram.length) return undefined;
                    const target = params.initialValue;
                    return histogram.reduce((prev, curr) =>
                      Math.abs(curr.min - target) < Math.abs(prev.min - target) ? curr : prev
                    ).range;
                  })()}
                  stroke="var(--accent)"
                  strokeDasharray="4 3"
                  label={{ value: 'Start', position: 'top', fontSize: 10 }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {histogram.map((entry, index) => (
                    <Cell key={index} fill={entry.value >= params.initialValue ? '#10b981' : '#ef4444'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[9px] font-mono justify-center">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: '#10b981' }} /><span style={{ color: '#475569' }}>Above initial</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: '#ef4444' }} /><span style={{ color: '#475569' }}>Below initial</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AIInsightPanel insights={insights} title="Simulation Analysis" />
        <Disclaimer />
      </div>
    </div>
  );
}
