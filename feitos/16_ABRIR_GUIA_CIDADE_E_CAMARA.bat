@echo off
title ARINOS E CAMARA - HISTORIA TURISMO E CURIOSIDADES
color 0E
cls
echo ====================================================================
echo           PORTAL DE ARINOS / MG - HISTORIA, TURISMO E CAMARA
echo             Sagarana, Urucuia, Cachoeiras e Poder Legislativo
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
echo [2/2] Abrindo guia historico e turistico no navegador...
start http://localhost:8088/cidade.html

echo.
echo ====================================================================
echo Guia disponivel em: http://localhost:8088/cidade.html
echo ====================================================================
echo Pressione qualquer tecla para sair deste inicializador...
pause >nul
exit /b 0
