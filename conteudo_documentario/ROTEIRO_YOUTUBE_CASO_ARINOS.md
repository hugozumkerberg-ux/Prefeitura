# Roteiro Completo para YouTube: Do Caos dos Dados Públicos ao Portal de Transparência Ultrarrápido

> **Caso Real:** Engenharia Reversa, Correção de Bugs Críticos de R$ 160 Milhões e Auditoria Forense dos Gastos Públicos de Arinos/MG.
> **Público-alvo:** Desenvolvedores, Engenheiros de Dados, Analistas de Segurança, Entusiastas de Open Data e Controle Social.

---

## 🎯 Pacote de Publicação (SEO, Títulos e Thumbnails)

### Sugestões de Títulos (Testar em A/B)
1. **Opção 1 (Impacto / Investigação):** *Como Auditei R$ 316 Milhões em Gastos Públicos (E o Bug de R$ 160 Milhões que Quase Passou)*
2. **Opção 2 (Técnica / Engenharia):** *Engenharia Reversa da Transparência Pública: De 133 Mil HTMLs Quebrados a um Portal Ultrarrápido*
3. **Opção 3 (Dev / Storytelling):** *Eu Refiz o Portal da Transparência da Minha Cidade com Node.js e SQLite (Zero Dependências)*

### Ideia de Thumbnail
* **Layout:** Tela dividida ao meio (Split Screen) com alto contraste.
  * **Lado Esquerdo (Caos / Vermelho):** Captura do portal oficial antigo com erro/carregando infinito, texto em vermelho tachado com `R$ 166.000.000,00 ❌` e uma pasta do Windows travada com `133.441 arquivos`.
  * **Lado Direito (Solução / Verde Neon & Dark Mode):** O novo Dashboard moderno (`index.html`) com o gráfico de barras, tempo de resposta `< 5ms`, texto verde com `R$ 5.186.064,09 ✅ AUDITADO` e o selo `SHA-256`.
  * **Rosto:** Expressão de surpresa/foco segurando um código ou apontando para a discrepância de valores.

### Descrição do Vídeo (Template para o YouTube)
```markdown
Neste vídeo, eu mostro os bastidores técnicos de como auditei mais de R$ 316 Milhões em despesas, salários e diárias públicas de uma cidade de Minas Gerais (Arinos/MG).

Você vai ver:
- Por que portais de transparência públicos no Brasil costumam ser lentos, confusos e "inacessíveis por design".
- O pesadelo de lidar com 133.000 arquivos HTML soltos no Windows NTFS.
- O bug de formatação de moeda que transformou R$ 5 Milhões em R$ 166 Milhões (e o risco de acusar desvio inexistente!).
- Como resgatamos 133 mil contracheques que estavam com todas as colunas NULL no banco de dados.
- A descoberta da Fundação de Saúde (um órgão municipal inteiro que estava fora da base de dados).
- Como criamos uma cadeia de custódia com hash SHA-256 para cada centavo ter valor probatório jurídico.
- Demonstração do novo portal com busca instantânea usando SQLite nativo e Node.js 24 (Zero `npm install`).

Link do Projeto no GitHub: [seu link]
Documentação técnica e código fonte disponíveis no repositório.
Deixe seu like e se inscreva para fortalecer a tecnologia cidadã!
```

---

## ⏱️ Linha do Tempo e Capítulos

| Timestamp | Bloco | Objetivo Principal |
| :--- | :--- | :--- |
| `00:00` | **Gancho (Hook)** | Prender a atenção com o bug de R$ 160 milhões e o desafio cívico. |
| `01:30` | **O Cenário Real** | Explicar o que é Arinos/MG e por que os portais oficiais falham com a população. |
| `03:15` | **A Anamnese Técnica** | O que encontramos no projeto antigo (133k arquivos soltos travando o Windows Explorer). |
| `05:30` | **Os 4 Erros Críticos** | Os 4 maiores bugs desvendados (Moeda, Regex cego, Colunas Nulas e Órgão Oculto). |
| `10:15` | **A Nova Engenharia** | Regra dos 30 meses vazios, Direct-to-SQLite e SHA-256 forense. |
| `13:45` | **Demonstração Prática** | Navegando no Dashboard ao vivo, gráficos e motor de busca. |
| `16:30` | **Conclusão & Lições** | Ética no tratamento de dados públicos e convite à comunidade. |

---

## 🎬 Roteiro Detalhado Cena a Cena

### BLOCO 1: O GANCHO (00:00 - 01:30)
* **[Câmera Frontal - Plano Médio]**
* **FALA:**
  > *"E se um simples erro de programação fizesse uma cidadezinha de 18 mil habitantes parecer ter gasto 160 milhões de reais a mais em diárias de viagens?*
  > *E se 133 mil contracheques estivessem salvos no seu computador, mas todas as colunas de Nome, Cargo e Salário estivessem completamente vazias?*
  > *Nos últimos dias, eu mergulhei a fundo nos dados públicos da Prefeitura de Arinos, no interior de Minas Gerais. O que começou como uma simples consulta cívica se transformou em uma verdadeira investigação de engenharia de software e auditoria forense de dados.*
  > *Eu peguei um sistema que travava o Windows com 133 mil arquivos HTML soltos, encontrei falhas graves de parser que distorciam a realidade das contas públicas, e reconstruí toda a esteira do zero. O resultado? Mais de 316 milhões de reais auditados, centavo por centavo, com assinatura criptográfica SHA-256 e busca instantânea em menos de 5 milissegundos.*
  > *Neste vídeo, eu vou te mostrar exatamente o que deu errado, como nós descobrimos cada falha e como você pode aplicar engenharia de dados moderna para fiscalizar o poder público com responsabilidade. Vem comigo!"*
* **[Corte Rápido + Vinheta do Canal (5s)]**

---

### BLOCO 2: O CENÁRIO REAL & O PROBLEMA DO ACESSO (01:30 - 03:15)
* **[B-Roll / Gravação de Tela: Acessando o portal antigo da ADPMNET]**
* **FALA:**
  > *"No Brasil, a Lei de Acesso à Informação e a Lei da Transparência obrigam prefeituras a publicarem seus dados na internet. Mas existe uma diferença gritante entre um dado estar **publicado** e ele estar **acessível**.*
  > *A maioria dos pequenos municípios utiliza sistemas legados de contabilidade pública — no caso de Arinos, o sistema ADPMNET. Ele até funciona para emissão de relatórios individuais, mas se um cidadão, jornalista ou vereador quiser responder a perguntas básicas como: 'Quem foi o funcionário que mais recebeu diárias nos últimos 10 anos?' ou 'Qual é o custo total da folha da Saúde?', o portal oficial simplesmente não responde.*
  > *Não existe busca global por texto. Você precisa selecionar ano por ano, mês por mês, abrir tabelas paginadas em HTML dos anos 2000 e somar na mão. Foi por isso que decidimos criar um coletor automatizado. Mas foi aí que o caos técnico começou..."*

---

### BLOCO 3: A ANAMNESE - O QUE ENCONTRAMOS NA PASTA (03:15 - 05:30)
* **[Gravação de Tela: Mostrando a pasta original `hacks/` no Windows Explorer com o ponteiro do mouse carregando]**
* **FALA:**
  > *"Quando comecei a analisar o projeto que tínhamos montado anteriormente, a primeira coisa que notei foi uma lentidão absurda no Windows. O File Explorer travava para abrir a pasta.*
  > *Ao rodar um diagnóstico, descobrimos que havia uma pasta com mais de **133.441 arquivos HTML soltos**! Cada contracheque de cada servidor, de cada mês desde 2013, foi gravado como um arquivo `.html` separado em disco.*
  > *Para quem trabalha com sistemas de arquivos, sabe que o NTFS do Windows odeia pastas com centenas de milhares de arquivos pequenos. Um simples `dir` ou `Get-ChildItem` consumia gigabytes de memória e minutos de CPU só para indexar os metadados do disco!*
  > *Além disso, tínhamos pastas com nomes aleatórios como `aaaa`, arquivos duplicados, e quando fomos olhar os bancos de dados SQLite... quase nada batia com a realidade."*

---

### BLOCO 4: OS 4 ERROS CRÍTICOS DESVENDADOS (05:30 - 10:15)

#### 🔴 Erro 1: O Bug da Moeda Fantasma (R$ 160 Milhões Fictícios!)
* **[Gravação de Tela com Zoom no Código VS Code + Gráfico Comparativo]**
* **FALA:**
  > *"O primeiro erro foi o mais assustador. Quando somamos o valor total de diárias de viagens dos servidores no banco antigo, o painel acusava mais de **166 milhões de reais** em viagens para uma cidade de 18 mil habitantes! Isso não fazia o menor sentido.*
  > *Fomos auditar o código SQL e o script de extração. Veja só o que estava acontecendo:*
  > *No Brasil, os valores usam ponto para milhar e vírgula para decimal, tipo `1.502,54`. Mas alguns registros na base vinham em formato internacional como string float: `1502.54`.*
  > *O script antigo rodava cegamente um comando: `REPLACE(REPLACE(valor, '.', ''), ',', '.')`.*
  > *Ou seja: ele removia TODOS os pontos achando que eram separadores de milhar! Quando o número era `1502.54`, ao remover o ponto, o número virava **150254**! Uma diária de R$ 1.502,00 virou mais de cento e cinquenta mil reais na conta!*
  > *Criamos uma função inteligente de sanitização que detecta a posição da vírgula e do ponto antes de converter. O valor real consolidado de todas as diárias de 2014 a 2026 caiu de 166 milhões para **R$ 5.186.064,09**. Imagine o perigo de um relatório desse vazar com um erro desse tamanho: um desenvolvedor desatento poderia acusar um servidor público de fraude por puro bug de conversão numérica!"*

#### 🔴 Erro 2: O Regex Cego das Despesas (Banco Zerado)
* **[Gravação de Tela: Código do Parser de Despesas]**
* **FALA:**
  > *"O segundo erro foi no módulo de despesas e empenhos da prefeitura. Tínhamos baixado 156 arquivos HTML com o histórico completo de 10 anos, mas a tabela no SQLite tinha **zero registros** processados.*
  > *Por que o parser ignorava tudo?*
  > *Porque quem escreveu o coletor original esperava cabeçalhos tradicionais como `<th>Número do Empenho</th>`. Só que o sistema da ADPMNET não monta tabelas normais. Eles colocam tags `<strong>Número do empenho: </strong>` dentro de células `<td>` normais, e nos meses em que havia estornos, a página colocava um cabeçalho com a palavra 'Anulação' — o que fazia o regex descartar o arquivo inteiro como inválido!*
  > *Reescrevemos o extrator com regex tolerante a variações estruturais. Em poucos segundos de execução local, resgatamos **5.064 empenhos**, totalizando mais de **31,4 milhões de reais** em contratos e fornecedores."*

#### 🔴 Erro 3: O Mistério dos 133 Mil Contracheques com Colunas NULAS
* **[Gravação de Tela: Mostrando a tabela SQLite com campos NULL e depois populados]**
* **FALA:**
  > *"O terceiro erro foi nos contracheques. Tínhamos uma tabela com 133 mil linhas na pasta `aaaa/contracheques.db`. Só que as colunas `nome`, `matricula`, `cargo` e `lotacao` estavam todas com valor `NULL`!*
  > *O extrator antigo tentou dar match procurando por labels isoladas, como `<td>Nome:</td>`. Mas no HTML real, o sistema agregava dados na mesma string: `Matrícula/Nome : 000573.7 - Maria de Lourdes...`.*
  > *Felizmente, o autor do script antigo teve uma excelente ideia: ele salvou a string HTML bruta em uma coluna de backup chamada `campos_json`. Nós não precisamos baixar os 133 mil arquivos novamente pela internet! Escrevemos um script de reprocessamento local que leu esses JSONs brutos em memória e preencheu 100% das 133.196 pessoas, recuperando **R$ 279,7 milhões** em remunerações históricas sem gastar 1 byte de internet!"*

#### 🔴 Erro 4: O "Órgão Oculto" — A Fundação Municipal de Saúde
* **[Gráfico Explicativo: Prefeitura (ID 236) vs Fundação de Saúde (ID 241)]**
* **FALA:**
  > *"O quarto erro não foi de código, foi de regra de negócio da administração pública.*
  > *Todos os coletores estavam apontados para o código de órgão `idorg=236`, que é a Prefeitura Municipal. Só que em Arinos, toda a gestão hospitalar e atenção básica de saúde não é feita diretamente pela prefeitura, mas sim pela **Fundação Municipal de Saúde**, que é uma autarquia separada com outro CNPJ (`18.650.424/0001-67`) e outro identificador (`idorg=241`)!*
  > *Ou seja: médicos, enfermeiros, técnicos e postos de saúde estavam totalmente invisíveis na base original. Criamos um coletor dedicado para a Fundação de Saúde, baixamos todos os 165 meses retroativos de 2013 até hoje e adicionamos mais de **14.145 contracheques detalhados** ao nosso ecossistema."*

---

### BLOCO 5: A NOVA ENGENHARIA DE DADOS (10:15 - 13:45)
* **[Gravação de Tela: Exibindo `fluxo_arquitetura.html` e a estrutura de pastas limpa]**
* **FALA:**
  > *"Depois de entender onde estavam os gargalos, nós decidimos parar de fazer remendos e adotar engenharia de dados de verdade. Desenhamos uma arquitetura baseada em 4 pilares fundamentais:*
  > 
  > **1. Direct-to-SQLite (Fim dos arquivos soltos no Windows):**
  > *Em vez de criar 100 mil arquivos `.html` na pasta do Windows, o nosso novo coletor recebe o HTML da requisição, extrai os campos e grava diretamente em um banco SQLite mestre (`contracheques_detalhados_master.sqlite3`). Menos arquivos, zero degradação de disco, compactação nativa e velocidade absurda.*
  > 
  > **2. Cadeia de Custódia Forense (Valor Probatório Jurídico):**
  > *Se você vai expor dados públicos na internet, você precisa ter 100% de certeza e rastreabilidade jurídica. Se alguém perguntar: 'De onde saiu esse valor?', cada linha da nossa base contém a **URL pública original da ADPMNET**, o **timestamp exato da coleta** e o **Hash SHA-256** do documento. Se o órgão público alterar o site amanhã, nós temos a prova matemática do que estava publicado naquele instante.*
  > 
  > **3. A Regra dos 30 Meses Consecutivos Vazios:**
  > *Para coletar o passado histórico sem ficar chutando anos a esmo (e sem criar loops infinitos), implementamos um critério de parada formal: o coletor caminha mês a mês para trás (2026, 2025, 2024...). Se ele encontrar **30 meses consecutivos sem nenhum registro**, ele conclui que chegamos ao limite da série histórica digitalizada daquele órgão e encerra com segurança.*
  > 
  > **4. Node.js 24 com SQLite Nativo (Zero Dependências):**
  > *Tivemos problemas com o Python no ambiente local devido a permissões de sandbox do Windows. Em vez de perder horas configurando ambiente virtual e brigando com dependências, usamos o **Node.js 24**, que já vem com o módulo `node:sqlite` nativo (`DatabaseSync`) e `fetch` embutido! O projeto não tem nenhum `node_modules`. Você clica no `.bat` e ele roda instantaneamente em qualquer máquina."*

---

### BLOCO 6: DEMONSTRAÇÃO PRÁTICA DO NOVO PORTAL (13:45 - 16:30)
* **[Gravação de Tela Interativa: Mostrando a inicialização e o Dashboard no Navegador]**
* **FALA:**
  > *"Vamos ver tudo isso funcionando na prática?*
  > *Aqui na pasta, organizamos tudo com números para ninguém se perder: `01_ABRIR_PAINEL_AO_VIVO.bat`, `02_COLETAR_INDICES_AUDITADOS.bat`...*
  > *Ao rodar o `01_ABRIR_PAINEL_AO_VIVO.bat`, ele sobe o nosso servidor HTTP local em menos de 1 segundo e abre o navegador em `localhost:8088`.*
  > *Olha esse painel:*
  > - **180.464 registros consolidados** entre Prefeitura e Fundação de Saúde.
  > - **R$ 316.465.606,77** em dinheiro público mapeado e auditado.
  > - Gráficos interativos mostrando a distribuição salarial: Professores, Motoristas, Técnicos de Enfermagem.
  > - Ranking dos maiores credores da cidade (empresas prestadoras de serviço, postos de combustíveis, distribuidoras).
  > - Histórico de viagens e diárias sem os bugs antigos.
  > *E o mais impressionante: criamos uma aba dedicada chamada **Arquitetura & Engenharia de Dados** que mostra todo o diagrama de fluxo, desde o scraper até o banco relacional, e um simulador de busca instantânea que responde em menos de 5 milissegundos usando busca textual direta no SQLite."*

---

### BLOCO 7: CONCLUSÃO, ÉTICA & PRÓXIMOS PASSOS (16:30 - 18:00)
* **[Câmera Frontal - Plano Médio + Trilha Suave]**
* **FALA:**
  > *"Esse projeto me ensinou uma lição muito importante que quero compartilhar com você que é dev:*
  > *Trabalhar com dados públicos exige um rigor ético e técnico redobrado. Um bug de conversão de ponto flutuante em uma loja virtual pode gerar um erro no carrinho; mas um bug de conversão em dados públicos pode difamar pessoas inocentes e causar problemas judiciais.*
  > *Auditar, conferir a fonte original e criar hashes de integridade não é opcional — é obrigação de quem se propõe a usar a tecnologia em prol da transparência.*
  > *O próximo passo do nosso projeto é colocar no ar o **Novo Portal da Transparência de Arinos**, permitindo que qualquer morador da cidade pesquise contratos, salários e fornecedores pelo celular com velocidade que nenhum portal governamental oferece hoje.*
  > *Se você gostou dessa jornada de engenharia de software, deixe seu like, se inscreva no canal e me conta nos comentários: você já auditou os dados públicos da sua cidade? Vamos trocar uma ideia sobre isso!*
  > *Até o próximo vídeo, e bons códigos!"*
* **[Tela Final com Cards de Vídeos Recomendados + Redes Sociais]**

---

## 🛠️ Checklist de Gravação & Produção

- [ ] **Captura 1 (O Caos):** Gravar o Windows Explorer tentando abrir a pasta com 133k arquivos `.html`.
- [ ] **Captura 2 (O Portal Oficial):** Gravar a lentidão da ADPMNET ao selecionar um mês de 2018.
- [ ] **Captura 3 (O Bug de Moeda):** Abrir o VS Code e mostrar a linha do `REPLACE` e o valor saltando para R$ 166M.
- [ ] **Captura 4 (O Reprocessamento do JSON):** Mostrar o terminal rodando o script de extração e recuperando 133k contracheques sem internet.
- [ ] **Captura 5 (O Painel Moderno):** Gravar navegando no `index.html` e `fluxo_arquitetura.html` em tela cheia com o Dark Mode ativo.
- [ ] **Gráfico B-Roll:** Diagrama da cadeia de custódia (URL Pública ➡️ Hash SHA-256 ➡️ SQLite ➡️ API).
