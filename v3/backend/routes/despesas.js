/**
 * Rota Oficial de Despesas Públicas (SIAP Estruturado)
 * Traz credor, valor, data, histórico e hash
 */
const { dbDespesas } = require('../db');

function handleDespesas(req, res, query) {
  if (!dbDespesas) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Banco de dados de despesas indisponível.' }));
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const ano = query.ano ? parseInt(query.ano, 10) : null;
  const busca = (query.busca || '').trim().toUpperCase();

  const whereClauses = ['1=1'];
  const params = {};

  if (ano) {
    whereClauses.push('ano = @ano');
    params.ano = ano;
  }
  if (busca) {
    whereClauses.push('(credor LIKE @busca OR historico LIKE @busca OR descricao_natureza LIKE @busca)');
    params.busca = `%${busca}%`;
  }

  const whereSql = whereClauses.join(' AND ');

  try {
    const countStmt = dbDespesas.prepare(`SELECT COUNT(*) AS total FROM despesas_estruturadas WHERE ${whereSql}`);
    const { total } = countStmt.get(params);

    const dataStmt = dbDespesas.prepare(`
      SELECT 
        id,
        hash, 
        ano, 
        mes, 
        data, 
        credor, 
        cpf_cnpj, 
        valor, 
        descricao_natureza, 
        historico,
        nr_empenho
      FROM despesas_estruturadas
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
    res.end(JSON.stringify({ erro: 'Falha ao consultar despesas.', detalhes: err.message }));
  }
}

module.exports = { handleDespesas };
