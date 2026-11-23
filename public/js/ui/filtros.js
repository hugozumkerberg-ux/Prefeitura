/**
 * Componente de UI — Barra de Filtros e Busca
 * Portal da Transparência de Arinos / MG
 */

import { state, setBusca, setFiltros } from '../state.js';

let debounceTimer = null;
let onFiltroChangedCallback = null;

export function initFiltros(onChanged) {
  onFiltroChangedCallback = onChanged;

  const inputBusca = document.getElementById('input-busca');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setBusca(e.target.value.trim());
        if (onFiltroChangedCallback) onFiltroChangedCallback();
      }, 300);
    });
  }

  const selectAno = document.getElementById('select-ano');
  const selectMes = document.getElementById('select-mes');
  const selectEntidade = document.getElementById('select-entidade');
  const selectTipoPessoa = document.getElementById('select-tipo-pessoa');
  const selectOrdenarPessoa = document.getElementById('select-ordenar-pessoa');

  const handlerFiltro = () => {
    setFiltros({
      ano: selectAno ? selectAno.value : '',
      mes: selectMes ? selectMes.value : '',
      entidade: selectEntidade ? selectEntidade.value : '',
      tipoPessoa: selectTipoPessoa ? selectTipoPessoa.value : 'todos',
      ordenarPessoa: selectOrdenarPessoa ? selectOrdenarPessoa.value : 'dinheiro'
    });
    if (onFiltroChangedCallback) onFiltroChangedCallback();
  };

  if (selectAno) selectAno.addEventListener('change', handlerFiltro);
  if (selectMes) selectMes.addEventListener('change', handlerFiltro);
  if (selectEntidade) selectEntidade.addEventListener('change', handlerFiltro);
  if (selectTipoPessoa) selectTipoPessoa.addEventListener('change', handlerFiltro);
  if (selectOrdenarPessoa) selectOrdenarPessoa.addEventListener('change', handlerFiltro);
}

export function atualizarVisibilidadeFiltros(aba) {
  const filtrosContainer = document.getElementById('filtros-container');
  const filtrosPadrao = document.getElementById('filtros-padrao');
  const filtrosPessoas = document.getElementById('filtros-pessoas');
  const inputBusca = document.getElementById('input-busca');

  if (!filtrosContainer) return;

  if (aba === 'rankings') {
    filtrosContainer.classList.add('hidden');
    return;
  }

  filtrosContainer.classList.remove('hidden');

  if (inputBusca) {
    if (aba === 'pessoas') {
      inputBusca.placeholder = 'Buscar cidadãos por nome, cargo, matrícula...';
    } else if (aba === 'contracheques') {
      inputBusca.placeholder = 'Buscar contracheque por servidor, cargo ou matrícula...';
    } else if (aba === 'despesas') {
      inputBusca.placeholder = 'Buscar despesa por credor, histórico, empenho...';
    } else if (aba === 'diarias') {
      inputBusca.placeholder = 'Buscar diária por servidor, destino, motivo...';
    } else if (aba === 'contratos') {
      inputBusca.placeholder = 'Buscar contrato por número, contratado, objeto...';
    } else {
      inputBusca.placeholder = 'Buscar por termo, código ou descrição...';
    }
  }

  if (aba === 'pessoas') {
    if (filtrosPadrao) filtrosPadrao.classList.add('hidden');
    if (filtrosPessoas) filtrosPessoas.classList.remove('hidden');
  } else {
    if (filtrosPadrao) filtrosPadrao.classList.remove('hidden');
    if (filtrosPessoas) filtrosPessoas.classList.add('hidden');
  }
}

export default { initFiltros, atualizarVisibilidadeFiltros };
