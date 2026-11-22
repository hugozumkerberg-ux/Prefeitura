const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
const backupPath = path.resolve(__dirname, '..', 'index.html.bak');

const original = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(backupPath, original, 'utf8');
console.log('[+] Backup criado em:', backupPath);

// Define clean replacement for main container content
const cleanHtml = `
    <!-- Header Oficial do Cidadão -->
    <header>
      <div class="brand">
        <div class="brand-icon">🏛️</div>
        <div class="brand-text">
          <h1>Painel do Eleitor • Arinos / MG</h1>
          <p>Inteligência Cívica, Salários, Grandes Fornecedores, Conflitos de Interesse & Viagens</p>
        </div>
      </div>
      <div class="header-actions">
        <a href="empresas.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; box-shadow: 0 0 20px rgba(37, 99, 235, 0.4); border: 1px solid #60a5fa; transition: all 0.2s;">
          🏢 Empresas & Sócios ↗
        </a>
        <a href="vereadores.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; box-shadow: 0 0 20px rgba(14, 165, 233, 0.4); border: 1px solid #38bdf8; transition: all 0.2s;">
          👥 Vereadores (SAPL) ↗
        </a>
        <a href="eleicoes.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); border: 1px solid #818cf8; transition: all 0.2s;">
          🗳️ Eleições TSE ↗
        </a>
        <a href="mandatos.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; border: 1px solid #a78bfa; transition: all 0.2s;">
          📜 Mandatos ↗
        </a>
        <a href="cidade.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; border: 1px solid #fbbf24; transition: all 0.2s;">
          📍 Turismo & História ↗
        </a>
        <a href="tabelas.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: 1px solid #34d399; transition: all 0.2s;">
          📊 Tabelas (240k) ↗
        </a>
        <button onclick="openVoterModal('modalAuditoriaTecnica')" class="nav-btn" style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; border-radius: 9999px; cursor: pointer; transition: all 0.2s;">
          ⚙️ Auditoria & Logs (Pop-up)
        </button>
      </div>
    </header>

    <!-- ============================================================
         BUSCADOR AVANÇADO GLOBAL (TRATAMENTO SEM ACENTOS & MULTI-MÓDULO)
         ============================================================ -->
    <section class="search-hero-card" id="buscador-global-hero">
      <div class="search-header-flex">
        <div>
          <div class="search-title">
            <span>🔎 O Que Você Quer Saber Sobre Arinos?</span>
          </div>
          <p class="search-subtitle">
            Digite nomes de servidores, políticos, secretários, empresas contratadas, obras, leis ou pontos turísticos.
          </p>
        </div>
        <div class="search-badge-tip has-tooltip">
          <span>✨ Busca inteligente sem acento</span>
          <span class="tooltip-icon">?</span>
          <div class="tooltip-box">
            Você não precisa digitar acentos. Busque por "saude", "unai", "duraes", "roberto" e o sistema encontrará tudo instantaneamente.
          </div>
        </div>
      </div>

      <!-- Barra de Input -->
      <div class="search-input-wrapper">
        <span class="search-icon-inside">🔍</span>
        <input 
          type="text" 
          id="global-search-input" 
          class="search-input" 
          placeholder="Digite qualquer termo (ex: saude, unai, roberto sales, duraes, motorista, vieira, boi preto)..." 
          autocomplete="off"
          oninput="handleGlobalSearch(this.value)"
        >
        <button id="global-search-clear" class="search-clear-btn" onclick="clearGlobalSearch()" title="Limpar busca (Esc)">
          ✕
        </button>
      </div>

      <!-- Pílulas de Atalhos Rápidos -->
      <div class="quick-chips-wrapper">
        <span class="quick-chips-label">Atalhos do Eleitor:</span>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('saude')">
          <span>🏥 Saúde & Hospital</span>
          <div class="tooltip-box">Contratos, servidores da saúde e nova maternidade municipal.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('unai')">
          <span>📍 Unaí & Regional</span>
          <div class="tooltip-box">Cooperativa Unaí (R$ 19 Mi) e 29 viagens oficiais para a GRS Unaí.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('duraes')">
          <span>🏢 Durães e Azevedo</span>
          <div class="tooltip-box">Empresa contratada por R$ 12,8 Mi e vereadores de Arinos.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('soraya')">
          <span>⚠️ Soraya (Vínculo)</span>
          <div class="tooltip-box">Secretária Municipal de Saúde e sócia de clínica contratada pelo município.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('roberto sales')">
          <span>👔 Roberto Sales</span>
          <div class="tooltip-box">Ex-prefeito municipal: holerites e 286 viagens oficiais a Brasília e BH.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('motorista')">
          <span>🚗 Motoristas</span>
          <div class="tooltip-box">Cargos operacionais com grande volume de viagens de apoio e ambulâncias.</div>
        </button>
        <button class="quick-chip has-tooltip" onclick="quickGlobalSearch('boi preto')">
          <span>🌊 Cachoeira Boi Preto</span>
          <div class="tooltip-box">Ponto turístico a 74,3 km do centro com 65m de queda livre.</div>
        </button>
      </div>

      <!-- Painel de Resultados Dinâmicos -->
      <div id="search-results-panel" class="search-results-panel">
        <div class="search-cat-tabs" id="search-cat-tabs"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 12px; color: var(--text-muted);">
          <span>Encontrados <strong id="search-total-count" style="color: #ffffff;">0</strong> registros para "<span id="search-query-display" style="color: #60a5fa;"></span>"</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">Tempo de busca: <span id="search-time-display" style="color: #34d399;">0ms</span></span>
        </div>
        <div id="search-results-grid" class="search-results-grid"></div>
      </div>
    </section>

    <!-- ============================================================
         OS 5 CARDS ESSENCIAIS DO ELEITOR (CLEAN, TOOLTIPS & POPUPS)
         ============================================================ -->
    <div style="margin-bottom: 14px;">
      <h2 style="font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px;">
        <span>🎯 O Que Todo Eleitor e Cidadão de Arinos Deve Saber</span>
        <span class="has-tooltip">
          <span class="tooltip-icon">?</span>
          <div class="tooltip-box">
            Resumo dos 5 grandes pilares de dinheiro público e poder político municipal. Clique em "Ver Detalhes" para abrir a explicação em pop-up.
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
        <button onclick="openVoterModal('modalSalarios')" class="btn-citizen-popup">
          👁️ Ver Detalhes dos Salários (Pop-up)
        </button>
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
        <button onclick="openVoterModal('modalEmpresas')" class="btn-citizen-popup">
          👁️ Ver Top Empresas (Pop-up)
        </button>
      </div>

      <!-- Card 3: Alertas de Vínculos / Conflitos -->
      <div class="citizen-kpi-card highlight-warning">
        <div>
          <div class="citizen-kpi-top">
            <span class="citizen-kpi-label has-tooltip" style="color: #fbbf24;">
              ⚠️ Vínculos de Sócios
              <span class="tooltip-icon" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">?</span>
              <div class="tooltip-box">Cruzamento da Receita Federal: identificamos sócios de empresas contratadas que são Secretários, Diretores ou Candidatos.</div>
            </span>
            <span style="font-size: 18px;">🚨</span>
          </div>
          <div class="citizen-kpi-val" style="color: #fbbf24;">11 Casos</div>
          <p class="citizen-kpi-sub">
            Inclui a Secretária de Saúde, Chefe de Estradas e Diretores Clínicos sócios de firmas fornecedoras.
          </p>
        </div>
        <button onclick="openVoterModal('modalAlertas')" class="btn-citizen-popup" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #fbbf24;">
          👁️ Ver Casos de Vínculo (Pop-up)
        </button>
      </div>

      <!-- Card 4: Viagens & Diárias -->
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
        <button onclick="openVoterModal('modalViagens')" class="btn-citizen-popup">
          👁️ Ver Quem Mais Viajou (Pop-up)
        </button>
      </div>

      <!-- Card 5: Vereadores & Câmara -->
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
        <button onclick="openVoterModal('modalVereadores')" class="btn-citizen-popup">
          👁️ Ver Atuação dos Vereadores (Pop-up)
        </button>
      </div>

    </div>

    <!-- ============================================================
         PAINÉIS VISUAIS LIMPOS: FOLHA & FORNECEDORES (SEM POLUIÇÃO)
         ============================================================ -->
    <div class="grid-2col" style="margin-bottom: 24px;">
      
      <!-- Top Cargos Salários -->
      <div class="section-card" style="margin-bottom: 0;">
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
          <a href="/tabelas.html" target="_blank" class="nav-btn" style="text-decoration: none; font-size: 11px; padding: 4px 12px;">Abrir Tabela Completa de Servidores ↗</a>
        </div>
      </div>

      <!-- Top Credores Despesas -->
      <div class="section-card" style="margin-bottom: 0;">
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
          <a href="/empresas.html" target="_blank" class="nav-btn" style="text-decoration: none; font-size: 11px; padding: 4px 12px;">Abrir Dossiê Completo de Empresas ↗</a>
        </div>
      </div>

    </div>

    <!-- Top Diárias Limpo -->
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
        <button onclick="openVoterModal('modalViagens')" class="btn-citizen-popup" style="width: auto;">
          👁️ Ver Análise Completa de Viagens (Pop-up)
        </button>
      </div>
    </div>

    <!-- Destaque de Integridade e Fiscalização -->
    <div class="section-card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(30, 20, 10, 0.9) 100%); margin-bottom: 24px;">
      <div class="section-title">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #fbbf24;">⚖️ Fiscalização do Eleitor: Conflitos de Interesse Detectados</span>
          <span class="has-tooltip">
            <span class="tooltip-icon" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">?</span>
            <div class="tooltip-box">A Lei de Licitações (Lei 14.133/21) veda a participação de servidores públicos e dirigentes do órgão em contratos do município.</div>
          </span>
        </div>
        <span class="status-badge status-warning">11 EMPRESAS ENCONTRADAS</span>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
        O cruzamento dos dados do CNPJ na <strong>Receita Federal</strong> com a folha de servidores municipais revelou empresas contratadas por Arinos cujos sócios são autoridades locais:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        
        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 14px;">
          <span style="font-size: 10px; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Saúde Pública • R$ 592k</span>
          <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0;">Clínica Vieira Magalhães LTDA</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            Sócia: <strong>Soraya Almeida Magalhães Vieira</strong> (Secretária Municipal de Saúde de Arinos) e <strong>Vicente Vieira Neto</strong> (Diretor Clínico).
          </p>
        </div>

        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 14px;">
          <span style="font-size: 10px; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Peças & Mecânica • R$ 2,96 Mi</span>
          <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0;">Santos e Marins Auto Peças</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            Sócia: <strong>Silésia Moreira dos Santos</strong> (Chefe de Setor de Administração e Desenvolvimento de Pessoal da Prefeitura).
          </p>
        </div>

        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 14px;">
          <span style="font-size: 10px; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Eventos & Estradas • R$ 601k</span>
          <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0;">M & S Produções e Eventos</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            Sócio: <strong>Manoel Lopes da Rocha</strong> (Chefe do Setor de Estradas Municipais da Prefeitura de Arinos).
          </p>
        </div>

      </div>

      <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 11px; color: var(--text-dim);">Fontes Oficiais: Receita Federal do Brasil / SIAP ADPMNET</span>
        <button onclick="openVoterModal('modalAlertas')" class="btn-citizen-popup" style="background: #f59e0b; color: #000; font-weight: 700; width: auto; border: none;">
          Ver Todos os 11 Casos no Pop-up ↗
        </button>
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
      <button onclick="openVoterModal('modalAuditoriaTecnica')" class="nav-btn" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; font-weight: 700; font-size: 12px; padding: 8px 16px; border-radius: 9999px; cursor: pointer;">
        🛡️ Central de Auditoria Pericial & Logs de Rede (Pop-up)
      </button>
    </footer>

    <!-- ============================================================
         MODAIS / POPUPS INTERATIVOS DO CIDADÃO & AUDITORIA TÉCNICA
         ============================================================ -->

    <!-- Modal 1: Salários & Folha -->
    <div id="modalSalarios" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalSalarios')">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">💰 Dossiê da Folha de Pagamento & Salários</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Série histórica 2013 a 2026 • 153.938 contracheques auditados</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalSalarios')">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1; space-y: 14px;">
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
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid var(--card-border); border-radius: 10px; padding: 14px;">
            <h4 style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-bottom: 6px;">🔍 Como consultar qualquer servidor?</h4>
            <p style="font-size: 12px; color: var(--text-muted);">
              Você pode usar o buscador no topo digitando o nome do servidor, ou abrir o <strong>Explorador de Tabelas Master</strong> para filtrar salários mês a mês.
            </p>
          </div>
        </div>
        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Fonte: Folha de Pagamento Oficial ADPMNET</span>
          <a href="/tabelas.html" target="_blank" class="btn-citizen-popup" style="width: auto;">Abrir Explorador de Tabelas ↗</a>
        </div>
      </div>
    </div>

    <!-- Modal 2: Empresas & Fornecedores -->
    <div id="modalEmpresas" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalEmpresas')">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🏢 Maiores Fornecedores & Contratos Públicos</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Auditoria com dados do CNPJ na Receita Federal do Brasil</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalEmpresas')">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 14px; line-height: 1.5;">
            Foram identificadas <strong>120 grandes empresas</strong> contratadas pelo município, totalizando mais de <strong>R$ 321,8 Milhões</strong> em compras públicas, obras de infraestrutura, locação de veículos, merenda escolar e assessoria.
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>1. Cooperativa Agropecuária de Unaí (CAPUL)</strong> — Combustíveis e insumos</span>
              <strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">R$ 19,08 Mi</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>2. Sudeste Brasil Cooperativa de Transportes</strong> — Transporte escolar</span>
              <strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">R$ 19,05 Mi</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>3. Prime Consultoria e Assessoria Empresarial</strong> — Gestão e terceirização</span>
              <strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">R$ 17,93 Mi</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>4. União Cooperativa de Transportes</strong> — Linhas escolares e locação</span>
              <strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">R$ 16,38 Mi</strong>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>5. Durães e Azevedo LTDA</strong> — Comércio varejista e fornecimento geral</span>
              <strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">R$ 12,83 Mi</strong>
            </div>
          </div>
        </div>
        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Para consultar sócios e contratos de cada empresa:</span>
          <a href="/empresas.html" target="_blank" class="btn-citizen-popup" style="width: auto;">Abrir Painel de Empresas & Sócios ↗</a>
        </div>
      </div>
    </div>

    <!-- Modal 3: Alertas de Conflito de Interesses -->
    <div id="modalAlertas" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalAlertas')">
      <div class="voter-modal-box">
        <div class="voter-modal-header" style="border-bottom-color: rgba(245, 158, 11, 0.3);">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fbbf24;">⚠️ 11 Alertas de Vínculos Societários Identificados</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Sócios de fornecedores públicos que ocupam ou disputaram cargos municipais</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalAlertas')">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1; space-y: 12px;">
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <p style="font-size: 12px; color: #fbbf24; line-height: 1.4;">
              <strong>Importante para o Eleitor:</strong> A auditoria cruzou os nomes do Quadro Societário (QSA da Receita Federal) com a folha de pagamento e a lista do TSE de Arinos.
            </p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <strong style="color: #fff;">1. Clínica Vieira Magalhães LTDA (R$ 592.963,50)</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Sócia: <strong>Soraya Almeida Magalhães Vieira</strong> (Secretária Municipal de Saúde) e <strong>Vicente Vieira Neto</strong> (Diretor Clínico).
              </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <strong style="color: #fff;">2. Santos e Marins Auto Peças LTDA (R$ 2.965.681,16)</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Sócia: <strong>Silésia Moreira dos Santos</strong> (Chefe de Setor de Administração e Desenvolvimento de Pessoal).
              </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <strong style="color: #fff;">3. HWS Empreendimentos LTDA (R$ 1.746.568,62)</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Sócio: <strong>Helio Soares Lima</strong> (Candidato a Vereador em 2024 e servidor municipal).
              </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <strong style="color: #fff;">4. M & S Produções e Eventos LTDA (R$ 601.000,00)</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Sócio: <strong>Manoel Lopes da Rocha</strong> (Chefe do Setor de Estradas Municipais).
              </div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <strong style="color: #fff;">5. Med Center Arinos LTDA (R$ 1.418.722,17)</strong>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Sócios: <strong>Melanie Malek Madureira</strong> e <strong>Vicente Vieira Neto</strong> (Diretores Clínicos).
              </div>
            </div>
          </div>
        </div>
        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Auditoria com base em dados públicos do CNPJ</span>
          <a href="/empresas.html" target="_blank" class="btn-citizen-popup" style="background: #f59e0b; color: #000; font-weight: 700; width: auto; border: none;">Examinar Dossiê Completo de Alertas ↗</a>
        </div>
      </div>
    </div>

    <!-- Modal 4: Viagens & Diárias -->
    <div id="modalViagens" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalViagens')">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">✈️ Gastos com Diárias & Viagens Oficiais</h3>
            <p style="font-size: 12px; color: var(--text-muted);">29.746 viagens registradas de 2013 a 2026 (Total: R$ 7.097.440,34)</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalViagens')">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Diárias do Prefeito</span>
              <strong style="font-size: 18px; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">R$ 433.704,90</strong>
              <small style="color: var(--text-dim); display: block; font-size: 10px;">604 viagens (Média R$ 718)</small>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Diárias de Secretários</span>
              <strong style="font-size: 18px; color: #a78bfa; font-family: 'JetBrains Mono', monospace;">R$ 454.927,34</strong>
              <small style="color: var(--text-dim); display: block; font-size: 10px;">1.103 viagens (Média R$ 412)</small>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 10px;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Demais Servidores</span>
              <strong style="font-size: 18px; color: #34d399; font-family: 'JetBrains Mono', monospace;">R$ 6.200.905,39</strong>
              <small style="color: var(--text-dim); display: block; font-size: 10px;">28.013 viagens (Média R$ 221)</small>
            </div>
          </div>
          <p style="margin-bottom: 12px; line-height: 1.5;">
            Os destinos mais frequentes são <strong>Belo Horizonte</strong> (para convênios estaduais), <strong>Brasília</strong> (ministérios federais) e <strong>Unaí</strong> (Gerência Regional de Saúde).
          </p>
        </div>
        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Consulte qualquer uma das 29.746 viagens:</span>
          <a href="/empresas.html" target="_blank" class="btn-citizen-popup" style="width: auto;">Abrir Painel de Viagens ↗</a>
        </div>
      </div>
    </div>

    <!-- Modal 5: Vereadores & Câmara -->
    <div id="modalVereadores" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalVereadores')">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🏛️ O Que os Vereadores de Arinos Fizeram?</h3>
            <p style="font-size: 12px; color: var(--text-muted);">Dados extraídos diretamente do sistema SAPL / Interlegis da Câmara</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalVereadores')">✕</button>
        </div>
        <div class="voter-modal-body" style="font-size: 13px; color: #cbd5e1;">
          <p style="margin-bottom: 14px; line-height: 1.5;">
            Foram catalogadas <strong>722 matérias legislativas</strong> (projetos de lei, indicações de obras e requerimentos) e o histórico de <strong>111 vereadores</strong> que já passaram pela Câmara Municipal de Arinos ao longo de 16 legislaturas.
          </p>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 14px; border-radius: 10px;">
            <p style="font-size: 12px; color: var(--text-muted);">
              Você pode ver a lista dos 11 vereadores em exercício, suas fotos oficiais, contato telefônico, e-mail institucional e a relação completa de todas as leis que cada um propôs.
            </p>
          </div>
        </div>
        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Poder Legislativo de Arinos / MG</span>
          <a href="/vereadores.html" target="_blank" class="btn-citizen-popup" style="width: auto;">Ver Painel de Atuação dos Vereadores ↗</a>
        </div>
      </div>
    </div>

    <!-- Modal 6: Central de Auditoria Técnica Forense & Logs de Rede (TUDO PRESERVADO AQUI) -->
    <div id="modalAuditoriaTecnica" class="voter-modal-overlay" onclick="if(event.target===this) closeVoterModal('modalAuditoriaTecnica')">
      <div class="voter-modal-box" style="max-width: 1100px; max-height: 92vh;">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #60a5fa; display: flex; align-items: center; gap: 8px;">
              <span>🛡️ Central de Engenharia de Dados & Auditoria Forense</span>
              <span class="status-badge status-success" style="font-size: 10px;">PROVA TÉCNICA RFC 6234</span>
            </h3>
            <p style="font-size: 12px; color: var(--text-muted);">Cadeia de custódia, hashes criptográficos SHA-256 e logs de requisições de rede HTTP</p>
          </div>
          <button class="modal-close-btn" onclick="closeVoterModal('modalAuditoriaTecnica')">✕</button>
        </div>

        <div class="voter-modal-body" style="font-size: 12px;">
          
          <!-- Overall Progress Banner -->
          <div class="progress-banner" style="margin-bottom: 20px;">
            <div class="progress-info">
              <h2>
                <span>Status da Pipeline de Coleta:</span>
                <span style="color: #10b981;" id="txtProgressoGeral">50% CONCLUÍDO</span>
              </h2>
              <p style="font-size: 12px; color: var(--text-muted);">
                Prefeitura Municipal estruturada. Fundação de Saúde em fila de execução.
              </p>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" id="barProgressoGeral" style="width: 50%;"></div>
              </div>
            </div>
            <div class="summary-pills">
              <div class="pill-item">
                <span>Status Prefeitura:</span>
                <strong style="color: #34d399;">100% ESTRUTURADO</strong>
              </div>
              <div class="pill-item">
                <span>Série Coberta:</span>
                <strong>2013 a 2026</strong>
              </div>
              <div class="pill-item">
                <span>Atualizado em:</span>
                <strong id="lblAtualizado">Hoje</strong>
              </div>
            </div>
          </div>

          <!-- Mini KPIs de Rede -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Consultas de Auditoria</div>
              <div style="font-size: 20px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace;" id="liveConsultasTotal">627+</div>
              <div style="font-size: 10px; color: #34d399;" id="liveConsultasSucesso">✔ Gravadas c/ SHA-256</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Meses em Disco</div>
              <div style="font-size: 20px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;" id="liveMesesBaixados">165 meses</div>
              <div style="font-size: 10px; color: var(--text-muted);">Série completa</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Holerites Detalhados</div>
              <div style="font-size: 20px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace;" id="liveHoleritesDet">133.441+</div>
              <div style="font-size: 10px; color: var(--text-muted);">Rubricas salariais</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
              <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Última Resposta</div>
              <div style="font-size: 16px; font-weight: 800; color: #a7f3d0;" id="liveUltimaResposta">HTTP 200 OK</div>
              <div style="font-size: 10px; color: var(--text-dim);" id="liveUltimoTempo">Portal ADPMNET</div>
            </div>
          </div>

          <!-- Hidden elements for dynamic script bindings -->
          <div style="display: none;">
            <div id="kpiValorTotal"></div>
            <div id="kpiTotalRegistros"></div>
            <div id="kpiTotalServidores"></div>
            <div id="kpiTotalCredores"></div>
            <div id="liveBadgeStatus"></div>
            <button id="btnToggleSync"></button>
          </div>

          <!-- Feed de Eventos Recentes -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-dim); margin-bottom: 6px;">
              Fluxo Recente de Rede (Live Activity Feed):
            </div>
            <div id="liveActivityFeed" style="display: flex; flex-direction: column; gap: 4px; font-family: 'JetBrains Mono', monospace; font-size: 10px; max-height: 110px; overflow-y: auto;"></div>
          </div>

          <!-- Matriz de Coleta (Pipeline) -->
          <div style="margin-bottom: 18px;">
            <h4 style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">Matriz de Coleta & Armazenamento Local (SQLite Master):</h4>
            <div style="max-height: 140px; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th>Entidade</th>
                    <th>Status</th>
                    <th>Progresso</th>
                    <th>Coletado</th>
                    <th>Tratado</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody id="tabelaModulos"></tbody>
              </table>
            </div>
          </div>

          <!-- Logs de Auditoria HTTP -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="font-size: 12px; font-weight: 700; color: #fff;">Logs de Requisições HTTP em Tempo Real:</h4>
              <div style="display: flex; gap: 6px;">
                <button class="log-filter-btn active" id="btnFiltroTodos" onclick="aplicarFiltroTipo('todos')">Todos (<span id="badgeFiltroTodos">0</span>)</button>
                <button class="log-filter-btn" id="btnFiltroSucesso" onclick="aplicarFiltroTipo('sucesso')">Sucessos (<span id="badgeFiltroSucesso">0</span>)</button>
                <button class="log-filter-btn" id="btnFiltroVazio" onclick="aplicarFiltroTipo('vazio')">Vazios (<span id="badgeFiltroVazio">0</span>)</button>
                <button class="log-filter-btn" id="btnFiltroFalha" onclick="aplicarFiltroTipo('falha')">Falhas (<span id="badgeFiltroFalha">0</span>)</button>
              </div>
            </div>

            <!-- KPIs de Logs -->
            <div style="display: none;">
              <span id="logKpiTotal">0</span>
              <span id="logKpiSucesso">0</span>
              <span id="logKpiVazio">0</span>
              <span id="logKpiFalha">0</span>
            </div>

            <div style="margin-bottom: 8px;">
              <input type="text" id="inputFiltroLog" class="log-search-bar" placeholder="🔍 Filtrar logs por órgão, competência, módulo..." oninput="filtrarLogsTexto()">
            </div>

            <div class="log-table-wrap" style="max-height: 240px;">
              <table>
                <thead>
                  <tr>
                    <th width="120">Hora / Data</th>
                    <th>Órgão</th>
                    <th width="90">Competência</th>
                    <th>Módulo</th>
                    <th width="120">Status</th>
                    <th width="70">HTTP</th>
                    <th width="80">Tamanho</th>
                    <th width="90">Registros</th>
                    <th width="120">Hash Forense</th>
                    <th width="80">Ações</th>
                  </tr>
                </thead>
                <tbody id="tabelaLogsAuditoria">
                  <tr>
                    <td colspan="10" style="text-align: center; color: var(--text-dim); padding: 18px;">
                      Carregando logs da cadeia de custódia...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 10px; color: var(--text-dim);">
              <span id="lblQtdLogsExibidos">Registros assinados digitalmente</span>
              <span>Padrão Forense RFC 6234</span>
            </div>
          </div>

        </div>

        <div class="voter-modal-footer">
          <span style="font-size: 11px; color: var(--text-dim);">Painel de Engenharia & Perícia de Dados Públicos</span>
          <button class="modal-close-btn" style="width: auto; padding: 6px 14px; font-size: 12px; font-weight: 600;" onclick="closeVoterModal('modalAuditoriaTecnica')">
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
`;

// Helper JS to append
const jsHelper = `
    // ==========================================
    // FUNÇÕES DE CONTROLE DE MODAIS DO ELEITOR
    // ==========================================
    function openVoterModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeVoterModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    // Fecha modal ativo com ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.voter-modal-overlay.active');
        activeModals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
      }
    });
`;

// Find slice markers
const startMarker = '<header>';
const endMarker = '</div>\n\n  <script>';

const idxStart = original.indexOf(startMarker);
const idxEnd = original.indexOf(endMarker);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Marcadores não encontrados!', { idxStart, idxEnd });
  process.exit(1);
}

let modified = original.slice(0, idxStart) + cleanHtml.trim() + '\n\n  </div>\n\n  <script>' + original.slice(idxEnd + endMarker.length);

// Also insert the modal JS helper right after <script>
const scriptTag = '<script>';
const scriptPos = modified.indexOf(scriptTag);
if (scriptPos !== -1) {
  modified = modified.slice(0, scriptPos + scriptTag.length) + '\n' + jsHelper + modified.slice(scriptPos + scriptTag.length);
}

fs.writeFileSync(indexPath, modified, 'utf8');
console.log('[+] index.html atualizado com sucesso no padrão clean e modal-based!');
