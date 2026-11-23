/**
 * Componente de UI — Barra de Paginação Superior e Inferior
 * Portal da Transparência de Arinos / MG
 */

import { state, setPagina } from '../state.js';
import { formatMoeda, formatNumber } from '../utils/format.js';

let onPageChangeCallback = null;

export function initPaginacao(onPageChange) {
  onPageChangeCallback = onPageChange;

  const btnAnt = document.getElementById('btn-ant');
  const btnProx = document.getElementById('btn-prox');
  const btnAntInf = document.getElementById('btn-ant-inf');
  const btnProxInf = document.getElementById('btn-prox-inf');

  const navegar = (delta) => {
    const novaPagina = state.paginaAtual + delta;
    if (novaPagina >= 1 && novaPagina <= state.totalPaginas) {
      setPagina(novaPagina);
      if (onPageChangeCallback) onPageChangeCallback(novaPagina);
    }
  };

  if (btnAnt) btnAnt.addEventListener('click', () => navegar(-1));
  if (btnProx) btnProx.addEventListener('click', () => navegar(1));
  if (btnAntInf) btnAntInf.addEventListener('click', () => navegar(-1));
  if (btnProxInf) btnProxInf.addEventListener('click', () => navegar(1));
}

export function atualizarPaginacao(currentState) {
  const { paginaAtual, totalPaginas, totalRegistros, somaFiltrada } = currentState;

  // Totalizadores
  const elTotal = document.getElementById('info-total');
  if (elTotal) elTotal.innerText = formatNumber(totalRegistros);

  const elTotalInf = document.getElementById('info-total-inf');
  if (elTotalInf) elTotalInf.innerText = formatNumber(totalRegistros);

  const elSoma = document.getElementById('info-soma');
  if (elSoma) elSoma.innerText = formatMoeda(somaFiltrada);

  // Páginas
  const elPagina = document.getElementById('info-pagina');
  if (elPagina) elPagina.innerText = `${paginaAtual} / ${totalPaginas || 1}`;

  const elPaginaInf = document.getElementById('info-pagina-inf');
  if (elPaginaInf) elPaginaInf.innerText = `${paginaAtual} / ${totalPaginas || 1}`;

  const elBadgeInf = document.getElementById('info-badge-pagina-inf');
  if (elBadgeInf) elBadgeInf.innerText = `Pág. ${paginaAtual}`;

  // Botões
  const btnAnt = document.getElementById('btn-ant');
  if (btnAnt) btnAnt.disabled = (paginaAtual <= 1);

  const btnAntInf = document.getElementById('btn-ant-inf');
  if (btnAntInf) btnAntInf.disabled = (paginaAtual <= 1);

  const btnProx = document.getElementById('btn-prox');
  if (btnProx) btnProx.disabled = (paginaAtual >= totalPaginas);

  const btnProxInf = document.getElementById('btn-prox-inf');
  if (btnProxInf) btnProxInf.disabled = (paginaAtual >= totalPaginas);
}

export default { initPaginacao, atualizarPaginacao };
