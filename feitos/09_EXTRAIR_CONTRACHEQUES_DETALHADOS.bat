@echo off
cd /d "%~dp0"
title EXTRAIR CONTRACHEQUES DETALHADOS (HOLERITES COM RUBRICAS)

echo ================================================================
echo   EXTRACAO: CONTRACHEQUES DETALHADOS (DIRECT-TO-SQLITE)
echo   Objetivo: Holerites individuais com rubricas, INSS e descontos
echo   Destino: dados\contracheques_detalhados_master.sqlite3
echo ================================================================
echo.

node scripts\coletor_contracheques_detalhados.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Holerites detalhados extraidos e tratados com sucesso!
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro na extracao de contracheques detalhados.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
