@echo off
REM ============================================================
REM SGMOT - Instalacion rapida del frontend (Windows)
REM ============================================================
echo.
echo === SGMOT - Instalando dependencias del frontend ===
echo.

cd /d "%~dp0frontend" || (echo No se encontro la carpeta frontend & pause & exit /b 1)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm no esta instalado. Descarga Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo Ejecutando: npm install
echo (esto puede tardar 2-5 minutos la primera vez)
echo.
call npm install

if errorlevel 1 (
    echo.
    echo ERROR durante npm install. Revisa los mensajes anteriores.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Listo. Ahora ejecuta: npm run dev
echo  Y abre: http://localhost:5173
echo ============================================================
echo.
pause
