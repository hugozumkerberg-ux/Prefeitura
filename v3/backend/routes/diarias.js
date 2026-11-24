/**
 * Rota Oficial de Diárias (Prefeitura de Arinos)
 * Paginação server-side com suporte a busca por nome
 */
const { dbDiarias } = require('../db');

function handleDiarias(req, res, query) {
  if (!dbDiarias) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Banco de dados de diárias indisponível.' }));
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const ano = query.ano ? parseInt(query.ano, 10) : null;
  const mes = query.mes ? parseInt(query.mes, 10) : null;
  const busca = (query.busca || '').trim().toUpperCase();

  const whereClauses = ['1=1'];
  const params = {};

  if (ano) {
    whereClauses.push('ano = @ano');
    params.ano = ano;
  }
  if (mes) {
    whereClauses.push('mes = @mes');
    params.mes = mes;
  }
  if (busca) {
    whereClauses.push('(nome LIKE @busca OR fonte LIKE @busca)');
    params.busca = `%${busca}%`;
  }

  const whereSql = whereClauses.join(' AND ');

  try {
    const countStmt = dbDiarias.prepare(`SELECT COUNT(*) AS total FROM registros WHERE ${whereSql}`);
    const { total } = countStmt.get(params);

    const dataStmt = dbDiarias.prepare(`
      SELECT chave, ano, mes, tipo, nome, valor, fonte, coletado_em
      FROM registros
      WHERE ${whereSql}
      ORDER BY ano DESC, mes DESC, valor DESC
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
        temProxima: page < totalPages
      },
      dados: rows
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao consultar diárias.', detalhes: err.message }));
  }
}

module.exports = { handleDiarias };
