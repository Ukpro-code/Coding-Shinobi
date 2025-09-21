from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database - Using SQLite for easy development
    database_url: str = "sqlite:///./learning_system.db"
    
    # For PostgreSQL (when ready to upgrade)
    # database_url: str = "postgresql://postgres:password@localhost:5432/learning_system"
    
    # Redis (optional for now)
    redis_url: str = "redis://localhost:6379"
    
    # API Keys
    openai_api_key: Optional[str] = None
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production-make-it-long-and-random"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # File Storage
    upload_dir: str = "uploads"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # AI Processing
    max_content_length: int = 10000  # Max chars for AI processing
    batch_size: int = 10  # For batch processing
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
