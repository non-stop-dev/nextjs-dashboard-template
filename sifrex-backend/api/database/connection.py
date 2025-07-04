"""
Database connection and configuration for Sifrex Authentication API
Uses both SQLAlchemy (for ORM) and databases (for async queries)
"""

import logging
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database

from core.config import settings, get_sync_database_url, get_async_database_url

logger = logging.getLogger(__name__)

# SQLAlchemy setup for ORM models
engine = create_engine(
    get_sync_database_url(),
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before use
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory for dependency injection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# Metadata with schema configuration
metadata = MetaData(schema=settings.DATABASE_SCHEMA)

# Async database connection for direct queries
database = Database(get_async_database_url())


async def get_database():
    """Dependency to get async database connection"""
    return database


def get_db_session():
    """Dependency to get SQLAlchemy session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def test_database_connection():
    """Test database connection and schema access"""
    try:
        # Test basic connection
        await database.connect()
        logger.info("Database connection established successfully")
        
        # Test schema access
        query = f"SELECT 1 FROM {settings.DATABASE_SCHEMA}.app_users LIMIT 1"
        try:
            await database.fetch_one(query)
            logger.info(f"Schema '{settings.DATABASE_SCHEMA}' access confirmed")
        except Exception as e:
            logger.warning(f"Schema access test failed (expected if no data): {e}")
        
        await database.disconnect()
        return True
        
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


# Connection health check function
async def check_database_health():
    """Check if database is healthy and responsive"""
    try:
        query = "SELECT 1 as health_check"
        result = await database.fetch_one(query)
        return result is not None
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Initialize database tables (for future migrations)
def create_tables():
    """Create all tables (used for development/testing)"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise


def drop_tables():
    """Drop all tables (used for testing cleanup)"""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Failed to drop tables: {e}")
        raise