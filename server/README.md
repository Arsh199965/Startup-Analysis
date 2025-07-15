# Our Big Company - Backend Server

Clean, organized FastAPI backend for the startup submission portal.

## 🏗️ Project Structure

```
server/
├── app/                        # Main application package
│   ├── __init__.py
│   ├── api/                    # API route handlers
│   │   ├── __init__.py
│   │   └── startup_routes.py   # Startup submission endpoints
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   └── database.py         # Database configuration
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── startup.py          # Startup and file models
│   └── schemas/                # Pydantic schemas
│       ├── __init__.py
│       └── startup.py          # Request/response schemas
├── scripts/                    # Utility scripts
│   └── init_db.py             # Database initialization
├── storage/                    # Data storage
│   ├── uploads/               # File uploads
│   ├── submissions/           # Submission metadata
│   └── our_big_company.db     # SQLite database
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize database:**
   ```bash
   python scripts/init_db.py
   ```

3. **Start server:**
   ```bash
   uvicorn main:app --reload
   ```

## 📚 API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔧 Configuration

Database configuration is in `app/core/database.py`. Currently uses SQLite for development.

For PostgreSQL production:
```python
database_url = "postgresql://user:password@localhost/dbname"
```

## 📁 Key Components

### API Routes (`app/api/`)
- Handles HTTP requests
- Input validation
- Response formatting

### Models (`app/models/`)
- SQLAlchemy database models
- Defines database schema
- Relationships between tables

### Schemas (`app/schemas/`)
- Pydantic models for validation
- Request/response serialization
- Type safety

### Core (`app/core/`)
- Database configuration
- Settings management
- Shared utilities

This structure follows FastAPI best practices and makes the codebase maintainable and scalable.
