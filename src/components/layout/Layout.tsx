import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MarketTicker from './MarketTicker';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden app-shell">
      <MarketTicker />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TopBar />
          <main
            className="flex-1 overflow-auto app-main"
          >
            <div className="app-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
