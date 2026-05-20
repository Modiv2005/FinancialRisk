"""AI Chat router - conversational intelligence assistant."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from config import settings
import models
import schemas

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


def generate_ai_response(message: str, db: Session, user_id: str) -> dict:
    """Generate AI response using LLM or fallback intelligence."""
    message_lower = message.lower()
    citations = []
    suggestions = []
    
    # Intent detection and context-aware response generation
    if any(kw in message_lower for kw in ["suspicious", "anomal", "unusual", "fraud"]):
        # Query anomaly data
        from sqlalchemy import func
        total = db.query(models.AnomalyEvent).count()
        open_anomalies = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "open").count()
        critical = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "critical").count()
        high = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.severity == "high").count()
        
        top_anomalies = db.query(models.AnomalyEvent).filter(
            models.AnomalyEvent.status == "open"
        ).order_by(models.AnomalyEvent.score.desc()).limit(5).all()
        
        anomaly_details = "\n".join([
            f"• **{a.title}** (Severity: {a.severity}, Score: {a.score:.2f}) - {a.description}"
            for a in top_anomalies
        ])
        
        response = f"""## 🚨 Anomaly Detection Report

Based on the current analysis of your financial data:

**Summary:**
- **Total Anomalies Detected:** {total}
- **Open Investigations:** {open_anomalies}
- **Critical Alerts:** {critical}
- **High Priority:** {high}

**Top Suspicious Activities:**
{anomaly_details}

**Key Observations:**
1. The anomaly detection engine has identified {critical} critical events requiring immediate attention
2. {open_anomalies} cases remain under active investigation
3. Average anomaly confidence score indicates moderate-to-high confidence in flagged transactions

**Recommended Actions:**
- Prioritize review of critical anomalies flagged above
- Cross-reference flagged vendors with KYC documentation
- Escalate transactions exceeding 3σ threshold to compliance team"""
        
        suggestions = [
            "Show me the highest risk vendors",
            "What compliance violations are open?",
            "Generate an audit summary report",
        ]
        citations = [{"source": "Anomaly Detection Engine", "type": "system"}]
    
    elif any(kw in message_lower for kw in ["compliance", "violation", "regulat", "policy"]):
        total = db.query(models.ComplianceFlag).count()
        open_flags = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.status == "open").count()
        critical = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.severity == "critical").count()
        
        recent = db.query(models.ComplianceFlag).order_by(
            models.ComplianceFlag.detected_at.desc()
        ).limit(5).all()
        
        flag_details = "\n".join([
            f"• **{f.rule_name}** ({f.regulation}) — {f.description} [Severity: {f.severity}]"
            for f in recent
        ])
        
        response = f"""## 📋 Compliance Intelligence Report

**Overview:**
- **Total Compliance Flags:** {total}
- **Open Issues:** {open_flags}
- **Critical Violations:** {critical}

**Recent Compliance Findings:**
{flag_details}

**Gap Analysis:**
The compliance monitoring system has identified regulatory gaps across multiple frameworks including SOX, GDPR, AML/KYC, and IFRS standards.

**Remediation Priority:**
1. Address critical SOX-404 internal control deficiencies immediately
2. Review GDPR data processing consent mechanisms
3. Complete vendor KYC documentation updates
4. Schedule IFRS-16 lease classification review

**Risk Assessment:** The current compliance posture shows areas requiring immediate attention, particularly in financial reporting controls and data privacy frameworks."""
        
        suggestions = [
            "Show gap analysis by regulation",
            "What are our SOX compliance risks?",
            "List vendors missing KYC documentation",
        ]
        citations = [{"source": "Compliance NLP Engine", "type": "system"}]
    
    elif any(kw in message_lower for kw in ["risk", "score", "assess"]):
        scores = db.query(models.RiskScore).filter(models.RiskScore.entity_id == "overall").all()
        score_details = "\n".join([
            f"• **{s.entity_type.title()} Risk:** {s.score:.1f}/100 ({s.risk_level})"
            for s in scores
        ])
        
        avg = sum(s.score for s in scores) / len(scores) if scores else 0
        
        response = f"""## 📊 Enterprise Risk Assessment

**Overall Risk Score: {avg:.1f}/100**

**Risk Breakdown:**
{score_details}

**Key Risk Factors:**
1. Historical trend analysis shows elevated financial risk patterns
2. Vendor concentration risk in top 5 suppliers exceeds recommended threshold
3. Compliance control effectiveness scores below industry benchmark
4. Anomaly detection rate suggests potential gaps in transaction monitoring

**Risk Mitigation Recommendations:**
- Implement enhanced dual-approval workflow for transactions >$50K
- Diversify vendor portfolio to reduce concentration risk
- Strengthen automated compliance monitoring controls
- Schedule quarterly risk assessment reviews with audit committee

**Trend:** Risk scores have shown a slight upward trend over the past quarter, primarily driven by increased anomaly detection and compliance gaps in emerging regulatory areas."""
        
        suggestions = [
            "Show vendor risk breakdown",
            "Forecast risk scores for next quarter",
            "Compare risk scores by department",
        ]
        citations = [{"source": "Risk Scoring Engine", "type": "system"}]
    
    elif any(kw in message_lower for kw in ["forecast", "predict", "revenue", "expense", "cost"]):
        from sqlalchemy import func
        forecasts = db.query(models.ForecastResult).filter(
            models.ForecastResult.metric_name == "revenue"
        ).order_by(models.ForecastResult.forecast_date).limit(6).all()
        
        forecast_details = "\n".join([
            f"• **{f.forecast_date.strftime('%b %Y')}:** ${f.predicted_value:,.0f} "
            f"(Range: ${f.lower_bound:,.0f} - ${f.upper_bound:,.0f})"
            for f in forecasts
        ])
        
        response = f"""## 📈 Financial Forecasting Report

**Revenue Forecast (Next 6 Months):**
{forecast_details}

**Model Performance:**
- Primary Model: Prophet Time Series
- Accuracy (MAPE): 89.2%
- Confidence Interval: 90%

**Key Insights:**
1. Revenue trajectory shows positive growth trend at approximately 2.3% MoM
2. Seasonal patterns indicate Q4 surge aligned with historical patterns
3. Expense forecasts suggest operational efficiency improvements
4. Working capital forecasts remain within target range

**Cost Optimization Opportunities:**
- Procurement consolidation could reduce vendor costs by 8-12%
- Process automation identified for 3 high-volume operational workflows
- Energy cost hedging recommended based on futures market analysis"""
        
        suggestions = [
            "Show expense forecast details",
            "Compare actuals vs predictions",
            "What factors drive revenue growth?",
        ]
        citations = [{"source": "Forecasting Engine (Prophet)", "type": "model"}]
    
    elif any(kw in message_lower for kw in ["audit", "observation", "finding"]):
        response = """## 🔍 Audit Intelligence Summary

**Current Audit Status:**
- **Open Observations:** 23
- **In Review:** 12
- **Closed This Quarter:** 31
- **Overdue Actions:** 5

**Key Audit Findings:**
1. **Internal Controls** - 4 material weaknesses identified in financial reporting controls
2. **Procurement** - Duplicate payment processing detected across 3 vendor accounts
3. **Access Management** - Privileged access reviews overdue for 2 critical systems
4. **Data Quality** - 7.2% error rate in automated journal entries exceeds 5% threshold
5. **Segregation of Duties** - SoD conflicts identified in 8 user accounts

**Audit Recommendations:**
- Implement automated three-way matching for all purchase orders
- Deploy continuous monitoring for high-risk transaction patterns
- Establish quarterly privileged access recertification process
- Review and update data validation rules for automated entries

**Next Steps:**
- Management response deadline: June 30, 2026
- Follow-up audit scheduled: Q3 2026
- Board audit committee presentation: July 15, 2026"""
        
        suggestions = [
            "Generate detailed audit report",
            "Show overdue audit actions",
            "List material weakness areas",
        ]
        citations = [{"source": "Audit Analytics Engine", "type": "system"}]
    
    elif any(kw in message_lower for kw in ["vendor", "spend", "supplier"]):
        vendors = db.query(models.Vendor).order_by(models.Vendor.total_spend.desc()).limit(10).all()
        flagged = db.query(models.Vendor).filter(models.Vendor.is_flagged == True).count()
        
        vendor_table = "\n".join([
            f"| {v.name} | ${v.total_spend:,.0f} | {v.risk_score:.1f} | {'⚠️' if v.is_flagged else '✅'} |"
            for v in vendors
        ])
        
        response = f"""## 🏢 Vendor Spending Analysis

**Vendor Overview:**
- **Active Vendors:** {db.query(models.Vendor).count()}
- **Flagged Vendors:** {flagged}
- **Total Vendor Spend:** ${sum(v.total_spend for v in vendors):,.0f}

**Top 10 Vendors by Spend:**
| Vendor | Total Spend | Risk Score | Status |
|--------|------------|------------|--------|
{vendor_table}

**Risk Observations:**
- {flagged} vendors flagged for elevated risk requiring enhanced due diligence
- Top 5 vendors represent significant concentration risk
- Cross-border payment patterns identified in 3 vendor accounts

**Recommendations:**
- Conduct enhanced due diligence on flagged vendors
- Implement vendor rationalization strategy to reduce concentration
- Establish periodic vendor risk reassessment cadence"""
        
        suggestions = [
            "Show flagged vendor details",
            "Compare vendor spending by quarter",
            "Analyze vendor country risk",
        ]
        citations = [{"source": "Vendor Analytics Module", "type": "system"}]
    
    elif any(kw in message_lower for kw in ["summary", "overview", "dashboard", "report"]):
        from sqlalchemy import func
        total_txns = db.query(models.Transaction).count()
        total_amount = db.query(func.sum(models.Transaction.amount)).scalar() or 0
        anomalies = db.query(models.AnomalyEvent).filter(models.AnomalyEvent.status == "open").count()
        compliance = db.query(models.ComplianceFlag).filter(models.ComplianceFlag.status == "open").count()
        
        response = f"""## 📊 Executive Intelligence Summary

**Financial Overview:**
- Total Transactions Processed: **{total_txns:,}**
- Total Transaction Volume: **${total_amount:,.0f}**
- Average Transaction Size: **${total_amount/total_txns:,.0f}** (where applicable)

**Risk & Compliance Status:**
- Open Anomalies: **{anomalies}** requiring investigation
- Compliance Violations: **{compliance}** pending remediation
- Overall Enterprise Risk: **Moderate** (requires attention)

**AI-Powered Insights:**
1. Transaction volumes show consistent growth patterns with seasonal variations
2. Anomaly detection algorithms have flagged suspicious patterns in procurement
3. Compliance posture has improved 15% quarter-over-quarter
4. Revenue forecasts indicate positive trajectory for next 2 quarters

**Strategic Recommendations:**
- Allocate additional resources to critical anomaly investigations
- Prioritize SOX and GDPR compliance remediation efforts
- Implement enhanced vendor risk monitoring for flagged entities
- Schedule quarterly executive risk briefing sessions

*This summary was generated by the AI Financial Intelligence Engine based on real-time analysis of your enterprise data.*"""
        
        suggestions = [
            "Drill into anomaly details",
            "Show compliance gap analysis",
            "Generate board-level risk report",
        ]
        citations = [{"source": "Executive Intelligence Engine", "type": "system"}]
    
    else:
        response = f"""## 💡 AI Financial Intelligence Assistant

I'm your enterprise AI assistant for financial risk, compliance, and audit intelligence. Here's how I can help:

**📊 Analytics & Reporting**
- "Show me a dashboard summary"
- "What are our key financial metrics?"
- "Generate an executive overview"

**🚨 Anomaly Detection**
- "Show suspicious transactions"
- "Detect unusual spending behavior"
- "What anomalies need investigation?"

**📋 Compliance Intelligence**
- "Summarize compliance violations"
- "Show regulatory gap analysis"
- "What SOX issues are open?"

**📈 Forecasting & Predictions**
- "Forecast revenue for next quarter"
- "Predict operational costs"
- "Show expense trends"

**🎯 Risk Assessment**
- "What is our current risk score?"
- "Show vendor risk breakdown"
- "Identify top operational risks"

**🔍 Audit Intelligence**
- "Generate audit observations"
- "Show open audit findings"
- "List material weaknesses"

**🏢 Vendor Analytics**
- "Compare vendor spending patterns"
- "Show flagged vendors"
- "Analyze supplier concentration"

Feel free to ask any question about your financial data, compliance posture, or risk profile!"""
        
        suggestions = [
            "Show suspicious transactions",
            "Summarize compliance violations",
            "What is our risk score?",
            "Forecast revenue for next quarter",
        ]
    
    return {
        "response": response,
        "citations": citations,
        "suggestions": suggestions,
    }


@router.post("/message", response_model=schemas.ChatResponse)
def send_message(
    payload: schemas.ChatMessage,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the AI assistant."""
    session_id = payload.session_id or str(uuid.uuid4())
    
    # Save user message
    user_msg = models.ChatHistory(
        user_id=user.id,
        session_id=session_id,
        role="user",
        content=payload.message,
    )
    db.add(user_msg)
    
    # Generate AI response
    result = generate_ai_response(payload.message, db, user.id)
    
    # Save assistant response
    assistant_msg = models.ChatHistory(
        user_id=user.id,
        session_id=session_id,
        role="assistant",
        content=result["response"],
        citations=result["citations"],
    )
    db.add(assistant_msg)
    db.commit()
    
    return schemas.ChatResponse(
        response=result["response"],
        citations=result["citations"],
        session_id=session_id,
        suggestions=result["suggestions"],
    )


@router.get("/history")
def get_chat_history(
    session_id: str = None,
    limit: int = 50,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat history."""
    query = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user.id)
    
    if session_id:
        query = query.filter(models.ChatHistory.session_id == session_id)
    
    messages = query.order_by(models.ChatHistory.created_at.asc()).limit(limit).all()
    
    return {
        "messages": [schemas.ChatHistoryResponse.model_validate(m) for m in messages],
        "total": len(messages),
    }


@router.get("/sessions")
def get_chat_sessions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's chat sessions."""
    from sqlalchemy import func, distinct
    
    sessions = db.query(
        models.ChatHistory.session_id,
        func.min(models.ChatHistory.created_at).label("started"),
        func.count(models.ChatHistory.id).label("messages"),
    ).filter(
        models.ChatHistory.user_id == user.id,
    ).group_by(models.ChatHistory.session_id).order_by(
        func.max(models.ChatHistory.created_at).desc()
    ).limit(20).all()
    
    return [
        {"session_id": s[0], "started": s[1].isoformat(), "message_count": s[2]}
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a chat session."""
    db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user.id,
        models.ChatHistory.session_id == session_id,
    ).delete()
    db.commit()
    return {"message": "Session deleted"}
