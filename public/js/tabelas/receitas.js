/**
 * Módulo de Tabela — Receitas Públicas e Arrecadação
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoReceitas() {
  return `
    <tr>
      <th class="py-3 px-4">Data Arrecadação</th>
      <th class="py-3 px-4">Classificação / Descrição</th>
      <th class="py-3 px-4">Código Máscara</th>
      <th class="py-3 px-4">Ano / Conhecimento</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thValorReceita', { label: 'Valor Arrecadado', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasReceitas(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="5" class="py-12 text-center text-slate-500 font-medium">Nenhuma receita encontrada para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  for (const r of registros) {
    html += `
      <tr class="hover:bg-slate-800/40 transition border-b border-slate-800/60">
        <td class="py-3 px-4 font-mono text-xs text-slate-400">${escapeHtml(r.data_receita || r.ano)}</td>
        <td class="py-3 px-4 font-medium text-white text-xs">${escapeHtml(r.descricao_receita || '-')}</td>
        <td class="py-3 px-4 font-mono text-xs text-teal-400">${escapeHtml(r.mascara_receita || '-')}</td>
        <td class="py-3 px-4 font-mono text-xs text-slate-400">${escapeHtml(r.ano)} / Conhec: ${escapeHtml(r.nr_conhecimento || '-')}</td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-teal-400">${formatMoeda(r.valor)}</td>
      </tr>
    `;
  }

  return html;
}

export default { renderCabecalhoReceitas, renderLinhasReceitas };
