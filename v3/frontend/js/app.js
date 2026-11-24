/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 APP BOOTSTRAP (ES6)
 * Gerenciamento de navegação, sincronização do menu V2 e views modulares
 * ==============================================================================
 */

import { renderSidebar } from './components/sidebar.js?v=10';
import { renderInicioView } from './components/view_inicio.js?v=10';
import { renderMandatosView } from './components/view_mandatos.js?v=10';
import { renderFuncionariosView } from './components/view_funcionarios.js?v=10';
import { renderKanbanView } from './components/view_kanban.js?v=10';
import { renderEmpresasView } from './components/view_empresas.js?v=10';
import { renderRankingView } from './components/view_rankings.js?v=10';
import { renderEleicoesView } from './components/view_eleicoes.js?v=10';
import { renderVereadoresView } from './components/view_vereadores.js?v=10';
import { renderAdministrativoView } from './components/view_administrativo.js?v=10';
import { renderCidadesView } from './components/view_cidade.js?v=10';
import { renderMapaView } from './components/view_mapa.js?v=10';
import { renderAdminView } from './components/view_admin.js?v=10';
import { renderDespesasView } from './components/view_despesas.js?v=10';
import { renderDiariasView } from './components/view_diarias.js?v=10';
import { renderAuditoriaView } from './components/view_auditoria.js?v=10';

const VIEWS = {
  inicio: renderInicioView,
  visao: renderInicioView,
  pessoas: renderFuncionariosView,
  funcionarios: renderFuncionariosView,
  folha: renderFuncionariosView,
  despesas: renderDespesasView,
  diarias: renderDiariasView,
  auditoria: renderAuditoriaView,
  mandatos: renderMandatosView,
  kanban: renderKanbanView,
  empresas: renderEmpresasView,
  rankings: renderRankingView,
  ranking: renderRankingView,
  cidade: renderCidadesView,
  cidades: renderCidadesView,
  administrativo: renderAdministrativoView,
  mapa: renderMapaView,
  vereadores: renderVereadoresView,
  eleicoes: renderEleicoesView,
  admin: renderAdminView
};

const appContent = document.getElementById('app-content');

function getInitialTab() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash && VIEWS[hash]) {
    return hash;
  }
  return 'inicio';
}

const currentTab = getInitialTab();

// Inicializa a Sidebar idêntica à V2
const sidebarCtrl = renderSidebar((tab) => {
  navigate(tab, false);
}, currentTab);

function navigate(tabName, updateSidebar = true) {
  const normalized = (tabName || 'inicio').toLowerCase();
  const renderFn = VIEWS[normalized] || renderInicioView;

  if (renderFn && appContent) {
    renderFn(appContent);
  }

  if (updateSidebar && sidebarCtrl && sidebarCtrl.setActiveItem) {
    sidebarCtrl.setActiveItem(normalized);
  }

  // Rola suavemente para o topo do conteúdo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Suporte ao botão voltar/avançar do navegador (HashChange)
window.addEventListener('hashchange', () => {
  const tab = getInitialTab();
  navigate(tab, true);
});

// Renderização inicial
navigate(currentTab, true);
