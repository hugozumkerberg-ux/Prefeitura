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
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input type="text" id="diarias-busca" placeholder="🔍 Buscar por servidor, motorista ou beneficiário..." 
               style="flex: 1; min-width: 240px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        <select id="diarias-periodo" style="min-width: 175px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
          <option value="">Todos os Mandatos / Anos</option>
          <optgroup label="🏛️ Mandatos Executivos">
            <option value="mandato:2025-2028">Mandato 2025–2028 (Atual)</option>
            <option value="mandato:2021-2024">Mandato 2021–2024 (Marcilio)</option>
            <option value="mandato:2017-2020">Mandato 2017–2020 (Carlos Alberto)</option>
            <option value="mandato:2013-2016">Mandato 2013–2016 (Roberto Sales)</option>
          </optgroup>
          <optgroup label="📅 Anos Individuais">
            <option value="ano:2026">Ano 2026</option>
            <option value="ano:2025">Ano 2025</option>
            <option value="ano:2024">Ano 2024</option>
            <option value="ano:2023">Ano 2023</option>
            <option value="ano:2022">Ano 2022</option>
            <option value="ano:2021">Ano 2021</option>
            <option value="ano:2020">Ano 2020</option>
            <option value="ano:2019">Ano 2019</option>
            <option value="ano:2018">Ano 2018</option>
            <option value="ano:2017">Ano 2017</option>
            <option value="ano:2016">Ano 2016</option>
            <option value="ano:2015">Ano 2015</option>
            <option value="ano:2014">Ano 2014</option>
            <option value="ano:2013">Ano 2013</option>
          </optgroup>
        </select>
        <select id="diarias-mes" style="width: 150px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
          <option value="">Todos os Meses</option>
          <option value="1">01 - Janeiro</option>
          <option value="2">02 - Fevereiro</option>
          <option value="3">03 - Março</option>
          <option value="4">04 - Abril</option>
          <option value="5">05 - Maio</option>
          <option value="6">06 - Junho</option>
          <option value="7">07 - Julho</option>
          <option value="8">08 - Agosto</option>
          <option value="9">09 - Setembro</option>
          <option value="10">10 - Outubro</option>
          <option value="11">11 - Novembro</option>
          <option value="12">12 - Dezembro</option>
        </select>
        <button id="diarias-btn-filtrar" class="btn-primary" style="padding: 10px 18px; font-size: 13px;">
          Filtrar
        </button>
      </div>
    </div>

    <!-- Conteúdo da Tabela -->
    <div id="diarias-content" style="padding: 20px; text-align: center; color: var(--text-muted);">
      Consultando diárias no banco SQLite oficial...
    </div>
  `;

  const inputBusca = container.querySelector('#diarias-busca');
  const selectPeriodo = container.querySelector('#diarias-periodo');
  const selectMes = container.querySelector('#diarias-mes');
  const btnFiltrar = container.querySelector('#diarias-btn-filtrar');
  const content = container.querySelector('#diarias-content');

  async function carregar(page) {
    content.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted);">Consultando banco SQLite oficial...</div>';
    try {
      const pVal = selectPeriodo.value;
      let mandato = '';
      let ano = '';
      if (pVal.startsWith('mandato:')) mandato = pVal.replace('mandato:', '');
      else if (pVal.startsWith('ano:')) ano = pVal.replace('ano:', '');

      const resp = await fetchDiarias({ 
        page, 
        limit: 20, 
        busca: inputBusca.value.trim(),
        mandato,
        ano,
        periodo: pVal,
        mes: selectMes.value
      });
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
  selectPeriodo.onchange = () => carregar(1);
  selectMes.onchange = () => carregar(1);
  inputBusca.onkeyup = e => { if (e.key === 'Enter') carregar(1); };
  carregar(1);
}
