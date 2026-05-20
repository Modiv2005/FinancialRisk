"""
AI Financial Risk & Compliance Intelligence Assistant
=====================================================
Enterprise-grade financial intelligence, audit analytics, and compliance risk management platform.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db, SessionLocal
from seed_data import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🚀 Starting AI Financial Risk & Compliance Intelligence Assistant")
    
    # Initialize database
    init_db()
    logger.info("✅ Database initialized")
    
    # Seed demo data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    logger.info("✅ Application ready")
    yield
    logger.info("👋 Shutting down")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI-powered financial intelligence, audit analytics, and compliance risk management platform",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers import auth, documents, analytics, anomaly, forecasting, compliance, risk, ai_chat, admin

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(analytics.router)
app.include_router(anomaly.router)
app.include_router(forecasting.router)
app.include_router(compliance.router)
app.include_router(risk.router)
app.include_router(ai_chat.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME,
        "components": {
            "database": "connected",
            "ml_engine": "active",
            "nlp_pipeline": "ready",
            "rag_index": "synced",
        },
    }


@app.get("/api")
def api_root():
    """API root with available endpoints."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "endpoints": {
            "auth": "/api/auth",
            "documents": "/api/documents",
            "analytics": "/api/analytics",
            "anomalies": "/api/anomalies",
            "forecasting": "/api/forecasting",
            "compliance": "/api/compliance",
            "risk": "/api/risk",
            "chat": "/api/chat",
            "admin": "/api/admin",
            "docs": "/api/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
