@echo off
cd /d "%~dp0"
title CONSOLIDAR PESSOAS E DINHEIRO PUBLICO - ARINOS / MG

echo ==============================================================================
echo   CONSOLIDACAO CADASTRAL, RESOLUCAO DE ENTIDADES E DINHEIRO PUBLICO
echo   Skills: Cientista de Dados e DBA - Arinos / MG
echo ==============================================================================
echo.
echo Operacoes Executadas:
echo 1. Tratamento de inconsistencias: Servidores com multiplas matriculas.
echo 2. Agrupamento por Nome Canonico (sem acentos e normalizado).
echo 3. Consolidacao Salarios (2013-2026) + Diarias de Viagem (2013-2026).
echo 4. Cruzamento com Vereadores da Camara, Prefeitos e Candidatos TSE.
echo 5. Cruzamento com Quadro Societario (QSA) de Empresas Credoras da Prefeitura.
echo 6. Gravacao na tabela relacional 'pessoas_unificadas' no SQLite Master.
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] Node.js nao encontrado no PATH do sistema.
  echo Por favor, instale o Node.js v20+ para continuar.
  pause
  exit /b 1
)

node scripts\unificar_cadastros_pessoas.js
if %errorlevel% neq 0 (
  echo [ERRO] Falha ao processar consolidacao de pessoas.
  pause
  exit /b 1
)

echo.
echo ==============================================================================
echo   CONSOLIDACAO CONCLUIDA! ACESSE: http://localhost:8088/tabelas.html?tab=pessoas
echo ==============================================================================
echo.
pause
