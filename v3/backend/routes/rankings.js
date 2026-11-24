/**
 * ==============================================================================
 * ROTA DA API V3: /api/rankings
 * Rankings oficiais em tempo real via SQLite (Folha, Diárias e Credores)
 * ==============================================================================
 */

const { dbContracheques, dbDespesas, dbDiarias } = require('../db');

function formatCurrency(val) {
  return 'R$ ' + Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleRankings(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const tipo = urlObj.searchParams.get('tipo') || 'salarios'; // 'salarios', 'diarias', 'credores'
    const limit = Math.min(100, Math.max(10, parseInt(urlObj.searchParams.get('limit') || '50', 10)));
    const ano = urlObj.searchParams.get('ano');

    let dados = [];

    if (tipo === 'salarios') {
      if (!dbContracheques) throw new Error('Banco de contracheques indisponível');
      let sql = `
        SELECT nome, cargo, lotacao, ano, mes, total_proventos, salario_liquido, total_descontos
        FROM contracheques
      `;
      let params = [];
      if (ano) {
        sql += ` WHERE ano = ? `;
        params.push(parseInt(ano, 10));
      }
      sql += ` ORDER BY total_proventos DESC LIMIT ? `;
      params.push(limit);

      const rows = dbContracheques.prepare(sql).all(...params);
      dados = rows.map((r, i) => ({
        posicao: i + 1,
        nome: r.nome,
        cargo: r.cargo,
        lotacao: r.lotacao,
        periodo: `${String(r.mes).padStart(2, '0')}/${r.ano}`,
        proventos: r.total_proventos,
        proventosFormatado: formatCurrency(r.total_proventos),
        liquido: r.salario_liquido,
        liquidoFormatado: formatCurrency(r.salario_liquido),
        descontos: r.total_descontos,
        descontosFormatado: formatCurrency(r.total_descontos)
      }));
    } else if (tipo === 'diarias') {
      if (!dbDiarias) throw new Error('Banco de diárias indisponível');
      let sql = `
        SELECT nome, COUNT(*) as qtd, SUM(valor) as total, MAX(ano) as ultimo_ano
        FROM registros
        WHERE nome IS NOT NULL AND valor > 0
      `;
      let params = [];
      if (ano) {
        sql += ` AND ano = ? `;
        params.push(parseInt(ano, 10));
      }
      sql += ` GROUP BY nome ORDER BY total DESC LIMIT ? `;
      params.push(limit);

      const rows = dbDiarias.prepare(sql).all(...params);
      dados = rows.map((r, i) => ({
        posicao: i + 1,
        nome: r.nome,
        cargo: 'Servidor Municipal Beneficiário',
        lotacao: 'Prefeitura de Arinos / MG',
        qtdDiarias: r.qtd,
        total: r.total,
        totalFormatado: formatCurrency(r.total),
        ultimoAno: r.ultimo_ano
      }));
    } else if (tipo === 'credores') {
      if (!dbDespesas) throw new Error('Banco de despesas indisponível');
      let sql = `
        SELECT credor as nome, cpf_cnpj, COUNT(*) as qtd, SUM(valor) as total, MAX(ano) as ultimo_ano
        FROM despesas_estruturadas
        WHERE credor IS NOT NULL AND credor != ''
      `;
      let params = [];
      if (ano) {
        sql += ` AND ano = ? `;
        params.push(parseInt(ano, 10));
      }
      sql += ` GROUP BY credor, cpf_cnpj ORDER BY total DESC LIMIT ? `;
      params.push(limit);

      const rows = dbDespesas.prepare(sql).all(...params);
      dados = rows.map((r, i) => ({
        posicao: i + 1,
        nome: r.nome,
        cpfCnpj: r.cpf_cnpj || 'Não informado',
        qtdEmpenhos: r.qtd,
        total: r.total,
        totalFormatado: formatCurrency(r.total),
        ultimoAno: r.ultimo_ano
      }));
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    });
    res.end(JSON.stringify({
      sucesso: true,
      tipo,
      ano: ano || 'Todos',
      totalRegistros: dados.length,
      dados
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao processar ranking', detalhes: err.message }));
  }
}

module.exports = { handleRankings };
