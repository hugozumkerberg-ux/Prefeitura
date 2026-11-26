/**
 * ==============================================================================
 * ROTA DA API V3: /api/vereadores
 * Dados oficiais da Câmara Municipal de Arinos / MG (SAPL)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.resolve(__dirname, '../../../portal_transparencia_arinos/dados/camara/arinos_camara_master.json');

function handleVereadores(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const busca = (urlObj.searchParams.get('busca') || '').toLowerCase().trim();
    const apenasAtivos = urlObj.searchParams.get('ativos') === 'true';
    const id = urlObj.searchParams.get('id');

    if (!fs.existsSync(FILE_PATH)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ erro: 'Arquivo de dados da Câmara não encontrado.' }));
    }

    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const todos = JSON.parse(raw);

    // Perfil de um parlamentar específico
    if (id) {
      const p = todos.find(item => String(item.id) === String(id));
      if (!p) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ erro: 'Parlamentar não encontrado.' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ sucesso: true, parlamentar: p }));
    }

    let filtrados = todos;

    if (apenasAtivos) {
      filtrados = filtrados.filter(p => p.ativo === true);
    }

    if (busca) {
      filtrados = filtrados.filter(p => 
        (p.nome_parlamentar && p.nome_parlamentar.toLowerCase().includes(busca)) ||
        (p.nome_completo && p.nome_completo.toLowerCase().includes(busca))
      );
    }

    // Resumo leve para listagem
    const lista = filtrados.map(p => ({
      id: p.id,
      nomeParlamentar: p.nome_parlamentar,
      nomeCompleto: p.nome_completo,
      ativo: p.ativo,
      totalMaterias: p.total_materias || 0,
      projetosLei: p.projetos_lei || 0,
      fotografia: p.fotografia || null,
      topTemas: p.top_temas || [],
      cargosMesa: p.cargos_mesa || [],
      mandatos: p.mandatos || []
    }));

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    });
    res.end(JSON.stringify({
      sucesso: true,
      total: lista.length,
      vereadores: lista
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha ao buscar dados da Câmara', detalhes: err.message }));
  }
}

module.exports = { handleVereadores };
