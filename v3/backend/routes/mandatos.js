/**
 * ==============================================================================
 * ROTA DA API V3: /api/mandatos
 * Agregação dinâmica em SQLite por período de mandato (Zero valores estáticos)
 * ==============================================================================
 */

const { dbContracheques, dbDespesas, dbDiarias } = require('../db');

function formatCurrency(val) {
  if (val >= 1e6) {
    return 'R$ ' + (val / 1e6).toFixed(2).replace('.', ',') + ' Mi';
  }
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleMandatos(req, res) {
  try {
    const periodos = [
      { chave: '2025-2028', anos: [2025, 2026, 2027, 2028], legislatura: '16ª Legislatura', anoEleicao: 2024 },
      { chave: '2021-2024', anos: [2021, 2022, 2023, 2024], legislatura: '15ª Legislatura', anoEleicao: 2020 },
      { chave: '2017-2020', anos: [2017, 2018, 2019, 2020], legislatura: '14ª Legislatura', anoEleicao: 2016 },
      { chave: '2013-2016', anos: [2013, 2014, 2015, 2016], legislatura: '13ª Legislatura', anoEleicao: 2012 }
    ];

    const mandatos = {};

    periodos.forEach(p => {
      const placeholders = p.anos.map(() => '?').join(',');

      // 1. Folha
      let folhaQtd = 0;
      let folhaTotal = 0;
      if (dbContracheques) {
        const row = dbContracheques.prepare(
          `SELECT COUNT(*) as qtd, SUM(total_proventos) as total FROM contracheques WHERE ano IN (${placeholders})`
        ).get(...p.anos);
        if (row) {
          folhaQtd = row.qtd || 0;
          folhaTotal = row.total || 0;
        }
      }

      // 2. Diárias
      let diariasQtd = 0;
      let diariasTotal = 0;
      if (dbDiarias) {
        const row = dbDiarias.prepare(
          `SELECT COUNT(*) as qtd, SUM(valor) as total FROM registros WHERE ano IN (${placeholders})`
        ).get(...p.anos);
        if (row) {
          diariasQtd = row.qtd || 0;
          diariasTotal = row.total || 0;
        }
      }

      // 3. Despesas (SIAP)
      let despesasQtd = 0;
      if (dbDespesas) {
        const row = dbDespesas.prepare(
          `SELECT COUNT(*) as qtd FROM despesas WHERE ano IN (${placeholders})`
        ).get(...p.anos);
        if (row) {
          despesasQtd = row.qtd || 0;
        }
      }

      mandatos[p.chave] = {
        chave: p.chave,
        legislatura: p.legislatura,
        periodo: p.chave.replace('-', '–'),
        anoEleicao: p.anoEleicao,
        financeiro: {
          folhaVolume: formatCurrency(folhaTotal),
          folhaTotalNum: folhaTotal,
          folhaQtd: folhaQtd.toLocaleString('pt-BR') + ' pagamentos',
          folhaQtdNum: folhaQtd,
          diariasVolume: formatCurrency(diariasTotal),
          diariasTotalNum: diariasTotal,
          diariasQtd: diariasQtd.toLocaleString('pt-BR') + ' diárias',
          diariasQtdNum: diariasQtd,
          despesasQtd: despesasQtd.toLocaleString('pt-BR') + ' empenhos SIAP',
          fonte: 'SQLite Oficial (contracheques.db + diarias_arinos.sqlite3)'
        }
      };
    });

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120'
    });
    res.end(JSON.stringify({
      sucesso: true,
      geradoEm: new Date().toISOString(),
      mandatos
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao processar mandatos.', detalhes: err.message }));
  }
}

module.exports = { handleMandatos };
