/**
 * Rota Oficial de Folha de Pagamento / Contracheques
 * Consultas paginadas nativas em SQLite com tempo de resposta < 5ms
 */
const { dbContracheques } = require('../db');
const { parsePeriodoFilter } = require('../utils/filtro_periodo');

function handleFolha(req, res, query) {
  if (!dbContracheques) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Banco de dados de contracheques indisponível.' }));
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { ano, mandato, anoInicio, anoFim, temFiltroAno } = parsePeriodoFilter(query);
  const mes = query.mes ? parseInt(query.mes, 10) : null;
  const busca = (query.busca || '').trim().toUpperCase();

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
  if (busca) {
    whereClauses.push('(nome LIKE @busca OR cargo LIKE @busca)');
    params.busca = `%${busca}%`;
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
        nome, 
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
      dados: rows
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao consultar folha de pagamento.', detalhes: err.message }));
  }
}

module.exports = { handleFolha };
