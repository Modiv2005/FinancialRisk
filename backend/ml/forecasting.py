"""Forecasting module using time series models."""
import uuid
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def generate_forecasts(db, metric: str = "revenue", periods: int = 12) -> dict:
    """Generate time series forecasts."""
    from models import Transaction, ForecastResult
    from sqlalchemy import func
    
    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression
        
        # Get historical monthly data
        historical = []
        for i in range(18):
            month_start = datetime(2025, 1, 1) + timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.date >= month_start,
                Transaction.date < month_end,
            ).scalar() or 0
            historical.append(float(amount))
        
        if not any(historical):
            return {"message": "No historical data available"}
        
        # Simple linear regression forecast
        X = np.array(range(len(historical))).reshape(-1, 1)
        y = np.array(historical)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate future predictions
        future_X = np.array(range(len(historical), len(historical) + periods)).reshape(-1, 1)
        predictions = model.predict(future_X)
        
        # Add noise for confidence intervals
        std = np.std(y - model.predict(X))
        
        # Clear existing forecasts for this metric
        db.query(ForecastResult).filter(ForecastResult.metric_name == metric).delete()
        
        results = []
        for i, pred in enumerate(predictions):
            forecast_date = datetime(2026, 7, 1) + timedelta(days=30 * i)
            fr = ForecastResult(
                id=str(uuid.uuid4()),
                metric_name=metric,
                forecast_date=forecast_date,
                predicted_value=round(float(pred), 2),
                lower_bound=round(float(pred - 1.96 * std), 2),
                upper_bound=round(float(pred + 1.96 * std), 2),
                model_used="linear_regression",
                confidence=round(float(model.score(X, y)), 3),
            )
            db.add(fr)
            results.append({
                "date": forecast_date.strftime("%Y-%m"),
                "predicted": fr.predicted_value,
                "lower": fr.lower_bound,
                "upper": fr.upper_bound,
            })
        
        db.commit()
        return {
            "metric": metric,
            "model": "linear_regression",
            "periods": periods,
            "r2_score": round(float(model.score(X, y)), 3),
            "forecasts": results,
        }
    
    except ImportError:
        logger.warning("scikit-learn not available for forecasting")
        return {"message": "ML libraries not available", "status": "fallback"}
