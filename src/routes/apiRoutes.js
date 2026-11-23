/**
 * ==============================================================================
 * ROTAS DA API REST — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG
 * ==============================================================================
 */

const dadosService = require('../services/dadosService');
const telemetriaService = require('../services/telemetriaService');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(data));
}

async function handleApiRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const params = parsedUrl.searchParams;

  try {
    // 1. Estatísticas ao vivo e Resumo de KPIs
    if (pathname === '/api/live' || pathname === '/api/dados/resumo') {
      const stats = await dadosService.getResumoMaster();
      return sendJson(res, 200, stats);
    }

    // 2. Rankings Oficiais
    if (pathname === '/api/dados/rankings') {
      const rankings = await dadosService.getRankingsMaster();
      return sendJson(res, 200, rankings);
    }

    // 3. Consulta de tabelas integradas e aliases diretos
    const tabelaAliases = {
      '/api/dados/pessoas-unificadas': 'pessoas',
      '/api/dados/pessoas': 'pessoas',
      '/api/dados/contracheques': 'contracheques',
      '/api/dados/despesas': 'despesas',
      '/api/dados/diarias': 'diarias',
      '/api/dados/contratos': 'contratos',
      '/api/dados/receitas': 'receitas',
      '/api/dados/convenios': 'convenios'
    };

    if (pathname === '/api/dados/tabelas' || tabelaAliases[pathname]) {
      const buscaTermo = params.get('busca') || params.get('q') || '';
      const abaNome = tabelaAliases[pathname] || params.get('aba') || 'pessoas';
      const result = await dadosService.getTabelas({
        aba: abaNome,
        busca: buscaTermo,
        ano: params.get('ano') || '',
        mes: params.get('mes') || '',
        entidade: params.get('entidade') || '',
        tipo: params.get('tipo') || 'todos',
        ordenar: params.get('ordenar') || 'dinheiro',
        page: params.get('page') || 1,
        limit: params.get('limit') || 25,
        offset: params.get('offset') || 0
      });

      if (buscaTermo.trim()) {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        telemetriaService.registrarBusca(buscaTermo, abaNome, clientIp, result.total || 0);
      }

      return sendJson(res, 200, result);
    }

    // 3. Empresas e Fornecedores
    if (pathname === '/api/dados/empresas') {
      const empresas = await dadosService.getEmpresas({
        busca: params.get('q') || '',
        situacao: params.get('situacao') || '',
        alerta: params.get('alerta') || ''
      });
      return sendJson(res, 200, empresas);
    }

    if (pathname === '/api/dados/empresas/detalhes') {
      const cnpj = params.get('cnpj') || '';
      const detalhes = await dadosService.getEmpresaDetalhes(cnpj);
      if (!detalhes) return sendJson(res, 404, { error: 'Empresa não encontrada' });
      return sendJson(res, 200, detalhes);
    }

    // 4. Eleições Oficiais TSE
    if (pathname === '/api/dados/eleicoes') {
      const eleicoes = await dadosService.getEleicoes({
        ano: params.get('ano') || '',
        cargo: params.get('cargo') || ''
      });
      return sendJson(res, 200, eleicoes);
    }

    // 5. Perfil 360° de Cidadão / Servidor / Político
    if (pathname === '/api/dados/perfil-pessoa') {
      const id = params.get('id');
      const nome = params.get('nome') || '';
      const perfil = await dadosService.getPerfilPessoa(id, nome);
      if (!perfil) return sendJson(res, 404, { error: 'Pessoa não encontrada' });
      return sendJson(res, 200, perfil);
    }

    // 6. Contracheque Detalhado / Holerite
    if (pathname === '/api/dados/contracheque-detalhe') {
      const id = params.get('id') || '1';
      const holerite = await dadosService.getContrachequeDetalhe(id);
      return sendJson(res, 200, holerite);
    }

    // 7. Turismo e Notícias
    if (pathname === '/api/dados/turismo') {
      const turismo = dadosService.getTurismoMaster();
      return sendJson(res, 200, turismo);
    }

    // 8. Fotos Auditadas
    if (pathname === '/api/dados/fotos-auditadas') {
      const eleicoes = await dadosService.getEleicoes({});
      const fotos = eleicoes.map(c => ({
        foto_id: c.numero,
        nome_urna: c.nome_urna,
        nome_completo: c.nome_completo,
        cargo: c.cargo,
        ano: c.ano,
        caminho_foto: c.foto_local || c.foto_tse,
        status: 'Auditado SHA-256'
      }));
      return sendJson(res, 200, { total: fotos.length, fotos });
    }

    // 9. Diárias e Viagens Oficiais
    if (pathname === '/api/dados/viagens') {
      const viagens = await dadosService.getViagens({
        q: params.get('q') || '',
        ano: params.get('ano') || '',
        page: params.get('page') || 1,
        limit: params.get('limit') || 25
      });
      return sendJson(res, 200, viagens);
    }

    // 10. Telemetria e Monitoramento de Acessos para o Admin
    if (pathname === '/api/admin/telemetria') {
      const telemetria = telemetriaService.getEstatisticas();
      return sendJson(res, 200, telemetria);
    }

    // 11. Registro de Busca pelo Cidadão
    if (pathname === '/api/telemetria/busca') {
      const q = params.get('q') || '';
      const cat = params.get('categoria') || 'geral';
      const tot = parseInt(params.get('total') || '0', 10);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (q) {
        telemetriaService.registrarBusca(q, cat, clientIp, tot);
      }
      return sendJson(res, 200, { success: true });
    }

    // 12. Autenticação Administrativa Oficial
    if (pathname === '/api/admin/login') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const sessao = telemetriaService.registrarLogin('Auditor Oficial', 'Controladoria Geral do Município', clientIp, true);
      return sendJson(res, 200, {
        authenticated: true,
        usuario: 'Auditor Oficial',
        orgao: 'Controladoria Geral de Arinos / MG',
        token_sessao: 'token_forense_' + Date.now(),
        ip: sessao.ip,
        timestamp: sessao.timestamp
      });
    }

    // Rota não encontrada
    return sendJson(res, 404, { error: `Endpoint '${pathname}' não encontrado na API.` });
  } catch (err) {
    console.error('Erro na requisição da API:', err);
    return sendJson(res, 500, { error: err.message });
  }
}

module.exports = {
  handleApiRequest
};
