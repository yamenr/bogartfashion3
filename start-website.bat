@echo off
echo =====================================================
echo Starting Bogart Fashion Website (Essential Services)
echo =====================================================
echo.

echo Checking MySQL status...
netstat -an | findstr ":3306" >nul
if %errorlevel% equ 0 (
    echo MySQL is already running on port 3306
) else (
    echo Starting MySQL...
    start "MySQL" cmd /k "cd /d C:\xampp && call mysql_start.bat"
)

echo.
echo Starting Backend Server (Port 3001)...
start "Backend" cmd /k "cd /d C:\Dev\yamen1\saedahmad\bogartfashion3\backend && echo Starting backend server... && node server.js"

echo Starting Frontend Server (Port 3000)...
start "Frontend" cmd /k "cd /d C:\Dev\yamen1\saedahmad\bogartfashion3\frontend && echo Starting frontend server... && npm start"

echo.
echo =====================================================
echo Essential services launched!
echo.
echo URLs:
echo - Backend API: http://localhost:3001
echo - Frontend Website: http://localhost:3000
echo - Database: MySQL on port 3306
echo.
echo You can close this launcher window now.
echo =====================================================
pause
