// ============================================================
// Model Builder Agent
// DCF valuation with 3 scenarios + Excel export
// Investment banking financial model workflow
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { Calculator, Download, FileSpreadsheet, Info, RotateCcw, Search, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { runModelBuilder, type ModelBuilderParams, type ModelScenario } from '../../services/claudeService';
import { StreamingText, AgentSection, AgentSkeleton } from '../../components/agents/StreamingText';
import { exportModelToExcel, exportModelToCSV } from '../../utils/excelExport';
import { COMPANY_FUNDAMENTALS } from '../../data/financialData';

const SUPPORTED_TICKERS = Object.keys(COMPANY_FUNDAMENTALS);

interface Assumptions {
  revenueGrowth: number;
  ebitdaMargin: number;
  discountRate: number;
  terminalGrowth: number;
  exitMultiple: number;
}

const DEFAULT_ASSUMPTIONS: Assumptions = {
  revenueGrowth: 12,
  ebitdaMargin: 28,
  discountRate: 10,
  terminalGrowth: 3,
  exitMultiple: 20,
};

const SCENARIO_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  Bull: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5',  text: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  Base: { border: 'border-blue-500/40',    bg: 'bg-blue-500/5',     text: 'text-blue-300',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30'         },
  Bear: { border: 'border-red-500/40',     bg: 'bg-red-500/5',      text: 'text-red-300',     badge: 'bg-red-500/15 text-red-400 border-red-500/30'           },
};

function SliderInput({
  label, value, min, max, step, unit = '', onChange, hint
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono font-semibold text-slate-200">{value.toFixed(1)}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
      />
      {hint && <div className="text-xs text-slate-600 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function ModelBuilder() {
  const [ticker, setTicker] = useState('AAPL');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [entryPrice, setEntryPrice] = useState(185);
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [narrative, setNarrative] = useState('');
  const [scenarios, setScenarios] = useState<ModelScenario[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const updateAssumption = (key: keyof Assumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setIsStreaming(true);
    setNarrative('');
    setScenarios([]);
    setDone(false);
    setError(null);

    const params: ModelBuilderParams = {
      symbol: ticker,
      investmentAmount,
      entryPrice,
      timeHorizon,
      assumptions: {
        revenueGrowth: assumptions.revenueGrowth,
        ebitdaMargin: assumptions.ebitdaMargin,
        discountRate: assumptions.discountRate,
        terminalGrowth: assumptions.terminalGrowth,
        exitMultiple: assumptions.exitMultiple,
      },
    };

    try {
      const result = await runModelBuilder(params, (chunk) => {
        setNarrative(prev => prev + chunk);
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
      });
      setNarrative(result.narrative);
      setScenarios(result.scenarios);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Model build failed');
    } finally {
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [ticker, investmentAmount, entryPrice, timeHorizon, assumptions]);

  const handleReset = () => {
    setNarrative('');
    setScenarios([]);
    setDone(false);
    setError(null);
  };

  const handleExcelExport = () => {
    const company = COMPANY_FUNDAMENTALS[ticker];
    if (!company || scenarios.length === 0) return;
    exportModelToExcel(company, investmentAmount, entryPrice, timeHorizon, {
      revenueGrowth: assumptions.revenueGrowth,
      ebitdaMargin: assumptions.ebitdaMargin,
      discountRate: assumptions.discountRate,
      terminalGrowth: assumptions.terminalGrowth,
      exitMultiple: assumptions.exitMultiple,
    }, scenarios);
  };

  const handleCSVExport = () => {
    const company = COMPANY_FUNDAMENTALS[ticker];
    if (!company || scenarios.length === 0) return;
    exportModelToCSV(company, scenarios, entryPrice, investmentAmount);
  };

  const shares = investmentAmount / entryPrice;
  const pwPrice = scenarios.length > 0
    ? scenarios.reduce((sum, s) => sum + s.probability * s.impliedPrice, 0)
    : null;

  return (
    <div className="min-h-screen bg-[#03030a] text-slate-100 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Calculator size={16} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Model Builder</h1>
          <span className="px-2 py-0.5 text-xs bg-green-500/15 border border-green-500/30 text-green-400 rounded font-mono">
            AI AGENT
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          Builds a DCF-based investment model with Bull / Base / Bear scenarios. Estimates fair value,
          calculates ROI, and exports to a professional Excel workbook.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-400/80">
          <Info size={12} />
          Educational analysis only. Not financial advice. All projections are illustrative estimates, not predictions.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input Panel ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Ticker */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Company
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTED_TICKERS.map(sym => (
                <button
                  key={sym}
                  onClick={() => setTicker(sym)}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-semibold transition-all ${
                    ticker === sym
                      ? 'bg-green-500/25 border border-green-500/50 text-green-300'
                      : 'border border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Investment Parameters */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Investment Parameters
            </label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Investment Amount ($)</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={e => setInvestmentAmount(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-green-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={e => setEntryPrice(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-green-500/60"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Time Horizon (years)</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 7, 10].map(y => (
                  <button
                    key={y}
                    onClick={() => setTimeHorizon(y)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                      timeHorizon === y
                        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                        : 'border border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {y}Y
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-1 border-t border-slate-700/40 text-xs text-slate-500">
              {shares.toFixed(1)} shares · ${(investmentAmount / 1e3).toFixed(0)}k position
            </div>
          </div>

          {/* Base Assumptions */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/60 space-y-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Base Case Assumptions
            </label>
            <SliderInput label="Revenue CAGR" value={assumptions.revenueGrowth} min={0} max={40} step={0.5} unit="%" onChange={v => updateAssumption('revenueGrowth', v)} hint="Annualized revenue growth rate" />
            <SliderInput label="EBITDA Margin Target" value={assumptions.ebitdaMargin} min={5} max={60} step={0.5} unit="%" onChange={v => updateAssumption('ebitdaMargin', v)} />
            <SliderInput label="WACC / Discount Rate" value={assumptions.discountRate} min={5} max={20} step={0.25} unit="%" onChange={v => updateAssumption('discountRate', v)} hint="Weighted avg cost of capital" />

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400"
            >
              {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAdvanced ? 'Hide' : 'Show'} advanced assumptions
            </button>

            {showAdvanced && (
              <>
                <SliderInput label="Terminal Growth Rate" value={assumptions.terminalGrowth} min={0} max={5} step={0.25} unit="%" onChange={v => updateAssumption('terminalGrowth', v)} hint="Long-run steady-state growth" />
                <SliderInput label="Exit Multiple (EV/EBITDA)" value={assumptions.exitMultiple} min={5} max={40} step={0.5} unit="x" onChange={v => updateAssumption('exitMultiple', v)} hint="Terminal year valuation multiple" />
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={done ? handleReset : handleRun}
              disabled={isRunning}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                done
                  ? 'bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700/70'
                  : 'bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building model...
                </>
              ) : done ? (
                <><RotateCcw size={14} /> Rebuild Model</>
              ) : (
                <><Search size={14} /> Build Financial Model</>
              )}
            </button>

            {done && scenarios.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExcelExport}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-500/15 transition-all"
                >
                  <FileSpreadsheet size={13} />
                  Export .xlsx
                </button>
                <button
                  onClick={handleCSVExport}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-600/40 bg-slate-700/30 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700/50 transition-all"
                >
                  <Download size={13} />
                  Export .csv
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Output Panel ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4" ref={outputRef}>
          {/* Streaming Narrative */}
          {(isRunning || narrative) && !done && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
              {isRunning && !narrative ? (
                <>
                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                    <div className="pulse-live w-2 h-2 rounded-full bg-green-400" />
                    Model Builder Agent is constructing valuation...
                  </div>
                  <AgentSkeleton lines={10} />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                    <div className="pulse-live w-2 h-2 rounded-full bg-green-400" />
                    Generating investment model...
                  </div>
                  <StreamingText text={narrative} isStreaming={isStreaming} className="text-slate-300" />
                </>
              )}
            </div>
          )}

          {done && scenarios.length > 0 && (
            <>
              {/* Probability-Weighted Summary */}
              {pwPrice && (
                <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Entry Price</div>
                      <div className="text-xl font-bold font-mono text-slate-200">${entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">PW Fair Value</div>
                      <div className="text-xl font-bold font-mono text-slate-200">${pwPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Implied Return</div>
                      <div className={`text-xl font-bold font-mono ${pwPrice >= entryPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                        {((pwPrice - entryPrice) / entryPrice * 100 >= 0 ? '+' : '')}
                        {((pwPrice - entryPrice) / entryPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Terminal P&L</div>
                      <div className={`text-xl font-bold font-mono ${shares * pwPrice >= investmentAmount ? 'text-emerald-400' : 'text-red-400'}`}>
                        {shares * pwPrice >= investmentAmount ? '+' : ''}
                        ${((shares * pwPrice - investmentAmount) / 1e3).toFixed(1)}k
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map(s => {
                  const cfg = SCENARIO_COLORS[s.label] ?? SCENARIO_COLORS.Base;
                  const terminalVal = shares * s.impliedPrice;
                  const roi = ((terminalVal - investmentAmount) / investmentAmount) * 100;
                  const isUp = s.impliedPrice >= entryPrice;
                  return (
                    <div key={s.label} className={`glass-panel p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isUp ? <TrendingUp size={14} className={cfg.text} /> : <TrendingDown size={14} className="text-red-400" />}
                          <span className={`font-bold text-sm ${cfg.text}`}>{s.label} Case</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-semibold border rounded ${cfg.badge}`}>
                          {(s.probability * 100).toFixed(0)}% prob.
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Implied Price</span>
                          <span className="font-mono font-bold text-slate-200">${s.impliedPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Expected Return</span>
                          <span className={`font-mono font-bold ${s.expectedReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {s.expectedReturn >= 0 ? '+' : ''}{s.expectedReturn.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Terminal Value</span>
                          <span className="font-mono font-bold text-slate-200">
                            ${terminalVal >= 1e6 ? `${(terminalVal/1e6).toFixed(2)}M` : `${(terminalVal/1e3).toFixed(1)}k`}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-700/30 pt-2">
                          <span className="text-slate-500">ROI on Position</span>
                          <span className={`font-mono font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {s.keyAssumptions && s.keyAssumptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/30">
                          <div className="text-xs text-slate-500 mb-1.5">Key Assumptions</div>
                          <ul className="space-y-0.5">
                            {s.keyAssumptions.map((a, i) => (
                              <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                                <span className={cfg.text}>·</span>{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.riskNotes && (
                        <div className="mt-2 text-xs text-slate-500 italic leading-relaxed">
                          {s.riskNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sensitivity Table */}
              <AgentSection title="Sensitivity Analysis" accent="green">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-700/40">
                        <th className="text-left py-2 pr-4">Revenue CAGR</th>
                        {[assumptions.discountRate - 2, assumptions.discountRate, assumptions.discountRate + 2].map(dr => (
                          <th key={dr} className={`text-right py-2 px-2 ${dr === assumptions.discountRate ? 'text-blue-400' : ''}`}>
                            WACC {dr.toFixed(1)}%
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[assumptions.revenueGrowth - 4, assumptions.revenueGrowth, assumptions.revenueGrowth + 4].map(rg => (
                        <tr key={rg} className="border-b border-slate-800/40">
                          <td className={`py-2 pr-4 font-mono ${rg === assumptions.revenueGrowth ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                            {rg.toFixed(1)}%
                          </td>
                          {[assumptions.discountRate - 2, assumptions.discountRate, assumptions.discountRate + 2].map(dr => {
                            // Simplified sensitivity: price roughly scales with (revenue growth / discount rate) ratio
                            const basePrice = scenarios.find(s => s.label === 'Base')?.impliedPrice ?? entryPrice;
                            const adj = basePrice * (rg / assumptions.revenueGrowth) * (assumptions.discountRate / dr);
                            const ret = ((adj - entryPrice) / entryPrice) * 100;
                            const isCenter = rg === assumptions.revenueGrowth && dr === assumptions.discountRate;
                            return (
                              <td key={dr} className={`text-right py-2 px-2 font-mono ${
                                isCenter ? 'text-blue-300 font-bold' :
                                ret >= 20 ? 'text-emerald-400' :
                                ret >= 0  ? 'text-slate-300'   : 'text-red-400'
                              }`}>
                                ${adj.toFixed(0)}
                                <span className={`ml-1 text-slate-600 text-xs`}>
                                  ({ret >= 0 ? '+' : ''}{ret.toFixed(0)}%)
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-slate-600 mt-2">Illustrative sensitivity — center cell (blue) = base case assumptions</div>
              </AgentSection>

              {/* Full Narrative */}
              <div className="glass-panel p-5 rounded-xl border border-slate-800/60">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Investment Model Narrative
                </div>
                <StreamingText text={narrative} isStreaming={false} className="text-slate-300" />
              </div>

              {/* Export prompt */}
              <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm font-semibold text-emerald-300">Export Model</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Download this model as a 4-sheet Excel workbook (Summary, Assumptions, Historical Financials, ROI Scenarios)
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExcelExport}
                    className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet size={13} />
                    Download .xlsx
                  </button>
                  <button
                    onClick={handleCSVExport}
                    className="py-2 px-4 rounded-lg border border-slate-600/40 bg-slate-700/30 text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-700/50 transition-all"
                  >
                    <Download size={13} />
                    .csv
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-slate-600 text-center border-t border-slate-800/60 pt-4">
                Educational analysis only. Not financial advice. All projections are illustrative estimates, not predictions.
                Verify all data independently before making investment decisions.
              </div>
            </>
          )}

          {error && (
            <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/5">
              <div className="text-sm font-semibold text-red-300 mb-1">Model Error</div>
              <div className="text-xs text-red-400/80">{error}</div>
            </div>
          )}

          {/* Idle state */}
          {!isRunning && !narrative && !error && (
            <div className="glass-panel p-10 rounded-xl border border-slate-800/40 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Calculator size={20} className="text-green-400" />
              </div>
              <div className="text-sm font-semibold text-slate-400 mb-2">Investment Model Builder</div>
              <div className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Configure your assumptions and click{' '}
                <span className="text-green-400">Build Financial Model</span> to generate a DCF valuation
                with Bull / Base / Bear scenarios.
              </div>
              <div className="mt-4 flex justify-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><FileSpreadsheet size={11} className="text-emerald-500" /> Excel export</span>
                <span className="flex items-center gap-1"><TrendingUp size={11} className="text-blue-400" /> 3 scenarios</span>
                <span className="flex items-center gap-1"><Calculator size={11} className="text-purple-400" /> DCF + multiples</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
