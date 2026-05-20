import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/authStore';
import {
  LayoutDashboard, Upload, BarChart3, Bot, AlertTriangle,
  Shield, TrendingUp, Settings, Users, ChevronLeft, ChevronRight,
  Zap
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload Center', icon: Upload },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { path: '/anomalies', label: 'Anomaly Explorer', icon: AlertTriangle },
  { path: '/compliance', label: 'Compliance', icon: Shield },
  { path: '/forecasting', label: 'Forecasting', icon: TrendingUp },
  { path: '/admin', label: 'Admin Panel', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'w-64' : 'w-20'}
        bg-gradient-to-b from-surface-900 via-surface-900 to-surface-950
        border-r border-primary-500/10`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-500/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 glow-primary">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold gradient-text leading-tight">FinRisk AI</h1>
            <p className="text-[10px] text-surface-200/50 font-medium tracking-wider uppercase">Intelligence Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                  : 'text-surface-200/70 hover:bg-surface-800/60 hover:text-surface-100 border border-transparent'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
              {sidebarOpen && <span className="animate-fade-in truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-primary-500/10">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-surface-200/50 hover:text-surface-100 hover:bg-surface-800/50 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
