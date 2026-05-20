import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/upload': 'Upload Center',
  '/analytics': 'Analytics Workspace',
  '/ai-assistant': 'AI Intelligence Assistant',
  '/anomalies': 'Anomaly Explorer',
  '/compliance': 'Compliance Workspace',
  '/forecasting': 'Forecasting Dashboard',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => adminAPI.notifications(true).then((r) => r.data),
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-primary-500/10 bg-surface-900/50 backdrop-blur-lg">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold text-surface-100">
          {pageTitles[location.pathname] || 'Dashboard'}
        </h2>
        <p className="text-xs text-surface-200/50">AI Financial Risk & Compliance Intelligence</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface-800/50 rounded-xl px-4 py-2 border border-primary-500/10 w-80">
        <Search className="w-4 h-4 text-surface-200/40" />
        <input
          type="text"
          placeholder="Search transactions, vendors, reports..."
          className="bg-transparent text-sm text-surface-100 placeholder:text-surface-200/30 outline-none flex-1"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface-800/50 transition-colors">
          <Bell className="w-5 h-5 text-surface-200/60" />
          {notifData?.unread_count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 rounded-full text-[10px] font-bold flex items-center justify-center pulse-danger">
              {notifData.unread_count > 9 ? '9+' : notifData.unread_count}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-primary-500/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-surface-100">{user?.full_name || user?.username}</p>
            <p className="text-[10px] text-surface-200/50 uppercase tracking-wider">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-surface-800/50 text-surface-200/40 hover:text-danger-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
