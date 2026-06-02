import type { AIInsight } from '../../types';
import { Info, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface AIInsightCardProps {
  insight: AIInsight;
  delay?: number;
}

const TYPE_CONFIG = {
  info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'INSIGHT' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'WARNING' },
  opportunity: { icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'SIGNAL' },
  risk: { icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'RISK' },
};

export default function AIInsightCard({ insight, delay = 0 }: AIInsightCardProps) {
  const config = TYPE_CONFIG[insight.type];
  const Icon = config.icon;

  return (
    <div
      className="rounded-xl p-4 animate-fade-in-up"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${config.color}20` }}
        >
          <Icon size={13} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${config.color}20`, color: config.color, letterSpacing: '0.1em' }}>
              {config.label}
            </span>
            {insight.metric && (
              <span className="text-[10px] font-mono font-bold" style={{ color: config.color }}>
                {insight.metric}
              </span>
            )}
          </div>
          <h4 className="text-xs font-semibold mb-1" style={{ color: '#e2e8f0' }}>{insight.title}</h4>
          <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

interface AIInsightPanelProps {
  insights: AIInsight[];
  title?: string;
}

export function AIInsightPanel({ insights, title = 'AI Insights' }: AIInsightPanelProps) {
  return (
    <div className="glass-panel p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-[9px] font-bold text-white">AI</span>
        </div>
        <h3 className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{title}</h3>
        <div className="flex-1" />
        <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
          EDUCATIONAL ONLY
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <AIInsightCard key={i} insight={insight} delay={i * 80} />
        ))}
      </div>
      <p className="text-[9px] mt-3 text-center leading-relaxed" style={{ color: '#334155' }}>
        ⚠ For educational purposes only. Not financial advice. Always consult a qualified financial advisor.
      </p>
    </div>
  );
}
