import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyAPI, riskAPI } from '../services/api';
import { Shield, Sparkles, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [model, setModel] = useState('gpt-4o');
  const [chunkSize, setChunkSize] = useState('1000');
  const queryClient = useQueryClient();

  const runDetectionMutation = useMutation({
    mutationFn: () => anomalyAPI.runDetection(),
    onSuccess: (res) => {
      alert(`Anomaly detection completed! Identified ${res.data.new_anomalies} new suspicious transactions.`);
      queryClient.invalidateQueries();
    },
  });

  const runRiskMutation = useMutation({
    mutationFn: () => riskAPI.compute(),
    onSuccess: () => {
      alert('Risk scores successfully computed across all operational dimensions!');
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* AI Configuration */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-100">LLM & Orchestration Settings</h3>
            <p className="text-xs text-surface-200/50">Configure primary large language model and retrieval parameters</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-2 uppercase">Primary Model</label>
            <select
              value={model} onChange={e => setModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-sm text-surface-200 focus:outline-none focus:border-primary-500/30"
            >
              <option value="gpt-4o">OpenAI GPT-4o (Enterprise Standard)</option>
              <option value="gpt-4">OpenAI GPT-4 (High Rigor)</option>
              <option value="llama-3">Meta Llama 3 70B (Hosted Internal)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-200/60 mb-2 uppercase">RAG Chunk Size</label>
            <select
              value={chunkSize} onChange={e => setChunkSize(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-sm text-surface-200 focus:outline-none focus:border-primary-500/30"
            >
              <option value="500">500 tokens (High Granularity)</option>
              <option value="1000">1000 tokens (Balanced Context)</option>
              <option value="2000">2000 tokens (High Comprehensive Context)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manual Intelligence Engines */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-100">Manual Task Orchestration</h3>
            <p className="text-xs text-surface-200/50">Manually trigger backend data science models and risk computation engines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-800/30 border border-primary-500/5 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-surface-100 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                Run Anomaly Detection
              </h4>
              <p className="text-xs text-surface-200/50 mb-4">Fits Isolation Forest and Local Outlier Factor models to flag suspicious activities.</p>
            </div>
            <button
              onClick={() => runDetectionMutation.mutate()}
              disabled={runDetectionMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {runDetectionMutation.isPending ? 'Executing ML Models...' : 'Run Anomaly Detection'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-surface-800/30 border border-primary-500/5 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-surface-100 flex items-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-accent-400" />
                Re-calculate Risk Scores
              </h4>
              <p className="text-xs text-surface-200/50 mb-4">Recalculates financial, vendor, compliance, and audit risks for dashboard reporting.</p>
            </div>
            <button
              onClick={() => runRiskMutation.mutate()}
              disabled={runRiskMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {runRiskMutation.isPending ? 'Re-calculating...' : 'Compute Risk Scores'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
