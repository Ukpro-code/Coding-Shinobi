# Personal Learning System - Quick Start Guide

## 🚀 One-Command Development Setup

### ⭐ Recommended: Simple Batch File
```bash
# Double-click or run from terminal - Opens both servers in separate windows
.\start-dev.bat
```

### Alternative: Manual Commands (If batch file doesn't work)

**Option 1: Two Separate Terminals**
```bash
# Terminal 1 - Backend
cd backend
set PYTHONPATH=D:\Ukesh\Coding Shinobi\Coding-Shinobi\Learning Application Development\backend
"D:\Ukesh\Coding Shinobi\.conda\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend  
npm run dev
```

**Option 2: Using NPM Scripts**
```bash
# Start frontend only
npm run dev

# Start backend only (from root directory)
npm run start:backend
```

## 📱 Access Your Application

After running the start command:

- **Frontend Application**: http://localhost:3000 (or next available port shown in terminal)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 What the Script Does

1. **Opens Backend Terminal**: Starts FastAPI server with authentication and database
2. **Opens Frontend Terminal**: Starts React/Vite development server  
3. **Auto-Opens Browser**: Launches the application after 5 seconds
4. **Easy Management**: Close terminal windows to stop servers

## 📋 Features Ready to Test

✅ **User Registration & Authentication**
- Create new accounts with email/password
- Login with existing credentials  
- JWT token management and session handling

✅ **API Documentation**
- Interactive Swagger UI at http://localhost:8000/docs
- Test all endpoints directly in browser

✅ **Database Management**
- SQLite database with user management
- Automatic table creation on startup

## 🔄 Development Workflow

1. **Start Development**: Run `.\start-dev.bat`
2. **Code Changes**: 
   - Frontend: Auto-reloads on file changes
   - Backend: Auto-reloads on Python file changes
3. **Test Features**: Use the web interface and API docs
4. **Stop Development**: Close the two terminal windows

## 🐛 Troubleshooting

**Batch File Won't Run**: 
- Right-click → "Run as administrator"
- Or manually run the two commands in separate terminals

**Port Already in Use**: 
- Scripts automatically find available ports
- Check terminal output for actual port numbers

**Python Path Issues**: 
- Verify Python installation at: `D:\Ukesh\Coding Shinobi\.conda\python.exe`
- Update path in `start-dev.bat` if different

**Module Not Found Errors**:
- Ensure you're in the correct directory
- Check that all dependencies are installed

## 🎯 Next Development Phase

The core infrastructure is complete! Ready for:
1. **PDF Upload & AI Processing** - Extract concepts from documents
2. **YouTube Content Integration** - Process video transcripts  
3. **Knowledge Graph Visualization** - Interactive concept mapping
4. **Advanced Search** - Semantic search across all content

---

**Happy coding! 🎉**

*The development environment is now streamlined for maximum productivity!*