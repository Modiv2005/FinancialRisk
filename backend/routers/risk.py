"""Risk scoring router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/risk", tags=["Risk Scoring"])


@router.get("/dashboard", response_model=schemas.RiskDashboard)
def get_risk_dashboard(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get risk dashboard with all scores."""
    scores = db.query(models.RiskScore).filter(models.RiskScore.entity_id == "overall").all()
    score_map = {s.entity_type: s for s in scores}
    
    financial_risk = score_map.get("financial", None)
    vendor_risk = score_map.get("vendor", None)
    compliance_risk = score_map.get("compliance", None)
    audit_risk = score_map.get("audit", None)
    
    overall = sum(s.score for s in scores) / len(scores) if scores else 50
    
    risk_level = "low" if overall < 35 else "medium" if overall < 65 else "high" if overall < 85 else "critical"
    
    # Risk trend (simulated monthly)
    import random
    from datetime import datetime, timedelta
    risk_trend = []
    for i in range(12):
        month = datetime(2025, 1, 1) + timedelta(days=30 * i)
        risk_trend.append(schemas.TimeSeriesPoint(
            date=month.strftime("%Y-%m"),
            value=round(overall + random.uniform(-10, 10), 1),
        ))
    
    # Top risks
    anomalies = db.query(models.AnomalyEvent).filter(
        models.AnomalyEvent.status == "open",
        models.AnomalyEvent.severity.in_(["critical", "high"]),
    ).order_by(models.AnomalyEvent.score.desc()).limit(5).all()
    
    top_risks = [
        {
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "score": a.score,
            "type": a.event_type,
            "status": a.status,
        }
        for a in anomalies
    ]
    
    return schemas.RiskDashboard(
        overall_score=round(overall, 1),
        risk_level=risk_level,
        financial_risk=financial_risk.score if financial_risk else 50,
        vendor_risk=vendor_risk.score if vendor_risk else 50,
        compliance_risk=compliance_risk.score if compliance_risk else 50,
        audit_risk=audit_risk.score if audit_risk else 50,
        risk_trend=risk_trend,
        top_risks=top_risks,
    )


@router.get("/scores")
def get_all_risk_scores(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all risk scores."""
    scores = db.query(models.RiskScore).order_by(models.RiskScore.computed_at.desc()).all()
    return [schemas.RiskScoreResponse.model_validate(s) for s in scores]


@router.get("/vendors")
def get_vendor_risk_scores(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get vendor risk assessment."""
    vendors = db.query(models.Vendor).order_by(models.Vendor.risk_score.desc()).all()
    
    risk_categories = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in vendors:
        if v.risk_score >= 80:
            risk_categories["critical"] += 1
        elif v.risk_score >= 60:
            risk_categories["high"] += 1
        elif v.risk_score >= 40:
            risk_categories["medium"] += 1
        else:
            risk_categories["low"] += 1
    
    return {
        "vendors": [
            {
                "id": v.id, "name": v.name, "risk_score": v.risk_score,
                "risk_level": "critical" if v.risk_score >= 80 else "high" if v.risk_score >= 60 else "medium" if v.risk_score >= 40 else "low",
                "total_spend": v.total_spend, "is_flagged": v.is_flagged,
                "country": v.country, "category": v.category,
            }
            for v in vendors
        ],
        "risk_distribution": risk_categories,
        "avg_risk": round(sum(v.risk_score for v in vendors) / len(vendors) if vendors else 0, 1),
    }


@router.post("/compute")
def compute_risk_scores(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Trigger risk score computation."""
    from ml.risk_scoring import compute_all_risk_scores
    results = compute_all_risk_scores(db)
    return {"message": "Risk scores computed", "results": results}
