import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number;
  format?: 'currency' | 'percent' | 'number' | 'text';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'green' | 'red' | 'blue' | 'purple' | 'yellow';
  icon?: ReactNode;
  description?: string;
  loading?: boolean;
}

const COLOR_MAP = {
  default: '#e2e8f0',
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  yellow: '#f59e0b',
};

export default function MetricCard({
  label, value, subValue, change, format = 'text',
  size = 'md', color = 'default', icon, description, loading
}: MetricCardProps) {
  const textColor = COLOR_MAP[color];
  const sizeClasses = { sm: 'p-3', md: 'p-4', lg: 'p-5' }[size];
  const valueSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[size];

  let displayValue = typeof value === 'number' ? value.toFixed(2) : value;
  if (loading) {
    return (
      <div className={`glass-panel ${sizeClasses} rounded-xl`}>
        <div className="shimmer h-3 w-20 rounded mb-3" />
        <div className="shimmer h-8 w-28 rounded" />
      </div>
    );
  }

  const ChangeIcon = change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const changeColor = change === undefined ? '' : change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#64748b';

  return (
    <div
      className={`glass-panel ${sizeClasses} rounded-xl flex flex-col gap-2 transition-all duration-200`}
      style={{ cursor: description ? 'help' : 'default' }}
      title={description}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.12)'; }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: '#475569', letterSpacing: '0.1em' }}>{label}</span>
        {icon && <span style={{ color: '#475569' }}>{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className={`${valueSize} font-mono font-bold leading-none`} style={{ color: textColor }}>
          {displayValue}
        </span>
        {subValue && (
          <span className="text-xs font-mono mb-0.5" style={{ color: '#64748b' }}>{subValue}</span>
        )}
      </div>
      {(change !== undefined || ChangeIcon) && (
        <div className="flex items-center gap-1">
          {ChangeIcon && <ChangeIcon size={10} style={{ color: changeColor }} />}
          <span className="text-xs font-mono" style={{ color: changeColor }}>
            {change !== undefined ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
