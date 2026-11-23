/**
 * Módulo de Tabela — Despesas Empenhadas e Pagamentos
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoDespesas() {
  return `
    <tr>
      <th class="py-3 px-4">${renderTooltip('thDataEmpenho', { label: 'Data / Empenho' })}</th>
      <th class="py-3 px-4">Entidade</th>
      <th class="py-3 px-4">Credor / Fornecedor</th>
      <th class="py-3 px-4">Natureza da Despesa</th>
      <th class="py-3 px-4">Histórico</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thValorEmpenho', { label: 'Valor Empenhado', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasDespesas(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="6" class="py-12 text-center text-slate-500 font-medium">Nenhuma despesa encontrada para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  registros.forEach((r, idx) => {
    const isSaude = (r.entidade || '').includes('Saúde');
    const badgeEnt = isSaude
      ? '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-900/40 text-cyan-300 border border-cyan-800">Saúde</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-800">Prefeitura</span>';

    const rowId = `desp-${idx}`;

    html += `
      <tr onclick="window.toggleSubRow && window.toggleSubRow('${rowId}')" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para expandir detalhes do empenho">
        <td class="py-3 px-4 font-mono text-xs text-slate-400">
          <div class="font-bold text-white group-hover:text-cyan-300 transition">${escapeHtml(r.data_empenho || `${r.ano}/${String(r.mes || '').padStart(2, '0')}`)}</div>
          <div class="text-xs text-slate-500">Emp: ${escapeHtml(r.nr_empenho || '-')}</div>
        </td>
        <td class="py-3 px-4">${badgeEnt}</td>
        <td class="py-3 px-4 font-medium text-white group-hover:text-cyan-300 transition">
          <div>${escapeHtml(r.credor)}</div>
          ${r.cpf_cnpj ? `<div class="text-xs text-slate-500 font-mono">${escapeHtml(r.cpf_cnpj)}</div>` : ''}
        </td>
        <td class="py-3 px-4 text-slate-300 text-xs max-w-xs truncate">${escapeHtml(r.natureza || '-')}</td>
        <td class="py-3 px-4 text-slate-400 text-xs max-w-sm truncate" title="${escapeHtml(r.historico || '')}">${escapeHtml(r.historico || '-')}</td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-cyan-400">
          <div class="flex items-center justify-end space-x-2">
            <span>${formatMoeda(r.valor)}</span>
            <span class="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition font-mono font-bold">›</span>
          </div>
        </td>
      </tr>
      <tr id="${rowId}" class="hidden bg-slate-950/70 border-b border-slate-800">
        <td colspan="6" class="p-4 text-xs text-slate-300">
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span class="font-bold text-white font-mono flex items-center gap-2">
                <span>📄 Empenho Nº ${escapeHtml(r.nr_empenho || '-')} • Ano ${escapeHtml(r.ano)}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">${escapeHtml(r.entidade)}</span>
              </span>
              <span class="text-cyan-400 font-mono font-bold text-sm">${formatMoeda(r.valor)}</span>
            </div>
            <p class="text-slate-300 leading-relaxed font-sans pt-1"><strong>Histórico Completo da Despesa:</strong> ${escapeHtml(r.historico || 'Sem histórico detalhado disponível.')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
              <div><span class="text-slate-500">Credor / Favorecido:</span> <strong class="text-white">${escapeHtml(r.credor)}</strong></div>
              <div><span class="text-slate-500">Documento (CPF/CNPJ):</span> <strong class="text-slate-300">${escapeHtml(r.cpf_cnpj || '-')}</strong></div>
              <div><span class="text-slate-500">Natureza do Gasto:</span> <strong class="text-slate-300">${escapeHtml(r.natureza || '-')}</strong></div>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  return html;
}

export default { renderCabecalhoDespesas, renderLinhasDespesas };
