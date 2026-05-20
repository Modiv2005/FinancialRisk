"""Seed data generator for demo/development purposes."""
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import (
    User, Transaction, Vendor, AnomalyEvent, ComplianceFlag,
    RiskScore, ForecastResult, Notification, AuditLog, AnalyticsEvent
)
from auth import hash_password


VENDOR_NAMES = [
    "Acme Corp", "GlobalTech Solutions", "Pacific Supply Co", "Metro Services Inc",
    "Alpine Consulting", "Redwood Analytics", "Sunrise Logistics", "Coastal Trading LLC",
    "Summit Financial", "Pinnacle Systems", "Horizon Partners", "Atlas Manufacturing",
    "Sterling Associates", "Nova Digital", "Emerald Solutions", "Apex Ventures",
    "Quantum Dynamics", "Vanguard Services", "Orion Networks", "Phoenix Capital"
]

DEPARTMENTS = [
    "Finance", "Operations", "Marketing", "Sales", "HR",
    "IT", "Legal", "Procurement", "R&D", "Supply Chain"
]

CATEGORIES = [
    "Office Supplies", "Software Licenses", "Professional Services", "Travel & Entertainment",
    "Equipment", "Marketing Spend", "Consulting", "Insurance", "Utilities", "Maintenance",
    "Training", "Legal Fees", "Rent & Lease", "Telecommunications"
]

COMPLIANCE_RULES = [
    ("SOX-302", "Material financial misstatement risk", "Sarbanes-Oxley"),
    ("GDPR-7", "Data processing without valid consent", "GDPR"),
    ("AML-KYC-001", "Incomplete vendor KYC documentation", "Anti-Money Laundering"),
    ("IFRS-16", "Lease classification discrepancy", "IFRS"),
    ("SOX-404", "Internal control deficiency", "Sarbanes-Oxley"),
    ("PCI-DSS-3", "Payment data exposure risk", "PCI DSS"),
    ("FCPA-201", "Third-party payment compliance gap", "FCPA"),
    ("Basel-III-LCR", "Liquidity coverage ratio breach", "Basel III"),
    ("SOC2-CC6", "Logical access control weakness", "SOC 2"),
    ("HIPAA-164", "Protected health information handling", "HIPAA"),
]


def seed_database(db: Session):
    """Generate comprehensive demo data."""
    # Check if data already exists
    if db.query(User).first():
        return
    
    print("🌱 Seeding database with demo data...")
    
    # ── Users ──
    users = [
        User(
            id=str(uuid.uuid4()), email="admin@finrisk.ai", username="admin",
            hashed_password=hash_password("admin123"), full_name="Sarah Chen",
            role="admin", is_active=True
        ),
        User(
            id=str(uuid.uuid4()), email="analyst@finrisk.ai", username="analyst",
            hashed_password=hash_password("analyst123"), full_name="James Mitchell",
            role="analyst", is_active=True
        ),
        User(
            id=str(uuid.uuid4()), email="auditor@finrisk.ai", username="auditor",
            hashed_password=hash_password("auditor123"), full_name="Emily Rodriguez",
            role="auditor", is_active=True
        ),
    ]
    db.add_all(users)
    db.flush()
    
    # ── Vendors ──
    vendors = []
    for name in VENDOR_NAMES:
        v = Vendor(
            id=str(uuid.uuid4()), name=name,
            category=random.choice(CATEGORIES),
            risk_score=round(random.uniform(0, 100), 1),
            total_spend=round(random.uniform(10000, 5000000), 2),
            transaction_count=random.randint(5, 200),
            country=random.choice(["USA", "UK", "Germany", "India", "Singapore", "Canada", "Australia"]),
            is_flagged=random.random() < 0.15,
        )
        vendors.append(v)
    db.add_all(vendors)
    db.flush()
    
    # ── Transactions ──
    transactions = []
    base_date = datetime(2025, 1, 1)
    for i in range(2000):
        date = base_date + timedelta(days=random.randint(0, 500))
        amount = round(random.lognormvariate(8, 1.5), 2)
        is_anomaly = random.random() < 0.05
        
        # Make some transactions clearly anomalous
        if is_anomaly:
            amount *= random.uniform(3, 10)
        
        t = Transaction(
            id=str(uuid.uuid4()),
            transaction_id=f"TXN-{2025}-{str(i+1).zfill(6)}",
            date=date,
            amount=round(amount, 2),
            category=random.choice(CATEGORIES),
            description=f"Payment for {random.choice(CATEGORIES).lower()} services",
            vendor_id=random.choice(vendors).id,
            department=random.choice(DEPARTMENTS),
            account_code=f"{random.randint(1000, 9999)}-{random.randint(100, 999)}",
            is_anomaly=is_anomaly,
            anomaly_score=round(random.uniform(0.7, 1.0) if is_anomaly else random.uniform(0, 0.3), 3),
        )
        transactions.append(t)
    db.add_all(transactions)
    
    # ── Anomaly Events ──
    anomaly_types = [
        ("Unusual Transaction Amount", "Transaction amount significantly exceeds historical average"),
        ("Suspicious Vendor Payment", "Payment to vendor with elevated risk profile"),
        ("Duplicate Invoice Detection", "Potential duplicate invoice identified"),
        ("Off-Hours Transaction", "Transaction processed outside normal business hours"),
        ("Threshold Breach", "Transaction exceeds departmental spending threshold"),
        ("Vendor Concentration Risk", "Excessive spending concentration with single vendor"),
        ("Currency Anomaly", "Unexpected currency conversion detected"),
        ("Sequential Invoice Gap", "Missing invoice numbers in sequence"),
    ]
    
    anomalies = []
    for i in range(85):
        atype = random.choice(anomaly_types)
        severity = random.choices(["critical", "high", "medium", "low"], weights=[10, 25, 40, 25])[0]
        a = AnomalyEvent(
            id=str(uuid.uuid4()),
            event_type=atype[0],
            severity=severity,
            title=atype[0],
            description=atype[1],
            entity_type=random.choice(["transaction", "vendor", "department"]),
            entity_id=str(uuid.uuid4()),
            score=round(random.uniform(0.6, 1.0), 3),
            status=random.choices(["open", "investigating", "resolved", "dismissed"], weights=[40, 25, 25, 10])[0],
            detected_at=base_date + timedelta(days=random.randint(0, 500)),
            details={
                "affected_amount": round(random.uniform(5000, 500000), 2),
                "department": random.choice(DEPARTMENTS),
                "vendor": random.choice(VENDOR_NAMES),
            },
        )
        anomalies.append(a)
    db.add_all(anomalies)
    
    # ── Compliance Flags ──
    flags = []
    for i in range(45):
        rule = random.choice(COMPLIANCE_RULES)
        severity = random.choices(["critical", "high", "medium", "low"], weights=[15, 30, 35, 20])[0]
        f = ComplianceFlag(
            id=str(uuid.uuid4()),
            rule_name=rule[0],
            severity=severity,
            category=random.choice(["Financial Reporting", "Data Privacy", "Operational Risk", "Regulatory", "Internal Controls"]),
            description=rule[1],
            affected_entity=random.choice(DEPARTMENTS) + " Department",
            regulation=rule[2],
            status=random.choices(["open", "in_review", "resolved"], weights=[45, 30, 25])[0],
            remediation=f"Review and update {rule[2]} compliance procedures. Conduct internal audit of affected processes.",
            detected_at=base_date + timedelta(days=random.randint(0, 500)),
        )
        flags.append(f)
    db.add_all(flags)
    
    # ── Risk Scores ──
    risk_scores = []
    for entity_type in ["financial", "vendor", "compliance", "audit", "operational"]:
        rs = RiskScore(
            id=str(uuid.uuid4()),
            entity_type=entity_type,
            entity_id="overall",
            score=round(random.uniform(25, 85), 1),
            risk_level=random.choice(["low", "medium", "high"]),
            factors=[
                {"factor": "Historical trend", "weight": 0.3, "score": round(random.uniform(20, 80), 1)},
                {"factor": "Industry benchmark", "weight": 0.25, "score": round(random.uniform(20, 80), 1)},
                {"factor": "Anomaly density", "weight": 0.25, "score": round(random.uniform(20, 80), 1)},
                {"factor": "Control effectiveness", "weight": 0.2, "score": round(random.uniform(20, 80), 1)},
            ],
            recommendations=[
                "Increase monitoring frequency for high-risk areas",
                "Implement additional automated controls",
                "Conduct targeted internal audit review",
            ],
        )
        risk_scores.append(rs)
    db.add_all(risk_scores)
    
    # ── Forecast Results ──
    forecasts = []
    for month_offset in range(12):
        forecast_date = datetime(2026, 6, 1) + timedelta(days=30 * month_offset)
        for metric in ["revenue", "expenses", "operational_cost"]:
            base_val = {"revenue": 2500000, "expenses": 1800000, "operational_cost": 750000}[metric]
            predicted = base_val + random.uniform(-200000, 300000) + month_offset * 15000
            fr = ForecastResult(
                id=str(uuid.uuid4()),
                metric_name=metric,
                forecast_date=forecast_date,
                predicted_value=round(predicted, 2),
                lower_bound=round(predicted * 0.9, 2),
                upper_bound=round(predicted * 1.1, 2),
                model_used="prophet",
                confidence=round(random.uniform(0.82, 0.96), 3),
            )
            forecasts.append(fr)
    db.add_all(forecasts)
    
    # ── Notifications ──
    notifications = []
    notif_templates = [
        ("Critical Anomaly Detected", "A transaction of ${}k from {} exceeds the 3σ threshold", "anomaly", "critical"),
        ("Compliance Review Required", "SOX-404 control deficiency identified in {} department", "compliance", "high"),
        ("Risk Score Escalation", "Vendor {} risk score increased to {} - requires immediate review", "risk", "high"),
        ("Audit Observation", "New audit finding in {} process - severity: {}", "audit", "medium"),
        ("Forecast Alert", "Revenue forecast for Q{} shows {}% deviation from target", "risk", "medium"),
    ]
    for i in range(20):
        tmpl = random.choice(notif_templates)
        n = Notification(
            id=str(uuid.uuid4()),
            user_id=users[0].id,
            title=tmpl[0],
            message=tmpl[1].format(
                random.randint(50, 500),
                random.choice(VENDOR_NAMES),
            ),
            notification_type=tmpl[2],
            severity=tmpl[3],
            is_read=random.random() < 0.4,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 720)),
        )
        notifications.append(n)
    db.add_all(notifications)
    
    db.commit()
    print("✅ Database seeded successfully!")
    print(f"   Users: {len(users)}")
    print(f"   Vendors: {len(vendors)}")
    print(f"   Transactions: {len(transactions)}")
    print(f"   Anomalies: {len(anomalies)}")
    print(f"   Compliance Flags: {len(flags)}")
    print(f"   Risk Scores: {len(risk_scores)}")
    print(f"   Forecasts: {len(forecasts)}")
    print(f"   Notifications: {len(notifications)}")
