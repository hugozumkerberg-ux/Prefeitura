/**
 * Submódulo de Modal — Folha de Pagamento do Último Ano Ativo
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';
import { renderTooltip } from '../../utils/tooltips.js';

export function renderFolhaUltimoAno(data) {
  if (!data.folha_ultimo_ano || !data.folha_ultimo_ano.meses || data.folha_ultimo_ano.meses.length === 0) return '';

  const anoAtivo = data.folha_ultimo_ano;

  return `
    <div class="rounded-xl border border-emerald-500/40 overflow-hidden bg-slate-800/40">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-folha-atual')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-emerald-400 text-base">💼</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-emerald-300 transition">
              Folha de Pagamento do Último Ano (${escapeHtml(anoAtivo.ano)})
            </h4>
            <p class="text-[11px] text-slate-400">${escapeHtml(anoAtivo.cargos || 'Servidor Municipal')}</p>
          </div>
        </div>
        <div class="flex items-center space-x-3 font-mono text-xs">
          <div class="text-right">
            <span class="text-emerald-400 font-bold block">Bruto: ${formatMoeda(anoAtivo.total_proventos)}</span>
            <span class="text-[11px] text-emerald-300 font-semibold block">Líq: ${formatMoeda(anoAtivo.total_liquido || (anoAtivo.total_proventos - anoAtivo.total_descontos))}</span>
            <span class="text-[10px] text-slate-400">Desc: -${formatMoeda(anoAtivo.total_descontos)} (${anoAtivo.meses.length} folhas)</span>
          </div>
          <span id="sanfona-folha-atual-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
        </div>
      </div>

      <div id="sanfona-folha-atual" class="p-3 border-t border-slate-700/60 overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-800/80 text-slate-400 font-mono uppercase text-[11px]">
            <tr>
              <th class="py-2.5 px-3">Competência</th>
              <th class="py-2.5 px-3">Tipo de Folha</th>
              <th class="py-2.5 px-3 text-right">Salário Bruto</th>
              <th class="py-2.5 px-3 text-right">Descontos</th>
              <th class="py-2.5 px-3 text-right">Salário Líquido</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 font-mono">
            ${anoAtivo.meses.map(m => {
              let badgeFolha = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-sans">Normal</span>';
              if (m.is_13) {
                badgeFolha = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-600/50 font-sans font-bold">🎁 13º Salário</span>';
              } else if (m.is_ferias) {
                badgeFolha = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/50 font-sans font-bold">🏖️ Férias</span>';
              }

              return `
                <tr onclick="window.abrirPopupContrachequeDetalhe && window.abrirPopupContrachequeDetalhe(${m.id})" class="hover:bg-slate-800/80 cursor-pointer transition select-none group border-b border-slate-800/60" title="Clique para ver o contracheque detalhado">
                  <td class="py-2.5 px-3 font-bold text-white group-hover:text-emerald-300 transition">${String(m.mes).padStart(2, '0')}/${m.ano}</td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center space-x-1.5 flex-wrap">
                      ${badgeFolha}
                      <span class="text-[11px] text-slate-400 font-sans truncate max-w-[140px]">${escapeHtml(m.tipo_folha || '')}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-right text-emerald-400 font-bold">${formatMoeda(m.total_proventos)}</td>
                  <td class="py-2.5 px-3 text-right text-rose-400">${m.total_descontos > 0 ? '-' + formatMoeda(m.total_descontos) : '-'}</td>
                  <td class="py-2.5 px-3 text-right text-white font-bold">
                    <div class="flex items-center justify-end space-x-2">
                      <span>${formatMoeda(m.salario_liquido || (m.total_proventos - (m.total_descontos || 0)))}</span>
                      <span class="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition font-mono">›</span>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export default { renderFolhaUltimoAno };
