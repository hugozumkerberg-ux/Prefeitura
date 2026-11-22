@echo off
cd /d "%~dp0"
title PUBLICAR VERSAO ESTAVEL NO GITHUB - ARINOS / MG

echo ================================================================
echo   PUBLICADOR AUTOMATIZADO DE VERSOES ESTAVEIS - ARINOS / MG
echo ================================================================
echo 1. Executando bateria de testes de integridade e qualidade...
echo 2. Criando commit automatico caso 100%% dos testes aprovem...
echo 3. Gerando tag semantica de versao estavel (vX.Y.Z-stable)...
echo 4. Publicando no GitHub (branch main, branch stable e tags)...
echo ================================================================
echo.

node scripts\auto_commit_aprovado.js %*

echo.
echo ================================================================
echo Processo finalizado.
echo ================================================================
pause
