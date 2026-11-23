/**
 * Submódulo de Modal — Histórico de Anos Anteriores em Sanfona
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';

export function renderAnosAnteriores(data) {
  if (!data.anos_anteriores || data.anos_anteriores.length === 0) return '';

  return `
    <div class="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-800/30">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-anos-anteriores')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-blue-400 text-base">📁</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-blue-300 transition">
              Histórico de Anos Anteriores (${data.anos_anteriores.length} Anos Catalogados)
            </h4>
            <p class="text-[11px] text-slate-400">Separação anual com totais acumulados e detalhamento por mês</p>
          </div>
        </div>
        <span id="sanfona-anos-anteriores-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
      </div>

      <div id="sanfona-anos-anteriores" class="p-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-3">
        ${data.anos_anteriores.map((anoItem, aIdx) => `
          <div class="bg-slate-800/50 rounded-xl border border-slate-700/70 overflow-hidden flex flex-col justify-between">
            <div onclick="window.toggleAnoMeses && window.toggleAnoMeses(${aIdx})" class="p-3.5 bg-slate-800/80 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between select-none group transition">
              <div>
                <div class="flex items-center space-x-2">
                  <span class="text-base font-extrabold text-white font-mono group-hover:text-emerald-300 transition">${escapeHtml(anoItem.ano)}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">${anoItem.total_folhas || (anoItem.meses ? anoItem.meses.length : 0)} folhas</span>
                </div>
                <p class="text-[11px] text-slate-400 italic truncate mt-0.5" title="${escapeHtml(anoItem.cargos || '')}">${escapeHtml(anoItem.cargos || '-')}</p>
              </div>
              <div class="flex items-center space-x-3 text-right font-mono text-xs">
                <div>
                  <span class="text-emerald-400 font-bold block">Bruto: ${formatMoeda(anoItem.total_proventos)}</span>
                  <span class="text-emerald-300 font-semibold block text-[11px]">Líq: ${formatMoeda(anoItem.total_liquido || (anoItem.total_proventos - anoItem.total_descontos))}</span>
                  <span class="text-[10px] text-slate-400">Desc: -${formatMoeda(anoItem.total_descontos)}</span>
                </div>
                <span id="ano-seta-${aIdx}" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
              </div>
            </div>

            <div id="ano-detalhes-${aIdx}" class="hidden p-2.5 border-t border-slate-700/80 bg-slate-900/90 space-y-1.5 max-h-60 overflow-y-auto">
              ${(anoItem.meses || []).map(m => {
                let badgeFolha = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Normal</span>';
                if (m.is_13) badgeFolha = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600/40 font-bold">13º</span>';
                else if (m.is_ferias) badgeFolha = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40 font-bold">Férias</span>';

                return `
                  <div onclick="window.abrirPopupContrachequeDetalhe && window.abrirPopupContrachequeDetalhe(${m.id})" class="flex items-center justify-between text-xs py-2 px-2.5 bg-slate-800/40 rounded border border-slate-800 hover:bg-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition select-none group" title="Clique para ver o contracheque">
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-white font-mono group-hover:text-emerald-300 transition">${String(m.mes).padStart(2, '0')}/${m.ano}</span>
                      ${badgeFolha}
                    </div>
                    <div class="flex items-center space-x-2.5 font-mono">
                      <span class="text-slate-400 text-[11px]" title="Salário Bruto">Bruto: ${formatMoeda(m.total_proventos)}</span>
                      <span class="text-rose-400 text-[10px]" title="Descontos">${m.total_descontos > 0 ? '-' + formatMoeda(m.total_descontos) : ''}</span>
                      <span class="text-emerald-400 font-bold" title="Salário Líquido">Líq: ${formatMoeda(m.salario_liquido || (m.total_proventos - (m.total_descontos || 0)))}</span>
                      <span class="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition font-mono">›</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export default { renderAnosAnteriores };
