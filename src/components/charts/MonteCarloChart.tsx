import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import type { MonteCarloResult } from '../../types';
import { formatCurrency } from '../../utils/finance';

interface MonteCarloChartProps {
  result: MonteCarloResult;
  initialValue: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(99,102,241,0.25)' }}>
      <p className="text-[10px] font-mono mb-2" style={{ color: '#64748b' }}>{label}</p>
      {[
        { key: 'p95', label: '95th pct', color: '#10b981' },
        { key: 'p75', label: '75th pct', color: '#6ee7b7' },
        { key: 'p50', label: 'Median', color: '#3b82f6' },
        { key: 'p25', label: '25th pct', color: '#fbbf24' },
        { key: 'p5', label: '5th pct', color: '#ef4444' },
      ].map(({ key, label: lbl, color }) => {
        const item = payload.find((p: any) => p.dataKey === key);
        if (!item) return null;
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-mono" style={{ color: '#64748b' }}>{lbl}</span>
            <span className="text-xs font-mono font-semibold" style={{ color }}>
              {formatCurrency(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function MonteCarloChart({ result, initialValue, height = 320 }: MonteCarloChartProps) {
  const { percentiles, timeLabels } = result;

  const chartData = timeLabels.map((label, i) => ({
    label,
    p95: +percentiles.p95[i].toFixed(2),
    p75: +percentiles.p75[i].toFixed(2),
    p50: +percentiles.p50[i].toFixed(2),
    p25: +percentiles.p25[i].toFixed(2),
    p5: +percentiles.p5[i].toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="mcg-bull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="mcg-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="mcg-bear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#334155', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#334155', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          width={64}
          tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v.toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={initialValue} stroke="rgba(99,102,241,0.3)" strokeDasharray="6 3" label={{ value: 'Initial', position: 'insideTopRight', fill: '#6366f1', fontSize: 10, fontFamily: 'JetBrains Mono' }} />

        {/* 5th-95th band */}
        <Area type="monotone" dataKey="p95" stroke="#10b981" strokeWidth={1.5} fill="url(#mcg-bull)" dot={false} strokeDasharray="4 2" />
        {/* 25th-75th band */}
        <Area type="monotone" dataKey="p75" stroke="#6ee7b7" strokeWidth={1} fill="none" dot={false} strokeDasharray="3 2" />
        {/* Median */}
        <Area type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} fill="url(#mcg-base)" dot={false} />
        <Area type="monotone" dataKey="p25" stroke="#fbbf24" strokeWidth={1} fill="none" dot={false} strokeDasharray="3 2" />
        <Area type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={1.5} fill="url(#mcg-bear)" dot={false} strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
