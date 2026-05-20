"""Anomaly detection router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/anomalies", tags=["Anomaly Detection"])


@router.get("/", response_model=schemas.AnomalyListResponse)
def list_anomalies(
    skip: int = 0, limit: int = 50,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    event_type: Optional[str] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List detected anomalies with filters."""
    query = db.query(models.AnomalyEvent)
    
    if severity:
        query = query.filter(models.AnomalyEvent.severity == severity)
    if status:
        query = query.filter(models.AnomalyEvent.status == status)
    if event_type:
        query = query.filter(models.AnomalyEvent.event_type == event_type)
    
    total = query.count()
    anomalies = query.order_by(models.AnomalyEvent.detected_at.desc()).offset(skip).limit(limit).all()
    
    # Severity breakdown
    by_severity = {
        "critical": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "critical").count(),
        "high": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "high").count(),
        "medium": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "medium").count(),
        "low": db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "low").count(),
    }
    
    return schemas.AnomalyListResponse(
        anomalies=[schemas.AnomalyResponse.model_validate(a) for a in anomalies],
        total=total,
        by_severity=by_severity,
    )


@router.get("/summary")
def anomaly_summary(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get anomaly detection summary statistics."""
    total = db.query(models.AnomalyEvent).count()
    open_count = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "open").count()
    investigating = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "investigating").count()
    resolved = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "resolved").count()
    
    # Top event types
    event_types = db.query(
        models.AnomalyEvent.event_type,
        func.count(models.AnomalyEvent.id).label("count"),
    ).group_by(models.AnomalyEvent.event_type).order_by(func.count(models.AnomalyEvent.id).desc()).limit(10).all()
    
    avg_score = db.query(func.avg(models.AnomalyEvent.score)).scalar() or 0
    
    return {
        "total": total,
        "open": open_count,
        "investigating": investigating,
        "resolved": resolved,
        "dismissed": total - open_count - investigating - resolved,
        "avg_score": round(avg_score, 3),
        "top_event_types": [{"type": e[0], "count": e[1]} for e in event_types],
        "detection_rate": round(open_count / total * 100, 1) if total else 0,
    }


@router.get("/{anomaly_id}", response_model=schemas.AnomalyResponse)
def get_anomaly(anomaly_id: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get anomaly event details."""
    anomaly = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.id == anomaly_id).first()
    if not anomaly:
        from fastapi import HTTPException
        raise HTTPException(404, "Anomaly not found")
    return schemas.AnomalyResponse.model_validate(anomaly)


@router.patch("/{anomaly_id}/status")
def update_anomaly_status(
    anomaly_id: str,
    status: str = Query(..., description="New status: open, investigating, resolved, dismissed"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update anomaly status."""
    anomaly = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.id == anomaly_id).first()
    if not anomaly:
        from fastapi import HTTPException
        raise HTTPException(404, "Anomaly not found")
    
    from datetime import datetime
    anomaly.status = status
    if status == "resolved":
        anomaly.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Anomaly status updated to {status}"}


@router.post("/run-detection")
def run_anomaly_detection(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Trigger anomaly detection on current transaction data."""
    from ml.anomaly_detection import detect_anomalies
    results = detect_anomalies(db)
    return {
        "message": "Anomaly detection completed",
        "new_anomalies": results.get("new_anomalies", 0),
        "total_analyzed": results.get("total_analyzed", 0),
    }
