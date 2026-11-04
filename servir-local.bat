@echo off
setlocal
cd /d "%~dp0"
title Lumina - servidor local

rem Si quedo un servidor anterior de Python en el puerto 5173, lo cierro
rem para que siempre se ejecute esta version (sin cache).
powershell -NoProfile -Command "$c = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue; if ($c) { $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -match '^python') { Stop-Process -Id $p.Id -Force } }" >nul 2>&1

echo.
echo   LUMINA - SERVIDOR LOCAL
echo.
echo   Se abrira el panel en tu navegador:
echo   http://127.0.0.1:5173/admin.html
echo.
echo   Deja esta ventana abierta mientras usas el sitio.
echo   Para detenerlo: Ctrl + C
echo.

rem Abre el navegador cuando el servidor ya este escuchando.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:5173/admin.html'"

python servidor-local.py
echo.
echo El servidor se detuvo. Pulsa una tecla para cerrar.
pause >nul
