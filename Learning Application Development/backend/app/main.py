from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from app.core.config import settings
from app.core.database import engine, Base
from app.api import content, auth, query

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Learning System API",
    description="AI-powered personal learning companion that transforms scattered learning into connected knowledge",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003", "http://127.0.0.1:3004", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(query.router, prefix="/api/query", tags=["query"])

@app.get("/")
async def root():
    return {
        "message": "Personal Learning System API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.environment == "development" else False
    )
