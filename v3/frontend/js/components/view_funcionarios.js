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
    periodo: '',
    mandato: '',
    ano: '',
    mes: ''
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

      <div class="filter-bar" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input 
          type="text" 
          id="folha-input-busca" 
          class="input-field" 
          placeholder="🔍 Buscar por nome, cargo ou matrícula..." 
          style="flex: 1; min-width: 240px;"
        >
        <select id="folha-select-periodo" class="input-field" style="min-width: 175px; background: #1e293b; border: 1px solid #334155; color: #fff;">
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
        <select id="folha-select-mes" class="input-field" style="width: 150px; background: #1e293b; border: 1px solid #334155; color: #fff;">
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
        <button id="folha-btn-filtrar" class="btn-primary" style="padding: 10px 18px;">
          <span>🔍</span> Filtrar
        </button>
        <button id="folha-btn-limpar" class="btn-primary" style="background: #374151; padding: 10px 16px;">
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
  const selectPeriodo = container.querySelector('#folha-select-periodo');
  const selectMes = container.querySelector('#folha-select-mes');
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
        <!-- KPI Financeiro -->
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

        <!-- ⏱️ Linha do Tempo de Períodos Reais e Intervalos no Meio -->
        <div class="card" style="margin-bottom: 16px; background: #0b1120; border: 1px solid #1e293b; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">⏱️</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Linha do Tempo Funcional & Períodos de Exercício</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Auditoria pericial de tempo real de serviço e intervalos (gaps)</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-green" style="font-size: 12px; font-weight: 700;">${s.tempoEfetivo || '—'} (${s.totalMesesEfetivos || 0} meses ativos)</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 12px;">
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Data Inicial</div>
              <div style="font-size: 14px; font-weight: 700; color: #60a5fa; margin-top: 2px;">${s.dataInicio || '—'}</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Data Final</div>
              <div style="font-size: 14px; font-weight: 700; color: #60a5fa; margin-top: 2px;">${s.dataFim || '—'}</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Tempo Bruto Total</div>
              <div style="font-size: 14px; font-weight: 700; color: #cbd5e1; margin-top: 2px;">${s.tempoBruto || '—'}</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Tempo Efetivo Real</div>
              <div style="font-size: 14px; font-weight: 700; color: #34d399; margin-top: 2px;">${s.tempoEfetivo || '—'}</div>
            </div>
          </div>

          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 11px; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="color: #93c5fd; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>⚖️</span> Proteção Legal de Férias & 13º Salário (Art. 102 da Lei 8.112/90)
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${s.totalMesesFeriasRecesso ? `<span class="badge badge-green">🏖️ ${s.totalMesesFeriasRecesso} meses de Férias/Recesso computados</span>` : ''}
                ${s.total13Salarios ? `<span class="badge badge-blue">🎁 ${s.total13Salarios} 13º salários</span>` : ''}
              </div>
            </div>
            <p style="margin: 4px 0 0 0; color: #cbd5e1;">
              Férias regulamentares, recessos anuais de início de ano (Janeiro) e gratificações de 13º salário <strong>são preservados por lei como efetivo exercício</strong> e não são confundidos com afastamento ou quebra de vínculo.
            </p>
          </div>

          ${s.temIntervalos ? `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span> Ruptura Real de Vínculo: ${s.totalIntervalos} intervalo(s) de afastamento detectado(s) entre ${s.dataInicio} e ${s.dataFim}
              </div>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 4px; line-height: 1.4;">
                Auditoria pericial: períodos prolongados de afastamento sem vencimento somam <strong>${s.totalMesesIntervalos} meses</strong>. Férias legais e 13º salário foram protegidos e computados no tempo efetivo de serviço.
              </p>
            </div>
          ` : `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 11px; color: #34d399;">
              ✔ Vínculo Contínuo: Exercício ininterrupto no período (${s.tempoEfetivo}). Férias, recessos e 13º salário preservados como efetivo exercício.
            </div>
          `}

          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto;">
            ${(s.periodosTimeline || []).map(item => {
              if (item.tipo === 'periodo_ativo') {
                return `
                  <div style="padding: 8px 12px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                      <span style="font-size: 12px; font-weight: 700; color: #fff; font-family: 'JetBrains Mono', monospace;">${item.descricao}</span>
                    </div>
                    <span class="badge" style="background: #1e293b; color: #94a3b8; font-size: 11px;">${item.cargos}</span>
                  </div>
                `;
              } else {
                return `
                  <div style="padding: 8px 12px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; color: #fbbf24;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>
                      <span style="font-size: 12px; font-weight: 600;">⏸️ ${item.descricao}</span>
                    </div>
                    <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d; font-size: 10px; font-weight: 700; text-transform: uppercase;">Sem Vínculo / Intervalo</span>
                  </div>
                `;
              }
            }).join('')}
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
        mandato: estado.mandato,
        ano: estado.ano,
        periodo: estado.periodo,
        mes: estado.mes
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
    const pVal = selectPeriodo.value;
    estado.periodo = pVal;
    if (pVal.startsWith('mandato:')) {
      estado.mandato = pVal.replace('mandato:', '');
      estado.ano = '';
    } else if (pVal.startsWith('ano:')) {
      estado.ano = pVal.replace('ano:', '');
      estado.mandato = '';
    } else {
      estado.mandato = '';
      estado.ano = '';
    }
    estado.mes = selectMes.value;
    carregarPagina(1);
  };

  btnLimpar.onclick = () => {
    inputBusca.value = '';
    selectPeriodo.value = '';
    selectMes.value = '';
    estado.busca = '';
    estado.periodo = '';
    estado.mandato = '';
    estado.ano = '';
    estado.mes = '';
    carregarPagina(1);
  };

  selectPeriodo.onchange = () => btnFiltrar.click();
  selectMes.onchange = () => btnFiltrar.click();

  inputBusca.onkeyup = e => {
    if (e.key === 'Enter') btnFiltrar.click();
  };

  carregarPagina(1);
}
