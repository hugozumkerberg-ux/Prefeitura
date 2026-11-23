/**
 * Modal Interativo de Contracheque & Demonstrativo de Pagamento (Holerite)
 * Portal da Transparência de Arinos / MG
 */

import { fetchContrachequeDetalhe } from '../api.js';
import { formatMoeda } from '../utils/format.js';
import { escapeHtml } from '../utils/escape.js';
import { renderTooltip } from '../utils/tooltips.js';

export async function abrirPopupContrachequeDetalhe(id) {
  const modal = document.getElementById('modal-contracheque-detalhe');
  const corpo = document.getElementById('holerite-corpo');
  if (!modal || !corpo) return;

  modal.classList.remove('hidden');
  corpo.innerHTML = '<div class="py-12 text-center text-slate-400 font-mono animate-pulse">Consultando demonstrativo detalhado (rubricas, INSS e descontos)...</div>';

  try {
    const data = await fetchContrachequeDetalhe(id);
    const d = data.detalhes || {};

    const badgeTipo = document.getElementById('holerite-badge-tipo');
    if (badgeTipo) {
      badgeTipo.innerText = data.tipo_folha || 'Folha Normal';
      const tipoLower = (data.tipo_folha || '').toLowerCase();
      if (tipoLower.includes('13') || tipoLower.includes('décimo')) {
        badgeTipo.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600/40';
      } else if (tipoLower.includes('férias') || tipoLower.includes('ferias')) {
        badgeTipo.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/40';
      } else {
        badgeTipo.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40';
      }
    }

    const subEl = document.getElementById('holerite-subtitulo');
    if (subEl) {
      subEl.innerText = `Competência: ${String(data.mes).padStart(2, '0')}/${data.ano} • ${data.entidade || 'Prefeitura Municipal'}`;
    }

    const linkOficialBtn = document.getElementById('holerite-link-oficial');
    if (linkOficialBtn) {
      if (d.url_oficial) {
        linkOficialBtn.href = d.url_oficial;
        linkOficialBtn.classList.remove('hidden');
      } else {
        linkOficialBtn.classList.add('hidden');
      }
    }

    const proventos = (d.rubricas || []).filter(r => r.tipo === 'PROVENTO');
    const descontos = (d.rubricas || []).filter(r => r.tipo === 'DESCONTO');

    let corpoHtml = `
      <!-- Ficha de Identificação do Servidor -->
      <div class="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-slate-400 font-mono text-[10px] uppercase block">Nome do Servidor</span>
            <strong class="text-white text-sm font-semibold">${escapeHtml(d.nome || '-')}</strong>
          </div>
          <div>
            <span class="text-slate-400 font-mono text-[10px] uppercase block">Cargo / Função</span>
            <span class="text-emerald-400 font-medium">${escapeHtml(d.cargo || '-')}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-700/50">
          <div>
            <span class="text-slate-400 font-mono text-[10px] uppercase block">Matrícula</span>
            <span class="text-blue-400 font-mono font-bold">${escapeHtml(d.matricula || '-')}</span>
          </div>
          <div>
            <span class="text-slate-400 font-mono text-[10px] uppercase block">Lotação / Órgão</span>
            <span class="text-slate-300 truncate block" title="${escapeHtml(d.lotacao || '')}">${escapeHtml(d.lotacao || 'Geral')}</span>
          </div>
          <div>
            <span class="text-slate-400 font-mono text-[10px] uppercase block">Data Admissão</span>
            <span class="text-slate-300 font-mono">${escapeHtml(d.admissao || 'Não informada')}</span>
          </div>
        </div>
      </div>

      <!-- Grade de Rubricas: Proventos vs Descontos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Coluna de Proventos -->
        <div class="p-3.5 bg-slate-800/40 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
              <span class="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                <span>🟢</span> Proventos & Vencimentos
              </span>
              <span class="text-xs font-mono font-bold text-emerald-400">${formatMoeda(d.total_proventos)}</span>
            </div>
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              ${proventos.length > 0 ? proventos.map(p => `
                <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-300">${escapeHtml(p.descricao)}</span>
                  <span class="font-mono font-medium text-emerald-300 whitespace-nowrap ml-2">${formatMoeda(p.valor)}</span>
                </div>
              `).join('') : '<div class="text-xs text-slate-500 py-2">Nenhuma rubrica discriminada</div>'}
            </div>
          </div>
        </div>

        <!-- Coluna de Descontos -->
        <div class="p-3.5 bg-slate-800/40 rounded-xl border border-rose-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-rose-500/20">
              <span class="text-xs font-bold text-rose-400 uppercase font-mono flex items-center gap-1.5">
                <span>🔴</span> Descontos & Retenções (INSS / IR)
              </span>
              <span class="text-xs font-mono font-bold text-rose-400">${formatMoeda(d.total_descontos)}</span>
            </div>
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              ${descontos.length > 0 ? descontos.map(desc => `
                <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span class="text-slate-300">${escapeHtml(desc.descricao)}</span>
                  <span class="font-mono font-medium text-rose-300 whitespace-nowrap ml-2">-${formatMoeda(desc.valor)}</span>
                </div>
              `).join('') : '<div class="text-xs text-slate-500 py-2">Nenhum desconto registrado</div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Totalizadores e Salário Líquido -->
      <div class="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div class="flex items-center space-x-4">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Total Bruto</span>
            <span class="text-sm font-bold text-emerald-400 font-mono">${formatMoeda(d.total_proventos)}</span>
          </div>
          <div class="text-slate-600 text-lg font-light">-</div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Total Descontos</span>
            <span class="text-sm font-bold text-rose-400 font-mono">${formatMoeda(d.total_descontos)}</span>
          </div>
          <div class="text-slate-600 text-lg font-light">=</div>
        </div>
        <div class="text-right">
          <span class="text-[11px] text-emerald-300 uppercase font-mono font-bold tracking-wider block">Salário Líquido a Receber</span>
          <span class="text-2xl font-black text-white font-mono drop-shadow">${formatMoeda(d.salario_liquido)}</span>
        </div>
      </div>
    `;

    corpo.innerHTML = corpoHtml;
  } catch (err) {
    corpo.innerHTML = `<div class="py-8 text-center text-rose-400 font-medium">Erro ao carregar contracheque: ${escapeHtml(err.message)}</div>`;
  }
}

export function fecharPopupContrachequeDetalhe() {
  const modal = document.getElementById('modal-contracheque-detalhe');
  if (modal) modal.classList.add('hidden');
}

// Binds no escopo global
window.abrirPopupContrachequeDetalhe = abrirPopupContrachequeDetalhe;
window.fecharPopupContrachequeDetalhe = fecharPopupContrachequeDetalhe;

export default { abrirPopupContrachequeDetalhe, fecharPopupContrachequeDetalhe };
