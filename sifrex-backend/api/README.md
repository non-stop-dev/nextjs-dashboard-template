# Sifrex Authentication API

FastAPI-based authentication service for the Sifrex platform.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL with `sifrex_users` schema
- Virtual environment (recommended)

### Installation

1. **Create virtual environment:**
```bash
cd /sifrex-backend/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials and secret key
```

4. **Run the server:**
```bash
python run.py
```

The API will be available at:
- **Server**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
api/
├── main.py                 # FastAPI app entry point
├── run.py                  # Development server runner
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── auth/
│   ├── __init__.py
│   ├── router.py          # Auth endpoints (placeholder)
│   └── models.py          # Pydantic models (placeholder)
├── users/
│   ├── __init__.py
│   └── router.py          # User endpoints (placeholder)
├── database/
│   ├── __init__.py
│   ├── connection.py      # Database connection
│   └── models.py          # SQLAlchemy models (placeholder)
└── core/
    ├── __init__.py
    ├── config.py          # Application settings
    └── security.py        # Security utilities
```

## 🔧 Configuration

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sifrex_db"
DATABASE_SCHEMA="sifrex_users"

# Security
SECRET_KEY="your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (for NextJS integration)
ALLOWED_ORIGINS="http://localhost:3000"
```

## 🛠️ Development Status

This is the foundation implementation for **SWA-4**. Next tasks:

- **SWA-5**: Implement SQLAlchemy models for sifrex_users schema
- **SWA-6**: Implement core authentication endpoints  
- **SWA-7**: Add password reset and email verification
- **SWA-8**: User management endpoints
- **SWA-9**: Role-based access control
- **SWA-10**: NextJS integration
- **SWA-11**: Testing and production deployment

## 🧪 Testing

Health check endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 📚 API Documentation

When running in debug mode, interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔒 Security Features

- Security headers middleware
- CORS configuration for NextJS
- Request ID tracking
- Input validation with Pydantic
- Environment-based configuration
- Database connection pooling

## 🚧 Implementation Notes

- Database models are placeholders (implemented in SWA-5)
- Auth endpoints are placeholders (implemented in SWA-6+)
- Email functionality will be added in later tasks
- Rate limiting will be implemented in SWA-6
- JWT token management in SWA-6

## 🐛 Troubleshooting

**Database connection failed:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure sifrex_users schema exists

**Import errors:**
- Activate virtual environment
- Install requirements: `pip install -r requirements.txt`

**CORS errors:**
- Check ALLOWED_ORIGINS in .env matches your NextJS URL