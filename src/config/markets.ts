// src/config/markets.ts
// Single source of truth for all supported markets.

export interface Market {
  id: string;
  name: string;
  flag: string;
  suffix: string;       // yfinance suffix, '' for US
  currency: string;     // ISO 4217
  currencySymbol: string;
  locale: string;       // for Intl.NumberFormat
  benchmarkTicker: string;
  benchmarkName: string;
  timezone: string;
}

export const MARKETS: Market[] = [
  {
    id: 'US',
    name: 'United States',
    flag: '🇺🇸',
    suffix: '',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    benchmarkTicker: 'SPY',
    benchmarkName: 'S&P 500',
    timezone: 'America/New_York',
  },
  {
    id: 'BR',
    name: 'Brasil (B3)',
    flag: '🇧🇷',
    suffix: '.SA',
    currency: 'BRL',
    currencySymbol: 'R$',
    locale: 'pt-BR',
    benchmarkTicker: 'BOVA11.SA',
    benchmarkName: 'IBOVESPA (BOVA11)',
    timezone: 'America/Sao_Paulo',
  },
  {
    id: 'UK',
    name: 'United Kingdom (LSE)',
    flag: '🇬🇧',
    suffix: '.L',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    benchmarkTicker: 'ISF.L',
    benchmarkName: 'FTSE 100 (ISF)',
    timezone: 'Europe/London',
  },
  {
    id: 'DE',
    name: 'Germany (XETRA)',
    flag: '🇩🇪',
    suffix: '.DE',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    benchmarkTicker: 'EXS1.DE',
    benchmarkName: 'DAX (EXS1)',
    timezone: 'Europe/Berlin',
  },
  {
    id: 'FR',
    name: 'France (Euronext)',
    flag: '🇫🇷',
    suffix: '.PA',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    benchmarkTicker: 'CACC.PA',
    benchmarkName: 'CAC 40 (CACC)',
    timezone: 'Europe/Paris',
  },
  {
    id: 'JP',
    name: 'Japan (TSE)',
    flag: '🇯🇵',
    suffix: '.T',
    currency: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    benchmarkTicker: '1306.T',
    benchmarkName: 'TOPIX (1306)',
    timezone: 'Asia/Tokyo',
  },
  {
    id: 'HK',
    name: 'Hong Kong (HKEX)',
    flag: '🇭🇰',
    suffix: '.HK',
    currency: 'HKD',
    currencySymbol: 'HK$',
    locale: 'zh-HK',
    benchmarkTicker: '2800.HK',
    benchmarkName: 'Hang Seng (2800)',
    timezone: 'Asia/Hong_Kong',
  },
];

export const MARKET_MAP = Object.fromEntries(MARKETS.map(m => [m.id, m]));

/** Detect market from a ticker string based on suffix */
export function getMarketFromTicker(ticker: string): Market {
  const upper = ticker.toUpperCase();
  if (upper.endsWith('.SA')) return MARKET_MAP['BR'];
  if (upper.endsWith('.L'))  return MARKET_MAP['UK'];
  if (upper.endsWith('.DE')) return MARKET_MAP['DE'];
  if (upper.endsWith('.PA')) return MARKET_MAP['FR'];
  if (upper.endsWith('.T'))  return MARKET_MAP['JP'];
  if (upper.endsWith('.HK')) return MARKET_MAP['HK'];
  return MARKET_MAP['US'];
}

/** Format a price value using the correct currency for the ticker */
export function formatTickerPrice(value: number, ticker: string, digits = 2): string {
  const market = getMarketFromTicker(ticker);
  // JPY has no decimals by convention
  const d = market.currency === 'JPY' ? 0 : digits;
  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: market.currency,
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(value);
}

/** Get currency symbol for a ticker */
export function getCurrencySymbol(ticker: string): string {
  return getMarketFromTicker(ticker).currencySymbol;
}

/** Strip market suffix from ticker for display */
export function displayTicker(ticker: string): string {
  return ticker.replace(/\.(SA|L|DE|PA|T|HK)$/i, '');
}

/** Add market suffix to a base ticker */
export function addSuffix(baseTicker: string, marketId: string): string {
  const market = MARKET_MAP[marketId];
  if (!market || !market.suffix) return baseTicker.toUpperCase();
  return `${baseTicker.toUpperCase()}${market.suffix}`;
}
