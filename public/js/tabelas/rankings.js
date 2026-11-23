/**
 * Módulo de Visualização — Rankings Institucionais
 * Portal da Transparência de Arinos / MG
 */

import { fetchRankings } from '../api.js';
import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';

export async function carregarRankingsUI() {
  const salList = document.getElementById('ranking-salarios-list');
  const credList = document.getElementById('ranking-credores-list');
  const diarList = document.getElementById('ranking-diarias-list');

  if (salList) salList.innerHTML = '<div class="py-6 text-center text-slate-500 font-mono text-xs animate-pulse">Carregando maiores remunerações...</div>';
  if (credList) credList.innerHTML = '<div class="py-6 text-center text-slate-500 font-mono text-xs animate-pulse">Carregando maiores credores...</div>';
  if (diarList) diarList.innerHTML = '<div class="py-6 text-center text-slate-500 font-mono text-xs animate-pulse">Carregando maiores beneficiários...</div>';

  try {
    const data = await fetchRankings();

    // 1. Top Salários
    if (salList) {
      salList.innerHTML = (data.topSalarios || []).map((s, idx) => `
        <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">${idx + 1}</span>
            <div>
              <p class="text-xs font-semibold text-white">${escapeHtml(s.nome)}</p>
              <p class="text-[11px] text-slate-400">${escapeHtml(s.cargo || 'Cargo não informado')} • ${s.ano}/${String(s.mes || '').padStart(2, '0')}</p>
            </div>
          </div>
          <span class="font-mono text-xs font-bold text-emerald-400">${formatMoeda(s.total_proventos)}</span>
        </div>
      `).join('') || '<div class="text-xs text-slate-500 py-4 text-center">Nenhum dado disponível</div>';
    }

    // 2. Top Credores
    if (credList) {
      credList.innerHTML = (data.topCredores || []).map((c, idx) => `
        <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs flex items-center justify-center font-mono">${idx + 1}</span>
            <div class="max-w-[180px] truncate">
              <p class="text-xs font-semibold text-white truncate" title="${escapeHtml(c.credor)}">${escapeHtml(c.credor)}</p>
              <p class="text-[11px] text-slate-400">${c.qtd_empenhos} empenhos (${c.de_ano}-${c.ate_ano})</p>
            </div>
          </div>
          <span class="font-mono text-xs font-bold text-cyan-400">${formatMoeda(c.volume_total)}</span>
        </div>
      `).join('') || '<div class="text-xs text-slate-500 py-4 text-center">Nenhum dado disponível</div>';
    }

    // 3. Top Diárias
    if (diarList) {
      diarList.innerHTML = (data.topDiarias || []).map((d, idx) => `
        <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 rounded-full bg-amber-950 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">${idx + 1}</span>
            <div class="max-w-[180px] truncate">
              <p class="text-xs font-semibold text-white truncate" title="${escapeHtml(d.servidor)}">${escapeHtml(d.servidor)}</p>
              <p class="text-[11px] text-slate-400">${d.qtd_diarias} viagens (${d.de_ano}-${d.ate_ano})</p>
            </div>
          </div>
          <span class="font-mono text-xs font-bold text-amber-400">${formatMoeda(d.volume_total)}</span>
        </div>
      `).join('') || '<div class="text-xs text-slate-500 py-4 text-center">Nenhum dado disponível</div>';
    }
  } catch (err) {
    console.error('Erro ao renderizar rankings:', err);
    if (salList) salList.innerHTML = `<div class="py-4 text-center text-rose-400 text-xs">Erro ao carregar dados: ${escapeHtml(err.message)}</div>`;
  }
}

export default { carregarRankingsUI };
