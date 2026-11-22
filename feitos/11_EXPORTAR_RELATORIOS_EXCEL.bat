@echo off
cd /d "%~dp0"
title EXPORTAR RELATORIOS EXECUTIVOS (EXCEL / CSV)

echo ================================================================
echo   EXPORTACAO DE DADOS AUDITADOS PARA O EXCEL (CSV UTF-8)
echo   Gerando planilhas de Salarios, Despesas e Diarias
echo   Destino: relatorios_exportados\
echo ================================================================
echo.

node scripts\exportar_relatorios_csv.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Planilhas executivas geradas com sucesso!
echo Abrindo a pasta de relatorios exportados...
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "relatorios_exportados" mkdir "relatorios_exportados"
start "" "relatorios_exportados"
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro na geracao dos relatorios executivos.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
