import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { Filter, Download } from 'lucide-react';
import { useState } from 'react';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analytics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.overview().then(r => r.data),
  });

  const { data: txnData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => analyticsAPI.transactions({ limit: 50 }).then(r => r.data),
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'vendors', label: 'Vendors' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-800/30 rounded-xl p-1 w-fit border border-primary-500/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                : 'text-surface-200/50 hover:text-surface-100 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="chart-container">
            <h3 className="text-sm font-semibold text-surface-100 mb-4">Monthly Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.transaction_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3 className="text-sm font-semibold text-surface-100 mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(analytics?.category_breakdown || []).slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-primary-500/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-100">Recent Transactions</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800/50 border border-primary-500/10 text-xs text-surface-200/60 hover:text-surface-100 transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800/50 border border-primary-500/10 text-xs text-surface-200/60 hover:text-surface-100 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-500/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/5">
                {(txnData?.transactions || []).slice(0, 20).map((t: any) => (
                  <tr key={t.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-3 text-surface-200/70 font-mono text-xs">{t.transaction_id}</td>
                    <td className="px-6 py-3 text-surface-200/70">{t.date ? new Date(t.date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3 font-medium text-surface-100">${t.amount?.toLocaleString()}</td>
                    <td className="px-6 py-3 text-surface-200/70">{t.category}</td>
                    <td className="px-6 py-3 text-surface-200/70">{t.department}</td>
                    <td className="px-6 py-3">
                      {t.is_anomaly ? (
                        <span className="badge badge-critical">Anomaly</span>
                      ) : (
                        <span className="badge badge-low">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="chart-container">
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Vendor Spend vs Risk Score</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="spend" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} name="Spend"
                tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} />
              <YAxis dataKey="risk" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} name="Risk Score" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any, name: any) => [name === 'spend' ? `$${v?.toLocaleString()}` : v, name]} />
              <Scatter data={analytics?.top_vendors || []} fill="#6366f1">
                {(analytics?.top_vendors || []).map((v: any, i: number) => (
                  <Cell key={i} fill={v.flagged ? '#ef4444' : v.risk >= 60 ? '#f59e0b' : '#6366f1'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
