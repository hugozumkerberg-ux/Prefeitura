/**
 * Módulo de Tabela — Convênios e Parcerias Oficiais
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoConvenios() {
  return `
    <tr>
      <th class="py-3 px-4">Nº Convênio</th>
      <th class="py-3 px-4">Descrição / Objeto</th>
      <th class="py-3 px-4">Vigência</th>
      <th class="py-3 px-4 text-right">Contrapartida</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thValorConvenio', { label: 'Valor do Convênio', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasConvenios(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="5" class="py-12 text-center text-slate-500 font-medium">Nenhum convênio encontrado para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  for (const r of registros) {
    html += `
      <tr class="hover:bg-slate-800/40 transition border-b border-slate-800/60">
        <td class="py-3 px-4 font-mono text-xs text-slate-400">
          <div class="font-bold text-white">${escapeHtml(r.nr_convenio || '-')}</div>
          <div class="text-xs text-slate-500">ID: ${escapeHtml(r.idcnv || '-')}</div>
        </td>
        <td class="py-3 px-4 text-xs max-w-md">
          <div class="font-medium text-white">${escapeHtml(r.descricao || '-')}</div>
          <div class="text-slate-400 truncate" title="${escapeHtml(r.objeto || '')}">${escapeHtml(r.objeto || '-')}</div>
        </td>
        <td class="py-3 px-4 font-mono text-xs text-slate-400">
          <div>De: ${escapeHtml(r.dt_inicio || r.dt_convenio || '-')}</div>
          <div>Até: ${escapeHtml(r.dt_final || '-')}</div>
        </td>
        <td class="py-3 px-4 text-right font-mono text-xs text-amber-400">${formatMoeda(r.valor_contrapartida)}</td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-indigo-400">${formatMoeda(r.valor_convenio)}</td>
      </tr>
    `;
  }

  return html;
}

export default { renderCabecalhoConvenios, renderLinhasConvenios };
