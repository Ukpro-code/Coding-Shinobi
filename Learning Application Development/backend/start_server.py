"""
Simple script to start the FastAPI server
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting Personal Learning System API server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )