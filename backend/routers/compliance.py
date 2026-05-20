"""Compliance intelligence router."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


@router.get("/summary", response_model=schemas.ComplianceSummary)
def get_compliance_summary(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get compliance summary dashboard."""
    total = db.query(models.ComplianceFlag).count()
    critical = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.severity == "critical").count()
    high = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.severity == "high").count()
    medium = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.severity == "medium").count()
    low = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.severity == "low").count()
    
    by_category = db.query(
        models.ComplianceFlag.category,
        func.count(models.ComplianceFlag.id).label("count"),
    ).group_by(models.ComplianceFlag.category).all()
    
    recent = db.query(models.ComplianceFlag).order_by(
        models.ComplianceFlag.detected_at.desc()
    ).limit(10).all()
    
    return schemas.ComplianceSummary(
        total_flags=total,
        critical=critical,
        high=high,
        medium=medium,
        low=low,
        by_category=[{"category": c[0], "count": c[1]} for c in by_category],
        recent_flags=[schemas.ComplianceFlagResponse.model_validate(f) for f in recent],
    )


@router.get("/flags")
def list_compliance_flags(
    skip: int = 0, limit: int = 50,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    regulation: Optional[str] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List compliance flags with filters."""
    query = db.query(models.ComplianceFlag)
    
    if severity:
        query = query.filter(models.ComplianceFlag.severity == severity)
    if status:
        query = query.filter(models.ComplianceFlag.status == status)
    if category:
        query = query.filter(models.ComplianceFlag.category == category)
    if regulation:
        query = query.filter(models.ComplianceFlag.regulation == regulation)
    
    total = query.count()
    flags = query.order_by(models.ComplianceFlag.detected_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "flags": [schemas.ComplianceFlagResponse.model_validate(f) for f in flags],
        "total": total,
    }


@router.get("/flags/{flag_id}")
def get_compliance_flag(flag_id: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get compliance flag details."""
    flag = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(404, "Compliance flag not found")
    return schemas.ComplianceFlagResponse.model_validate(flag)


@router.patch("/flags/{flag_id}/status")
def update_flag_status(
    flag_id: str,
    status: str = Query(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update compliance flag status."""
    flag = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(404, "Compliance flag not found")
    
    from datetime import datetime
    flag.status = status
    if status == "resolved":
        flag.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": f"Flag status updated to {status}"}


@router.get("/regulations")
def list_regulations(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get list of regulations in the system."""
    regs = db.query(models.ComplianceFlag.regulation).distinct().all()
    
    result = []
    for r in regs:
        if r[0]:
            count = db.query(models.ComplianceFlag).filter(
                models.ComplianceFlag.regulation == r[0]
            ).count()
            open_count = db.query(models.ComplianceFlag).filter(
                models.ComplianceFlag.regulation == r[0],
                models.ComplianceFlag.status == "open",
            ).count()
            result.append({
                "regulation": r[0],
                "total_flags": count,
                "open_flags": open_count,
            })
    
    return result


@router.get("/gap-analysis")
def compliance_gap_analysis(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Perform compliance gap analysis."""
    categories = db.query(
        models.ComplianceFlag.category,
        func.count(models.ComplianceFlag.id).label("total"),
        func.sum(
            func.cast(models.ComplianceFlag.status == "resolved", models.ComplianceFlag.id.type)
        ).label("resolved"),
    ).group_by(models.ComplianceFlag.category).all()
    
    gaps = []
    for cat in categories:
        total = cat[1]
        resolved = cat[2] or 0
        compliance_rate = (resolved / total * 100) if total else 100
        gaps.append({
            "category": cat[0],
            "total_issues": total,
            "resolved": resolved,
            "open": total - resolved,
            "compliance_rate": round(compliance_rate, 1),
            "gap_level": "critical" if compliance_rate < 50 else "moderate" if compliance_rate < 75 else "low",
        })
    
    return {
        "gaps": sorted(gaps, key=lambda x: x["compliance_rate"]),
        "overall_compliance_rate": round(
            sum(g["compliance_rate"] for g in gaps) / len(gaps) if gaps else 100, 1
        ),
    }
