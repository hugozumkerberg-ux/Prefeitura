@echo off
title PAINEL DE EMPRESAS, SOCIOS E VIAGENS - ARINOS / MG
cd /d "%~dp0"

echo ======================================================================
echo    PAINEL DE EMPRESAS, QUADRO DE SOCIOS E VIAGENS - ARINOS / MG
echo    Auditoria Forense de Contratos, QSA Receita Federal e Diarias
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
echo Abrindo o Painel de Empresas, Socios e Viagens no seu navegador...
start http://localhost:8088/empresas.html

echo.
echo ======================================================================
echo Painel aberto com sucesso!
echo Acesse: http://localhost:8088/empresas.html
echo ======================================================================
timeout /t 3
