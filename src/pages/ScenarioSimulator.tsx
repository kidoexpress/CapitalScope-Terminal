import { useMemo, useState, type CSSProperties } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  DollarSign,
  Flame,
  Fuel,
  Globe,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SCENARIOS, applyScenario, calcPortfolioScenarioImpact } from '../utils/scenarios';
import { usePortfolioStore, getTotalValue } from '../store/portfolioStore';
import { formatCurrency, formatPercent } from '../utils/finance';
import { STOCK_DATABASE } from '../data/mockStocks';
import Disclaimer from '../components/ui/Disclaimer';
import { FinanceImpactCard } from '../components/ui/animated-dashboard-card';

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  rates_rise: TrendingUp,
  inflation_shock: Flame,
  recession: TrendingDown,
  tech_selloff: Cpu,
  oil_spike: Fuel,
  strong_dollar: DollarSign,
  em_stress: Globe,
};

const SEVERITY_COPY = {
  low: { label: 'Measured', className: 'soft' },
  medium: { label: 'Elevated', className: 'moderate' },
  high: { label: 'High Risk', className: 'high' },
  extreme: { label: 'Stress Case', className: 'extreme' },
} as const;

function getRiskClassification(impact: number) {
  const abs = Math.abs(impact);
  if (abs >= 18) return 'Severe drawdown risk';
  if (abs >= 10) return 'High macro sensitivity';
  if (abs >= 5) return 'Moderate portfolio stress';
  return 'Contained impact range';
}

function buildImpactPath(portfolioImpact: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    const shock = Math.sin(progress * Math.PI) * portfolioImpact * 0.34;
    return {
      month: `M${index}`,
      baseline: Number((100 + progress * 4.2).toFixed(2)),
      scenario: Number((100 + portfolioImpact * progress + shock).toFixed(2)),
    };
  });
}

function ImpactTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="cs-tooltip">
      <strong>{label}</strong>
      {payload.map((item: any) => (
        <div key={item.dataKey}>{item.name}: {Number(item.value).toFixed(1)}</div>
      ))}
    </div>
  );
}

export default function ScenarioSimulator() {
  const { holdings } = usePortfolioStore();
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const totalValue = getTotalValue(holdings);
  const scenario = SCENARIOS.find(s => s.id === selectedScenario) ?? SCENARIOS[0];
  const ScenarioIcon = SCENARIO_ICONS[scenario.id] ?? Zap;
  const severity = SEVERITY_COPY[scenario.severity];

  const quotes = useMemo(() => Object.fromEntries(
    holdings.map(holding => [
      holding.symbol,
      {
        ...STOCK_DATABASE[holding.symbol],
        price: holding.currentPrice,
        name: holding.name,
        sector: holding.sector,
      } as any,
    ])
  ), [holdings]);

  const weights = useMemo(() => Object.fromEntries(holdings.map(h => [h.symbol, h.weight])), [holdings]);

  const impacts = useMemo(() =>
    applyScenario(holdings.map(h => h.symbol), quotes, selectedScenario)
      .sort((a, b) => a.changePercent - b.changePercent),
    [selectedScenario, holdings, quotes]
  );

  const portfolioImpact = useMemo(() =>
    calcPortfolioScenarioImpact(impacts, weights),
    [impacts, weights]
  );

  const portfolioImpactValue = totalValue * portfolioImpact / 100;
  const confidenceLow = portfolioImpact * 1.25;
  const confidenceHigh = portfolioImpact * 0.72;
  const impactPath = useMemo(() => buildImpactPath(portfolioImpact), [portfolioImpact]);

  const sectorImpacts = useMemo(() => Object.entries(scenario.impacts)
    .map(([sector, impact]) => ({
      sector,
      impact: impact * 100,
      exposure: holdings.filter(h => h.sector === sector).reduce((sum, h) => sum + h.weight, 0) * 100,
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)), [scenario, holdings]);

  const vulnerableSector = sectorImpacts.find(item => item.exposure > 0) ?? sectorImpacts[0];
  const strongestHedge = sectorImpacts
    .filter(item => item.impact > 0)
    .sort((a, b) => b.impact - a.impact)[0];
  const mostAffectedHolding = impacts[0];
  const bestHolding = impacts[impacts.length - 1];
  const riskCapital = Math.min(portfolioImpactValue, 0);
  const hedgeOffset = Math.max(0, impacts.reduce((sum, impact) => {
    const effect = (weights[impact.symbol] || 0) * impact.changePercent * totalValue / 100;
    return sum + Math.max(effect, 0);
  }, 0));

  return (
    <div className="workflow-page scenario-page animate-fade-in-up">
      <div className="product-page-heading">
        <div>
          <p>Macro Risk</p>
          <h1>Scenario Simulator</h1>
        </div>
        <span>Stress-test portfolio exposure through clean macro narratives, confidence ranges, and sector sensitivity.</span>
      </div>

      <section className="scenario-selector-row" aria-label="Scenario selector">
        {SCENARIOS.map(item => {
          const Icon = SCENARIO_ICONS[item.id] ?? Activity;
          const active = item.id === selectedScenario;
          const itemSeverity = SEVERITY_COPY[item.severity];
          return (
            <button
              key={item.id}
              onClick={() => setSelectedScenario(item.id)}
              className={`scenario-choice-card ${active ? 'active' : ''} ${itemSeverity.className}`}
            >
              <span className="scenario-choice-icon"><Icon size={18} /></span>
              <strong>{item.name}</strong>
              <em>{item.description}</em>
              <i>{itemSeverity.label}</i>
            </button>
          );
        })}
      </section>

      <AnimatePresence mode="wait">
        <motion.section
          key={scenario.id}
          className="scenario-hero-grid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div className="scenario-executive-card">
            <div className="scenario-title-row">
              <div className={`scenario-hero-icon ${severity.className}`}>
                <ScenarioIcon size={24} />
              </div>
              <div>
                <span className="label-upper">Selected Scenario</span>
                <h2>{scenario.name}</h2>
              </div>
            </div>
            <p>{scenario.explanation}</p>
            <div className="scenario-context-grid">
              <div>
                <span>Severity</span>
                <strong>{severity.label}</strong>
              </div>
              <div>
                <span>Expected environment</span>
                <strong>{scenario.description}</strong>
              </div>
              <div>
                <span>Affected sectors</span>
                <strong>{scenario.affectedSectors.slice(0, 3).join(', ')}</strong>
              </div>
            </div>
          </div>

          <div className={`scenario-impact-card ${portfolioImpact < 0 ? 'negative' : 'positive'}`}>
            <span className="label-upper">Estimated Portfolio Impact</span>
            <div className="impact-number-row">
              {portfolioImpact < 0 ? <ArrowDownRight size={34} /> : <ArrowUpRight size={34} />}
              <strong>{portfolioImpact >= 0 ? '+' : ''}{portfolioImpact.toFixed(1)}%</strong>
            </div>
            <em>{portfolioImpactValue >= 0 ? '+' : ''}{formatCurrency(portfolioImpactValue)}</em>
            <div className="confidence-band">
              <span>Confidence range</span>
              <strong>{confidenceLow.toFixed(1)}% to {confidenceHigh.toFixed(1)}%</strong>
            </div>
            <div className="risk-classification">
              <span>Risk classification</span>
              <strong>{getRiskClassification(portfolioImpact)}</strong>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      <section className="scenario-primary-grid">
        <div className="workflow-card scenario-chart-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Projected Path</span>
              <h2>Portfolio Stress Curve</h2>
            </div>
            <span className="review-required">Indexed to 100</span>
          </div>
          <ResponsiveContainer width="100%" height={330}>
            <AreaChart data={impactPath}>
              <defs>
                <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={portfolioImpact < 0 ? '#ec6f86' : '#55d99a'} stopOpacity={0.26} />
                  <stop offset="95%" stopColor={portfolioImpact < 0 ? '#ec6f86' : '#55d99a'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip content={<ImpactTooltip />} />
              <Area type="monotone" dataKey="baseline" name="Baseline" stroke="rgba(255,255,255,0.36)" strokeWidth={2} strokeDasharray="4 5" fill="transparent" />
              <Area type="monotone" dataKey="scenario" name="Scenario" stroke={portfolioImpact < 0 ? '#ec6f86' : '#55d99a'} strokeWidth={3} fill="url(#scenarioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <FinanceImpactCard
          title="Portfolio Shock"
          totalLabel={portfolioImpact < 0 ? 'DRAWDOWN' : 'UPSIDE'}
          primaryLabel="Risk Capital"
          secondaryLabel="Offset"
          primaryValue={riskCapital}
          secondaryValue={hedgeOffset}
          primaryDelta={formatPercent(portfolioImpact)}
          secondaryDelta={strongestHedge ? `${strongestHedge.sector} +${strongestHedge.impact.toFixed(1)}%` : 'No explicit hedge'}
          onMoreDetails={() => document.getElementById('scenario-briefing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </section>

      <section className="scenario-impact-grid">
        <div className="workflow-card impact-holdings-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Holding Impact</span>
              <h2>Expected Move By Position</h2>
            </div>
          </div>
          <div className="impact-card-list">
            {impacts.map(impact => {
              const exposure = (weights[impact.symbol] || 0) * 100;
              const effect = (weights[impact.symbol] || 0) * impact.changePercent;
              return (
                <div key={impact.symbol} className="holding-impact-card">
                  <div>
                    <strong>{impact.symbol}</strong>
                    <span>{impact.name}</span>
                  </div>
                  <div>
                    <span>Expected move</span>
                    <strong className={impact.changePercent >= 0 ? 'positive' : 'negative'}>{formatPercent(impact.changePercent)}</strong>
                  </div>
                  <div>
                    <span>Exposure</span>
                    <strong>{exposure.toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span>Portfolio effect</span>
                    <strong className={effect >= 0 ? 'positive' : 'negative'}>{effect >= 0 ? '+' : ''}{effect.toFixed(2)}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="workflow-card sector-heatmap-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Sector Exposure</span>
              <h2>Macro Heatmap</h2>
            </div>
          </div>
          <div className="sector-heatmap">
            {sectorImpacts.map(item => {
              const intensity = Math.min(1, Math.abs(item.impact) / 35);
              return (
                <div
                  key={item.sector}
                  className={`sector-heat-cell ${item.impact >= 0 ? 'positive' : 'negative'}`}
                  style={{ '--heat': intensity } as CSSProperties}
                >
                  <span>{item.sector}</span>
                  <strong>{item.impact >= 0 ? '+' : ''}{item.impact.toFixed(1)}%</strong>
                  <em>{item.exposure.toFixed(0)}% exposure</em>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="scenario-briefing" className="scenario-briefing-grid">
        <div className="workflow-card macro-briefing-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">AI Macro Briefing</span>
              <h2>Executive Readout</h2>
            </div>
            <span className="review-required"><Shield size={14} /> Human review required</span>
          </div>
          <div className="briefing-columns">
            <div className="briefing-main">
              <span>Executive summary</span>
              <p>
                {scenario.name} would likely create a {portfolioImpact < -8 ? 'meaningful' : 'moderate'} portfolio stress event,
                with the largest pressure coming from {vulnerableSector?.sector ?? 'the highest-exposure sector'} and the most visible
                holding-level sensitivity in {mostAffectedHolding?.symbol ?? 'the portfolio'}.
              </p>
            </div>
            <div>
              <span>Primary risk</span>
              <strong>{vulnerableSector?.sector ?? 'N/A'}</strong>
              <p>{(vulnerableSector?.exposure ?? 0).toFixed(0)}% portfolio exposure with {vulnerableSector?.impact.toFixed(1)}% modeled sector sensitivity.</p>
            </div>
            <div>
              <span>Strongest hedge</span>
              <strong>{strongestHedge?.sector ?? 'No natural hedge'}</strong>
              <p>{strongestHedge ? `${strongestHedge.impact.toFixed(1)}% modeled sector benefit.` : 'This portfolio has limited positive sector offset in the selected scenario.'}</p>
            </div>
            <div>
              <span>Confidence score</span>
              <strong>{Math.max(58, 86 - Math.abs(portfolioImpact) * 1.5).toFixed(0)}%</strong>
              <p>Based on sector sensitivity assumptions, current weights, and simplified factor exposure.</p>
            </div>
          </div>
          <div className="suggested-actions">
            <span className="label-upper">Suggested Review Actions</span>
            <ul>
              <li>Review whether {mostAffectedHolding?.symbol ?? 'top holdings'} risk is thesis-specific or macro-driven.</li>
              <li>Compare the scenario drawdown with your acceptable holding-period volatility.</li>
              <li>Validate sector sensitivity assumptions before making any portfolio decision.</li>
            </ul>
          </div>
          <p className="workflow-footnote">Educational analysis only. Not financial advice. Scenario outputs are illustrative estimates and do not guarantee future results.</p>
        </div>

        <div className="workflow-card scenario-summary-stack">
          <div>
            <span className="label-upper">Most Vulnerable</span>
            <strong>{mostAffectedHolding?.symbol ?? 'N/A'}</strong>
            <p>{mostAffectedHolding ? `${formatPercent(mostAffectedHolding.changePercent)} expected move under this macro setup.` : 'No holdings available.'}</p>
          </div>
          <div>
            <span className="label-upper">Most Resilient</span>
            <strong>{bestHolding?.symbol ?? 'N/A'}</strong>
            <p>{bestHolding ? `${formatPercent(bestHolding.changePercent)} expected move under this macro setup.` : 'No holdings available.'}</p>
          </div>
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
