@echo off
echo ========================================
echo   Personal Learning System - Dev Setup
echo ========================================
echo.

:: Set the base directory
set "BASE_DIR=%~dp0"
set "BACKEND_DIR=%BASE_DIR%backend"

:: Set Python environment
set "PYTHON_EXE=D:\Ukesh\Coding Shinobi\.conda\python.exe"

echo [1/2] Starting Backend Server...
echo Backend will start in a new window...

:: Start backend in a new window
start "Backend API Server" cmd /k "cd /d "%BACKEND_DIR%" && set PYTHONPATH=%BACKEND_DIR% && "%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/2] Starting Frontend Server...
echo Frontend will start in a new window...

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
start "Frontend Dev Server" cmd /k "cd /d "%BASE_DIR%" && npm run dev"

echo.
echo ========================================
echo   Development Servers Starting...
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000 (or next available port)
echo.
echo Both servers are starting in separate windows.
echo Close the command windows to stop the servers.
echo.

:: Wait and open browser
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo Press any key to close this window...
pause >nul