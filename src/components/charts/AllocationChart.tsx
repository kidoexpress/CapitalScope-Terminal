import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PortfolioHolding } from '../../types';
import { SECTOR_COLORS } from '../../data/mockStocks';

interface AllocationChartProps {
  holdings: PortfolioHolding[];
  type?: 'stock' | 'sector';
  size?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(99,102,241,0.25)' }}>
      <p className="text-xs font-mono font-semibold" style={{ color: '#e2e8f0' }}>{d.name}</p>
      <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{(d.value * 100).toFixed(1)}%</p>
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontFamily="JetBrains Mono" fontWeight="600">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function AllocationChart({ holdings, type = 'stock', size = 220 }: AllocationChartProps) {
  if (holdings.length === 0) return (
    <div className="flex items-center justify-center text-xs" style={{ height: size, color: '#334155' }}>
      No holdings to display
    </div>
  );

  let data: { name: string; value: number; color: string }[];

  if (type === 'stock') {
    data = holdings.map((h, i) => ({
      name: h.symbol,
      value: h.weight,
      color: COLORS[i % COLORS.length],
    }));
  } else {
    // Aggregate by sector
    const sectorMap: Record<string, number> = {};
    holdings.forEach(h => {
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight;
    });
    data = Object.entries(sectorMap).map(([sector, weight]) => ({
      name: sector,
      value: weight,
      color: SECTOR_COLORS[sector] || '#64748b',
    }));
  }

  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.25}
          outerRadius={size * 0.42}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color}
              stroke="rgba(3,3,10,0.8)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}>{value}</span>}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
