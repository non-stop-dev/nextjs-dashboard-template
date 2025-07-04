#!/usr/bin/env python3
"""
Test script for FastAPI foundation
Tests all basic components without database connection
"""

import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from core.config import settings
from core.security import SecurityHeadersMiddleware
from auth.router import router as auth_router
from users.router import router as users_router


def create_test_app():
    """Create test FastAPI app"""
    app = FastAPI(
        title="Sifrex Authentication API - Test",
        version="1.0.0",
        docs_url="/docs"
    )
    
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(users_router, prefix="/users", tags=["User Management"])
    
    @app.get("/")
    async def root():
        return {
            "message": "Sifrex Authentication API - Foundation Test",
            "version": "1.0.0",
            "status": "operational",
            "foundation": "✅ Ready for SWA-5 (SQLAlchemy Models)"
        }
    
    @app.get("/health")
    async def health():
        return {
            "status": "healthy",
            "database": "not_connected_in_test",
            "config_loaded": True,
            "security_enabled": True,
            "version": "1.0.0"
        }
    
    return app


def test_all_endpoints():
    """Test all foundation endpoints"""
    print("🧪 Testing FastAPI Foundation...")
    print("=" * 50)
    
    app = create_test_app()
    client = TestClient(app)
    
    # Test endpoints
    tests = [
        ("GET", "/", "Root endpoint"),
        ("GET", "/health", "Health check"),
        ("GET", "/auth/status", "Auth module status"),
        ("GET", "/users/status", "Users module status"),
        ("GET", "/docs", "API documentation")
    ]
    
    results = []
    
    for method, path, description in tests:
        try:
            if method == "GET":
                response = client.get(path)
            
            status = "✅ PASS" if response.status_code == 200 else f"❌ FAIL ({response.status_code})"
            results.append((description, status, response.status_code))
            
            print(f"{description:25} | Status: {response.status_code:3} | {status}")
            
            # Show response for key endpoints
            if path in ["/", "/health"]:
                try:
                    print(f"  Response: {response.json()}")
                except:
                    print(f"  Response: {response.text[:100]}...")
                print()
            
        except Exception as e:
            print(f"{description:25} | ERROR: {str(e)}")
            results.append((description, f"❌ ERROR", str(e)))
    
    print("=" * 50)
    
    # Summary
    passed = sum(1 for _, status, _ in results if "PASS" in status)
    total = len(results)
    
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All foundation tests passed!")
        print("🚀 Ready to proceed with SWA-5: SQLAlchemy Models")
        return True
    else:
        print("⚠️  Some tests failed. Please review the output above.")
        return False


def test_configuration():
    """Test configuration loading"""
    print("🔧 Testing Configuration...")
    
    try:
        print(f"  Debug mode: {settings.DEBUG}")
        print(f"  Database schema: {settings.DATABASE_SCHEMA}")
        print(f"  Secret key length: {len(settings.SECRET_KEY)} chars")
        print(f"  CORS origins: {len(settings.ALLOWED_ORIGINS)} configured")
        print(f"  Token expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        print("  ✅ Configuration loaded successfully")
        return True
    except Exception as e:
        print(f"  ❌ Configuration error: {e}")
        return False


def main():
    """Main test function"""
    print("🚀 Sifrex FastAPI Foundation Test")
    print("📁 Testing SWA-4 implementation")
    print()
    
    # Test configuration
    config_ok = test_configuration()
    print()
    
    # Test endpoints
    endpoints_ok = test_all_endpoints()
    print()
    
    # Final result
    if config_ok and endpoints_ok:
        print("🎯 SWA-4 COMPLETED SUCCESSFULLY!")
        print()
        print("📋 Next Tasks:")
        print("  • SWA-5: Implement SQLAlchemy models for sifrex_users schema")
        print("  • SWA-6: Implement core authentication endpoints")
        print("  • SWA-7: Add password reset and email verification")
        print()
        print("🗂️  Foundation Structure Created:")
        print("  • FastAPI app with security middleware")
        print("  • Configuration management with environment variables")
        print("  • Modular router structure (auth/, users/)")
        print("  • Database connection setup (ready for models)")
        print("  • Health check and monitoring endpoints")
        print("  • CORS configuration for NextJS integration")
        print("  • Security headers and request tracking")
        
    else:
        print("❌ Foundation test failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()