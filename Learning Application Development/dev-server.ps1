# Personal Learning System - Development Server Manager
# PowerShell script to manage both backend and frontend servers

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "start"
)

# Configuration
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $BaseDir "backend"
$FrontendDir = $BaseDir
$PythonExe = "D:\Ukesh\Coding Shinobi\.conda\python.exe"
$ProcessFile = Join-Path $BaseDir ".dev-processes.json"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red" 
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColoredOutput {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Header {
    param($Title)
    Write-Host ""
    Write-ColoredOutput "=" * 60 -Color "Header"
    Write-ColoredOutput "  $Title" -Color "Header"
    Write-ColoredOutput "=" * 60 -Color "Header"
    Write-Host ""
}

function Start-BackendServer {
    Write-ColoredOutput "[1/2] Starting Backend Server..." -Color "Info"
    
    $env:PYTHONPATH = $BackendDir
    $BackendArgs = @(
        "-m", "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000", 
        "--reload"
    )
    
    try {
        $BackendProcess = Start-Process -FilePath $PythonExe -ArgumentList $BackendArgs -WorkingDirectory $BackendDir -PassThru -WindowStyle Normal
        Write-ColoredOutput "✓ Backend server started (PID: $($BackendProcess.Id))" -Color "Success"
        Write-ColoredOutput "  API: http://localhost:8000" -Color "Info"
        Write-ColoredOutput "  Docs: http://localhost:8000/docs" -Color "Info"
        return $BackendProcess.Id
    }
    catch {
        Write-ColoredOutput "✗ Failed to start backend server: $($_.Exception.Message)" -Color "Error"
        return $null
    }
}

function Start-FrontendServer {
    Write-ColoredOutput "[2/2] Starting Frontend Server..." -Color "Info"
    
    try {
        $FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir -PassThru -WindowStyle Normal
        Write-ColoredOutput "✓ Frontend server started (PID: $($FrontendProcess.Id))" -Color "Success"
        Write-ColoredOutput "  App will be available at: http://localhost:3000 (or next available port)" -Color "Info"
        return $FrontendProcess.Id
    }
    catch {
        Write-ColoredOutput "✗ Failed to start frontend server: $($_.Exception.Message)" -Color "Error"
        return $null
    }
}

function Save-ProcessInfo {
    param($BackendPid, $FrontendPid)
    
    $ProcessInfo = @{
        backend = $BackendPid
        frontend = $FrontendPid
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $ProcessInfo | ConvertTo-Json | Set-Content $ProcessFile
}

function Load-ProcessInfo {
    if (Test-Path $ProcessFile) {
        return Get-Content $ProcessFile | ConvertFrom-Json
    }
    return $null
}

function Stop-DevServers {
    Write-ColoredOutput "Stopping development servers..." -Color "Warning"
    
    $ProcessInfo = Load-ProcessInfo
    if (-not $ProcessInfo) {
        Write-ColoredOutput "No saved process information found" -Color "Warning"
        return
    }
    
    # Stop backend
    if ($ProcessInfo.backend) {
        try {
            Stop-Process -Id $ProcessInfo.backend -Force -ErrorAction SilentlyContinue
            Write-ColoredOutput "✓ Backend server stopped (PID: $($ProcessInfo.backend))" -Color "Success"
        }
        catch {
            Write-ColoredOutput "✗ Could not stop backend process $($ProcessInfo.backend)" -Color "Warning"
        }
    }
    
    # Stop frontend  
    if ($ProcessInfo.frontend) {
        try {
            Stop-Process -Id $ProcessInfo.frontend -Force -ErrorAction SilentlyContinue
            Write-ColoredOutput "✓ Frontend server stopped (PID: $($ProcessInfo.frontend))" -Color "Success"
        }
        catch {
            Write-ColoredOutput "✗ Could not stop frontend process $($ProcessInfo.frontend)" -Color "Warning"
        }
    }
    
    # Clean up process file
    if (Test-Path $ProcessFile) {
        Remove-Item $ProcessFile
    }
}

function Show-Status {
    $ProcessInfo = Load-ProcessInfo
    if (-not $ProcessInfo) {
        Write-ColoredOutput "No development servers are currently tracked" -Color "Warning"
        return
    }
    
    Write-ColoredOutput "Development Server Status:" -Color "Info"
    Write-ColoredOutput "Started: $($ProcessInfo.timestamp)" -Color "Info"
    
    # Check backend
    try {
        $BackendRunning = Get-Process -Id $ProcessInfo.backend -ErrorAction SilentlyContinue
        if ($BackendRunning) {
            Write-ColoredOutput "✓ Backend: Running (PID: $($ProcessInfo.backend))" -Color "Success"
        } else {
            Write-ColoredOutput "✗ Backend: Not running" -Color "Error"
        }
    }
    catch {
        Write-ColoredOutput "✗ Backend: Not running" -Color "Error"
    }
    
    # Check frontend
    try {
        $FrontendRunning = Get-Process -Id $ProcessInfo.frontend -ErrorAction SilentlyContinue
        if ($FrontendRunning) {
            Write-ColoredOutput "✓ Frontend: Running (PID: $($ProcessInfo.frontend))" -Color "Success"
        } else {
            Write-ColoredOutput "✗ Frontend: Not running" -Color "Error"
        }
    }
    catch {
        Write-ColoredOutput "✗ Frontend: Not running" -Color "Error"
    }
}

# Main execution
switch ($Action) {
    "start" {
        Write-Header "Personal Learning System - Development Setup"
        
        # Check if already running
        $ExistingInfo = Load-ProcessInfo
        if ($ExistingInfo) {
            Write-ColoredOutput "Development servers may already be running. Use 'stop' first or 'restart'" -Color "Warning"
            Show-Status
            return
        }
        
        $BackendPid = Start-BackendServer
        if (-not $BackendPid) {
            Write-ColoredOutput "Failed to start backend. Aborting." -Color "Error"
            return
        }
        
        Start-Sleep -Seconds 3  # Wait for backend to initialize
        
        $FrontendPid = Start-FrontendServer
        if (-not $FrontendPid) {
            Write-ColoredOutput "Failed to start frontend. Stopping backend." -Color "Error"
            Stop-Process -Id $BackendPid -Force
            return
        }
        
        Save-ProcessInfo -BackendPid $BackendPid -FrontendPid $FrontendPid
        
        Write-Host ""
        Write-ColoredOutput "🚀 Development environment is ready!" -Color "Success"
        Write-ColoredOutput "   Backend API: http://localhost:8000" -Color "Info"
        Write-ColoredOutput "   API Documentation: http://localhost:8000/docs" -Color "Info" 
        Write-ColoredOutput "   Frontend App: http://localhost:3000 (check terminal for actual port)" -Color "Info"
        Write-Host ""
        Write-ColoredOutput "Use './dev-server.ps1 stop' to stop all servers" -Color "Warning"
        Write-Host ""
        
        # Wait and open browser
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:3000"
    }
    
    "stop" {
        Write-Header "Stopping Development Servers"
        Stop-DevServers
    }
    
    "restart" {
        Write-Header "Restarting Development Servers"
        Stop-DevServers
        Start-Sleep -Seconds 2
        & $MyInvocation.MyCommand.Path "start"
    }
    
    "status" {
        Write-Header "Development Server Status"
        Show-Status
    }
}