/* ─── Auth ────────────────────────────────────────────────── */
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'analyst' | 'auditor';
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/* ─── Dashboard ───────────────────────────────────────────── */
export interface DashboardStats {
  total_transactions: number;
  total_amount: number;
  anomalies_flagged: number;
  compliance_violations: number;
  overall_risk_score: number;
  active_vendors: number;
  documents_processed: number;
  pending_alerts: number;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsData {
  kpis: KPIMetric[];
  transaction_trend: TimeSeriesPoint[];
  category_breakdown: { category: string; count: number; total: number }[];
  risk_distribution: { level: string; count: number }[];
  anomaly_trend: TimeSeriesPoint[];
  top_vendors: { name: string; spend: number; risk: number; flagged: boolean }[];
}

/* ─── Documents ───────────────────────────────────────────── */
export interface Document {
  id: string;
  filename: string;
  file_type: string | null;
  file_size: number | null;
  status: string;
  category: string | null;
  metadata_json: Record<string, any> | null;
  created_at: string;
}

/* ─── Anomaly ─────────────────────────────────────────────── */
export interface AnomalyEvent {
  id: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  score: number;
  status: string;
  details: Record<string, any> | null;
  detected_at: string;
}

export interface AnomalyListResponse {
  anomalies: AnomalyEvent[];
  total: number;
  by_severity: Record<string, number>;
}

/* ─── Compliance ──────────────────────────────────────────── */
export interface ComplianceFlag {
  id: string;
  rule_name: string;
  severity: string;
  category: string;
  description: string;
  affected_entity: string;
  regulation: string;
  status: string;
  remediation: string | null;
  detected_at: string;
}

export interface ComplianceSummary {
  total_flags: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  by_category: { category: string; count: number }[];
  recent_flags: ComplianceFlag[];
}

/* ─── Risk ────────────────────────────────────────────────── */
export interface RiskDashboard {
  overall_score: number;
  risk_level: string;
  financial_risk: number;
  vendor_risk: number;
  compliance_risk: number;
  audit_risk: number;
  risk_trend: TimeSeriesPoint[];
  top_risks: {
    id: string;
    title: string;
    severity: string;
    score: number;
    type: string;
    status: string;
  }[];
}

/* ─── Forecast ────────────────────────────────────────────── */
export interface ForecastData {
  metric: string;
  model_used: string;
  accuracy?: number;
  forecast: {
    date: string;
    predicted: number;
    lower: number;
    upper: number;
    confidence?: number;
  }[];
  historical?: TimeSeriesPoint[];
}

/* ─── Chat ────────────────────────────────────────────────── */
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { source: string; type: string }[];
  created_at?: string;
}

export interface ChatResponse {
  response: string;
  citations: { source: string; type: string }[];
  session_id: string;
  suggestions: string[];
}

/* ─── Admin ───────────────────────────────────────────────── */
export interface AdminStats {
  total_users: number;
  total_documents: number;
  total_queries: number;
  total_anomalies: number;
  system_health: Record<string, string | number>;
  recent_activity: {
    type: string;
    action: string;
    content?: string;
    timestamp: string | null;
  }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

/* ─── Vendor ──────────────────────────────────────────────── */
export interface Vendor {
  id: string;
  name: string;
  category: string;
  risk_score: number;
  total_spend: number;
  transaction_count: number;
  country: string;
  is_flagged: boolean;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  department: string;
  is_anomaly: boolean;
  anomaly_score: number;
  risk_flags: string[];
}
