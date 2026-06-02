// ============================================================
// Earnings Service — Calendar, Summaries, Transcripts
// Primary: Finnhub + FMP | Fallback: mock data
// ============================================================

import { COMPANY_FUNDAMENTALS } from '../data/financialData';

const FINNHUB_BASE = '/api/finnhub/api/v1';
function finnhubKey() { return import.meta.env.VITE_FINNHUB_API_KEY ?? ''; }
function hasFinnhub() { return !!finnhubKey(); }

const FMP_BASE = '/api/fmp/api/v3';
function fmpKey() { return import.meta.env.VITE_FMP_API_KEY ?? ''; }

// ─── Latest earnings summary ──────────────────────────────────────────────────

export async function getLatestEarnings(symbol: string) {
  const sym = symbol.toUpperCase();

  if (hasFinnhub()) {
    try {
      const r = await fetch(`${FINNHUB_BASE}/stock/earnings?symbol=${sym}&limit=4&token=${finnhubKey()}`, { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const data = await r.json();
        if (data && data.length > 0) return data[0];
      }
    } catch { /* fall through */ }
  }

  // Mock fallback
  return COMPANY_FUNDAMENTALS[sym]?.latestEarnings ?? null;
}

// ─── Earnings calendar ────────────────────────────────────────────────────────

export async function getEarningsCalendar(symbols?: string[]) {
  if (hasFinnhub()) {
    try {
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const r = await fetch(`${FINNHUB_BASE}/calendar/earnings?from=${from}&to=${to}&token=${finnhubKey()}`, { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const data = await r.json();
        if (data?.earningsCalendar) return data.earningsCalendar.slice(0, 20);
      }
    } catch { /* fall through */ }
  }

  // Mock upcoming earnings
  return generateMockCalendar(symbols);
}

function generateMockCalendar(symbols?: string[]) {
  const upcoming = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'JPM', 'V', 'JNJ'];
  const filtered = symbols ? upcoming.filter(s => symbols.includes(s)) : upcoming;
  return filtered.map((sym, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i + 1) * 12 + Math.floor(Math.random() * 5));
    return {
      symbol: sym,
      date: date.toISOString().split('T')[0],
      hour: i % 2 === 0 ? 'amc' : 'bmo',
      epsEstimate: (Math.random() * 3 + 0.5).toFixed(2),
      revenueEstimate: `${(Math.random() * 50 + 10).toFixed(1)}B`,
      quarter: 'Q4 2024',
    };
  });
}

// ─── Build earnings context string for AI ────────────────────────────────────

export async function buildEarningsContext(symbol: string): Promise<string> {
  const sym = symbol.toUpperCase();
  const earnings = await getLatestEarnings(sym);
  if (!earnings) return `No earnings data available for ${sym}.`;

  const lines: string[] = [];
  lines.push(`LATEST EARNINGS: ${earnings.quarter ?? 'Recent Quarter'}`);
  lines.push(`Date: ${earnings.date}`);

  if (earnings.revenueActual !== undefined) {
    const revBeat = ((earnings.revenueActual - earnings.revenueEstimate) / earnings.revenueEstimate * 100).toFixed(1);
    lines.push(`Revenue: $${(earnings.revenueActual / 1e6).toFixed(0)}M vs estimate $${(earnings.revenueEstimate / 1e6).toFixed(0)}M (${parseFloat(revBeat) >= 0 ? '+' : ''}${revBeat}% surprise)`);
  }

  if (earnings.epsActual !== undefined) {
    const epsBeat = ((earnings.epsActual - earnings.epsEstimate) / Math.abs(earnings.epsEstimate) * 100).toFixed(1);
    lines.push(`EPS: $${earnings.epsActual.toFixed(2)} vs estimate $${earnings.epsEstimate.toFixed(2)} (${parseFloat(epsBeat) >= 0 ? '+' : ''}${epsBeat}% surprise)`);
  }

  if (earnings.guidance) {
    lines.push(`GUIDANCE: ${earnings.guidance}`);
  }

  if (earnings.keyHighlights?.length > 0) {
    lines.push('\nKEY HIGHLIGHTS:');
    earnings.keyHighlights.forEach((h: string) => lines.push(`• ${h}`));
  }

  if (earnings.managementTone) {
    lines.push(`\nMANAGEMENT TONE: ${earnings.managementTone.toUpperCase()}`);
  }

  lines.push(`\nOVERALL BEAT/MISS: ${earnings.surprise >= 0 ? 'BEAT' : 'MISS'} (${earnings.surprise >= 0 ? '+' : ''}${earnings.surprise?.toFixed(1) ?? '?'}% on EPS)`);

  return lines.join('\n');
}
