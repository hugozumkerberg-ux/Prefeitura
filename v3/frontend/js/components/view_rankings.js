/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 RANKINGS OFICIAIS
 * Conectado diretamente ao SQLite (/api/rankings) para Folha, Diárias e Credores
 * ==============================================================================
 */

let currentTab = 'salarios';
let currentYear = '';
let currentMonth = '';

export async function renderRankingView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #f59e0b;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-amber">ESTATÍSTICAS & RANKINGS</span>
            <span class="badge badge-green">🟢 SQLite Nativo (/api/rankings)</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🏆 Rankings Oficiais de Transparência</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Classificação em tempo real dos maiores pagamentos da folha salarial, servidores com maior volume de diárias acumuladas e principais credores do município.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Navegação de Abas dos Rankings -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
      <button class="btn-primary rank-tab-btn active" data-tab="salarios" style="background: #2563eb;">💰 Maiores Salários (Folha)</button>
      <button class="btn-primary rank-tab-btn" data-tab="diarias" style="background: #1f2937;">✈️ Maiores Diárias Acumuladas</button>
      <button class="btn-primary rank-tab-btn" data-tab="credores" style="background: #1f2937;">🏢 Maiores Fornecedores (SIAP)</button>

      <div style="margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap;">
        <select id="rank-ano-select" style="min-width: 130px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
          <option value="">Todos os Anos</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
          <option value="2019">2019</option>
          <option value="2018">2018</option>
          <option value="2017">2017</option>
          <option value="2016">2016</option>
          <option value="2015">2015</option>
          <option value="2014">2014</option>
          <option value="2013">2013</option>
        </select>
        <select id="rank-mes-select" style="min-width: 140px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
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
    </div>

    <!-- Tabela do Ranking -->
    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead id="rank-table-head"></thead>
          <tbody id="rank-table-body">
            <tr>
              <td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">
                Carregando ranking em SQLite...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const thead = container.querySelector('#rank-table-head');
  const tbody = container.querySelector('#rank-table-body');
  const anoSelect = container.querySelector('#rank-ano-select');
  const mesSelect = container.querySelector('#rank-mes-select');
  const tabs = container.querySelectorAll('.rank-tab-btn');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => {
        b.style.background = '#1f2937';
        b.classList.remove('active');
      });
      btn.style.background = '#2563eb';
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      loadRankings();
    });
  });

  anoSelect.addEventListener('change', (e) => {
    currentYear = e.target.value;
    loadRankings();
  });

  mesSelect.addEventListener('change', (e) => {
    currentMonth = e.target.value;
    loadRankings();
  });

  async function loadRankings() {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">Consultando banco SQLite...</td></tr>`;

    // Atualiza cabeçalho de acordo com a aba
    if (currentTab === 'salarios') {
      thead.innerHTML = `
        <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid #334155; color: var(--text-muted);">
          <th style="padding: 12px 16px; width: 60px;">#</th>
          <th style="padding: 12px 16px;">Servidor / Cargo</th>
          <th style="padding: 12px 16px;">Lotação / Secretaria</th>
          <th style="padding: 12px 16px; text-align: center;">Mês/Ano</th>
          <th style="padding: 12px 16px; text-align: right;">Proventos Brutos</th>
        </tr>
      `;
    } else if (currentTab === 'diarias') {
      thead.innerHTML = `
        <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid #334155; color: var(--text-muted);">
          <th style="padding: 12px 16px; width: 60px;">#</th>
          <th style="padding: 12px 16px;">Favorecido / Cargo</th>
          <th style="padding: 12px 16px;">Secretaria / Órgão</th>
          <th style="padding: 12px 16px; text-align: center;">Diárias Recebidas</th>
          <th style="padding: 12px 16px; text-align: right;">Total Acumulado</th>
        </tr>
      `;
    } else if (currentTab === 'credores') {
      thead.innerHTML = `
        <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid #334155; color: var(--text-muted);">
          <th style="padding: 12px 16px; width: 60px;">#</th>
          <th style="padding: 12px 16px;">Fornecedor / Credor</th>
          <th style="padding: 12px 16px;">CNPJ / CPF</th>
          <th style="padding: 12px 16px; text-align: center;">Empenhos</th>
          <th style="padding: 12px 16px; text-align: right;">Total Empenhado</th>
        </tr>
      `;
    }

    try {
      const paramsObj = { tipo: currentTab, limit: 50 };
      if (currentYear) paramsObj.ano = currentYear;
      if (currentMonth) paramsObj.mes = currentMonth;
      const q = new URLSearchParams(paramsObj);
      const res = await fetch(`/api/rankings?${q.toString()}`);
      const json = await res.json();

      if (!json.sucesso || !json.dados || json.dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhum registro encontrado para este critério.</td></tr>`;
        return;
      }

      tbody.innerHTML = json.dados.map(item => {
        const medal = item.posicao === 1 ? '🥇' : item.posicao === 2 ? '🥈' : item.posicao === 3 ? '🥉' : item.posicao;

        if (currentTab === 'salarios') {
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 12px 16px; font-weight: 800; color: ${item.posicao <= 3 ? '#fbbf24' : 'var(--text-muted)'}; font-size: 14px;">${medal}</td>
              <td style="padding: 12px 16px;">
                <strong style="color: #fff; font-size: 13px;">${item.nome}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${item.cargo}</div>
              </td>
              <td style="padding: 12px 16px; font-size: 12px; color: #94a3b8;">${item.lotacao}</td>
              <td style="padding: 12px 16px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted);">${item.periodo}</td>
              <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace; font-size: 14px;">${item.proventosFormatado}</td>
            </tr>
          `;
        } else if (currentTab === 'diarias') {
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 12px 16px; font-weight: 800; color: ${item.posicao <= 3 ? '#fbbf24' : 'var(--text-muted)'}; font-size: 14px;">${medal}</td>
              <td style="padding: 12px 16px;">
                <strong style="color: #fff; font-size: 13px;">${item.nome}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${item.cargo}</div>
              </td>
              <td style="padding: 12px 16px; font-size: 12px; color: #94a3b8;">${item.lotacao}</td>
              <td style="padding: 12px 16px; text-align: center;"><span class="badge badge-blue">${item.qtdDiarias} diárias</span></td>
              <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #60a5fa; font-family: 'JetBrains Mono', monospace; font-size: 14px;">${item.totalFormatado}</td>
            </tr>
          `;
        } else {
          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 12px 16px; font-weight: 800; color: ${item.posicao <= 3 ? '#fbbf24' : 'var(--text-muted)'}; font-size: 14px;">${medal}</td>
              <td style="padding: 12px 16px;">
                <strong style="color: #fff; font-size: 13px;">${item.nome}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Ativo até ${item.ultimoAno}</div>
              </td>
              <td style="padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8;">${item.cpfCnpj}</td>
              <td style="padding: 12px 16px; text-align: center;"><span class="badge badge-amber">${item.qtdEmpenhos} empenhos</span></td>
              <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace; font-size: 14px;">${item.totalFormatado}</td>
            </tr>
          `;
        }
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #f87171;">Erro ao carregar dados: ${err.message}</td></tr>`;
    }
  }

  loadRankings();
}
