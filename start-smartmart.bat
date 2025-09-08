@echo off
title SmartMart - Complete Setup
color 0A

echo.
echo ========================================
echo    🚀 SmartMart Complete Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Check if MongoDB Atlas is configured
if not exist "backend\config.env" (
    echo ❌ Backend configuration not found!
    echo Please run the setup steps first.
    echo.
    pause
    exit /b 1
)

echo ✅ Backend configuration found
echo.

REM Check if frontend environment is configured
if not exist "project\.env" (
    echo ⚠️  Frontend environment not configured
    echo Copying env.config to .env...
    copy "project\env.config" "project\.env" >nul 2>&1
    echo ✅ Frontend environment configured
    echo.
)

echo.
echo ========================================
echo    📋 Starting SmartMart Services
echo ========================================
echo.

REM Start Backend
echo 🔧 Starting Backend (MongoDB + API)...
start "SmartMart Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 🎨 Starting Frontend (React + UI)...
start "SmartMart Frontend" cmd /k "cd project && npm run dev"

echo.
echo ========================================
echo    🎯 SmartMart is Starting Up!
echo ========================================
echo.
echo 📍 Backend:  http://localhost:5000
echo 🔐 API:      http://localhost:5000/api
echo 💚 Health:   http://localhost:5000/health
echo.
echo 🎨 Frontend: http://localhost:5173
echo.
echo ========================================
echo    📚 Next Steps:
echo ========================================
echo.
echo 1. Wait for both services to start
echo 2. Open Frontend: http://localhost:5173
echo 3. Create a new account
echo 4. Test login functionality
echo 5. Check MongoDB Atlas for data
echo.
echo ========================================
echo    🚨 Troubleshooting:
echo ========================================
echo.
echo • Backend issues? Check the backend terminal
echo • Frontend issues? Check the frontend terminal
echo • Database issues? Check MongoDB Atlas
echo • See SETUP_GUIDE.md for detailed help
echo.
echo ========================================
echo.

REM Keep the main window open
echo Press any key to close this window...
pause >nul
