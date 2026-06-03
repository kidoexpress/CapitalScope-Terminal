// src/utils/priceHistory.ts
// Fetches 1-year daily close prices for a list of symbols via the Yahoo Finance Vite proxy.

export async function fetchPriceHistory(
  symbols: string[]
): Promise<Record<string, number[]>> {
  const result: Record<string, number[]> = {};

  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const res = await fetch(
          `/api/yahoo/v8/finance/chart/${sym}?range=1y&interval=1d`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return;
        const json = await res.json();
        const closes: number[] = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
        const valid = closes.filter((v) => v != null && !isNaN(v)) as number[];
        if (valid.length > 20) result[sym] = valid;
      } catch {
        // skip on timeout or network error
      }
    })
  );

  return result;
}
