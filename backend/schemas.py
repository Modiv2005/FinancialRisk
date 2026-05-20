"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ─── Auth Schemas ────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    role: str = "analyst"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Document Schemas ────────────────────────────────────────
class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: Optional[str]
    file_size: Optional[int]
    status: str
    category: Optional[str]
    metadata_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


# ─── Transaction Schemas ─────────────────────────────────────
class TransactionResponse(BaseModel):
    id: str
    transaction_id: Optional[str]
    date: Optional[datetime]
    amount: Optional[float]
    currency: str
    category: Optional[str]
    description: Optional[str]
    department: Optional[str]
    is_anomaly: bool
    anomaly_score: float
    risk_flags: Optional[list]

    class Config:
        from_attributes = True


# ─── Analytics Schemas ────────────────────────────────────────
class DashboardStats(BaseModel):
    total_transactions: int
    total_amount: float
    anomalies_flagged: int
    compliance_violations: int
    overall_risk_score: float
    active_vendors: int
    documents_processed: int
    pending_alerts: int


class KPIMetric(BaseModel):
    label: str
    value: Any
    change: Optional[float] = None
    trend: Optional[str] = None  # up, down, stable
    icon: Optional[str] = None


class TimeSeriesPoint(BaseModel):
    date: str
    value: float
    label: Optional[str] = None


class AnalyticsResponse(BaseModel):
    kpis: List[KPIMetric]
    transaction_trend: List[TimeSeriesPoint]
    category_breakdown: List[dict]
    risk_distribution: List[dict]
    anomaly_trend: List[TimeSeriesPoint]
    top_vendors: List[dict]


# ─── Anomaly Schemas ─────────────────────────────────────────
class AnomalyResponse(BaseModel):
    id: str
    event_type: Optional[str]
    severity: Optional[str]
    title: Optional[str]
    description: Optional[str]
    score: Optional[float]
    status: str
    details: Optional[dict]
    detected_at: datetime

    class Config:
        from_attributes = True


class AnomalyListResponse(BaseModel):
    anomalies: List[AnomalyResponse]
    total: int
    by_severity: dict


# ─── Forecast Schemas ────────────────────────────────────────
class ForecastRequest(BaseModel):
    metric: str = "revenue"
    periods: int = 12
    model: str = "prophet"


class ForecastPointResponse(BaseModel):
    date: str
    predicted: float
    lower: float
    upper: float


class ForecastResponse(BaseModel):
    metric: str
    model_used: str
    forecast: List[ForecastPointResponse]
    accuracy: Optional[float] = None
    historical: List[TimeSeriesPoint]


# ─── Compliance Schemas ──────────────────────────────────────
class ComplianceFlagResponse(BaseModel):
    id: str
    rule_name: Optional[str]
    severity: Optional[str]
    category: Optional[str]
    description: Optional[str]
    affected_entity: Optional[str]
    regulation: Optional[str]
    status: str
    remediation: Optional[str]
    detected_at: datetime

    class Config:
        from_attributes = True


class ComplianceSummary(BaseModel):
    total_flags: int
    critical: int
    high: int
    medium: int
    low: int
    by_category: List[dict]
    recent_flags: List[ComplianceFlagResponse]


# ─── Risk Schemas ─────────────────────────────────────────────
class RiskScoreResponse(BaseModel):
    id: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    score: float
    risk_level: Optional[str]
    factors: Optional[list]
    recommendations: Optional[list]
    computed_at: datetime

    class Config:
        from_attributes = True


class RiskDashboard(BaseModel):
    overall_score: float
    risk_level: str
    financial_risk: float
    vendor_risk: float
    compliance_risk: float
    audit_risk: float
    risk_trend: List[TimeSeriesPoint]
    top_risks: List[dict]


# ─── Chat Schemas ─────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    citations: List[dict] = []
    session_id: str
    suggestions: List[str] = []


class ChatHistoryResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: Optional[list]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Admin Schemas ────────────────────────────────────────────
class AdminStats(BaseModel):
    total_users: int
    total_documents: int
    total_queries: int
    total_anomalies: int
    system_health: dict
    recent_activity: List[dict]


class NotificationResponse(BaseModel):
    id: str
    title: Optional[str]
    message: Optional[str]
    notification_type: Optional[str]
    severity: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
