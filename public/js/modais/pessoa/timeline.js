/**
 * Submódulo de Modal — Linha do Tempo Funcional & Períodos Efetivos
 * Portal da Transparência de Arinos / MG
 */

import { escapeHtml } from '../../utils/escape.js';

export function renderTimeline(data) {
  if (!data.periodos_timeline || data.periodos_timeline.length === 0) return '';

  return `
    <div class="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-800/40">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-timeline')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-emerald-400 text-base">⏱️</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-emerald-300 transition">
              Linha do Tempo Funcional & Períodos de Exercício
            </h4>
            <p class="text-[11px] text-slate-400">Auditoria de tempo real de serviço e intervalos (gaps)</p>
          </div>
        </div>
        <div class="flex items-center space-x-2.5">
          <span class="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-600/50 rounded-lg text-emerald-300 font-mono font-bold text-xs">
            ${escapeHtml(data.tempo_efetivo || '')} (${data.total_meses_efetivos || 0} meses ativos)
          </span>
          <span id="sanfona-timeline-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
        </div>
      </div>
      <div id="sanfona-timeline" class="p-4 border-t border-slate-700/60 space-y-2">
        <p class="text-[11px] text-slate-400 leading-relaxed pb-1">
          Auditoria pericial de vínculo: intervalos sem recebimento ou exoneração são calculados e destacados separadamente, não sendo somados como tempo de serviço contínuo.
        </p>
        ${data.periodos_timeline.map(item => {
          if (item.tipo === 'periodo_ativo') {
            return `
              <div class="p-2.5 bg-slate-900/90 border border-emerald-500/40 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center space-x-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  <span class="text-xs font-bold text-white font-mono">${escapeHtml(item.descricao)}</span>
                </div>
                <span class="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${escapeHtml(item.cargos || '-')}</span>
              </div>
            `;
          } else {
            return `
              <div class="p-2.5 bg-amber-950/20 border border-amber-600/40 rounded-lg flex items-center justify-between flex-wrap gap-2 text-amber-300 text-xs">
                <div class="flex items-center space-x-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="font-medium">⏸️ ${escapeHtml(item.descricao)}</span>
                </div>
                <span class="text-[10px] text-amber-400 font-mono font-bold uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">Sem Vínculo / Intervalo</span>
              </div>
            `;
          }
        }).join('')}
      </div>
    </div>
  `;
}

export default { renderTimeline };
