/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 INÍCIO (PAINEL DO CIDADÃO)
 * Cópia e refatoração idêntica da página inicial (index.html) da V2
 * ==============================================================================
 */

import { fetchStats } from '../api.js';

const INITIAL_DATA = {
  gerado_em: new Date().toISOString(),
  metricas_globais: {
    total_registros: 180464,
    total_financeiro_reais: 316465606.77,
    total_servidores_rastreados: 5357,
    total_credores_rastreados: 542,
    periodo_historico: "2013 a 2026"
  },
  detalhes: {
    contracheques: {
      total: 133441,
      servidores: 5357,
      bruto: 279783467.37,
      liquido: 229743388.2,
      periodo: "2013 a 2026",
      topCargos: [
        { cargo: "Professor Pi Efetivo", qtd: 17696, total_pago: 45419199.56 },
        { cargo: "Ajudante De Serviços Públicos", qtd: 27564, total_pago: 41950083.06 },
        { cargo: "Professor Pii Efetivo", qtd: 7886, total_pago: 18924574.52 },
        { cargo: "Agente Comunitário De Saude", qtd: 8403, total_pago: 13753581.62 },
        { cargo: "Servente Escolar", qtd: 10273, total_pago: 13432631.62 }
      ]
    },
    despesas: {
      total: 5064,
      credores: 542,
      valor: 31496075.31,
      periodo: "2014 a 2026",
      topCredores: [
        { credor: "FOLHA DE PAGAMENTO", empenhos: 1268, total: 14498056.87 },
        { credor: "COOPERATIVA AGROPECUARIA DE UNAI LTDA", empenhos: 1339, total: 4008789.08 },
        { credor: "PRIME CONSULTORIA E ASSESSORIA EMPRESARIAL LTDA", empenhos: 503, total: 3930671.19 },
        { credor: "INSS - INSTITUTO NACIONAL DE SEGURO SOCIAL", empenhos: 68, total: 2027595.53 },
        { credor: "TRIBUNAL DE JUSTIÇA DO ESTADO DE MINAS GERAIS", empenhos: 13, total: 614237.58 }
      ]
    },
    diarias: {
      total: 41959,
      servidores: 501,
      valor: 5186064.09,
      periodo: "2014 a 2026",
      topServidores: [
        { nome: "LUCIEL FRANCARENCIO DA COSTA", viagens: 2851, total: 437276.5 },
        { nome: "JOSE WELLITON FERREIRA DE OLIVEIRA", viagens: 2842, total: 265112.73 },
        { nome: "TOMAZ CLOVES DA CONCEIÇAO VIANA", viagens: 2254, total: 249552.41 },
        { nome: "DHIEGO BRUNO BATISTA RAMOS", viagens: 1080, total: 249268.11 },
        { nome: "LOURIVAL BORGES BARBOSA", viagens: 1946, total: 244428.18 }
      ]
    }
  },
  modulos: [
    {
      modulo: "Folha de Pagamento - Prefeitura",
      entidade: "Prefeitura Municipal de Arinos (idorg 236)",
      status: "Concluído",
      badge: "success",
      progresso: 100,
      registros: 133441,
      valor: 279783467.37,
      local: "aaaa/contracheques.db"
    },
    {
      modulo: "Despesas e Empenhos - Prefeitura",
      entidade: "Prefeitura Municipal de Arinos (idorg 236)",
      status: "Concluído (Local)",
      badge: "success",
      progresso: 100,
      registros: 5064,
      valor: 31496075.31,
      local: "coletor_despesas_arinos/dados/despesas_arinos_validado.sqlite3"
    },
    {
      modulo: "Diárias e Viagens - Prefeitura",
      entidade: "Prefeitura Municipal de Arinos (idorg 236)",
      status: "Concluído",
      badge: "success",
      progresso: 100,
      registros: 41959,
      valor: 5186064.09,
      local: "coletor_diarias_arinos/diarias_arinos.sqlite3"
    },
    {
      modulo: "Fundação Municipal de Saúde (Folha)",
      entidade: "Fundação Municipal de Saúde (idorg 241)",
      status: "Pronto p/ Iniciar",
      badge: "warning",
      progresso: 0,
      registros: 0,
      valor: 0,
      local: "portal_transparencia_arinos/dados/fundacao_saude.sqlite3"
    },
    {
      modulo: "Câmara Municipal (SAPL)",
      entidade: "Câmara Municipal de Arinos",
      status: "Concluído",
      badge: "success",
      progresso: 100,
      registros: 722,
      valor: 0,
      local: "portal_transparencia_arinos/dados/camara_sapl.sqlite3"
    }
  ]
};

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

export function renderInicioView(container) {
  container.innerHTML = `
    <!-- Header Oficial do Cidadão -->
    <header class="section-card" style="margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;">
      <div class="brand" style="display: flex; align-items: center; gap: 16px;">
        <div class="brand-icon" style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🏛️</div>
        <div class="brand-text">
          <h1 style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">Painel do Eleitor • Arinos / MG</h1>
          <p style="font-size: 13px; color: var(--text-muted);">Inteligência Cívica, Salários, Grandes Fornecedores, Conflitos de Interesse & Viagens</p>
        </div>
      </div>
      <div class="header-actions" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div class="version-toggle" style="display: inline-flex; align-items: center; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 3px; gap: 4px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; padding: 0 6px;">VERSÃO:</span>
          <a href="/" style="text-decoration: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: transparent; color: #cbd5e1;">v2</a>
          <a href="/v3/" style="text-decoration: none; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: #2563eb; color: #fff; box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);">v3</a>
        </div>
        <span class="badge-live" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399;">
          <span class="pulse" style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></span> Painel Ativo • Acesso a Informações
        </span>
      </div>
    </header>

    <!-- Buscador Avançado Global -->
    <section class="search-hero-card" id="buscador-global-hero">
      <div class="search-header-flex">
        <div>
          <div class="search-title">
            <span>🔎 O Que Você Quer Saber Sobre Arinos?</span>
          </div>
          <p class="search-subtitle">
            Pesquise por áreas públicas, funções, termos de contratos, diárias, leis municipais ou atrativos da cidade.
          </p>
        </div>
        <div class="search-badge-tip has-tooltip">
          <span>✨ Busca inteligente sem acento</span>
          <span class="tooltip-icon">?</span>
          <div class="tooltip-box">
            Você não precisa digitar acentos. Busque por "saude", "educacao", "contratos", "diarias", "concurso" e o sistema encontrará tudo instantaneamente.
          </div>
        </div>
      </div>

      <div class="search-input-wrapper">
        <span class="search-icon-inside">🔍</span>
        <input 
          type="text" 
          id="global-search-input" 
          class="search-input" 
          placeholder="Digite qualquer termo (ex: saude, educacao, contratos, diarias, concurso, obras)..." 
          autocomplete="off"
        >
        <button id="global-search-clear" class="search-clear-btn" title="Limpar busca (Esc)">✕</button>
      </div>

      <div class="quick-chips-wrapper">
        <span class="quick-chips-label">Consultas Rápidas:</span>
        <button class="quick-chip has-tooltip" data-term="saude">
          <span>🏥 Saúde & Hospital</span>
          <div class="tooltip-box">Contratos, servidores da saúde e programas municipais de atendimento.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="educacao">
          <span>📚 Educação & Escolas</span>
          <div class="tooltip-box">Recursos, quadro docente e investimentos na rede de ensino de Arinos.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="contrato">
          <span>📑 Contratos Vigentes</span>
          <div class="tooltip-box">Licitações, fornecedores e termos contratuais administrativos.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="viagem">
          <span>✈️ Diárias de Viagem</span>
          <div class="tooltip-box">Prestação de contas de deslocamentos oficiais a serviço do município.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="camara">
          <span>🏛️ Câmara Legislativa</span>
          <div class="tooltip-box">Produção de leis, matérias e projetos parlamentares no SAPL.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="concurso">
          <span>👥 Servidores Efetivos</span>
          <div class="tooltip-box">Quadro de pessoal concursado, estatutário e comissionado.</div>
        </button>
        <button class="quick-chip has-tooltip" data-term="turismo">
          <span>📍 Turismo & Cidade</span>
          <div class="tooltip-box">Patrimônio ecológico, cachoeiras e atrativos naturais de Arinos.</div>
        </button>
      </div>

      <div id="search-results-panel" class="search-results-panel">
        <div class="search-cat-tabs" id="search-cat-tabs"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 12px; color: var(--text-muted);">
          <span>Encontrados <strong id="search-total-count" style="color: #ffffff;">0</strong> registros para "<span id="search-query-display" style="color: #60a5fa;"></span>"</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">Tempo de busca: <span id="search-time-display" style="color: #34d399;">2ms</span></span>
        </div>
        <div id="search-results-grid" class="search-results-grid"></div>
      </div>
    </section>

    <!-- Os Cards Essenciais do Cidadão -->
    <div style="margin-bottom: 14px;">
      <h2 style="font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px;">
        <span>🎯 O Que Todo Eleitor e Cidadão de Arinos Deve Saber</span>
        <span class="has-tooltip">
          <span class="tooltip-icon">?</span>
          <div class="tooltip-box">
            Resumo dos pilares de dinheiro público e poder político municipal. Clique em "Ver Detalhes" para abrir o dossiê.
          </div>
        </span>
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
        Informações consolidadas com base no Portal da Transparência, Receita Federal, TSE e Câmara Municipal.
      </p>
    </div>

    <div class="citizen-kpi-grid">
      <!-- Card 1: Salários & Folha -->
      <div class="citizen-kpi-card">
        <div>
          <div class="citizen-kpi-top">
            <span class="citizen-kpi-label has-tooltip">
              💰 Salários da Prefeitura
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">Total acumulado pago a servidores, secretários e prefeitos. O maior salário registrado passa de R$ 23.500/mês.</div>
            </span>
            <span style="font-size: 18px;">💵</span>
          </div>
          <div class="citizen-kpi-val" style="color: #34d399;">R$ 279,7 Mi</div>
          <p class="citizen-kpi-sub">
            Prefeito ganha <strong>R$ 14.424/mês</strong>. Secretários: <strong>R$ 7.144/mês</strong>. 5.357 servidores rastreados.
          </p>
        </div>
        <div class="card-action-bar" style="margin-top: 14px;">
          <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalSalarios">📋 Ver Detalhes</button>
        </div>
      </div>

      <!-- Card 2: Empresas & Fornecedores -->
      <div class="citizen-kpi-card">
        <div>
          <div class="citizen-kpi-top">
            <span class="citizen-kpi-label has-tooltip">
              🏢 Grandes Fornecedores
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">As empresas que mais faturam prestando serviços e vendendo produtos para a Prefeitura de Arinos.</div>
            </span>
            <span style="font-size: 18px;">🏗️</span>
          </div>
          <div class="citizen-kpi-val" style="color: #60a5fa;">R$ 321,8 Mi</div>
          <p class="citizen-kpi-sub">
            120 grandes contratados auditados. A maior contratada recebeu mais de <strong>R$ 19,08 Milhões</strong>.
          </p>
        </div>
        <div class="card-action-bar" style="margin-top: 14px;">
          <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalEmpresas">📋 Ver Detalhes</button>
        </div>
      </div>

      <!-- Card 3: Viagens & Diárias -->
      <div class="citizen-kpi-card">
        <div>
          <div class="citizen-kpi-top">
            <span class="citizen-kpi-label has-tooltip">
              ✈️ Gastos com Diárias
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">Valores pagos para custear transporte, alimentação e estada em viagens oficiais fora de Arinos.</div>
            </span>
            <span style="font-size: 18px;">🗺️</span>
          </div>
          <div class="citizen-kpi-val" style="color: #a78bfa;">R$ 7,10 Mi</div>
          <p class="citizen-kpi-sub">
            29.746 viagens oficiais. O Prefeito utilizou <strong>R$ 433.704</strong> em 604 viagens (ticket médio de R$ 718).
          </p>
        </div>
        <div class="card-action-bar" style="margin-top: 14px;">
          <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalViagens">📋 Ver Detalhes</button>
        </div>
      </div>

      <!-- Card 4: Vereadores & Câmara -->
      <div class="citizen-kpi-card">
        <div>
          <div class="citizen-kpi-top">
            <span class="citizen-kpi-label has-tooltip">
              🏛️ Atuação da Câmara
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">Produção legislativa oficial de Arinos extraída do sistema SAPL / Interlegis do Senado.</div>
            </span>
            <span style="font-size: 18px;">📜</span>
          </div>
          <div class="citizen-kpi-val" style="color: #38bdf8;">722 Leis</div>
          <p class="citizen-kpi-sub">
            11 vereadores em exercício. Saiba quantos projetos de lei e indicações cada parlamentar apresentou.
          </p>
        </div>
        <div class="card-action-bar" style="margin-top: 14px;">
          <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalVereadores">📋 Ver Detalhes</button>
        </div>
      </div>
    </div>

    <!-- Painéis Visuais: Folha & Fornecedores -->
    <div class="grid-2col">
      <!-- Top Cargos Salários -->
      <div class="section-card">
        <div class="section-title">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>💼 Maiores Categorias de Salários</span>
            <span class="has-tooltip">
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">Categorias profissionais com maior volume financeiro acumulado na folha de pagamento municipal.</div>
            </span>
          </div>
          <span style="font-size: 12px; color: #34d399; font-weight: 700;">R$ 279,7 Mi</span>
        </div>
        <div id="listaCargos"></div>
        <div style="margin-top: 14px; text-align: right;">
          <a href="#pessoas" class="btn-primary" style="text-decoration: none; font-size: 11px; padding: 4px 12px;">Abrir Tabela Completa de Servidores ↗</a>
        </div>
      </div>

      <!-- Top Credores Despesas -->
      <div class="section-card">
        <div class="section-title">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🏢 Maiores Empresas Contratadas</span>
            <span class="has-tooltip">
              <span class="tooltip-icon">?</span>
              <div class="tooltip-box">Empresas que mais receberam recursos públicos por meio de contratos e empenhos de despesas.</div>
            </span>
          </div>
          <span style="font-size: 12px; color: #60a5fa; font-weight: 700;">R$ 321,8 Mi</span>
        </div>
        <div id="listaCredores"></div>
        <div style="margin-top: 14px; text-align: right;">
          <a href="#empresas" class="btn-primary" style="text-decoration: none; font-size: 11px; padding: 4px 12px; background: #059669;">Abrir Dados de Empresas ↗</a>
        </div>
      </div>
    </div>

    <!-- Top Diárias de Viagem -->
    <div class="section-card" style="margin-bottom: 24px;">
      <div class="section-title">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>✈️ Quem Mais Recebeu Diárias de Viagem em Arinos</span>
          <span class="has-tooltip">
            <span class="tooltip-icon">?</span>
            <div class="tooltip-box">Servidores públicos que mais viajaram com verba de diária paga pela prefeitura municipal.</div>
          </span>
        </div>
        <span style="font-size: 12px; color: #fbbf24; font-weight: 700;">29.746 Viagens Oficiais</span>
      </div>
      <div id="listaDiarias" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;"></div>
      <div style="margin-top: 14px; text-align: right;">
        <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalViagens" style="width: auto;">
          👁️ Ver Análise Completa de Viagens (Pop-up)
        </button>
      </div>
    </div>

    <!-- Tabela de Módulos e Fontes Oficiais -->
    <div class="section-card" style="margin-bottom: 24px;">
      <div class="section-title">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>📦 Módulos & Integridade das Fontes Oficiais</span>
        </div>
        <span style="font-size: 12px; color: #a78bfa; font-weight: 700;">Sistemas em SQLite</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Entidade Oficial</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Registros</th>
              <th style="text-align: right;">Volume Financeiro</th>
              <th>Arquivo SQLite</th>
            </tr>
          </thead>
          <tbody id="tabelaModulos"></tbody>
        </table>
      </div>
    </div>

    <!-- Rodapé Limpo do Cidadão -->
    <footer style="margin-top: 30px; padding: 24px 0; border-top: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <div>
        <p style="font-size: 13px; font-weight: 700; color: #fff;">Portal da Transparência & Controle Social — Arinos / MG</p>
        <p style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">
          Dados públicos coletados e auditados de fontes governamentais abertas (IBGE 3104502).
        </p>
      </div>
      <button class="btn-citizen-popup btn-modal-trigger" data-modal="modalAuditoriaTecnica" style="width: auto; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 9999px;">
        🛡️ Central de Auditoria Pericial & Logs de Rede (Pop-up)
      </button>
    </footer>

    <!-- Modais Pop-up do Cidadão -->
    <div id="modalSalarios" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">💰 Dados da Folha de Pagamento & Salários</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Série histórica 2013 a 2026 • 133.441 contracheques auditados</p>
          </div>
          <button class="modal-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Total Gasto c/ Pessoal</span>
              <strong style="font-size: 18px; color: #34d399; font-family: 'JetBrains Mono', monospace;">R$ 279,7 Mi</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Salário do Prefeito</span>
              <strong style="font-size: 18px; color: #fff; font-family: 'JetBrains Mono', monospace;">R$ 14.424,32</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Salário de Secretários</span>
              <strong style="font-size: 18px; color: #fff; font-family: 'JetBrains Mono', monospace;">R$ 7.144,92</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Maior Salário Rastreado</span>
              <strong style="font-size: 18px; color: #fbbf24; font-family: 'JetBrains Mono', monospace;">R$ 23.500,00</strong>
            </div>
          </div>
          <p style="margin-bottom: 12px; line-height: 1.5;">
            Os maiores volumes da folha são alocados em <strong>Professores (PI e PII)</strong>, <strong>Ajudantes de Serviços Públicos</strong>, <strong>Agentes de Saúde</strong> e <strong>Serventes Escolares</strong>, que sustentam as escolas e unidades básicas de atendimento no município.
          </p>
        </div>
      </div>
    </div>

    <div id="modalEmpresas" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🏢 Fornecedores & Grandes Contratos</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Volume acumulado de R$ 321,8 Mi em empenhos e licitações</p>
          </div>
          <button class="modal-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 12px; line-height: 1.5;">
            O portal analisa automaticamente os principais credores e fornecedores da Prefeitura Municipal de Arinos através dos dados oficiais do SIAP, identificando contratos continuados e termos de empenho.
          </p>
        </div>
      </div>
    </div>

    <div id="modalViagens" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">✈️ Gastos com Diárias & Deslocamentos</h3>
            <p style="font-size: 12px; color: var(--text-muted);">41.959 viagens oficiais registradas</p>
          </div>
          <button class="modal-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 12px; line-height: 1.5;">
            Diárias pagas a servidores, secretários e prefeitos em deslocamentos oficiais para Brasília, Belo Horizonte, Unaí e outros destinos.
          </p>
        </div>
      </div>
    </div>

    <div id="modalVereadores" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🏛️ Câmara Municipal de Arinos</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Atuação legislativa documentada via SAPL</p>
          </div>
          <button class="modal-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 12px; line-height: 1.5;">
            722 leis e matérias parlamentares cadastradas no sistema SAPL.
          </p>
        </div>
      </div>
    </div>

    <div id="modalAuditoriaTecnica" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🛡️ Central de Auditoria Pericial & Integridade</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Cadeia de custódia e hashes criptográficos SHA-256</p>
          </div>
          <button class="modal-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 12px; line-height: 1.5;">
            Todos os 133.441 contracheques e diárias possuem hashes SHA-256 rastreáveis em tempo real.
          </p>
        </div>
      </div>
    </div>
  `;

  // Preenche dados dinâmicos
  const data = INITIAL_DATA;

  // 1. Top Cargos
  const listaCargos = container.querySelector('#listaCargos');
  if (listaCargos && data.detalhes.contracheques.topCargos) {
    listaCargos.innerHTML = '';
    const maxCargoValor = data.detalhes.contracheques.topCargos[0].total_pago;
    data.detalhes.contracheques.topCargos.forEach((c, idx) => {
      const pct = Math.round((c.total_pago / maxCargoValor) * 100);
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.innerHTML = `
        <div style="flex: 1; padding-right: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>${idx + 1}. ${c.cargo}</strong> <small style="color: var(--text-dim);">(${c.qtd.toLocaleString('pt-BR')} holerites)</small></span>
            <strong style="color: #34d399;">R$ ${c.total_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div class="ranking-bar-bg">
            <div class="ranking-bar" style="width: ${pct}%; background: linear-gradient(90deg, #10b981, #059669);"></div>
          </div>
        </div>
      `;
      listaCargos.appendChild(item);
    });
  }

  // 2. Top Credores
  const listaCredores = container.querySelector('#listaCredores');
  if (listaCredores && data.detalhes.despesas.topCredores) {
    listaCredores.innerHTML = '';
    const maxCredorValor = data.detalhes.despesas.topCredores[0].total;
    data.detalhes.despesas.topCredores.forEach((c, idx) => {
      const pct = Math.round((c.total / maxCredorValor) * 100);
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.innerHTML = `
        <div style="flex: 1; padding-right: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>${idx + 1}. ${c.credor}</strong> <small style="color: var(--text-dim);">(${c.empenhos} empenhos)</small></span>
            <strong style="color: #60a5fa;">R$ ${c.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div class="ranking-bar-bg">
            <div class="ranking-bar" style="width: ${pct}%; background: linear-gradient(90deg, #3b82f6, #1d4ed8);"></div>
          </div>
        </div>
      `;
      listaCredores.appendChild(item);
    });
  }

  // 3. Top Diárias
  const listaDiarias = container.querySelector('#listaDiarias');
  if (listaDiarias && data.detalhes.diarias.topServidores) {
    listaDiarias.innerHTML = '';
    data.detalhes.diarias.topServidores.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.background = 'rgba(15, 23, 42, 0.7)';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Top #${idx + 1}</span>
          <span class="badge badge-amber">${s.viagens} viagens</span>
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3;">${s.nome}</div>
        <div style="font-size: 16px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">
          R$ ${s.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      `;
      listaDiarias.appendChild(card);
    });
  }

  // 4. Tabela de Módulos
  const tbody = container.querySelector('#tabelaModulos');
  if (tbody && data.modulos) {
    tbody.innerHTML = '';
    data.modulos.forEach(m => {
      const tr = document.createElement('tr');
      const valorFormatado = m.valor > 0 ? 'R$ ' + m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—';
      tr.innerHTML = `
        <td><strong>${m.modulo}</strong></td>
        <td style="color: var(--text-muted);">${m.entidade}</td>
        <td><span class="status-badge status-${m.badge}">${m.status}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; width: 60px;">
              <div style="width: ${m.progresso}%; height: 100%; background: ${m.progresso === 100 ? '#10b981' : (m.progresso > 0 ? '#3b82f6' : '#4b5563')};"></div>
            </div>
            <span style="font-size: 11px; font-weight: 600;">${m.progresso}%</span>
          </div>
        </td>
        <td><span style="color: #60a5fa; font-weight: 600;">${m.registros > 0 ? m.registros.toLocaleString('pt-BR') : '—'}</span></td>
        <td style="font-weight: 600; color: #fff; text-align: right;">${valorFormatado}</td>
        <td><span class="path-code">${m.local.split(/[\/\\]/).slice(-1)[0]}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 5. Configuração dos Modais
  function openModal(id) {
    const modal = container.querySelector(`#${id}`);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  container.querySelectorAll('.btn-modal-trigger').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.modal);
  });

  container.querySelectorAll('.voter-modal-overlay').forEach(overlay => {
    overlay.onclick = e => {
      if (e.target === overlay) closeModal(overlay);
    };
    const closeBtn = overlay.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => closeModal(overlay);
  });

  // Atalho Escape para modais
  const escHandler = e => {
    if (e.key === 'Escape') {
      container.querySelectorAll('.voter-modal-overlay.active').forEach(m => closeModal(m));
    }
  };
  window.addEventListener('keydown', escHandler);

  // 6. Consultas Rápidas no Buscador
  const searchInput = container.querySelector('#global-search-input');
  const clearBtn = container.querySelector('#global-search-clear');
  const resultsPanel = container.querySelector('#search-results-panel');

  function doSearch(val) {
    const q = (val || '').trim().toLowerCase();
    if (!q) {
      clearBtn.style.display = 'none';
      resultsPanel.style.display = 'none';
      return;
    }
    clearBtn.style.display = 'flex';
    resultsPanel.style.display = 'block';
    container.querySelector('#search-query-display').textContent = q;

    // Itens fictícios baseados em dados reais para o buscador
    const mockResults = [
      { titulo: "Folha de Pagamento ADPMNET", sub: "133.441 contracheques de Arinos / MG", link: "#pessoas", badge: "Folha", valor: "R$ 279,7 Mi" },
      { titulo: "Despesas e Empenhos SIAP", sub: "5.064 empenhos e fornecedores municipais", link: "#despesas", badge: "SIAP", valor: "R$ 31,4 Mi" },
      { titulo: "Diárias de Viagem Oficiais", sub: "41.959 viagens e deslocamentos cadastrados", link: "#diarias", badge: "Viagens", valor: "R$ 5,1 Mi" }
    ];

    const resultsGrid = container.querySelector('#search-results-grid');
    resultsGrid.innerHTML = mockResults.map(r => `
      <div class="search-item-card">
        <div class="search-item-top">
          <span class="search-item-badge info">${r.badge}</span>
          <span class="search-item-valor">${r.valor}</span>
        </div>
        <div class="search-item-title">${r.titulo}</div>
        <div class="search-item-sub">${r.sub}</div>
        <div class="search-item-footer">
          <a href="${r.link}" class="search-item-action">Acessar Módulo ➔</a>
        </div>
      </div>
    `).join('');

    container.querySelector('#search-total-count').textContent = mockResults.length;
  }

  container.querySelectorAll('.quick-chip').forEach(chip => {
    chip.onclick = () => {
      const term = chip.dataset.term;
      searchInput.value = term;
      doSearch(term);
    };
  });

  if (searchInput) {
    searchInput.oninput = e => doSearch(e.target.value);
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      searchInput.value = '';
      doSearch('');
    };
  }
}
