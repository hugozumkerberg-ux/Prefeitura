/**
 * ==============================================================================
 * ROTA DA API V3: /api/eleicoes
 * Base oficial completa do TSE (Arinos / MG - Código 40894)
 * Candidatos, Bens Declarados, Teto de Gastos e Resultados
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const POSSIBLE_PATHS = [
  path.resolve(__dirname, '../../../dados_tse_completos_arinos.json'),
  path.resolve(__dirname, '../../dados_tse_completos_arinos.json'),
  path.resolve(__dirname, '../dados_tse_completos_arinos.json'),
  path.resolve(process.cwd(), 'dados_tse_completos_arinos.json'),
  path.resolve(process.cwd(), '../dados_tse_completos_arinos.json')
];
const FILE_PATH = POSSIBLE_PATHS.find(p => fs.existsSync(p)) || POSSIBLE_PATHS[0];

function handleEleicoes(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const ano = urlObj.searchParams.get('ano');

    if (!fs.existsSync(FILE_PATH)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ erro: 'Base do TSE ainda não gerada.' }));
    }

    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    let lista = JSON.parse(raw);

    if (ano) {
      lista = lista.filter(item => String(item.anoEleicao) === String(ano));
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify({
      sucesso: true,
      municipio: 'Arinos / MG',
      codigoTSE: '40894',
      totalCandidatos: lista.length,
      dados: lista
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao ler dados do TSE', detalhes: err.message }));
  }
}

module.exports = { handleEleicoes };
