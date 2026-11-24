/**
 * ==============================================================================
 * SERVIDOR OFICIAL DO PORTAL DA TRANSPARÊNCIA — ARINOS / MG
 * ==============================================================================
 * Servidor HTTP modularizado de alto desempenho em streaming nativo Node.js.
 * - Camada de Serviços desacoplada
 * - Banco de dados MySQL Relacional
 * - Suporte a rotas REST e entrega otimizada de assets estáticos
 * ==============================================================================
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');
const db = require('./database/mysql');
const telemetriaService = require('./services/telemetriaService');
const { handleApiRequest } = require('./routes/apiRoutes');

// Rotas e diretório do V3 (suporta tanto subdiretório do repo quanto raiz hacks)
const V3_FRONTEND_DIR = fs.existsSync(path.resolve(__dirname, '../v3/frontend'))
  ? path.resolve(__dirname, '../v3/frontend')
  : path.resolve(__dirname, '../../v3/frontend');

const v3BackendDir = fs.existsSync(path.resolve(__dirname, '../v3/backend'))
  ? path.resolve(__dirname, '../v3/backend')
  : path.resolve(__dirname, '../../v3/backend');

const v3Routes = {
  folha: require(path.join(v3BackendDir, 'routes/folha')).handleFolha,
  despesas: require(path.join(v3BackendDir, 'routes/despesas')).handleDespesas,
  diarias: require(path.join(v3BackendDir, 'routes/diarias')).handleDiarias,
  stats: require(path.join(v3BackendDir, 'routes/stats')).handleStats,
  rastrear: require(path.join(v3BackendDir, 'routes/auditoria')).handleRastrear,
  mandatos: require(path.join(v3BackendDir, 'routes/mandatos')).handleMandatos,
  empresas: require(path.join(v3BackendDir, 'routes/empresas')).handleEmpresas,
  rankings: require(path.join(v3BackendDir, 'routes/rankings')).handleRankings,
  eleicoes: require(path.join(v3BackendDir, 'routes/eleicoes')).handleEleicoes,
  vereadores: require(path.join(v3BackendDir, 'routes/vereadores')).handleVereadores
};

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  SERVIDOR DO PORTAL DA TRANSPARÊNCIA DE ARINOS / MG (V2 MYSQL)     ║');
console.log(`║  Porta: ${config.port} | Host: ${config.host}                                        ║`);
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Testa conexão inicial com o MySQL
db.testConnection().then(connected => {
  if (connected) {
    console.log('✔ Banco de Dados MySQL: Ativo e pronto para consultas.');
  } else {
    console.log('ℹ Banco de Dados MySQL: Modo offline/desenvolvimento (utilizando catálogo mestre em memória).');
  }
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  const startTime = process.hrtime.bigint();
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    telemetriaService.registrarAcesso(clientIp, req.method, pathname, res.statusCode, userAgent, durationMs);
  });

  // Rotas da API V3
  if (pathname === '/api/folha') {
    return v3Routes.folha(req, res, Object.fromEntries(parsedUrl.searchParams.entries()));
  }
  if (pathname === '/api/despesas') {
    return v3Routes.despesas(req, res, Object.fromEntries(parsedUrl.searchParams.entries()));
  }
  if (pathname === '/api/diarias') {
    return v3Routes.diarias(req, res, Object.fromEntries(parsedUrl.searchParams.entries()));
  }
  if (pathname === '/api/stats') {
    return v3Routes.stats(req, res);
  }
  if (pathname === '/api/mandatos') {
    return v3Routes.mandatos(req, res);
  }
  if (pathname === '/api/empresas') {
    return v3Routes.empresas(req, res);
  }
  if (pathname === '/api/rankings') {
    return v3Routes.rankings(req, res);
  }
  if (pathname === '/api/eleicoes') {
    return v3Routes.eleicoes(req, res);
  }
  if (pathname === '/api/vereadores') {
    return v3Routes.vereadores(req, res);
  }
  if (pathname === '/api/auditoria/rastrear' || pathname === '/api/rastrear') {
    return v3Routes.rastrear(req, res, Object.fromEntries(parsedUrl.searchParams.entries()));
  }

  // Rotas do Frontend V3
  if (pathname === '/v3') {
    res.writeHead(302, { 'Location': '/v3/' });
    return res.end();
  }
  if (pathname === '/v3/') {
    pathname = '/v3/index.html';
  }
  if (pathname.startsWith('/v3/')) {
    const relPath = pathname.replace(/^\/v3\//, '');
    const v3FilePath = path.join(V3_FRONTEND_DIR, relPath);
    if (fs.existsSync(v3FilePath) && fs.statSync(v3FilePath).isFile()) {
      const ext = path.extname(v3FilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return fs.createReadStream(v3FilePath).pipe(res);
    }
  }

  // Roteamento da API REST antiga
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(req, res, parsedUrl);
  }

  // Página Inicial
  if (pathname === '/' || pathname === '/index.html') {
    pathname = '/index.html';
  }

  // Busca do arquivo estático (prioriza pasta public/, com fallback para root)
  const candidatePaths = [
    path.join(config.publicDir, pathname),
    path.join(config.rootDir, pathname)
  ];

  let resolvedPath = null;
  for (const cp of candidatePaths) {
    if (fs.existsSync(cp) && fs.statSync(cp).isFile()) {
      resolvedPath = cp;
      break;
    }
  }

  if (resolvedPath) {
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(resolvedPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado no Portal da Transparência.');
  }
});

server.listen(config.port, config.host, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${config.port}`);
});

module.exports = server;
