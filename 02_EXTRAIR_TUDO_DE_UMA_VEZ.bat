@echo off
cd /d "%~dp0"
title EXTRACAO COMPLETA DE TODOS OS MODULOS - ARINOS / MG

echo ================================================================
echo   EXTRACAO TOTAL E AUDITORIA FORENSE - ARINOS / MG
echo   Modo: TODOS OS MODULOS DE UMA VEZ
echo   Criterio: 30 meses consecutivos vazios
echo ================================================================
echo.
echo Este script executara a coleta e tratamento de:
echo  1. Folha de Pagamento da Prefeitura (ID 236)
echo  2. Folha de Pagamento da Fundacao de Saude (ID 241)
echo  3. Despesas e Empenhos da Prefeitura (ID 236)
echo  4. Despesas e Empenhos da Fundacao de Saude (ID 241)
echo  5. Diarias de Viagem da Prefeitura (ID 236)
echo  6. Diarias de Viagem da Fundacao de Saude (ID 241)
echo.
echo Pressione qualquer tecla para iniciar a esteira completa...
pause >nul

node scripts\extrator_unificado.js --modulo tudo --vazios 30

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO COM SUCESSO] Todos os modulos foram auditados!
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Ocorreu um erro durante a execucao (Codigo: %ERRORLEVEL%).
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
