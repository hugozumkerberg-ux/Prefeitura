/**
 * Submódulo de Modal — Empresas Vinculadas & Contratos no Mandato
 * Portal da Transparência de Arinos / MG
 */

import { formatMoeda } from '../../utils/format.js';
import { escapeHtml } from '../../utils/escape.js';

export function renderEmpresas(p, data) {
  if (!p.is_socio_empresa || !data.empresas_detalhe || data.empresas_detalhe.length === 0) return '';

  return `
    <div class="rounded-xl border border-amber-600/40 overflow-hidden bg-amber-950/20">
      <div onclick="window.toggleSanfona && window.toggleSanfona('sanfona-empresas')" class="p-3.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between select-none group transition">
        <div class="flex items-center space-x-2.5">
          <span class="text-amber-400 text-base">⚠️</span>
          <div>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider font-mono group-hover:text-amber-300 transition">
              Empresas Vinculadas & Contratos no Período do Mandato
            </h4>
            <p class="text-[11px] text-slate-400">Cruzamento de sócios com contratos e empenhos da prefeitura</p>
          </div>
        </div>
        <div class="flex items-center space-x-2.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
            ${data.empresas_detalhe.length} Empresas
          </span>
          <span id="sanfona-empresas-icon" class="text-xs text-slate-400 font-mono group-hover:text-white transition">▼</span>
        </div>
      </div>

      <div id="sanfona-empresas" class="p-4 border-t border-amber-800/40 space-y-3">
        ${data.empresas_detalhe.map(emp => `
          <div class="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div>
                <p class="font-bold text-white text-xs">${escapeHtml(emp.razao_social)}</p>
                <p class="text-[11px] text-slate-400 font-mono">CNPJ: ${escapeHtml(emp.cnpj)} • Qualificação: ${escapeHtml(emp.qualificacao || 'Sócio')}</p>
              </div>
              <div class="text-right font-mono">
                <span class="text-xs text-amber-400 font-bold">Faturamento da Empresa: ${formatMoeda(emp.info ? emp.info.total_geral : 0)}</span>
                <p class="text-[10px] text-slate-500">${emp.info ? emp.info.qtd_contratos : 0} contratos • ${emp.info ? emp.info.qtd_despesas : 0} empenhos</p>
              </div>
            </div>

            ${emp.contratos && emp.contratos.length > 0 ? `
              <div class="space-y-1.5 pt-1">
                <span class="text-[10px] font-bold text-amber-300 uppercase font-mono">Contratos Firmados com o Município durante os Mandatos:</span>
                <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  ${emp.contratos.map(c => `
                    <div class="p-2 bg-slate-800/60 rounded border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="space-y-0.5">
                        <div class="flex items-center space-x-2">
                          <span class="font-bold text-white font-mono">Contrato Nº ${escapeHtml(c.nr_contrato)}</span>
                          <span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-mono">${escapeHtml(c.gestao_mandato)}</span>
                        </div>
                        <p class="text-[11px] text-slate-400 line-clamp-1" title="${escapeHtml(c.objeto || '')}">${escapeHtml(c.objeto || '-')}</p>
                        <span class="text-[10px] text-slate-500 font-mono">Assinatura: ${escapeHtml(c.dt_assinatura || '-')} • Vigência: ${escapeHtml(c.dt_ini_vigencia || '-')} a ${escapeHtml(c.dt_fim_vigencia || '-')}</span>
                      </div>
                      <div class="text-right whitespace-nowrap">
                        <span class="font-mono font-bold text-emerald-400 text-xs">${formatMoeda(c.valor)}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="text-[11px] text-slate-500 italic">Nenhum contrato direto encontrado no banco sob este CNPJ.</div>
            `}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export default { renderEmpresas };
