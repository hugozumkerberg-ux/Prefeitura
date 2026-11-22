@echo off
title PAINEL DOS VEREADORES DE ARINOS - ATUACAO E PROJETOS DE LEI
cd /d "%~dp0"

echo ======================================================================
echo    PAINEL DOS VEREADORES DE ARINOS - HISTORICO DE PROJETOS E LEIS
echo    Camara Municipal de Arinos / MG - Sistema SAPL / Interlegis
echo ======================================================================
echo.

:: Verificar se o servidor do painel esta ativo na porta 8088
netstat -ano | findstr :8088 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Iniciando Servidor de Monitoramento e API do Portal...
    start /b node scripts/servidor_painel.js
    timeout /t 2 /nobreak >nul
) else (
    echo Servidor local ativo na porta 8088!
)

echo.
echo Abrindo o Painel de Vereadores no seu navegador...
start http://localhost:8088/vereadores.html

echo.
echo ======================================================================
echo Painel aberto com sucesso!
echo Acesse: http://localhost:8088/vereadores.html
echo ======================================================================
timeout /t 3
