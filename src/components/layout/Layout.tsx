import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MarketTicker from './MarketTicker';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Market ticker strip */}
      <MarketTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main
            className="flex-1 overflow-auto"
            style={{
              background: 'var(--bg-base)',
              padding: '32px 36px',
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
