@echo off
cd /d "%~dp0"
title PAINEL DE MONITORAMENTO AO VIVO - ARINOS / MG

echo ================================================================
echo   PAINEL DE TRANSPARENCIA PUBLICA - ARINOS / MG
echo ================================================================
echo Iniciando servidor ultraleve na porta 8088...
echo.

node scripts\atualizar_dashboard.js
start http://localhost:8088/index.html
node scripts\servidor_painel.js

pause
