/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 DIÁRIAS & VIAGENS OFICIAIS
 * Registros de deslocamentos, transporte de pacientes e viagens a serviço
 * ==============================================================================
 */

import { fetchDiarias } from '../api.js';
import { renderTabela } from './tabela.js';
import { renderPaginacao } from './paginacao.js';

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

export async function renderDiariasView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-blue">DESLOCAMENTOS OFICIAIS</span>
            <span class="badge badge-green">41.299 Registros em SQLite</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">✈️ Diárias de Viagem & Deslocamentos</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Registro público de todas as diárias concedidas a servidores públicos e agentes políticos para transporte de pacientes a hospitais, reuniões em Brasília e Belo Horizonte, e missões oficiais.
          </p>
        </div>
        <div>
          <a href="#rankings" class="btn" style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fcd34d; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            🏆 Ver Ranking de Diárias ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Barra de Filtro -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <input type="text" id="diarias-busca" placeholder="🔍 Buscar por servidor, motorista ou beneficiário..." 
               style="flex: 1; min-width: 280px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        <button id="diarias-btn-filtrar" class="btn-primary" style="padding: 10px 20px; font-size: 13px;">
          Pesquisar
        </button>
      </div>
    </div>

    <!-- Conteúdo da Tabela -->
    <div id="diarias-content" style="padding: 20px; text-align: center; color: var(--text-muted);">
      Consultando diárias no banco SQLite oficial...
    </div>
  `;

  const inputBusca = container.querySelector('#diarias-busca');
  const btnFiltrar = container.querySelector('#diarias-btn-filtrar');
  const content = container.querySelector('#diarias-content');

  async function carregar(page) {
    content.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted);">Consultando banco SQLite oficial...</div>';
    try {
      const resp = await fetchDiarias({ page, limit: 20, busca: inputBusca.value.trim() });
      content.innerHTML = '';

      if (!resp.dados || resp.dados.length === 0) {
        content.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhuma diária localizada para o termo informado.</div>';
        return;
      }

      const colunas = [
        { chave: 'nome', titulo: 'Beneficiário / Servidor' },
        { chave: 'tipo', titulo: 'Tipo de Viagem' },
        { chave: 'periodo', titulo: 'Período', align: 'center' },
        { chave: 'valor', titulo: 'Valor Concedido', align: 'right' },
        { chave: 'fonte', titulo: 'Origem Contábil' }
      ];

      const formatadores = {
        periodo: (v, item) => `${String(item.mes).padStart(2,'0')}/${item.ano}`,
        valor: v => `<strong style="color: #fbbf24; font-family: 'JetBrains Mono', monospace;">${formatMoeda(v)}</strong>`,
        fonte: v => `<span class="badge badge-blue">${v || 'ADPMNET'}</span>`
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
