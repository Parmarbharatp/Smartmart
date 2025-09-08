@echo off
echo 🚀 Starting SmartMart Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if MongoDB is running (optional check)
echo 📊 Checking MongoDB connection...
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully!
    echo.
)

REM Start the server
echo 🎯 Starting server...
echo 📍 Backend will be available at: http://localhost:5000
echo 🔐 Auth API: http://localhost:5000/api/auth
echo 💚 Health Check: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
