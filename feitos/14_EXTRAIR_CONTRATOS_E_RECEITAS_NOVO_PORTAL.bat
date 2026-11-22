@echo off
cd /d "%~dp0"
title EXTRAIR CONTRATOS E RECEITAS (NOVO PORTAL SIAP - MG CIDADES)

echo ================================================================
echo   EXTRACAO: NOVO PORTAL DA TRANSPARENCIA (MG CIDADES / SIAP)
echo   Alvo: Contratos Administrativos e Receitas Publicas
echo   Destino: dados\arinos_transparencia_master.sqlite3
echo ================================================================
echo.

node scripts\extrator_novo_portal_siap.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo Sincronizando metricas no dashboard...
node scripts\atualizar_dashboard.js
echo ================================================================
echo [CONCLUIDO] Contratos e Receitas extraidos e tratados com sucesso!
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro na extracao do novo portal SIAP.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
