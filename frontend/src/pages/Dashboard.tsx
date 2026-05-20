import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, riskAPI } from '../services/api';
import {
  TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign,
  Users, FileText, Bell, Activity, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { DashboardStats, AnalyticsData } from '../types';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9', '#4f46e5', '#4338ca'];
const SEVERITY_COLORS: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };

function KPICard({ icon: Icon, label, value, change, trend, color, delay }: {
  icon: any; label: string; value: string | number; change?: number; trend?: string; color: string; delay: number;
}) {
  return (
    <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
            ${trend === 'up' ? 'text-accent-400 bg-accent-500/10' : 'text-danger-400 bg-danger-500/10'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-100">{value}</p>
      <p className="text-xs text-surface-200/50 mt-1">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsAPI.dashboard().then(r => r.data),
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.overview().then(r => r.data),
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: () => riskAPI.dashboard().then(r => r.data),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-200/50">Loading intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { icon: DollarSign, label: 'Total Transaction Volume', value: `$${((stats?.total_amount || 0) / 1e6).toFixed(1)}M`, change: 12.5, trend: 'up', color: 'bg-gradient-to-br from-primary-500 to-primary-700' },
    { icon: Activity, label: 'Total Transactions', value: (stats?.total_transactions || 0).toLocaleString(), change: 8.3, trend: 'up', color: 'bg-gradient-to-br from-accent-500 to-accent-600' },
    { icon: AlertTriangle, label: 'Anomalies Flagged', value: stats?.anomalies_flagged || 0, change: 3.2, trend: 'up', color: 'bg-gradient-to-br from-warning-500 to-warning-600' },
    { icon: Shield, label: 'Compliance Violations', value: stats?.compliance_violations || 0, change: -5.1, trend: 'down', color: 'bg-gradient-to-br from-danger-500 to-danger-600' },
    { icon: BarChart3, label: 'Overall Risk Score', value: `${stats?.overall_risk_score || 0}/100`, change: 1.8, trend: 'up', color: 'bg-gradient-to-br from-purple-500 to-purple-700' },
    { icon: Users, label: 'Active Vendors', value: stats?.active_vendors || 0, change: 2.0, trend: 'up', color: 'bg-gradient-to-br from-blue-500 to-blue-700' },
    { icon: FileText, label: 'Documents Processed', value: stats?.documents_processed || 0, change: 15.0, trend: 'up', color: 'bg-gradient-to-br from-cyan-500 to-cyan-700' },
    { icon: Bell, label: 'Pending Alerts', value: stats?.pending_alerts || 0, change: -8.0, trend: 'down', color: 'bg-gradient-to-br from-rose-500 to-rose-700' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} delay={i * 50} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transaction Volume Trend */}
        <div className="lg:col-span-2 chart-container animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Transaction Volume Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics?.transaction_trend || []}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [`$${v?.toLocaleString()}`, 'Volume']}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="chart-container animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analytics?.risk_distribution || []}
                dataKey="count" nameKey="level"
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={4} strokeWidth={0}
              >
                {(analytics?.risk_distribution || []).map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.level] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="chart-container animate-fade-in" style={{ animationDelay: '600ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(analytics?.category_breakdown || []).slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [`$${v?.toLocaleString()}`, 'Total']} />
              <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Vendors */}
        <div className="chart-container animate-fade-in" style={{ animationDelay: '700ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Top Vendors by Spend</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {(analytics?.top_vendors || []).map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/30 border border-primary-500/5 hover:border-primary-500/15 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{v.name}</p>
                  <p className="text-xs text-surface-200/50">${v.spend.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${v.risk >= 70 ? 'badge-critical' : v.risk >= 50 ? 'badge-high' : v.risk >= 30 ? 'badge-medium' : 'badge-low'}`}>
                    {v.risk.toFixed(0)}
                  </div>
                  {v.flagged && <AlertTriangle className="w-4 h-4 text-warning-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Scores & Anomaly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Gauge */}
        <div className="chart-container animate-fade-in" style={{ animationDelay: '800ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Enterprise Risk Scores</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Financial Risk', value: riskData?.financial_risk || 0, color: '#6366f1' },
              { label: 'Vendor Risk', value: riskData?.vendor_risk || 0, color: '#8b5cf6' },
              { label: 'Compliance Risk', value: riskData?.compliance_risk || 0, color: '#f59e0b' },
              { label: 'Audit Risk', value: riskData?.audit_risk || 0, color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-surface-800/30 border border-primary-500/5">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={item.color} strokeWidth="6"
                      strokeDasharray={`${(item.value / 100) * 201} 201`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-surface-100">
                    {item.value.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-surface-200/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Trend */}
        <div className="chart-container animate-fade-in" style={{ animationDelay: '900ms' }}>
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Anomaly Detection Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.anomaly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
