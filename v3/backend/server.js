/**
 * SERVIDOR NATIVO DO PORTAL DA TRANSPARÊNCIA V3 — ARINOS / MG
 * Arquitetura de Alto Desempenho em Node.js Puro (Zero Frameworks Pesados)
 * Proteções: Rate Limiting por IP, Paginação Estrita, CORS Restrito.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const { handleFolha } = require('./routes/folha');
const { handleDespesas } = require('./routes/despesas');
const { handleDiarias } = require('./routes/diarias');
const { handleStats } = require('./routes/stats');

const PORT = parseInt(process.env.PORT, 10) || 8090;
const HOST = '0.0.0.0';
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// Rate limiting simples em memória (máx 120 requisições por minuto por IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 120;

function checkRateLimit(ip) {
  const now = Date.now();
  const client = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > client.resetTime) {
    client.count = 1;
    client.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    client.count++;
  }
  rateLimitMap.set(ip, client);

  return client.count <= MAX_REQUESTS;
}

// Limpeza periódica do mapa de rate limit a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Proteção Rate Limit
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Muitas requisições. Tente novamente em alguns segundos.' }));
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // Rotas de API REST
  if (pathname === '/api/folha') {
    return handleFolha(req, res, query);
  }
  if (pathname === '/api/despesas') {
    return handleDespesas(req, res, query);
  }
  if (pathname === '/api/diarias') {
    return handleDiarias(req, res, query);
  }
  if (pathname === '/api/stats') {
    return handleStats(req, res);
  }

  // Arquivos estáticos do Frontend
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Recurso não encontrado.');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 PORTAL DA TRANSPARÊNCIA V3 — ARINOS / MG`);
  console.log(`📡 Servidor ativo em: http://localhost:${PORT}`);
  console.log(`⚡ Modo: ES6 Modular + SQLite Nativo (< 5ms)`);
  console.log(`==================================================\n`);
});
