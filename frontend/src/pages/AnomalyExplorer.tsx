import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyAPI } from '../services/api';
import { AlertTriangle, Eye, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { AnomalyEvent } from '../types';

export default function AnomalyExplorer() {
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies', severity, status],
    queryFn: () => anomalyAPI.list({ severity: severity || undefined, status: status || undefined }).then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['anomaly-summary'],
    queryFn: () => anomalyAPI.summary().then(r => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => anomalyAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['anomaly-summary'] });
    },
  });

  const severityColor = (s: string) => {
    const map: Record<string, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
    return map[s] || 'badge-info';
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: summary?.total || 0, color: 'text-primary-400' },
          { label: 'Open', value: summary?.open || 0, color: 'text-danger-400' },
          { label: 'Investigating', value: summary?.investigating || 0, color: 'text-warning-400' },
          { label: 'Resolved', value: summary?.resolved || 0, color: 'text-accent-400' },
          { label: 'Avg Score', value: summary?.avg_score?.toFixed(2) || '0', color: 'text-purple-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-surface-200/50 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={severity} onChange={e => setSeverity(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface-800/50 border border-primary-500/10 text-sm text-surface-200 focus:outline-none focus:border-primary-500/30"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface-800/50 border border-primary-500/10 text-sm text-surface-200 focus:outline-none focus:border-primary-500/30"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <span className="text-xs text-surface-200/40 ml-2">{data?.total || 0} results</span>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          (data?.anomalies || []).map((anomaly: AnomalyEvent) => (
            <div key={anomaly.id} className="glass-card p-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  anomaly.severity === 'critical' ? 'bg-danger-500/15' :
                  anomaly.severity === 'high' ? 'bg-orange-500/15' :
                  anomaly.severity === 'medium' ? 'bg-warning-500/15' : 'bg-accent-500/15'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    anomaly.severity === 'critical' ? 'text-danger-400' :
                    anomaly.severity === 'high' ? 'text-orange-400' :
                    anomaly.severity === 'medium' ? 'text-warning-400' : 'text-accent-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-surface-100">{anomaly.title}</h4>
                    <span className={`badge ${severityColor(anomaly.severity)}`}>{anomaly.severity}</span>
                    <span className="badge badge-info">{anomaly.status}</span>
                  </div>
                  <p className="text-sm text-surface-200/60 mb-2">{anomaly.description}</p>
                  <div className="flex items-center gap-4 text-xs text-surface-200/40">
                    <span>Score: {anomaly.score?.toFixed(3)}</span>
                    <span>Type: {anomaly.event_type}</span>
                    <span>{new Date(anomaly.detected_at).toLocaleString()}</span>
                    {anomaly.details?.affected_amount && (
                      <span>Amount: ${anomaly.details.affected_amount.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {anomaly.status === 'open' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: anomaly.id, status: 'investigating' })}
                      className="p-2 rounded-lg hover:bg-warning-500/10 text-surface-200/40 hover:text-warning-400 transition-colors"
                      title="Start investigation"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {(anomaly.status === 'open' || anomaly.status === 'investigating') && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: anomaly.id, status: 'resolved' })}
                      className="p-2 rounded-lg hover:bg-accent-500/10 text-surface-200/40 hover:text-accent-400 transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
