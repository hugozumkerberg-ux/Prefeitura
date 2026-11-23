/**
 * Ponto de Entrada da Aplicação (Entry Point) — Portal da Transparência de Arinos / MG
 * 
 * Orquestra inicialização, troca de abas, renderização de tabelas e sincronização de estado.
 */

import { state, setAba, setDadosCarregados } from './state.js';
import { fetchResumoKpis, fetchTabelaDados } from './api.js';
import { formatMoeda, formatNumber } from './utils/format.js';
import { initFiltros, atualizarVisibilidadeFiltros } from './ui/filtros.js';
import { initPaginacao, atualizarPaginacao } from './ui/paginacao.js';
import { initTooltips } from './ui/tooltip.js';

// Módulos de Tabelas
import { renderCabecalhoPessoas, renderLinhasPessoas } from './tabelas/pessoas.js';
import { renderCabecalhoContracheques, renderLinhasContracheques } from './tabelas/contracheques.js';
import { renderCabecalhoDespesas, renderLinhasDespesas } from './tabelas/despesas.js';
import { renderCabecalhoDiarias, renderLinhasDiarias } from './tabelas/diarias.js';
import { renderCabecalhoContratos, renderLinhasContratos } from './tabelas/contratos.js';
import { renderCabecalhoReceitas, renderLinhasReceitas } from './tabelas/receitas.js';
import { renderCabecalhoConvenios, renderLinhasConvenios } from './tabelas/convenios.js';
import { carregarRankingsUI } from './tabelas/rankings.js';

// Modais
import './modais/pessoa/index.js';
import './modais/holerite.js';

/**
 * Carrega e atualiza os cartões superiores de KPIs
 */
export async function carregarKpis() {
  try {
    const data = await fetchResumoKpis();
    if (data.contracheques) {
      const el = document.getElementById('kpi-contracheques');
      const elVol = document.getElementById('kpi-contracheques-vol');
      if (el) el.innerText = formatNumber(data.contracheques.qtd);
      if (elVol) elVol.innerText = formatMoeda(data.contracheques.soma);
    }
    if (data.despesas) {
      const el = document.getElementById('kpi-despesas');
      const elVol = document.getElementById('kpi-despesas-vol');
      if (el) el.innerText = formatNumber(data.despesas.qtd);
      if (elVol) elVol.innerText = formatMoeda(data.despesas.soma);
    }
    if (data.diarias) {
      const el = document.getElementById('kpi-diarias');
      const elVol = document.getElementById('kpi-diarias-vol');
      if (el) el.innerText = formatNumber(data.diarias.qtd);
      if (elVol) elVol.innerText = formatMoeda(data.diarias.soma);
    }
    if (data.contratos) {
      const el = document.getElementById('kpi-contratos');
      const elVol = document.getElementById('kpi-contratos-vol');
      if (el) el.innerText = formatNumber(data.contratos.qtd);
      if (elVol) elVol.innerText = formatMoeda(data.contratos.soma);
    }
    if (data.receitas) {
      const el = document.getElementById('kpi-receitas');
      const elVol = document.getElementById('kpi-receitas-vol');
      if (el) el.innerText = formatNumber(data.receitas.qtd);
      if (elVol) elVol.innerText = formatMoeda(data.receitas.soma);
    }
    if (data.global) {
      const el = document.getElementById('kpi-global');
      if (el) el.innerText = formatMoeda(data.global.volume_reais);
    }
  } catch (err) {
    console.error('Falha ao obter KPIs:', err);
  }
}

/**
 * Carrega a tabela selecionada e renderiza o conteúdo no DOM
 */
export async function carregarTabela() {
  const aba = state.abaAtual;
  if (aba === 'rankings') return;

  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.classList.remove('hidden');
    indicator.classList.add('flex');
  }

  try {
    const data = await fetchTabelaDados(aba, {
      pagina: state.paginaAtual,
      limite: 25,
      busca: state.busca,
      filtros: state.filtros
    });

    setDadosCarregados(data);
    atualizarPaginacao(state);

    const thead = document.getElementById('tabela-cabecalho');
    const tbody = document.getElementById('tabela-corpo');

    if (!thead || !tbody) return;

    // Renderiza cabeçalho específico
    switch (aba) {
      case 'pessoas':
        thead.innerHTML = renderCabecalhoPessoas();
        tbody.innerHTML = renderLinhasPessoas(data.registros || []);
        break;
      case 'contracheques':
        thead.innerHTML = renderCabecalhoContracheques();
        tbody.innerHTML = renderLinhasContracheques(data.registros || []);
        break;
      case 'despesas':
        thead.innerHTML = renderCabecalhoDespesas();
        tbody.innerHTML = renderLinhasDespesas(data.registros || []);
        break;
      case 'diarias':
        thead.innerHTML = renderCabecalhoDiarias();
        tbody.innerHTML = renderLinhasDiarias(data.registros || []);
        break;
      case 'contratos':
        thead.innerHTML = renderCabecalhoContratos();
        tbody.innerHTML = renderLinhasContratos(data.registros || []);
        break;
      case 'receitas':
        thead.innerHTML = renderCabecalhoReceitas();
        tbody.innerHTML = renderLinhasReceitas(data.registros || []);
        break;
      case 'convenios':
        thead.innerHTML = renderCabecalhoConvenios();
        tbody.innerHTML = renderLinhasConvenios(data.registros || []);
        break;
      default:
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-500">Aba não encontrada</td></tr>';
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    const tbody = document.getElementById('tabela-corpo');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-rose-400">Erro ao consultar base de dados: ${err.message}</td></tr>`;
    }
  } finally {
    if (indicator) {
      indicator.classList.add('hidden');
      indicator.classList.remove('flex');
    }
  }
}

/**
 * Troca de aba ativa
 */
export function mudarAba(novaAba) {
  setAba(novaAba);

  // Estilização das abas
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active', 'text-white');
    b.classList.add('text-slate-300');
  });

  const btn = document.getElementById(`tab-${novaAba}`);
  if (btn) {
    btn.classList.add('active', 'text-white');
    btn.classList.remove('text-slate-300');
  }

  const tabelaContainer = document.getElementById('tabela-container');
  const rankingsContainer = document.getElementById('rankings-container');

  atualizarVisibilidadeFiltros(novaAba);

  if (novaAba === 'rankings') {
    if (tabelaContainer) tabelaContainer.classList.add('hidden');
    if (rankingsContainer) {
      rankingsContainer.classList.remove('hidden');
      carregarRankingsUI();
    }
  } else {
    if (rankingsContainer) rankingsContainer.classList.add('hidden');
    if (tabelaContainer) tabelaContainer.classList.remove('hidden');
    carregarTabela();
  }
}

window.mudarAba = mudarAba;

/**
 * Inicialização do Sistema Frontend
 */
document.addEventListener('DOMContentLoaded', () => {
  initTooltips();
  initFiltros(() => carregarTabela());
  initPaginacao(() => carregarTabela());
  carregarKpis();

  // Fechar modais ao teclar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalDet = document.getElementById('modal-contracheque-detalhe');
      if (modalDet && !modalDet.classList.contains('hidden')) {
        window.fecharPopupContrachequeDetalhe();
      } else {
        window.fecharModalPessoa();
      }
    }
  });

  // Fechar modais ao clicar no backdrop escuro
  const modalDetEl = document.getElementById('modal-contracheque-detalhe');
  if (modalDetEl) {
    modalDetEl.addEventListener('click', (e) => {
      if (e.target === modalDetEl) window.fecharPopupContrachequeDetalhe();
    });
  }

  const modalPessoaEl = document.getElementById('modal-pessoa');
  if (modalPessoaEl) {
    modalPessoaEl.addEventListener('click', (e) => {
      if (e.target === modalPessoaEl) window.fecharModalPessoa();
    });
  }

  // Tratamento de parâmetros da URL (?tab=...&busca=...)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const buscaParam = urlParams.get('busca') || urlParams.get('q');

  if (buscaParam) {
    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) inputBusca.value = buscaParam;
    state.busca = buscaParam;
  }

  let tabDestino = tabParam;
  if (tabParam === 'funcionarios' || tabParam === 'servidores') {
    tabDestino = 'pessoas';
  }

  if (tabDestino && ['pessoas', 'contracheques', 'despesas', 'diarias', 'contratos', 'receitas', 'convenios', 'rankings'].includes(tabDestino)) {
    mudarAba(tabDestino);
  } else {
    mudarAba('pessoas');
  }
});

export default { carregarTabela, mudarAba, carregarKpis };
