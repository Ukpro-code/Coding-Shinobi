# Personal Learning System - Backend

## Setup Instructions

### 1. Install Python
Make sure you have Python 3.11+ installed. Download from:
- https://www.python.org/downloads/
- Or use: `winget install Python.Python.3.11`

### 2. Set up Virtual Environment
```powershell
cd "d:\Ukesh\Coding Shinobi\Coding-Shinobi\Learning Application Development\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Setup
```powershell
# Copy example env file
copy .env.example .env

# Edit .env file with your settings (optional for now)
notepad .env
```

### 4. Initialize Database
```powershell
# Create SQLite database and tables
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 5. Run the API Server
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\activate

# Start the server
python -m uvicorn app.main:app --reload --port 8000
```

### 6. Test the API
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Root Endpoint: http://localhost:8000/

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings and configuration
│   │   └── database.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   └── database.py      # SQLAlchemy models
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── content.py       # Content management endpoints
│   │   └── query.py         # Search and query endpoints
│   └── services/
│       └── __init__.py
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Database Models
- **User**: User accounts with authentication
- **Content**: PDFs, YouTube videos, articles
- **Concept**: Extracted concepts from content
- **ConceptRelationship**: Connections between concepts
- **UserInteraction**: User behavior tracking
- **ProcessingJob**: Background job tracking

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `POST /api/content/pdf` - Upload PDF
- `POST /api/content/youtube` - Add YouTube content
- `GET /api/content/` - List user content
- `POST /api/query/search` - Search content
- `GET /api/query/concepts` - Get user concepts
- `GET /api/query/graph/data` - Get knowledge graph data

## Next Steps
1. Install Python and dependencies
2. Run the server and test endpoints
3. Connect frontend to backend APIs
4. Implement AI processing features
