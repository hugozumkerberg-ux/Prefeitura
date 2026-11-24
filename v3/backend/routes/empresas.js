/**
 * ==============================================================================
 * ROTA DA API V3: /api/empresas
 * Consulta e paginação de fornecedores e credores em tempo real via SQLite
 * ==============================================================================
 */

const { dbDespesas } = require('../db');

function formatCurrency(val) {
  return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleEmpresas(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(urlObj.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const busca = (urlObj.searchParams.get('busca') || '').trim();
    const ano = urlObj.searchParams.get('ano') || '';
    const ordenar = urlObj.searchParams.get('ordenar') || 'valor_desc';
    const detalheCredor = urlObj.searchParams.get('credor');

    if (!dbDespesas) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ erro: 'Banco de despesas não disponível' }));
    }

    // Dossiê individual de um credor
    if (detalheCredor) {
      const empenhos = dbDespesas.prepare(`
        SELECT id, hash, ano, mes, data, valor, nr_empenho, tipo_titulo, credor, cpf_cnpj, 
               projeto_atividade, descricao_natureza, historico
        FROM despesas_estruturadas
        WHERE credor = ? OR cpf_cnpj = ?
        ORDER BY ano DESC, mes DESC, id DESC
        LIMIT 100
      `).all(detalheCredor, detalheCredor);

      const resumo = dbDespesas.prepare(`
        SELECT COUNT(*) as qtd_empenhos, SUM(valor) as total_valor, MIN(ano) as primeiro_ano, MAX(ano) as ultimo_ano
        FROM despesas_estruturadas
        WHERE credor = ? OR cpf_cnpj = ?
      `).get(detalheCredor, detalheCredor);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        sucesso: true,
        credor: detalheCredor,
        resumo: {
          qtdEmpenhos: resumo ? resumo.qtd_empenhos : 0,
          totalValor: resumo ? resumo.total_valor : 0,
          totalFormatado: formatCurrency(resumo ? resumo.total_valor : 0),
          periodo: `${resumo ? resumo.primeiro_ano : '—'} a ${resumo ? resumo.ultimo_ano : '—'}`
        },
        empenhos
      }));
    }

    // KPIs Gerais
    const kpiRow = dbDespesas.prepare(`
      SELECT COUNT(DISTINCT credor) as total_credores, COUNT(*) as total_empenhos, SUM(valor) as valor_total
      FROM despesas_estruturadas
      WHERE credor IS NOT NULL AND credor != ''
    `).get();

    // Filtros
    let whereClauses = ["credor IS NOT NULL AND credor != ''"];
    let params = [];

    if (busca) {
      whereClauses.push("(credor LIKE ? OR cpf_cnpj LIKE ? OR projeto_atividade LIKE ?)");
      const term = `%${busca}%`;
      params.push(term, term, term);
    }

    if (ano) {
      whereClauses.push("ano = ?");
      params.push(parseInt(ano, 10));
    }

    const whereSql = whereClauses.join(' AND ');

    // Ordenação
    let orderSql = 'ORDER BY total_valor DESC';
    if (ordenar === 'valor_asc') orderSql = 'ORDER BY total_valor ASC';
    if (ordenar === 'empenhos_desc') orderSql = 'ORDER BY qtd_empenhos DESC';
    if (ordenar === 'nome_asc') orderSql = 'ORDER BY credor ASC';

    // Contagem de credores únicos para paginação
    const countSql = `
      SELECT COUNT(*) as total
      FROM (
        SELECT credor
        FROM despesas_estruturadas
        WHERE ${whereSql}
        GROUP BY credor, cpf_cnpj
      )
    `;
    const totalRow = dbDespesas.prepare(countSql).get(...params);
    const totalRegistros = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(totalRegistros / limit) || 1;

    // Busca paginada
    const dataSql = `
      SELECT credor, cpf_cnpj, 
             COUNT(*) as qtd_empenhos, 
             SUM(valor) as total_valor,
             MAX(ano) as ultimo_ano,
             GROUP_CONCAT(DISTINCT descricao_natureza) as principais_servicos
      FROM despesas_estruturadas
      WHERE ${whereSql}
      GROUP BY credor, cpf_cnpj
      ${orderSql}
      LIMIT ? OFFSET ?
    `;

    const rows = dbDespesas.prepare(dataSql).all(...params, limit, offset);

    const empresas = rows.map(r => ({
      credor: r.credor,
      cpfCnpj: r.cpf_cnpj || 'Não informado',
      qtdEmpenhos: r.qtd_empenhos,
      totalValor: r.total_valor,
      totalFormatado: formatCurrency(r.total_valor),
      ultimoAno: r.ultimo_ano,
      servicos: r.principais_servicos ? r.principais_servicos.split(',').slice(0, 3).join(' • ') : 'Serviços Diversos'
    }));

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    });

    res.end(JSON.stringify({
      sucesso: true,
      kpis: {
        totalCredores: kpiRow ? kpiRow.total_credores : 0,
        totalEmpenhos: kpiRow ? kpiRow.total_empenhos : 0,
        valorTotal: kpiRow ? kpiRow.valor_total : 0,
        valorTotalFormatado: formatCurrency(kpiRow ? kpiRow.valor_total : 0)
      },
      paginacao: {
        page,
        limit,
        totalRegistros,
        totalPages
      },
      empresas
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao buscar empresas', detalhes: err.message }));
  }
}

module.exports = { handleEmpresas };
