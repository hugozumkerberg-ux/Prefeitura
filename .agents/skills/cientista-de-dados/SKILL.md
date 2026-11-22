---
name: cientista-de-dados
description: >-
  Resolução de entidades (Entity Resolution), deduplicação fuzzy, reconciliação de homônimos e matrículas múltiplas,
  unificação de perfis de servidores, vereadores e prefeitos, consolidação de remuneração acumulada de dinheiro público
  e detecção de anomalias/outliers para o Portal da Transparência de Arinos/MG.
---

# Skill: Cientista de Dados (Data Scientist) — Portal Arinos/MG

Esta skill guia o agente no tratamento de inconsistências cadastrais, unificação de dados biográficos de servidores públicos e políticos, deduplicação de nomes e cálculo de ganhos totais do erário.

## 🔬 Metodologia de Tratamento de Dados (Entity Resolution)

1. **Inconsistência Clássica do Setor Público (Múltiplas Matrículas):**
   - O mesmo servidor público acumula matrículas distintas quando:
     - Muda de cargo efetivo ou passa em novo concurso.
     - Assume cargo comissionado ou função gratificada.
     - Tem contrato temporário renovado ano a ano.
     - Erros de digitação nos sistemas (ex: `00123` vs `123`).
   - **Solução:** Criar a entidade canônica `pessoa_consolidada` que agrega todas as matrículas conhecidas em um array estruturado (`['00123', '4567']`).

2. **Normalização Textual Canônica:**
   - Remover acentos, pontuações, caracteres invisíveis e espaços duplicados:
     `normalizeName("JOSÉ DA SILVA  ") -> "JOSE DA SILVA"`
   - Tratamento de abreviações e variações documentais.

3. **Consolidação Financeira 360º (Quanto Cada Um Recebeu):**
   - Cruzar os 3 principais eixos de dinheiro público municipal:
     1. **Salários / Proventos Brutos:** Soma de toda a folha histórica de 2013 a 2026.
     2. **Diárias de Viagem:** Soma de todas as diárias pagas (hospedagem, alimentação).
     3. **Contratos / Empresas Vinculadas:** Volume pago a empresas em que a pessoa consta como sócia na Receita Federal.

4. **Classificação Política e Institucional:**
   - Cruzar com a base do TSE e da Câmara para atribuir rótulos oficiais:
     - 🏛️ **Prefeito / Vice-Prefeito**
     - ⚖️ **Vereador** (com número de mandatos e projetos)
     - 👔 **Secretário Municipal**
     - 🩺 **Servidor Efetivo da Saúde**
     - 📋 **Contratado / Comissionado**
