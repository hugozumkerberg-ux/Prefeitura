/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 PESSOAS & AUDITORIA INTEGRADA
 * Módulo com identificação consolidada de pessoa física, trajetória funcional,
 * cruzamento eleitoral TSE/Câmara, detalhamento de diárias e histórico financeiro
 * interativo com seleção anual reativa e contracheques explicados.
 * ==============================================================================
 */

import { fetchFolha, fetchFolhaFiltros } from '../api.js';
import { renderTabela } from './tabela.js';
import { renderPaginacao } from './paginacao.js';

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

const MESES_EXTENSO = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatarAnosEMeses(totalMeses) {
  const m = parseInt(totalMeses, 10) || 0;
  if (m <= 0) return '0 meses';
  const anos = Math.floor(m / 12);
  const meses = m % 12;
  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  return partes.join(' e ') || '0 meses';
}

function detectarTagsContracheque(h) {
  const str = `${h.tabelas_json || ''} ${h.campos_json || ''}`;
  const tem13 = /13\s*Sal[áa]rio|Inss\s*13|Decimo|D[ée]cimo|0132\.\d+|0403\.02|0404\.02/i.test(str) || (h.mes === 12 && h.total_proventos > 1.4 * (h.salario_base || 1));
  const temFerias = /f[ée]rias|0121\.\d+|0122\.\d+|0163\.\d+/i.test(str);
  return { tem13, temFerias };
}

function agruparCargosETrajetoria(historico) {
  if (!historico || historico.length === 0) return [];
  const cargosMap = new Map();

  historico.forEach(h => {
    const nomeCargo = (h.cargo || 'Servidor Municipal').trim();
    if (!cargosMap.has(nomeCargo)) {
      cargosMap.set(nomeCargo, []);
    }
    cargosMap.get(nomeCargo).push(h);
  });

  const lista = [];
  cargosMap.forEach((itens, cargoNome) => {
    itens.sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes));
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];

    const mesesChaves = new Set(itens.map(x => `${x.ano}-${x.mes}`));
    const totalMeses = mesesChaves.size;

    const inicioStr = `${MESES_EXTENSO[primeiro.mes] || primeiro.mes}/${primeiro.ano}`;
    const fimStr = `${MESES_EXTENSO[ultimo.mes] || ultimo.mes}/${ultimo.ano}`;
    const duracaoStr = formatarAnosEMeses(totalMeses);

    // Média salarial regular (excluindo 13º e férias para apurar a remuneração normal)
    const normais = itens.filter(item => {
      const { tem13, temFerias } = detectarTagsContracheque(item);
      return !tem13 && !temFerias;
    });

    const itensParaMedia = normais.length > 0 ? normais : itens;
    const somaProventos = itensParaMedia.reduce((acc, c) => acc + (c.total_proventos || c.salario_base || 0), 0);
    const mediaRegular = somaProventos / (itensParaMedia.length || 1);

    lista.push({
      cargo: cargoNome,
      inicioStr,
      fimStr,
      totalMeses,
      duracaoStr,
      mediaRegular,
      primeiroAno: primeiro.ano,
      ultimoAno: ultimo.ano,
      ultimoMes: ultimo.mes,
      qtdContracheques: itens.length
    });
  });

  // Ordenar pelo cargo mais recente
  lista.sort((a, b) => (b.ultimoAno * 100 + b.ultimoMes) - (a.ultimoAno * 100 + a.ultimoMes));
  return lista;
}

function extrairRubricasContracheque(h) {
  const proventos = [];
  const descontos = [];

  try {
    let raw = null;
    if (h.tabelas_json) {
      raw = typeof h.tabelas_json === 'string' ? JSON.parse(h.tabelas_json) : h.tabelas_json;
    } else if (h.campos_json) {
      raw = typeof h.campos_json === 'string' ? JSON.parse(h.campos_json) : h.campos_json;
    }

    if (raw && Array.isArray(raw)) {
      const flattened = raw.flat(3);
      for (let i = 0; i < flattened.length; i++) {
        const item = flattened[i];
        if (Array.isArray(item) && item.length >= 2) {
          const desc = String(item[0]).trim();
          const val = String(item[1]).trim();
          if (desc && val && !desc.includes('Dados do') && !desc.includes('Matrícula/Nome') && !desc.includes('Orgão') && !desc.includes('Local de')) {
            if (/inss|irrf|previd|desconto|falta|pensao|consign|sindic/i.test(desc)) {
              descontos.push({ desc, val });
            } else if (!desc.includes('Total') && !desc.includes('Líquido')) {
              proventos.push({ desc, val });
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignora erro em parse
  }

  return { proventos, descontos };
}

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

    <!-- Barra de Filtros e Busca de Pessoas -->
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
          <span>👥</span> Pessoas Físicas & Vínculos Municipais
        </h2>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="badge badge-green">Base Oficial Certificada (2013–2026)</span>
          <span class="badge badge-blue">Cadastro Unificado</span>
        </div>
      </div>

      <!-- Linha Principal de Filtros Rápidos -->
      <div class="filter-bar" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input 
          type="text" 
          id="folha-input-busca" 
          class="input-field" 
          placeholder="🔍 Buscar por nome da pessoa física, matrícula sem zeros (ex: 573 ou 1556-2)..." 
          style="flex: 1; min-width: 260px;"
        >
        <button id="folha-btn-filtrar" class="btn-primary" style="padding: 10px 18px;">
          <span>🔍</span> Filtrar
        </button>
        <button id="folha-btn-toggle-colapsavel" class="btn" style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #93c5fd; padding: 10px 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          <span>⚡</span> <span>Filtros (Cargo, Ano, Mês)</span> <span id="folha-seta-colapsavel">▾</span>
        </button>
        <button id="folha-btn-limpar" class="btn-primary" style="background: #374151; padding: 10px 16px;">
          Limpar
        </button>
      </div>

      <!-- Linha de Baixo: Campos Colapsáveis "Cargo", "Ano", "Mês" -->
      <div id="folha-linha-colapsavel" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-top: 12px; padding: 12px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 8px;">
        <div style="flex: 1; min-width: 220px;">
          <label style="font-size: 11px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">💼 Cargo / Função</label>
          <select id="folha-select-cargo" class="input-field" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff;">
            <option value="">Todos os Cargos</option>
          </select>
        </div>
        <div style="width: 170px;">
          <label style="font-size: 11px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">📅 Ano</label>
          <select id="folha-select-ano" class="input-field" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff;">
            <option value="">Todos os Anos</option>
            <option value="2026">Ano 2026</option>
            <option value="2025">Ano 2025</option>
            <option value="2024">Ano 2024</option>
            <option value="2023">Ano 2023</option>
            <option value="2022">Ano 2022</option>
            <option value="2021">Ano 2021</option>
            <option value="2020">Ano 2020</option>
            <option value="2019">Ano 2019</option>
            <option value="2018">Ano 2018</option>
            <option value="2017">Ano 2017</option>
            <option value="2016">Ano 2016</option>
            <option value="2015">Ano 2015</option>
            <option value="2014">Ano 2014</option>
            <option value="2013">Ano 2013</option>
          </select>
        </div>
        <div style="width: 170px;">
          <label style="font-size: 11px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">🗓️ Mês</label>
          <select id="folha-select-mes" class="input-field" style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff;">
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

      <!-- Painel Expansível de Busca Avançada -->
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
      <div class="voter-modal-box" style="max-width: 920px; width: 95%; max-height: 92vh; display: flex; flex-direction: column; background: #0f172a; border: 1px solid #334155;">
        <div class="voter-modal-header" style="align-items: center; gap: 14px; border-bottom: 1px solid #1e293b; padding: 14px 20px;">
          <div id="dossie-foto-container"></div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 0;" id="dossie-nome">Pessoa Física</h3>
              <span id="dossie-tag-status"></span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;" id="dossie-cargo">Matrículas e vínculos municipais</p>
          </div>
          <button class="modal-close-btn" id="dossie-close-btn" style="font-size: 20px; cursor: pointer; color: #94a3b8; background: none; border: none;">✕</button>
        </div>
        <div class="voter-modal-body" id="dossie-body" style="overflow-y: auto; padding: 16px 20px;">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Carregando dados da pessoa física...</div>
        </div>
      </div>
    </div>
  `;

  const inputBusca = container.querySelector('#folha-input-busca');
  const selectCargo = container.querySelector('#folha-select-cargo');
  const selectAno = container.querySelector('#folha-select-ano');
  const selectMes = container.querySelector('#folha-select-mes');
  const btnFiltrar = container.querySelector('#folha-btn-filtrar');
  const btnLimpar = container.querySelector('#folha-btn-limpar');
  const btnToggleColapsavel = container.querySelector('#folha-btn-toggle-colapsavel');
  const linhaColapsavel = container.querySelector('#folha-linha-colapsavel');
  const setaColapsavel = container.querySelector('#folha-seta-colapsavel');
  const filtrosAtivosContainer = container.querySelector('#folha-filtros-ativos');
  const tabelaContainer = container.querySelector('#folha-conteudo-tabela');
  const modalDossie = container.querySelector('#modalDossieServidor');
  const modalCloseBtn = container.querySelector('#dossie-close-btn');

  let colapsavelAberto = true;
  if (btnToggleColapsavel && linhaColapsavel) {
    btnToggleColapsavel.onclick = () => {
      colapsavelAberto = !colapsavelAberto;
      linhaColapsavel.style.display = colapsavelAberto ? 'flex' : 'none';
      if (setaColapsavel) setaColapsavel.textContent = colapsavelAberto ? '▾' : '▸';
      btnToggleColapsavel.style.background = colapsavelAberto ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)';
    };
  }

  async function carregarOpcoesAvancadas() {
    try {
      const data = await fetchFolhaFiltros();
      if (selectCargo && data.cargos) {
        selectCargo.innerHTML = '<option value="">Todos os Cargos</option>' + 
          data.cargos.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    } catch (e) {
      // Ignora erro
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

  function renderizarFiltrosAtivos() {
    filtrosAtivosContainer.innerHTML = '';
    const ativos = [];

    if (estado.busca) ativos.push({ rotulo: `Busca: "${estado.busca}"`, limpar: () => { estado.busca = ''; inputBusca.value = ''; } });
    if (estado.cargo) ativos.push({ rotulo: `Cargo: ${estado.cargo}`, limpar: () => { estado.cargo = ''; if (selectCargo) selectCargo.value = ''; } });
    if (estado.ano) ativos.push({ rotulo: `Ano: ${estado.ano}`, limpar: () => { estado.ano = ''; if (selectAno) selectAno.value = ''; } });
    if (estado.mes) ativos.push({ rotulo: `Mês: ${MESES_EXTENSO[estado.mes] || estado.mes}`, limpar: () => { estado.mes = ''; if (selectMes) selectMes.value = ''; } });

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
    const fotoContainer = container.querySelector('#dossie-foto-container');
    const tagStatusContainer = container.querySelector('#dossie-tag-status');
    fotoContainer.innerHTML = '';
    tagStatusContainer.innerHTML = '';
    dossieBody.innerHTML = '<div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">Consultando cadastro consolidado da pessoa física...</div>';

    try {
      const res = await fetch(`/api/auditoria/rastrear?termo=${encodeURIComponent(nomeOuMatricula)}`);
      const data = await res.json();

      if (!data.sucesso) {
        dossieBody.innerHTML = `<div class="empty-state"><h4>Registro não localizado para "${nomeOuMatricula}"</h4></div>`;
        return;
      }

      const s = data.servidor;
      const folha = data.historicoFolha || [];
      const diarias = data.historicoDiarias || [];
      const pol = s.passado_politico || {};
      const temPol = Boolean(pol.tem_passado_politico);
      const venceu = Boolean(pol.venceu);

      // 1. Cabeçalho Enxuto e Limpo
      container.querySelector('#dossie-nome').textContent = s.nome;
      container.querySelector('#dossie-cargo').textContent = `Matrícula(s): ${s.matriculas.length ? s.matriculas.join(', ') : '—'} • ${s.cargos.join(' • ')}`;

      if (temPol && s.foto_url) {
        fotoContainer.innerHTML = `
          <img 
            src="${s.foto_url}" 
            alt="${s.nome}" 
            style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid ${venceu ? '#10b981' : '#f59e0b'}; flex-shrink: 0;"
            onerror="this.style.display='none';"
          >
        `;
      }

      tagStatusContainer.innerHTML = temPol 
        ? `<span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 700; padding: 3px 8px;">
            ${venceu ? '🏛️ Mandato Eleito' : '🗳️ Candidato TSE'}
           </span>`
        : `<span class="badge badge-blue" style="font-size: 11px; font-weight: 700;">Servidor Civil</span>`;

      // 2. Card 1: Histórico Político (no Topo para agentes políticos ou candidatos)
      const cardPoliticoHtml = temPol ? `
        <div class="card" style="margin-bottom: 16px; background: #0b1120; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">${venceu ? '🏛️' : '🗳️'}</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Histórico Político & Registro Eleitoral</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Fontes Oficiais: Tribunal Superior Eleitoral (TSE) e Câmara Municipal de Arinos</div>
              </div>
            </div>
            <div>
              <span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 700; padding: 3px 8px;">
                ${pol.tag_texto || (venceu ? 'Mandato Político' : 'Registro TSE')}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 10px;">
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Status Eleitoral</div>
              <div style="font-size: 13px; font-weight: 700; color: ${venceu ? '#34d399' : '#fbbf24'}; margin-top: 2px;">
                ${venceu ? '✔ Eleito' : `Não Eleito (${pol.status_eleicao || 'Suplente'})`}
              </div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Cargo Disputado</div>
              <div style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-top: 2px;">
                ${pol.cargo_politico || '—'}
              </div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Partido / Coligação</div>
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
                📋 Eleições Disputadas (TSE):
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${pol.historico_disputas.map(d => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; border-radius: 4px; font-size: 11.5px; background: rgba(255,255,255,0.03);">
                    <span><strong>Eleição ${d.ano}</strong> — ${d.cargo} (${d.partido || '—'}${d.numero ? ` Nº ${d.numero}` : ''})</span>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      ${d.bens ? `<span style="color: #34d399; font-size: 11px; font-family: monospace;">Bens: ${formatMoeda(d.bens)}</span>` : ''}
                      <span class="badge ${d.eleito ? 'badge-green' : 'badge-amber'}">${d.resultado || (d.eleito ? 'Eleito' : 'Não Eleito')}${d.votos ? ` • ${d.votos.toLocaleString('pt-BR')} votos` : ''}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : '';

      // 3. Card 2: Trajetória Funcional & Cargos Exercidos (Agrupamento Dinâmico e Salário Médio)
      const cargosCalculados = agruparCargosETrajetoria(folha);

      const cardFuncionalHtml = `
        <div class="card" style="margin-bottom: 16px; background: #0f172a; border: 1px solid #334155; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">💼</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Trajetória Funcional & Cargos Exercidos</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Períodos oficiais de exercício e média salarial regular por cargo</div>
              </div>
            </div>
            <div>
              <span class="badge badge-green" style="font-size: 11px; font-weight: 700;">Tempo Efetivo: ${s.tempoEfetivo || '—'}</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${cargosCalculados.map(c => `
              <div style="padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid #1e293b; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1; min-width: 220px;">
                  <div style="font-size: 13px; font-weight: 700; color: #fff;">${c.cargo}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                    Período: <strong style="color: #cbd5e1;">${c.inicioStr} — ${c.fimStr}</strong> 
                    <span class="badge badge-blue" style="margin-left: 6px; font-size: 10px;">${c.duracaoStr}</span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Salário Médio Regular</div>
                  <div style="font-size: 14px; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace;">
                    ${formatMoeda(c.mediaRegular)} <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">/mês</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          ${s.temIntervalos ? `
            <div style="margin-top: 10px; padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; font-size: 11px; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
              <span>⚠️</span> <span>Ruptura de Vínculo: ${s.totalIntervalos} intervalo(s) de afastamento detectado(s) (${s.tempoIntervalos}).</span>
            </div>
          ` : `
            <div style="margin-top: 10px; padding: 8px 12px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; font-size: 11px; color: #34d399;">
              ✔ Vínculo Contínuo: Exercício ininterrupto no município (${s.tempoEfetivo}).
            </div>
          `}
        </div>
      `;

      // 4. Card 3: Diárias Municipais (Borda Amarela Obrigatória)
      const cardDiariasHtml = `
        <div class="card" style="margin-bottom: 16px; background: #0b1120; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">✈️</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin: 0;">Diárias & Deslocamentos Municipais</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Valores de indenização de viagens e representação institucional (SIAP / Prefeitura)</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: var(--text-muted); margin-right: 8px;">${diarias.length} concessões</span>
              <strong style="color: #fbbf24; font-size: 16px; font-family: 'JetBrains Mono', monospace;">${formatMoeda(s.totalDiariasValor)}</strong>
            </div>
          </div>

          ${diarias.length > 0 ? `
            <div class="table-wrapper" style="max-height: 220px; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Competência</th>
                    <th>Fonte Oficial</th>
                    <th>Tipo / Objeto</th>
                    <th style="text-align: right;">Valor da Diária</th>
                  </tr>
                </thead>
                <tbody>
                  ${diarias.map(d => `
                    <tr>
                      <td><span class="badge badge-amber" style="font-family: 'JetBrains Mono', monospace;">${String(d.mes).padStart(2, '0')}/${d.ano}</span></td>
                      <td><span style="color: #cbd5e1; font-size: 11.5px;">${d.fonte || 'Prefeitura Municipal (SIAP)'}</span></td>
                      <td><span style="color: var(--text-muted); font-size: 11.5px;">${d.tipo || 'Deslocamento oficial'}</span></td>
                      <td style="text-align: right;"><strong style="color: #fbbf24; font-family: 'JetBrains Mono', monospace;">${formatMoeda(d.valor)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px; background: rgba(255,255,255,0.02); border-radius: 6px;">
              Nenhuma concessão de diária localizada na base de registros para este servidor.
            </div>
          `}
        </div>
      `;

      // 5. Card 4: Histórico Financeiro & Contracheques (Borda Azul com Seletor Reativo de Anos)
      const anosDisponiveis = Array.from(new Set(folha.map(h => h.ano))).sort((a, b) => b - a);
      const anoInicial = anosDisponiveis[0] || 'todos';

      const cardFinanceiroHtml = `
        <div class="card" style="background: #0f172a; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">💰</span>
              <div>
                <h4 style="font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0;">Histórico Financeiro & Contracheques</h4>
                <div style="font-size: 11px; color: var(--text-muted);">Holerites oficiais discriminados com proventos, descontos e tags de férias/13º</div>
              </div>
            </div>
          </div>

          <!-- Barra de Botões com os Anos da Pessoa (Pré-carregado no mais recente) -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1e293b;">
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-right: 4px;">Filtrar Ano:</span>
            <button 
              class="btn-ano-dossie" 
              data-ano="todos" 
              style="padding: 4px 10px; font-size: 11px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: #cbd5e1; cursor: pointer;"
            >
              Todos (${folha.length})
            </button>
            ${anosDisponiveis.map(ano => `
              <button 
                class="btn-ano-dossie ${ano === anoInicial ? 'ativo' : ''}" 
                data-ano="${ano}" 
                style="padding: 4px 10px; font-size: 11px; border-radius: 4px; border: 1px solid ${ano === anoInicial ? '#3b82f6' : '#334155'}; background: ${ano === anoInicial ? '#2563eb' : '#1e293b'}; color: #fff; cursor: pointer; font-weight: ${ano === anoInicial ? '700' : '500'};"
              >
                ${ano}
              </button>
            `).join('')}
          </div>

          <!-- Cards Dinâmicos de Totais do Ano Selecionado -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 14px;" id="dossie-kpis-ano">
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Salário Bruto</div>
              <div style="font-size: 15px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace;" id="kpi-ano-bruto">R$ 0,00</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Total Descontos</div>
              <div style="font-size: 15px; font-weight: 800; color: #f87171; font-family: 'JetBrains Mono', monospace;" id="kpi-ano-descontos">R$ 0,00</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Salário Líquido</div>
              <div style="font-size: 15px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;" id="kpi-ano-liquido">R$ 0,00</div>
            </div>
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Período / Meses</div>
              <div style="font-size: 13px; font-weight: 700; color: #cbd5e1;" id="kpi-ano-meses">0 meses</div>
            </div>
          </div>

          <!-- Tabela de Holerites do Ano -->
          <div class="table-wrapper" style="max-height: 280px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th>Mês / Período</th>
                  <th>Cargo</th>
                  <th style="text-align: right;">Base</th>
                  <th style="text-align: right;">Bruto</th>
                  <th style="text-align: right;">Descontos</th>
                  <th style="text-align: right;">Líquido</th>
                </tr>
              </thead>
              <tbody id="dossie-tbody-contracheques"></tbody>
            </table>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 8px; text-align: right;">
            💡 Dica: Clique em qualquer linha do contracheque para expandir e ver os proventos e descontos discriminados.
          </div>
        </div>
      `;

      // Monta os 4 cards no DOM do Modal
      dossieBody.innerHTML = `
        ${cardPoliticoHtml}
        ${cardFuncionalHtml}
        ${cardDiariasHtml}
        ${cardFinanceiroHtml}
      `;

      // Função Reativa de Filtrar por Ano
      function renderizarAnoSelecionado(anoFiltro) {
        const filtrados = (anoFiltro === 'todos')
          ? folha
          : folha.filter(h => h.ano === Number(anoFiltro));

        const somaBruto = filtrados.reduce((a, b) => a + (b.total_proventos || 0), 0);
        const somaDescontos = filtrados.reduce((a, b) => a + (b.total_descontos || 0), 0);
        const somaLiquido = filtrados.reduce((a, b) => a + (b.salario_liquido || 0), 0);
        const mesesContados = new Set(filtrados.map(h => `${h.ano}-${h.mes}`)).size;

        dossieBody.querySelector('#kpi-ano-bruto').textContent = formatMoeda(somaBruto);
        dossieBody.querySelector('#kpi-ano-descontos').textContent = formatMoeda(somaDescontos);
        dossieBody.querySelector('#kpi-ano-liquido').textContent = formatMoeda(somaLiquido);
        dossieBody.querySelector('#kpi-ano-meses').textContent = anoFiltro === 'todos' 
          ? `${mesesContados} meses (${s.tempoEfetivo || '—'})`
          : `${mesesContados} ${mesesContados === 1 ? 'mês' : 'meses'} (${anoFiltro})`;

        const tbody = dossieBody.querySelector('#dossie-tbody-contracheques');
        tbody.innerHTML = filtrados.map((h, idx) => {
          const { tem13, temFerias } = detectarTagsContracheque(h);
          const tagsHtml = `
            ${tem13 ? '<span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #a855f7; font-size: 10px; margin-left: 4px;">🎁 13º</span>' : ''}
            ${temFerias ? '<span class="badge badge-amber" style="font-size: 10px; margin-left: 4px;">🏖️ Férias</span>' : ''}
          `;

          return `
            <tr class="tr-contracheque" data-idx="${idx}" style="cursor: pointer;" title="Clique para ver detalhes do contracheque">
              <td>
                <span class="badge" style="background: rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace;">
                  ${String(h.mes).padStart(2, '0')}/${h.ano}
                </span>
                ${tagsHtml}
              </td>
              <td style="font-size: 12px;">${h.cargo}</td>
              <td style="text-align: right; color: var(--text-muted); font-size: 11.5px;">${formatMoeda(h.salario_base)}</td>
              <td style="text-align: right; color: #60a5fa; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${formatMoeda(h.total_proventos)}</td>
              <td style="text-align: right; color: #f87171; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${formatMoeda(h.total_descontos)}</td>
              <td style="text-align: right; color: #34d399; font-weight: 700; font-family: 'JetBrains Mono', monospace;">${formatMoeda(h.salario_liquido)}</td>
            </tr>
            <tr class="tr-detalhes-rubricas" id="detalhe-h-${idx}" style="display: none; background: #0b1120;">
              <td colspan="6" style="padding: 10px 14px;">
                <div style="font-size: 11px; font-weight: 700; color: #60a5fa; margin-bottom: 6px; text-transform: uppercase;">
                  📄 Detalhamento Oficial do Contracheque (${String(h.mes).padStart(2, '0')}/${h.ano} — Matrícula: ${h.matricula_padronizada || '—'})
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11.5px;">
                  <div style="background: rgba(59, 130, 246, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <div style="font-weight: 700; color: #93c5fd; margin-bottom: 4px;">Remunerações / Proventos:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span>Salário Base:</span>
                      <strong style="color: #60a5fa;">${formatMoeda(h.salario_base)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>Total Bruto:</span>
                      <strong style="color: #60a5fa;">${formatMoeda(h.total_proventos)}</strong>
                    </div>
                  </div>
                  <div style="background: rgba(248, 113, 113, 0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(248, 113, 113, 0.2);">
                    <div style="font-weight: 700; color: #fca5a5; margin-bottom: 4px;">Descontos / Retenções:</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                      <span>Total de Descontos:</span>
                      <strong style="color: #f87171;">${formatMoeda(h.total_descontos)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>Valor Líquido Recebido:</span>
                      <strong style="color: #34d399;">${formatMoeda(h.salario_liquido)}</strong>
                    </div>
                  </div>
                </div>
                ${h.sha256 ? `
                  <div style="margin-top: 8px; padding: 6px 10px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                    <div style="font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; word-break: break-all;">
                      <span style="color: #34d399; font-weight: 700;">🛡️ Selo SHA-256:</span> ${h.sha256}
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-outline" style="padding: 2px 8px; font-size: 9.5px; cursor: pointer; color: #cbd5e1;" onclick="event.stopPropagation(); navigator.clipboard.writeText('${h.sha256}').then(() => alert('Hash SHA-256 copiado!'))">
                        📋 Copiar Hash
                      </button>
                      <a href="#auditoria?termo=${encodeURIComponent(h.sha256)}" class="btn btn-outline" style="padding: 2px 8px; font-size: 9.5px; text-decoration: none; color: #34d399; border-color: rgba(52, 211, 153, 0.4);" onclick="event.stopPropagation();">
                        🔍 Auditar Custódia
                      </a>
                    </div>
                  </div>
                ` : ''}
              </td>
            </tr>
          `;
        }).join('');

        // Event listener de clique nas linhas para expandir
        tbody.querySelectorAll('.tr-contracheque').forEach(tr => {
          tr.onclick = () => {
            const idx = tr.dataset.idx;
            const detRow = tbody.querySelector(`#detalhe-h-${idx}`);
            if (detRow) {
              const aberto = detRow.style.display !== 'none';
              detRow.style.display = aberto ? 'none' : 'table-row';
              tr.style.background = aberto ? '' : 'rgba(59, 130, 246, 0.12)';
            }
          };
        });
      }

      // Event listeners para os botões de anos
      dossieBody.querySelectorAll('.btn-ano-dossie').forEach(btn => {
        btn.onclick = () => {
          dossieBody.querySelectorAll('.btn-ano-dossie').forEach(b => {
            b.style.border = '1px solid #334155';
            b.style.background = '#1e293b';
            b.style.fontWeight = '500';
          });
          btn.style.border = '1px solid #3b82f6';
          btn.style.background = '#2563eb';
          btn.style.fontWeight = '700';

          const ano = btn.dataset.ano;
          renderizarAnoSelecionado(ano);
        };
      });

      // Render inicial com o ano mais recente (ou todos)
      renderizarAnoSelecionado(anoInicial);

    } catch (err) {
      dossieBody.innerHTML = `<div class="empty-state">Erro ao carregar dossiê: ${err.message}</div>`;
    }
  }

  async function carregarPagina(page) {
    estado.page = page;
    tabelaContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Consultando acervo oficial de servidores...</div>';

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

      // Tabela de Pessoas unificada conforme especificado pelo usuário
      const colunas = [
        { chave: 'nome', titulo: 'Pessoa / Servidor' },
        { chave: 'cargo', titulo: 'Último Cargo / Função' },
        { chave: 'periodo', titulo: 'Último Período', align: 'center' },
        { chave: 'total_proventos', titulo: 'Último Salário Bruto', align: 'right' },
        { chave: 'valor_diarias', titulo: 'Diárias', align: 'right' }
      ];

      const formatadores = {
        nome: (v, item) => {
          const mat = item.matricula_exibicao || item.matricula_padronizada || (item.matricula ? item.matricula.replace(/^0+/, '') : '');
          const matTexto = mat ? `<span style="color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 12px; margin-right: 6px;">(${mat})</span>` : '';
          const pol = item.passado_politico || {};
          const temPol = Boolean(pol.tem_passado_politico);
          const venceu = Boolean(pol.venceu);
          const tagTexto = pol.tag_texto;

          const tagBadgeHtml = temPol ? `
            <div style="margin-top: 3px;">
              <span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px;">
                ${tagTexto}
              </span>
            </div>
          ` : '';

          return `
            <div>
              <div>${matTexto}<strong style="color: #fff; font-size: 13.5px;">${v}</strong></div>
              ${tagBadgeHtml}
            </div>
          `;
        },
        cargo: (v, item) => `
          <div>
            <div style="font-size: 12.5px; color: #e2e8f0; font-weight: 600;">${v || '—'}</div>
            ${item.lotacao ? `<div style="font-size: 10.5px; color: var(--text-muted); margin-top: 1px;">${item.lotacao.replace(/^\d+\s*-\s*/, '')}</div>` : ''}
          </div>
        `,
        periodo: (v, item) => `
          <span class="badge" style="background: rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace; font-size: 11px;">
            ${MESES_EXTENSO[item.mes] || item.mes}/${item.ano}
          </span>
        `,
        total_proventos: v => `<strong style="color: #60a5fa; font-family: 'JetBrains Mono', monospace; font-size: 13px;">${formatMoeda(v)}</strong>`,
        valor_diarias: (v, item) => {
          const val = item.valor_diarias || 0;
          if (val > 0) {
            return `<strong style="color: #fbbf24; font-family: 'JetBrains Mono', monospace; font-weight: 700;">${formatMoeda(val)}</strong>`;
          }
          return `<span style="color: var(--text-muted); font-size: 11px;">—</span>`;
        }
      };

      const tabelaEl = renderTabela(colunas, resp.dados, formatadores);
      const paginacaoEl = renderPaginacao(resp.paginacao, p => carregarPagina(p));

      tabelaContainer.appendChild(tabelaEl);
      tabelaContainer.appendChild(paginacaoEl);

      // Linha inteira da tabela clicável para abrir o Dossiê
      tabelaContainer.querySelectorAll('tbody tr').forEach((tr, index) => {
        const item = resp.dados[index];
        if (item) {
          tr.style.cursor = 'pointer';
          tr.title = `Clique para abrir o Dossiê de ${item.nome}`;
          tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(59, 130, 246, 0.08)');
          tr.addEventListener('mouseleave', () => tr.style.background = '');
          tr.onclick = () => abrirDossie(item.nome || item.matricula_padronizada || item.matricula);
        }
      });
    } catch (err) {
      tabelaContainer.innerHTML = `<div class="empty-state"><h3>Erro na consulta</h3><p>${err.message}</p></div>`;
    }
  }

  // Ação de Filtrar Principal (Barra Rápida e Linha Colapsável: Cargo, Ano e Mês)
  btnFiltrar.onclick = () => {
    estado.busca = inputBusca.value.trim();
    estado.cargo = selectCargo ? selectCargo.value : '';
    estado.ano = selectAno ? selectAno.value : '';
    estado.mes = selectMes ? selectMes.value : '';
    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  // Ação de Limpar Filtros
  btnLimpar.onclick = () => {
    inputBusca.value = '';
    if (selectCargo) selectCargo.value = '';
    if (selectAno) selectAno.value = '';
    if (selectMes) selectMes.value = '';

    estado.busca = '';
    estado.cargo = '';
    estado.ano = '';
    estado.mes = '';

    renderizarFiltrosAtivos();
    carregarPagina(1);
  };

  if (selectCargo) selectCargo.onchange = () => btnFiltrar.click();
  if (selectAno) selectAno.onchange = () => btnFiltrar.click();
  if (selectMes) selectMes.onchange = () => btnFiltrar.click();

  inputBusca.onkeyup = e => {
    if (e.key === 'Enter') btnFiltrar.click();
  };

  carregarPagina(1);
}
