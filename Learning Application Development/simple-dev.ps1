# Simple Development Server Manager
param([string]$Action = "start")

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $BaseDir "backend"
$PythonExe = "D:\Ukesh\Coding Shinobi\.conda\python.exe"

function Write-Status {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

switch ($Action) {
    "start" {
        Write-Status "`n========================================" -Color "Cyan"
        Write-Status "  Personal Learning System - Dev Setup" -Color "Cyan"
        Write-Status "========================================`n" -Color "Cyan"
        
        Write-Status "[1/2] Starting Backend Server..." -Color "Yellow"
        $env:PYTHONPATH = $BackendDir
        
        # Start backend in new window
        $BackendCmd = "cd '$BackendDir'; & '$PythonExe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd -WindowStyle Normal
        
        Write-Status "✓ Backend server starting..." -Color "Green"
        Write-Status "  API: http://localhost:8000" -Color "Gray"
        
        Start-Sleep -Seconds 3
        
        Write-Status "`n[2/2] Starting Frontend Server..." -Color "Yellow"
        
        # Start frontend in new window  
        $FrontendCmd = "cd '$BaseDir'; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd -WindowStyle Normal
        
        Write-Status "✓ Frontend server starting..." -Color "Green"
        Write-Status "  App: http://localhost:3000" -Color "Gray"
        
        Write-Status "`n🚀 Development environment is starting!" -Color "Green"
        Write-Status "   Backend API: http://localhost:8000" -Color "Gray"
        Write-Status "   API Documentation: http://localhost:8000/docs" -Color "Gray"
        Write-Status "   Frontend App: http://localhost:3000 (check terminal for actual port)" -Color "Gray"
        Write-Status "`nBoth servers are starting in separate windows." -Color "Yellow"
        Write-Status "Close the terminal windows to stop the servers.`n" -Color "Yellow"
        
        # Wait and open browser
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3000"
    }
    
    default {
        Write-Status "Usage: .\simple-dev.ps1 [start]" -Color "Yellow"
        Write-Status "This script starts both backend and frontend servers in separate windows." -Color "Gray"
    }
}