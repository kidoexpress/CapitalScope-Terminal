import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ArrowUpRight, FlaskConical, Play, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react';
import MonteCarloChart from '../components/charts/MonteCarloChart';
import { buildHistogram, runMonteCarlo } from '../utils/monteCarlo';
import { formatCurrency, formatPercent } from '../utils/finance';
import { getTotalValue, usePortfolioStore } from '../store/portfolioStore';
import { DATA_SOURCE_LABEL } from '../services/marketDataService';
import { getStockQuote } from '../utils/api';

const SIMULATIONS = 500;

const PRESETS = [
  { label: 'Conservative', description: 'Lower growth, lower volatility', ret: 5.5, vol: 8 },
  { label: 'Balanced', description: 'Broad equity-style profile', ret: 8, vol: 16 },
  { label: 'Growth', description: 'Higher upside with wider paths', ret: 12, vol: 24 },
  { label: 'Aggressive', description: 'Risk-on portfolio assumptions', ret: 16, vol: 34 },
  { label: 'Crypto-like', description: 'Extreme volatility stress case', ret: 22, vol: 68 },
];

function ForecastSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  helper,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  helper: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="forecast-control">
      <div>
        <span>{label}</span>
        <strong>{display}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
      <em>{helper}</em>
    </label>
  );
}

function OutcomeCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return (
    <div className={`forecast-outcome-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

export default function MonteCarloLab() {
  const { holdings } = usePortfolioStore();
  const totalValue = getTotalValue(holdings);
  const holdingSymbols = holdings.map(h => h.symbol).join(',');

  const [params, setParams] = useState({
    initialValue: Math.round(totalValue) || 10000,
    annualReturn: 8,
    annualVol: 18,
    years: 10,
    numSims: SIMULATIONS,
  });
  const [running, setRunning] = useState(false);
  const [activePreset, setActivePreset] = useState('Balanced');
  const [result, setResult] = useState(() =>
    runMonteCarlo(params.initialValue, params.annualReturn / 100, params.annualVol / 100, params.years, SIMULATIONS)
  );

  useEffect(() => {
    if (!holdings.length) return;
    let cancelled = false;
    void Promise.all(holdings.map(async holding => {
      const quote = await getStockQuote(holding.symbol);
      if (!cancelled && quote) {
        usePortfolioStore.getState().updateHoldingPrice(holding.symbol, quote.price);
      }
    }));
    return () => { cancelled = true; };
  }, [holdingSymbols]);

  useEffect(() => {
    if (totalValue > 0) {
      setParams(prev => ({ ...prev, initialValue: Math.round(totalValue) }));
    }
  }, [totalValue]);

  const runSimulation = useCallback(() => {
    setRunning(true);
    window.setTimeout(() => {
      setResult(runMonteCarlo(
        params.initialValue,
        params.annualReturn / 100,
        params.annualVol / 100,
        params.years,
        params.numSims
      ));
      setRunning(false);
    }, 380);
  }, [params]);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.label);
    setParams(prev => ({ ...prev, annualReturn: preset.ret, annualVol: preset.vol }));
  };

  const histogram = useMemo(() => buildHistogram(result.finalValues, 24), [result]);
  const finalP95 = result.percentiles.p95[result.percentiles.p95.length - 1];
  const finalP75 = result.percentiles.p75[result.percentiles.p75.length - 1];
  const finalP50 = result.percentiles.p50[result.percentiles.p50.length - 1];
  const finalP25 = result.percentiles.p25[result.percentiles.p25.length - 1];
  const finalP5 = result.percentiles.p5[result.percentiles.p5.length - 1];
  const probabilityLoss = 100 - result.probabilityProfit;
  const upsideRange = ((finalP95 / params.initialValue - 1) * 100);
  const downsideRange = ((finalP5 / params.initialValue - 1) * 100);

  return (
    <div className="forecast-lab-page animate-fade-in-up">
      <section className="forecast-hero">
        <div>
          <span className="section-kicker">Forecasting</span>
          <h1>Monte Carlo Forecast Lab</h1>
          <p>Simulate thousands of possible portfolio paths and understand upside, downside, and uncertainty.</p>
        </div>
        <div className="forecast-meta">
          <span>{DATA_SOURCE_LABEL}</span>
          <strong>{params.numSims.toLocaleString()} simulations</strong>
        </div>
      </section>

      <section className="forecast-workspace">
        <aside className="forecast-setup-card">
          <div className="forecast-card-header">
            <div>
              <span className="section-kicker">Setup</span>
              <h2>Simulation Assumptions</h2>
            </div>
            <SlidersHorizontal size={18} />
          </div>

          <ForecastSlider
            label="Initial value"
            value={params.initialValue}
            display={formatCurrency(params.initialValue, 0)}
            min={1000}
            max={1000000}
            step={1000}
            helper="Use portfolio value or enter a custom starting point."
            onChange={value => setParams(prev => ({ ...prev, initialValue: value }))}
          />
          <ForecastSlider
            label="Expected return"
            value={params.annualReturn}
            display={`${params.annualReturn.toFixed(1)}%`}
            min={-5}
            max={30}
            step={0.5}
            helper="Annualized expected return assumption."
            onChange={value => setParams(prev => ({ ...prev, annualReturn: value }))}
          />
          <ForecastSlider
            label="Volatility"
            value={params.annualVol}
            display={`${params.annualVol.toFixed(0)}%`}
            min={5}
            max={80}
            step={1}
            helper="Higher volatility widens the probability cone."
            onChange={value => setParams(prev => ({ ...prev, annualVol: value }))}
          />
          <ForecastSlider
            label="Time horizon"
            value={params.years}
            display={`${params.years} years`}
            min={1}
            max={30}
            step={1}
            helper="Longer horizons compound uncertainty."
            onChange={value => setParams(prev => ({ ...prev, years: value }))}
          />
          <ForecastSlider
            label="Simulations"
            value={params.numSims}
            display={params.numSims.toLocaleString()}
            min={100}
            max={1000}
            step={100}
            helper="More paths smooth the distribution."
            onChange={value => setParams(prev => ({ ...prev, numSims: value }))}
          />

          <button className="forecast-run-button" onClick={runSimulation} disabled={running}>
            {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            {running ? 'Running forecast...' : 'Run Forecast'}
          </button>
        </aside>

        <div className="forecast-primary-card">
          <div className="forecast-card-header">
            <div>
              <span className="section-kicker">Probability Cone</span>
              <h2>Portfolio Path Forecast</h2>
            </div>
            <div className="forecast-chart-legend">
              <span><i className="green" />P95</span>
              <span><i className="blue" />Median</span>
              <span><i className="red" />P5</span>
            </div>
          </div>
          <div className="forecast-chart-shell">
            {running && <div className="forecast-chart-loading"><span className="button-spinner" /> Recalculating paths...</div>}
            <MonteCarloChart result={result} initialValue={params.initialValue} height={390} />
          </div>
        </div>
      </section>

      <section className="forecast-preset-row">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            className={`forecast-preset-card ${activePreset === preset.label ? 'active' : ''}`}
            onClick={() => applyPreset(preset)}
          >
            <strong>{preset.label}</strong>
            <span>{preset.description}</span>
            <em>{preset.ret}% return / {preset.vol}% vol</em>
          </button>
        ))}
      </section>

      <section className="forecast-outcome-grid">
        <OutcomeCard label="Expected Value" value={formatCurrency(finalP50, 0)} detail={`${formatPercent(result.expectedReturn, 1)} median return`} tone="neutral" />
        <OutcomeCard label="Best Case" value={formatCurrency(finalP95, 0)} detail={`${formatPercent(upsideRange, 1)} 95th percentile`} tone="good" />
        <OutcomeCard label="Worst Case" value={formatCurrency(finalP5, 0)} detail={`${formatPercent(downsideRange, 1)} 5th percentile`} tone="bad" />
        <OutcomeCard label="Profit Probability" value={`${result.probabilityProfit.toFixed(0)}%`} detail={`${probabilityLoss.toFixed(0)}% probability of loss`} tone={result.probabilityProfit >= 65 ? 'good' : result.probabilityProfit >= 45 ? 'warn' : 'bad'} />
        <OutcomeCard label="Downside Risk" value={formatCurrency(finalP25, 0)} detail="25th percentile support zone" tone="warn" />
      </section>

      <section className="forecast-bottom-grid">
        <div className="forecast-distribution-card">
          <div className="forecast-card-header">
            <div>
              <span className="section-kicker">Distribution</span>
              <h2>Final Value Range</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={histogram} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.36)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.36)', fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                formatter={(value) => [`${value}`, 'Paths']}
                contentStyle={{ background: 'rgba(10,12,18,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              />
              <ReferenceLine
                x={histogram.reduce((prev, curr) =>
                  Math.abs(curr.value - params.initialValue) < Math.abs(prev.value - params.initialValue) ? curr : prev
                ).range}
                stroke="rgba(138,164,255,0.85)"
                strokeDasharray="4 3"
                label={{ value: 'Start', position: 'top', fontSize: 10, fill: 'rgba(255,255,255,0.58)' }}
              />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {histogram.map((entry, index) => (
                  <Cell key={index} fill={entry.value >= params.initialValue ? '#55d99a' : '#ec6f86'} fillOpacity={0.72} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <aside className="forecast-memo-card">
          <div className="forecast-card-header">
            <div>
              <span className="section-kicker">AI Simulation Analysis</span>
              <h2>Forecast Memo</h2>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="forecast-memo-hero">
            <span>Expected outcome</span>
            <strong>{formatCurrency(finalP50, 0)}</strong>
            <em>{formatPercent(result.expectedReturn, 1)} median return over {params.years} years</em>
          </div>
          <div className="forecast-memo-list">
            <p><strong>Downside risk:</strong> 5th percentile ends near {formatCurrency(finalP5, 0)}, or {formatPercent(downsideRange, 1)} from today.</p>
            <p><strong>Upside range:</strong> 95th percentile reaches {formatCurrency(finalP95, 0)}, with the upper quartile around {formatCurrency(finalP75, 0)}.</p>
            <p><strong>Probability of loss:</strong> {probabilityLoss.toFixed(0)}% of simulated paths finish below the starting value.</p>
            <p><strong>Key sensitivity:</strong> volatility is the largest driver of path width; return assumptions mostly shift the cone upward or downward.</p>
          </div>
          <div className="risk-disclaimer">Educational projections only. Not financial advice.</div>
        </aside>
      </section>
    </div>
  );
}
