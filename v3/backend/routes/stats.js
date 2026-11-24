/**
 * Rota de Métricas e Estatísticas Globais Oficiais
 * Alimenta os cards do topo com números reais do banco de dados (zero dados estáticos)
 */
const { dbContracheques, dbDespesas, dbDiarias } = require('../db');

function handleStats(req, res) {
  let totalContracheques = 0;
  let periodoFolha = { min: 2013, max: 2026 };
  let totalDespesas = 0;
  let totalDiarias = 0;

  try {
    if (dbContracheques) {
      const rowCount = dbContracheques.prepare('SELECT COUNT(*) AS total FROM contracheques').get();
      totalContracheques = rowCount ? rowCount.total : 0;

      const rowPeriodo = dbContracheques.prepare('SELECT MIN(ano) AS minAno, MAX(ano) AS maxAno FROM contracheques').get();
      if (rowPeriodo) {
        periodoFolha = { min: rowPeriodo.minAno, max: rowPeriodo.maxAno };
      }
    }

    if (dbDespesas) {
      const rowDespesas = dbDespesas.prepare('SELECT COUNT(*) AS total FROM despesas').get();
      totalDespesas = rowDespesas ? rowDespesas.total : 0;
    }

    if (dbDiarias) {
      const rowDiarias = dbDiarias.prepare('SELECT COUNT(*) AS total FROM registros').get();
      totalDiarias = rowDiarias ? rowDiarias.total : 0;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify({
      sucesso: true,
      stats: {
        totalContracheques,
        periodoFolha,
        totalDespesas,
        totalDiarias,
        fonteOficial: 'ADPMNET / SIAP Oficial Arinos-MG'
      }
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao buscar estatísticas.', detalhes: err.message }));
  }
}

module.exports = { handleStats };
