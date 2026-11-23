/**
 * Módulo de Tabela — Diárias de Viagem & Deslocamentos Oficiais
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoDiarias() {
  return `
    <tr>
      <th class="py-3 px-4">Data Viagem</th>
      <th class="py-3 px-4">Entidade</th>
      <th class="py-3 px-4">Servidor Beneficiário</th>
      <th class="py-3 px-4">Tipo Diária</th>
      <th class="py-3 px-4">Destino / Motivo</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thValorDiaria', { label: 'Valor Diária', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasDiarias(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="6" class="py-12 text-center text-slate-500 font-medium">Nenhuma diária encontrada para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  registros.forEach((r, idx) => {
    const isSaude = (r.entidade || '').includes('Saúde');
    const badgeEnt = isSaude
      ? '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-900/40 text-cyan-300 border border-cyan-800">Saúde</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-800">Prefeitura</span>';

    const rowId = `diar-${idx}`;

    html += `
      <tr onclick="window.toggleSubRow && window.toggleSubRow('${rowId}')" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para expandir detalhes da viagem">
        <td class="py-3 px-4 font-mono text-xs text-slate-400">
          <div class="font-bold text-white group-hover:text-amber-300 transition">${escapeHtml(r.data_viagem || `${r.ano}/${String(r.mes || '').padStart(2, '0')}`)}</div>
          <div class="text-xs text-slate-500">Emp: ${escapeHtml(r.nr_empenho || '-')}</div>
        </td>
        <td class="py-3 px-4">${badgeEnt}</td>
        <td class="py-3 px-4 font-medium text-white group-hover:text-amber-300 transition">${escapeHtml(r.servidor)}</td>
        <td class="py-3 px-4 text-slate-300 text-xs">${escapeHtml(r.tipo_diaria || 'Diária')}</td>
        <td class="py-3 px-4 text-slate-400 text-xs max-w-md truncate" title="${escapeHtml(r.motivo || '')}">${escapeHtml(r.motivo || '-')}</td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-amber-400">
          <div class="flex items-center justify-end space-x-2">
            <span>${formatMoeda(r.valor)}</span>
            <span class="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition font-mono font-bold">›</span>
          </div>
        </td>
      </tr>
      <tr id="${rowId}" class="hidden bg-slate-950/70 border-b border-slate-800">
        <td colspan="6" class="p-4 text-xs text-slate-300">
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span class="font-bold text-white font-mono flex items-center gap-2">
                <span>✈️ Viagem Oficial • ${escapeHtml(r.servidor)}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300">${escapeHtml(r.tipo_diaria || 'Diária')}</span>
              </span>
              <span class="text-amber-400 font-mono font-bold text-sm">${formatMoeda(r.valor)}</span>
            </div>
            <p class="text-slate-300 leading-relaxed font-sans pt-1"><strong>Finalidade / Destino / Motivo:</strong> ${escapeHtml(r.motivo || 'Sem detalhamento de itinerário informado.')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
              <div><span class="text-slate-500">Período / Data:</span> <strong class="text-white">${escapeHtml(r.data_viagem || `${r.ano}/${r.mes}`)}</strong></div>
              <div><span class="text-slate-500">Órgão Emissor:</span> <strong class="text-slate-300">${escapeHtml(r.entidade)}</strong></div>
              <div><span class="text-slate-500">Empenho:</span> <strong class="text-slate-300">${escapeHtml(r.nr_empenho || '-')}</strong></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  return html;
}

export default { renderCabecalhoDiarias, renderLinhasDiarias };
