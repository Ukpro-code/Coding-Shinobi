# Quick Start Guide - Personal Learning System

## 🚀 Getting Started

This guide will help you set up and start building your Personal Learning System. Follow these steps to get your development environment running.

## Prerequisites Check

Before starting, ensure you have:
- [ ] Python 3.11 or higher
- [ ] Node.js 18 or higher  
- [ ] Git
- [ ] VS Code (recommended)
- [ ] Docker Desktop (for databases)

### Installation Commands
```powershell
# Check versions
python --version
node --version
git --version
docker --version

# If missing, install via winget (Windows)
winget install Python.Python.3.11
winget install OpenJS.NodeJS
winget install Git.Git
winget install Docker.DockerDesktop
```

## Step 1: Project Setup (Day 1)

### Create Project Structure
```powershell
# Create main project directory
mkdir personal-learning-system
cd personal-learning-system

# Initialize git repository
git init
echo "node_modules/" > .gitignore
echo "__pycache__/" >> .gitignore
echo ".env" >> .gitignore
echo "*.pyc" >> .gitignore
echo ".vscode/settings.json" >> .gitignore

# Create main directories
mkdir backend frontend docs
```

### Backend Setup
```powershell
cd backend

# Create Python virtual environment
python -m venv venv
.\venv\Scripts\activate

# Create requirements.txt
@"
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
sqlalchemy==2.0.23
psycopg2-binary==2.9.7
alembic==1.12.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
celery==5.3.4
redis==5.0.1
openai==1.3.5
requests==2.31.0
beautifulsoup4==4.12.2
pypdf2==3.0.1
pdfplumber==0.10.3
numpy==1.24.3
scikit-learn==1.3.2
"@ | Out-File -FilePath requirements.txt

# Install dependencies
pip install -r requirements.txt

# Create basic app structure
mkdir app
mkdir app\api app\core app\models app\services app\workers
New-Item app\__init__.py
New-Item app\main.py
```

### Frontend Setup
```powershell
cd ..\frontend

# Create React app with TypeScript
npx create-react-app . --template typescript
# Alternative: npm create vite@latest . -- --template react-ts

# Install additional dependencies
npm install axios zustand @types/d3 d3 react-router-dom
npm install -D tailwindcss postcss autoprefixer @types/node
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install framer-motion react-dropzone

# Initialize Tailwind CSS
npx tailwindcss init -p
```

## Step 2: Environment Configuration

### Backend Environment (.env)
```powershell
cd ..\backend
@"
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/learning_system
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Development
DEBUG=True
ENVIRONMENT=development
"@ | Out-File -FilePath .env
```

### Docker Compose Setup
```powershell
cd ..
@"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: learning_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - learning_network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - learning_network

  # Optional: Neo4j for knowledge graph
  neo4j:
    image: neo4j:5.14-community
    environment:
      NEO4J_AUTH: neo4j/password
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data
    networks:
      - learning_network

volumes:
  postgres_data:
  neo4j_data:

networks:
  learning_network:
    driver: bridge
"@ | Out-File -FilePath docker-compose.yml
```

## Step 3: Basic Backend Implementation

### Main FastAPI App
```powershell
cd backend
@"
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from app.core.config import settings
from app.api import content, auth

app = FastAPI(
    title="Personal Learning System API",
    description="AI-powered personal learning companion",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(content.router, prefix="/api/content", tags=["content"])

@app.get("/")
async def root():
    return {"message": "Personal Learning System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
"@ | Out-File -FilePath app\main.py
```

### Configuration Module
```powershell
mkdir app\core
@"
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/learning_system"
    redis_url: str = "redis://localhost:6379"
    
    # API Keys
    openai_api_key: Optional[str] = None
    
    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Environment
    debug: bool = True
    environment: str = "development"
    
    class Config:
        env_file = ".env"

settings = Settings()
"@ | Out-File -FilePath app\core\config.py
```

### Database Models
```powershell
@"
from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class Content(Base):
    __tablename__ = "contents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    content_type = Column(String(50), nullable=False)  # youtube, pdf, article
    source_url = Column(Text)
    file_path = Column(Text)
    original_text = Column(Text)
    processed_text = Column(Text)
    summary_brief = Column(Text)
    summary_detailed = Column(Text)
    metadata = Column(JSON)
    processing_status = Column(String(50), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    confidence_score = Column(Float)
    frequency = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
"@ | Out-File -FilePath app\models\content.py
```

## Step 4: Basic Frontend Implementation

### App Component
```powershell
cd ..\frontend\src
@"
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ThinkingSpace from './pages/ThinkingSpace';
import ContentManager from './pages/ContentManager';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ThinkingSpace />} />
          <Route path="/content" element={<ContentManager />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
"@ | Out-File -FilePath App.tsx
```

### Basic Layout Component
```powershell
mkdir components
@"
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Personal Learning System
            </h1>
            <nav className="space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900">
                Thinking Space
              </a>
              <a href="/content" className="text-gray-600 hover:text-gray-900">
                Content
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
"@ | Out-File -FilePath components\Layout.tsx
```

## Step 5: Run the Development Environment

### Start Databases
```powershell
# From project root
docker-compose up -d

# Verify databases are running
docker ps
```

### Start Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (New Terminal)
```powershell
cd frontend
npm start
```

## Step 6: Verify Setup

### Test Backend API
Open browser and navigate to:
- http://localhost:8000 - API root
- http://localhost:8000/docs - FastAPI interactive docs
- http://localhost:8000/health - Health check

### Test Frontend
Open browser and navigate to:
- http://localhost:3000 - React application

### Test Database Connections
```powershell
# Test PostgreSQL
docker exec -it personal-learning-system-postgres-1 psql -U postgres -d learning_system

# Test Redis
docker exec -it personal-learning-system-redis-1 redis-cli ping
```

## Development Workflow

### Daily Development Process
1. **Start Development Environment**
   ```powershell
   # Terminal 1: Start databases
   docker-compose up -d
   
   # Terminal 2: Start backend
   cd backend
   .\venv\Scripts\activate
   uvicorn app.main:app --reload
   
   # Terminal 3: Start frontend
   cd frontend
   npm start
   ```

2. **Make Changes**
   - Backend changes auto-reload with uvicorn
   - Frontend changes auto-reload with React dev server
   - Database schema changes require Alembic migrations

3. **Testing**
   ```powershell
   # Backend tests
   cd backend
   pytest
   
   # Frontend tests
   cd frontend
   npm test
   ```

### Git Workflow
```powershell
# Daily commits
git add .
git commit -m "feat: implement YouTube content processing"
git push origin main

# Feature branches for larger changes
git checkout -b feature/thinking-space-visualization
# ... make changes ...
git add .
git commit -m "feat: add D3.js bubble visualization"
git push origin feature/thinking-space-visualization
```

## Next Steps

### Week 1 Priorities
1. ✅ Set up development environment
2. ⏭️ Implement YouTube transcript extraction
3. ⏭️ Create basic content storage
4. ⏭️ Build simple content upload UI

### Week 2 Goals
- PDF processing pipeline
- OpenAI integration for summarization
- Basic concept extraction
- Content listing interface

### Useful Commands

```powershell
# Backend development
pip freeze > requirements.txt  # Update dependencies
alembic revision --autogenerate -m "message"  # Create migration
alembic upgrade head  # Apply migrations

# Frontend development
npm audit fix  # Fix security vulnerabilities
npm run build  # Production build
npm run test -- --coverage  # Test with coverage

# Docker management
docker-compose logs postgres  # View database logs
docker-compose down  # Stop all services
docker-compose up -d --build  # Rebuild and restart
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```powershell
   # Check what's using port 8000
   netstat -ano | findstr :8000
   # Kill process if needed
   taskkill /PID <process_id> /F
   ```

2. **Database connection issues**
   ```powershell
   # Reset database
   docker-compose down
   docker volume rm personal-learning-system_postgres_data
   docker-compose up -d
   ```

3. **Python dependency issues**
   ```powershell
   # Recreate virtual environment
   rm -rf venv
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [D3.js Documentation](https://d3js.org/)

You're now ready to start building your Personal Learning System! Begin with the YouTube content processing pipeline and gradually add more features following the development plan.
