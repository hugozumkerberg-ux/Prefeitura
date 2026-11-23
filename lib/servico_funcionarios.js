/**
 * ==============================================================================
 * SERVIÇO DE FUNCIONÁRIOS E SERVIDORES PÚBLICOS — ARINOS / MG
 * Regras de negócio, busca semântica, enriquecimento pericial e consultas <10ms
 * ==============================================================================
 */

const { getMasterDb, getDetalhadoDb } = require('./db');
const { normalizarTexto, ehBuscaGenericaFuncionarios } = require('./normalizador');
const { calcularDescontosEstatutarios, formatarMascaraAnoMeses } = require('./calculos_folha');

/**
 * Consulta e lista os funcionários/servidores com suporte semântico e paginação
 * @param {object} params Filtros de busca, tipo, ordenação e paginação
 * @returns {object} { paginacao, estatisticas, registros }
 */
function listarFuncionarios({ busca = '', tipo = 'todos', ordenar = 'dinheiro', page = 1, limit = 25 }) {
  const db = getMasterDb();
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  // 1. Tratamento Semântico da Busca (Funcionários, Servidores, Nomes, Cargos)
  const buscaLimpa = (busca || '').trim();
  const buscaNorm = normalizarTexto(buscaLimpa);

  if (buscaLimpa) {
    if (ehBuscaGenericaFuncionarios(buscaLimpa)) {
      // Usuário pesquisou genericamente "funcionários", "servidores", "quadro":
      // Filtra os servidores públicos municipais sem falhar com zero registros!
      whereClauses.push("perfil_tipo LIKE '%Servidor%'");
    } else {
      // Busca específica por nome, cargo, matrícula ou partido
      whereClauses.push(`(
        nome_exibicao LIKE ? OR 
        nome_canonic LIKE ? OR 
        cargos_resumo LIKE ? OR 
        matriculas_json LIKE ? OR 
        partido_politico LIKE ? OR 
        destinos_frequentes LIKE ?
      )`);
      const pWild = `%${buscaLimpa}%`;
      const pNormWild = `%${buscaNorm}%`;
      params.push(pWild, pNormWild, pWild, pWild, pWild, pWild);
    }
  }

  // 2. Filtro por Tipo de Perfil Institucional
  if (tipo === 'prefeitos') {
    whereClauses.push('is_prefeito = 1');
  } else if (tipo === 'vereadores') {
    whereClauses.push('is_vereador = 1');
  } else if (tipo === 'politicos') {
    whereClauses.push('is_politico = 1');
  } else if (tipo === 'politicos_socios') {
    whereClauses.push('is_politico = 1 AND is_socio_empresa = 1');
  } else if (tipo === 'multi_matricula') {
    whereClauses.push('qtd_matriculas > 1');
  } else if (tipo === 'socios') {
    whereClauses.push('is_socio_empresa = 1');
  } else if (tipo === 'servidores' || tipo === 'funcionarios') {
    whereClauses.push("perfil_tipo LIKE '%Servidor%'");
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 3. Ordenação Estratégica
  let orderSQL = 'ORDER BY total_dinheiro_publico DESC';
  if (ordenar === 'salario') orderSQL = 'ORDER BY total_salarios DESC';
  else if (ordenar === 'diarias') orderSQL = 'ORDER BY total_diarias DESC';
  else if (ordenar === 'matriculas') orderSQL = 'ORDER BY qtd_matriculas DESC';
  else if (ordenar === 'nome') orderSQL = 'ORDER BY nome_exibicao ASC';

  // 4. Contagem e Totalizadores da Consulta
  const countSQL = `
    SELECT 
      count(*) as total,
      sum(total_dinheiro_publico) as total_dinheiro,
      sum(total_salarios) as total_salarios,
      sum(total_diarias) as total_diarias,
      sum(qtd_contracheques) as total_folhas
    FROM pessoas_unificadas
    ${whereSQL}
  `;
  const countRes = db.prepare(countSQL).get(...params) || {};
  const total = countRes.total || 0;

  // 5. Busca dos Registros Paginados
  const querySQL = `
    SELECT 
      id,
      nome_canonic,
      nome_exibicao,
      perfil_tipo,
      cargos_resumo,
      cargos_json,
      qtd_matriculas,
      matriculas_json,
      total_salarios,
      qtd_contracheques,
      ano_primeiro_salario,
      ano_ultimo_salario,
      total_diarias,
      qtd_diarias,
      destinos_frequentes,
      total_dinheiro_publico,
      is_politico,
      is_prefeito,
      is_vereador,
      is_socio_empresa,
      empresas_vinculadas,
      partido_politico,
      foto_url,
      foto_id
    FROM pessoas_unificadas
    ${whereSQL}
    ${orderSQL}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const rows = db.prepare(querySQL).all(...params);

  // 6. Enriquecer Registros com Cálculos Reutilizáveis
  const registros = rows.map(r => {
    let mats = [];
    try { mats = JSON.parse(r.matriculas_json || '[]'); } catch(e) {}
    let cargos = [];
    try { cargos = JSON.parse(r.cargos_json || '[]'); } catch(e) {}
    let empresas = [];
    try { empresas = JSON.parse(r.empresas_vinculadas || '[]'); } catch(e) {}

    const tempoExtenso = formatarMascaraAnoMeses(r.qtd_contracheques || 0);
    const liquidoEst = (r.total_salarios || 0) * 0.78; // Estimativa média líquida após deduções legais

    return {
      ...r,
      matriculas: mats,
      cargos,
      empresas_vinculadas: empresas,
      tempo_efetivo_extenso: tempoExtenso,
      salario_liquido_estimado: Math.round(liquidoEst * 100) / 100
    };
  });

  return {
    paginacao: {
      page,
      limit,
      total_filtrado: total,
      total_paginas: Math.ceil(total / limit) || 1
    },
    estatisticas: {
      total_dinheiro_publico: countRes.total_dinheiro || 0,
      total_salarios: countRes.total_salarios || 0,
      total_diarias: countRes.total_diarias || 0,
      total_folhas: countRes.total_folhas || 0
    },
    registros
  };
}

/**
 * Consulta e lista contracheques com alta performance, paginação e cálculos de salário
 * @param {object} params Filtros de q, ano, mes, entidade, page, limit
 * @returns {object} { page, limit, total, total_paginas, soma_filtrada, registros }
 */
function listarContracheques({ q = '', ano = '', mes = '', entidade = '', page = 1, limit = 25 }) {
  const db = getMasterDb();
  const dbDet = getDetalhadoDb();
  const offset = (page - 1) * limit;

  let whereClauses = ['1=1'];
  const params = [];

  const qLimpo = (q || '').trim();
  if (qLimpo) {
    if (ehBuscaGenericaFuncionarios(qLimpo)) {
      // Busca genérica por "funcionarios" ou "servidores": não filtra nada por nome, exibe a folha normalmente!
    } else {
      whereClauses.push('(nome LIKE ? OR cargo LIKE ? OR matricula LIKE ?)');
      params.push(`%${qLimpo}%`, `%${qLimpo}%`, `%${qLimpo}%`);
    }
  }

  if (ano) {
    whereClauses.push('ano = ?');
    params.push(parseInt(ano, 10));
  }
  if (mes) {
    whereClauses.push('mes = ?');
    params.push(parseInt(mes, 10));
  }
  if (entidade) {
    whereClauses.push('entidade LIKE ?');
    params.push(`%${entidade}%`);
  }

  const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

  // Contagem
  const countSQL = `SELECT count(*) as total, sum(total_proventos) as soma_filtrada FROM contracheques ${whereSQL}`;
  const totalInfo = db.prepare(countSQL).get(...params) || { total: 0, soma_filtrada: 0 };
  const total = totalInfo.total || 0;

  // Busca paginada
  const dataSQL = `
    SELECT id, entidade, ano, mes, matricula, nome, cargo, vinculo, tipo_folha, total_proventos, total_descontos, salario_liquido, idfun, url_detalhe
    FROM contracheques
    ${whereSQL}
    ORDER BY ano DESC, mes DESC, total_proventos DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const rows = db.prepare(dataSQL).all(...params);

  // Enriquecimento com conexão singleton persistente (sem abrir novo arquivo a cada requisição)
  const registros = rows.map(r => {
    let descontoReal = r.total_descontos || 0;
    let liquidoReal = r.salario_liquido || 0;

    if (dbDet && (!descontoReal || descontoReal === 0)) {
      let rowD = null;
      if (r.idfun) {
        try {
          rowD = dbDet.prepare('SELECT total_descontos, salario_liquido FROM contracheques WHERE ano = ? AND mes = ? AND idfun = ? LIMIT 1').get(r.ano, r.mes, String(r.idfun));
        } catch(e) {}
      }
      if (!rowD && r.nome) {
        try {
          rowD = dbDet.prepare('SELECT total_descontos, salario_liquido FROM contracheques WHERE ano = ? AND mes = ? AND nome = ? LIMIT 1').get(r.ano, r.mes, r.nome);
        } catch(e) {}
      }
      if (rowD && rowD.total_descontos > 0) {
        descontoReal = rowD.total_descontos;
        liquidoReal = rowD.salario_liquido;
      }
    }

    if (!descontoReal || descontoReal === 0) {
      const calc = calcularDescontosEstatutarios(r.total_proventos, r.ano);
      descontoReal = calc.total_descontos;
      liquidoReal = calc.salario_liquido;
    }

    return {
      ...r,
      total_descontos: Math.round(descontoReal * 100) / 100,
      salario_liquido: Math.round(liquidoReal * 100) / 100
    };
  });

  return {
    page,
    limit,
    total,
    total_paginas: Math.ceil(total / limit) || 1,
    soma_filtrada: totalInfo.soma_filtrada || 0,
    registros
  };
}

module.exports = {
  listarFuncionarios,
  listarContracheques
};
