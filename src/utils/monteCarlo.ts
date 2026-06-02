import type { MonteCarloResult } from '../types';

/** Box-Muller transform for normal distribution */
function randNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Geometric Brownian Motion Monte Carlo simulation.
 * S(t+dt) = S(t) * exp((mu - sigma²/2)dt + sigma*sqrt(dt)*Z)
 */
export function runMonteCarlo(
  initialValue: number,
  annualReturn: number,    // e.g. 0.08 for 8%
  annualVol: number,       // e.g. 0.15 for 15%
  years: number,
  numSimulations: number = 500,
  stepsPerYear: number = 12  // monthly
): MonteCarloResult {
  const totalSteps = years * stepsPerYear;
  const dt = 1 / stepsPerYear;
  const sigma = annualVol * Math.sqrt(dt);
  const drift = (annualReturn - 0.5 * annualVol * annualVol) * dt;

  // Run simulations
  const allPaths: number[][] = [];
  for (let s = 0; s < numSimulations; s++) {
    const path = [initialValue];
    for (let t = 0; t < totalSteps; t++) {
      const prev = path[path.length - 1];
      const next = prev * Math.exp(drift + sigma * randNormal());
      path.push(next);
    }
    allPaths.push(path);
  }

  // Calculate percentiles at each step
  const p5: number[] = [], p25: number[] = [], p50: number[] = [],
    p75: number[] = [], p95: number[] = [];

  for (let t = 0; t <= totalSteps; t++) {
    const values = allPaths.map(p => p[t]).sort((a, b) => a - b);
    p5.push(values[Math.floor(numSimulations * 0.05)]);
    p25.push(values[Math.floor(numSimulations * 0.25)]);
    p50.push(values[Math.floor(numSimulations * 0.50)]);
    p75.push(values[Math.floor(numSimulations * 0.75)]);
    p95.push(values[Math.floor(numSimulations * 0.95)]);
  }

  // Final values for distribution histogram
  const finalValues = allPaths.map(p => p[totalSteps]);
  const sortedFinal = [...finalValues].sort((a, b) => a - b);

  // Statistics
  const expectedReturn = (p50[totalSteps] / initialValue - 1) * 100;
  const downsideRisk = ((sortedFinal[Math.floor(numSimulations * 0.05)] / initialValue) - 1) * 100;
  const probabilityProfit = finalValues.filter(v => v > initialValue).length / numSimulations * 100;

  // Time labels
  const timeLabels: string[] = [];
  const now = new Date();
  for (let t = 0; t <= totalSteps; t++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + t);
    timeLabels.push(`${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(2)}`);
  }

  // Sample paths for visualization (use 50 paths)
  const sampleIndices = Array.from({ length: 50 }, (_, i) =>
    Math.floor(i * numSimulations / 50)
  );
  const samplePaths = sampleIndices.map(i => allPaths[i]);

  return {
    paths: samplePaths,
    percentiles: { p5, p25, p50, p75, p95 },
    expectedReturn,
    downsideRisk,
    probabilityProfit,
    finalValues: sortedFinal,
    timeLabels,
  };
}

/** Build histogram bins from final values */
export function buildHistogram(values: number[], bins: number = 30): { range: string; count: number; value: number }[] {
  const min = values[0];
  const max = values[values.length - 1];
  const binSize = (max - min) / bins;
  const histogram: { range: string; count: number; value: number }[] = [];

  for (let i = 0; i < bins; i++) {
    const low = min + i * binSize;
    const high = low + binSize;
    const count = values.filter(v => v >= low && v < high).length;
    histogram.push({
      range: `$${Math.round(low / 1000)}k`,
      count,
      value: (low + high) / 2,
    });
  }
  return histogram;
}

/** Estimate portfolio params from holdings */
export function estimatePortfolioParams(
  holdings: { weight: number; annualReturn: number; volatility: number }[]
): { expectedReturn: number; volatility: number } {
  const expectedReturn = holdings.reduce((s, h) => s + h.weight * h.annualReturn, 0);
  // Simplified: sqrt of weighted sum of variances (ignores covariance)
  const variance = holdings.reduce((s, h) => s + h.weight * h.weight * h.volatility ** 2, 0);
  return { expectedReturn, volatility: Math.sqrt(variance) };
}
