@echo off
cd /d "%~dp0"
title VARREDURA PROFUNDA TOTAL ATE PRE-2013 - ARINOS / MG

echo ==============================================================================
echo   VARREDURA PROFUNDA TOTAL DE DADOS HISTORICOS - ARINOS / MG
echo   Prefeitura Municipal, Fundo de Saude, Camara Municipal e SIAP
echo ==============================================================================
echo.
echo Criterio de Parada Forense:
echo - Limiar estrito de 70 meses consecutivos de respostas vazias.
echo - Varredura historica retroativa cobrindo ate antes de 2013 (anos 2000 / 1990).
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] Node.js nao encontrado no PATH do sistema.
  echo Por favor, instale o Node.js v20+ para continuar.
  pause
  exit /b 1
)

echo [1/5] Executando Extrator Unificado Multi-Modulo (70 Respostas Vazias)...
node scripts\extrator_unificado.js
if %errorlevel% neq 0 (
  echo [AVISO] O extrator unificado reportou avisos de rede ou limite de vazios atingido.
)
echo.

echo [2/5] Executando Extrator do Novo Portal SIAP (Despesas, Receitas e Contratos)...
node scripts\extrator_novo_portal_siap.js
echo.

echo [3/5] Executando Coletor SAPL / Camara Municipal de Arinos...
node scripts\extrator_sapl_camara.js
echo.

echo [4/5] Executando Enriquecimento Societario da Receita Federal (QSA CNPJ)...
node scripts\enriquecer_empresas_socios.js
echo.

echo [5/5] Consolidando Perfis Unificados e Total de Dinheiro Publico...
node scripts\unificar_cadastros_pessoas.js
echo.

echo ==============================================================================
echo   VARREDURA PROFUNDA HISTORICA CONCLUIDA COM SUCESSO!
echo ==============================================================================
echo Todos os dados foram gravados em: dados\arinos_transparencia_master.sqlite3
echo Para visualizar o painel, execute: 01_ABRIR_PAINEL_AO_VIVO.bat
echo.
pause
