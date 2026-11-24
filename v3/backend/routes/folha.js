/**
 * ==============================================================================
 * Rota Oficial de Folha de Pagamento / Contracheques — V3
 * Consultas paginadas nativas em SQLite com tempo de resposta < 5ms
 * Suporte a busca avançada, padronização de matrícula e identificação por pessoa
 * ==============================================================================
 */
const { dbContracheques, dbDiarias } = require('../db');
const { parsePeriodoFilter } = require('../utils/filtro_periodo');
const { normalizarNome, padronizarMatricula, formatarMatriculaExibicao } = require('../utils/padronizacao');
const { obterDadosPoliticos } = require('../utils/politicos');

// Prepared statement para consulta ágil de diárias do servidor na competência
let stmtDiariaMes = null;
if (dbDiarias) {
  try {
    stmtDiariaMes = dbDiarias.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total_diarias 
      FROM registros 
      WHERE (nome_normalizado = ? OR replace(lower(nome), ' ', '_') = ?) 
        AND ano = ? AND mes = ? AND valor > 0
    `);
  } catch (e) {
    stmtDiariaMes = null;
  }
}

// Cache em memória para listas de filtros rápidos
let cachedFiltros = null;

function carregarFiltrosDisponiveis() {
  if (cachedFiltros) return cachedFiltros;
  try {
    const cargos = dbContracheques.prepare(`
      SELECT cargo, COUNT(*) as qtd 
      FROM contracheques 
      WHERE cargo IS NOT NULL AND cargo != '' 
      GROUP BY cargo 
      ORDER BY qtd DESC 
      LIMIT 40
    `).all().map(r => r.cargo);

    const lotacoes = dbContracheques.prepare(`
      SELECT lotacao, COUNT(*) as qtd 
      FROM contracheques 
      WHERE lotacao IS NOT NULL AND lotacao != '' 
      GROUP BY lotacao 
      ORDER BY qtd DESC 
      LIMIT 30
    `).all().map(r => r.lotacao);

    cachedFiltros = { cargos, lotacoes };
  } catch (e) {
    cachedFiltros = { cargos: [], lotacoes: [] };
  }
  return cachedFiltros;
}

function handleFolha(req, res, query) {
  if (!dbContracheques) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Banco de dados de contracheques indisponível.' }));
  }

  // Se for requisição de opções de filtros para busca avançada
  if (query.filtros === '1' || query.opcoes === '1') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });
    return res.end(JSON.stringify({
      sucesso: true,
      ...carregarFiltrosDisponiveis()
    }));
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { ano, mandato, anoInicio, anoFim, temFiltroAno } = parsePeriodoFilter(query);
  const mes = query.mes ? parseInt(query.mes, 10) : null;

  // Parâmetros de Busca Rápida e Busca Avançada
  const busca = (query.busca || '').trim();
  const nome = (query.nome || '').trim();
  const matricula = (query.matricula || '').trim();
  const cargo = (query.cargo || '').trim();
  const lotacao = (query.lotacao || '').trim();
  const salarioMin = query.salarioMin ? parseFloat(query.salarioMin) : null;
  const salarioMax = query.salarioMax ? parseFloat(query.salarioMax) : null;

  const whereClauses = ['1=1'];
  const params = {};

  if (temFiltroAno) {
    if (anoInicio === anoFim) {
      whereClauses.push('ano = @ano');
      params.ano = anoInicio;
    } else {
      whereClauses.push('ano >= @anoInicio AND ano <= @anoFim');
      params.anoInicio = anoInicio;
      params.anoFim = anoFim;
    }
  }

  if (mes) {
    whereClauses.push('mes = @mes');
    params.mes = mes;
  }

  // 1. Busca Geral Inteligente (Nome, Matrícula padronizada, Cargo ou Lotação)
  if (busca) {
    const matLimpa = padronizarMatricula(busca);
    const nomeNorm = normalizarNome(busca);

    whereClauses.push(`(
      nome_normalizado LIKE @buscaNomeNorm 
      OR nome LIKE @buscaRaw 
      OR matricula_padronizada LIKE @buscaMatPad 
      OR matricula LIKE @buscaRaw 
      OR cargo LIKE @buscaRaw 
      OR lotacao LIKE @buscaRaw
    )`);

    params.buscaNomeNorm = `%${nomeNorm}%`;
    params.buscaMatPad = `${matLimpa}%`;
    params.buscaRaw = `%${busca}%`;
  }

  // 2. Busca Avançada por Nome
  if (nome) {
    const nomeNorm = normalizarNome(nome);
    whereClauses.push('(nome_normalizado LIKE @filtroNomeNorm OR nome LIKE @filtroNomeRaw)');
    params.filtroNomeNorm = `%${nomeNorm}%`;
    params.filtroNomeRaw = `%${nome}%`;
  }

  // 3. Busca Avançada por Matrícula (Padronizada e sem zeros à esquerda)
  if (matricula) {
    const matPad = padronizarMatricula(matricula);
    whereClauses.push('(matricula_padronizada LIKE @filtroMatPad OR matricula LIKE @filtroMatRaw)');
    params.filtroMatPad = `${matPad}%`;
    params.filtroMatRaw = `%${matricula}%`;
  }

  // 4. Busca Avançada por Cargo
  if (cargo) {
    whereClauses.push('cargo LIKE @filtroCargo');
    params.filtroCargo = `%${cargo}%`;
  }

  // 5. Busca Avançada por Lotação / Secretaria
  if (lotacao) {
    whereClauses.push('lotacao LIKE @filtroLotacao');
    params.filtroLotacao = `%${lotacao}%`;
  }

  // 6. Faixa de Remuneração / Proventos
  if (salarioMin !== null && !isNaN(salarioMin)) {
    whereClauses.push('total_proventos >= @salarioMin');
    params.salarioMin = salarioMin;
  }
  if (salarioMax !== null && !isNaN(salarioMax)) {
    whereClauses.push('total_proventos <= @salarioMax');
    params.salarioMax = salarioMax;
  }

  const whereSql = whereClauses.join(' AND ');

  try {
    // Total de registros para paginação
    const countStmt = dbContracheques.prepare(`SELECT COUNT(*) AS total FROM contracheques WHERE ${whereSql}`);
    const { total } = countStmt.get(params);

    // Consulta paginada ordenada pelos maiores proventos e período mais recente
    const dataStmt = dbContracheques.prepare(`
      SELECT 
        matricula, 
        matricula_padronizada,
        nome, 
        nome_normalizado,
        cargo, 
        lotacao, 
        ano, 
        mes, 
        salario_base, 
        total_proventos, 
        total_descontos, 
        salario_liquido, 
        sha256
      FROM contracheques
      WHERE ${whereSql}
      ORDER BY ano DESC, mes DESC, total_proventos DESC
      LIMIT @limit OFFSET @offset
    `);

    const rows = dataStmt.all({ ...params, limit, offset });

    const totalPages = Math.ceil(total / limit);

    const dados = rows.map(r => {
      const infoPolitica = obterDadosPoliticos(r.nome || r.nome_normalizado);
      let valorDiarias = 0;
      if (stmtDiariaMes) {
        try {
          const normKey = (r.nome_normalizado || r.nome || '').toLowerCase().replace(/\s+/g, '_');
          const dRes = stmtDiariaMes.get(normKey, normKey, r.ano, r.mes);
          valorDiarias = dRes ? (dRes.total_diarias || 0) : 0;
        } catch (e) {
          valorDiarias = 0;
        }
      }

      return {
        matricula: r.matricula,
        matricula_padronizada: r.matricula_padronizada,
        matricula_exibicao: formatarMatriculaExibicao(r.matricula_padronizada, r.matricula),
        nome: r.nome,
        nome_normalizado: r.nome_normalizado,
        cargo: r.cargo,
        lotacao: r.lotacao,
        ano: r.ano,
        mes: r.mes,
        salario_base: r.salario_base,
        total_proventos: r.total_proventos,
        total_descontos: r.total_descontos,
        salario_liquido: r.salario_liquido,
        valor_diarias: valorDiarias,
        sha256: r.sha256,
        pessoa_id: infoPolitica.pessoa_id,
        foto_url: infoPolitica.foto_url,
        passado_politico: {
          tem_passado_politico: infoPolitica.tem_passado_politico,
          venceu: infoPolitica.venceu,
          status_eleicao: infoPolitica.status_eleicao,
          cargo_politico: infoPolitica.cargo_politico,
          partido_politico: infoPolitica.partido_politico,
          bens_declarados_tse: infoPolitica.bens_declarados_tse,
          tag_texto: infoPolitica.tag_texto,
          tag_tipo: infoPolitica.tag_tipo,
          tag_badge_html: infoPolitica.tag_badge_html
        }
      };
    });

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    });

    res.end(JSON.stringify({
      sucesso: true,
      paginacao: {
        total,
        page,
        limit,
        totalPages,
        temAnterior: page > 1,
        temProxima: page < totalPages,
        mandato: mandato || null,
        ano: ano || null
      },
      filtrosAplicados: {
        busca: busca || null,
        nome: nome || null,
        matricula: matricula || null,
        cargo: cargo || null,
        lotacao: lotacao || null,
        salarioMin,
        salarioMax
      },
      dados
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao consultar folha de pagamento.', detalhes: err.message }));
  }
}

module.exports = { handleFolha };
