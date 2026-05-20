import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Users, Cpu, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats().then(r => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then(r => r.data),
    enabled: activeTab === 'users',
  });

  const { data: auditData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminAPI.auditLogs().then(r => r.data),
    enabled: activeTab === 'audit',
  });

  const { data: modelMetrics } = useQuery({
    queryKey: ['admin-model-metrics'],
    queryFn: () => adminAPI.modelMetrics().then(r => r.data),
    enabled: activeTab === 'models',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminAPI.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminAPI.toggleStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Terminal },
    { id: 'models', label: 'ML Model Performance', icon: Cpu },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total System Users', value: stats?.total_users || 0, color: 'text-primary-400' },
          { label: 'Ingested Documents', value: stats?.total_documents || 0, color: 'text-purple-400' },
          { label: 'Total AI Inquiries', value: stats?.total_queries || 0, color: 'text-accent-400' },
          { label: 'Flagged Anomalies', value: stats?.total_anomalies || 0, color: 'text-danger-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-100">{item.value}</p>
            <p className="text-xs text-surface-200/50 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-800/30 rounded-xl p-1 w-fit border border-primary-500/10">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                  : 'text-surface-200/50 hover:text-surface-100 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-primary-500/10 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-surface-100">Registered Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-500/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/5">
                {(usersData?.users || []).map((u: any) => (
                  <tr key={u.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-3 font-medium text-surface-100">{u.full_name || u.username}</td>
                    <td className="px-6 py-3 text-surface-200/70">{u.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={u.role}
                        onChange={e => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                        className="px-2 py-1 rounded bg-surface-800 border border-primary-500/10 text-xs text-surface-200"
                      >
                        <option value="admin">Admin</option>
                        <option value="analyst">Analyst</option>
                        <option value="auditor">Auditor</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      {u.is_active ? (
                        <span className="badge badge-low">Active</span>
                      ) : (
                        <span className="badge badge-critical">Deactivated</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleStatusMutation.mutate(u.id)}
                        className={`text-xs font-semibold hover:underline ${
                          u.is_active ? 'text-danger-400' : 'text-accent-400'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-primary-500/10">
            <h3 className="text-sm font-semibold text-surface-100">System Activity Audit Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-500/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Timestamp</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">User ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-surface-200/50 uppercase">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/5">
                {(auditData?.logs || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-3 text-surface-200/50 font-mono text-xs">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 text-surface-200/70 font-mono text-xs">{l.user_id}</td>
                    <td className="px-6 py-3 font-medium text-surface-100">{l.action}</td>
                    <td className="px-6 py-3 text-surface-200/70">{l.resource_type} ({l.resource_id})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'models' && modelMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(modelMetrics).map(([name, m]: any) => (
            <div key={name} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-surface-100 capitalize">{name.replace('_', ' ')} Performance</h4>
                <Cpu className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-xs text-surface-200/50 mb-4">Model Type: <span className="text-primary-400 font-semibold">{m.model}</span></p>
              
              <div className="space-y-3">
                {Object.entries(m).map(([metricKey, metricValue]: any) => {
                  if (['model', 'last_trained', 'last_computed', 'last_updated'].includes(metricKey)) return null;
                  return (
                    <div key={metricKey} className="flex justify-between items-center text-xs">
                      <span className="text-surface-200/60 uppercase tracking-wider">{metricKey.replace('_', ' ')}</span>
                      <span className="font-mono text-surface-100 font-bold">{typeof metricValue === 'number' ? metricValue.toFixed(3) : metricValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
