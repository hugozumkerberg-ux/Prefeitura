/**
 * Módulo de Tabela — Folha de Pagamento & Contracheques
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda, formatMatricula } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export function renderCabecalhoContracheques() {
  return `
    <tr>
      <th class="py-3 px-4">${renderTooltip('thCompetencia', { label: 'Competência' })}</th>
      <th class="py-3 px-4">${renderTooltip('thOrgaoEmissor', { label: 'Entidade' })}</th>
      <th class="py-3 px-4">Matrícula - Nome do Servidor</th>
      <th class="py-3 px-4">Cargo / Função</th>
      <th class="py-3 px-4">${renderTooltip('thNaturezaVinculo', { label: 'Vínculo' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thSalarioBruto', { label: 'Salário Bruto', align: 'right' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thDescontos', { label: 'Descontos', align: 'right' })}</th>
      <th class="py-3 px-4 text-right">${renderTooltip('thSalarioLiquido', { label: 'Salário Líquido', align: 'right' })}</th>
    </tr>
  `;
}

export function renderLinhasContracheques(registros) {
  if (!registros || registros.length === 0) {
    return `<tr><td colspan="8" class="py-12 text-center text-slate-500 font-medium">Nenhum contracheque encontrado para os filtros selecionados.</td></tr>`;
  }

  let html = '';
  for (const r of registros) {
    const isSaude = (r.entidade || '').includes('Saúde');
    const badgeEnt = isSaude
      ? '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-900/40 text-cyan-300 border border-cyan-800">Saúde</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-800">Prefeitura</span>';

    const descVal = r.total_descontos > 0 ? r.total_descontos : Math.max(0, (r.total_proventos - (r.salario_liquido || r.total_proventos)));
    const liqVal = r.salario_liquido || (r.total_proventos - descVal);
    const matrExib = r.matricula_limpa || formatMatricula(r.matricula);

    html += `
      <tr onclick="window.abrirPopupContrachequeDetalhe && window.abrirPopupContrachequeDetalhe(${r.id})" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para ver o contracheque detalhado">
        <td class="py-3 px-4 font-mono text-xs text-white font-bold">${String(r.mes).padStart(2, '0')}/${r.ano}</td>
        <td class="py-3 px-4">${badgeEnt}</td>
        <td class="py-3 px-4 font-medium text-white group-hover:text-emerald-300 transition">
          <div>${escapeHtml(r.nome)}</div>
          <div class="flex items-center space-x-1.5 mt-0.5 font-mono text-xs">
            <span class="text-emerald-400 font-semibold" title="Matrícula Oficial">Matr: ${escapeHtml(matrExib)}</span>
            ${r.matricula_original && r.matricula_original !== matrExib ? `<span class="text-[10px] text-slate-500" title="Matrícula Original ADPM">(${escapeHtml(r.matricula_original)})</span>` : ''}
          </div>
        </td>
        <td class="py-3 px-4 text-slate-300 text-xs">${escapeHtml(r.cargo || '-')}</td>
        <td class="py-3 px-4 text-slate-400 text-xs">${escapeHtml(r.vinculo || '-')}</td>
        <td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">
          <span>${formatMoeda(r.total_proventos)}</span>
        </td>
        <td class="py-3 px-4 text-right font-mono font-medium text-rose-400">
          <span>${descVal > 0 ? '-' + formatMoeda(descVal) : '-'}</span>
        </td>
        <td class="py-3 px-4 text-right font-mono font-extrabold text-white bg-slate-900/40">
          <div class="flex items-center justify-end space-x-2">
            <span>${formatMoeda(liqVal)}</span>
            <span class="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition font-mono">›</span>
          </div>
        </td>
      </tr>
    `;
  }

  return html;
}

export default { renderCabecalhoContracheques, renderLinhasContracheques };
