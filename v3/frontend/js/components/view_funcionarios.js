/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 FUNCIONÁRIOS & FOLHA
 * Cópia e refatoração idêntica da página de servidores (tabelas.html) da V2
 * ==============================================================================
 */

import { fetchFolha, fetchStats } from '../api.js';
import { renderTabela } from './tabela.js';
import { renderPaginacao } from './paginacao.js';

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

export async function renderFuncionariosView(container) {
  let estado = {
    page: 1,
    limit: 20,
    busca: '',
    ano: ''
  };

  container.innerHTML = `
    <!-- KPIs Rápidos do Banco Master -->
    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 20px;">
      <div class="card" style="border-left: 4px solid #10b981; padding: 14px 18px;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Contracheques</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;" id="kpi-folha-qtd">133.441</div>
        <div style="font-size: 11px; color: #34d399; font-mono">R$ 279,7 Mi</div>
      </div>

      <div class="card" style="border-left: 4px solid #06b6d4; padding: 14px 18px;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Despesas SIAP</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;">5.064</div>
        <div style="font-size: 11px; color: #38bdf8;">R$ 31,4 Mi</div>
      </div>

      <div class="card" style="border-left: 4px solid #f59e0b; padding: 14px 18px;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Diárias</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;">41.959</div>
        <div style="font-size: 11px; color: #fbbf24;">R$ 5,1 Mi</div>
      </div>

      <div class="card" style="border-left: 4px solid #3b82f6; padding: 14px 18px;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Servidores</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;">5.357</div>
        <div style="font-size: 11px; color: #60a5fa;">Base Única</div>
      </div>

      <div class="card" style="border-left: 4px solid #8b5cf6; padding: 14px 18px;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Volume Auditado</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;">R$ 316,4 Mi</div>
        <div style="font-size: 11px; color: #a78bfa;">Total Consolidado</div>
      </div>
    </div>

    <!-- Barra de Filtros e Busca de Servidores -->
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
          <span>👥</span> Servidores Públicos Municipais & Folha de Pagamento
        </h2>
        <span class="badge badge-green">Base Oficial SQLite (2013–2026)</span>
      </div>

      <div class="filter-bar">
        <input 
          type="text" 
          id="folha-input-busca" 
          class="input-field" 
          placeholder="Buscar por nome, cargo ou matrícula..." 
          style="flex: 1; min-width: 260px;"
        >
        <input 
          type="number" 
          id="folha-input-ano" 
          class="input-field" 
          placeholder="Ano (ex: 2024)" 
          style="width: 140px;"
          min="2013"
          max="2026"
        >
        <button id="folha-btn-filtrar" class="btn-primary">
          <span>🔍</span> Filtrar
        </button>
        <button id="folha-btn-limpar" class="btn-primary" style="background: #374151;">
          Limpar
        </button>
      </div>
    </div>

    <!-- Tabela e Paginação -->
    <div id="folha-conteudo-tabela">
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Consultando banco oficial...</div>
    </div>

    <!-- Modal Dossiê do Servidor -->
    <div id="modalDossieServidor" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;" id="dossie-nome">Dossiê do Servidor</h3>
            <p style="font-size: 12px; color: var(--text-muted);" id="dossie-cargo">Histórico consolidado</p>
          </div>
          <button class="modal-close-btn" id="dossie-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" id="dossie-body">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Carregando histórico do servidor...</div>
        </div>
      </div>
    </div>
  `;

  const inputBusca = container.querySelector('#folha-input-busca');
  const inputAno = container.querySelector('#folha-input-ano');
  const btnFiltrar = container.querySelector('#folha-btn-filtrar');
  const btnLimpar = container.querySelector('#folha-btn-limpar');
  const tabelaContainer = container.querySelector('#folha-conteudo-tabela');
  const modalDossie = container.querySelector('#modalDossieServidor');
  const modalCloseBtn = container.querySelector('#dossie-close-btn');

  function fecharModal() {
    modalDossie.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.onclick = fecharModal;
  modalDossie.onclick = e => {
    if (e.target === modalDossie) fecharModal();
  };

  async function abrirDossie(nomeOuMatricula) {
    modalDossie.classList.add('active');
    document.body.style.overflow = 'hidden';

    const dossieBody = container.querySelector('#dossie-body');
    dossieBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Consultando cadeia de custódia e registros oficiais...</div>';

    try {
      const res = await fetch(`/api/auditoria/rastrear?termo=${encodeURIComponent(nomeOuMatricula)}`);
      const data = await res.json();

      if (!data.sucesso) {
        dossieBody.innerHTML = `<div class="empty-state"><h4>Registro não localizado</h4></div>`;
        return;
      }

      const s = data.servidor;
      container.querySelector('#dossie-nome').textContent = s.nome;
      container.querySelector('#dossie-cargo').textContent = `${s.cargos.join(' • ')} • Matrículas: ${s.matriculas.join(', ')}`;

      dossieBody.innerHTML = `
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid #3b82f6;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">TOTAL ACUMULADO EM PROVENTOS</div>
              <div style="font-size: 22px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">
                ${formatMoeda(s.totalSalarios)}
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-blue">${s.totalContracheques} contracheques</span>
              <span class="badge badge-amber">${s.totalDiarias} diárias (${formatMoeda(s.totalDiariasValor)})</span>
            </div>
          </div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #fff;">Histórico de Contracheques</h4>
        <div class="table-wrapper" style="max-height: 280px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Cargo</th>
                <th style="text-align: right;">Base</th>
                <th style="text-align: right;">Proventos</th>
                <th style="text-align: right;">Líquido</th>
              </tr>
            </thead>
            <tbody>
              ${data.historicoFolha.map(h => `
                <tr>
                  <td><span class="badge" style="background: rgba(255,255,255,0.06);">${String(h.mes).padStart(2,'0')}/${h.ano}</span></td>
                  <td>${h.cargo}</td>
                  <td style="text-align: right;">${formatMoeda(h.salario_base)}</td>
                  <td style="text-align: right; color: #60a5fa; font-weight: 700;">${formatMoeda(h.total_proventos)}</td>
                  <td style="text-align: right; color: #34d399; font-weight: 700;">${formatMoeda(h.salario_liquido)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      dossieBody.innerHTML = `<div class="empty-state">Erro ao carregar dossiê: ${err.message}</div>`;
    }
  }

  async function carregarPagina(page) {
    estado.page = page;
    tabelaContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Consultando servidores no SQLite...</div>';

    try {
      const resp = await fetchFolha({
        page: estado.page,
        limit: estado.limit,
        busca: estado.busca,
        ano: estado.ano
      });

      tabelaContainer.innerHTML = '';

      const colunas = [
        { chave: 'matricula', titulo: 'Matrícula' },
        { chave: 'nome', titulo: 'Servidor' },
        { chave: 'cargo', titulo: 'Cargo / Função' },
        { chave: 'periodo', titulo: 'Período', align: 'center' },
        { chave: 'salario_base', titulo: 'Sal. Base', align: 'right' },
        { chave: 'total_proventos', titulo: 'Proventos', align: 'right' },
        { chave: 'salario_liquido', titulo: 'Líquido', align: 'right' },
        { chave: 'acoes', titulo: 'Ação', align: 'center' }
      ];

      const formatadores = {
        matricula: v => `<span class="badge badge-blue">${v || '—'}</span>`,
        nome: (v, item) => `<strong style="cursor: pointer; color: #93c5fd;" class="btn-ver-servidor" data-termo="${item.matricula || v}">${v}</strong>`,
        periodo: (v, item) => `<span class="badge" style="background: rgba(255,255,255,0.06);">${String(item.mes).padStart(2,'0')}/${item.ano}</span>`,
        salario_base: v => formatMoeda(v),
        total_proventos: v => `<strong style="color: #60a5fa;">${formatMoeda(v)}</strong>`,
        salario_liquido: v => `<strong style="color: #34d399;">${formatMoeda(v)}</strong>`,
        acoes: (v, item) => `
          <button class="btn-primary btn-ver-servidor" data-termo="${item.matricula || item.nome}" style="padding: 3px 8px; font-size: 11px;">
            Dossiê
          </button>
        `
      };

      const tabelaEl = renderTabela(colunas, resp.dados, formatadores);
      const paginacaoEl = renderPaginacao(resp.paginacao, p => carregarPagina(p));

      tabelaContainer.appendChild(tabelaEl);
      tabelaContainer.appendChild(paginacaoEl);

      tabelaContainer.querySelectorAll('.btn-ver-servidor').forEach(btn => {
        btn.onclick = () => abrirDossie(btn.dataset.termo);
      });
    } catch (err) {
      tabelaContainer.innerHTML = `<div class="empty-state"><h3>Erro na consulta</h3><p>${err.message}</p></div>`;
    }
  }

  btnFiltrar.onclick = () => {
    estado.busca = inputBusca.value.trim();
    estado.ano = inputAno.value.trim();
    carregarPagina(1);
  };

  btnLimpar.onclick = () => {
    inputBusca.value = '';
    inputAno.value = '';
    estado.busca = '';
    estado.ano = '';
    carregarPagina(1);
  };

  inputBusca.onkeyup = e => {
    if (e.key === 'Enter') btnFiltrar.click();
  };

  inputAno.onkeyup = e => {
    if (e.key === 'Enter') btnFiltrar.click();
  };

  carregarPagina(1);
}
