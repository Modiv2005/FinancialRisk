import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsAPI } from '../services/api';
import { File, FileText, Table, Trash2, CheckCircle, Clock, XCircle, CloudUpload } from 'lucide-react';
import type { Document } from '../types';

const FILE_ICONS: Record<string, any> = {
  '.pdf': FileText, '.csv': Table, '.xlsx': Table, '.xls': Table,
  '.docx': FileText, '.txt': File, '.json': File,
};

const STATUS_STYLES: Record<string, { icon: any; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-accent-400' },
  processing: { icon: Clock, color: 'text-warning-400' },
  pending: { icon: Clock, color: 'text-surface-200/50' },
  failed: { icon: XCircle, color: 'text-danger-400' },
};

export default function Upload() {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsAPI.list().then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsAPI.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => uploadMutation.mutate(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Upload Zone */}
      <div
        className={`glass-card p-10 text-center cursor-pointer transition-all duration-300
          ${dragOver ? 'border-primary-400 bg-primary-500/5 scale-[1.01]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef} type="file" multiple hidden
          accept=".pdf,.csv,.xlsx,.xls,.docx,.txt,.json"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center mx-auto mb-4">
          <CloudUpload className={`w-8 h-8 ${dragOver ? 'text-primary-400 animate-bounce' : 'text-primary-500'}`} />
        </div>
        <h3 className="text-lg font-semibold text-surface-100 mb-1">
          {dragOver ? 'Drop files here' : 'Upload Financial Documents'}
        </h3>
        <p className="text-sm text-surface-200/50 mb-3">
          Drag & drop or click to browse. Supports PDF, CSV, XLSX, DOCX, TXT, JSON
        </p>
        <p className="text-xs text-surface-200/30">Maximum file size: 50MB</p>
        {uploadMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-primary-400">
            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-500/10">
          <h3 className="text-sm font-semibold text-surface-100">Uploaded Documents ({data?.total || 0})</h3>
        </div>
        
        {!data?.documents?.length ? (
          <div className="p-12 text-center text-surface-200/40">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-500/5">
            {data.documents.map((doc: Document) => {
              const Icon = FILE_ICONS[doc.file_type || ''] || File;
              const statusInfo = STATUS_STYLES[doc.status] || STATUS_STYLES.pending;
              const StatusIcon = statusInfo.icon;
              return (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">{doc.filename}</p>
                    <p className="text-xs text-surface-200/40">
                      {formatSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                      {doc.category && ` • ${doc.category}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-xs font-medium capitalize">{doc.status}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                      className="p-2 rounded-lg hover:bg-danger-500/10 text-surface-200/30 hover:text-danger-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
