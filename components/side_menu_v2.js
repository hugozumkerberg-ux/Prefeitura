/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V2 SIDE MENU & UX CONTROLLER
 * Sidebar Colapsável, Drawer Mobile, Micro-interações e Informações Profissionais
 * ==============================================================================
 */

(function () {
  'use strict';

  // Configuração dos itens do menu principal
  const MENU_SECTIONS = [
    {
      category: 'PAINEL DO CIDADÃO',
      items: [
        {
          id: 'inicio',
          label: 'Início',
          sub: 'Visão Geral & Indicadores',
          icon: '🏠',
          href: '/',
          aliases: ['/index.html', '/']
        },
        {
          id: 'mandatos',
          label: 'Mandatos',
          sub: 'Prefeitos & Eleições',
          icon: '📜',
          href: '/mandatos.html',
          aliases: ['/mandatos.html']
        },
        {
          id: 'pessoas',
          label: 'Pessoas',
          sub: 'Servidores & Salários',
          icon: '👤',
          href: '/tabelas.html?tab=pessoas',
          badge: '2.865',
          badgeClass: 'v2-badge-emerald',
          aliases: ['/tabelas.html?tab=pessoas']
        },
        {
          id: 'empresas',
          label: 'Empresas',
          sub: 'Fornecedores & Sócios',
          icon: '🏢',
          href: '/empresas.html',
          badge: 'R$ 491M',
          badgeClass: 'v2-badge-blue',
          aliases: ['/empresas.html']
        },
        {
          id: 'rankings',
          label: 'Rankings',
          sub: 'Top Salários & Credores',
          icon: '🏆',
          href: '/tabelas.html?tab=rankings',
          aliases: ['/tabelas.html?tab=rankings']
        },
        {
          id: 'cidade',
          label: 'Cidade',
          sub: 'Turismo, Notícias & História',
          icon: '📍',
          href: '/cidade.html',
          aliases: ['/cidade.html']
        },
        {
          id: 'administrativo',
          label: 'Administrativo',
          sub: 'Secretarias & Titulares',
          icon: '🏛️',
          href: '/administrativo.html',
          aliases: ['/administrativo.html']
        }
      ]
    },
    {
      category: 'INSTITUCIONAL & AUDITORIA',
      items: [
        {
          id: 'mapa',
          label: 'Mapa do Site',
          sub: 'Arquitetura & 4 Eixos',
          icon: '🗺️',
          href: '/mapa.html',
          aliases: ['/mapa.html']
        },
        {
          id: 'vereadores',
          label: 'Vereadores',
          sub: 'Atuação na Câmara (SAPL)',
          icon: '⚖️',
          href: '/vereadores.html',
          aliases: ['/vereadores.html']
        },
        {
          id: 'eleicoes',
          label: 'Eleições TSE',
          sub: 'Candidaturas & Votações',
          icon: '🗳️',
          href: '/eleicoes.html',
          aliases: ['/eleicoes.html']
        },
        {
          id: 'auditoria',
          label: 'Auditoria Forense',
          sub: 'Hashes SHA-256 & Logs',
          icon: '⚙️',
          href: '/#auditoria',
          isAction: true,
          action: () => {
            if (typeof window.openVoterModal === 'function') {
              window.openVoterModal('modalAuditoriaTecnica');
            } else {
              window.location.href = '/#auditoria';
            }
          }
        }
      ]
    },
    {
      category: 'ADMINISTRAÇÃO',
      items: [
        {
          id: 'admin',
          label: 'Painel do Hugo',
          sub: 'Acessos, Logs & Relatórios',
          icon: '⚡',
          href: '/admin.html',
          badge: 'ADM',
          badgeClass: 'v2-badge-blue',
          aliases: ['/admin.html']
        }
      ]
    }
  ];

  // Helper para identificar a rota ativa
  function getActiveItemId() {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const full = path + search;

    if (full.includes('tab=pessoas')) return 'pessoas';
    if (full.includes('tab=rankings')) return 'rankings';
    if (path.includes('mandatos')) return 'mandatos';
    if (path.includes('empresas')) return 'empresas';
    if (path.includes('cidade')) return 'cidade';
    if (path.includes('administrativo')) return 'administrativo';
    if (path.includes('mapa')) return 'mapa';
    if (path.includes('vereadores')) return 'vereadores';
    if (path.includes('eleicoes')) return 'eleicoes';
    if (path.includes('admin')) return 'admin';
    if (path === '/' || path === '/index.html' || path === '') return 'inicio';
    if (path.includes('tabelas')) return 'pessoas';
    return '';
  }

  // Inicialização do DOM
  function initSideMenu() {
    const isCollapsedSaved = localStorage.getItem('portal_sidebar_collapsed') === 'true';
    const activeId = getActiveItemId();

    // Classes no body
    document.body.classList.add('v2-page-body');
    if (window.innerWidth >= 1024) {
      document.body.classList.add(isCollapsedSaved ? 'v2-collapsed' : 'v2-expanded');
    }

    // Criar backdrop para mobile
    const backdrop = document.createElement('div');
    backdrop.id = 'v2-backdrop';
    document.body.appendChild(backdrop);

    // Criar barra superior mobile
    const mobileBar = document.createElement('header');
    mobileBar.id = 'v2-mobile-bar';
    mobileBar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button class="v2-mobile-hamburger" id="v2-btn-hamburger" title="Abrir Menu">
          ☰
        </button>
        <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none;">
          <span style="font-size: 20px;">🏛️</span>
          <span style="font-size: 14px; font-weight: 800; color: #ffffff;">Arinos Transparência</span>
        </a>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="v2-pulse-dot"></span>
        <span style="font-size: 11px; font-family: monospace; color: #34d399; font-weight: 700;">AO VIVO</span>
      </div>
    `;
    document.body.appendChild(mobileBar);

    // Criar Tooltip Flutuante para modo colapsado
    const tooltipFlyout = document.createElement('div');
    tooltipFlyout.className = 'v2-tooltip-flyout';
    tooltipFlyout.id = 'v2-tooltip-flyout';
    document.body.appendChild(tooltipFlyout);

    // Criar Sidebar Lateral V2
    const sidebar = document.createElement('aside');
    sidebar.id = 'v2-sidebar';
    if (isCollapsedSaved && window.innerWidth >= 1024) {
      sidebar.classList.add('collapsed');
    }

    let navHtml = '';
    MENU_SECTIONS.forEach((sec) => {
      navHtml += `<div class="v2-nav-category">${sec.category}</div>`;
      sec.items.forEach((item) => {
        const isActive = item.id === activeId;
        const badgeHtml = item.badge
          ? `<span class="v2-nav-badge ${item.badgeClass || 'v2-badge-emerald'}">${item.badge}</span>`
          : '';

        navHtml += `
          <a href="${item.href}" 
             class="v2-nav-item ${isActive ? 'active' : ''}" 
             id="nav-item-${item.id}"
             data-tooltip-title="${item.label}"
             data-tooltip-sub="${item.sub}"
             ${item.isAction ? 'data-is-action="true"' : ''}>
            <div class="v2-nav-icon">${item.icon}</div>
            <div class="v2-nav-info">
              <span class="v2-nav-label">${item.label}</span>
              <span class="v2-nav-sub">${item.sub}</span>
            </div>
            ${badgeHtml}
          </a>
        `;
      });
    });

    sidebar.innerHTML = `
      <div class="v2-sidebar-header">
        <a href="/" class="v2-brand-container" title="Página Inicial do Portal">
          <div class="v2-brand-icon">🏛️</div>
          <div class="v2-brand-text">
            <h2>Transparência</h2>
            <span>Arinos / MG • V2</span>
          </div>
        </a>
        <button class="v2-toggle-btn" id="v2-sidebar-toggle" title="Recolher/Expandir Menu (Alt+M)">
          ${isCollapsedSaved ? '▶' : '◀'}
        </button>
      </div>

      <nav class="v2-sidebar-nav">
        ${navHtml}
      </nav>

      <div class="v2-sidebar-footer">
        <div class="v2-live-status">
          <span class="v2-pulse-dot"></span>
          <span>SISTEMA 100% ONLINE</span>
        </div>
      </div>
    `;

    document.body.prepend(sidebar);

    // =========================================================================
    // EVENTOS DO SIDEBAR (COLAPSAR, EXPANDIR, MOBILE, TOOLTIP)
    // =========================================================================
    const toggleBtn = document.getElementById('v2-sidebar-toggle');
    const hamburgerBtn = document.getElementById('v2-btn-hamburger');

    function setCollapsed(collapse) {
      if (collapse) {
        sidebar.classList.add('collapsed');
        document.body.classList.remove('v2-expanded');
        document.body.classList.add('v2-collapsed');
        toggleBtn.innerHTML = '▶';
        localStorage.setItem('portal_sidebar_collapsed', 'true');
      } else {
        sidebar.classList.remove('collapsed');
        document.body.classList.remove('v2-collapsed');
        document.body.classList.add('v2-expanded');
        toggleBtn.innerHTML = '◀';
        localStorage.setItem('portal_sidebar_collapsed', 'false');
      }
    }

    toggleBtn.addEventListener('click', () => {
      const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
      setCollapsed(!isCurrentlyCollapsed);
    });

    // Mobile Hamburger & Backdrop
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('open');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('open');
    });

    // Fechar gaveta mobile ao clicar em qualquer item
    sidebar.querySelectorAll('.v2-nav-item').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (link.getAttribute('data-is-action') === 'true') {
          e.preventDefault();
          const target = MENU_SECTIONS[1].items.find((i) => i.id === 'auditoria');
          if (target && target.action) target.action();
        }
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('mobile-open');
          backdrop.classList.remove('open');
        }
      });

      // Tooltips quando colapsado
      link.addEventListener('mouseenter', () => {
        if (!sidebar.classList.contains('collapsed') || window.innerWidth < 1024) return;
        const rect = link.getBoundingClientRect();
        const title = link.getAttribute('data-tooltip-title');
        const sub = link.getAttribute('data-tooltip-sub');
        tooltipFlyout.innerHTML = `<strong>${title}</strong><div style="font-size: 10px; color: #94a3b8; font-weight: normal;">${sub}</div>`;
        tooltipFlyout.style.top = `${rect.top + rect.height / 2 - 18}px`;
        tooltipFlyout.style.left = `${rect.right + 10}px`;
        tooltipFlyout.classList.add('visible');
      });

      link.addEventListener('mouseleave', () => {
        tooltipFlyout.classList.remove('visible');
      });
    });

    // Atalho de Teclado (Alt + M para colapsar, Esc para fechar)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setCollapsed(!sidebar.classList.contains('collapsed'));
      }
      if (e.key === 'Escape') {
        if (sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
          backdrop.classList.remove('open');
        }
      }
    });

    // Redimensionamento de janela
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('open');
        const isCollapsed = localStorage.getItem('portal_sidebar_collapsed') === 'true';
        document.body.classList.toggle('v2-collapsed', isCollapsed);
        document.body.classList.toggle('v2-expanded', !isCollapsed);
      } else {
        document.body.classList.remove('v2-collapsed', 'v2-expanded');
      }
    });
  }

  // ===========================================================================
  // MÓDULO DE INFORMAÇÕES PROFISSIONAIS (DESIGN SYSTEM CITIZEN-PRO)
  // ===========================================================================
  window.gerarBadgesProfissionais = function (pessoa) {
    if (!pessoa) return '';

    const badges = [];
    const cargosStr = (pessoa.cargos_resumo || '').toLowerCase();
    const cargosJson = pessoa.cargos_json ? (typeof pessoa.cargos_json === 'string' ? JSON.parse(pessoa.cargos_json) : pessoa.cargos_json) : [];
    const perfilTipo = pessoa.perfil_tipo || 'Servidor Público';

    // 1. Regime Jurídico / Funcional
    if (pessoa.is_prefeito || pessoa.is_vereador || cargosStr.includes('prefeito') || cargosStr.includes('vereador')) {
      badges.push(`
        <span class="v2-badge-prof v2-badge-politico" title="Agente Político Eleito pelo Cidadão">
          🗳️ Agente Político
        </span>
      `);
    } else if (
      cargosStr.includes('secretari') || 
      cargosStr.includes('diretor') || 
      cargosStr.includes('presidente') || 
      cargosStr.includes('assessor') || 
      cargosStr.includes('coordenador')
    ) {
      badges.push(`
        <span class="v2-badge-prof v2-badge-comissao" title="Cargo em Comissão / Direção e Chefia">
          ⭐ Cargo em Comissão (Confiança)
        </span>
      `);
    } else if (cargosStr.includes('contrato') || cargosStr.includes('temporari') || cargosStr.includes('prestador')) {
      badges.push(`
        <span class="v2-badge-prof v2-badge-temporario" title="Contrato Administrativo Temporário">
          📝 Contrato Temporário
        </span>
      `);
    } else {
      badges.push(`
        <span class="v2-badge-prof v2-badge-efetivo" title="Servidor Público Efetivo / Concursado">
          🏛️ Efetivo / Concursado
        </span>
      `);
    }

    // 2. Múltiplas Matrículas
    const qtdMatr = pessoa.qtd_matriculas || (pessoa.matriculas ? pessoa.matriculas.length : 1);
    if (qtdMatr > 1) {
      badges.push(`
        <span class="v2-badge-prof v2-badge-multi" title="Entity Resolution: Servidor com ${qtdMatr} Matrículas Ativas ou Históricas">
          🔗 Multi-Matrícula (${qtdMatr}x)
        </span>
      `);
    }

    // 3. Cruzamento com Fornecedor / Conflito de Interesses
    if (pessoa.is_socio_empresa) {
      badges.push(`
        <span class="v2-badge-prof v2-badge-socio" title="Alerta de Governança: Sócio ou Administrador de Empresa Fornecedora de Arinos">
          ⚠️ Sócio de Fornecedor Municipal
        </span>
      `);
    }

    // 4. Tempo de Serviço Público
    if (pessoa.ano_primeiro_salario && pessoa.ano_ultimo_salario) {
      const anos = Math.max(1, (pessoa.ano_ultimo_salario - pessoa.ano_primeiro_salario) + 1);
      badges.push(`
        <span class="v2-badge-prof v2-badge-orgao" title="Período de Atuação Registrado no Portal">
          ⏱️ ${anos} ${anos > 1 ? 'Anos' : 'Ano'} de Atuação (${pessoa.ano_primeiro_salario}–${pessoa.ano_ultimo_salario})
        </span>
      `);
    }

    return `<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">${badges.join('')}</div>`;
  };

  // Utilitário global para Sanfonas / Accordions colapsáveis
  window.toggleSanfona = function (id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(`${id}-icon`);
    if (!el) return;
    const isHidden = el.classList.contains('hidden') || el.style.display === 'none';
    if (isHidden) {
      el.classList.remove('hidden');
      el.style.display = '';
      if (icon) icon.innerText = '▼';
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
      if (icon) icon.innerText = '▶';
    }
  };

  // Card estruturado de perfil profissional completo com suporte a sanfona (usado em modais)
  window.gerarPainelPerfilProfissional = function (pessoa, dadosAdicionais) {
    if (!pessoa) return '';

    const badgesHtml = window.gerarBadgesProfissionais(pessoa);
    const matriculas = pessoa.matriculas || (typeof pessoa.matriculas_json === 'string' ? JSON.parse(pessoa.matriculas_json) : []);
    const entidades = pessoa.entidades || (typeof pessoa.entidades_json === 'string' ? JSON.parse(pessoa.entidades_json) : []);

    return `
      <div class="v2-card-elevate" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
        <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-perfil-funcional')" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; flex-wrap: wrap; gap: 8px;">
          <h4 style="font-size: 13px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 8px;">
            <span>💼 Ficha Profissional & Vínculo Funcional</span>
          </h4>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${badgesHtml}
            <span id="sanfona-perfil-funcional-icon" style="font-size: 12px; color: #94a3b8; font-family: monospace;">▼</span>
          </div>
        </div>

        <div id="sanfona-perfil-funcional" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px;">
          <div style="background: rgba(30, 41, 59, 0.5); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-family: monospace; font-weight: 700;">Lotação & Órgãos de Atuação</span>
            <p style="font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 4px;">
              ${entidades.length > 0 ? entidades.join(' • ') : 'Prefeitura Municipal de Arinos'}
            </p>
          </div>

          <div style="background: rgba(30, 41, 59, 0.5); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-family: monospace; font-weight: 700;">Matrículas Funcionais Oficiais</span>
            <p style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-top: 4px; font-family: monospace;">
              ${matriculas.length > 0 ? matriculas.join(', ') : 'Matrícula não informada'}
            </p>
          </div>

          <div style="background: rgba(30, 41, 59, 0.5); padding: 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-family: monospace; font-weight: 700;">Cargos e Funções Exercidas</span>
            <p style="font-size: 13px; font-weight: 700; color: #34d399; margin-top: 4px;">
              ${pessoa.cargos_resumo || 'Servidor Municipal'}
            </p>
          </div>
        </div>
      </div>
    `;
  };

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSideMenu);
  } else {
    initSideMenu();
  }
})();
