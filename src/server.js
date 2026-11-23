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

  // Roteamento da API REST
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
