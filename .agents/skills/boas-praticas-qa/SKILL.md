---
name: boas-praticas-qa
description: >-
  Auditoria de qualidade, Clean Code, execução de bateria de testes automatizados, sanitização de dados,
  higiene de repositório Git e homologação pré-commit para o Portal da Transparência de Arinos/MG.
  Ative antes de aprovar commits, refatorar código ou verificar integridade de arquivos.
---

# Skill: Boas Práticas de Programação & QA (Quality Assurance) — Portal Arinos/MG

Esta skill atua como o guardião da qualidade, integridade e estabilidade do código e dos dados públicos auditados do portal.

## 🛡️ Regras Inegociáveis de Engenharia de Software

1. **Test-First Commit (Nenhum Commit sem Aprovação):**
   - Nunca comite código sem rodar a bateria oficial em `scripts/auto_commit_aprovado.js`.
   - Requisitos mínimos para aprovação:
     1. `PRAGMA quick_check` no SQLite Master deve retornar `ok`.
     2. As 7 páginas HTML centrais do portal devem estar íntegras.
     3. Todos os 7 catálogos JSON Master devem validar via `JSON.parse()`.
     4. A API local em `http://localhost:8088/api/live` deve responder HTTP 200.

2. **Higiene do Repositório Git:**
   - **Proibido comitar:** Arquivos `.sqlite3`, `.sqlite3-shm`, `.sqlite3-wal`, pastas de cache HTML/raw (`dados/auditoria/raw/`), pacotes `.zip` ou arquivos `.log`.
   - **Obrigatório versionar:** Código-fonte (`.html`, `.css`, `.js`), scripts de automação (`.bat`, `.ps1`), documentação em Markdown (`.md`), catálogos consolidados JSON e relatórios CSV exportados.

3. **Código Limpo e Sem Dependências Fantasmas:**
   - Priorize módulos nativos do Node.js (`node:fs`, `node:path`, `node:http`, `node:crypto`, `node:sqlite`, `node:child_process`).
   - Evite adicionar pacotes do `npm` para tarefas que a biblioteca padrão do Node.js 24 resolve com maior performance e zero vulnerabilidade de supply-chain.
   - Todo arquivo em lote (`.bat`) no Windows deve conter apenas caracteres ASCII de 7 bits sem comandos de troca de página de código instáveis (`chcp 65001`).

4. **Tratamento Defensivo de Erros:**
   - Todo parser de dados externos deve validar campos nulos ou indefinidos (`row.valor || 0`).
   - Respostas HTTP com falha ou portais fora do ar devem ser capturadas em bloco `try/catch` registrando log estruturado sem quebrar a execução geral.

## ✅ Checklist de Homologação QA

Antes de liberar qualquer ajuste para publicação:
- [ ] O script `node scripts/auto_commit_aprovado.js` rodou e exibiu `4/4 TESTES APROVADOS`?
- [ ] As consultas SQL utilizam parâmetros preparados (prepared statements) para prevenir SQL Injection?
- [ ] Foram removidos `console.log` de depuração temporária desnecessários?
- [ ] O `.gitignore` está protegendo o repositório contra arquivos pesados?
