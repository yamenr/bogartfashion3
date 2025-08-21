@echo off
rem ==== CONFIGURATION ====
rem Change these paths to match your environment
set "BACKEND_DIR=C:\Dev\bogartfashion3\backend"
set "FRONTEND_DIR=C:\Dev\bogartfashion3\frontend"
set "XAMPP_DIR=C:\xampp"
rem =======================

echo =====================================================
echo Starting Bogart Fashion Website Servers
echo =====================================================
echo.

echo Starting Apache (XAMPP) …
start "Apache"  cmd /k "cd /d %XAMPP_DIR% && call apache_start.bat"

echo Starting MySQL (XAMPP) …
start "MySQL"   cmd /k "cd /d %XAMPP_DIR% && call mysql_start.bat"

echo.
echo Starting Backend Server (Port 3001) …
start "Backend" cmd /k "cd /d %BACKEND_DIR% && echo Starting backend server... && node server.js"

echo Starting Frontend Server (Port 3000) …
start "Frontend" cmd /k "cd /d %FRONTEND_DIR% && echo Starting frontend server... && npm start"

echo.
echo =====================================================
echo All services launched. Each has their own window for logs.
echo.
echo Expected URLs:
echo - Backend API: http://localhost:3001
echo - Frontend Website: http://localhost:3000
echo.
echo You can close this launcher window now if you like.
echo =====================================================
pause
