/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 DESPESAS & EMPENHOS (SIAP)
 * Execução contábil completa: empenhos, liquidações e histórico
 * ==============================================================================
 */

import { fetchDespesas } from '../api.js';
import { renderTabela } from './tabela.js';
import { renderPaginacao } from './paginacao.js';

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

export async function renderDespesasView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-green">EXECUÇÃO CONTÁBIL OFICIAL</span>
            <span class="badge badge-blue">SIAP / ADPMNET Arinos</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">💰 Despesas Públicas & Empenhos</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Auditoria completa de todos os empenhos e liquidações do município de Arinos / MG. Acompanhe os pagamentos efetuados pelo erário a fornecedores, compras públicas e prestadores de serviço.
          </p>
        </div>
        <div>
          <a href="#empresas" class="btn" style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #93c5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            🏢 Ver Lista de Credores ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Barra de Filtro -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <input type="text" id="despesas-busca" placeholder="🔍 Buscar por credor, histórico, número de empenho..." 
               style="flex: 1; min-width: 280px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        <button id="despesas-btn-filtrar" class="btn-primary" style="padding: 10px 20px; font-size: 13px;">
          Pesquisar
        </button>
      </div>
    </div>

    <!-- Conteúdo da Tabela -->
    <div id="despesas-content" style="padding: 20px; text-align: center; color: var(--text-muted);">
      Consultando despesas oficiais no SQLite...
    </div>
  `;

  const inputBusca = container.querySelector('#despesas-busca');
  const btnFiltrar = container.querySelector('#despesas-btn-filtrar');
  const content = container.querySelector('#despesas-content');

  async function carregar(page) {
    content.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted);">Consultando banco SQLite oficial...</div>';
    try {
      const resp = await fetchDespesas({ page, limit: 20, busca: inputBusca.value.trim() });
      content.innerHTML = '';

      if (!resp.dados || resp.dados.length === 0) {
        content.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhuma despesa localizada com o termo pesquisado.</div>';
        return;
      }

      const colunas = [
        { chave: 'ano', titulo: 'Ano', align: 'center' },
        { chave: 'mes', titulo: 'Mês', align: 'center' },
        { chave: 'credor', titulo: 'Credor / Fornecedor' },
        { chave: 'valor', titulo: 'Valor Empenhado', align: 'right' },
        { chave: 'origem', titulo: 'Fonte / Origem' }
      ];

      const formatadores = {
        credor: (v, item) => `<strong>${v || (item.hash ? item.hash.substring(0, 16) + '...' : 'Credor Oficial')}</strong>`,
        valor: v => `<strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">${formatMoeda(v)}</strong>`,
        origem: v => `<span class="badge badge-green">${v || 'SIAP Oficial'}</span>`
      };

      const tabelaEl = renderTabela(colunas, resp.dados, formatadores);
      const paginacaoEl = renderPaginacao(resp.paginacao, p => carregar(p));
      content.appendChild(tabelaEl);
      content.appendChild(paginacaoEl);
    } catch (err) {
      content.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171;">Erro na consulta: ${err.message}</div>`;
    }
  }

  btnFiltrar.onclick = () => carregar(1);
  inputBusca.onkeyup = e => { if (e.key === 'Enter') carregar(1); };
  carregar(1);
}
