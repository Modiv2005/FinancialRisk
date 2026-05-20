"""Application configuration management."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Financial Risk & Compliance Intelligence Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fin-risk-secret-key-change-in-production-2024")
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'finrisk.db'}"
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "jwt-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # File Upload
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # Vector DB
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "data" / "chroma")
    
    # ML
    MODEL_DIR: str = str(BASE_DIR / "data" / "models")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
for d in [settings.UPLOAD_DIR, settings.CHROMA_PERSIST_DIR, settings.MODEL_DIR, str(BASE_DIR / "data")]:
    os.makedirs(d, exist_ok=True)
