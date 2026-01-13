@echo off
title Elite Resume Parser Launcher
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

echo Installing dependencies (only first time)...
if not exist "node_modules" (
    call npm install
)

echo Launching Application...
start http://localhost:3000
npm start
pause