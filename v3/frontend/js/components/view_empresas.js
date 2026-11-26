/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 EMPRESAS & CREDORES
 * Conectado diretamente ao SQLite de Despesas (/api/empresas) com paginação e ficha detalhada
 * ==============================================================================
 */

let currentPage = 1;
let currentSearch = '';
let currentPeriodo = '';
let currentMandato = '';
let currentYear = '';
let currentMonth = '';
let currentOrder = 'valor_desc';

export async function renderEmpresasView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-blue">SISTEMA INTEGRADO SIAP</span>
            <span class="badge badge-green">🟢 Base Oficial Auditada</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🏢 Empresas, Fornecedores & Credores</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Auditoria de todas as empresas e prestadores de serviços contratados pela Prefeitura de Arinos / MG. Valores calculados em tempo real a partir dos empenhos e liquidações públicas.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- 4 KPIs de Topo -->
    <div class="stats-grid" style="margin-bottom: 24px;" id="empresas-kpis">
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total de Credores</div>
        <div style="font-size: 24px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;" id="kpi-total-credores">Carregando...</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Pessoas Jurídicas & Físicas</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Volume Total Empenhado</div>
        <div style="font-size: 24px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 4px;" id="kpi-valor-total">Carregando...</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">SIAP Arinos Oficial</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Empenhos Auditados</div>
        <div style="font-size: 24px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 4px;" id="kpi-total-empenhos">Carregando...</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Execuções de Despesas</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Auditoria Forense</div>
        <div style="font-size: 24px; font-weight: 800; color: #a78bfa; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">SHA-256</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Cadeia de Custódia Ativa</div>
      </div>
    </div>

    <!-- Barra de Filtros e Busca -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 260px; position: relative;">
          <input type="text" id="empresas-busca-input" placeholder="🔍 Buscar por Razão Social, CNPJ ou tipo de serviço..." 
                 value="${currentSearch}"
                 style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        </div>
        <div style="min-width: 175px;">
          <select id="empresas-periodo-select" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
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
        </div>
        <div style="min-width: 140px;">
          <select id="empresas-mes-select" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
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
        </div>
        <div style="min-width: 170px;">
          <select id="empresas-order-select" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
            <option value="valor_desc">Maior Valor Total</option>
            <option value="valor_asc">Menor Valor Total</option>
            <option value="empenhos_desc">Mais Empenhos</option>
            <option value="nome_asc">Razão Social (A–Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabela de Empresas -->
    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 20px;">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid #334155; color: var(--text-muted);">
              <th style="padding: 12px 16px;">Fornecedor / Credor</th>
              <th style="padding: 12px 16px;">CNPJ / CPF</th>
              <th style="padding: 12px 16px;">Empenhos</th>
              <th style="padding: 12px 16px;">Principais Fornecimentos</th>
              <th style="padding: 12px 16px; text-align: right;">Total Empenhado</th>
              <th style="padding: 12px 16px; text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody id="empresas-table-body">
            <tr>
              <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">
                Carregando credores e empresas oficiais...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginação -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 30px;" id="empresas-paginacao">
      <span style="font-size: 12px; color: var(--text-muted);" id="empresas-pag-info">Mostrando registros...</span>
      <div style="display: flex; gap: 6px;" id="empresas-pag-botoes"></div>
    </div>

    <!-- Modal de Ficha do Credor -->
    <div id="empresa-ficha-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
      <div id="empresa-ficha-content" class="card" style="max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px; position: relative;">
      </div>
    </div>
  `;

  const tbody = container.querySelector('#empresas-table-body');
  const pagInfo = container.querySelector('#empresas-pag-info');
  const pagBotoes = container.querySelector('#empresas-pag-botoes');
  const buscaInput = container.querySelector('#empresas-busca-input');
  const periodoSelect = container.querySelector('#empresas-periodo-select');
  const mesSelect = container.querySelector('#empresas-mes-select');
  const orderSelect = container.querySelector('#empresas-order-select');
  const overlay = container.querySelector('#empresa-ficha-overlay');
  const fichaContent = container.querySelector('#empresa-ficha-content');

  async function loadData() {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">
          Consultando acervo oficial de empresas...
        </td>
      </tr>
    `;

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        busca: currentSearch,
        mandato: currentMandato,
        ano: currentYear,
        periodo: currentPeriodo,
        mes: currentMonth,
        ordenar: currentOrder
      });

      const res = await fetch(`/api/empresas?${queryParams.toString()}`);
      const data = await res.json();

      if (!data.sucesso) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #f87171;">Erro: ${data.erro || 'Falha na consulta'}</td></tr>`;
        return;
      }

      // Atualiza KPIs
      if (data.kpis) {
        container.querySelector('#kpi-total-credores').textContent = Number(data.kpis.totalCredores).toLocaleString('pt-BR');
        container.querySelector('#kpi-valor-total').textContent = data.kpis.valorTotalFormatado;
        container.querySelector('#kpi-total-empenhos').textContent = Number(data.kpis.totalEmpenhos).toLocaleString('pt-BR');
      }

      // Renderiza Linhas
      if (data.empresas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhum credor encontrado com os filtros aplicados.</td></tr>`;
        pagInfo.textContent = '0 registros encontrados';
        pagBotoes.innerHTML = '';
        return;
      }

      tbody.innerHTML = data.empresas.map((e, idx) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s ease;">
          <td style="padding: 12px 16px;">
            <strong style="color: #fff; font-size: 13px; display: block;">${e.credor}</strong>
            <span style="font-size: 11px; color: var(--text-muted);">Último registro em ${e.ultimoAno || '—'}</span>
          </td>
          <td style="padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8;">
            ${e.cpfCnpj}
          </td>
          <td style="padding: 12px 16px;">
            <span class="badge badge-blue">${e.qtdEmpenhos} empenho(s)</span>
          </td>
          <td style="padding: 12px 16px; color: var(--text-muted); font-size: 12px; max-width: 250px;">
            ${e.servicos}
          </td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace;">
            ${e.totalFormatado}
          </td>
          <td style="padding: 12px 16px; text-align: center;">
            <button class="btn btn-ficha" data-credor="${encodeURIComponent(e.credor)}" style="background: #1e293b; border: 1px solid #334155; color: #60a5fa; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
              📄 Ficha Completa
            </button>
          </td>
        </tr>
      `).join('');

      // Eventos dos botões de Ficha do Credor
      tbody.querySelectorAll('.btn-ficha').forEach(btn => {
        btn.addEventListener('click', () => {
          abrirFichaCredor(decodeURIComponent(btn.dataset.credor));
        });
      });

      // Paginação
      const p = data.paginacao;
      const start = (p.page - 1) * p.limit + 1;
      const end = Math.min(p.page * p.limit, p.totalRegistros);
      pagInfo.textContent = `Mostrando ${start}–${end} de ${p.totalRegistros.toLocaleString('pt-BR')} empresas`;

      pagBotoes.innerHTML = `
        <button id="btn-prev" ${p.page <= 1 ? 'disabled' : ''} style="background: #1e293b; border: 1px solid #334155; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Anterior</button>
        <span style="display: flex; align-items: center; padding: 0 10px; font-size: 12px; color: var(--text-muted);">Página ${p.page} de ${p.totalPages}</span>
        <button id="btn-next" ${p.page >= p.totalPages ? 'disabled' : ''} style="background: #1e293b; border: 1px solid #334155; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Próxima</button>
      `;

      pagBotoes.querySelector('#btn-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          loadData();
        }
      });
      pagBotoes.querySelector('#btn-next')?.addEventListener('click', () => {
        if (currentPage < p.totalPages) {
          currentPage++;
          loadData();
        }
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #f87171;">Falha ao carregar dados: ${err.message}</td></tr>`;
    }
  }

  async function abrirFichaCredor(credor) {
    overlay.style.display = 'flex';
    fichaContent.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando dados de ${credor}...</div>`;

    try {
      const res = await fetch(`/api/empresas?credor=${encodeURIComponent(credor)}`);
      const data = await res.json();

      if (!data.sucesso) {
        fichaContent.innerHTML = `<p style="color: #f87171;">Erro ao obter dados: ${data.erro}</p>`;
        return;
      }

      fichaContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span class="badge badge-blue" style="margin-bottom: 6px;">FICHA DO CREDOR</span>
            <h2 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${data.credor}</h2>
            <p style="font-size: 12px; color: var(--text-muted);">Período de Atuação: ${data.resumo.periodo}</p>
          </div>
          <button id="btn-close-ficha" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 4px 8px;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: #1e293b; padding: 12px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL EMPENHADO</div>
            <div style="font-size: 18px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">${data.resumo.totalFormatado}</div>
          </div>
          <div style="background: #1e293b; padding: 12px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL DE EMPENHOS</div>
            <div style="font-size: 18px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace;">${data.resumo.qtdEmpenhos} registros</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 10px;">Últimos Empenhos Registrados</h3>
        <div style="max-height: 380px; overflow-y: auto; border: 1px solid #334155; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #1e293b; color: var(--text-muted); border-bottom: 1px solid #334155;">
                <th style="padding: 8px 12px;">Data</th>
                <th style="padding: 8px 12px;">Empenho</th>
                <th style="padding: 8px 12px;">Descrição / Objeto</th>
                <th style="padding: 8px 12px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${data.empenhos.map(emp => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 8px 12px; color: var(--text-muted); white-space: nowrap;">${emp.data || `${emp.mes}/${emp.ano}`}</td>
                  <td style="padding: 8px 12px; font-family: 'JetBrains Mono', monospace; color: #60a5fa;">#${emp.nr_empenho || emp.id}</td>
                  <td style="padding: 8px 12px; color: #cbd5e1;">
                    <strong>${emp.descricao_natureza || 'Despesa'}</strong>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${emp.historico ? emp.historico.slice(0, 120) + '...' : ''}</div>
                  </td>
                  <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace; white-space: nowrap;">
                    R$ ${Number(emp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      fichaContent.querySelector('#btn-close-ficha')?.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    } catch (err) {
      fichaContent.innerHTML = `<p style="color: #f87171;">Falha ao carregar dados: ${err.message}</p>`;
    }
  }

  // Filtros
  let searchTimeout = null;
  buscaInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.trim();
      currentPage = 1;
      loadData();
    }, 300);
  });

  periodoSelect.addEventListener('change', (e) => {
    currentPeriodo = e.target.value;
    if (currentPeriodo.startsWith('mandato:')) {
      currentMandato = currentPeriodo.replace('mandato:', '');
      currentYear = '';
    } else if (currentPeriodo.startsWith('ano:')) {
      currentYear = currentPeriodo.replace('ano:', '');
      currentMandato = '';
    } else {
      currentMandato = '';
      currentYear = '';
    }
    currentPage = 1;
    loadData();
  });

  mesSelect.addEventListener('change', (e) => {
    currentMonth = e.target.value;
    currentPage = 1;
    loadData();
  });

  orderSelect.addEventListener('change', (e) => {
    currentOrder = e.target.value;
    currentPage = 1;
    loadData();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  // Carga inicial
  loadData();
}
