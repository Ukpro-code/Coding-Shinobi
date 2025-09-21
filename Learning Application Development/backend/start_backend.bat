@echo off
cd "D:\Ukesh\Coding Shinobi\Coding-Shinobi\Learning Application Development\backend"
set PYTHONPATH=D:\Ukesh\Coding Shinobi\Coding-Shinobi\Learning Application Development\backend
"D:\Ukesh\Coding Shinobi\.conda\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause