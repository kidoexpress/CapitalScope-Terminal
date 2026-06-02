import type { AIInsight } from '../../types';
import { Info, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface AIInsightCardProps {
  insight: AIInsight;
  delay?: number;
}

const TYPE_CONFIG = {
  info: { icon: Info, color: 'var(--blue)', bg: 'rgba(255,255,255,0.018)', border: 'rgba(255,255,255,0.05)', label: 'Context' },
  warning: { icon: AlertTriangle, color: 'var(--amber)', bg: 'rgba(255,255,255,0.018)', border: 'rgba(255,255,255,0.05)', label: 'Watch' },
  opportunity: { icon: TrendingUp, color: 'var(--green)', bg: 'rgba(255,255,255,0.018)', border: 'rgba(255,255,255,0.05)', label: 'Supportive' },
  risk: { icon: Shield, color: 'var(--red)', bg: 'rgba(255,255,255,0.018)', border: 'rgba(255,255,255,0.05)', label: 'Risk' },
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.045)', color: config.color }}>
              {config.label}
            </span>
            {insight.metric && (
              <span className="text-[10px] font-mono font-bold" style={{ color: config.color }}>
                {insight.metric}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-hi)' }}>{insight.title}</h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-mid)' }}>{insight.body}</p>
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
    <div className="glass-panel p-6 rounded-xl">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] font-bold" style={{ color: 'var(--green)' }}>CS</span>
        </div>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-hi)' }}>{title}</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-lo)' }}>Confidence 74 · neutral risk tone · review required</p>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] px-2.5 py-1 rounded-full font-mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-lo)', border: '1px solid rgba(255,255,255,0.05)' }}>
          REVIEW
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <AIInsightCard key={i} insight={insight} delay={i * 80} />
        ))}
      </div>
      <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--text-lo)' }}>
        Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.
      </p>
    </div>
  );
}
