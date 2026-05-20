import { useQuery } from '@tanstack/react-query';
import { complianceAPI } from '../services/api';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Compliance() {
  const { data: summary } = useQuery({
    queryKey: ['compliance-summary'],
    queryFn: () => complianceAPI.summary().then(r => r.data),
  });

  const { data: gapData } = useQuery({
    queryKey: ['compliance-gaps'],
    queryFn: () => complianceAPI.gapAnalysis().then(r => r.data),
  });

  const { data: regulations } = useQuery({
    queryKey: ['compliance-regulations'],
    queryFn: () => complianceAPI.regulations().then(r => r.data),
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Flags', value: summary?.total_flags || 0, icon: Shield, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Critical', value: summary?.critical || 0, icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/10' },
          { label: 'High', value: summary?.high || 0, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Medium', value: summary?.medium || 0, icon: Clock, color: 'text-warning-400', bg: 'bg-warning-500/10' },
          { label: 'Low', value: summary?.low || 0, icon: CheckCircle, color: 'text-accent-400', bg: 'bg-accent-500/10' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4">
            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-surface-200/50">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gap Analysis Chart */}
        <div className="chart-container">
          <h3 className="text-sm font-semibold text-surface-100 mb-1">Compliance Gap Analysis</h3>
          <p className="text-xs text-surface-200/40 mb-4">
            Overall Compliance Rate: <span className="text-primary-400 font-semibold">{gapData?.overall_compliance_rate || 0}%</span>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gapData?.gaps || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={140} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#e2e8f0' }} />
              <Bar dataKey="compliance_rate" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regulations */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-surface-100 mb-4">Regulatory Frameworks</h3>
          <div className="space-y-3">
            {(regulations || []).map((reg: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/30 border border-primary-500/5">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-100">{reg.regulation}</p>
                  <p className="text-xs text-surface-200/50">{reg.total_flags} flags • {reg.open_flags} open</p>
                </div>
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  reg.open_flags > 5 ? 'badge-critical' : reg.open_flags > 2 ? 'badge-high' : 'badge-low'
                }`}>
                  {reg.open_flags} open
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Flags */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-500/10">
          <h3 className="text-sm font-semibold text-surface-100">Recent Compliance Findings</h3>
        </div>
        <div className="divide-y divide-primary-500/5">
          {(summary?.recent_flags || []).map((flag: any) => (
            <div key={flag.id} className="flex items-start gap-4 px-6 py-4 hover:bg-surface-800/30 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                flag.severity === 'critical' ? 'bg-danger-400' : flag.severity === 'high' ? 'bg-orange-400' :
                flag.severity === 'medium' ? 'bg-warning-400' : 'bg-accent-400'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-surface-100">{flag.rule_name}</span>
                  <span className={`badge ${
                    flag.severity === 'critical' ? 'badge-critical' : flag.severity === 'high' ? 'badge-high' :
                    flag.severity === 'medium' ? 'badge-medium' : 'badge-low'
                  }`}>{flag.severity}</span>
                </div>
                <p className="text-sm text-surface-200/60">{flag.description}</p>
                <p className="text-xs text-surface-200/40 mt-1">
                  {flag.regulation} • {flag.affected_entity} • {new Date(flag.detected_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`badge ${flag.status === 'resolved' ? 'badge-low' : 'badge-info'}`}>
                {flag.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
