// ============================================================
// StreamingText — animated character-by-character text reveal
// Used by all AI agent pages for real-time output display
// ============================================================

import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
  /** Speed in ms per character (default 8) */
  speed?: number;
  onDone?: () => void;
}

export function StreamingText({ text, isStreaming, className = '', speed = 8, onDone }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTextRef = useRef('');

  useEffect(() => {
    // New chunk arrived — continue from where we left off
    if (text.length > prevTextRef.current.length) {
      prevTextRef.current = text;
      if (!isStreaming) {
        // Not streaming anymore — show all at once
        setDisplayed(text);
        onDone?.();
        return;
      }
      // Animate the new characters
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          indexRef.current += 1;
          setDisplayed(text.slice(0, indexRef.current));
          if (indexRef.current >= text.length) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
          }
        }, speed);
      }
    }
  }, [text, isStreaming, speed, onDone]);

  // When streaming ends, flush remaining characters instantly
  useEffect(() => {
    if (!isStreaming && text) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDisplayed(text);
      indexRef.current = text.length;
      onDone?.();
    }
  }, [isStreaming, text, onDone]);

  // Reset when text is cleared
  useEffect(() => {
    if (!text) {
      setDisplayed('');
      indexRef.current = 0;
      prevTextRef.current = '';
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [text]);

  return (
    <div className={`whitespace-pre-wrap font-mono text-sm leading-relaxed ${className}`}>
      {displayed}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-blue-400 animate-pulse align-text-bottom" />
      )}
    </div>
  );
}

// ─── Section header for agent output ─────────────────────────────────────────

interface AgentSectionProps {
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const ACCENT_CLASSES = {
  blue:   'border-blue-500/40 bg-blue-500/5',
  green:  'border-emerald-500/40 bg-emerald-500/5',
  amber:  'border-amber-500/40 bg-amber-500/5',
  red:    'border-red-500/40 bg-red-500/5',
  purple: 'border-purple-500/40 bg-purple-500/5',
};

const TITLE_COLORS = {
  blue:   'text-blue-400',
  green:  'text-emerald-400',
  amber:  'text-amber-400',
  red:    'text-red-400',
  purple: 'text-purple-400',
};

export function AgentSection({ title, children, accent = 'blue' }: AgentSectionProps) {
  return (
    <div className={`border rounded-lg p-4 ${ACCENT_CLASSES[accent]}`}>
      <div className={`text-xs font-semibold tracking-widest uppercase mb-3 ${TITLE_COLORS[accent]}`}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Status badge for thesis verdict ─────────────────────────────────────────

type ThesisStatus = 'INTACT' | 'WEAKENED' | 'MATERIALLY CHANGED' | 'NEEDS MORE REVIEW' | null;

interface ThesisBadgeProps {
  status: ThesisStatus;
  large?: boolean;
}

const STATUS_CONFIG: Record<Exclude<ThesisStatus, null>, { color: string; bg: string; icon: string; desc: string }> = {
  'INTACT': {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/40',
    icon: '✓',
    desc: 'Investment thesis remains on track',
  },
  'WEAKENED': {
    color: 'text-amber-300',
    bg: 'bg-amber-500/15 border-amber-500/40',
    icon: '⚠',
    desc: 'Some thesis assumptions have deteriorated',
  },
  'MATERIALLY CHANGED': {
    color: 'text-red-300',
    bg: 'bg-red-500/15 border-red-500/40',
    icon: '✗',
    desc: 'Fundamental thesis assumptions no longer hold',
  },
  'NEEDS MORE REVIEW': {
    color: 'text-purple-300',
    bg: 'bg-purple-500/15 border-purple-500/40',
    icon: '?',
    desc: 'Insufficient data — additional review recommended',
  },
};

export function ThesisBadge({ status, large = false }: ThesisBadgeProps) {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={`inline-flex items-center gap-2 border rounded-lg px-3 ${large ? 'py-3' : 'py-1.5'} ${cfg.bg}`}>
      <span className={`${large ? 'text-xl' : 'text-sm'} font-bold ${cfg.color}`}>{cfg.icon}</span>
      <div>
        <div className={`font-bold tracking-wide ${large ? 'text-base' : 'text-xs'} ${cfg.color}`}>
          {status}
        </div>
        {large && <div className="text-xs text-slate-400 mt-0.5">{cfg.desc}</div>}
      </div>
    </div>
  );
}

// ─── Loading skeleton for agent output ───────────────────────────────────────

export function AgentSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-slate-700/60 rounded"
          style={{ width: `${60 + Math.sin(i * 1.7) * 30}%` }}
        />
      ))}
    </div>
  );
}

// ─── Signal card ──────────────────────────────────────────────────────────────

interface SignalCardProps {
  type: 'bullish' | 'bearish' | 'neutral';
  title: string;
  body: string;
}

export function SignalCard({ type, title, body }: SignalCardProps) {
  const cfg = {
    bullish: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', dot: 'bg-emerald-500', text: 'text-emerald-400' },
    bearish: { border: 'border-l-red-500',     bg: 'bg-red-500/5',     dot: 'bg-red-500',     text: 'text-red-400'     },
    neutral: { border: 'border-l-slate-500',   bg: 'bg-slate-500/5',   dot: 'bg-slate-400',   text: 'text-slate-400'   },
  }[type];

  return (
    <div className={`border-l-2 pl-3 py-2 rounded-r-md ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{title}</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{body}</p>
    </div>
  );
}
