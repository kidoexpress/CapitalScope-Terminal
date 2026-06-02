import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Portfolio } from '../../types/portfolio';

interface Props {
  portfolios: Portfolio[];
  activeId: string | null;
  onSelect: (id: string) => Promise<void>;
  onCreate: (name: string, initialCash: number) => Promise<void>;
  loading?: boolean;
}

export default function PortfolioPicker({ portfolios, activeId, onSelect, onCreate, loading }: Props) {
  const [name, setName] = useState('AI Research Portfolio');
  const [initialCash, setInitialCash] = useState(100000);

  return (
    <section className="paper-picker">
      <select value={activeId ?? ''} onChange={event => onSelect(event.target.value)} disabled={loading || portfolios.length === 0}>
        {portfolios.length === 0 ? <option>No portfolios</option> : portfolios.map(portfolio => (
          <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>
        ))}
      </select>
      <input value={name} onChange={event => setName(event.target.value)} placeholder="Portfolio name" />
      <input type="number" value={initialCash} onChange={event => setInitialCash(Number(event.target.value))} />
      <button disabled={loading || !name || initialCash <= 0} onClick={() => onCreate(name, initialCash)}>
        <Plus size={15} /> Create
      </button>
    </section>
  );
}
