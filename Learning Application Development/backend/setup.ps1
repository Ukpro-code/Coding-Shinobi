# Quick Setup Script for Personal Learning System Backend
# Run this in PowerShell: .\setup.ps1

Write-Host "🚀 Setting up Personal Learning System Backend..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+ first:" -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "   Or run: winget install Python.Python.3.11" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location "d:\Ukesh\Coding Shinobi\Coding-Shinobi\Learning Application Development\backend"

# Create virtual environment
Write-Host "📦 Creating virtual environment..." -ForegroundColor Blue
python -m venv venv

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
pip install -r requirements.txt

# Copy environment file
Write-Host "⚙️ Setting up environment variables..." -ForegroundColor Blue
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
}

# Create database
Write-Host "🗄️ Creating database..." -ForegroundColor Blue
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database created successfully!')"

Write-Host ""
Write-Host "🎉 Setup complete! Now you can:" -ForegroundColor Green
Write-Host "   1. Activate virtual environment: .\venv\Scripts\activate" -ForegroundColor Yellow
Write-Host "   2. Start the server: python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
Write-Host "   3. Visit: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""