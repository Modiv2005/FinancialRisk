"""Anomaly detection module using ML algorithms."""
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def detect_anomalies(db) -> dict:
    """Run anomaly detection on transaction data."""
    from models import Transaction, AnomalyEvent
    
    try:
        import numpy as np
        from sklearn.ensemble import IsolationForest
        from sklearn.neighbors import LocalOutlierFactor
        
        # Get transaction data
        transactions = db.query(Transaction).all()
        if len(transactions) < 10:
            return {"new_anomalies": 0, "total_analyzed": 0, "message": "Not enough data"}
        
        # Feature engineering
        amounts = np.array([t.amount for t in transactions]).reshape(-1, 1)
        
        # Isolation Forest
        iso_forest = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100,
        )
        iso_predictions = iso_forest.fit_predict(amounts)
        iso_scores = iso_forest.decision_function(amounts)
        
        # Local Outlier Factor
        lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
        lof_predictions = lof.fit_predict(amounts)
        lof_scores = lof.negative_outlier_factor_
        
        # Ensemble: flag as anomaly if both models agree
        new_anomalies = 0
        for i, txn in enumerate(transactions):
            is_anomaly = iso_predictions[i] == -1 and lof_predictions[i] == -1
            
            if is_anomaly and not txn.is_anomaly:
                txn.is_anomaly = True
                txn.anomaly_score = float(abs(min(iso_scores[i], lof_scores[i])))
                
                # Create anomaly event
                event = AnomalyEvent(
                    id=str(uuid.uuid4()),
                    event_type="Unusual Transaction Amount",
                    severity="high" if txn.amount > np.percentile(amounts, 99) else "medium",
                    title=f"Anomalous transaction detected: {txn.transaction_id}",
                    description=f"Transaction amount ${txn.amount:,.2f} flagged by ensemble model",
                    entity_type="transaction",
                    entity_id=txn.id,
                    score=txn.anomaly_score,
                    status="open",
                    details={
                        "amount": txn.amount,
                        "category": txn.category,
                        "department": txn.department,
                        "iso_score": float(iso_scores[i]),
                        "lof_score": float(lof_scores[i]),
                    },
                )
                db.add(event)
                new_anomalies += 1
        
        db.commit()
        
        return {
            "new_anomalies": new_anomalies,
            "total_analyzed": len(transactions),
            "iso_forest_anomalies": int(sum(1 for p in iso_predictions if p == -1)),
            "lof_anomalies": int(sum(1 for p in lof_predictions if p == -1)),
        }
    
    except ImportError:
        logger.warning("scikit-learn not available, using rule-based detection")
        return _rule_based_detection(db)


def _rule_based_detection(db) -> dict:
    """Fallback rule-based anomaly detection."""
    from models import Transaction, AnomalyEvent
    
    transactions = db.query(Transaction).all()
    amounts = [t.amount for t in transactions]
    
    if not amounts:
        return {"new_anomalies": 0, "total_analyzed": 0}
    
    mean_amount = sum(amounts) / len(amounts)
    std_amount = (sum((a - mean_amount) ** 2 for a in amounts) / len(amounts)) ** 0.5
    threshold = mean_amount + 3 * std_amount
    
    new_anomalies = 0
    for txn in transactions:
        if txn.amount > threshold and not txn.is_anomaly:
            txn.is_anomaly = True
            txn.anomaly_score = min(1.0, (txn.amount - mean_amount) / (std_amount * 5))
            
            event = AnomalyEvent(
                id=str(uuid.uuid4()),
                event_type="Statistical Outlier",
                severity="high" if txn.amount > threshold * 1.5 else "medium",
                title=f"Statistical outlier: {txn.transaction_id}",
                description=f"Amount ${txn.amount:,.2f} exceeds 3σ threshold of ${threshold:,.2f}",
                entity_type="transaction",
                entity_id=txn.id,
                score=txn.anomaly_score,
                status="open",
            )
            db.add(event)
            new_anomalies += 1
    
    db.commit()
    return {"new_anomalies": new_anomalies, "total_analyzed": len(transactions)}
