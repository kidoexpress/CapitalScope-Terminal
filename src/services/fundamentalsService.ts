// ============================================================
// Fundamentals Service
// Sources: Financial Modeling Prep (FMP) primary,
//          Yahoo Finance fallback, mock data last resort
// ============================================================

import { COMPANY_FUNDAMENTALS, type CompanyFundamentals } from '../data/financialData';
import type { StockQuote } from '../types';
import { getStockQuote } from '../utils/api';

const FMP_BASE = '/api/fmp/api/v3';
const CACHE = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data as T);
  return fn().then(data => { CACHE.set(key, { data, ts: Date.now() }); return data; });
}

function fmpKey() { return import.meta.env.VITE_FMP_API_KEY ?? ''; }
function hasFMP() { return !!fmpKey(); }

// ─── Fetch income statements ──────────────────────────────────────────────────

export async function getIncomeStatements(symbol: string) {
  if (hasFMP()) {
    try {
      const data = await cached(`income:${symbol}`, async () => {
        const r = await fetch(`${FMP_BASE}/income-statement/${symbol}?limit=5&apikey=${fmpKey()}`, { signal: AbortSignal.timeout(4000) });
        return r.ok ? r.json() : null;
      });
      if (data && Array.isArray(data) && data.length > 0) return data;
    } catch { /* fall through */ }
  }
  return COMPANY_FUNDAMENTALS[symbol.toUpperCase()]?.incomeStatements ?? [];
}

// ─── Fetch balance sheet ──────────────────────────────────────────────────────

export async function getBalanceSheet(symbol: string) {
  if (hasFMP()) {
    try {
      const data = await cached(`bs:${symbol}`, async () => {
        const r = await fetch(`${FMP_BASE}/balance-sheet-statement/${symbol}?limit=3&apikey=${fmpKey()}`, { signal: AbortSignal.timeout(4000) });
        return r.ok ? r.json() : null;
      });
      if (data && Array.isArray(data)) return data;
    } catch { /* fall through */ }
  }
  return COMPANY_FUNDAMENTALS[symbol.toUpperCase()]?.balanceSheets ?? [];
}

// ─── Fetch cash flow ──────────────────────────────────────────────────────────

export async function getCashFlow(symbol: string) {
  if (hasFMP()) {
    try {
      const data = await cached(`cf:${symbol}`, async () => {
        const r = await fetch(`${FMP_BASE}/cash-flow-statement/${symbol}?limit=3&apikey=${fmpKey()}`, { signal: AbortSignal.timeout(4000) });
        return r.ok ? r.json() : null;
      });
      if (data && Array.isArray(data)) return data;
    } catch { /* fall through */ }
  }
  return COMPANY_FUNDAMENTALS[symbol.toUpperCase()]?.cashFlows ?? [];
}

// ─── Comprehensive company profile ───────────────────────────────────────────

export async function getCompanyProfile(symbol: string): Promise<CompanyFundamentals | null> {
  return COMPANY_FUNDAMENTALS[symbol.toUpperCase()] ?? null;
}

// ─── Build context string for AI agent ───────────────────────────────────────

export async function buildFundamentalsContext(symbol: string): Promise<string> {
  const sym = symbol.toUpperCase();
  const profile = COMPANY_FUNDAMENTALS[sym];
  const quote = await getStockQuote(sym).catch(() => null);
  const income = await getIncomeStatements(sym);
  const bs = await getBalanceSheet(sym);
  const cf = await getCashFlow(sym);

  const lines: string[] = [];

  if (profile) {
    lines.push(`COMPANY: ${profile.name} (${sym})`);
    lines.push(`SECTOR: ${profile.sector} | INDUSTRY: ${profile.industry}`);
    lines.push(`DESCRIPTION: ${profile.description}`);
    lines.push(`CEO: ${profile.ceo} | EMPLOYEES: ${profile.employees.toLocaleString()}`);
    lines.push('');
  }

  if (quote) {
    lines.push(`CURRENT PRICE: $${quote.price.toFixed(2)}`);
    lines.push(`DAY CHANGE: ${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%`);
    lines.push(`MARKET CAP: $${(quote.marketCap / 1e9).toFixed(1)}B`);
    lines.push(`52W RANGE: $${quote.low52w.toFixed(2)} – $${quote.high52w.toFixed(2)}`);
    lines.push(`P/E RATIO: ${quote.peRatio.toFixed(1)}x`);
    lines.push(`BETA: ${quote.beta.toFixed(2)}`);
    lines.push('');
  }

  if (income && income.length > 0) {
    lines.push('INCOME STATEMENT (Most Recent):');
    const latest = income[0];
    if (typeof latest.revenue === 'number') {
      lines.push(`Revenue: $${(latest.revenue / 1e6).toFixed(0)}M | Growth: ${latest.revenueGrowth > 0 ? '+' : ''}${latest.revenueGrowth?.toFixed(1) ?? '?'}%`);
      lines.push(`Gross Margin: ${latest.grossMargin?.toFixed(1) ?? '?'}%`);
      lines.push(`EBITDA Margin: ${latest.ebitdaMargin?.toFixed(1) ?? '?'}%`);
      lines.push(`Net Margin: ${latest.netMargin?.toFixed(1) ?? '?'}%`);
      lines.push(`EPS: $${latest.eps?.toFixed(2) ?? '?'}`);
    }
    lines.push('');
  }

  if (bs && bs.length > 0) {
    lines.push('BALANCE SHEET (Most Recent):');
    const latest = bs[0];
    if (typeof latest.cash === 'number') {
      lines.push(`Cash & Equivalents: $${(latest.cash / 1e6).toFixed(0)}M`);
      lines.push(`Total Debt: $${(latest.totalDebt / 1e6).toFixed(0)}M`);
      lines.push(`Net Debt/(Cash): $${(latest.netDebt / 1e6).toFixed(0)}M`);
    }
    lines.push('');
  }

  if (cf && cf.length > 0) {
    lines.push('CASH FLOW (Most Recent):');
    const latest = cf[0];
    if (typeof latest.freeCashFlow === 'number') {
      lines.push(`Free Cash Flow: $${(latest.freeCashFlow / 1e6).toFixed(0)}M`);
      lines.push(`FCF Margin: ${latest.fcfMargin?.toFixed(1) ?? '?'}%`);
      lines.push(`CapEx: $${(Math.abs(latest.capex ?? 0) / 1e6).toFixed(0)}M`);
    }
    lines.push('');
  }

  if (profile?.keyMetrics) {
    lines.push('KEY METRICS:');
    const km = profile.keyMetrics;
    lines.push(`P/E: ${km.peRatio}x | Forward P/E: ${km.forwardPE}x | EV/EBITDA: ${km.evEbitda}x`);
    lines.push(`P/B: ${km.pbRatio}x | P/S: ${km.psRatio}x`);
    lines.push(`ROE: ${km.roe.toFixed(1)}% | ROIC: ${km.roic.toFixed(1)}%`);
  }

  return lines.join('\n');
}
