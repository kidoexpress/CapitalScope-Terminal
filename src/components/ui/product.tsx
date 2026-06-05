import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react';

type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, meta, action }: PageHeaderProps) {
  return (
    <header className="product-page-header">
      <div>
        {eyebrow && <span className="product-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
        {meta && <div className="product-page-meta">{meta}</div>}
      </div>
      {action && <div className="product-page-action">{action}</div>}
    </header>
  );
}

interface DataSourcePillProps {
  label?: string;
  updatedAt?: string;
  status?: 'live' | 'delayed' | 'simulation' | 'unavailable';
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DataSourcePill({
  label = 'Yahoo Finance',
  updatedAt,
  status = 'delayed',
  onRefresh,
  refreshing = false,
}: DataSourcePillProps) {
  return (
    <span className={`product-data-pill ${status}`}>
      <i />
      <span>{label}</span>
      {updatedAt && <em>Updated {updatedAt}</em>}
      {onRefresh && (
        <button type="button" onClick={onRefresh} aria-label="Refresh data">
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        </button>
      )}
    </span>
  );
}

interface PremiumPanelProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function PremiumPanel({ children, className = '', interactive = false }: PremiumPanelProps) {
  return (
    <section className={`premium-panel ${interactive ? 'interactive' : ''} ${className}`}>
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="product-section-header">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`product-empty-state ${compact ? 'compact' : ''}`}>
      {icon && <div className="product-empty-icon">{icon}</div>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="product-empty-action">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Data unavailable', message, onRetry }: ErrorStateProps) {
  return (
    <div className="product-error-state">
      <AlertTriangle size={18} />
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      {onRetry && <ActionButton variant="secondary" onClick={onRetry}>Retry</ActionButton>}
    </div>
  );
}

interface InsightMemoProps {
  eyebrow?: string;
  title: string;
  summary: string;
  tone?: Tone;
  items?: Array<{ label: string; value: string }>;
  disclaimer?: string;
}

export function InsightMemo({
  eyebrow = 'Research Memo',
  title,
  summary,
  tone = 'info',
  items = [],
  disclaimer = 'Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.',
}: InsightMemoProps) {
  return (
    <PremiumPanel className={`insight-memo ${tone}`}>
      <div className="insight-memo-head">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <p>{summary}</p>
      {items.length > 0 && (
        <dl>
          {items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <small>{disclaimer}</small>
    </PremiumPanel>
  );
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

export function ActionButton({ variant = 'primary', icon, children, className = '', ...props }: ActionButtonProps) {
  return (
    <button className={`product-action-button ${variant} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}

interface TabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="product-tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          className={tab.id === activeId ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface DisclosurePanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
}

export function DisclosurePanel({ title, description, children, open = false }: DisclosurePanelProps) {
  return (
    <details className="product-disclosure" open={open}>
      <summary>
        <div>
          <strong>{title}</strong>
          {description && <span>{description}</span>}
        </div>
        <ChevronDown size={16} />
      </summary>
      <div className="product-disclosure-body">{children}</div>
    </details>
  );
}

interface StatGroupProps {
  stats: Array<{ label: string; value: string; tone?: Tone }>;
}

export function StatGroup({ stats }: StatGroupProps) {
  return (
    <div className="product-stat-group">
      {stats.map(stat => (
        <div key={stat.label} className={stat.tone ?? 'neutral'}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}

interface ChartPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartPanel({ title, description, children, action }: ChartPanelProps) {
  return (
    <PremiumPanel className="product-chart-panel">
      <SectionHeader title={title} description={description} action={action} />
      <div className="product-chart-body">{children}</div>
    </PremiumPanel>
  );
}

interface FormFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="product-form-field">
      <span>{label}</span>
      {children}
      {hint && <em>{hint}</em>}
    </label>
  );
}

export function LoadingSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`product-skeleton ${className}`} aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} style={{ width: `${Math.max(38, 92 - index * 14)}%` }} />
      ))}
    </div>
  );
}
