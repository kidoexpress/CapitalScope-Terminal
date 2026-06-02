import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type React from 'react';
import {
  TrendingUp, Briefcase, ShieldCheck,
  FlaskConical, Zap, Star,
  FileText, BarChart2, Calculator,
  TerminalSquare,
  BookOpen, ScanSearch, Home, WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { path: '/analyzer',   icon: TrendingUp,   label: 'Analyzer'   },
  { path: '/portfolio',  icon: Briefcase,    label: 'Portfolio'  },
  { path: '/risk',       icon: ShieldCheck,  label: 'Risk'       },
  { path: '/montecarlo', icon: FlaskConical, label: 'Monte Carlo'},
  { path: '/scenarios',  icon: Zap,          label: 'Scenarios'  },
  { path: '/watchlist',  icon: Star,         label: 'Watchlist'  },
  { path: '/paper-trading', icon: WalletCards, label: 'Paper Trade' },
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
      className={`nav-item ${active ? 'active' : ''}`}
      title={label}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.65} />
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sidebar-section-label">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar-shell">
      <button
        onClick={() => navigate('/')}
        className="sidebar-brand"
        title="Back to Home"
      >
        <div className="sidebar-mark">CS</div>
        <div className="sidebar-brand-copy">
          <strong>CapitalScope</strong>
          <span>Research OS</span>
        </div>
      </button>

      <div className="sidebar-group">
        <SectionLabel>Core</SectionLabel>
        {CORE_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      <div className="sidebar-group">
        <SectionLabel>Research</SectionLabel>
        {AI_NAV.map(item => <SideNavItem key={item.path} {...item} />)}
      </div>

      <div className="flex-1" />

      <div className="sidebar-group sidebar-bottom">
        <SideNavItem path="/terminal" icon={TerminalSquare} label="Terminal" />
        <NavLink
          to="/"
          className="nav-item"
          title="Landing page"
        >
          <Home size={16} strokeWidth={1.65} />
          <span className="nav-label">Home</span>
        </NavLink>
      </div>
    </aside>
  );
}
