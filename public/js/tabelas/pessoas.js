/**
 * Módulo de Tabela — Cidadãos, Servidores & Pessoas Unificadas
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda, formatarMascaraAnoMeses } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoPessoas() {
  return `
    <tr>
      <th class="py-3 px-4">${renderTooltip('thCidadao', { label: 'Cidadão / Nome' })}</th>
      <th class="py-3 px-4">${renderTooltip('thPerfilVinculo', { label: 'Perfil & Vínculo' })}</th>
      <th class="py-3 px-4">${renderTooltip('thMatriculas', { label: 'Matrículas' })}</th>
      <th class="py-3 px-4">${renderTooltip('thCargos', { label: 'Cargos Desempenhados' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thSalariosAcumulados', { label: 'Salários Acumulados', align: 'right' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thDiarias', { label: 'Diárias de Viagem', align: 'right' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thTotalDinheiroPublico', { label: 'TOTAL DINHEIRO PÚBLICO', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasPessoas(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="7" class="py-12 text-center text-slate-500 font-medium">Nenhum cidadão ou servidor encontrado para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  for (const r of registros) {
    let badgeTipo = 'bg-slate-800 text-slate-300 border-slate-700';
    let icone = '👤';
    if (r.is_prefeito) { badgeTipo = 'bg-rose-950/70 text-rose-300 border-rose-800'; icone = '👔'; }
    else if (r.is_vereador) { badgeTipo = 'bg-amber-950/70 text-amber-300 border-amber-800'; icone = '🏛️'; }
    else if (r.is_socio_empresa) { badgeTipo = 'bg-purple-950/70 text-purple-300 border-purple-800'; icone = '⚠️'; }

    const matCount = r.qtd_matriculas || 1;
    const matPrimeira = (r.matriculas && r.matriculas[0]) ? r.matriculas[0].replace(/^0+/, '').replace('.', '-') : '-';
    const badgeMat = matCount > 1 
      ? `<span class="has-tooltip tooltip-bottom" tabindex="0">
           <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-700">${matCount} Matrículas</span>
           <div class="tooltip-box">
             <span class="tooltip-title">Matrículas Unificadas</span>
             <span class="tooltip-body">Histórico funcional com múltiplos vínculos:\n• ${(r.matriculas || []).map(m => m.replace(/^0+/, '').replace('.', '-')).join('\n• ')}</span>
           </div>
         </span>`
      : `<span class="text-xs text-slate-300 font-mono font-medium">${escapeHtml(matPrimeira)}</span>`;

    const avatarHtml = r.foto_url 
      ? `<div class="relative flex-shrink-0" title="Foto Oficial Auditada (ID #${r.foto_id || '-'})">
           <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/70 shadow-sm bg-slate-800">
             <img src="${escapeHtml(r.foto_url)}" alt="${escapeHtml(r.nome_exibicao)}" class="w-full h-full object-cover">
           </div>
           <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" title="Identidade Auditada"></span>
         </div>`
      : `<div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base flex-shrink-0">${icone}</div>`;

    html += `
      <tr onclick="window.abrirModalPessoa && window.abrirModalPessoa(${r.id})" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para abrir a Ficha 360° de ${escapeHtml(r.nome_exibicao)}">
        <td class="py-3 px-4">
          <div class="flex items-center space-x-3">
            ${avatarHtml}
            <div class="min-w-0">
              <div class="font-bold text-white group-hover:text-emerald-300 transition flex items-center space-x-1.5 flex-wrap">
                <span>${escapeHtml(r.nome_exibicao)}</span>
                ${r.foto_id ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60" title="Foto Auditada SHA-256">ID #${r.foto_id}</span>` : ''}
              </div>
              ${r.partido_politico ? `<div class="text-[11px] text-slate-400 font-medium font-mono">Partido: ${escapeHtml(r.partido_politico)}</div>` : ''}
              <div class="text-[11px] text-emerald-400 font-medium font-mono mt-0.5 flex items-center gap-1">
                <span>⏱️ Tempo: ${formatarMascaraAnoMeses(r.qtd_contracheques || 0)}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-xs font-medium border ${badgeTipo}">${escapeHtml(r.perfil_tipo)}</span>
          ${r.is_socio_empresa ? `<div class="text-[10px] text-amber-400 font-medium mt-1">⚠️ Sócio Fornecedor</div>` : ''}
        </td>
        <td class="py-3 px-4">${badgeMat}</td>
        <td class="py-3 px-4 text-xs text-slate-300 max-w-xs truncate" title="${escapeHtml(r.cargos_resumo || '')}">${escapeHtml(r.cargos_resumo || '-')}</td>
        <td class="py-3 px-4 text-right font-mono text-xs text-slate-300">
          <div class="text-right">
            <div class="text-emerald-400 font-bold">Bruto: ${formatMoeda(r.total_salarios)}</div>
            <div class="text-[10px] text-slate-300 font-mono">Líq. Est.: ${formatMoeda(r.total_salarios * 0.78)}</div>
            <div class="text-[10px] text-slate-500">${r.qtd_contracheques || 0} folhas (${formatarMascaraAnoMeses(r.qtd_contracheques || 0)})</div>
          </div>
        </td>
        <td class="py-3 px-4 text-right font-mono text-xs text-amber-400">
          <div>${formatMoeda(r.total_diarias)}</div>
          <div class="text-[10px] text-slate-500">${r.qtd_diarias || 0} viagens</div>
        </td>
        <td class="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-400 bg-emerald-950/20 rounded">
          <div class="flex items-center justify-end space-x-2">
            <span>${formatMoeda(r.total_dinheiro_publico)}</span>
            <span class="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition font-mono">›</span>
          </div>
        </td>
      </tr>
    `;
  }

  return html;
}

export default { renderCabecalhoPessoas, renderLinhasPessoas };
