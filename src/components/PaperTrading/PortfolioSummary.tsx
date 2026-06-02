import { Activity, BarChart3, Shield, Target, TrendingDown, Trophy } from 'lucide-react';
import type { PerformanceMetrics } from '../../types/portfolio';
import { formatPercent } from '../../utils/finance';

interface Props {
  metrics: PerformanceMetrics | null;
  loading?: boolean;
}

const items = [
  { key: 'totalReturn', label: 'Total Return', icon: Trophy, format: (v: number) => formatPercent(v) },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', icon: Target, format: (v: number) => v.toFixed(2) },
  { key: 'maxDrawdown', label: 'Max Drawdown', icon: TrendingDown, format: (v: number) => formatPercent(v) },
  { key: 'alpha', label: 'Alpha vs SPY', icon: Shield, format: (v: number) => formatPercent(v) },
  { key: 'volatilityAnnual', label: 'Annual Volatility', icon: BarChart3, format: (v: number) => formatPercent(v) },
  { key: 'winRate', label: 'Win Rate', icon: Activity, format: (v: number) => formatPercent(v) },
] as const;

export default function PortfolioSummary({ metrics, loading }: Props) {
  if (loading) {
    return (
      <section className="paper-summary-grid">
        {items.map(item => <div key={item.key} className="paper-metric-card"><div className="shimmer h-16 rounded-2xl" /></div>)}
      </section>
    );
  }

  return (
    <section className="paper-summary-grid">
      {items.map(item => {
        const Icon = item.icon;
        const value = metrics ? metrics[item.key] : 0;
        const positive = item.key === 'maxDrawdown' ? value > -10 : value >= 0;
        return (
          <div key={item.key} className="paper-metric-card">
            <div className="paper-metric-icon"><Icon size={16} /></div>
            <span>{item.label}</span>
            <strong className={positive ? 'positive' : 'negative'}>{item.format(value)}</strong>
          </div>
        );
      })}
    </section>
  );
}

