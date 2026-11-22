@echo off
cd /d "%~dp0"
title PROCESSAR DIARIAS LOCAIS (514 MESES RAW)

echo ================================================================
echo   INGESTAO LOCAL DE DIARIAS DE VIAGEM (100%% OFFLINE)
echo   Processando 514 arquivos HTML salvos na auditoria
echo   Destino: dados\arinos_transparencia_master.sqlite3
echo ================================================================
echo.

node scripts\processar_diarias_locais.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Diarias de viagem processadas e integradas com sucesso!
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro no processamento das Diarias.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
