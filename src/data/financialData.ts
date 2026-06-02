// ============================================================
// Comprehensive mock financial data — realistic FY2023/2024
// figures sourced from public earnings reports. Used as
// fallback when API keys are not configured.
// ============================================================

export interface IncomeStatement {
  year: number;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  operatingIncome: number;
  operatingMargin: number;
  netIncome: number;
  netMargin: number;
  eps: number;
  revenueGrowth: number;
}

export interface BalanceSheet {
  year: number;
  cash: number;
  totalAssets: number;
  totalDebt: number;
  netDebt: number;
  equity: number;
  debtToEquity: number;
}

export interface CashFlow {
  year: number;
  operatingCF: number;
  capex: number;
  freeCashFlow: number;
  fcfMargin: number;
  dividends: number;
  buybacks: number;
}

export interface EarningsSummary {
  quarter: string;
  date: string;
  revenueActual: number;
  revenueEstimate: number;
  epsActual: number;
  epsEstimate: number;
  guidanceMid: number | null;
  guidance: string;
  surprise: number;
  keyHighlights: string[];
  managementTone: 'bullish' | 'cautious' | 'mixed';
}

export interface AnalystConsensus {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  avgTarget: number;
  highTarget: number;
  lowTarget: number;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  lastUpdated: string;
}

export interface CompanyFundamentals {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  founded: number;
  employees: number;
  ceo: string;
  headquarters: string;
  website: string;
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashFlows: CashFlow[];
  latestEarnings: EarningsSummary;
  analystConsensus: AnalystConsensus;
  keyMetrics: {
    peRatio: number;
    forwardPE: number;
    evEbitda: number;
    pbRatio: number;
    psRatio: number;
    roe: number;
    roic: number;
    currentRatio: number;
  };
}

export const COMPANY_FUNDAMENTALS: Record<string, CompanyFundamentals> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. It also sells various related services including App Store, Apple Music, iCloud, Apple TV+, and Apple Pay.',
    founded: 1976,
    employees: 150000,
    ceo: 'Tim Cook',
    headquarters: 'Cupertino, CA',
    website: 'apple.com',
    incomeStatements: [
      { year: 2024, revenue: 391035, grossProfit: 180683, grossMargin: 46.2, ebitda: 135063, ebitdaMargin: 34.5, operatingIncome: 123216, operatingMargin: 31.5, netIncome: 93736, netMargin: 24.0, eps: 6.11, revenueGrowth: 2.0 },
      { year: 2023, revenue: 383285, grossProfit: 169148, grossMargin: 44.1, ebitda: 127673, ebitdaMargin: 33.3, operatingIncome: 114301, operatingMargin: 29.8, netIncome: 96995, netMargin: 25.3, eps: 6.16, revenueGrowth: -2.8 },
      { year: 2022, revenue: 394328, grossProfit: 170782, grossMargin: 43.3, ebitda: 130541, ebitdaMargin: 33.1, operatingIncome: 119437, operatingMargin: 30.3, netIncome: 99803, netMargin: 25.3, eps: 6.11, revenueGrowth: 7.8 },
      { year: 2021, revenue: 365817, grossProfit: 152836, grossMargin: 41.8, ebitda: 120233, ebitdaMargin: 32.9, operatingIncome: 108949, operatingMargin: 29.8, netIncome: 94680, netMargin: 25.9, eps: 5.61, revenueGrowth: 33.3 },
      { year: 2020, revenue: 274515, grossProfit: 104956, grossMargin: 38.2, ebitda: 81020, ebitdaMargin: 29.5, operatingIncome: 66288, operatingMargin: 24.1, netIncome: 57411, netMargin: 20.9, eps: 3.28, revenueGrowth: 5.5 },
    ],
    balanceSheets: [
      { year: 2024, cash: 67200, totalAssets: 364980, totalDebt: 108700, netDebt: 41500, equity: 56950, debtToEquity: 1.91 },
      { year: 2023, cash: 61555, totalAssets: 352583, totalDebt: 111088, netDebt: 49533, equity: 62146, debtToEquity: 1.79 },
      { year: 2022, cash: 48304, totalAssets: 352755, totalDebt: 120069, netDebt: 71765, equity: 50672, debtToEquity: 2.37 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 118254, capex: -9447, freeCashFlow: 108807, fcfMargin: 27.8, dividends: -15234, buybacks: -94949 },
      { year: 2023, operatingCF: 113703, capex: -10959, freeCashFlow: 99584, fcfMargin: 26.0, dividends: -15025, buybacks: -77550 },
      { year: 2022, operatingCF: 122151, capex: -10708, freeCashFlow: 111443, fcfMargin: 28.3, dividends: -14841, buybacks: -89402 },
    ],
    latestEarnings: {
      quarter: 'Q4 FY2024',
      date: '2024-10-31',
      revenueActual: 94930,
      revenueEstimate: 94340,
      epsActual: 1.64,
      epsEstimate: 1.60,
      guidanceMid: 124000,
      guidance: 'Revenue guidance of $123–127B for Q1 FY2025, implying ~4% YoY growth',
      surprise: 2.5,
      keyHighlights: [
        'Services revenue hit record $25.0B (+12% YoY), now 26% of total',
        'iPhone revenue $46.2B (+5.5% YoY) aided by iPhone 16 launch',
        'Gross margin expanded to 46.2%, highest in company history',
        'Apple Intelligence features launching across devices drove upgrade cycle intent',
        'India revenue grew 30%+ YoY — emerging market execution improving',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 22, buy: 15, hold: 8, sell: 2, strongSell: 1,
      avgTarget: 237.50, highTarget: 300.00, lowTarget: 184.00,
      consensus: 'Buy', lastUpdated: '2024-11-15',
    },
    keyMetrics: { peRatio: 30.9, forwardPE: 28.4, evEbitda: 26.1, pbRatio: 52.8, psRatio: 7.4, roe: 160.6, roic: 55.4, currentRatio: 0.87 },
  },

  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software — Infrastructure',
    description: 'Microsoft Corporation develops and supports software, services, devices, and solutions. Segments include Productivity & Business Processes (Office, LinkedIn), Intelligent Cloud (Azure, SQL Server), and Personal Computing (Windows, Xbox).',
    founded: 1975,
    employees: 228000,
    ceo: 'Satya Nadella',
    headquarters: 'Redmond, WA',
    website: 'microsoft.com',
    incomeStatements: [
      { year: 2024, revenue: 245122, grossProfit: 171821, grossMargin: 70.1, ebitda: 125152, ebitdaMargin: 51.1, operatingIncome: 109433, operatingMargin: 44.6, netIncome: 88136, netMargin: 36.0, eps: 11.80, revenueGrowth: 15.7 },
      { year: 2023, revenue: 211915, grossProfit: 146052, grossMargin: 68.9, ebitda: 107226, ebitdaMargin: 50.6, operatingIncome: 88523, operatingMargin: 41.8, netIncome: 72361, netMargin: 34.1, eps: 9.72, revenueGrowth: 6.9 },
      { year: 2022, revenue: 198270, grossProfit: 135620, grossMargin: 68.4, ebitda: 97529, ebitdaMargin: 49.2, operatingIncome: 83383, operatingMargin: 42.1, netIncome: 72738, netMargin: 36.7, eps: 9.65, revenueGrowth: 17.9 },
      { year: 2021, revenue: 168088, grossProfit: 115856, grossMargin: 68.9, ebitda: 81826, ebitdaMargin: 48.7, operatingIncome: 69916, operatingMargin: 41.6, netIncome: 61271, netMargin: 36.5, eps: 8.05, revenueGrowth: 17.5 },
      { year: 2020, revenue: 143015, grossProfit: 96937, grossMargin: 67.8, ebitda: 66498, ebitdaMargin: 46.5, operatingIncome: 52959, operatingMargin: 37.0, netIncome: 44281, netMargin: 31.0, eps: 5.76, revenueGrowth: 13.6 },
    ],
    balanceSheets: [
      { year: 2024, cash: 75481, totalAssets: 512163, totalDebt: 79836, netDebt: 4355, equity: 268477, debtToEquity: 0.30 },
      { year: 2023, cash: 80686, totalAssets: 411976, totalDebt: 79970, netDebt: -716, equity: 206223, debtToEquity: 0.39 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 118548, capex: -44482, freeCashFlow: 74066, fcfMargin: 30.2, dividends: -21771, buybacks: -17204 },
      { year: 2023, operatingCF: 87582, capex: -28107, freeCashFlow: 59475, fcfMargin: 28.1, dividends: -19800, buybacks: -22245 },
    ],
    latestEarnings: {
      quarter: 'Q1 FY2025',
      date: '2024-10-30',
      revenueActual: 65585,
      revenueEstimate: 64519,
      epsActual: 3.30,
      epsEstimate: 3.10,
      guidanceMid: 69000,
      guidance: 'Q2 FY2025 guidance: $68.1–69.1B revenue; Azure growth guided 31–32%',
      surprise: 6.5,
      keyHighlights: [
        'Azure + cloud services +33% YoY, beating estimates of ~29%',
        'Microsoft 365 Commercial revenue +15% YoY, seat growth accelerating',
        'AI commercial revenue run rate exceeded $10B annualized (+4x YoY)',
        'Copilot integration driving 15% seat expansion in enterprise customers',
        'Gaming revenue +43% YoY aided by Activision Blizzard consolidation',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 31, buy: 12, hold: 5, sell: 1, strongSell: 0,
      avgTarget: 500.00, highTarget: 600.00, lowTarget: 380.00,
      consensus: 'Strong Buy', lastUpdated: '2024-11-10',
    },
    keyMetrics: { peRatio: 35.2, forwardPE: 30.8, evEbitda: 29.4, pbRatio: 12.1, psRatio: 12.7, roe: 36.0, roic: 28.4, currentRatio: 1.25 },
  },

  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'NVIDIA Corporation is a computing infrastructure company. Its platforms are used in data centers (AI/ML training, inference), automotive (DRIVE), gaming (GeForce), and professional visualization (RTX). Its GPU architecture powers modern AI workloads.',
    founded: 1993,
    employees: 29600,
    ceo: 'Jensen Huang',
    headquarters: 'Santa Clara, CA',
    website: 'nvidia.com',
    incomeStatements: [
      { year: 2025, revenue: 130497, grossProfit: 97329, grossMargin: 74.6, ebitda: 84592, ebitdaMargin: 64.8, operatingIncome: 81680, operatingMargin: 62.6, netIncome: 72880, netMargin: 55.8, eps: 2.94, revenueGrowth: 122.0 },
      { year: 2024, revenue: 60922, grossProfit: 44301, grossMargin: 72.7, ebitda: 35238, ebitdaMargin: 57.8, operatingIncome: 32972, operatingMargin: 54.1, netIncome: 29760, netMargin: 48.8, eps: 1.19, revenueGrowth: 122.4 },
      { year: 2023, revenue: 26974, grossProfit: 15356, grossMargin: 56.9, ebitda: 8534, ebitdaMargin: 31.6, operatingIncome: 4224, operatingMargin: 15.7, netIncome: 4368, netMargin: 16.2, eps: 0.17, revenueGrowth: 0.2 },
      { year: 2022, revenue: 26914, grossProfit: 17475, grossMargin: 64.9, ebitda: 13028, ebitdaMargin: 48.4, operatingIncome: 10041, operatingMargin: 37.3, netIncome: 9752, netMargin: 36.2, eps: 0.39, revenueGrowth: 61.4 },
    ],
    balanceSheets: [
      { year: 2025, cash: 43210, totalAssets: 111601, totalDebt: 8462, netDebt: -34748, equity: 65728, debtToEquity: 0.13 },
      { year: 2024, cash: 25984, totalAssets: 65728, totalDebt: 8463, netDebt: -17521, equity: 42978, debtToEquity: 0.20 },
    ],
    cashFlows: [
      { year: 2025, operatingCF: 64089, capex: -3248, freeCashFlow: 60841, fcfMargin: 46.6, dividends: -395, buybacks: -33690 },
      { year: 2024, operatingCF: 28608, capex: -1069, freeCashFlow: 27539, fcfMargin: 45.2, dividends: -395, buybacks: -9834 },
    ],
    latestEarnings: {
      quarter: 'Q3 FY2025',
      date: '2024-11-20',
      revenueActual: 35082,
      revenueEstimate: 33174,
      epsActual: 0.81,
      epsEstimate: 0.75,
      guidanceMid: 37500,
      guidance: 'Q4 FY2025 guidance: $37.5B ± 2%, Blackwell revenues expected to "several billions"',
      surprise: 8.1,
      keyHighlights: [
        'Data Center revenue $30.8B (+112% YoY) — structural AI compute demand continues',
        'Blackwell architecture production ramp ahead of schedule',
        'Gross margin 74.6% despite Blackwell ramp costs — exceptional execution',
        'Hyperscaler capex (MSFT, GOOGL, META, AMZN) guiding $55B+ for 2025',
        'China restrictions impact estimated ~$5B/year; demand shifting to compliant SKUs',
        'Automotive revenue growing — $11B design win pipeline for autonomous',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 38, buy: 8, hold: 4, sell: 1, strongSell: 0,
      avgTarget: 175.00, highTarget: 220.00, lowTarget: 100.00,
      consensus: 'Strong Buy', lastUpdated: '2024-11-22',
    },
    keyMetrics: { peRatio: 54.8, forwardPE: 32.4, evEbitda: 45.2, pbRatio: 45.6, psRatio: 30.6, roe: 128.6, roic: 95.4, currentRatio: 4.17 },
  },

  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Communication Services',
    industry: 'Internet Services & Infrastructure',
    description: 'Alphabet Inc. is the parent company of Google and several former Google subsidiaries. Its operations include Google Search, YouTube, Google Cloud, Google Advertising, and Other Bets (Waymo, DeepMind, Verily).',
    founded: 1998,
    employees: 181000,
    ceo: 'Sundar Pichai',
    headquarters: 'Mountain View, CA',
    website: 'abc.xyz',
    incomeStatements: [
      { year: 2024, revenue: 350018, grossProfit: 198769, grossMargin: 56.8, ebitda: 124792, ebitdaMargin: 35.7, operatingIncome: 104801, operatingMargin: 29.9, netIncome: 94315, netMargin: 27.0, eps: 7.64, revenueGrowth: 13.9 },
      { year: 2023, revenue: 307394, grossProfit: 167144, grossMargin: 54.4, ebitda: 97519, ebitdaMargin: 31.7, operatingIncome: 84293, operatingMargin: 27.4, netIncome: 73795, netMargin: 24.0, eps: 5.84, revenueGrowth: 8.7 },
      { year: 2022, revenue: 282836, grossProfit: 153459, grossMargin: 54.3, ebitda: 90614, ebitdaMargin: 32.0, operatingIncome: 74842, operatingMargin: 26.5, netIncome: 59972, netMargin: 21.2, eps: 4.56, revenueGrowth: 9.8 },
      { year: 2021, revenue: 257637, grossProfit: 146698, grossMargin: 56.9, ebitda: 96695, ebitdaMargin: 37.5, operatingIncome: 78714, operatingMargin: 30.6, netIncome: 76033, netMargin: 29.5, eps: 5.61, revenueGrowth: 41.2 },
    ],
    balanceSheets: [
      { year: 2024, cash: 93232, totalAssets: 450294, totalDebt: 29800, netDebt: -63432, equity: 325020, debtToEquity: 0.09 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 125297, capex: -52230, freeCashFlow: 73067, fcfMargin: 20.9, dividends: -2395, buybacks: -61000 },
    ],
    latestEarnings: {
      quarter: 'Q3 2024',
      date: '2024-10-29',
      revenueActual: 88268,
      revenueEstimate: 86291,
      epsActual: 2.12,
      epsEstimate: 1.84,
      guidanceMid: null,
      guidance: 'No formal guidance. Management commentary suggests Search AI Overviews expanding; Cloud backlog growing',
      surprise: 15.2,
      keyHighlights: [
        'Google Cloud +35% YoY to $11.4B; quarterly operating profit nearly doubled to $1.9B',
        'Search revenue +12% YoY — AI Overviews not showing monetization headwind',
        'YouTube ads +12.2% YoY to $8.9B; Shorts monetization improving',
        'Operating margin 28.0% vs 28.4% prior year — costs well-controlled',
        'Waymo now completing 150k+ paid rides/week in US cities',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 28, buy: 16, hold: 6, sell: 1, strongSell: 0,
      avgTarget: 210.00, highTarget: 250.00, lowTarget: 155.00,
      consensus: 'Strong Buy', lastUpdated: '2024-11-01',
    },
    keyMetrics: { peRatio: 22.6, forwardPE: 19.4, evEbitda: 18.8, pbRatio: 7.2, psRatio: 6.1, roe: 30.6, roic: 25.8, currentRatio: 1.95 },
  },

  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    industry: 'Electric Vehicles & Clean Energy',
    description: 'Tesla designs, develops, manufactures, and sells electric vehicles, energy generation and storage systems, and related services. Its vehicle portfolio includes Model S, 3, X, Y, Cybertruck, and Semi. Energy includes Powerwall, Megapack, and Solar.',
    founded: 2003,
    employees: 125665,
    ceo: 'Elon Musk',
    headquarters: 'Austin, TX',
    website: 'tesla.com',
    incomeStatements: [
      { year: 2024, revenue: 97690, grossProfit: 17668, grossMargin: 18.1, ebitda: 12670, ebitdaMargin: 13.0, operatingIncome: 7082, operatingMargin: 7.3, netIncome: 7089, netMargin: 7.3, eps: 2.24, revenueGrowth: 0.9 },
      { year: 2023, revenue: 96773, grossProfit: 17660, grossMargin: 18.2, ebitda: 13656, ebitdaMargin: 14.1, operatingIncome: 8891, operatingMargin: 9.2, netIncome: 14974, netMargin: 15.5, eps: 4.73, revenueGrowth: 18.8 },
      { year: 2022, revenue: 81462, grossProfit: 20853, grossMargin: 25.6, ebitda: 17788, ebitdaMargin: 21.8, operatingIncome: 13656, operatingMargin: 16.8, netIncome: 12556, netMargin: 15.4, eps: 3.62, revenueGrowth: 51.4 },
    ],
    balanceSheets: [
      { year: 2024, cash: 33648, totalAssets: 122070, totalDebt: 7672, netDebt: -25976, equity: 72930, debtToEquity: 0.11 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 14923, capex: -10899, freeCashFlow: 4024, fcfMargin: 4.1, dividends: 0, buybacks: 0 },
    ],
    latestEarnings: {
      quarter: 'Q3 2024',
      date: '2024-10-23',
      revenueActual: 25182,
      revenueEstimate: 25365,
      epsActual: 0.72,
      epsEstimate: 0.60,
      guidanceMid: null,
      guidance: 'Deliveries growth of 20-30% projected for 2025; FSD supervised rollout continuing',
      surprise: 20.0,
      keyHighlights: [
        'Gross margin 19.8% — best quarter in 2 years, beating 17.5% estimate',
        'Energy storage deployments 6.9 GWh (+73% YoY) — record Megapack revenue',
        'Services revenue $2.8B (+29% YoY) — high-margin recurring income',
        'Robotaxi event showed Cybercab prototype — longer timeline than bulls hoped',
        'Management guided 20-30% delivery growth for 2025 — ambitious vs. consensus ~10%',
      ],
      managementTone: 'mixed',
    },
    analystConsensus: {
      strongBuy: 12, buy: 10, hold: 15, sell: 8, strongSell: 5,
      avgTarget: 230.00, highTarget: 400.00, lowTarget: 85.00,
      consensus: 'Hold', lastUpdated: '2024-10-25',
    },
    keyMetrics: { peRatio: 110.9, forwardPE: 82.4, evEbitda: 78.6, pbRatio: 13.4, psRatio: 8.0, roe: 10.8, roic: 8.2, currentRatio: 1.84 },
  },

  META: {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Communication Services',
    industry: 'Social Media & Digital Advertising',
    description: 'Meta Platforms builds technologies that help people connect, find communities, and grow businesses. Its family of apps includes Facebook, Instagram, WhatsApp, and Messenger. Reality Labs develops AR/VR hardware (Quest, Ray-Ban) and software.',
    founded: 2004,
    employees: 72404,
    ceo: 'Mark Zuckerberg',
    headquarters: 'Menlo Park, CA',
    website: 'meta.com',
    incomeStatements: [
      { year: 2024, revenue: 164501, grossProfit: 132458, grossMargin: 80.5, ebitda: 82940, ebitdaMargin: 50.4, operatingIncome: 69381, operatingMargin: 42.2, netIncome: 62360, netMargin: 37.9, eps: 24.30, revenueGrowth: 22.1 },
      { year: 2023, revenue: 134902, grossProfit: 108237, grossMargin: 80.2, ebitda: 62720, ebitdaMargin: 46.5, operatingIncome: 46751, operatingMargin: 34.7, netIncome: 39098, netMargin: 29.0, eps: 14.87, revenueGrowth: 15.7 },
      { year: 2022, revenue: 116609, grossProfit: 83748, grossMargin: 71.8, ebitda: 37023, ebitdaMargin: 31.8, operatingIncome: 28940, operatingMargin: 24.8, netIncome: 23200, netMargin: 19.9, eps: 8.59, revenueGrowth: -1.1 },
    ],
    balanceSheets: [
      { year: 2024, cash: 70900, totalAssets: 265400, totalDebt: 28826, netDebt: -42074, equity: 182640, debtToEquity: 0.16 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 91470, capex: -39233, freeCashFlow: 52237, fcfMargin: 31.8, dividends: -1760, buybacks: -20111 },
    ],
    latestEarnings: {
      quarter: 'Q3 2024',
      date: '2024-10-30',
      revenueActual: 40589,
      revenueEstimate: 40265,
      epsActual: 6.03,
      epsEstimate: 5.24,
      guidanceMid: 46500,
      guidance: 'Q4 2024 revenue guidance $45–48B; full-year capex raised to $38–40B',
      surprise: 15.1,
      keyHighlights: [
        'MAU 3.29B (+5% YoY) — engagement holding despite competitive pressure',
        'Ad revenue per user +14% YoY; AI-powered ad targeting driving ARPU expansion',
        'Operating margin 43.0% — highest since 2021, "Year of Efficiency" delivering',
        'Reality Labs loss $4.4B — $20B+ cumulative losses but AR/VR pipeline building',
        'Llama 3 models driving developer ecosystem; Meta AI monthly actives growing',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 30, buy: 14, hold: 4, sell: 1, strongSell: 0,
      avgTarget: 620.00, highTarget: 750.00, lowTarget: 420.00,
      consensus: 'Strong Buy', lastUpdated: '2024-11-01',
    },
    keyMetrics: { peRatio: 21.8, forwardPE: 18.9, evEbitda: 20.4, pbRatio: 8.9, psRatio: 8.3, roe: 36.9, roic: 28.4, currentRatio: 2.72 },
  },

  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Discretionary',
    industry: 'E-Commerce & Cloud Computing',
    description: 'Amazon is the world\'s largest e-commerce company and a leading cloud services provider through AWS. It also operates Prime Video, Alexa, Ring, Whole Foods, and advertising businesses. AWS is the most profitable segment.',
    founded: 1994,
    employees: 1551000,
    ceo: 'Andy Jassy',
    headquarters: 'Seattle, WA',
    website: 'amazon.com',
    incomeStatements: [
      { year: 2024, revenue: 620128, grossProfit: 298286, grossMargin: 48.1, ebitda: 134380, ebitdaMargin: 21.7, operatingIncome: 68583, operatingMargin: 11.1, netIncome: 59248, netMargin: 9.6, eps: 5.53, revenueGrowth: 10.9 },
      { year: 2023, revenue: 574785, grossProfit: 270005, grossMargin: 47.0, ebitda: 103289, ebitdaMargin: 18.0, operatingIncome: 36852, operatingMargin: 6.4, netIncome: 30425, netMargin: 5.3, eps: 2.90, revenueGrowth: 11.9 },
      { year: 2022, revenue: 513983, grossProfit: 225152, grossMargin: 43.8, ebitda: 56736, ebitdaMargin: 11.0, operatingIncome: 12248, operatingMargin: 2.4, netIncome: -2722, netMargin: -0.5, eps: -0.27, revenueGrowth: 9.4 },
    ],
    balanceSheets: [
      { year: 2024, cash: 88282, totalAssets: 624894, totalDebt: 82869, netDebt: -5413, equity: 285786, debtToEquity: 0.29 },
    ],
    cashFlows: [
      { year: 2024, operatingCF: 115879, capex: -77419, freeCashFlow: 38460, fcfMargin: 6.2, dividends: 0, buybacks: 0 },
    ],
    latestEarnings: {
      quarter: 'Q3 2024',
      date: '2024-10-31',
      revenueActual: 158877,
      revenueEstimate: 157256,
      epsActual: 1.43,
      epsEstimate: 1.14,
      guidanceMid: 187500,
      guidance: 'Q4 2024 guidance: $181.5–188.5B revenue; operating income $16–20B',
      surprise: 25.4,
      keyHighlights: [
        'AWS +19% YoY to $27.5B; operating margin 38.1% — inflection point reached',
        'Advertising revenue +19% YoY to $14.3B — structurally undermonetized inventory',
        'Operating income $17.4B — running rate equivalent to ~$70B annualized',
        'AI infrastructure investments accelerating but being offset by AWS monetization',
        'Prime membership and engagement metrics at all-time highs',
      ],
      managementTone: 'bullish',
    },
    analystConsensus: {
      strongBuy: 40, buy: 10, hold: 3, sell: 0, strongSell: 0,
      avgTarget: 240.00, highTarget: 280.00, lowTarget: 185.00,
      consensus: 'Strong Buy', lastUpdated: '2024-11-02',
    },
    keyMetrics: { peRatio: 34.9, forwardPE: 28.4, evEbitda: 20.8, pbRatio: 9.6, psRatio: 3.3, roe: 22.0, roic: 14.4, currentRatio: 1.07 },
  },
};

export function getFundamentals(symbol: string): CompanyFundamentals | null {
  return COMPANY_FUNDAMENTALS[symbol.toUpperCase()] ?? null;
}

export function getAllSymbols(): string[] {
  return Object.keys(COMPANY_FUNDAMENTALS);
}
