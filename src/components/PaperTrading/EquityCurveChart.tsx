import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EquityPoint } from '../../types/portfolio';

interface Props {
  data: EquityPoint[];
  period: '1M' | '3M' | '6M' | '1Y' | 'All';
  onPeriodChange: (period: Props['period']) => void;
  loading?: boolean;
}

export default function EquityCurveChart({ data, period, onPeriodChange, loading }: Props) {
  return (
    <section className="workflow-card paper-chart-card">
      <div className="workflow-card-header">
        <div>
          <span className="label-upper">Equity Curve</span>
          <h2>Portfolio vs Benchmarks</h2>
        </div>
        <div className="segmented-control small paper-period-control">
          {(['1M', '3M', '6M', '1Y', 'All'] as const).map(option => (
            <button key={option} onClick={() => onPeriodChange(option)} className={period === option ? 'active' : ''}>{option}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="shimmer h-[360px] rounded-[24px]" />
      ) : data.length === 0 ? (
        <div className="intentional-empty-state">
          <strong>No equity curve yet.</strong>
          <span>Add holdings and run a metrics period to compare against SPY and QQQ.</span>
        </div>
      ) : (
        <div className="paper-chart-frame">
          <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={360}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="paperPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#55d99a" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#55d99a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={34} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${(Number(value) - 100).toFixed(0)}%`} />
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="cs-tooltip">
                    <strong>{label}</strong>
                    {payload.map(item => (
                      <div key={item.dataKey as string}>{item.name}: {(Number(item.value) - 100).toFixed(2)}%</div>
                    ))}
                  </div>
                ) : null}
              />
              <Area type="monotone" dataKey="portfolioValue" name="Portfolio" stroke="#55d99a" strokeWidth={3} fill="url(#paperPortfolio)" />
              <Area type="monotone" dataKey="spyValue" name="SPY" stroke="rgba(255,255,255,0.42)" strokeWidth={2} fill="transparent" strokeDasharray="4 5" />
              <Area type="monotone" dataKey="qqqValue" name="QQQ" stroke="rgba(138,164,255,0.55)" strokeWidth={2} fill="transparent" strokeDasharray="2 6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
