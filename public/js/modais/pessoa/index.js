/**
 * Orquestrador do Modal 360° do Cidadão & Ficha Funcional
 * Portal da Transparência de Arinos / MG
 */

import { fetchPerfilPessoa } from '../../api.js';
import { formatMoeda, formatarMascaraAnoMeses } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';
import { renderTimeline } from './timeline.js';
import { renderPolitica } from './politica.js';
import { renderEmpresas } from './empresas.js';
import { renderFolhaUltimoAno } from './folha.js';
import { renderAnosAnteriores } from './anos.js';
import { renderDiariasPessoa } from './diarias.js';

export async function abrirModalPessoa(id) {
  const modal = document.getElementById('modal-pessoa');
  const corpo = document.getElementById('modal-corpo');
  if (!modal || !corpo) return;

  modal.classList.remove('hidden');
  corpo.innerHTML = '<div class="py-12 text-center text-slate-400 font-mono animate-pulse">Carregando dados 360° do cidadão...</div>';

  try {
    const data = await fetchPerfilPessoa(id);
    const p = data.perfil;

    // Cabeçalho do modal
    const elNome = document.getElementById('modal-nome');
    if (elNome) elNome.innerText = p.nome_exibicao;

    const badgePerfil = document.getElementById('modal-badge-perfil');
    if (badgePerfil) {
      badgePerfil.innerText = p.perfil_tipo;
      if (p.is_prefeito) badgePerfil.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-900/60 text-rose-300 border border-rose-700';
      else if (p.is_vereador) badgePerfil.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-900/60 text-amber-300 border border-amber-700';
      else if (p.is_socio_empresa) badgePerfil.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-900/60 text-purple-300 border border-purple-700';
      else badgePerfil.className = 'text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700';
    }

    const elSub = document.getElementById('modal-subtitulo');
    if (elSub) {
      elSub.innerText = `${p.qtd_matriculas} Matrícula(s) • ${p.cargos_resumo || 'Servidor'} ${p.partido_politico ? '• ' + p.partido_politico : ''}`;
    }

    const avatarContainer = document.getElementById('modal-avatar-container');
    if (avatarContainer) {
      if (p.foto_url) {
        avatarContainer.innerHTML = `
          <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xl relative bg-slate-800">
            <img src="${escapeHtml(p.foto_url)}" alt="${escapeHtml(p.nome_exibicao)}" class="w-full h-full object-cover">
          </div>
        `;
      } else {
        avatarContainer.innerHTML = `
          <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-500/30">👤</div>
        `;
      }
    }

    const badgeFoto = document.getElementById('modal-badge-foto');
    if (badgeFoto) {
      if (p.foto_id) {
        badgeFoto.innerText = `Foto Auditada • ID #${p.foto_id}`;
        badgeFoto.classList.remove('hidden');
      } else {
        badgeFoto.classList.add('hidden');
      }
    }

    // Cards Superiores de KPIs Consolidados
    let htmlCorpo = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/30">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-mono">Total Dinheiro Público</span>
          </div>
          <p class="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">${formatMoeda(p.total_dinheiro_publico)}</p>
          <span class="text-[10px] text-slate-500 font-mono">Salários + Diárias</span>
        </div>
        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-mono">Tempo Efetivo de Serviço</span>
          </div>
          <p class="text-base font-bold text-white font-mono mt-0.5">${escapeHtml(data.tempo_efetivo || formatarMascaraAnoMeses(p.qtd_contracheques || 0))}</p>
          <span class="text-[10px] text-emerald-400 font-mono font-medium">${data.total_meses_efetivos || p.qtd_contracheques || 0} meses ativos (${p.qtd_contracheques || 0} folhas)</span>
        </div>
        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-mono">Salários (Bruto & Líquido)</span>
          </div>
          <p class="text-base font-bold text-emerald-300 font-mono mt-0.5" title="Salário Bruto Total">Bruto: ${formatMoeda(data.total_proventos_acumulado || p.total_salarios)}</p>
          <div class="text-[11px] text-emerald-400 font-mono font-bold mt-0.5" title="Salário Líquido Estimado">Líquido: ${formatMoeda(data.total_liquido_acumulado || (p.total_salarios * 0.78))}</div>
          <div class="text-[10px] text-rose-400 font-mono">Descontos: -${formatMoeda(data.total_descontos_acumulado || 0)}</div>
        </div>
        <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-mono">Diárias Recebidas</span>
          </div>
          <p class="text-base font-bold text-amber-400 font-mono mt-0.5">${formatMoeda(p.total_diarias)}</p>
          <span class="text-[10px] text-slate-500 font-mono">${p.qtd_diarias || 0} viagens registradas</span>
        </div>
      </div>
    `;

    // Concatena seções modulares
    htmlCorpo += renderTimeline(data);
    htmlCorpo += renderPolitica(data);
    htmlCorpo += renderEmpresas(p, data);
    htmlCorpo += renderFolhaUltimoAno(data);
    htmlCorpo += renderAnosAnteriores(data);
    htmlCorpo += renderDiariasPessoa(p, data);

    corpo.innerHTML = htmlCorpo;
  } catch (err) {
    corpo.innerHTML = `<div class="py-8 text-center text-rose-400">Erro ao carregar dados do cidadão: ${escapeHtml(err.message)}</div>`;
  }
}

export function fecharModalPessoa() {
  const modal = document.getElementById('modal-pessoa');
  if (modal) modal.classList.add('hidden');
}

export function toggleSanfona(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(`${id}-icon`);
  if (!el) return;
  const isHidden = el.classList.contains('hidden') || el.style.display === 'none';
  if (isHidden) {
    el.classList.remove('hidden');
    el.style.display = '';
    if (icon) icon.innerText = '▼';
  } else {
    el.classList.add('hidden');
    el.style.display = 'none';
    if (icon) icon.innerText = '▶';
  }
}

export function toggleAnoMeses(idx) {
  const el = document.getElementById(`ano-detalhes-${idx}`);
  const seta = document.getElementById(`ano-seta-${idx}`);
  if (el) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      if (seta) seta.innerText = '▲';
    } else {
      el.classList.add('hidden');
      if (seta) seta.innerText = '▼';
    }
  }
}

export function toggleSubRow(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

// Vincula ao escopo global para compatibilidade com handlers inline
window.abrirModalPessoa = abrirModalPessoa;
window.fecharModalPessoa = fecharModalPessoa;
window.toggleSanfona = toggleSanfona;
window.toggleAnoMeses = toggleAnoMeses;
window.toggleSubRow = toggleSubRow;

export default {
  abrirModalPessoa,
  fecharModalPessoa,
  toggleSanfona,
  toggleAnoMeses,
  toggleSubRow
};
