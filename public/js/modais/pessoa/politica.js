/**
 * Submódulo de Modal — Trajetória Política, Mandatos & Eleições TSE
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda, formatNumber } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';

export function renderPolitica(data) {
  const hasMandatos = data.mandatos_historico && data.mandatos_historico.length > 0;
  const hasEleitoral = data.historico_eleitoral && data.historico_eleitoral.length > 0;
  const hasCamara = data.materias_camara && data.materias_camara.length > 0;

  if (!hasMandatos && !hasEleitoral && !hasCamara) return '';

  return `
    <div class="rounded-xl border border-blue-500/40 overflow-hidden bg-slate-900/60">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-politica')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-blue-400 text-base">🗳️</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-blue-300 transition">
              Trajetória na Vida Política, Mandatos & Eleições TSE
            </h4>
            <p class="text-[11px] text-slate-400">Disputas eleitorais, votos, bens declarados e atuação legislativa (SAPL)</p>
          </div>
        </div>
        <div class="flex items-center space-x-2.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
            ${(data.historico_eleitoral || []).length} Disputas TSE
          </span>
          <span id="sanfona-politica-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
        </div>
      </div>

      <div id="sanfona-politica" class="p-4 border-t border-slate-800 space-y-3">
        ${hasMandatos ? `
          <div class="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
            <span class="text-[11px] font-bold text-blue-300 uppercase font-mono">🏛️ Mandatos Exercidos no Município</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${data.mandatos_historico.map(m => `
                <div class="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong class="text-white">${escapeHtml(m.cargo)}</strong>
                    <p class="text-[11px] text-slate-400 font-mono">${escapeHtml(m.tipo || '')}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold text-[11px] border border-blue-800">${escapeHtml(m.mandato)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${hasEleitoral ? `
          <div class="space-y-1.5 pt-1">
            <span class="text-[11px] font-bold text-slate-300 uppercase font-mono">Disputas Eleitorais Registradas no TSE</span>
            <div class="overflow-x-auto rounded-lg border border-slate-800">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-800/80 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th class="py-2 px-3">Ano</th>
                    <th class="py-2 px-3">Cargo Disputado</th>
                    <th class="py-2 px-3">Nome Urna</th>
                    <th class="py-2 px-3">Partido</th>
                    <th class="py-2 px-3">Resultado</th>
                    <th class="py-2 px-3 text-right">Votos</th>
                    <th class="py-2 px-3 text-right">Bens Declarados</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 font-mono">
                  ${data.historico_eleitoral.map(ele => {
                    const isEleito = (ele.resultado || '').toLowerCase().includes('eleito');
                    const resClass = isEleito ? 'text-emerald-400 font-bold' : 'text-slate-400';
                    return `
                      <tr class="hover:bg-slate-800/40">
                        <td class="py-2 px-3 font-bold text-white">${escapeHtml(ele.ano)}</td>
                        <td class="py-2 px-3 text-slate-200">${escapeHtml(ele.cargo)}</td>
                        <td class="py-2 px-3 text-amber-300 font-semibold font-sans">"${escapeHtml(ele.nome_urna)}"</td>
                        <td class="py-2 px-3"><span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300 text-[10px]">${escapeHtml(ele.partido_sigla)}</span></td>
                        <td class="py-2 px-3 ${resClass}">${escapeHtml(ele.resultado)}</td>
                        <td class="py-2 px-3 text-right">${formatNumber(ele.votos || 0)}</td>
                        <td class="py-2 px-3 text-right text-emerald-400 font-bold">${formatMoeda(ele.total_bens)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${hasCamara ? `
          <div class="pt-2 border-t border-slate-800/80">
            <span class="text-[11px] font-bold text-purple-300 uppercase font-mono">⚖️ Atuação no Legislativo Municipal (Câmara / SAPL)</span>
            <div class="mt-1.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${data.materias_camara.map(mat => `
                <div class="p-2 bg-slate-900/60 rounded border border-slate-800/80 text-xs">
                  <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span class="text-purple-300 font-bold">${escapeHtml(mat.tipo)} Nº ${escapeHtml(mat.numero)}/${escapeHtml(mat.ano)}</span>
                    <span>${escapeHtml(mat.data_apresentacao || '')}</span>
                  </div>
                  <p class="text-slate-300 mt-0.5 line-clamp-2">${escapeHtml(mat.ementa)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export default { renderPolitica };
