import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Calculator, Download, FileSpreadsheet, Info, RotateCcw, Search } from 'lucide-react';
import { runModelBuilder, type ModelBuilderParams, type ModelScenario } from '../../services/claudeService';
import { AgentSkeleton, StreamingText } from '../../components/agents/StreamingText';
import { exportModelToCSV, exportModelToExcel } from '../../utils/excelExport';
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

function AssumptionSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="assumption-control">
      <div>
        <span>{label}</span>
        <strong>{value.toFixed(unit === 'x' ? 1 : 1)}{unit}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

function ScenarioPreview({ scenario, entryPrice, investmentAmount }: { scenario: ModelScenario; entryPrice: number; investmentAmount: number }) {
  const shares = investmentAmount / entryPrice;
  const terminalValue = shares * scenario.impliedPrice;
  const roi = ((terminalValue - investmentAmount) / investmentAmount) * 100;
  const tone = scenario.label.toLowerCase();

  return (
    <div className={`model-scenario-card ${tone}`}>
      <div>
        <span>{scenario.label}</span>
        <em>{(scenario.probability * 100).toFixed(0)}% probability</em>
      </div>
      <strong>${scenario.impliedPrice.toFixed(2)}</strong>
      <p className={roi >= 0 ? 'positive' : 'negative'}>{roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI</p>
    </div>
  );
}

export default function ModelBuilder() {
  const [ticker, setTicker] = useState('AAPL');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [entryPrice, setEntryPrice] = useState(185);
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [narrative, setNarrative] = useState('');
  const [scenarios, setScenarios] = useState<ModelScenario[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const company = COMPANY_FUNDAMENTALS[ticker];
  const shares = investmentAmount / entryPrice;
  const latestIncome = company?.incomeStatements?.[0];
  const latestCash = company?.cashFlows?.[0];

  const livePreview = useMemo(() => {
    const revenue = latestIncome?.revenue ?? 100000;
    const yearRevenue = revenue * Math.pow(1 + assumptions.revenueGrowth / 100, timeHorizon);
    const ebitda = yearRevenue * assumptions.ebitdaMargin / 100;
    const baseEnterpriseValue = ebitda * assumptions.exitMultiple;
    const impliedPrice = entryPrice * (baseEnterpriseValue / Math.max(revenue * 10, 1));
    const expectedRoi = ((impliedPrice - entryPrice) / entryPrice) * 100;
    return { yearRevenue, ebitda, impliedPrice, expectedRoi };
  }, [latestIncome?.revenue, assumptions, timeHorizon, entryPrice]);

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
      assumptions,
    };

    try {
      const result = await runModelBuilder(params, chunk => {
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

  const reset = () => {
    setNarrative('');
    setScenarios([]);
    setDone(false);
    setError(null);
  };

  const handleExcelExport = () => {
    if (!company || scenarios.length === 0) return;
    exportModelToExcel(company, investmentAmount, entryPrice, timeHorizon, assumptions, scenarios);
  };

  const handleCSVExport = () => {
    if (!company || scenarios.length === 0) return;
    exportModelToCSV(company, scenarios, entryPrice, investmentAmount);
  };

  const probabilityWeightedPrice = scenarios.length
    ? scenarios.reduce((sum, s) => sum + s.probability * s.impliedPrice, 0)
    : livePreview.impliedPrice;
  const expectedRoi = ((probabilityWeightedPrice - entryPrice) / entryPrice) * 100;

  return (
    <div className="workflow-page animate-fade-in-up">
      <div className="product-page-heading">
        <div>
          <p>Financial Model</p>
          <h1>Model Builder</h1>
        </div>
        <span>Build a compact valuation model with bear, base, and bull cases plus Excel-compatible exports.</span>
      </div>

      <div className="model-workflow-grid">
        <section className="workflow-card model-column">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Company Setup</span>
              <h2>Position</h2>
            </div>
            <Calculator size={20} />
          </div>
          <div className="ticker-chip-grid compact">
            {SUPPORTED_TICKERS.map(sym => (
              <button key={sym} onClick={() => setTicker(sym)} className={`ticker-chip ${ticker === sym ? 'active' : ''}`}>{sym}</button>
            ))}
          </div>
          <div className="model-company-card">
            <strong>{ticker}</strong>
            <span>{company?.name} · {company?.sector}</span>
            <p>{company?.description}</p>
          </div>
          <label className="model-field">
            Investment amount
            <input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(Number(e.target.value))} />
          </label>
          <label className="model-field">
            Entry price
            <input type="number" step="0.01" value={entryPrice} onChange={e => setEntryPrice(Number(e.target.value))} />
          </label>
          <div className="setup-block">
            <span className="setup-title">Time horizon</span>
            <div className="segmented-control">
              {[1, 2, 3, 5, 7, 10].map(year => (
                <button key={year} onClick={() => setTimeHorizon(year)} className={timeHorizon === year ? 'active' : ''}>{year}Y</button>
              ))}
            </div>
          </div>
          <p className="workflow-help-text">{shares.toFixed(1)} shares modeled at current entry price.</p>
        </section>

        <section className="workflow-card model-column assumptions-column">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Assumptions</span>
              <h2>Base Case</h2>
            </div>
          </div>
          <AssumptionSlider label="Revenue growth" value={assumptions.revenueGrowth} min={0} max={40} step={0.5} unit="%" onChange={v => updateAssumption('revenueGrowth', v)} />
          <AssumptionSlider label="EBITDA margin" value={assumptions.ebitdaMargin} min={5} max={60} step={0.5} unit="%" onChange={v => updateAssumption('ebitdaMargin', v)} />
          <AssumptionSlider label="Discount rate" value={assumptions.discountRate} min={5} max={20} step={0.25} unit="%" onChange={v => updateAssumption('discountRate', v)} />
          <AssumptionSlider label="Terminal growth" value={assumptions.terminalGrowth} min={0} max={5} step={0.25} unit="%" onChange={v => updateAssumption('terminalGrowth', v)} />
          <AssumptionSlider label="Exit multiple" value={assumptions.exitMultiple} min={5} max={40} step={0.5} unit="x" onChange={v => updateAssumption('exitMultiple', v)} />
          <div className="historical-snapshot">
            <span className="label-upper">Historical Anchor</span>
            <div><span>Revenue</span><strong>${((latestIncome?.revenue ?? 0) / 1000).toFixed(1)}B</strong></div>
            <div><span>EBITDA margin</span><strong>{latestIncome?.ebitdaMargin?.toFixed(1) ?? '0.0'}%</strong></div>
            <div><span>FCF margin</span><strong>{latestCash?.fcfMargin?.toFixed(1) ?? '0.0'}%</strong></div>
          </div>
        </section>

        <section className="workflow-card model-column preview-column" ref={outputRef}>
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Live Preview</span>
              <h2>Valuation</h2>
            </div>
          </div>

          <div className="valuation-hero">
            <span>Implied value</span>
            <strong>${probabilityWeightedPrice.toFixed(2)}</strong>
            <em className={expectedRoi >= 0 ? 'positive' : 'negative'}>{expectedRoi >= 0 ? '+' : ''}{expectedRoi.toFixed(1)}% expected ROI</em>
          </div>

          <div className="preview-metrics">
            <div><span>Year {timeHorizon} revenue</span><strong>${(livePreview.yearRevenue / 1000).toFixed(1)}B</strong></div>
            <div><span>Year {timeHorizon} EBITDA</span><strong>${(livePreview.ebitda / 1000).toFixed(1)}B</strong></div>
            <div><span>Position value</span><strong>${((shares * probabilityWeightedPrice) / 1000).toFixed(1)}k</strong></div>
          </div>

          {scenarios.length > 0 ? (
            <div className="scenario-stack">
              {scenarios.map(scenario => (
                <ScenarioPreview key={scenario.label} scenario={scenario} entryPrice={entryPrice} investmentAmount={investmentAmount} />
              ))}
            </div>
          ) : (
            <div className="scenario-stack muted">
              {['Bear', 'Base', 'Bull'].map(label => (
                <div key={label} className="model-scenario-card">
                  <div><span>{label}</span><em>Generated after model run</em></div>
                  <strong>Pending</strong>
                </div>
              ))}
            </div>
          )}

          <button onClick={done ? reset : handleRun} disabled={isRunning} className="workflow-primary-action">
            {isRunning ? <span className="button-spinner" /> : done ? <RotateCcw size={16} /> : <Search size={16} />}
            {isRunning ? 'Building model...' : done ? 'Rebuild Model' : 'Build Financial Model'}
          </button>

          <div className="export-row">
            <button onClick={handleExcelExport} disabled={!done || scenarios.length === 0}><FileSpreadsheet size={14} /> Export Excel</button>
            <button onClick={handleCSVExport} disabled={!done || scenarios.length === 0}><Download size={14} /> CSV</button>
          </div>
          <div className="workflow-disclaimer"><Info size={13} /> Educational projections only. Not financial advice.</div>
        </section>
      </div>

      <section className="workflow-output model-output">
        {error && <div className="workflow-error"><AlertTriangle size={16} /> {error}</div>}
        {(isRunning || narrative) ? (
          <div className="workflow-card research-memo">
            {isRunning && !narrative ? (
              <>
                <div className="streaming-status"><span className="pulse-live" /> Constructing valuation model...</div>
                <AgentSkeleton lines={8} />
              </>
            ) : (
              <>
                {isRunning && <div className="streaming-status"><span className="pulse-live" /> Streaming model memo...</div>}
                <StreamingText text={narrative} isStreaming={isStreaming} />
              </>
            )}
          </div>
        ) : (
          <div className="intentional-empty-state">
            <Calculator size={22} />
            <strong>Live preview is ready.</strong>
            <span>Run the model to generate the AI narrative, scenarios, and exportable workbook.</span>
          </div>
        )}
      </section>
    </div>
  );
}
