# 🏛️ Portal de Transparência Pública — Arinos / MG

> **Status:** Esteira Forense Ativa • Painel em Tempo Real • Zero Dependências (`node:sqlite` nativo)  
> **Volume Auditado:** **R$ 316.465.606,77** em mais de **180.464 registros estruturados** (2013-2026).

---

## 🗂️ Estrutura Organizada do Projeto

```
portal_transparencia_arinos/
│
├── 📂 conteudo_documentario/            # Materiais de produção audiovisual
│   ├── 00_LEIA-ME_CONTEUDO.txt          # Guia da pasta de conteúdo
│   ├── ROTEIRO_YOUTUBE_CASO_ARINOS.md   # Roteiro cena a cena para vídeo no YouTube
│   └── PROMPTS_IA_EDICAO_DOCUMENTARIO.md# Prompts p/ Runway, Sora, Midjourney, ElevenLabs, Suno
│
├── 📂 dados/                            # Camada de Armazenamento & SQLite Master
│   ├── auditoria/                       # Cadeia de custódia (HTMLs brutos e logs SHA-256)
│   ├── fundacao_saude/                  # 165 meses de índices da Fundação de Saúde (ID 241)
│   ├── arinos_transparencia_master.sqlite3 # Banco de Dados Relacional Unificado
│   ├── contracheques_detalhados_master.sqlite3 # Holerites individuais com rubricas
│   ├── status_coleta.json               # Status ao vivo do progresso por módulo
│   └── resumo_geral.json                # Snapshot executivo do dashboard
│
├── 📂 scripts/                          # Motores de Extração e Servidor (Node.js 24)
│   ├── extrator_unificado.js            # Motor master de coleta retroativa com critério dos 30 vazios
│   ├── coletor_contracheques_detalhados.js # Extrator direct-to-sqlite de holerites individuais
│   ├── atualizar_dashboard.js           # Sincronizador de métricas analíticas
│   └── servidor_painel.js               # Servidor HTTP ultraleve porta 8088 com API /api/live
│
├── 📂 feitos/                           # Arquivamento automático de scripts concluídos
│   └── 00_LEIA-ME_FEITOS.txt            # Instruções sobre os scripts finalizados
│
├── 📄 index.html                        # Dashboard Executivo ao Vivo (Dark Mode / Auto-sync 2.5s)
├── 📄 fluxo_arquitetura.html            # Diagrama arquitetural e simulador de busca < 5ms
├── 📄 00_LEIA-ME_ORDEM_DOS_SCRIPTS.txt  # Dicionário explicativo de cada arquivo .bat
│
├── ⚙️ 01_ABRIR_PAINEL_AO_VIVO.bat        # [FIXO] Abre o painel em http://localhost:8088
├── ⚙️ 02_EXTRAIR_TUDO_DE_UMA_VEZ.bat     # [MESTRE] Extrai todos os 6 módulos em sequência
├── ⚙️ 03_EXTRAIR_FOLHA_PREFEITURA.bat    # Folha da Prefeitura (ID 236)
├── ⚙️ 04_EXTRAIR_FOLHA_SAUDE.bat         # Folha da Saúde (ID 241)
├── ⚙️ 05_EXTRAIR_DESPESAS_PREFEITURA.bat # Despesas da Prefeitura (ID 236)
├── ⚙️ 06_EXTRAIR_DESPESAS_SAUDE.bat      # Despesas da Saúde (ID 241)
├── ⚙️ 07_EXTRAIR_DIARIAS_PREFEITURA.bat  # Diárias da Prefeitura (Moeda corrigida)
├── ⚙️ 08_EXTRAIR_DIARIAS_SAUDE.bat       # Diárias da Saúde (ID 241)
└── ⚙️ 09_EXTRAIR_CONTRACHEQUES_DETALHADOS.bat # Holerites detalhados (rubricas de proventos/descontos)
```

---

## ⚡ Como Operar o Projeto

1. **Monitoramento:** Dê 2 cliques em `01_ABRIR_PAINEL_AO_VIVO.bat` para iniciar o servidor local e abrir o painel em seu navegador.
2. **Extração Total:** Dê 2 cliques em `02_EXTRAIR_TUDO_DE_UMA_VEZ.bat` para iniciar a coleta e sanitização de toda a série histórica.
3. **Extração Modular:** Execute os scripts de `03` a `09` individualmente. Conforme cada um conclui, ele é **automaticamente transferido para a pasta `feitos/`**, mantendo sua área de trabalho limpa.
4. **Criação de Conteúdo:** Acesse a pasta `conteudo_documentario/` para visualizar o roteiro completo e copiar os prompts de inteligência artificial.
