@echo off
title MANDATOS E LEGISLATURAS - ARINOS / MG
color 09
cls
echo ====================================================================
echo        PORTAL DE ARINOS / MG - MANDATOS E LEGISLATURAS
echo          Executivo e Legislativo (1963 a 2028) e Auditoria
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
echo [2/2] Abrindo painel de Mandatos e Legislaturas no navegador...
start http://localhost:8088/mandatos.html

echo.
echo ====================================================================
echo Painel disponivel em: http://localhost:8088/mandatos.html
echo ====================================================================
echo Pressione qualquer tecla para sair deste inicializador...
pause >nul
exit /b 0
