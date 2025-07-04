"""
Configuration settings for Sifrex Authentication API
Handles environment variables and application settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Sifrex Authentication API"
    VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_SCHEMA: str = Field(default="sifrex_users", env="DATABASE_SCHEMA")
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, env="DATABASE_MAX_OVERFLOW")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Password security
    PASSWORD_MIN_LENGTH: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    PASSWORD_HASH_ROUNDS: int = Field(default=12, env="PASSWORD_HASH_ROUNDS")
    
    # Rate limiting
    RATE_LIMIT_LOGIN_ATTEMPTS: int = Field(default=5, env="RATE_LIMIT_LOGIN_ATTEMPTS")
    RATE_LIMIT_WINDOW_MINUTES: int = Field(default=15, env="RATE_LIMIT_WINDOW_MINUTES")
    RATE_LIMIT_PASSWORD_RESET: int = Field(default=3, env="RATE_LIMIT_PASSWORD_RESET")
    RATE_LIMIT_PASSWORD_WINDOW_HOURS: int = Field(default=1, env="RATE_LIMIT_PASSWORD_WINDOW_HOURS")
    
    # CORS and security
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    # Email configuration (for future implementation)
    EMAIL_BACKEND: str = Field(default="console", env="EMAIL_BACKEND")  # console, smtp, sendgrid, ses
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: Optional[int] = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    
    # AWS SES
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: Optional[str] = Field(default="us-east-1", env="AWS_REGION")
    
    # Application URLs
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    API_URL: str = Field(default="http://localhost:8000", env="API_URL")
    
    # File storage (for profile pictures, exports)
    STORAGE_BACKEND: str = Field(default="local", env="STORAGE_BACKEND")  # local, s3
    STORAGE_LOCAL_PATH: str = Field(default="./storage", env="STORAGE_LOCAL_PATH")
    AWS_S3_BUCKET: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    
    # Monitoring and logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        if not v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()


# Database URL for SQLAlchemy (convert asyncpg to psycopg2 if needed)
def get_sync_database_url() -> str:
    """Get synchronous database URL for SQLAlchemy"""
    url = settings.DATABASE_URL
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://")
    return url


def get_async_database_url() -> str:
    """Get asynchronous database URL for databases library"""
    url = settings.DATABASE_URL
    if not url.startswith("postgresql+asyncpg://"):
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://")
    return url