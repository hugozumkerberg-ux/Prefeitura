@echo off
cd /d "%~dp0"
title EXTRAIR DESPESAS - FUNDACAO MUNICIPAL DE SAUDE

echo ================================================================
echo   EXTRACAO: DESPESAS E EMPENHOS - FUNDACAO DE SAUDE (ID 241)
echo   CNPJ: 18.650.424/0001-67
echo   Inicio: 2026/11 retrocedendo ate 30 meses vazios
echo   Destino: dados\arinos_transparencia_master.sqlite3
echo ================================================================
echo.

node scripts\extrator_unificado.js --modulo despesas_saude --vazios 30

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Despesas da Saude extraidas e tratadas com sucesso!
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro na extracao de Despesas da Saude.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
