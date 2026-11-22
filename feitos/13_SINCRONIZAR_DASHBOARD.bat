@echo off
cd /d "%~dp0"
title SINCRONIZAR METRICAS DO DASHBOARD E ABRIR NAVEGADOR

echo ================================================================
echo   SINCRONIZANDO RESUMO GERAL E ATUALIZANDO DASHBOARD
echo   Recalculando totais de Folha, Despesas e Diarias
echo ================================================================
echo.

node scripts\atualizar_dashboard.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Metricas sincronizadas com sucesso!
echo Abrindo o Portal de Transparencia no navegador...
echo ================================================================
start "" "http://localhost:8088"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro ao sincronizar o dashboard.
echo ================================================================

:fim
pause
