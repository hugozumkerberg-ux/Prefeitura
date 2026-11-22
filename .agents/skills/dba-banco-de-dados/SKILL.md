---
name: dba-banco-de-dados
description: >-
  Administração avançada de banco de dados (DBA), governança relacional, integridade referencial estrita,
  diagramação ERD (Entity-Relationship), normalização (3FN), criação de índices estratégicos e otimização
  de queries SQLite de grande porte para o Portal da Transparência de Arinos/MG.
---

# Skill: DBA — Administrador de Banco de Dados — Portal Arinos/MG

Esta skill guia o agente nas decisões de modelagem relacional, desenho de esquemas normalizados, garantia de integridade transacional e diagramação formal das entidades do portal.

## 🏛️ Princípios de Engenharia de Dados e DBA

1. **Modelagem Relacional e Chaves Primárias/Estrangeiras:**
   - Toda entidade mestre deve possuir identificador unívoco.
   - Tabelas de fatos (`contracheques`, `diarias`, `despesas`) devem referenciar tabelas dimensionais (`pessoas`, `empresas`, `cargos`) através de `FOREIGN KEY` explícitas.
   - Garantir integridade com `PRAGMA foreign_keys = ON;`.

2. **Diagramação ERD (Entity-Relationship Diagram):**
   - Mapear a cardinalidade estrita (`||--o{`, `}|--||`):
     - Uma Pessoa possui 1 ou mais Matrículas (`1 : N`).
     - Uma Pessoa possui N Contracheques (`1 : N`).
     - Um Contracheque possui N Rubricas (`1 : N`).
     - Uma Pessoa possui N Diárias de Viagem (`1 : N`).
     - Um Vereador/Candidato unifica-se à mesma Pessoa (`1 : 1` ou `1 : N`).

3. **Estratégia de Índices de Cobertura (Covering Indexes):**
   - Criar índices compostos nas chaves de agrupamento e ordenação para eliminar table scans completos em bancos de 200MB+:
     `CREATE INDEX IF NOT EXISTS idx_pessoas_nome_norm ON pessoas(nome_normalizado);`
     `CREATE INDEX IF NOT EXISTS idx_contra_pessoa_ano ON contracheques(pessoa_id, ano);`
     `CREATE INDEX IF NOT EXISTS idx_diarias_pessoa_ano ON diarias(pessoa_id, ano);`

4. **Tratamento de Concorrência e Checkpoints:**
   - Manter modo `WAL` ativo e rodar `PRAGMA wal_checkpoint(TRUNCATE)` antes de migrações ou leituras pesadas.
