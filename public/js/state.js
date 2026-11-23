/**
 * Gerenciador de Estado da Aplicação (Store Reativo)
 * Portal da Transparência de Arinos / MG
 */

export const state = {
  abaAtual: 'pessoas',
  paginaAtual: 1,
  totalPaginas: 1,
  totalRegistros: 0,
  somaFiltrada: 0,
  busca: '',
  filtros: {
    ano: '',
    mes: '',
    entidade: '',
    tipoPessoa: 'todos',
    ordenarPessoa: 'dinheiro'
  },
  kpis: {
    contracheques: { qtd: 0, soma: 0 },
    despesas: { qtd: 0, soma: 0 },
    diarias: { qtd: 0, soma: 0 },
    contratos: { qtd: 0, soma: 0 },
    receitas: { qtd: 0, soma: 0 },
    global: { volume_reais: 0 }
  },
  carregando: false,
  registrosAtuais: []
};

const listeners = [];

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function notify(event, payload) {
  for (const fn of listeners) {
    try {
      fn(event, payload, state);
    } catch (e) {
      console.error('Erro no listener de estado:', e);
    }
  }
}

export function setAba(aba) {
  state.abaAtual = aba;
  state.paginaAtual = 1;
  notify('aba_change', aba);
}

export function setPagina(pagina) {
  state.paginaAtual = Math.max(1, Math.min(pagina, state.totalPaginas || 1));
  notify('pagina_change', state.paginaAtual);
}

export function setBusca(busca) {
  state.busca = busca;
  state.paginaAtual = 1;
  notify('busca_change', busca);
}

export function setFiltros(novosFiltros) {
  Object.assign(state.filtros, novosFiltros);
  state.paginaAtual = 1;
  notify('filtros_change', state.filtros);
}

export function setDadosCarregados(dados) {
  state.registrosAtuais = dados.registros || [];
  if (state.abaAtual === 'pessoas') {
    state.totalRegistros = dados.paginacao ? (dados.paginacao.total_filtrado || 0) : 0;
    state.paginaAtual = dados.paginacao ? (dados.paginacao.page || 1) : 1;
    state.totalPaginas = dados.paginacao ? (dados.paginacao.total_paginas || 1) : 1;
    state.somaFiltrada = dados.estatisticas ? (dados.estatisticas.total_dinheiro_publico || 0) : 0;
  } else {
    state.totalRegistros = dados.total || 0;
    state.paginaAtual = dados.page || 1;
    state.totalPaginas = dados.total_paginas || 1;
    state.somaFiltrada = dados.soma_filtrada || 0;
  }
  notify('dados_loaded', state);
}

export default {
  state,
  subscribe,
  notify,
  setAba,
  setPagina,
  setBusca,
  setFiltros,
  setDadosCarregados
};
