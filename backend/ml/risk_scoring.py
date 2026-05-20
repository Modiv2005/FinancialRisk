"""Risk scoring module."""
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def compute_all_risk_scores(db) -> dict:
    """Compute comprehensive risk scores across all dimensions."""
    from models import Transaction, Vendor, AnomalyEvent, ComplianceFlag, RiskScore
    from sqlalchemy import func
    
    results = {}
    
    # Financial Risk Score
    total_txns = db.query(Transaction).count()
    anomaly_txns = db.query(Transaction).filter(Transaction.is_anomaly == True).count()
    anomaly_rate = (anomaly_txns / total_txns * 100) if total_txns else 0
    
    # Higher anomaly rate = higher risk
    financial_score = min(100, anomaly_rate * 10 + 20)
    
    existing = db.query(RiskScore).filter(
        RiskScore.entity_type == "financial", RiskScore.entity_id == "overall"
    ).first()
    
    if existing:
        existing.score = round(financial_score, 1)
        existing.risk_level = _score_to_level(financial_score)
        existing.computed_at = datetime.utcnow()
    else:
        db.add(RiskScore(
            id=str(uuid.uuid4()), entity_type="financial", entity_id="overall",
            score=round(financial_score, 1), risk_level=_score_to_level(financial_score),
            factors=[
                {"factor": "Anomaly Rate", "weight": 0.4, "score": round(anomaly_rate, 1)},
                {"factor": "Transaction Volume", "weight": 0.3, "score": min(100, total_txns / 20)},
                {"factor": "Amount Variance", "weight": 0.3, "score": round(financial_score * 0.8, 1)},
            ],
        ))
    results["financial"] = round(financial_score, 1)
    
    # Vendor Risk Score
    flagged_vendors = db.query(Vendor).filter(Vendor.is_flagged == True).count()
    total_vendors = db.query(Vendor).count()
    avg_vendor_risk = db.query(func.avg(Vendor.risk_score)).scalar() or 0
    
    vendor_score = min(100, avg_vendor_risk * 0.6 + (flagged_vendors / max(total_vendors, 1)) * 100 * 0.4)
    
    existing = db.query(RiskScore).filter(
        RiskScore.entity_type == "vendor", RiskScore.entity_id == "overall"
    ).first()
    if existing:
        existing.score = round(vendor_score, 1)
        existing.risk_level = _score_to_level(vendor_score)
        existing.computed_at = datetime.utcnow()
    else:
        db.add(RiskScore(
            id=str(uuid.uuid4()), entity_type="vendor", entity_id="overall",
            score=round(vendor_score, 1), risk_level=_score_to_level(vendor_score),
        ))
    results["vendor"] = round(vendor_score, 1)
    
    # Compliance Risk Score
    total_flags = db.query(ComplianceFlag).count()
    open_flags = db.query(ComplianceFlag).filter(ComplianceFlag.status == "open").count()
    critical_flags = db.query(ComplianceFlag).filter(ComplianceFlag.severity == "critical").count()
    
    compliance_score = min(100, (open_flags / max(total_flags, 1)) * 60 + critical_flags * 10 + 15)
    
    existing = db.query(RiskScore).filter(
        RiskScore.entity_type == "compliance", RiskScore.entity_id == "overall"
    ).first()
    if existing:
        existing.score = round(compliance_score, 1)
        existing.risk_level = _score_to_level(compliance_score)
        existing.computed_at = datetime.utcnow()
    else:
        db.add(RiskScore(
            id=str(uuid.uuid4()), entity_type="compliance", entity_id="overall",
            score=round(compliance_score, 1), risk_level=_score_to_level(compliance_score),
        ))
    results["compliance"] = round(compliance_score, 1)
    
    # Audit Risk Score
    open_anomalies = db.query(AnomalyEvent).filter(AnomalyEvent.status == "open").count()
    critical_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.severity == "critical", AnomalyEvent.status == "open"
    ).count()
    
    audit_score = min(100, open_anomalies * 2 + critical_anomalies * 10 + 10)
    
    existing = db.query(RiskScore).filter(
        RiskScore.entity_type == "audit", RiskScore.entity_id == "overall"
    ).first()
    if existing:
        existing.score = round(audit_score, 1)
        existing.risk_level = _score_to_level(audit_score)
        existing.computed_at = datetime.utcnow()
    else:
        db.add(RiskScore(
            id=str(uuid.uuid4()), entity_type="audit", entity_id="overall",
            score=round(audit_score, 1), risk_level=_score_to_level(audit_score),
        ))
    results["audit"] = round(audit_score, 1)
    
    db.commit()
    return results


def _score_to_level(score: float) -> str:
    if score < 35:
        return "low"
    elif score < 65:
        return "medium"
    elif score < 85:
        return "high"
    return "critical"
