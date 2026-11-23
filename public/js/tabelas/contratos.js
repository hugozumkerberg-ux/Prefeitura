/**
 * Módulo de Tabela — Contratos Administrativos & Aditivos
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoContratos() {
  return `
    <tr>
      <th class="py-3 px-4">Contrato / Proc.</th>
      <th class="py-3 px-4">Contratado / Credor</th>
      <th class="py-3 px-4">Tipo Contrato</th>
      <th class="py-3 px-4">${renderTooltip('thVigenciaContrato', { label: 'Vigência' })}</th>
      <th class="py-3 px-4">Objeto</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thValorContratado', { label: 'Valor Contratado', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasContratos(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="6" class="py-12 text-center text-slate-500 font-medium">Nenhum contrato encontrado para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  registros.forEach((r, idx) => {
    const rowId = `cont-${idx}`;

    html += `
      <tr onclick="window.toggleSubRow && window.toggleSubRow('${rowId}')" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para expandir detalhes do contrato">
        <td class="py-3 px-4 font-mono text-xs text-slate-400">
          <div class="font-bold text-white group-hover:text-blue-300 transition">Nº ${escapeHtml(r.nr_contrato || '-')}</div>
          <div class="text-xs text-slate-500">Proc: ${escapeHtml(r.nr_processo || '-')}</div>
        </td>
        <td class="py-3 px-4 font-medium text-white group-hover:text-blue-300 transition">
          <div>${escapeHtml(r.credor)}</div>
          ${r.doc_credor ? `<div class="text-xs text-slate-500 font-mono">${escapeHtml(r.doc_credor)}</div>` : ''}
        </td>
        <td class="py-3 px-4 text-xs text-blue-300">${escapeHtml(r.tipo_contrato || 'Contrato')}</td>
        <td class="py-3 px-4 text-xs text-slate-400 font-mono">
          <div>Início: ${escapeHtml(r.dt_ini_vigencia || r.dt_assinatura || '-')}</div>
          <div>Fim: ${escapeHtml(r.dt_fim_vigencia || '-')}</div>
        </td>
        <td class="py-3 px-4 text-xs text-slate-300 max-w-md truncate" title="${escapeHtml(r.objeto || '')}">${escapeHtml(r.objeto || '-')}</td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-blue-400">
          <div class="flex items-center justify-end space-x-2">
            <span>${formatMoeda(r.valor)}</span>
            <span class="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition font-mono font-bold">›</span>
          </div>
        </td>
      </tr>
      <tr id="${rowId}" class="hidden bg-slate-950/70 border-b border-slate-800">
        <td colspan="6" class="p-4 text-xs text-slate-300">
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span class="font-bold text-white font-mono flex items-center gap-2">
                <span>📑 Contrato Administrativo Nº ${escapeHtml(r.nr_contrato || '-')}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-600/40">${escapeHtml(r.tipo_contrato || 'Contrato')}</span>
              </span>
              <span class="text-blue-400 font-mono font-bold text-sm">${formatMoeda(r.valor)}</span>
            </div>
            <p class="text-slate-300 leading-relaxed font-sans pt-1"><strong>Objeto Contratual Completo:</strong> ${escapeHtml(r.objeto || 'Sem descrição detalhada do objeto.')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
              <div><span class="text-slate-500">Contratado:</span> <strong class="text-white">${escapeHtml(r.credor)}</strong></div>
              <div><span class="text-slate-500">Documento:</span> <strong class="text-slate-300">${escapeHtml(r.doc_credor || '-')}</strong></div>
              <div><span class="text-slate-500">Processo:</span> <strong class="text-slate-300">${escapeHtml(r.nr_processo || '-')}</strong></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  return html;
}

export default { renderCabecalhoContratos, renderLinhasContratos };
