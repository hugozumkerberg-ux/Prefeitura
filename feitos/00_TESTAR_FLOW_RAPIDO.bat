@echo off
cd /d "%~dp0"
title TESTE DE FLUXO RAPIDO (FLOW TEST) - ARINOS / MG

echo ================================================================
echo   TESTE DE FLUXO DE PONTA A PONTA (FLOW TEST) - ARINOS / MG
echo ================================================================
echo.
echo Este script executara um ciclo completo de teste (2 meses):
echo  1. Requisicao HTTP oficial a ADPMNET
echo  2. Gravacao do arquivo RAW com Hash SHA-256
echo  3. Tratamento e gravacao no SQLite Master
echo  4. Sincronizacao dos logs e metricas do painel
echo  5. Transferencia automatica deste script para 'feitos/'
echo.
echo Pressione qualquer tecla para iniciar o teste rapido...
pause >nul

node scripts\extrator_unificado.js --modulo folha_saude --vazios 30 --max-consultas 2

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [SUCESSO TOTAL] O fluxo de ponta a ponta funcionou perfeitamente!
echo - Dados coletados e salvos no SQLite Master
echo - Hashes SHA-256 e logs registrados
echo - Transferindo este script de teste para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Ocorreu um erro no teste de fluxo (Codigo: %ERRORLEVEL%).
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
