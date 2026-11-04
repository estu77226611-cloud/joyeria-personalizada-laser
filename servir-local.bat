@echo off
setlocal
cd /d "%~dp0"
title Lumina - servidor local
echo.
echo   LUMINA - SERVIDOR LOCAL
echo.
echo   Abre en tu navegador:  http://127.0.0.1:5173/
echo.
echo   Deja esta ventana abierta mientras usas el sitio.
echo   Para detenerlo: Ctrl + C
echo.
python servidor-local.py
if errorlevel 1 (
  echo.
  echo No se pudo iniciar con servidor-local.py. Probando con python -m http.server...
  python -m http.server 5173 --bind 127.0.0.1
)
echo.
echo El servidor se detuvo. Pulsa una tecla para cerrar.
pause >nul
