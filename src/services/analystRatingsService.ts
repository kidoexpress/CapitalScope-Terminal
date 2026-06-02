// ============================================================
// Analyst Ratings Service
// Primary: Finnhub + FMP | Fallback: mock consensus data
// ============================================================

import { COMPANY_FUNDAMENTALS } from '../data/financialData';

const FINNHUB_BASE = '/api/finnhub/api/v1';
function finnhubKey() { return import.meta.env.VITE_FINNHUB_API_KEY ?? ''; }

export interface AnalystRating {
  symbol: string;
  consensus: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  avgTarget: number;
  highTarget: number;
  lowTarget: number;
  totalAnalysts: number;
  source: 'live' | 'mock';
}

// ─── Fetch consensus ratings ──────────────────────────────────────────────────

export async function getAnalystRatings(symbol: string): Promise<AnalystRating | null> {
  const sym = symbol.toUpperCase();

  if (finnhubKey()) {
    try {
      const [recR, ptR] = await Promise.all([
        fetch(`${FINNHUB_BASE}/stock/recommendation?symbol=${sym}&token=${finnhubKey()}`, { signal: AbortSignal.timeout(4000) }),
        fetch(`${FINNHUB_BASE}/stock/price-target?symbol=${sym}&token=${finnhubKey()}`, { signal: AbortSignal.timeout(4000) }),
      ]);

      if (recR.ok && ptR.ok) {
        const [recs, pt] = await Promise.all([recR.json(), ptR.json()]);
        if (recs && recs.length > 0) {
          const latest = recs[0];
          const total = (latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell) || 1;
          const score = (latest.strongBuy * 5 + latest.buy * 4 + latest.hold * 3 + latest.sell * 2 + latest.strongSell * 1) / total;
          return {
            symbol: sym,
            consensus: score >= 4.2 ? 'Strong Buy' : score >= 3.5 ? 'Buy' : score >= 2.5 ? 'Hold' : 'Sell',
            strongBuy: latest.strongBuy,
            buy: latest.buy,
            hold: latest.hold,
            sell: latest.sell,
            strongSell: latest.strongSell,
            avgTarget: pt.targetMean ?? 0,
            highTarget: pt.targetHigh ?? 0,
            lowTarget: pt.targetLow ?? 0,
            totalAnalysts: total,
            source: 'live',
          };
        }
      }
    } catch { /* fall through */ }
  }

  // Mock fallback
  const mockData = COMPANY_FUNDAMENTALS[sym]?.analystConsensus;
  if (!mockData) return null;

  return {
    symbol: sym,
    ...mockData,
    totalAnalysts: mockData.strongBuy + mockData.buy + mockData.hold + mockData.sell + mockData.strongSell,
    source: 'mock',
  };
}

// ─── Build analyst context string for AI ─────────────────────────────────────

export async function buildAnalystContext(symbol: string): Promise<string> {
  const ratings = await getAnalystRatings(symbol);
  if (!ratings) return 'No analyst rating data available.';

  const total = ratings.totalAnalysts;
  const bullish = ratings.strongBuy + ratings.buy;
  const bullPct = ((bullish / total) * 100).toFixed(0);

  const lines = [
    `ANALYST CONSENSUS: ${ratings.consensus} (${ratings.source === 'mock' ? 'Synthetic estimate' : 'Live data'})`,
    `Strong Buy: ${ratings.strongBuy} | Buy: ${ratings.buy} | Hold: ${ratings.hold} | Sell: ${ratings.sell} | Strong Sell: ${ratings.strongSell}`,
    `Bullish skew: ${bullPct}% of ${total} analysts are Buy or Strong Buy`,
    `Price target: $${ratings.avgTarget.toFixed(0)} avg | Range: $${ratings.lowTarget.toFixed(0)}–$${ratings.highTarget.toFixed(0)}`,
  ];

  if (ratings.source === 'mock') {
    lines.push('NOTE: Analyst ratings are illustrative estimates, not real consensus data.');
  }

  return lines.join('\n');
}

// ─── Consensus bar component data ────────────────────────────────────────────

export function getRatingBreakdown(ratings: AnalystRating) {
  const total = ratings.totalAnalysts || 1;
  return [
    { label: 'Strong Buy', count: ratings.strongBuy, pct: (ratings.strongBuy / total) * 100, color: '#10b981' },
    { label: 'Buy', count: ratings.buy, pct: (ratings.buy / total) * 100, color: '#34d399' },
    { label: 'Hold', count: ratings.hold, pct: (ratings.hold / total) * 100, color: '#f59e0b' },
    { label: 'Sell', count: ratings.sell, pct: (ratings.sell / total) * 100, color: '#f87171' },
    { label: 'Strong Sell', count: ratings.strongSell, pct: (ratings.strongSell / total) * 100, color: '#ef4444' },
  ];
}
