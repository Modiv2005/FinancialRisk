"""Analytics router - dashboard stats, KPIs, and data analytics."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get main dashboard statistics."""
    total_txns = db.query(models.Transaction).count()
    total_amount = db.query(func.sum(models.Transaction.amount)).scalar() or 0
    anomalies = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "open").count()
    compliance = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.status == "open").count()
    
    risk_scores = db.query(models.RiskScore).filter(models.RiskScore.entity_id == "overall").all()
    avg_risk = sum(r.score for r in risk_scores) / len(risk_scores) if risk_scores else 0
    
    vendors = db.query(models.Vendor).count()
    documents = db.query(models.Document).filter(models.Document.user_id == user.id).count()
    alerts = db.query(models.Notification).filter(
        models.Notification.is_read == False
    ).count()
    
    return schemas.DashboardStats(
        total_transactions=total_txns,
        total_amount=round(total_amount, 2),
        anomalies_flagged=anomalies,
        compliance_violations=compliance,
        overall_risk_score=round(avg_risk, 1),
        active_vendors=vendors,
        documents_processed=documents,
        pending_alerts=alerts,
    )


@router.get("/overview", response_model=schemas.AnalyticsResponse)
def get_analytics_overview(
    period: str = Query("6m", description="Time period: 1m, 3m, 6m, 1y"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive analytics overview."""
    # KPI metrics
    total_txns = db.query(models.Transaction).count()
    total_amount = db.query(func.sum(models.Transaction.amount)).scalar() or 0
    avg_txn = total_amount / total_txns if total_txns else 0
    anomaly_rate = db.query(models.Transaction).filter(models.Transaction.is_anomaly == True).count()
    
    kpis = [
        schemas.KPIMetric(label="Total Transactions", value=total_txns, change=12.5, trend="up"),
        schemas.KPIMetric(label="Total Volume", value=f"${total_amount:,.0f}", change=8.3, trend="up"),
        schemas.KPIMetric(label="Avg Transaction", value=f"${avg_txn:,.0f}", change=-2.1, trend="down"),
        schemas.KPIMetric(label="Anomaly Rate", value=f"{(anomaly_rate/total_txns*100) if total_txns else 0:.1f}%", change=0.5, trend="up"),
    ]
    
    # Transaction trend (monthly)
    txn_trend = []
    for i in range(12):
        month_start = datetime(2025, 1, 1) + timedelta(days=30 * i)
        month_end = month_start + timedelta(days=30)
        count = db.query(models.Transaction).filter(
            models.Transaction.date >= month_start,
            models.Transaction.date < month_end,
        ).count()
        amount = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.date >= month_start,
            models.Transaction.date < month_end,
        ).scalar() or 0
        txn_trend.append(schemas.TimeSeriesPoint(
            date=month_start.strftime("%Y-%m"),
            value=round(amount, 2),
            label=month_start.strftime("%b %Y"),
        ))
    
    # Category breakdown
    categories = db.query(
        models.Transaction.category,
        func.count(models.Transaction.id).label("count"),
        func.sum(models.Transaction.amount).label("total"),
    ).group_by(models.Transaction.category).all()
    
    category_data = [
        {"category": c[0] or "Other", "count": c[1], "total": round(c[2] or 0, 2)}
        for c in categories
    ]
    
    # Risk distribution
    risk_data = [
        {"level": "Low", "count": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "low").count()},
        {"level": "Medium", "count": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "medium").count()},
        {"level": "High", "count": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "high").count()},
        {"level": "Critical", "count": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "critical").count()},
    ]
    
    # Anomaly trend
    anomaly_trend = []
    for i in range(12):
        month_start = datetime(2025, 1, 1) + timedelta(days=30 * i)
        month_end = month_start + timedelta(days=30)
        count = db.query(models.AnomalyEvent).filter(
            models.AnomalyEvent.detected_at >= month_start,
            models.AnomalyEvent.detected_at < month_end,
        ).count()
        anomaly_trend.append(schemas.TimeSeriesPoint(
            date=month_start.strftime("%Y-%m"),
            value=count,
        ))
    
    # Top vendors
    top_vendors = db.query(models.Vendor).order_by(models.Vendor.total_spend.desc()).limit(10).all()
    vendor_data = [
        {"name": v.name, "spend": round(v.total_spend, 2), "risk": v.risk_score, "flagged": v.is_flagged}
        for v in top_vendors
    ]
    
    return schemas.AnalyticsResponse(
        kpis=kpis,
        transaction_trend=txn_trend,
        category_breakdown=category_data,
        risk_distribution=risk_data,
        anomaly_trend=anomaly_trend,
        top_vendors=vendor_data,
    )


@router.get("/transactions")
def get_transactions(
    skip: int = 0, limit: int = 100,
    category: Optional[str] = None,
    department: Optional[str] = None,
    anomaly_only: bool = False,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get transactions with filters."""
    query = db.query(models.Transaction)
    
    if category:
        query = query.filter(models.Transaction.category == category)
    if department:
        query = query.filter(models.Transaction.department == department)
    if anomaly_only:
        query = query.filter(models.Transaction.is_anomaly == True)
    if min_amount:
        query = query.filter(models.Transaction.amount >= min_amount)
    if max_amount:
        query = query.filter(models.Transaction.amount <= max_amount)
    
    total = query.count()
    txns = query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()
    
    return {
        "transactions": [schemas.TransactionResponse.model_validate(t) for t in txns],
        "total": total,
    }


@router.get("/vendors")
def get_vendors(
    skip: int = 0, limit: int = 50,
    flagged_only: bool = False,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get vendor analytics."""
    query = db.query(models.Vendor)
    if flagged_only:
        query = query.filter(models.Vendor.is_flagged == True)
    
    total = query.count()
    vendors = query.order_by(models.Vendor.total_spend.desc()).offset(skip).limit(limit).all()
    
    return {
        "vendors": [
            {
                "id": v.id, "name": v.name, "category": v.category,
                "risk_score": v.risk_score, "total_spend": v.total_spend,
                "transaction_count": v.transaction_count, "country": v.country,
                "is_flagged": v.is_flagged,
            }
            for v in vendors
        ],
        "total": total,
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Get available transaction categories."""
    cats = db.query(models.Transaction.category).distinct().all()
    return [c[0] for c in cats if c[0]]


@router.get("/departments")
def get_departments(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Get available departments."""
    depts = db.query(models.Transaction.department).distinct().all()
    return [d[0] for d in depts if d[0]]
