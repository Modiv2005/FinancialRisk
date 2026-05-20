"""SQLAlchemy ORM models for the financial risk platform."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    AUDITOR = "auditor"


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ─── Users & Auth ────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(20), default=UserRole.ANALYST)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    documents = relationship("Document", back_populates="owner")
    chat_history = relationship("ChatHistory", back_populates="user")
    sessions = relationship("Session", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String(512), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")


# ─── Documents ───────────────────────────────────────────────
class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(20))
    file_size = Column(Integer)
    file_path = Column(String(1000))
    status = Column(String(20), default=DocumentStatus.PENDING)
    category = Column(String(100))
    metadata_json = Column(JSON, default=dict)
    content_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer)
    content = Column(Text, nullable=False)
    embedding_id = Column(String(255))
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="chunks")


# ─── Transactions ────────────────────────────────────────────
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_id = Column(String(100), unique=True)
    date = Column(DateTime)
    amount = Column(Float)
    currency = Column(String(10), default="USD")
    category = Column(String(100))
    description = Column(Text)
    vendor_id = Column(String, ForeignKey("vendors.id"))
    department = Column(String(100))
    account_code = Column(String(50))
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    risk_flags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    vendor = relationship("Vendor", back_populates="transactions")


# ─── Vendors ─────────────────────────────────────────────────
class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    risk_score = Column(Float, default=0.0)
    total_spend = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)
    country = Column(String(100))
    is_flagged = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transactions = relationship("Transaction", back_populates="vendor")


# ─── Risk Scores ─────────────────────────────────────────────
class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(String, primary_key=True, default=generate_uuid)
    entity_type = Column(String(50))  # transaction, vendor, department, overall
    entity_id = Column(String)
    score = Column(Float, nullable=False)
    risk_level = Column(String(20))
    factors = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    computed_at = Column(DateTime, default=datetime.utcnow)


# ─── Anomaly Events ──────────────────────────────────────────
class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    event_type = Column(String(100))
    severity = Column(String(20))
    title = Column(String(500))
    description = Column(Text)
    entity_type = Column(String(50))
    entity_id = Column(String)
    score = Column(Float)
    details = Column(JSON, default=dict)
    status = Column(String(20), default="open")  # open, investigating, resolved, dismissed
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


# ─── Forecast Results ────────────────────────────────────────
class ForecastResult(Base):
    __tablename__ = "forecast_results"
    id = Column(String, primary_key=True, default=generate_uuid)
    metric_name = Column(String(100))
    forecast_date = Column(DateTime)
    predicted_value = Column(Float)
    lower_bound = Column(Float)
    upper_bound = Column(Float)
    model_used = Column(String(50))
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Compliance ──────────────────────────────────────────────
class ComplianceFlag(Base):
    __tablename__ = "compliance_flags"
    id = Column(String, primary_key=True, default=generate_uuid)
    rule_name = Column(String(255))
    severity = Column(String(20))
    category = Column(String(100))
    description = Column(Text)
    affected_entity = Column(String(255))
    regulation = Column(String(255))
    status = Column(String(20), default="open")
    remediation = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


# ─── Audit Logs ──────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String)
    action = Column(String(100))
    resource_type = Column(String(100))
    resource_id = Column(String)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)


# ─── Chat History ────────────────────────────────────────────
class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100))
    role = Column(String(20))  # user, assistant
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    citations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_history")


# ─── Analytics Events ────────────────────────────────────────
class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    event_type = Column(String(100))
    metric_name = Column(String(100))
    metric_value = Column(Float)
    dimensions = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ─── Notifications ───────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String)
    title = Column(String(255))
    message = Column(Text)
    notification_type = Column(String(50))  # anomaly, compliance, risk, audit
    severity = Column(String(20))
    is_read = Column(Boolean, default=False)
    link = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
