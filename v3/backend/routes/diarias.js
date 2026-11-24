/**
 * Rota Oficial de Diárias (Prefeitura de Arinos)
 * Base Consolidada de 41.959 concessões e deslocamentos com suporte a busca pericial por nome,
 * destino da viagem, histórico de viagem, secretaria e identificação por Hash SHA-256.
 */
const { dbDiarias } = require('../db');
const { parsePeriodoFilter } = require('../utils/filtro_periodo');

function extrairDestinoSimples(historico) {
  if (!historico) return 'Arinos e Região';
  const m = historico.match(/\b(?:A|AO|PARA)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{2,25}\/(?:MG|DF|SP|GO|BA|RJ|ES|TO|MS|MT|PR|SC|RS|CE|PE|MA|PA|AM|PI|RN|PB|AL|SE|RO|AC|AP|RR))\b/i);
  if (m && m[1]) {
    const d = m[1].trim().replace(/\s+/g, ' ');
    if (!/VIAGEM|DESPESAS|LIBERACAO/i.test(d)) return d;
  }
  return 'Arinos / Destino Oficial';
}

function extrairPeriodoSimples(historico) {
  if (!historico) return 'Conforme empenho';
  const m = historico.match(/(?:DIA|DIAS|PER[IÍ]ODO)\s+([^,–-]+?)(?:,|-|\bLEVAR\b|\bPARTICIPAR\b|\bEM\b|\bPARA\b|\bCONFORME\b|$)/i);
  return m && m[1] ? m[1].trim().replace(/\s+/g, ' ') : 'Conforme empenho';
}

function handleDiarias(req, res, query) {
  if (!dbDiarias) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Banco de dados de diárias indisponível.' }));
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { ano, mandato, anoInicio, anoFim, temFiltroAno } = parsePeriodoFilter(query);
  const mes = query.mes ? parseInt(query.mes, 10) : null;
  const busca = (query.busca || '').trim();

  // Apenas concessões com valor financeiro efetivo (> 0)
  const whereClauses = ['(valor > 0 AND valor IS NOT NULL)'];
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
    if (/^[a-fA-F0-9]{64}$/.test(busca)) {
      whereClauses.push('chave = @buscaExact');
      params.buscaExact = busca.toLowerCase();
    } else {
      whereClauses.push('(nome LIKE @busca OR historico_viagem LIKE @busca OR secretaria_atividade LIKE @busca OR nrempenho LIKE @busca)');
      params.busca = `%${busca.toUpperCase()}%`;
    }
  }

  const whereSql = whereClauses.join(' AND ');

  try {
    const countStmt = dbDiarias.prepare(`SELECT COUNT(*) AS total FROM diarias_consolidadas WHERE ${whereSql}`);
    const { total } = countStmt.get(params);

    const dataStmt = dbDiarias.prepare(`
      SELECT chave, ano, mes, tipo, nrempenho, dtempenho, nome, cpf, valor, dotacao,
             secretaria_atividade, natureza, descricao_natureza, historico_viagem, coletado_em
      FROM diarias_consolidadas
      WHERE ${whereSql}
      ORDER BY ano DESC, mes DESC, valor DESC
      LIMIT @limit OFFSET @offset
    `);

    const rows = dataStmt.all({ ...params, limit, offset });
    
    // Anexa destino e período calculados
    const rowsFormatadas = rows.map(r => ({
      ...r,
      destino_extraido: extrairDestinoSimples(r.historico_viagem),
      periodo_extraido: extrairPeriodoSimples(r.historico_viagem)
    }));

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
      dados: rowsFormatadas
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao consultar diárias.', detalhes: err.message }));
  }
}

module.exports = { handleDiarias };
