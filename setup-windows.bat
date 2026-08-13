@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo M Generation II POS - Windows setup
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)
node --version
npm --version
echo.
echo Installing project dependencies...
npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Building Windows installer...
npm run dist:win
if errorlevel 1 (
  echo.
  echo Windows build failed.
  pause
  exit /b 1
)
echo.
echo Build complete. Check the release folder.
pause
