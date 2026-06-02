import { AlertTriangle } from 'lucide-react';

export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[10px] text-center" style={{ color: '#334155' }}>
        ⚠ For educational purposes only. Not financial advice.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
      <AlertTriangle size={11} style={{ color: '#92400e', flexShrink: 0 }} />
      <p className="text-[10px]" style={{ color: '#78350f' }}>
        For educational purposes only. Not financial advice. Past performance does not guarantee future results.
      </p>
    </div>
  );
}
