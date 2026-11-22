@echo off
title TESTAR, COMITAR E PUBLICAR AJUSTES - ARINOS / MG
cd /d "%~dp0"

echo ======================================================================
echo    TESTAR, GERAR COMMIT AUTOMATICO E PUBLICAR - ARINOS / MG
echo ======================================================================
echo.

set /p MENSAGEM="Digite a descricao do ajuste (ou pressione ENTER para automatico): "

echo.
echo Executando bateria de testes e commit automatico...
if "%MENSAGEM%"=="" (
    node scripts/auto_commit_aprovado.js
) else (
    node scripts/auto_commit_aprovado.js "%MENSAGEM%"
)

echo.
pause
