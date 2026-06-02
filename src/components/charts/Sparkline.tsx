import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  width?: number | `${number}%`;
  height?: number;
  positive?: boolean;
}

export default function Sparkline({ data, width = 80, height = 32, positive }: SparklineProps) {
  const isPositive = positive !== undefined ? positive : data[data.length - 1] >= data[0];
  const color = isPositive ? '#55d99a' : '#ec6f86';
  const chartData = data.map((v, i) => ({ v, i }));
  const gradientId = `spark-${isPositive ? 'up' : 'down'}-${data.length}-${Math.round(data[0] ?? 0)}`;

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          dot={false}
          isAnimationActive
          animationDuration={650}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
