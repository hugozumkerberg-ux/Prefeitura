@echo off
cd /d "%~dp0"
title GERAR BACKUP FORENSE CERTIFICADO (ZIP + SHA-256)

echo ================================================================
echo   CRIANDO PACOTE DE CUSTODIA FORENSE (ZIP + SHA-256)
echo   Compactando arinos_transparencia_master.sqlite3
echo   Destino: backups_forenses\
echo ================================================================
echo.

node scripts\gerar_backup_forense.js

if %ERRORLEVEL% neq 0 goto :erro

:sucesso
echo.
echo ================================================================
echo [CONCLUIDO] Backup forense e manifesto de integridade gerados!
echo Abrindo a pasta de backups...
echo Transferindo este script para a pasta 'feitos'...
echo ================================================================
if not exist "backups_forenses" mkdir "backups_forenses"
start "" "backups_forenses"
if not exist "feitos" mkdir "feitos"
start /b powershell -NoProfile -Command "Start-Sleep -Milliseconds 800; Move-Item -Path '%~f0' -Destination 'feitos\%~nx0' -Force"
goto :fim

:erro
echo.
echo ================================================================
echo [FALHA] Houve um erro na geracao do backup forense.
echo O script foi mantido nesta pasta para verificacao.
echo ================================================================

:fim
pause
