@echo off
title GERADOR DE BACKUP FORENSE COMPLETO - ARINOS / MG
cd /d "%~dp0"

echo ======================================================================
echo    GERADOR DE BACKUP FORENSE INTEGRAL CERTIFICADO - ARINOS / MG
echo    Bancos SQLite, JSONs Master, Fotos, Relatorios CSV e Auditoria
echo ======================================================================
echo.

echo Executando gerador de backup forense e calculando hash SHA-256...
node scripts/gerar_backup_completo.js

echo.
echo ======================================================================
echo Processo concluido! Verifique a pasta: backups_forenses
echo ======================================================================
echo.
pause
