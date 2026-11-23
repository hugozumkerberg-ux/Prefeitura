/**
 * Submódulo de Modal — Diárias de Viagem & Deslocamentos Oficiais
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';

export function renderDiariasPessoa(p, data) {
  if ((!p.total_diarias || p.total_diarias <= 0) && (!data.ultimas_viagens || data.ultimas_viagens.length === 0)) {
    return '';
  }

  return `
    <div class="rounded-xl border border-amber-500/30 overflow-hidden bg-slate-800/30">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-diarias')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-amber-400 text-base">✈️</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-amber-300 transition">
              Diárias de Viagem & Deslocamentos Oficiais
            </h4>
            <p class="text-[11px] text-slate-400">Histórico de viagens pagas com recursos públicos</p>
          </div>
        </div>
        <div class="flex items-center space-x-3 font-mono text-xs">
          <span class="text-amber-400 font-bold">${formatMoeda(p.total_diarias)} (${p.qtd_diarias || 0} viagens)</span>
          <span id="sanfona-diarias-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
        </div>
      </div>

      <div id="sanfona-diarias" class="p-4 border-t border-slate-700/60 space-y-2">
        ${data.ultimas_viagens && data.ultimas_viagens.length > 0 ? `
          <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            ${data.ultimas_viagens.map(v => `
              <div class="p-2.5 bg-slate-900/60 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-white font-mono">${escapeHtml(v.data_viagem || `${v.ano}/${String(v.mes || '').padStart(2, '0')}`)}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-amber-300 border border-slate-700">${escapeHtml(v.destino || 'Destino Oficial')}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1" title="${escapeHtml(v.motivo || '')}">${escapeHtml(v.motivo || 'Motivo empenhado no sistema')}</p>
                </div>
                <div class="text-right whitespace-nowrap">
                  <span class="font-mono font-bold text-amber-400">${formatMoeda(v.valor)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-xs text-slate-500 italic">Nenhum detalhe adicional de viagem registrado no período.</div>
        `}
      </div>
    </div>
  `;
}

export default { renderDiariasPessoa };
