import type { Scenario, ScenarioImpact, StockQuote } from '../types';
import { STOCK_DATABASE } from '../data/mockStocks';

// Sector sensitivity map: scenario → { sector → impact multiplier }
const SECTOR_SENSITIVITIES: Record<string, Record<string, number>> = {
  rates_rise: {
    'Technology': -0.18,
    'Communication Services': -0.12,
    'Consumer Discretionary': -0.10,
    'Consumer Staples': -0.06,
    'Financials': +0.08,
    'Healthcare': -0.05,
    'Energy': +0.02,
    'Utilities': -0.15,
    'Real Estate': -0.20,
    'Industrials': -0.07,
    'Materials': -0.05,
    'ETF': -0.08,
  },
  inflation_shock: {
    'Technology': -0.14,
    'Communication Services': -0.10,
    'Consumer Discretionary': -0.12,
    'Consumer Staples': +0.05,
    'Financials': +0.03,
    'Healthcare': +0.02,
    'Energy': +0.18,
    'Utilities': +0.04,
    'Real Estate': +0.06,
    'Industrials': -0.06,
    'Materials': +0.12,
    'ETF': -0.04,
  },
  recession: {
    'Technology': -0.28,
    'Communication Services': -0.22,
    'Consumer Discretionary': -0.32,
    'Consumer Staples': -0.08,
    'Financials': -0.25,
    'Healthcare': -0.10,
    'Energy': -0.20,
    'Utilities': -0.05,
    'Real Estate': -0.28,
    'Industrials': -0.30,
    'Materials': -0.26,
    'ETF': -0.22,
  },
  tech_selloff: {
    'Technology': -0.35,
    'Communication Services': -0.28,
    'Consumer Discretionary': -0.15,
    'Consumer Staples': +0.04,
    'Financials': -0.08,
    'Healthcare': +0.02,
    'Energy': +0.03,
    'Utilities': +0.05,
    'Real Estate': +0.02,
    'Industrials': -0.06,
    'Materials': -0.04,
    'ETF': -0.18,
  },
  oil_spike: {
    'Technology': -0.06,
    'Communication Services': -0.04,
    'Consumer Discretionary': -0.10,
    'Consumer Staples': -0.06,
    'Financials': -0.03,
    'Healthcare': -0.02,
    'Energy': +0.22,
    'Utilities': -0.08,
    'Real Estate': -0.05,
    'Industrials': -0.08,
    'Materials': +0.05,
    'ETF': -0.03,
  },
  strong_dollar: {
    'Technology': -0.08,
    'Communication Services': -0.06,
    'Consumer Discretionary': -0.07,
    'Consumer Staples': -0.05,
    'Financials': +0.02,
    'Healthcare': -0.04,
    'Energy': -0.10,
    'Utilities': -0.02,
    'Real Estate': -0.03,
    'Industrials': -0.06,
    'Materials': -0.08,
    'ETF': -0.05,
  },
  em_stress: {
    'Technology': -0.10,
    'Communication Services': -0.08,
    'Consumer Discretionary': -0.12,
    'Consumer Staples': -0.04,
    'Financials': -0.15,
    'Healthcare': -0.03,
    'Energy': -0.06,
    'Utilities': -0.02,
    'Real Estate': -0.08,
    'Industrials': -0.10,
    'Materials': -0.12,
    'ETF': -0.08,
  },
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'rates_rise',
    name: 'Interest Rates +1.5%',
    description: 'Fed raises rates by 150 basis points',
    icon: '📈',
    impacts: SECTOR_SENSITIVITIES.rates_rise,
    severity: 'high',
    affectedSectors: ['Technology', 'Real Estate', 'Utilities', 'Financials'],
    explanation: `A 150bps rate hike increases borrowing costs across the economy. Growth stocks with distant cash flows face the steepest discounting headwind. Banks see improved net interest margins. Real estate and utilities face rising debt costs and competition from bonds. Tech valuations compress as the discount rate climbs.`,
  },
  {
    id: 'inflation_shock',
    name: 'Inflation Shock +3%',
    description: 'CPI surges 300bps above expectations',
    icon: '🔥',
    impacts: SECTOR_SENSITIVITIES.inflation_shock,
    severity: 'high',
    affectedSectors: ['Energy', 'Materials', 'Consumer Staples', 'Technology'],
    explanation: `An inflation shock of 3% forces the Fed to act aggressively. Energy and commodity stocks benefit as hard assets outperform. Consumer staples can pass through prices. High-multiple tech names get hurt as real rates rise and margins compress from input cost inflation.`,
  },
  {
    id: 'recession',
    name: 'Recession',
    description: 'Two consecutive quarters of GDP contraction',
    icon: '📉',
    impacts: SECTOR_SENSITIVITIES.recession,
    severity: 'extreme',
    affectedSectors: ['Industrials', 'Consumer Discretionary', 'Financials', 'Energy'],
    explanation: `A recession triggers broad earnings downgrades. Consumer discretionary suffers as households cut spending. Industrials and financials see sharp contraction in revenues. Defensive sectors like healthcare and consumer staples hold up relatively well. Expect elevated volatility and flight to safety.`,
  },
  {
    id: 'tech_selloff',
    name: 'Tech Selloff −30%',
    description: 'Major correction in technology sector',
    icon: '💻',
    impacts: SECTOR_SENSITIVITIES.tech_selloff,
    severity: 'extreme',
    affectedSectors: ['Technology', 'Communication Services', 'Consumer Discretionary'],
    explanation: `A tech sector rotation triggers a 30%+ correction. Mega-cap tech loses significant value, dragging communication services with it. Value sectors like utilities and consumer staples benefit from rotation flows. Portfolios heavily weighted in growth/tech face outsized drawdowns.`,
  },
  {
    id: 'oil_spike',
    name: 'Oil Price +40%',
    description: 'Crude oil surges on supply shock',
    icon: '🛢️',
    impacts: SECTOR_SENSITIVITIES.oil_spike,
    severity: 'medium',
    affectedSectors: ['Energy', 'Industrials', 'Consumer Discretionary'],
    explanation: `An oil price spike benefits energy producers directly. Transportation-heavy industrials and consumer-facing companies see margin pressure. Airlines, logistics, and consumer discretionary names face significant cost increases. Energy stocks and their suppliers outperform.`,
  },
  {
    id: 'strong_dollar',
    name: 'Strong Dollar +10%',
    description: 'USD appreciates 10% against major currencies',
    icon: '💵',
    impacts: SECTOR_SENSITIVITIES.strong_dollar,
    severity: 'medium',
    affectedSectors: ['Technology', 'Energy', 'Materials'],
    explanation: `Dollar strength hurts US multinationals with significant overseas revenue. Tech giants earning in euros/yen face currency headwinds. Commodity prices typically fall (denominated in USD), hurting energy and materials. Domestic-focused companies are less exposed.`,
  },
  {
    id: 'em_stress',
    name: 'EM Market Stress',
    description: 'Emerging market contagion spreads to US',
    icon: '🌏',
    impacts: SECTOR_SENSITIVITIES.em_stress,
    severity: 'medium',
    affectedSectors: ['Financials', 'Materials', 'Consumer Discretionary'],
    explanation: `Emerging market stress triggers risk-off sentiment. Financials with EM exposure face writedowns. Global supply chains are disrupted, affecting industrials and consumer discretionary. Capital flows to safe havens. Companies with domestic focus are most insulated.`,
  },
];

/** Apply scenario to portfolio stocks */
export function applyScenario(
  symbols: string[],
  quotes: Record<string, StockQuote | null>,
  scenarioId: string
): ScenarioImpact[] {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return [];

  return symbols.map(symbol => {
    const quote = quotes[symbol] || STOCK_DATABASE[symbol] as StockQuote;
    if (!quote) return null;
    const sector = quote.sector || 'Technology';
    const impact = scenario.impacts[sector] ?? -0.05;
    // Add stock-specific beta adjustment
    const betaAdj = (quote.beta || 1) - 1;
    const totalImpact = impact + betaAdj * impact * 0.3;
    const impactedPrice = quote.price * (1 + totalImpact);

    return {
      symbol,
      name: quote.name,
      basePrice: quote.price,
      impactedPrice,
      changePercent: totalImpact * 100,
      sector,
    };
  }).filter(Boolean) as ScenarioImpact[];
}

/** Calculate portfolio-level scenario impact */
export function calcPortfolioScenarioImpact(
  impacts: ScenarioImpact[],
  weights: Record<string, number>
): number {
  return impacts.reduce((sum, imp) => {
    const weight = weights[imp.symbol] || 0;
    return sum + weight * imp.changePercent;
  }, 0);
}
