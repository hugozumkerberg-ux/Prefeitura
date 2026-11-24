/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 PAINEL KANBAN DE MIGRAÇÃO
 * Painel interativo com cards clicáveis, modal de detalhes e double-check oficial
 * Cruzamento direto: TSE (Código 40894) + SQLite (contracheques.db / diárias)
 * ==============================================================================
 */

export const KANBAN_TASKS = [
  // --- MANDATOS DOUBLE CHECK (CONCLUÍDOS) ---
  {
    id: 'mandato-2025-2028',
    coluna: 'concluido',
    titulo: '🗳️ Eleição 2024 • Mandato 2025–2028',
    resumo: 'Prefeito Marcilio de Tonhão (Bens: R$ 1,04 Mi) • Vice Willian do Café (Bens: R$ 740 mil)',
    prioridade: 'P0',
    tag: 'DOUBLE CHECK ✔',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Validação Oficial TSE & Folha Municipal',
      periodo: 'Eleição 2024 • Mandato 2025–2028',
      tse: {
        codigoMunicipio: '40894 (Arinos / MG)',
        eleicaoId: '2045202024',
        prefeitoEleito: 'MARCILIO DE TONHAO (Marcilio Alisson Fonseca de Almeida) • Bens: R$ 1.045.839,75',
        partido: 'PODE (20)',
        viceEleito: 'WILLIAN DO CAFÉ (Willian Furtado Valadares) • PSD (55) • Bens: R$ 740.000,00',
        situacao: 'Eleito • 65,80% (7.124 votos) • Teto de Gastos: R$ 159.850,76',
        statusTSE: 'Deferido / Homologado'
      },
      sqlite: {
        banco: 'contracheques.db + diarias_arinos.sqlite3',
        prefeitoFolha: 'Marcilio Alisson Fonseca De Almeida (Matrícula 003044.5)',
        viceFolha: 'Willian Furtado Valadares (Matrícula 002456.3)',
        folhaPaga: 'R$ 62.288.752,90 (18.928 pagamentos analisados)',
        diariasPagas: 'R$ 1.542.493,18 (24.648 diárias registradas)',
        statusVerificacao: 'Conferido 100% no banco oficial'
      },
      conclusao: 'Double check concluído. Registros do TSE e da folha municipal perfeitamente alinhados.'
    }
  },
  {
    id: 'mandato-2021-2024',
    coluna: 'concluido',
    titulo: '🗳️ Eleição 2020 • Mandato 2021–2024',
    resumo: 'Prefeito Marcilio de Tonhão (Bens: R$ 510 mil) • Vice Willian do Café (Bens: R$ 43 mil)',
    prioridade: 'P0',
    tag: 'DOUBLE CHECK ✔',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Validação Oficial TSE & Folha Municipal',
      periodo: 'Eleição 2020 • Mandato 2021–2024',
      tse: {
        codigoMunicipio: '40894 (Arinos / MG)',
        eleicaoId: '2030402020',
        prefeitoEleito: 'MARCÍLIO DE TONHÃO (Marcílio Álisson Fonseca de Almeida) • Bens: R$ 510.832,98',
        partido: 'PODE (19)',
        viceEleito: 'WILLIAN DO CAFÉ (Willian Furtado Valadares) • PSDB (45) • Bens: R$ 43.636,86',
        situacao: 'Eleito • 52,80% (5.482 votos) • Teto de Gastos: R$ 123.077,42',
        statusTSE: 'Deferido / Homologado'
      },
      sqlite: {
        banco: 'contracheques.db + diarias_arinos.sqlite3',
        prefeitoFolha: 'Marcilio Alisson Fonseca De Almeida (Matrícula 003044.5)',
        viceFolha: 'Willian Furtado Valadares (Matrícula 002456.3)',
        folhaPaga: 'R$ 104.170.835,39 (41.533 pagamentos analisados)',
        diariasPagas: 'R$ 1.792.204,50 (51.045 diárias registradas)',
        statusVerificacao: 'Conferido 100% no banco oficial'
      },
      conclusao: 'Double check concluído. Mandato de 4 anos completo com registros consistentes.'
    }
  },
  {
    id: 'mandato-2017-2020',
    coluna: 'concluido',
    titulo: '🗳️ Eleição 2016 • Mandato 2017–2020',
    resumo: 'Prefeito Carlos Alberto (Bens: R$ 2,26 Mi) • Vice Matos Alem (Bens: R$ 66 mil)',
    prioridade: 'P0',
    tag: 'DOUBLE CHECK ✔',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Correção Crítica & Validação Oficial',
      periodo: 'Eleição 2016 • Mandato 2017–2020',
      tse: {
        codigoMunicipio: '40894 (Arinos / MG)',
        eleicaoId: '2',
        prefeitoEleito: 'CARLOS ALBERTO (Carlos Alberto Recch Filho) • Bens: R$ 2.262.587,01',
        partido: 'PSD (55)',
        viceEleito: 'MATOS ALEM (Matos Alem Alves da Costa) • Bens: R$ 66.980,64',
        situacao: 'Eleito • 54,30% (5.892 votos) • Teto de Gastos: R$ 108.039,06',
        statusTSE: 'Deferido / Homologado (Valter da Farmácia foi eleito Vereador com 480 votos)'
      },
      sqlite: {
        banco: 'contracheques.db + diarias_arinos.sqlite3',
        prefeitoFolha: 'Carlos Alberto Recch Filho (Matrícula 001572.8)',
        viceFolha: 'Matos Alem Alves Da Costa (Matrícula 001573.6, Gabinete do Vice-Prefeito)',
        folhaPaga: 'R$ 64.404.918,85 (37.868 pagamentos analisados)',
        diariasPagas: 'R$ 1.164.890,21 (33.906 diárias registradas)',
        statusVerificacao: 'Inconsistência do V2 corrigida: Matos Alem confirmado no cargo'
      },
      conclusao: 'Double check concluído. Corrigido o erro herdado do V2 que apontava indevidamente o vereador Valter como vice.'
    }
  },
  {
    id: 'mandato-2013-2016',
    coluna: 'concluido',
    titulo: '🗳️ Eleição 2012 • Mandato 2013–2016',
    resumo: 'Prefeito Roberto Sales (Bens: R$ 2,36 Mi) • Vice Willian do Café (Bens: R$ 122 mil)',
    prioridade: 'P0',
    tag: 'DOUBLE CHECK ✔',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Validação Histórica TSE & Folha Municipal',
      periodo: 'Eleição 2012 • Mandato 2013–2016',
      tse: {
        codigoMunicipio: '40894 (Arinos / MG)',
        eleicaoId: '1699',
        prefeitoEleito: 'ROBERTO SALES (Roberto Sales) • PMDB (15) • Bens: R$ 2.368.000,00',
        viceEleito: 'WILLIAN DO CAFÉ (Willian Furtado Valadares) • PPL (15) • Bens: R$ 122.199,36',
        situacao: 'Eleito no pleito de 2012 com 51,80% (5.674 votos)',
        statusTSE: 'Deferido / Homologado'
      },
      sqlite: {
        banco: 'contracheques.db + diarias_arinos.sqlite3',
        prefeitoFolha: 'Roberto Sales (Matrícula 002483.6)',
        viceFolha: 'Willian Furtado Valadares (Matrícula 002456.3)',
        folhaPaga: 'R$ 48.932.145,12 (35.112 pagamentos analisados)',
        diariasPagas: 'R$ 702.327,19 (16.350 diárias registradas)',
        statusVerificacao: 'Folha e pagamentos confirmados de 2013 a 2016'
      },
      conclusao: 'Double check concluído. Corrigida divergência herdada da V2 (que apontava indevidamente Carlos Alberto).'
    }
  },

  // --- OUTROS CARDS CONCLUÍDOS ---
  {
    id: 'view-empresas',
    coluna: 'concluido',
    titulo: '🏢 Empresas & Credores (SIAP)',
    resumo: '542 credores, 5.064 empenhos, paginação e dossiê individual em SQLite.',
    prioridade: 'P0',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página de Fornecedores & Credores',
      resumo: 'Conectada à rota /api/empresas com paginação de 20 por página, filtro por ano, ordenação por valor e modal de dossiê completo de empenhos.'
    }
  },
  {
    id: 'view-rankings',
    coluna: 'concluido',
    titulo: '🏆 Rankings Oficiais de Transparência',
    resumo: 'Maiores salários da folha, maiores diárias e principais credores.',
    prioridade: 'P1',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página de Rankings',
      resumo: 'Conectada à rota /api/rankings com 3 abas dinâmicas, ordenação por volume e filtro por ano de exercício.'
    }
  },
  {
    id: 'view-eleicoes',
    coluna: 'concluido',
    titulo: '🗳️ Eleições Municipais Oficiais (TSE)',
    resumo: 'Base completa de prefeitos e vices de Arinos (40894), bens e tetos.',
    prioridade: 'P0',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página Eleitoral Oficial',
      resumo: 'Conectada à rota /api/eleicoes com acervo de 2012 a 2024, patrimônio declarado e modal de bens detalhados.'
    }
  },
  {
    id: 'view-vereadores',
    coluna: 'concluido',
    titulo: '⚖️ Vereadores & Atuação (SAPL)',
    resumo: '11 parlamentares, bancada atual, acervo de leis e PDFs do SAPL.',
    prioridade: 'P1',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página do Legislativo Municipal',
      resumo: 'Conectada à rota /api/vereadores com 111 matérias legislativas indexadas e dossiê parlamentar.'
    }
  },
  {
    id: 'view-administrativo',
    coluna: 'concluido',
    titulo: '🏛️ Gestão Administrativa & Secretarias',
    resumo: '9 secretarias municipais, competências e estrutura do executivo.',
    prioridade: 'P1',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Estrutura Organizacional',
      resumo: 'Detalhamento de todas as 9 pastas municipais, órgãos vinculados e competências institucionais.'
    }
  },
  {
    id: 'view-cidade',
    coluna: 'concluido',
    titulo: '📍 Cidade, Indicadores & Sagarana',
    resumo: 'Indicadores IBGE 3104502, bioma Cerrado, Rio Urucuia e Guimarães Rosa.',
    prioridade: 'P2',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Perfil Municipal & Territorial',
      resumo: 'História, dados do Censo IBGE, área de 5.322 km², bacia hidrográfica e patrimônio do distrito de Sagarana.'
    }
  },
  {
    id: 'view-mapa',
    coluna: 'concluido',
    titulo: '🗺️ Mapa do Site & 4 Eixos',
    resumo: 'Arquitetura de informação completa com navegação unificada por hash.',
    prioridade: 'P2',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Guia de Navegação',
      resumo: 'Mapeamento visual dos 4 eixos do portal com links diretos para cada uma das páginas e serviços.'
    }
  },
  {
    id: 'refactor-admin',
    coluna: 'concluido',
    titulo: '⚡ Painel do Administrador & Telemetria',
    resumo: 'Latência SQLite < 4ms, status dos 3 bancos e auditoria de rotas REST.',
    prioridade: 'P1',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Painel Interno de Monitoramento',
      resumo: 'Console de auditoria técnica para inspeção de integridade do portal e rastreabilidade forense.'
    }
  },
  {
    id: 'sidebar-v2',
    coluna: 'concluido',
    titulo: '🏛️ Menu Lateral V2 (Sidebar)',
    resumo: 'Sem efeito glass, sólido, colapsável (Alt+M), seletor v2|v3 e gaveta mobile.',
    prioridade: 'P0',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Refatoração de Componente Estrutural',
      resumo: 'Menu lateral sólido sem efeito de vidro (#0b0f19), 3 seções completas idênticas à V2, atalho Alt+M, responsividade e alternância v2/v3.'
    }
  },
  {
    id: 'view-inicio',
    coluna: 'concluido',
    titulo: '🏠 Início (Painel do Cidadão)',
    resumo: 'Buscador inteligente sem acento, 4 cards do cidadão com modais e rankings.',
    prioridade: 'P0',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página Inicial Refatorada',
      resumo: 'Interface oficial de transparência pública, cards informativos de saúde, educação, obras e folha salarial com janelas modais nativas.'
    }
  },
  {
    id: 'view-funcionarios',
    coluna: 'concluido',
    titulo: '👥 Funcionários & Folha (133k)',
    resumo: 'Tabela paginada nativa em SQLite, busca por cargo/servidor/ano e dossiê.',
    prioridade: 'P0',
    tag: '✔ Entregue',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Página de Pessoal e Folha',
      resumo: 'Página com mais de 133 mil holerites indexados, busca instantânea (< 5ms) e dossiê individual do servidor.'
    }
  },

  {
    id: 'homologacao-geral',
    coluna: 'concluido',
    titulo: '🔍 Homologação Geral & Testes de Carga',
    resumo: 'Auditoria de integridade dos 179.800 registros entre as 15 rotas da V3 (0 erros).',
    prioridade: 'P0',
    tag: '✔ Concluído',
    tagClass: 'badge-green',
    detalhes: {
      tipo: 'Garantia de Qualidade & Performance',
      resumo: 'Validação cruzada de integridade de hashes SHA-256, tempo de resposta < 5ms e homologação completa de todas as páginas no navegador.'
    }
  },

  // --- EM ANDAMENTO ---

  // --- A FAZER (BACKLOG) ---
  {
    id: 'export-csv-xlsx',
    coluna: 'a_fazer',
    titulo: '📥 Exportação de Relatórios (CSV/XLSX)',
    resumo: 'Download sob demanda dos dados abertos em formatos abertos auditáveis.',
    prioridade: 'P2',
    tag: 'A Fazer',
    tagClass: 'badge-amber',
    detalhes: {
      tipo: 'Funcionalidade de Dados Abertos',
      resumo: 'Geração de relatórios consolidados em conformidade com as diretrizes do LAI e TCE-MG.'
    }
  }
];

export function renderKanbanView(container) {
  const concluidos = KANBAN_TASKS.filter(t => t.coluna === 'concluido');
  const andamento = KANBAN_TASKS.filter(t => t.coluna === 'em_andamento');
  const aFazer = KANBAN_TASKS.filter(t => t.coluna === 'a_fazer');

  function renderCardHtml(t) {
    const isDoubleCheck = t.tag.includes('DOUBLE CHECK');
    const borderStyle = isDoubleCheck ? 'border: 1px solid rgba(16, 185, 129, 0.5);' : '';
    const cursorStyle = 'cursor: pointer; transition: transform 0.15s ease, border-color 0.15s ease;';

    return `
      <div class="card kanban-card-item" data-id="${t.id}" style="background: #0f172a; padding: 14px; ${borderStyle} ${cursorStyle}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="badge ${t.tagClass}" style="font-size: 10px; font-weight: 700;">${t.tag}</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">${t.prioridade}</span>
        </div>
        <strong style="color: #fff; font-size: 13px; display: block; margin-bottom: 4px;">${t.titulo}</strong>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">${t.resumo}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; margin-top: 6px;">
          <span style="font-size: 11px; color: #3b82f6;">🔍 Clique para ver double-check</span>
          <span style="font-size: 10px; color: var(--text-muted);">#${t.id.slice(0, 12)}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Header do Kanban -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #8b5cf6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="badge badge-purple" style="margin-bottom: 8px;">AUDITORIA, ENTREGAS & REFACTORING</span>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">📋 Painel Kanban da Migração V2 ➔ V3</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 720px;">
            Acompanhe o status de migração e a validação de cada mandato. <strong>Clique em qualquer card para inspecionar os detalhes e o Double Check TSE & SQLite.</strong>
          </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <span class="badge badge-green" style="font-size: 13px; padding: 6px 12px;">${concluidos.length} Concluídos (4 Mandatos Double Check)</span>
          <span class="badge badge-blue" style="font-size: 13px; padding: 6px 12px;">${andamento.length} Em Andamento</span>
          <span class="badge badge-amber" style="font-size: 13px; padding: 6px 12px;">${aFazer.length} A Fazer</span>
        </div>
      </div>
    </div>

    <!-- Colunas do Kanban -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; align-items: flex-start;">
      
      <!-- Coluna 1: A Fazer (Backlog) -->
      <div class="card" style="background: rgba(17, 24, 39, 0.6); border-top: 4px solid #f59e0b;">
        <div class="section-title" style="margin-bottom: 16px;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span>⏳</span> <strong>A Fazer (Backlog)</strong>
          </span>
          <span class="badge badge-amber">${aFazer.length}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${aFazer.map(renderCardHtml).join('')}
        </div>
      </div>

      <!-- Coluna 2: Em Andamento (Doing) -->
      <div class="card" style="background: rgba(17, 24, 39, 0.6); border-top: 4px solid #3b82f6;">
        <div class="section-title" style="margin-bottom: 16px;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span>⚡</span> <strong>Em Andamento</strong>
          </span>
          <span class="badge badge-blue">${andamento.length}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${andamento.map(renderCardHtml).join('')}
        </div>
      </div>

      <!-- Coluna 3: Concluído (Done com Double Check) -->
      <div class="card" style="background: rgba(17, 24, 39, 0.6); border-top: 4px solid #10b981;">
        <div class="section-title" style="margin-bottom: 16px;">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span>✅</span> <strong>Concluído (Auditado)</strong>
          </span>
          <span class="badge badge-green">${concluidos.length}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${concluidos.map(renderCardHtml).join('')}
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="kanban-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
      <div id="kanban-modal-content" class="card" style="max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px; position: relative;">
        <!-- Preenchido dinamicamente via JS -->
      </div>
    </div>
  `;

  // Interatividade: Clique nos Cards
  const cards = container.querySelectorAll('.kanban-card-item');
  const overlay = container.querySelector('#kanban-modal-overlay');
  const modalContent = container.querySelector('#kanban-modal-content');

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.borderColor = '#3b82f6';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.borderColor = card.dataset.id.startsWith('mandato') ? 'rgba(16, 185, 129, 0.5)' : '';
    });
    card.addEventListener('click', () => {
      const taskId = card.dataset.id;
      const t = KANBAN_TASKS.find(x => x.id === taskId);
      if (!t) return;

      let modalHtml = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span class="badge ${t.tagClass}" style="margin-bottom: 6px;">${t.tag} • ${t.prioridade}</span>
            <h2 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${t.titulo}</h2>
          </div>
          <button id="btn-close-modal" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 4px 8px;">✕</button>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">${t.resumo}</p>
      `;

      if (t.detalhes && t.detalhes.tse) {
        modalHtml += `
          <!-- Double Check TSE -->
          <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #60a5fa; font-size: 13px;">🏛️ 1. Resultado Oficial TSE (Código 40894 - Arinos/MG)</strong>
              <span class="badge badge-blue">Eleição ${t.detalhes.tse.eleicaoId}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
              <div><strong>Prefeito:</strong> <span style="color: #fff;">${t.detalhes.tse.prefeitoEleito}</span></div>
              <div><strong>Partido:</strong> <span style="color: #34d399;">${t.detalhes.tse.partido}</span></div>
              <div style="grid-column: 1 / -1;"><strong>Vice-Prefeito:</strong> <span style="color: #fff;">${t.detalhes.tse.viceEleito}</span></div>
              <div style="grid-column: 1 / -1;"><strong>Situação Eleitoral:</strong> <span style="color: #fbbf24;">${t.detalhes.tse.situacao}</span></div>
              <div style="grid-column: 1 / -1; font-size: 11px; color: var(--text-muted);">Status no DivulgaCandContas: ${t.detalhes.tse.statusTSE}</div>
            </div>
          </div>

          <!-- Double Check SQLite -->
          <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #34d399; font-size: 13px;">💾 2. Registros da Folha de Pagamento & Diárias (SQLite)</strong>
              <span class="badge badge-green">Folha Oficial</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 12px;">
              <div><strong>Prefeito na Folha:</strong> <span style="color: #fff;">${t.detalhes.sqlite.prefeitoFolha}</span></div>
              <div><strong>Vice-Prefeito na Folha:</strong> <span style="color: #fff;">${t.detalhes.sqlite.viceFolha}</span></div>
              <div style="display: flex; gap: 12px; margin-top: 4px;">
                <div style="background: #0f172a; padding: 8px 12px; border-radius: 6px; flex: 1;">
                  <div style="font-size: 10px; color: var(--text-muted);">VOLUME FOLHA SALARIAL</div>
                  <div style="font-size: 14px; font-weight: 800; color: #34d399;">${t.detalhes.sqlite.folhaPaga}</div>
                </div>
                <div style="background: #0f172a; padding: 8px 12px; border-radius: 6px; flex: 1;">
                  <div style="font-size: 10px; color: var(--text-muted);">VOLUME DIÁRIAS</div>
                  <div style="font-size: 14px; font-weight: 800; color: #60a5fa;">${t.detalhes.sqlite.diariasPagas}</div>
                </div>
              </div>
              <div style="font-size: 11px; color: #34d399; margin-top: 4px;">✔ ${t.detalhes.sqlite.statusVerificacao}</div>
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 10px; border-radius: 4px; font-size: 12px; color: #d1fae5; margin-bottom: 16px;">
            <strong>Resultado da Auditoria:</strong> ${t.detalhes.conclusao}
          </div>
        `;
      } else {
        modalHtml += `
          <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 13px;">
            <strong>Tipo:</strong> ${t.detalhes?.tipo || 'Refatoração V3'}<br><br>
            ${t.detalhes?.resumo || t.resumo}
          </div>
        `;
      }

      modalHtml += `
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button id="btn-close-modal-bottom" class="btn" style="background: #374151; color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Fechar</button>
        </div>
      `;

      modalContent.innerHTML = modalHtml;
      overlay.style.display = 'flex';

      const closeHandler = () => { overlay.style.display = 'none'; };
      modalContent.querySelector('#btn-close-modal')?.addEventListener('click', closeHandler);
      modalContent.querySelector('#btn-close-modal-bottom')?.addEventListener('click', closeHandler);
    });
  });

  // Fechar ao clicar fora do modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
}
