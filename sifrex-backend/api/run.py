#!/usr/bin/env python3
"""
Development server runner for Sifrex Authentication API
"""

import uvicorn
import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from core.config import settings
from database.connection import test_database_connection


async def startup_checks():
    """Perform startup checks before starting the server"""
    print("🚀 Starting Sifrex Authentication API...")
    print(f"📊 Debug mode: {settings.DEBUG}")
    print(f"🗄️  Database schema: {settings.DATABASE_SCHEMA}")
    
    # Test database connection
    print("🔍 Testing database connection...")
    db_ok = await test_database_connection()
    
    if not db_ok:
        print("❌ Database connection failed!")
        print("   Make sure PostgreSQL is running and DATABASE_URL is correct")
        return False
    
    print("✅ Database connection successful!")
    return True


def main():
    """Main entry point"""
    print("=" * 50)
    print("   SIFREX AUTHENTICATION API")
    print("=" * 50)
    
    # Run startup checks
    startup_ok = asyncio.run(startup_checks())
    
    if not startup_ok:
        print("❌ Startup checks failed. Exiting...")
        sys.exit(1)
    
    print("🌟 All checks passed! Starting server...")
    print(f"📍 Server will be available at: http://localhost:8000")
    print(f"📚 API docs will be available at: http://localhost:8000/docs")
    print("-" * 50)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG
    )


if __name__ == "__main__":
    main()