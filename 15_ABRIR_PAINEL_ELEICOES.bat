@echo off
title PAINEL DE ELEICOES TSE - ARINOS / MG
color 0B
cls
echo ====================================================================
echo          PORTAL DE TRANSPARENCIA - ELEICOES TSE ARINOS / MG
echo                 Candidatos, Fotos, Votos e Dossies
echo ====================================================================
echo.
echo [1/2] Verificando se o servidor local esta ativo na porta 8088...

netstat -ano | findstr 8088 >nul
if %errorlevel% neq 0 (
    echo [INFO] Servidor nao detectado. Iniciando servidor em segundo plano...
    start /b node scripts\servidor_painel.js
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] Servidor ativo e respondendo na porta 8088!
)

echo.
echo [2/2] Abrindo painel visual de Candidatos e Eleicoes no navegador...
start http://localhost:8088/eleicoes.html

echo.
echo ====================================================================
echo Painel Eleitoral disponivel em: http://localhost:8088/eleicoes.html
echo ====================================================================
echo Pressione qualquer tecla para sair deste inicializador...
pause >nul
exit /b 0
