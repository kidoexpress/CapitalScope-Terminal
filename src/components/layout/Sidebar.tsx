import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  TrendingUp, Briefcase, ShieldCheck,
  FlaskConical, Zap, Star,
  FileText, BarChart2, Calculator,
  TerminalSquare,
  BookOpen, ScanSearch, ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { path: '/analyzer',   icon: TrendingUp,   label: 'Analyzer'   },
  { path: '/portfolio',  icon: Briefcase,    label: 'Portfolio'  },
  { path: '/risk',       icon: ShieldCheck,  label: 'Risk'       },
  { path: '/montecarlo', icon: FlaskConical, label: 'Monte Carlo'},
  { path: '/scenarios',  icon: Zap,          label: 'Scenarios'  },
  { path: '/watchlist',  icon: Star,         label: 'Watchlist'  },
];

const AI_NAV: NavItem[] = [
  { path: '/agents/earnings', icon: FileText,   label: 'Earnings'   },
  { path: '/agents/research', icon: BarChart2,  label: 'Research'   },
  { path: '/agents/model',    icon: Calculator, label: 'Models'     },
  { path: '/research',        icon: BookOpen,   label: 'Deep Dive'  },
  { path: '/scanner',         icon: ScanSearch, label: 'Scanner'    },
];

function SideNavItem({ path, icon: Icon, label }: NavItem) {
  const location = useLocation();
  const active = path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
    <NavLink
      to={path}
      className={`nav-item group ${active ? 'active' : ''}`}
      title={label}
    >
      <Icon size={16} strokeWidth={active ? 2.1 : 1.7} />
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full text-center py-1"
      style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)' }}
    >
      {children}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside
      className="flex flex-col items-center shrink-0 select-none"
      style={{
        width: 68,
        background: 'rgba(6,6,10,0.99)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo — clicks back to landing */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center justify-center mt-4 mb-3 transition-opacity hover:opacity-80"
        title="Back to Home"
      >
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #7c6cf0 0%, #a78bfa 100%)',
            boxShadow: '0 4px 14px rgba(124,108,240,0.3)',
          }}
        >
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em' }}>CS</span>
        </div>
      </button>

      {/* Core tools */}
      <div className="flex flex-col items-center w-full px-2 gap-0.5 mt-1">
        <SectionLabel>Core</SectionLabel>
        {CORE_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      {/* Divider */}
      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 1, margin: '10px auto' }} />

      {/* AI Agents */}
      <div className="flex flex-col items-center w-full px-2 gap-0.5">
        <SectionLabel>AI</SectionLabel>
        {AI_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      <div className="flex-1" />

      {/* Bottom: Terminal + Home */}
      <div className="flex flex-col items-center w-full px-2 pb-3 gap-0.5">
        <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 1, margin: '8px auto' }} />
        <SideNavItem path="/terminal" icon={TerminalSquare} label="Terminal" />

        {/* Home / Landing link */}
        <NavLink
          to="/"
          className="nav-item group"
          title="Landing page"
        >
          <ChevronLeft size={16} strokeWidth={1.7} />
          <span className="nav-label">Home</span>
        </NavLink>
      </div>
    </aside>
  );
}
