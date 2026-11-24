/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 MODULAR SIDEBAR CONTROLLER
 * Cópia e refatoração 100% idêntica da barra lateral V2 (Citizen-Pro Design System)
 * ==============================================================================
 */

export const MENU_SECTIONS = [
  {
    category: 'PAINEL DO CIDADÃO',
    items: [
      {
        id: 'inicio',
        label: 'Início',
        sub: 'Visão Geral & Indicadores',
        icon: '🏠',
        href: '#inicio'
      },
      {
        id: 'mandatos',
        label: 'Mandatos',
        sub: 'Prefeitos & Eleições',
        icon: '📜',
        href: '#mandatos'
      },
      {
        id: 'pessoas',
        label: 'Pessoas',
        sub: 'Servidores & Vínculos',
        icon: '👥',
        href: '#pessoas',
        badge: '133k',
        badgeClass: 'v2-badge-emerald'
      },
      {
        id: 'empresas',
        label: 'Empresas',
        sub: 'Fornecedores & Sócios',
        icon: '🏢',
        href: '#empresas',
        badge: 'R$ 491M',
        badgeClass: 'v2-badge-blue'
      },
      {
        id: 'rankings',
        label: 'Rankings',
        sub: 'Top Salários & Credores',
        icon: '🏆',
        href: '#rankings'
      },
      {
        id: 'cidade',
        label: 'Cidade',
        sub: 'Turismo, Notícias & História',
        icon: '📍',
        href: '#cidade'
      },
      {
        id: 'administrativo',
        label: 'Administrativo',
        sub: 'Secretarias & Titulares',
        icon: '🏛️',
        href: '#administrativo'
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
        href: '#mapa'
      },
      {
        id: 'vereadores',
        label: 'Vereadores',
        sub: 'Atuação na Câmara (SAPL)',
        icon: '⚖️',
        href: '#vereadores'
      },
      {
        id: 'eleicoes',
        label: 'Eleições TSE',
        sub: 'Candidaturas & Votações',
        icon: '🗳️',
        href: '#eleicoes'
      },
      {
        id: 'despesas',
        label: 'Despesas & Empenhos',
        sub: 'Gastos Públicos (SIAP)',
        icon: '💰',
        href: '#despesas',
        badge: '5k+',
        badgeClass: 'v2-badge-amber'
      },
      {
        id: 'diarias',
        label: 'Diárias & Viagens',
        sub: 'Deslocamentos Oficiais',
        icon: '✈️',
        href: '#diarias',
        badge: '41k+',
        badgeClass: 'v2-badge-blue'
      },
      {
        id: 'auditoria',
        label: 'Auditoria Forense',
        sub: 'Hashes SHA-256 & Logs',
        icon: '⚙️',
        href: '#auditoria',
        badge: 'Forense',
        badgeClass: 'v2-badge-emerald'
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
        href: '#admin',
        badge: 'ADM',
        badgeClass: 'v2-badge-blue'
      },
      {
        id: 'kanban',
        label: 'Painel Kanban',
        sub: 'Entregas & Refatoração V3',
        icon: '📋',
        href: '#kanban',
        badge: 'Tarefas',
        badgeClass: 'v2-badge-emerald'
      }
    ]
  }
];

export function renderSidebar(onSelectTab, initialActiveTab = 'inicio') {
  let activeTabId = initialActiveTab;
  let isCollapsedSaved = localStorage.getItem('portal_sidebar_collapsed') === 'true';

  // Configuração de classes no body
  document.body.classList.add('v2-page-body');
  if (window.innerWidth >= 1024) {
    document.body.classList.toggle('v2-collapsed', isCollapsedSaved);
    document.body.classList.toggle('v2-expanded', !isCollapsedSaved);
  }

  // 1. Criar ou obter backdrop para mobile
  let backdrop = document.getElementById('v2-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'v2-backdrop';
    document.body.appendChild(backdrop);
  }

  // 2. Criar ou obter barra superior mobile
  let mobileBar = document.getElementById('v2-mobile-bar');
  if (!mobileBar) {
    mobileBar = document.createElement('header');
    mobileBar.id = 'v2-mobile-bar';
    mobileBar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button class="v2-mobile-hamburger" id="v2-btn-hamburger" title="Abrir Menu">
          ☰
        </button>
        <a href="/v3/" style="display: flex; align-items: center; gap: 8px; text-decoration: none;">
          <span style="font-size: 20px;">🏛️</span>
          <span style="font-size: 14px; font-weight: 800; color: #ffffff;">Arinos Transparência</span>
        </a>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="display: flex; gap: 3px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.15); border-radius: 9999px; padding: 2px;">
          <a href="/" style="text-decoration: none; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; background: transparent; color: #cbd5e1;">v2</a>
          <a href="/v3/" style="text-decoration: none; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; background: #2563eb; color: #fff;">v3</a>
        </div>
        <span class="v2-pulse-dot"></span>
        <span style="font-size: 11px; font-family: monospace; color: #34d399; font-weight: 700;">AO VIVO</span>
      </div>
    `;
    document.body.appendChild(mobileBar);
  }

  // 3. Criar ou obter tooltip flutuante para modo colapsado
  let tooltipFlyout = document.getElementById('v2-tooltip-flyout');
  if (!tooltipFlyout) {
    tooltipFlyout = document.createElement('div');
    tooltipFlyout.className = 'v2-tooltip-flyout';
    tooltipFlyout.id = 'v2-tooltip-flyout';
    document.body.appendChild(tooltipFlyout);
  }

  // 4. Criar ou obter sidebar lateral V2/V3
  let sidebar = document.getElementById('v2-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('aside');
    sidebar.id = 'v2-sidebar';
    document.body.prepend(sidebar);
  }

  if (isCollapsedSaved && window.innerWidth >= 1024) {
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }

  // Renderiza itens
  let navHtml = '';
  MENU_SECTIONS.forEach((sec) => {
    navHtml += `<div class="v2-nav-category">${sec.category}</div>`;
    sec.items.forEach((item) => {
      const isActive = item.id === activeTabId;
      const badgeHtml = item.badge
        ? `<span class="v2-nav-badge ${item.badgeClass || 'v2-badge-emerald'}">${item.badge}</span>`
        : '';

      navHtml += `
        <a href="${item.href}" 
           class="v2-nav-item ${isActive ? 'active' : ''}" 
           id="nav-item-${item.id}"
           data-id="${item.id}"
           data-tooltip-title="${item.label}"
           data-tooltip-sub="${item.sub}">
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
      <a href="#inicio" class="v2-brand-container" id="v2-brand-link" title="Página Inicial do Portal V3">
        <div class="v2-brand-icon">🏛️</div>
        <div class="v2-brand-text">
          <h2>Transparência</h2>
          <span>Arinos / MG • V3</span>
        </div>
      </a>
      <button class="v2-toggle-btn" id="v2-sidebar-toggle" title="Recolher/Expandir Menu (Alt+M)">
        ${isCollapsedSaved ? '▶' : '◀'}
      </button>
    </div>

    <!-- Seletor Booleano de Versão V2 / V3 -->
    <div style="padding: 10px 14px; margin: 4px 8px 10px 8px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em;">VERSÃO:</span>
      <div style="display: flex; gap: 4px;">
        <a href="/" style="text-decoration: none; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; background: transparent; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15);">v2</a>
        <a href="/v3/" style="text-decoration: none; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; background: #2563eb; color: #fff; box-shadow: 0 0 8px rgba(37,99,235,0.4);">v3</a>
      </div>
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

  // Controladores de Colapso
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

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      setCollapsed(!sidebar.classList.contains('collapsed'));
    });
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('open');
    });
  }

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('open');
  });

  // Atualizar item ativo
  function setActiveItem(tabId) {
    activeTabId = tabId;
    sidebar.querySelectorAll('.v2-nav-item').forEach((link) => {
      if (link.getAttribute('data-id') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Eventos de clique nos itens de navegação
  sidebar.querySelectorAll('.v2-nav-item').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-id');
      setActiveItem(tabId);

      if (window.innerWidth < 1024) {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('open');
      }

      window.location.hash = tabId;
      if (onSelectTab) onSelectTab(tabId);
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

  const brandLink = document.getElementById('v2-brand-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveItem('inicio');
      window.location.hash = 'inicio';
      if (onSelectTab) onSelectTab('inicio');
    });
  }

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

  return {
    setActiveItem
  };
}
