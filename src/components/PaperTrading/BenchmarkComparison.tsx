import type { BenchmarkComparisonRow, PerformanceMetrics } from '../../types/portfolio';
import { formatPercent } from '../../utils/finance';

interface Props {
  metrics: PerformanceMetrics | null;
  rows: BenchmarkComparisonRow[];
}

export default function BenchmarkComparison({ metrics, rows }: Props) {
  const allRows: BenchmarkComparisonRow[] = [
    {
      name: 'My Portfolio',
      totalReturn: metrics?.totalReturn ?? 0,
      sharpeRatio: metrics?.sharpeRatio ?? 0,
      maxDrawdown: metrics?.maxDrawdown ?? 0,
      alpha: metrics?.alpha ?? 0,
    },
    ...rows,
  ];

  return (
    <section className="workflow-card paper-benchmark-card">
      <div className="workflow-card-header">
        <div>
          <span className="label-upper">Benchmarking</span>
          <h2>Relative Performance</h2>
        </div>
      </div>
      <div className="clean-table-wrap">
        <table className="clean-holdings-table paper-table">
          <thead>
            <tr><th>Portfolio</th><th>Return</th><th>Sharpe</th><th>Max DD</th><th>Alpha</th></tr>
          </thead>
          <tbody>
            {allRows.map(row => (
              <tr key={row.name}>
                <td><strong>{row.name}</strong></td>
                <td className={row.totalReturn >= 0 ? 'positive' : 'negative'}>{formatPercent(row.totalReturn)}</td>
                <td>{row.sharpeRatio.toFixed(2)}</td>
                <td className="negative">{formatPercent(row.maxDrawdown)}</td>
                <td>{row.alpha == null ? '—' : formatPercent(row.alpha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

