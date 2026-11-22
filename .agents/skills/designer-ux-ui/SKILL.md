---
name: designer-ux-ui
description: >-
  Design de interfaces cidadãs limpas (Clean UI), acessíveis e intuitivas para o eleitor, tradução
  visual de dados orçamentários complexos, hierarquia de informação progressiva (cards, tooltips e modais)
  e padronização visual para o Portal da Transparência de Arinos/MG. Ative ao projetar ou refatorar telas e componentes.
---

# Skill: Designer UX/UI (User Experience & Interface) — Portal Arinos/MG

Esta skill guia o agente a projetar interfaces focadas no cidadão comum, traduzindo complexidades contábeis e jurídicas em informações visualmente imediatas, envolventes e de fácil leitura.

## 🎨 Princípios Centrais de Experiência do Cidadão

1. **Clean Dashboard (Menos é Mais):**
   - Remova o ruído de logs técnicos, cabeçalhos de requisição e dados brutos da visão primária do usuário.
   - Deixe visíveis apenas os **grandes indicadores de interesse público**:
     - *Total de Salários e Folha de Pagamento*
     - *Fornecedores e Empresas Contratadas*
     - *Diárias e Viagens de Servidores/Políticos*
     - *Alertas Críticos (Nepotismo, Empresas com Sócios Políticos)*
     - *Atuação Legislativa dos Vereadores*

2. **Divulgação Progressiva (Progressive Disclosure):**
   - **Camada 1 (Glance):** Card KPI de alto contraste com valor monetário consolidado e ícone visual claro.
   - **Camada 2 (Contexto):** Ícone de ajuda (`?`) com tooltip flutuante ao passar o mouse ou clicar no mobile, explicando a metodologia do dado.
   - **Camada 3 (Aprofundamento):** Clique no card abre um Modal/Popup com abas, tabelas detalhadas e rankings completos, sem recarregar nem mudar de página.

3. **Buscador Universal Inclusivo:**
   - O campo de busca deve tratar palavras com e sem acento (`normalizeText()`), maiúsculas e minúsculas, e múltiplas palavras fragmentadas.
   - Resultados agrupados visualmente por categoria (*"Servidores Encontrados"*, *"Empresas Credoras"*, *"Diárias"*, *"Vereadores"*).

4. **Paleta de Cores e Imparcialidade:**
   - Tons neutros escuros e sóbrios para credibilidade investigativa: Fundo escuro `#0f172a`, cards `#1e293b`, bordas `#334155`.
   - Cores de alerta sem viés partidário: Dourado `#f59e0b` para volume financeiro, Vermelho `#ef4444` exclusivamente para alertas comprovados por cruzamento de dados, Azul `#38bdf8` para dados institucionais da Câmara.
   - Cores de partidos/campanhas aplicadas nos crachás de candidatos respeitando a identidade oficial do TSE.

## 📱 Checklist de Usabilidade

Ao criar ou editar qualquer tela:
- [ ] A tela possui hierarquia clara? O usuário entende o que a página faz em 3 segundos?
- [ ] Os valores monetários estão no padrão brasileiro (`R$ 1.234.567,89`)?
- [ ] Informações secundárias e logs avançados estão devidamente abrigados em modais ou abas colapsáveis?
- [ ] Os modais fecham tanto no botão "X", na tecla `Esc` quanto no clique fora do modal?
- [ ] Os elementos têm tamanho mínimo de toque de 44px para uso em smartphones?
