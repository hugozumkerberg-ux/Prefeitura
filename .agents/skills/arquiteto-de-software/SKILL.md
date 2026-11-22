---
name: arquiteto-de-software
description: >-
  Definição e governança de arquitetura de software, modelagem relacional SQLite, otimização de consultas
  de alta velocidade (<10ms), isolamento de processos concorrentes e cadeia de custódia forense SHA-256
  para o Portal da Transparência de Arinos/MG. Ative ao projetar tabelas, otimizar APIs ou refatorar fluxos de dados.
---

# Skill: Arquiteto de Software (Software Architect) — Portal Arinos/MG

Esta skill guia o agente nas decisões estruturais de modelagem, desempenho, integridade relacional e cadeia de custódia forense de dados públicos.

## 🏛️ Diretrizes Arquiteturais do Sistema

1. **Topologia em Camadas Desacopladas:**
   - **Camada de Extração:** Scripts autônomos (`scripts/extrator_*.js`) que raspam dados com idempotência e tolerância a falhas.
   - **Camada de Armazenamento:** SQLite Relacional Master (`arinos_transparencia_master.sqlite3`) para consultas rápidas indexadas + JSONs Master para snapshots estáticos.
   - **Camada de Serviços / API:** Servidor nativo Node.js (`scripts/servidor_painel.js`) sem frameworks pesados, servindo JSON em streaming.
   - **Camada de Apresentação:** Frontend desacoplado (HTML5/CSS3/Vanilla JS) que consome a API REST sem renderização server-side pesada.

2. **Padrão de Concorrência e Bloqueio de Arquivo (Windows):**
   - SQLite em modo `WAL` (`PRAGMA journal_mode=WAL`) para leitura concorrente sem travas.
   - Para backups de bancos com scrapers ativos, **sempre usar snapshot atômico `VACUUM INTO 'caminho'`**, eliminando conflitos de compartilhamento de arquivo no Windows.

3. **Performance de Busca em Memória (<10ms):**
   - Criação de índices estratégicos para colunas de busca textual e agregação:
     `CREATE INDEX IF NOT EXISTS idx_contracheques_busca ON contracheques(nome, cargo, ano);`
     `CREATE INDEX IF NOT EXISTS idx_despesas_credor ON despesas(credor, ano);`
     `CREATE INDEX IF NOT EXISTS idx_diarias_servidor ON diarias(servidor, ano);`

4. **Protocolo de Imutabilidade e Perícia Forense:**
   - Todo backup gerado deve emitir um manifesto assinado com SHA-256 e inventário linha por linha de todas as tabelas.
   - Toda consulta aos portais municipais deve registrar o código HTTP de retorno, o tamanho do payload e o hash SHA-256 em `auditoria_consultas`.

## 📐 Checklist de Revisão Arquitetural

Antes de adicionar qualquer nova fonte de dados:
- [ ] O schema da nova tabela possui chaves primárias e tipos coerentes (`INTEGER`, `TEXT`, `REAL`)?
- [ ] Há índices para as colunas que aparecerão em filtros `WHERE` e `ORDER BY`?
- [ ] O script utiliza transações agrupadas (`BEGIN TRANSACTION ... COMMIT`) em vez de múltiplos inserts soltos?
- [ ] O endpoint da API trata parâmetros não informados com paginação defensiva (`LIMIT 50 OFFSET 0`)?
