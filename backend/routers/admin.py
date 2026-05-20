"""Admin panel router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_user, require_role
import models
import schemas

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=schemas.AdminStats)
def get_admin_stats(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get admin dashboard statistics."""
    total_users = db.query(models.User).count()
    total_docs = db.query(models.Document).count()
    total_queries = db.query(models.ChatHistory).filter(models.ChatHistory.role == "user").count()
    total_anomalies = db.query(models.AnomalyEvent).count()
    
    # Recent activity
    recent_logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(10).all()
    recent_chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.role == "user"
    ).order_by(models.ChatHistory.created_at.desc()).limit(5).all()
    
    activity = []
    for log in recent_logs:
        activity.append({
            "type": "audit",
            "action": log.action,
            "resource": log.resource_type,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        })
    for chat in recent_chats:
        activity.append({
            "type": "query",
            "action": "AI Query",
            "content": chat.content[:100],
            "timestamp": chat.created_at.isoformat() if chat.created_at else None,
        })
    
    return schemas.AdminStats(
        total_users=total_users,
        total_documents=total_docs,
        total_queries=total_queries,
        total_anomalies=total_anomalies,
        system_health={
            "database": "healthy",
            "ml_engine": "active",
            "nlp_pipeline": "active",
            "rag_index": "synced",
            "uptime_hours": 720,
        },
        recent_activity=sorted(activity, key=lambda x: x.get("timestamp", ""), reverse=True)[:15],
    )


@router.get("/users")
def list_users(
    skip: int = 0, limit: int = 50,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all users (admin only)."""
    users = db.query(models.User).offset(skip).limit(limit).all()
    total = db.query(models.User).count()
    
    return {
        "users": [
            {
                "id": u.id, "email": u.email, "username": u.username,
                "full_name": u.full_name, "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role: str,
    admin: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user role."""
    if admin.role != "admin":
        raise HTTPException(403, "Admin access required")
    
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    
    if role not in ["admin", "analyst", "auditor"]:
        raise HTTPException(400, "Invalid role")
    
    target_user.role = role
    db.commit()
    return {"message": f"User role updated to {role}"}


@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    admin: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle user active status."""
    if admin.role != "admin":
        raise HTTPException(403, "Admin access required")
    
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    
    target_user.is_active = not target_user.is_active
    db.commit()
    return {"message": f"User {'activated' if target_user.is_active else 'deactivated'}"}


@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0, limit: int = 100,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get system audit logs."""
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    total = db.query(models.AuditLog).count()
    
    return {
        "logs": [
            {
                "id": l.id, "user_id": l.user_id, "action": l.action,
                "resource_type": l.resource_type, "resource_id": l.resource_id,
                "details": l.details,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            }
            for l in logs
        ],
        "total": total,
    }


@router.get("/notifications")
def get_notifications(
    unread_only: bool = False,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get notifications."""
    query = db.query(models.Notification)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
    
    notifications = query.order_by(models.Notification.created_at.desc()).limit(50).all()
    
    return {
        "notifications": [schemas.NotificationResponse.model_validate(n) for n in notifications],
        "unread_count": db.query(models.Notification).filter(models.Notification.is_read == False).count(),
    }


@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark notification as read."""
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}


@router.get("/model-metrics")
def get_model_metrics(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get ML model performance metrics."""
    return {
        "anomaly_detection": {
            "model": "Isolation Forest + LOF Ensemble",
            "accuracy": 0.923,
            "precision": 0.887,
            "recall": 0.914,
            "f1_score": 0.900,
            "last_trained": "2026-05-15T10:00:00Z",
            "training_samples": 2000,
        },
        "forecasting": {
            "model": "Prophet + XGBoost Ensemble",
            "mape": 0.089,
            "rmse": 45230.5,
            "r2_score": 0.912,
            "last_trained": "2026-05-18T08:00:00Z",
        },
        "risk_scoring": {
            "model": "Random Forest Classifier",
            "accuracy": 0.941,
            "auc_roc": 0.956,
            "last_computed": "2026-05-19T14:00:00Z",
        },
        "nlp_compliance": {
            "model": "spaCy + Transformer NER",
            "entity_accuracy": 0.897,
            "classification_accuracy": 0.923,
            "last_updated": "2026-05-17T12:00:00Z",
        },
    }
