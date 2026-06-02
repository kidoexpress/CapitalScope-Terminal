import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface DataPoint {
  symbol: string;
  risk: number;   // volatility %
  return: number; // annual return %
  weight: number;
  sector: string;
}

interface RiskReturnScatterProps {
  data: DataPoint[];
  height?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(8,8,20,0.98)', border: '1px solid rgba(99,102,241,0.25)' }}>
      <p className="text-xs font-mono font-bold mb-1" style={{ color: '#e2e8f0' }}>{d.symbol}</p>
      <p className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>Risk: {d.risk.toFixed(1)}%</p>
      <p className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>Return: {d.return.toFixed(1)}%</p>
      <p className="text-[10px] font-mono" style={{ color: '#64748b' }}>Weight: {(d.weight * 100).toFixed(1)}%</p>
      <p className="text-[10px] font-mono" style={{ color: '#64748b' }}>Sector: {d.sector}</p>
    </div>
  );
};

const CustomDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  const r = 6 + payload.weight * 40;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={COLORS[index % COLORS.length]} fillOpacity={0.7} stroke={COLORS[index % COLORS.length]} strokeWidth={1.5} />
      <text x={cx} y={cy - r - 3} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="JetBrains Mono" fontWeight="600">
        {payload.symbol}
      </text>
    </g>
  );
};

export default function RiskReturnScatter({ data, height = 260 }: RiskReturnScatterProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
        <XAxis
          type="number"
          dataKey="risk"
          name="Risk"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#334155', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          label={{ value: 'Volatility (Risk) %', position: 'insideBottom', offset: 10, fill: '#334155', fontSize: 9 }}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
        />
        <YAxis
          type="number"
          dataKey="return"
          name="Return"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#334155', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          width={44}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(99,102,241,0.2)' }} />
        <ReferenceLine y={0} stroke="rgba(99,102,241,0.15)" strokeDasharray="4 4" />
        <Scatter data={data} shape={<CustomDot />}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
