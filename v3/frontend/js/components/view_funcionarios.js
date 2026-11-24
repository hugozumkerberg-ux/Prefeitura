/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 FUNCIONÁRIOS & FOLHA
 * Suporte a padronização de matrícula (sem zeros à esquerda),
 * identificação consolidada de pessoa física e busca avançada completa.
 * ==============================================================================
 */

import { fetchFolha, fetchFolhaFiltros, fetchStats } from '../api.js';
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
    mes: '',
    nome: '',
    matricula: '',
    cargo: '',
    lotacao: '',
    salarioMin: '',
    salarioMax: '',
    avancadaAberta: false
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
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Pessoas Físicas</div>
        <div style="font-size: 20px; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; margin: 4px 0;">2.165</div>
        <div style="font-size: 11px; color: #60a5fa;">Cadastro Único</div>
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
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="badge badge-green">Base Oficial SQLite (2013–2026)</span>
          <span class="badge badge-blue">Matrícula Padronizada</span>
        </div>
      </div>

      <!-- Linha Principal de Filtros Rápidos -->
      <div class="filter-bar" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input 
          type="text" 
          id="folha-input-busca" 
          class="input-field" 
          placeholder="🔍 Buscar por nome, matrícula sem zeros (ex: 573 ou 1556-2) ou cargo..." 
          style="flex: 1; min-width: 260px;"
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
        <button id="folha-btn-toggle-avancada" class="btn" style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #93c5fd; padding: 10px 14px; font-weight: 600; cursor: pointer;">
          <span>⚙️</span> Busca Avançada
        </button>
        <button id="folha-btn-limpar" class="btn-primary" style="background: #374151; padding: 10px 16px;">
          Limpar
        </button>
      </div>

      <!-- ⚙️ Painel Expansível de Busca Avançada -->
      <div id="painel-busca-avancada" style="display: none; background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 13px; font-weight: 700; color: #60a5fa; display: flex; align-items: center; gap: 6px;">
            <span>🔬</span> Filtros Estruturados & Busca Avançada
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">
            Localiza registros por matrícula padronizada (sem zeros) ou dados funcionais específicos
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 14px;">
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Nome da Pessoa Física</label>
            <input type="text" id="avancada-nome" class="input-field" placeholder="Ex: Maria Conceição" style="width: 100%; background: #1e293b; color: #fff;">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Matrícula (sem zeros à esquerda)</label>
            <input type="text" id="avancada-matricula" class="input-field" placeholder="Ex: 573 ou 1556-2" style="width: 100%; background: #1e293b; color: #fff;">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Cargo / Função</label>
            <input type="text" id="avancada-cargo" class="input-field" list="datalist-cargos" placeholder="Ex: Professor, Motorista..." style="width: 100%; background: #1e293b; color: #fff;">
            <datalist id="datalist-cargos"></datalist>
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Secretaria / Lotação</label>
            <input type="text" id="avancada-lotacao" class="input-field" list="datalist-lotacoes" placeholder="Ex: Educação, Saúde..." style="width: 100%; background: #1e293b; color: #fff;">
            <datalist id="datalist-lotacoes"></datalist>
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Proventos Mínimos (R$)</label>
            <input type="number" id="avancada-salario-min" class="input-field" placeholder="Ex: 2500" style="width: 100%; background: #1e293b; color: #fff;">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Proventos Máximos (R$)</label>
            <input type="number" id="avancada-salario-max" class="input-field" placeholder="Ex: 15000" style="width: 100%; background: #1e293b; color: #fff;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button id="avancada-btn-limpar" class="btn" style="background: #334155; color: #fff; padding: 6px 14px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Limpar Campos
          </button>
          <button id="avancada-btn-aplicar" class="btn-primary" style="padding: 6px 16px; font-size: 12px; cursor: pointer;">
            🔍 Aplicar Filtros Avançados
          </button>
        </div>
      </div>

      <!-- Container de Filtros Ativos -->
      <div id="folha-filtros-ativos" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px;"></div>
    </div>

    <!-- Tabela e Paginação -->
    <div id="folha-conteudo-tabela">
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Consultando banco oficial...</div>
    </div>

    <!-- Modal Dossiê da Pessoa Física & Servidor -->
    <div id="modalDossieServidor" class="voter-modal-overlay">
      <div class="voter-modal-box">
        <div class="voter-modal-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;" id="dossie-nome">Cadastro Único da Pessoa Física</h3>
            <p style="font-size: 12px; color: var(--text-muted);" id="dossie-cargo">Histórico funcional unificado</p>
          </div>
          <button class="modal-close-btn" id="dossie-close-btn">✕</button>
        </div>
        <div class="voter-modal-body" id="dossie-body">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Carregando dados da pessoa física...</div>
        </div>
      </div>
    </div>
  `;

  const inputBusca = container.querySelector('#folha-input-busca');
  const selectPeriodo = container.querySelector('#folha-select-periodo');
  const selectMes = container.querySelector('#folha-select-mes');
  const btnFiltrar = container.querySelector('#folha-btn-filtrar');
  const btnLimpar = container.querySelector('#folha-btn-limpar');
  const btnToggleAvancada = container.querySelector('#folha-btn-toggle-avancada');
  const painelAvancada = container.querySelector('#painel-busca-avancada');
  const filtrosAtivosContainer = container.querySelector('#folha-filtros-ativos');
  const tabelaContainer = container.querySelector('#folha-conteudo-tabela');
  const modalDossie = container.querySelector('#modalDossieServidor');
  const modalCloseBtn = container.querySelector('#dossie-close-btn');

  // Campos avançados
  const inputAvancadaNome = container.querySelector('#avancada-nome');
  const inputAvancadaMat = container.querySelector('#avancada-matricula');
  const inputAvancadaCargo = container.querySelector('#avancada-cargo');
  const inputAvancadaLotacao = container.querySelector('#avancada-lotacao');
  const inputAvancadaSalMin = container.querySelector('#avancada-salario-min');
  const inputAvancadaSalMax = container.querySelector('#avancada-salario-max');
  const btnAvancadaAplicar = container.querySelector('#avancada-btn-aplicar');
  const btnAvancadaLimpar = container.querySelector('#avancada-btn-limpar');

  // Carrega opções de autocomplete para a busca avançada
  async function carregarOpcoesAvancadas() {
    try {
      const data = await fetchFolhaFiltros();
      const dlCargos = container.querySelector('#datalist-cargos');
      const dlLotacoes = container.querySelector('#datalist-lotacoes');
      if (dlCargos && data.cargos) {
        dlCargos.innerHTML = data.cargos.map(c => `<option value="${c}"></option>`).join('');
      }
      if (dlLotacoes && data.lotacoes) {
        dlLotacoes.innerHTML = data.lotacoes.map(l => `<option value="${l}"></option>`).join('');
      }
    } catch (e) {
      // Ignora erro em autocomplete silenciosamente
    }
  }
  carregarOpcoesAvancadas();

  function fecharModal() {
    modalDossie.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalCloseBtn.onclick = fecharModal;
  modalDossie.onclick = e => {
    if (e.target === modalDossie) fecharModal();
  };

  btnToggleAvancada.onclick = () => {
    estado.avancadaAberta = !estado.avancadaAberta;
    painelAvancada.style.display = estado.avancadaAberta ? 'block' : 'none';
    btnToggleAvancada.style.background = estado.avancadaAberta ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.15)';
  };

  function renderizarFiltrosAtivos() {
    filtrosAtivosContainer.innerHTML = '';
    const ativos = [];

    if (estado.busca) ativos.push({ rotulo: `Busca: "${estado.busca}"`, limpar: () => { estado.busca = ''; inputBusca.value = ''; } });
    if (estado.nome) ativos.push({ rotulo: `Pessoa: "${estado.nome}"`, limpar: () => { estado.nome = ''; inputAvancadaNome.value = ''; } });
    if (estado.matricula) ativos.push({ rotulo: `Matrícula: "${estado.matricula}"`, limpar: () => { estado.matricula = ''; inputAvancadaMat.value = ''; } });
    if (estado.cargo) ativos.push({ rotulo: `Cargo: "${estado.cargo}"`, limpar: () => { estado.cargo = ''; inputAvancadaCargo.value = ''; } });
    if (estado.lotacao) ativos.push({ rotulo: `Lotação: "${estado.lotacao}"`, limpar: () => { estado.lotacao = ''; inputAvancadaLotacao.value = ''; } });
    if (estado.salarioMin) ativos.push({ rotulo: `Min: R$ ${estado.salarioMin}`, limpar: () => { estado.salarioMin = ''; inputAvancadaSalMin.value = ''; } });
    if (estado.salarioMax) ativos.push({ rotulo: `Max: R$ ${estado.salarioMax}`, limpar: () => { estado.salarioMax = ''; inputAvancadaSalMax.value = ''; } });

    if (ativos.length === 0) return;

    ativos.forEach(item => {
      const pill = document.createElement('span');
      pill.className = 'badge';
      pill.style.cssText = 'background: #1e293b; border: 1px solid #3b82f6; color: #93c5fd; font-size: 11px; padding: 4px 8px; display: inline-flex; align-items: center; gap: 6px;';
      pill.innerHTML = `${item.rotulo} <span style="cursor: pointer; font-weight: bold; color: #f87171;">✕</span>`;
      pill.querySelector('span').onclick = () => {
        item.limpar();
        renderizarFiltrosAtivos();
        carregarPagina(1);
      };
      filtrosAtivosContainer.appendChild(pill);
    });
  }

  async function abrirDossie(nomeOuMatricula) {
    modalDossie.classList.add('active');
    document.body.style.overflow = 'hidden';

    const dossieBody = container.querySelector('#dossie-body');
    dossieBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Consultando cadastro consolidado da pessoa física...</div>';

    try {
      const res = await fetch(`/api/auditoria/rastrear?termo=${encodeURIComponent(nomeOuMatricula)}`);
      const data = await res.json();

      if (!data.sucesso) {
        dossieBody.innerHTML = `<div class="empty-state"><h4>Registro não localizado</h4></div>`;
        return;
      }

      const s = data.servidor;
      const pol = s.passado_politico || {};
      const temPol = pol.tem_passado_politico;
      const venceu = pol.venceu;

      container.querySelector('#dossie-nome').textContent = `👤 ${s.nome}`;
      container.querySelector('#dossie-cargo').textContent = `${s.cargos.join(' • ')} • Matrículas Padronizadas: ${s.matriculas.join(', ')}`;

      const fotoDossieHtml = s.foto_url ? `
        <img 
          src="${s.foto_url}" 
          alt="${s.nome}" 
          style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid ${venceu ? '#10b981' : (temPol ? '#f59e0b' : '#3b82f6')}; flex-shrink: 0;"
          onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.nome)}&background=1e293b&color=93c5fd&size=140';"
        >
      ` : `
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #1e293b; border: 3px solid ${temPol ? (venceu ? '#10b981' : '#f59e0b') : '#334155'}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #93c5fd; font-size: 24px; flex-shrink: 0;">
          ${(s.nome || '?').slice(0, 2).toUpperCase()}
        </div>
      `;

      const cardPoliticoHtml = temPol ? `
        <!-- 🏛️ Passado Político & Registro Eleitoral TSE / Câmara -->
        <div class="card" style="margin-bottom: 16px; background: #0b1120; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${venceu ? '🏛️' : '🗳️'}</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Histórico Político & Registro Eleitoral</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Dados Oficiais cruzados com TSE (Eleições) e Câmara Municipal de Arinos</div>
              </div>
            </div>
            <div>
              <span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 700; padding: 4px 10px;">
                ${pol.tag_texto || (venceu ? 'Mandato Político Eleito' : 'Candidato TSE')}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px;">
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Status Eleitoral</div>
              <div style="font-size: 13px; font-weight: 700; color: ${venceu ? '#34d399' : '#fbbf24'}; margin-top: 2px;">
                ${venceu ? '✔ Eleito (Venceu)' : `Não Eleito (${pol.status_eleicao || 'Suplente'})`}
              </div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Cargo Disputado / Exercido</div>
              <div style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-top: 2px;">
                ${pol.cargo_politico || '—'}
              </div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Partido / Filiação</div>
              <div style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin-top: 2px;">
                ${pol.partido_politico || '—'}
              </div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Bens Declarados TSE</div>
              <div style="font-size: 13px; font-weight: 700; color: #34d399; margin-top: 2px;">
                ${pol.bens_declarados_tse ? formatMoeda(pol.bens_declarados_tse) : 'Nenhum bem informado'}
              </div>
            </div>
          </div>

          ${(pol.historico_disputas && pol.historico_disputas.length > 0) ? `
            <div style="background: #1e293b; border-radius: 6px; padding: 10px 12px; margin-top: 8px;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">
                📋 Eleições Concorridas pelo Candidato:
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${pol.historico_disputas.map(d => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 11px; background: rgba(255,255,255,0.03);">
                    <span><strong>${d.ano}</strong> — ${d.cargo} (${d.partido || '—'}${d.numero ? ` Nº ${d.numero}` : ''})</span>
                    <span class="badge ${d.eleito ? 'badge-green' : 'badge-amber'}">${d.resultado || (d.eleito ? 'Eleito' : 'Não Eleito')}${d.votos ? ` • ${d.votos.toLocaleString('pt-BR')} votos` : ''}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : '';

      dossieBody.innerHTML = `
        <!-- Identificação Consolidada da Pessoa Física -->
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid #3b82f6; background: #0f172a;">
          <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            ${fotoDossieHtml}
            <div style="flex: 1; min-width: 240px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid #a855f7; font-weight: 700; font-size: 11px;">
                  ID ÚNICO CANÔNICO #${s.pessoa_id || '—'}
                </span>
                ${temPol ? `<span class="badge ${venceu ? 'badge-green' : 'badge-amber'}">${venceu ? '🏛️ Mandato Eleito' : '🗳️ Candidato TSE'}</span>` : '<span class="badge badge-blue">Servidor Público Civil</span>'}
              </div>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${s.nome}</h3>
              <div style="font-size: 11px; color: var(--text-muted);">
                ${s.cargos.join(' • ')}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #1e293b;">
            <div>
              <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Acumulado em Proventos</div>
              <div style="font-size: 20px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">
                ${formatMoeda(s.totalSalarios)}
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-blue">${s.totalContracheques} contracheques</span>
              <span class="badge badge-amber">${s.totalDiarias} diárias (${formatMoeda(s.totalDiariasValor)})</span>
            </div>
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px;">
            <span style="color: var(--text-muted);">Matrícula(s) Padronizada(s):</span>
            ${s.matriculas.map(m => `<span class="badge badge-blue" style="font-family: 'JetBrains Mono', monospace;">${m}</span>`).join(' ')}
          </div>
        </div>

        ${cardPoliticoHtml}

        <!-- ⏱️ Linha do Tempo de Períodos Reais, Férias e 13º Salário -->
        <div class="card" style="margin-bottom: 16px; background: #0b1120; border: 1px solid #1e293b; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">⏱️</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Histórico Funcional & Auditoria Pericial</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Tempo de serviço ininterrupto, férias regulamentares e afastamentos reais</div>
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

          <!-- Card de Proteção Legal de Férias e 13º -->
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 11px; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="color: #93c5fd; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>⚖️</span> Proteção Legal de Férias & 13º Salário (Art. 102 da Lei 8.112/90)
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${s.totalMesesFeriasRecesso ? `<span class="badge badge-green">🏖️ ${s.totalMesesFeriasRecesso} meses de Férias/Recesso computados</span>` : ''}
                ${s.total13Salarios ? `<span class="badge badge-blue">🎁 ${s.total13Salarios} 13º salários vinculados</span>` : ''}
              </div>
            </div>
            <p style="margin: 4px 0 0 0; color: #cbd5e1;">
              Férias anuais regulamentares, recessos escolares/administrativos de Janeiro e gratificações de 13º salário <strong>são preservados por lei como efetivo exercício</strong> e não são confundidos com afastamento ou quebra de vínculo.
            </p>
          </div>

          ${s.temIntervalos ? `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span> Ruptura Real de Vínculo: ${s.totalIntervalos} intervalo(s) de afastamento detectado(s) entre ${s.dataInicio} e ${s.dataFim}
              </div>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 4px; line-height: 1.4;">
                Auditoria pericial: períodos prolongados de afastamento sem remuneração somam <strong>${s.totalMesesIntervalos} meses</strong>. Férias legais e 13º salário já foram protegidos e computados no tempo efetivo de serviço.
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
                    <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d; font-size: 10px; font-weight: 700; text-transform: uppercase;">Afastamento / Ruptura</span>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #fff;">Histórico Consolidado de Contracheques</h4>
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
        mes: estado.mes,
        nome: estado.nome,
        matricula: estado.matricula,
        cargo: estado.cargo,
        lotacao: estado.lotacao,
        salarioMin: estado.salarioMin,
        salarioMax: estado.salarioMax
      });

      tabelaContainer.innerHTML = '';

      const colunas = [
        { chave: 'matricula', titulo: 'Matrícula' },
        { chave: 'nome', titulo: 'Servidor / Pessoa Física' },
        { chave: 'cargo', titulo: 'Cargo / Função' },
        { chave: 'lotacao', titulo: 'Lotação / Secretaria' },
        { chave: 'periodo', titulo: 'Período', align: 'center' },
        { chave: 'salario_base', titulo: 'Sal. Base', align: 'right' },
        { chave: 'total_proventos', titulo: 'Proventos', align: 'right' },
        { chave: 'salario_liquido', titulo: 'Líquido', align: 'right' },
        { chave: 'acoes', titulo: 'Ação', align: 'center' }
      ];

      const formatadores = {
        matricula: (v, item) => `
          <span class="badge badge-blue" style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;">
            ${item.matricula_exibicao || item.matricula_padronizada || (v ? v.replace(/^0+/, '') : '—')}
          </span>
        `,
        nome: (v, item) => {
          const pol = item.passado_politico || {};
          const temPol = pol.tem_passado_politico;
          const venceu = pol.venceu;
          const tagTexto = pol.tag_texto;
          const fotoUrl = item.foto_url;
          const pessoaId = item.pessoa_id || '—';

          const avatarHtml = fotoUrl ? `
            <img 
              src="${fotoUrl}" 
              alt="${v}" 
              style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid ${venceu ? '#10b981' : (temPol ? '#f59e0b' : '#3b82f6')}; flex-shrink: 0;"
              onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(v)}&background=1e293b&color=93c5fd&size=80';"
            >
          ` : `
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #1e293b; border: 2px solid ${temPol ? (venceu ? '#10b981' : '#f59e0b') : '#334155'}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #93c5fd; font-size: 12px; flex-shrink: 0;">
              ${(v || '?').slice(0, 2).toUpperCase()}
            </div>
          `;

          const tagBadgeHtml = temPol ? `
            <div style="margin-top: 4px;">
              <span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;">
                ${tagTexto}
              </span>
            </div>
          ` : '';

          return `
            <div style="display: flex; align-items: center; gap: 10px;">
              ${avatarHtml}
              <div>
                <strong style="cursor: pointer; color: #93c5fd; font-size: 13px;" class="btn-ver-servidor" data-termo="${item.nome}">${v}</strong>
                <div style="font-size: 10px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; flex-wrap: wrap;">
                  <span style="color: #c084fc; font-weight: 700;">ID #${pessoaId}</span> • 
                  <span>Matrícula: ${item.matricula_exibicao || item.matricula_padronizada || (item.matricula ? item.matricula.replace(/^0+/, '') : '—')}</span>
                </div>
                ${tagBadgeHtml}
              </div>
            </div>
          `;
        },
        lotacao: v => `<span style="font-size: 11px; color: var(--text-muted);">${v ? v.replace(/^\d+\s*-\s*/, '') : '—'}</span>`,
        periodo: (v, item) => `<span class="badge" style="background: rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace;">${String(item.mes).padStart(2,'0')}/${item.ano}</span>`,
        salario_base: v => formatMoeda(v),
        total_proventos: v => `<strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace;">${formatMoeda(v)}</strong>`,
        salario_liquido: v => `<strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">${formatMoeda(v)}</strong>`,
        acoes: (v, item) => `
          <button class="btn-primary btn-ver-servidor" data-termo="${item.nome || item.matricula_padronizada || item.matricula}" style="padding: 4px 10px; font-size: 11px; cursor: pointer;">
            👤 Dossiê
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

  // Ação de Filtrar Principal (Barra Rápida)
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
    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  // Ação de Limpar Filtros
  btnLimpar.onclick = () => {
    inputBusca.value = '';
    selectPeriodo.value = '';
    selectMes.value = '';
    inputAvancadaNome.value = '';
    inputAvancadaMat.value = '';
    inputAvancadaCargo.value = '';
    inputAvancadaLotacao.value = '';
    inputAvancadaSalMin.value = '';
    inputAvancadaSalMax.value = '';

    estado.busca = '';
    estado.periodo = '';
    estado.mandato = '';
    estado.ano = '';
    estado.mes = '';
    estado.nome = '';
    estado.matricula = '';
    estado.cargo = '';
    estado.lotacao = '';
    estado.salarioMin = '';
    estado.salarioMax = '';

    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  // Ação do Botão Aplicar na Busca Avançada
  btnAvancadaAplicar.onclick = () => {
    estado.nome = inputAvancadaNome.value.trim();
    estado.matricula = inputAvancadaMat.value.trim();
    estado.cargo = inputAvancadaCargo.value.trim();
    estado.lotacao = inputAvancadaLotacao.value.trim();
    estado.salarioMin = inputAvancadaSalMin.value.trim();
    estado.salarioMax = inputAvancadaSalMax.value.trim();
    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  btnAvancadaLimpar.onclick = () => {
    inputAvancadaNome.value = '';
    inputAvancadaMat.value = '';
    inputAvancadaCargo.value = '';
    inputAvancadaLotacao.value = '';
    inputAvancadaSalMin.value = '';
    inputAvancadaSalMax.value = '';

    estado.nome = '';
    estado.matricula = '';
    estado.cargo = '';
    estado.lotacao = '';
    estado.salarioMin = '';
    estado.salarioMax = '';
    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  selectPeriodo.onchange = () => btnFiltrar.click();
  selectMes.onchange = () => btnFiltrar.click();

  inputBusca.onkeyup = e => {
    if (e.key === 'Enter') btnFiltrar.click();
  };

  inputAvancadaNome.onkeyup = e => { if (e.key === 'Enter') btnAvancadaAplicar.click(); };
  inputAvancadaMat.onkeyup = e => { if (e.key === 'Enter') btnAvancadaAplicar.click(); };

  carregarPagina(1);
}
