import { create } from 'zustand';
import type { PerformanceReport, Portfolio, TradeRequest } from '../types/portfolio';
import {
  createPortfolio,
  executeTrade,
  getPerformanceReport,
  getPortfolio,
  listPortfolios,
} from '../services/paperTradingApi';

interface PaperTradingState {
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  activePortfolio: Portfolio | null;
  report: PerformanceReport | null;
  loading: boolean;
  error: string | null;
  period: '1M' | '3M' | '6M' | '1Y' | 'All';
  loadPortfolios: () => Promise<void>;
  createNewPortfolio: (name: string, initialCash: number) => Promise<void>;
  selectPortfolio: (id: string) => Promise<void>;
  refreshActivePortfolio: () => Promise<void>;
  runTrade: (trade: TradeRequest) => Promise<void>;
  loadReport: () => Promise<void>;
  setPeriod: (period: PaperTradingState['period']) => void;
  clearError: () => void;
}

function getDateRange(period: PaperTradingState['period']) {
  const end = new Date();
  const start = new Date();
  if (period === '1M') start.setMonth(start.getMonth() - 1);
  else if (period === '3M') start.setMonth(start.getMonth() - 3);
  else if (period === '6M') start.setMonth(start.getMonth() - 6);
  else if (period === '1Y') start.setFullYear(start.getFullYear() - 1);
  else start.setFullYear(start.getFullYear() - 5);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export const usePaperTradingStore = create<PaperTradingState>((set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  activePortfolio: null,
  report: null,
  loading: false,
  error: null,
  period: '1Y',

  clearError: () => set({ error: null }),
  setPeriod: (period) => {
    set({ period });
    void get().loadReport();
  },

  loadPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const portfolios = await listPortfolios();
      const activePortfolioId = get().activePortfolioId ?? portfolios[0]?.id ?? null;
      set({ portfolios, activePortfolioId, activePortfolio: portfolios.find(p => p.id === activePortfolioId) ?? portfolios[0] ?? null });
      if (activePortfolioId) await get().loadReport();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load portfolios.' });
    } finally {
      set({ loading: false });
    }
  },

  createNewPortfolio: async (name, initialCash) => {
    set({ loading: true, error: null });
    try {
      const portfolio = await createPortfolio(name, initialCash);
      set(state => ({
        portfolios: [portfolio, ...state.portfolios],
        activePortfolioId: portfolio.id,
        activePortfolio: portfolio,
        report: null,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create portfolio.' });
    } finally {
      set({ loading: false });
    }
  },

  selectPortfolio: async (id) => {
    set({ activePortfolioId: id, loading: true, error: null });
    try {
      const portfolio = await getPortfolio(id);
      set({ activePortfolio: portfolio });
      await get().loadReport();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to select portfolio.' });
    } finally {
      set({ loading: false });
    }
  },

  refreshActivePortfolio: async () => {
    const id = get().activePortfolioId;
    if (!id) return;
    try {
      const portfolio = await getPortfolio(id);
      set({ activePortfolio: portfolio });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh portfolio.' });
    }
  },

  runTrade: async (trade) => {
    const id = get().activePortfolioId;
    if (!id) {
      set({ error: 'Create or select a portfolio before trading.' });
      return;
    }
    set({ loading: true, error: null });
    try {
      const portfolio = await executeTrade(id, trade);
      set({ activePortfolio: portfolio, portfolios: get().portfolios.map(p => p.id === id ? portfolio : p) });
      await get().loadReport();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Trade failed.' });
    } finally {
      set({ loading: false });
    }
  },

  loadReport: async () => {
    const id = get().activePortfolioId;
    if (!id) return;
    const { start, end } = getDateRange(get().period);
    try {
      const report = await getPerformanceReport(id, start, end);
      // Clear any stale report-related error so the banner doesn't flash
      set({ report, error: null });
    } catch (err) {
      // Only show the error banner if the portfolio has holdings (otherwise
      // "no data" is expected and should not flash an error on the page).
      const hasHoldings = (get().activePortfolio?.holdings.length ?? 0) > 0;
      set({
        report: null,
        error: hasHoldings
          ? (err instanceof Error ? err.message : 'Metrics unavailable. Check backend data feed.')
          : null,
      });
    }
  },
}));
