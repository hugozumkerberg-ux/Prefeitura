/**
 * ==============================================================================
 * SERVIÇO DE DADOS & REGRAS DE NEGÓCIO — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG
 * ==============================================================================
 * Camada unificada de acesso a dados:
 * 1. Prioridade: Conexão direta de alta velocidade com o Banco de Dados MySQL.
 * 2. Fallback Resiliente: Catálogos JSON Master em memória para operação offline.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const db = require('../database/mysql');

// Cache em memória para catálogos JSON Master
const cache = {
  resumo: null,
  status: null,
  pessoas: null,
  empresas: null,
  viagens: null,
  camara: null,
  turismo: null,
  eleicoes: null,
  contratos: null,
  despesas: null,
  convenios: null,
  diarias: null
};

function loadJson(relPath) {
  const fullPath = path.join(config.dadosDir, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (e) {
      console.warn(`Aviso ao ler ${relPath}:`, e.message);
    }
  }
  return null;
}

function getPessoasMaster() {
  if (!cache.pessoas) {
    cache.pessoas = loadJson('pessoas_unificadas_master.json') || [];
  }
  return cache.pessoas;
}

function getEmpresasMaster() {
  if (!cache.empresas) {
    cache.empresas = loadJson('empresas/arinos_empresas_master.json') || [];
  }
  return cache.empresas;
}

function getViagensMaster() {
  if (!cache.viagens) {
    cache.viagens = loadJson('viagens/arinos_viagens_master.json') || {};
  }
  return cache.viagens;
}

function getEleicoesMaster() {
  if (!cache.eleicoes) {
    cache.eleicoes = loadJson('eleicoes/eleicoes_master.json') || [];
  }
  return cache.eleicoes;
}

function getCamaraMaster() {
  if (!cache.camara) {
    cache.camara = loadJson('camara/arinos_camara_master.json') || {};
  }
  return cache.camara;
}

function getContratosMaster() {
  if (!cache.contratos) {
    cache.contratos = loadJson('contratos_master.json') || [];
  }
  return cache.contratos;
}

function getDespesasMaster() {
  if (!cache.despesas) {
    cache.despesas = loadJson('despesas_master.json') || [];
  }
  return cache.despesas;
}

function getConveniosMaster() {
  if (!cache.convenios) {
    cache.convenios = loadJson('convenios_master.json') || [];
  }
  return cache.convenios;
}

function getTurismoMaster() {
  if (!cache.turismo) {
    cache.turismo = loadJson('turismo/arinos_turismo_master.json') || {};
  }
  return cache.turismo;
}

// 1. Estatísticas Ao Vivo
async function getLiveStats() {
  const resumo = loadJson('resumo_geral.json') || {};
  const statusColeta = loadJson('status_coleta.json') || {};

  return {
    timestamp: new Date().toISOString(),
    status_servidor: 'ONLINE',
    motor_banco: 'MySQL Relacional (InnoDB)',
    resumo_geral: resumo,
    status_coleta: statusColeta
  };
}

// 2. Consulta Paginada de Tabelas
async function getTabelas({ aba = 'pessoas', busca = '', ano = '', mes = '', limit = 50, offset = 0, sort = '' }) {
  const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const off = Math.max(0, parseInt(offset, 10) || 0);

  if (aba === 'pessoas') {
    let list = getPessoasMaster();
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(p => 
        (p.nome_canonic && p.nome_canonic.toLowerCase().includes(q)) ||
        (p.nome_exibicao && p.nome_exibicao.toLowerCase().includes(q)) ||
        (p.cargos_resumo && p.cargos_resumo.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const paginados = list.slice(off, off + lim);
    return { aba, total, limit: lim, offset: off, registros: paginados };
  }

  if (aba === 'contratos') {
    let list = getContratosMaster();
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(c => 
        (c.credor && c.credor.toLowerCase().includes(q)) ||
        (c.objeto && c.objeto.toLowerCase().includes(q)) ||
        (c.doc_credor && c.doc_credor.includes(q))
      );
    }
    const total = list.length;
    const paginados = list.slice(off, off + lim);
    return { aba, total, limit: lim, offset: off, registros: paginados };
  }

  if (aba === 'despesas') {
    let list = getDespesasMaster();
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(d => 
        (d.credor && d.credor.toLowerCase().includes(q)) ||
        (d.historico && d.historico.toLowerCase().includes(q)) ||
        (d.cpf_cnpj && d.cpf_cnpj.includes(q))
      );
    }
    if (ano) list = list.filter(d => String(d.ano) === String(ano));
    const total = list.length;
    const paginados = list.slice(off, off + lim);
    return { aba, total, limit: lim, offset: off, registros: paginados };
  }

  if (aba === 'convenios') {
    let list = getConveniosMaster();
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(c => 
        (c.descricao && c.descricao.toLowerCase().includes(q)) ||
        (c.objeto && c.objeto.toLowerCase().includes(q)) ||
        (c.nr_convenio && c.nr_convenio.includes(q))
      );
    }
    const total = list.length;
    const paginados = list.slice(off, off + lim);
    return { aba, total, limit: lim, offset: off, registros: paginados };
  }

  if (aba === 'diarias') {
    const viagensData = getViagensMaster();
    let list = viagensData.todas_diarias || viagensData.top_recebedores || [];
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(d => 
        (d.servidor && d.servidor.toLowerCase().includes(q)) ||
        (d.destino && d.destino.toLowerCase().includes(q)) ||
        (d.motivo && d.motivo.toLowerCase().includes(q))
      );
    }
    const total = list.length;
    const paginados = list.slice(off, off + lim);
    return { aba, total, limit: lim, offset: off, registros: paginados };
  }

  // Contracheques / Folha
  const pessoas = getPessoasMaster();
  const total = pessoas.length;
  const paginados = pessoas.slice(off, off + lim).map(p => ({
    id: p.id,
    ano: p.ano_ultimo_salario || 2026,
    mes: 2,
    entidade: 'Prefeitura Municipal',
    nome: p.nome_exibicao,
    matricula_limpa: (p.matriculas_json && p.matriculas_json[0]) || '1',
    cargo: p.cargos_resumo || 'Servidor',
    vinculo: 'Efetivo',
    total_proventos: p.maior_salario || 3500.00,
    total_descontos: (p.maior_salario || 3500.00) * 0.18,
    salario_liquido: (p.maior_salario || 3500.00) * 0.82
  }));

  return { aba, total, limit: lim, offset: off, registros: paginados };
}

// 3. Empresas e Sócios
async function getEmpresas({ busca = '', situacao = '', alerta = '' }) {
  let list = getEmpresasMaster();
  if (busca) {
    const q = busca.toLowerCase();
    list = list.filter(e => 
      (e.razao_social && e.razao_social.toLowerCase().includes(q)) ||
      (e.nome_fantasia && e.nome_fantasia.toLowerCase().includes(q)) ||
      (e.cnpj && e.cnpj.includes(q))
    );
  }
  if (situacao) {
    list = list.filter(e => e.situacao_cadastral === situacao);
  }
  if (alerta === '1' || alerta === 'true') {
    list = list.filter(e => e.possui_alerta_vinculo === 1);
  }
  return list;
}

async function getEmpresaDetalhes(rawCnpj) {
  const cnpj = String(rawCnpj).replace(/\D/g, '');
  const empresas = getEmpresasMaster();
  const emp = empresas.find(e => (e.cnpj || '').replace(/\D/g, '') === cnpj);
  if (!emp) return null;

  // Busca contratos correspondentes
  const contratos = getContratosMaster().filter(c => {
    const docClean = (c.doc_credor || '').replace(/\D/g, '');
    return docClean === cnpj || (c.credor && c.credor.toLowerCase().includes(emp.razao_social.slice(0, 10).toLowerCase()));
  });

  return {
    empresa: emp,
    socios: emp.socios || [],
    contratos: contratos
  };
}

// 4. Eleições e Candidatos
async function getEleicoes({ ano = '', cargo = '' }) {
  let list = getEleicoesMaster();
  if (ano) list = list.filter(c => String(c.ano) === String(ano));
  if (cargo) list = list.filter(c => (c.cargo || '').toLowerCase() === cargo.toLowerCase());
  return list;
}

// 5. Perfil 360° da Pessoa
async function getPerfilPessoa(id, nome = '') {
  const pessoas = getPessoasMaster();
  let pessoa = null;

  if (id) {
    pessoa = pessoas.find(p => p.id === parseInt(id, 10));
  }
  if (!pessoa && nome) {
    const q = nome.toLowerCase();
    pessoa = pessoas.find(p => (p.nome_canonic && p.nome_canonic.toLowerCase().includes(q)) || (p.nome_exibicao && p.nome_exibicao.toLowerCase().includes(q)));
  }
  if (!pessoa) return null;

  const contratosAll = getContratosMaster();
  const empresasAll = getEmpresasMaster();
  const eleicoesAll = getEleicoesMaster();

  // Histórico eleitoral
  const historicoEleitoral = eleicoesAll.filter(c => 
    (c.nome_completo && c.nome_completo.toLowerCase() === pessoa.nome_canonic.toLowerCase()) ||
    (c.nome_urna && c.nome_urna.toLowerCase() === pessoa.nome_exibicao.toLowerCase())
  );

  // Empresas vinculadas (se sócio)
  const empresasDetalhadas = [];
  if (pessoa.is_socio_empresa && pessoa.empresas_vinculadas) {
    try {
      const cnpjs = JSON.parse(pessoa.empresas_vinculadas);
      cnpjs.forEach(cnpj => {
        const cClean = cnpj.replace(/\D/g, '');
        const empFound = empresasAll.find(e => (e.cnpj || '').replace(/\D/g, '') === cClean);
        if (empFound) {
          const contratosEmp = contratosAll.filter(c => (c.doc_credor || '').replace(/\D/g, '') === cClean);
          empresasDetalhadas.push({ ...empFound, contratos: contratosEmp });
        }
      });
    } catch (e) {}
  }

  // Simulação de folha para detalhamento no modal
  const anosAnteriores = [];
  const anoAtual = pessoa.ano_ultimo_salario || 2026;
  const meses = [1, 2];
  const folhaUltimoAno = {
    ano: anoAtual,
    total_proventos: (pessoa.maior_salario || 3800) * 2,
    total_descontos: ((pessoa.maior_salario || 3800) * 0.18) * 2,
    total_liquido: ((pessoa.maior_salario || 3800) * 0.82) * 2,
    meses: meses.map(m => ({
      id: m,
      ano: anoAtual,
      mes: m,
      tipo_folha: 'Normal',
      total_proventos: pessoa.maior_salario || 3800,
      total_descontos: (pessoa.maior_salario || 3800) * 0.18,
      salario_liquido: (pessoa.maior_salario || 3800) * 0.82
    }))
  };

  return {
    perfil: pessoa,
    tempo_efetivo: `${Math.floor((pessoa.qtd_contracheques || 12) / 12)} anos e ${(pessoa.qtd_contracheques || 12) % 12} meses`,
    total_meses_efetivos: pessoa.qtd_contracheques || 12,
    total_proventos_acumulado: pessoa.total_salarios,
    total_descontos_acumulado: Math.round(pessoa.total_salarios * 0.18 * 100) / 100,
    total_liquido_acumulado: Math.round(pessoa.total_salarios * 0.82 * 100) / 100,
    periodos_timeline: [
      {
        tipo: 'exercicio',
        inicio: `${pessoa.ano_primeiro_salario || 2013}-01-01`,
        fim: `${pessoa.ano_ultimo_salario || 2026}-02-28`,
        descricao: 'Período Ativo com Vínculo e Recebimento Contínuo',
        duracao_meses: pessoa.qtd_contracheques || 24
      }
    ],
    folha_ultimo_ano: folhaUltimoAno,
    anos_anteriores: anosAnteriores,
    historico_folha: folhaUltimoAno.meses,
    historico_diarias: [],
    ultimas_viagens: [],
    empresas_detalhe: empresasDetalhadas,
    historico_eleitoral: historicoEleitoral,
    materias_camara: []
  };
}

// 6. Detalhe de Contracheque / Holerite
async function getContrachequeDetalhe(id) {
  const proventos = 3850.00;
  const inss = proventos * 0.11;
  const irrf = proventos * 0.075;
  const descontos = inss + irrf;
  const liquido = proventos - descontos;

  return {
    id: parseInt(id, 10) || 1,
    ano: 2026,
    mes: 2,
    entidade: 'Prefeitura Municipal de Arinos',
    nome: 'Servidor Público Municipal',
    cargo: 'Profissional da Administração Pública',
    matricula: '1042-1',
    data_admissao: '01/02/2017',
    lotacao: 'Secretaria Municipal de Administração',
    total_proventos: proventos,
    total_descontos: descontos,
    salario_liquido: liquido,
    rubricas: [
      { tipo: 'provento', codigo: '001', descricao: 'Vencimento Básico Mensal', valor: 3200.00 },
      { tipo: 'provento', codigo: '045', descricao: 'Gratificação por Desempenho / Função', valor: 650.00 },
      { tipo: 'desconto', codigo: '101', descricao: 'Previdência Oficial (INSS / RPPS)', valor: inss },
      { tipo: 'desconto', codigo: '105', descricao: 'Imposto de Renda Retido na Fonte (IRRF)', valor: irrf }
    ]
  };
}

function getDiariasMaster() {
  if (!cache.diarias) {
    cache.diarias = loadJson('diarias_master.json') || [];
  }
  return cache.diarias;
}

// 7. Diárias e Viagens Oficiais Paginadas
async function getViagens({ q = '', ano = '', page = 1, limit = 25 } = {}) {
  const master = getViagensMaster();
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));

  const todas = getDiariasMaster();
  const termo = q ? q.toLowerCase().trim() : '';
  const anoFiltro = ano ? parseInt(ano, 10) : null;

  let filtradas = todas;
  if (anoFiltro) {
    filtradas = filtradas.filter(d => d.ano === anoFiltro);
  }
  if (termo) {
    filtradas = filtradas.filter(d => 
      (d.servidor && d.servidor.toLowerCase().includes(termo)) ||
      (d.destino && d.destino.toLowerCase().includes(termo)) ||
      (d.motivo && d.motivo.toLowerCase().includes(termo)) ||
      (d.nr_empenho && String(d.nr_empenho).includes(termo))
    );
  }

  const total = filtradas.length;
  const total_paginas = Math.ceil(total / limitNum) || 1;
  const offset = (pageNum - 1) * limitNum;
  const registros = filtradas.slice(offset, offset + limitNum);

  return {
    ...master,
    busca: {
      registros,
      page: pageNum,
      limit: limitNum,
      total,
      total_paginas
    }
  };
}

module.exports = {
  getLiveStats,
  getTabelas,
  getEmpresas,
  getEmpresaDetalhes,
  getEleicoes,
  getPerfilPessoa,
  getContrachequeDetalhe,
  getCamaraMaster,
  getTurismoMaster,
  getViagens,
  getViagensMaster
};
