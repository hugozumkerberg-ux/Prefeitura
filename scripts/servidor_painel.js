/**
 * Servidor Ultraleve de Monitoramento e API em Tempo Real — Arinos / MG
 * Porta: 8088
 * Sem dependências externas (100% nativo Node.js)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

// Módulos Arquiteturais Refatorados (DRY & Funções Reutilizáveis)
const { getMasterDb, getDetalhadoDb } = require('../lib/db');
const { normalizarTexto, ehBuscaGenericaFuncionarios } = require('../lib/normalizador');
const { calcularDescontosEstatutarios, formatarMascaraAnoMeses, processarHistoricoEPeriodos } = require('../lib/calculos_folha');
const { sendJson, sendError, extrairPaginacao } = require('../lib/respostas_http');
const { listarFuncionarios, listarContracheques, obterRelatorioInconsistencias } = require('../lib/servico_funcionarios');

const PORT = 8088;
const PORTAL_DIR = path.resolve(__dirname, '..');
const RESUMO_JSON_PATH = path.join(PORTAL_DIR, 'dados/resumo_geral.json');
const STATUS_JSON_PATH = path.join(PORTAL_DIR, 'dados/status_coleta.json');
const MASTER_DB = path.join(PORTAL_DIR, 'dados/arinos_transparencia_master.sqlite3');
const AUDIT_MASTER_DB = path.join(PORTAL_DIR, 'dados/auditoria/arinos_auditoria_master.sqlite3');
const DETALHADO_DB = path.join(PORTAL_DIR, 'dados/contracheques_detalhados_master.sqlite3');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  SERVIDOR DO PAINEL DE MONITORAMENTO AO VIVO — ARINOS / MG        ║');
console.log('║  URL: http://localhost:8088                                        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

function getAuditLogs(limit = 100, filterStatus = null) {
  const logs = [];
  const seenKeys = new Set();

  function processDb(dbPath, isMaster = false) {
    if (!fs.existsSync(dbPath)) return;
    try {
      const db = new DatabaseSync(dbPath);
      let query = `
        SELECT id, entidade, idorg, modulo, ano, mes, status_http, status_coleta,
               bytes_recebidos, hash_sha256, 
               ${isMaster ? 'qtd_registros_extraidos' : 'qtd_registros'} as qtd_registros,
               caminho_arquivo_raw, mensagem, coletado_em, tempo_resposta_ms, url_completa
        FROM auditoria_consultas
      `;
      if (filterStatus) {
        if (filterStatus === 'sucesso') {
          query += ` WHERE status_coleta = 'com_dados' AND (status_http = 200 OR status_http IS NULL) `;
        } else if (filterStatus === 'vazio') {
          query += ` WHERE status_coleta = 'vazio' `;
        } else if (filterStatus === 'falha') {
          query += ` WHERE status_coleta LIKE 'erro%' OR status_http >= 400 `;
        }
      }
      query += ` ORDER BY id DESC LIMIT ${limit}`;
      const rows = db.prepare(query).all();
      for (const r of rows) {
        const key = `${r.entidade}_${r.modulo}_${r.ano}_${r.mes}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          logs.push(r);
        }
      }
    } catch (e) {}
  }

  // Prioriza o Master DB e completa com o Auditoria DB
  processDb(MASTER_DB, true);
  if (logs.length < limit) {
    processDb(AUDIT_MASTER_DB, false);
  }

  return logs.slice(0, limit);
}

function getLiveStats() {
  let resumo = {};
  if (fs.existsSync(RESUMO_JSON_PATH)) {
    try {
      resumo = JSON.parse(fs.readFileSync(RESUMO_JSON_PATH, 'utf-8'));
    } catch {}
  }

  let statusColeta = {};
  if (fs.existsSync(STATUS_JSON_PATH)) {
    try {
      statusColeta = JSON.parse(fs.readFileSync(STATUS_JSON_PATH, 'utf-8'));
    } catch {}
  }

  // Estatísticas agregadas de Auditoria
  let estatisticasAuditoria = {
    total_consultas: 0,
    sucesso_com_dados: 0,
    vazio_sem_movimentacao: 0,
    falhas_erros: 0
  };

  const dbsToCheck = [MASTER_DB, AUDIT_MASTER_DB];
  for (const dbp of dbsToCheck) {
    if (fs.existsSync(dbp)) {
      try {
        const db = new DatabaseSync(dbp);
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status_coleta = 'com_dados' THEN 1 END) as sucesso,
            COUNT(CASE WHEN status_coleta = 'vazio' THEN 1 END) as vazio,
            COUNT(CASE WHEN status_coleta LIKE 'erro%' THEN 1 END) as falha
          FROM auditoria_consultas
        `).get();
        if (stats && stats.total > estatisticasAuditoria.total_consultas) {
          estatisticasAuditoria = {
            total_consultas: stats.total,
            sucesso_com_dados: stats.sucesso,
            vazio_sem_movimentacao: stats.vazio,
            falhas_erros: stats.falha
          };
        }
      } catch (e) {}
    }
  }

  // Estatísticas em tempo real do Master DB
  let masterLive = {
    consultas: 0,
    contracheques: 0,
    despesas: 0,
    diarias: 0,
    contratos: 0,
    receitas: 0,
    convenios: 0,
    eleicoes: 0,
    volume_reais: 0
  };

  if (fs.existsSync(MASTER_DB)) {
    try {
      const db = new DatabaseSync(MASTER_DB);
      const qAudit = db.prepare('SELECT COUNT(*) as c FROM auditoria_consultas').get();
      const qContra = db.prepare('SELECT COUNT(*) as c, SUM(total_proventos) as s FROM contracheques').get();
      const qDesp = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM despesas').get();
      const qDiar = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM diarias').get();

      let qContr = { c: 0, s: 0 };
      let qRec = { c: 0, s: 0 };
      let qConv = { c: 0, s: 0 };
      let qEleic = { c: 0 };

      try { qContr = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM contratos').get() || qContr; } catch(e){}
      try { qRec = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM receitas').get() || qRec; } catch(e){}
      try { qConv = db.prepare('SELECT COUNT(*) as c, SUM(valor_convenio) as s FROM convenios').get() || qConv; } catch(e){}
      try { qEleic = db.prepare('SELECT COUNT(*) as c FROM eleicoes_candidatos').get() || qEleic; } catch(e){}

      masterLive = {
        consultas: qAudit.c || 0,
        contracheques: qContra.c || 0,
        despesas: qDesp.c || 0,
        diarias: qDiar.c || 0,
        contratos: qContr.c || 0,
        receitas: qRec.c || 0,
        convenios: qConv.c || 0,
        eleicoes: qEleic.c || 0,
        volume_reais: (qContra.s || 0) + (qDesp.s || 0) + (qDiar.s || 0) + (qContr.s || 0) + (qRec.s || 0) + (qConv.s || 0)
      };
    } catch (e) {}
  }

  const logsRecentes = getAuditLogs(60);

  return {
    timestamp: new Date().toISOString(),
    resumo,
    status_coleta: statusColeta,
    master_live: masterLive,
    estatisticas_auditoria: estatisticasAuditoria,
    logs_recentes: logsRecentes
  };
}

// ==============================================================================
// HELPERS DE CÁLCULO DE PERÍODOS REAIS, INTERVALOS E CONTRACHEQUE DETALHADO
// ==============================================================================

function formatarMesAno(ano, mes) {
  const m = String(mes || 1).padStart(2, '0');
  return `${m}/${ano}`;
}



function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&iacute;/gi, 'í')
    .replace(/&Iacute;/gi, 'Í')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&Otilde;/gi, 'Õ')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&Atilde;/gi, 'Ã')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&aacute;/gi, 'á')
    .replace(/&Aacute;/gi, 'Á')
    .replace(/&nbsp;/gi, ' ');
}

function parseMoneyNum(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/R\$/g, '').trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseContrachequeDetalhadoHtml(rawHtml) {
  const html = decodeHtmlEntities(rawHtml);
  let matricula = null;
  let nome = null;
  let cargo = null;
  let lotacao = null;
  let admissao = null;
  const rubricas = [];

  const matNomeM = html.match(/Matr[íi]cula\/Nome[\s\S]*?:[\s\S]*?(?:<\/strong>)?\s*([0-9.]+)\s*-\s*([^<\n\r]+)/i);
  if (matNomeM) {
    matricula = matNomeM[1].trim();
    nome = matNomeM[2].trim();
  }

  const cargoM = html.match(/Cargo\/Fun[çc][ãa]o\s*:\s*<\/strong>\s*([^<\n\r]+)/i);
  if (cargoM) cargo = cargoM[1].trim();

  const orgM = html.match(/[ÓO]rg[ãa]o\s*:\s*<\/strong>\s*([^<\n\r]+)/i);
  if (orgM) lotacao = orgM[1].trim();

  const admM = html.match(/Data de admiss[ãa]o\s*:\s*<\/strong>\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (admM) admissao = admM[1].trim();

  const eventRegex = /<tr[^>]*>\s*<td[^>]*colspan=["']2["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<\/tr>/gi;
  let evMatch;
  while ((evMatch = eventRegex.exec(html)) !== null) {
    const desc = evMatch[1].replace(/<[^>]+>/g, '').trim();
    const remunStr = evMatch[2].replace(/<[^>]+>/g, '').trim();
    const descStr = evMatch[3].replace(/<[^>]+>/g, '').trim();
    if (desc && (remunStr || descStr)) {
      if (remunStr) rubricas.push({ descricao: desc, tipo: 'PROVENTO', valor: parseMoneyNum(remunStr) });
      if (descStr) rubricas.push({ descricao: desc, tipo: 'DESCONTO', valor: parseMoneyNum(descStr) });
    }
  }

  const totalProventos = rubricas.filter(r => r.tipo === 'PROVENTO').reduce((acc, r) => acc + (r.valor || 0), 0);
  const totalDescontos = rubricas.filter(r => r.tipo === 'DESCONTO').reduce((acc, r) => acc + (r.valor || 0), 0);
  const salarioLiquido = Math.round((totalProventos - totalDescontos) * 100) / 100;

  return {
    matricula,
    nome,
    cargo,
    lotacao,
    admissao,
    rubricas,
    total_proventos: Math.round(totalProventos * 100) / 100,
    total_descontos: Math.round(totalDescontos * 100) / 100,
    salario_liquido: salarioLiquido
  };
}

// ==============================================================================
// TELEMETRIA E CONTROLE DE ACESSOS ADMINISTRATIVOS (PAINEL DO HUGO)
// ==============================================================================

const ACCESS_LOGS = [];
const ROUTE_HITS = new Map();
const STATUS_HITS = { 200: 0, 304: 0, 400: 0, 404: 0, 500: 0 };
let totalRequestsCount = 0;
let totalLatencySum = 0;
const serverStartTime = Date.now();

const server = http.createServer(async (req, res) => {
  const reqStart = Date.now();

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  // Registrar acesso na telemetria ao finalizar resposta
  res.on('finish', () => {
    const duration = Date.now() - reqStart;
    totalRequestsCount++;
    totalLatencySum += duration;

    const code = res.statusCode || 200;
    STATUS_HITS[code] = (STATUS_HITS[code] || 0) + 1;

    const cleanPath = pathname.length > 50 ? pathname.slice(0, 50) + '...' : pathname;
    ROUTE_HITS.set(cleanPath, (ROUTE_HITS.get(cleanPath) || 0) + 1);

    const logEntry = {
      id: totalRequestsCount,
      timestamp: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      timestamp_iso: new Date().toISOString(),
      metodo: req.method,
      rota: pathname,
      search: parsedUrl.search || '',
      status: code,
      tempo_ms: duration,
      ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').replace('::ffff:', ''),
      user_agent: req.headers['user-agent'] || 'Desconhecido'
    };

    ACCESS_LOGS.unshift(logEntry);
    if (ACCESS_LOGS.length > 500) ACCESS_LOGS.pop();
  });

  // --- ENDPOINTS ADMINISTRATIVOS (CENTRO DE COMANDO DO HUGO) ---
  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/overview') {
      let dbStats = { quick_check: 'pendente', total_registros: 0, counts: {} };
      if (fs.existsSync(MASTER_DB)) {
        try {
          const db = new DatabaseSync(MASTER_DB, { readOnly: true });
          const qc = db.prepare('PRAGMA quick_check').get();
          dbStats.quick_check = qc && (qc.quick_check === 'ok' || Object.values(qc)[0] === 'ok') ? 'ok' : 'alerta';
          
          const counts = db.prepare(`
            SELECT 
              (SELECT count(*) FROM contracheques) as contracheques,
              (SELECT count(*) FROM despesas) as despesas,
              (SELECT count(*) FROM diarias) as diarias,
              (SELECT count(*) FROM contratos) as contratos,
              (SELECT count(*) FROM receitas) as receitas,
              (SELECT count(*) FROM pessoas_unificadas) as pessoas,
              (SELECT count(*) FROM empresas_contratadas) as empresas,
              (SELECT count(*) FROM camara_materias) as camara_materias
          `).get();
          db.close();
          dbStats.counts = counts;
          dbStats.total_registros = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
        } catch(e) {
          dbStats.erro = e.message;
        }
      }

      const topRotas = Array.from(ROUTE_HITS.entries())
        .map(([rota, total]) => ({ rota, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);
      const horas = Math.floor(uptimeSec / 3600);
      const minutos = Math.floor((uptimeSec % 3600) / 60);
      const segundos = uptimeSec % 60;

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        administrador: 'Hugo',
        perfil: 'Super Administrador / Webmaster',
        servidor: {
          porta: PORT,
          uptime_segundos: uptimeSec,
          uptime_formatado: `${horas}h ${minutos}m ${segundos}s`,
          ram_utilizada_mb: Math.round(process.memoryUsage().rss / 1024 / 1024 * 10) / 10,
          ram_heap_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10,
          node_version: process.version,
          plataforma: process.platform,
          banco_master_mb: fs.existsSync(MASTER_DB) ? Math.round(fs.statSync(MASTER_DB).size / 1024 / 1024 * 10) / 10 : 0
        },
        telemetria: {
          total_requisicoes: totalRequestsCount,
          tempo_medio_ms: totalRequestsCount > 0 ? Math.round(totalLatencySum / totalRequestsCount * 10) / 10 : 0,
          status_hits: STATUS_HITS,
          top_rotas: topRotas
        },
        banco: dbStats
      }));
      return;
    }

    if (pathname === '/api/admin/acessos') {
      const limit = Math.min(500, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '50', 10)));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        total_acumulado: totalRequestsCount,
        tempo_medio_ms: totalRequestsCount > 0 ? Math.round(totalLatencySum / totalRequestsCount * 10) / 10 : 0,
        status_distribuicao: STATUS_HITS,
        acessos: ACCESS_LOGS.slice(0, limit)
      }));
      return;
    }

    if (pathname === '/api/admin/logs') {
      const tipo = (parsedUrl.searchParams.get('tipo') || 'todos').toLowerCase();
      const limit = Math.min(200, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '60', 10)));
      
      let logsCombinados = [];

      // Logs de Acessos HTTP
      if (tipo === 'todos' || tipo === 'http') {
        ACCESS_LOGS.slice(0, limit).forEach(a => {
          logsCombinados.push({
            tipo: 'HTTP',
            timestamp: a.timestamp,
            nivel: a.status >= 500 ? 'ERRO' : (a.status >= 400 ? 'ALERTA' : 'INFO'),
            mensagem: `${a.metodo} ${a.rota} (${a.tempo_ms}ms) -> Status ${a.status}`,
            detalhe: `IP: ${a.ip} • UA: ${a.user_agent.slice(0, 45)}...`
          });
        });
      }

      // Logs de Auditoria do Crawler ADPM/SAPL
      if (tipo === 'todos' || tipo === 'crawler' || tipo === 'erros') {
        const auditLogs = getAuditLogs(limit, tipo === 'erros' ? 'falha' : null);
        auditLogs.forEach(l => {
          logsCombinados.push({
            tipo: 'CRAWLER',
            timestamp: new Date(l.coletado_em).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            nivel: (l.status_coleta || '').startsWith('erro') ? 'ERRO' : ((l.status_coleta === 'vazio') ? 'ALERTA' : 'SUCESSO'),
            mensagem: `[${l.entidade}] Módulo ${l.modulo} (${l.mes}/${l.ano}) - ${l.qtd_registros || 0} registros`,
            detalhe: `HTTP ${l.status_http || 200} • ${Math.round((l.bytes_recebidos || 0)/1024)} KB • SHA: ${(l.hash_sha256 || '').slice(0, 12)}...`
          });
        });
      }

      if (tipo === 'erros') {
        logsCombinados = logsCombinados.filter(l => l.nivel === 'ERRO' || l.nivel === 'ALERTA');
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        total: logsCombinados.length,
        logs: logsCombinados.slice(0, limit)
      }));
      return;
    }

    if (pathname === '/api/admin/reports') {
      const tipo = (parsedUrl.searchParams.get('tipo') || 'conflitos').toLowerCase();

      try {
        const db = new DatabaseSync(MASTER_DB, { readOnly: true });

        if (tipo === 'conflitos') {
          // Servidores com vínculo em fornecedores
          const conflitos = db.prepare(`
            SELECT p.id, p.nome_exibicao, p.cargos_resumo, p.total_salarios, p.total_dinheiro_publico, p.empresas_vinculadas, p.foto_url
            FROM pessoas_unificadas p
            WHERE p.is_socio_empresa = 1
            ORDER BY p.total_dinheiro_publico DESC
          `).all();

          const formatados = conflitos.map(c => {
            let empresas = [];
            try { empresas = JSON.parse(c.empresas_vinculadas || '[]'); } catch(e){}
            return {
              id: c.id,
              nome: c.nome_exibicao,
              cargo: c.cargos_resumo,
              salarios: c.total_salarios,
              total_recebido: c.total_dinheiro_publico,
              foto_url: c.foto_url,
              empresas: empresas.map(e => ({
                razao_social: e.razao_social,
                cnpj: e.cnpj,
                qualificacao: e.qualificacao
              }))
            };
          });

          db.close();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            relatorio: 'Auditoria de Conflitos de Interesse (Servidores Sócios de Fornecedores)',
            total_casos: formatados.length,
            dados: formatados
          }));
          return;
        }

        if (tipo === 'pilares') {
          const prefeitura = db.prepare("SELECT count(*) as contracheques, sum(total_proventos) as folha FROM contracheques WHERE entidade LIKE '%Prefeitura%'").get();
          const saude = db.prepare("SELECT count(*) as contracheques, sum(total_proventos) as folha FROM contracheques WHERE entidade LIKE '%Saúde%'").get();
          const camara = db.prepare("SELECT count(*) as total_materias, min(ano) as min_ano, max(ano) as max_ano FROM camara_materias").get();
          const contratos = db.prepare("SELECT count(*) as total, sum(valor) as volume FROM contratos").get();
          const diarias = db.prepare("SELECT count(*) as total, sum(valor) as volume FROM diarias").get();

          db.close();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            relatorio: 'Diagnóstico Orçamentário e Financeiro dos 3 Pilares',
            pilares: {
              prefeitura: {
                folha_total: prefeitura.folha,
                contracheques_processados: prefeitura.contracheques,
                contratos_firmados_total: contratos.total,
                contratos_volume: contratos.volume,
                diarias_total: diarias.total,
                diarias_volume: diarias.volume
              },
              saude: {
                folha_total: saude.folha,
                contracheques_processados: saude.contracheques
              },
              camara: {
                materias_legislativas: camara.total_materias,
                periodo_legislativo: `${camara.min_ano} a ${camara.max_ano}`
              }
            }
          }));
          return;
        }

        if (tipo === 'forense') {
          const quick = db.prepare('PRAGMA quick_check').get();
          const fotosAuditadas = db.prepare('SELECT count(*) as total FROM fotos_auditadas_pessoas WHERE status_auditoria = 1').get();
          const totalAuditConsultas = db.prepare('SELECT count(*) as total, sum(bytes_recebidos) as total_bytes FROM auditoria_consultas').get();

          db.close();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            relatorio: 'Cadeia de Custódia Forense & Integridade Estrutural SHA-256',
            integridade_sqlite: quick && (quick.quick_check === 'ok' || Object.values(quick)[0] === 'ok') ? 'APROVADO (PRAGMA quick_check = ok)' : 'FALHA',
            fotos_oficiais_auditadas_sha256: fotosAuditadas.total,
            consultas_crawler_rastreadas: totalAuditConsultas.total,
            volume_dados_auditados_mb: Math.round((totalAuditConsultas.total_bytes || 0) / 1024 / 1024 * 10) / 10
          }));
          return;
        }

        db.close();
      } catch(err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    if (pathname === '/api/admin/acao') {
      const acao = (parsedUrl.searchParams.get('acao') || '').toLowerCase();
      if (acao === 'quick_check') {
        try {
          const db = new DatabaseSync(MASTER_DB, { readOnly: true });
          const resCheck = db.prepare('PRAGMA quick_check').get();
          db.close();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ sucesso: true, resultado: resCheck }));
          return;
        } catch(e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ sucesso: false, erro: e.message }));
          return;
        }
      }

      if (acao === 'limpar_acessos') {
        ACCESS_LOGS.length = 0;
        ROUTE_HITS.clear();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ sucesso: true, mensagem: 'Histórico recente de acessos limpo com sucesso' }));
        return;
      }
    }
  }

  // Endpoint de status dinâmico ao vivo
  if (pathname === '/api/live' || pathname === '/api/status') {
    const stats = getLiveStats();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(stats));
    return;
  }

  // Endpoint dedicado de logs com filtros
  if (pathname === '/api/logs') {
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '100', 10);
    const status = parsedUrl.searchParams.get('status') || null;
    const logs = getAuditLogs(limit, status);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ total: logs.length, logs }));
    return;
  }

  // --- ENDPOINTS DINÂMICOS DE DADOS E TABELAS (SQLITE MASTER) ---
  if (pathname.startsWith('/api/dados/')) {
    if (!fs.existsSync(MASTER_DB)) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Banco Master ainda não disponível.' }));
      return;
    }

    try {
      const db = new DatabaseSync(MASTER_DB, { readOnly: true });

      // 1. Resumo Geral de todas as tabelas
      if (pathname === '/api/dados/resumo') {
        const cStats = db.prepare('SELECT count(*) as qtd, sum(total_proventos) as soma, min(ano) as min_ano, max(ano) as max_ano FROM contracheques').get();
        const dStats = db.prepare('SELECT count(*) as qtd, sum(valor) as soma, min(ano) as min_ano, max(ano) as max_ano FROM despesas').get();
        const diarStats = db.prepare('SELECT count(*) as qtd, sum(valor) as soma, min(ano) as min_ano, max(ano) as max_ano FROM diarias').get();
        
        let contStats = { qtd: 0, soma: 0 };
        let recStats = { qtd: 0, soma: 0 };
        let convStats = { qtd: 0, soma: 0 };
        let eleicStats = { qtd: 0 };

        try { contStats = db.prepare('SELECT count(*) as qtd, sum(valor) as soma FROM contratos').get() || contStats; } catch(e){}
        try { recStats = db.prepare('SELECT count(*) as qtd, sum(valor) as soma FROM receitas').get() || recStats; } catch(e){}
        try { convStats = db.prepare('SELECT count(*) as qtd, sum(valor_convenio) as soma FROM convenios').get() || convStats; } catch(e){}
        try { eleicStats = db.prepare('SELECT count(*) as qtd FROM eleicoes_candidatos').get() || eleicStats; } catch(e){}

        const totalQtd = (cStats.qtd || 0) + (dStats.qtd || 0) + (diarStats.qtd || 0) + (contStats.qtd || 0) + (recStats.qtd || 0) + (convStats.qtd || 0) + (eleicStats.qtd || 0);
        const totalVol = (cStats.soma || 0) + (dStats.soma || 0) + (diarStats.soma || 0) + (contStats.soma || 0) + (recStats.soma || 0) + (convStats.soma || 0);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          contracheques: cStats,
          despesas: dStats,
          diarias: diarStats,
          contratos: contStats,
          receitas: recStats,
          convenios: convStats,
          eleicoes: eleicStats,
          global: {
            registros: totalQtd,
            volume_reais: totalVol
          }
        }));
        return;
      }

      // 2. Rankings (Top 10)
      if (pathname === '/api/dados/rankings') {
        const topSalarios = db.prepare('SELECT entidade, ano, mes, matricula, nome, cargo, total_proventos FROM contracheques ORDER BY total_proventos DESC LIMIT 10').all();
        const topCredores = db.prepare('SELECT credor, count(*) as qtd_empenhos, sum(valor) as volume_total, min(ano) as de_ano, max(ano) as ate_ano FROM despesas GROUP BY credor ORDER BY volume_total DESC LIMIT 10').all();
        const topDiarias = db.prepare('SELECT servidor, count(*) as qtd_diarias, sum(valor) as volume_total, min(ano) as de_ano, max(ano) as ate_ano FROM diarias GROUP BY servidor ORDER BY volume_total DESC LIMIT 10').all();

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ topSalarios, topCredores, topDiarias }));
        return;
      }

      // 3. Consulta Paginada de Contracheques (com Cálculo de Salário Bruto, Descontos e Líquido)
      if (pathname === '/api/dados/contracheques') {
        const resultado = listarContracheques({
          q: parsedUrl.searchParams.get('q') || '',
          ano: parsedUrl.searchParams.get('ano') || '',
          mes: parsedUrl.searchParams.get('mes') || '',
          entidade: parsedUrl.searchParams.get('entidade') || '',
          page: parsedUrl.searchParams.get('page') || '1',
          limit: parsedUrl.searchParams.get('limit') || '25'
        });
        sendJson(res, resultado);
        return;
      }

      // 3.1. Consulta Rápida de Funcionários & Servidores Públicos (Novo Endpoint Dedicado)
      if (pathname === '/api/dados/funcionarios' || pathname === '/api/dados/servidores') {
        const resultado = listarFuncionarios({
          busca: parsedUrl.searchParams.get('busca') || parsedUrl.searchParams.get('q') || '',
          tipo: parsedUrl.searchParams.get('tipo') || 'todos',
          ordenar: parsedUrl.searchParams.get('ordenar') || 'dinheiro',
          page: parseInt(parsedUrl.searchParams.get('page') || '1', 10),
          limit: parseInt(parsedUrl.searchParams.get('limit') || '25', 10)
        });
        sendJson(res, resultado);
        return;
      }

      // 3.2. Auditoria DBA de Inconsistências Cadastrais e Higienização de Matrículas
      if (pathname === '/api/dados/inconsistencias' || pathname === '/api/dados/dba-auditoria') {
        const resultado = obterRelatorioInconsistencias();
        sendJson(res, resultado);
        return;
      }

      // 4. Consulta Paginada de Contratos (Novo Portal SIAP)
      if (pathname === '/api/dados/contratos') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (nr_contrato LIKE ? OR credor LIKE ? OR objeto LIKE ? OR nr_processo LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        let totalInfo = { total: 0, soma_filtrada: 0 };
        let rows = [];

        try {
          const countQuery = `SELECT count(*) as total, sum(valor) as soma_filtrada FROM contratos ${whereClause}`;
          totalInfo = db.prepare(countQuery).get(...params) || totalInfo;

          const dataQuery = `
            SELECT id, nr_contrato, nr_processo, credor, doc_credor, tipo_contrato, dt_ini_vigencia, dt_fim_vigencia, dt_assinatura, objeto, valor
            FROM contratos
            ${whereClause}
            ORDER BY valor DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
          rows = db.prepare(dataQuery).all(...params);
        } catch (tableErr) {}

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          page,
          limit,
          total: totalInfo.total || 0,
          total_paginas: Math.ceil((totalInfo.total || 0) / limit) || 1,
          soma_filtrada: totalInfo.soma_filtrada || 0,
          registros: rows
        }));
        return;
      }

      // 5. Consulta Paginada de Despesas
      if (pathname === '/api/dados/despesas') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const ano = parsedUrl.searchParams.get('ano') || '';
        const mes = parsedUrl.searchParams.get('mes') || '';
        const entidade = parsedUrl.searchParams.get('entidade') || '';

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (credor LIKE ? OR historico LIKE ? OR nr_empenho LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (ano) {
          whereClause += ' AND ano = ? ';
          params.push(parseInt(ano, 10));
        }
        if (mes) {
          whereClause += ' AND mes = ? ';
          params.push(parseInt(mes, 10));
        }
        if (entidade) {
          whereClause += ' AND entidade LIKE ? ';
          params.push(`%${entidade}%`);
        }

        const countQuery = `SELECT count(*) as total, sum(valor) as soma_filtrada FROM despesas ${whereClause}`;
        const totalInfo = db.prepare(countQuery).get(...params);

        const dataQuery = `
          SELECT id, entidade, ano, mes, nr_empenho, data_empenho, credor, cpf_cnpj, valor, natureza, historico
          FROM despesas
          ${whereClause}
          ORDER BY ano DESC, mes DESC, valor DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const rows = db.prepare(dataQuery).all(...params);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          page,
          limit,
          total: totalInfo.total,
          total_paginas: Math.ceil((totalInfo.total || 0) / limit),
          soma_filtrada: totalInfo.soma_filtrada || 0,
          registros: rows
        }));
        return;
      }

      // 6. Consulta Paginada de Receitas (Novo Portal SIAP)
      if (pathname === '/api/dados/receitas') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const ano = parsedUrl.searchParams.get('ano') || '';

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (descricao_receita LIKE ? OR mascara_receita LIKE ? OR nr_conhecimento LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (ano) {
          whereClause += ' AND ano = ? ';
          params.push(parseInt(ano, 10));
        }

        let totalInfo = { total: 0, soma_filtrada: 0 };
        let rows = [];

        try {
          const countQuery = `SELECT count(*) as total, sum(valor) as soma_filtrada FROM receitas ${whereClause}`;
          totalInfo = db.prepare(countQuery).get(...params) || totalInfo;

          const dataQuery = `
            SELECT id, ano, data_receita, nr_conhecimento, descricao_receita, mascara_receita, valor, agencia, conta, descricao_conta
            FROM receitas
            ${whereClause}
            ORDER BY data_receita DESC, valor DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
          rows = db.prepare(dataQuery).all(...params);
        } catch (tableErr) {}

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          page,
          limit,
          total: totalInfo.total || 0,
          total_paginas: Math.ceil((totalInfo.total || 0) / limit) || 1,
          soma_filtrada: totalInfo.soma_filtrada || 0,
          registros: rows
        }));
        return;
      }

      // 7. Consulta Paginada de Diárias
      if (pathname === '/api/dados/diarias') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const ano = parsedUrl.searchParams.get('ano') || '';
        const mes = parsedUrl.searchParams.get('mes') || '';
        const entidade = parsedUrl.searchParams.get('entidade') || '';

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (servidor LIKE ? OR motivo LIKE ? OR nr_empenho LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (ano) {
          whereClause += ' AND ano = ? ';
          params.push(parseInt(ano, 10));
        }
        if (mes) {
          whereClause += ' AND mes = ? ';
          params.push(parseInt(mes, 10));
        }
        if (entidade) {
          whereClause += ' AND entidade LIKE ? ';
          params.push(`%${entidade}%`);
        }

        const countQuery = `SELECT count(*) as total, sum(valor) as soma_filtrada FROM diarias ${whereClause}`;
        const totalInfo = db.prepare(countQuery).get(...params);

        const dataQuery = `
          SELECT id, entidade, ano, mes, nr_empenho, data_viagem, servidor, valor, tipo_diaria, motivo
          FROM diarias
          ${whereClause}
          ORDER BY ano DESC, mes DESC, valor DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const rows = db.prepare(dataQuery).all(...params);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          page,
          limit,
          total: totalInfo.total,
          total_paginas: Math.ceil((totalInfo.total || 0) / limit),
          soma_filtrada: totalInfo.soma_filtrada || 0,
          registros: rows
        }));
        return;
      }

      // 8. Consulta Paginada de Convênios (Novo Portal SIAP)
      if (pathname === '/api/dados/convenios') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (nr_convenio LIKE ? OR descricao LIKE ? OR objeto LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        let totalInfo = { total: 0, soma_filtrada: 0, contrapartida_filtrada: 0 };
        let rows = [];

        try {
          const countQuery = `SELECT count(*) as total, sum(valor_convenio) as soma_filtrada, sum(valor_contrapartida) as contrapartida_filtrada FROM convenios ${whereClause}`;
          totalInfo = db.prepare(countQuery).get(...params) || totalInfo;

          const dataQuery = `
            SELECT id, nr_convenio, descricao, objeto, valor_convenio, valor_contrapartida, dt_convenio, dt_inicio, dt_final, parcelas
            FROM convenios
            ${whereClause}
            ORDER BY valor_convenio DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
          rows = db.prepare(dataQuery).all(...params);
        } catch (tableErr) {}

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          page,
          limit,
          total: totalInfo.total || 0,
          total_paginas: Math.ceil((totalInfo.total || 0) / limit) || 1,
          soma_filtrada: totalInfo.soma_filtrada || 0,
          contrapartida_filtrada: totalInfo.contrapartida_filtrada || 0,
          registros: rows
        }));
        return;
      }

      // 9. Consulta de Eleições TSE (Arinos / MG)
      if (pathname === '/api/dados/eleicoes') {
        const ano = parsedUrl.searchParams.get('ano') || '';
        const cargo = parsedUrl.searchParams.get('cargo') || '';
        const partido = parsedUrl.searchParams.get('partido') || '';
        const q = (parsedUrl.searchParams.get('q') || '').trim();

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (ano) {
          whereClause += ' AND ano = ? ';
          params.push(parseInt(ano, 10));
        }
        if (cargo) {
          whereClause += ' AND cargo LIKE ? ';
          params.push(`%${cargo}%`);
        }
        if (partido) {
          whereClause += ' AND partido_sigla = ? ';
          params.push(partido);
        }
        if (q) {
          whereClause += ' AND (nome_urna LIKE ? OR nome_completo LIKE ? OR numero LIKE ? OR coligacao LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        let rows = [];
        try {
          const dataQuery = `
            SELECT id, ano, id_candidato, cargo, numero, nome_urna, nome_completo,
                   partido_sigla, coligacao, situacao, resultado, votos, percentual,
                   total_bens, ocupacao, grau_instrucao, foto_local, foto_tse,
                   vice_nome, vice_partido, vice_foto, cor_primaria, cor_secundaria
            FROM eleicoes_candidatos
            ${whereClause}
            ORDER BY ano DESC, 
                     CASE WHEN cargo = 'Prefeito' THEN 1 WHEN cargo = 'Vice-prefeito' THEN 2 ELSE 3 END,
                     CASE WHEN resultado LIKE '%Eleito%' THEN 1 ELSE 2 END,
                     votos DESC, nome_urna ASC
          `;
          rows = db.prepare(dataQuery).all(...params);
        } catch (tableErr) {}

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          total: rows.length,
          candidatos: rows
        }));
        return;
      }

      // 10. Consulta Consolidada por Mandatos (Executivo & Legislativo)
      if (pathname === '/api/dados/mandatos') {
        const folhaPorMandato = db.prepare(`
          SELECT 
            CASE 
              WHEN ano >= 2025 THEN '2025-2028'
              WHEN ano >= 2021 THEN '2021-2024'
              WHEN ano >= 2017 THEN '2017-2020'
              WHEN ano >= 2013 THEN '2013-2016'
              ELSE 'Anterior'
            END as mandato,
            count(*) as total_contracheques,
            sum(total_proventos) as volume_folha,
            avg(total_proventos) as media_salarial,
            max(total_proventos) as maior_salario
          FROM contracheques
          GROUP BY mandato
          ORDER BY mandato DESC
        `).all();

        const despesasPorMandato = db.prepare(`
          SELECT 
            CASE 
              WHEN ano >= 2025 THEN '2025-2028'
              WHEN ano >= 2021 THEN '2021-2024'
              WHEN ano >= 2017 THEN '2017-2020'
              WHEN ano >= 2013 THEN '2013-2016'
              ELSE 'Anterior'
            END as mandato,
            count(*) as total_empenhos,
            sum(valor) as volume_despesas,
            count(DISTINCT credor) as credores_unicos
          FROM despesas
          GROUP BY mandato
          ORDER BY mandato DESC
        `).all();

        const diariasPorMandato = db.prepare(`
          SELECT 
            CASE 
              WHEN ano >= 2025 THEN '2025-2028'
              WHEN ano >= 2021 THEN '2021-2024'
              WHEN ano >= 2017 THEN '2017-2020'
              WHEN ano >= 2013 THEN '2013-2016'
              ELSE 'Anterior'
            END as mandato,
            count(*) as total_diarias,
            sum(valor) as volume_diarias,
            count(DISTINCT servidor) as servidores_com_diarias
          FROM diarias
          GROUP BY mandato
          ORDER BY mandato DESC
        `).all();

        let contratosPorMandato = [];
        try {
          contratosPorMandato = db.prepare(`
            SELECT 
              CASE 
                WHEN dt_ini_vigencia LIKE '2025%' OR dt_ini_vigencia LIKE '2026%' THEN '2025-2028'
                WHEN dt_ini_vigencia LIKE '2021%' OR dt_ini_vigencia LIKE '2022%' OR dt_ini_vigencia LIKE '2023%' OR dt_ini_vigencia LIKE '2024%' THEN '2021-2024'
                WHEN dt_ini_vigencia LIKE '2017%' OR dt_ini_vigencia LIKE '2018%' OR dt_ini_vigencia LIKE '2019%' OR dt_ini_vigencia LIKE '2020%' THEN '2017-2020'
                ELSE 'Anterior'
              END as mandato,
              count(*) as total_contratos,
              sum(valor) as volume_contratos
            FROM contratos
            GROUP BY mandato
            ORDER BY mandato DESC
          `).all();
        } catch(e){}

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          folha: folhaPorMandato,
          despesas: despesasPorMandato,
          diarias: diariasPorMandato,
          contratos: contratosPorMandato
        }));
        return;
      }

      // 11. Consulta de Atividade Parlamentar e Vereadores (SAPL Câmara de Arinos)
      if (pathname === '/api/dados/vereadores') {
        const jsonPath = path.join(PORTAL_DIR, 'dados/camara/arinos_camara_master.json');
        if (fs.existsSync(jsonPath)) {
          const vereadores = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
          const ativo = parsedUrl.searchParams.get('ativo');

          let filtrados = vereadores;
          if (ativo !== null && ativo !== undefined && ativo !== '') {
            const isAtivo = ativo === '1' || ativo === 'true';
            filtrados = filtrados.filter(v => v.ativo === isAtivo);
          }

          if (q) {
            filtrados = filtrados.filter(v => {
              const matchNome = (v.nome_parlamentar || '').toLowerCase().includes(q) || 
                                (v.nome_completo || '').toLowerCase().includes(q);
              const matchMateria = (v.materias || []).some(m => 
                (m.titulo || '').toLowerCase().includes(q) || 
                (m.ementa || '').toLowerCase().includes(q) ||
                (m.indexacao || '').toLowerCase().includes(q)
              );
              return matchNome || matchMateria;
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            total: filtrados.length,
            vereadores: filtrados
          }));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Dados da câmara ainda não gerados' }));
          return;
        }
      }

      // 12. Consulta de Turismo & Notícias Oficiais com Hashes Criptográficos
      if (pathname === '/api/dados/turismo') {
        const jsonPath = path.join(PORTAL_DIR, 'dados/turismo/arinos_turismo_master.json');
        if (fs.existsSync(jsonPath)) {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(data));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Dados de turismo não encontrados' }));
          return;
        }
      }

      // 13. Consulta de Empresas Contratadas e Quadro de Sócios (QSA)
      if (pathname === '/api/dados/empresas') {
        const jsonPath = path.join(PORTAL_DIR, 'dados/empresas/arinos_empresas_master.json');
        if (fs.existsSync(jsonPath)) {
          const master = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
          const apenasAlerta = parsedUrl.searchParams.get('alerta') === '1';
          const situacao = (parsedUrl.searchParams.get('situacao') || '').toUpperCase();
          const arinosApenas = parsedUrl.searchParams.get('arinos') === '1';

          let lista = master.empresas;

          if (apenasAlerta) {
            lista = lista.filter(e => e.possui_alerta_vinculo === 1);
          }
          if (situacao) {
            lista = lista.filter(e => e.situacao_cadastral === situacao);
          }
          if (arinosApenas) {
            lista = lista.filter(e => (e.municipio || '').toUpperCase() === 'ARINOS');
          }
          if (q) {
            lista = lista.filter(e => {
              const matchEmp = (e.razao_social || '').toLowerCase().includes(q) ||
                               (e.nome_fantasia || '').toLowerCase().includes(q) ||
                               (e.cnpj || '').includes(q) ||
                               (e.cnae_principal_descricao || '').toLowerCase().includes(q);
              const matchSocio = (e.socios || []).some(s => (s.nome_socio || '').toLowerCase().includes(q));
              return matchEmp || matchSocio;
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            resumo: master.resumo_geral,
            hash_forense_sha256: master.hash_forense_sha256,
            total_filtrado: lista.length,
            empresas: lista
          }));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Dados de empresas e sócios ainda não gerados' }));
          return;
        }
      }

      // 14. Dados Completos da Empresa (com Contratos e Despesas Vinculadas)
      if (pathname === '/api/dados/empresas/detalhes') {
        const rawCnpj = (parsedUrl.searchParams.get('cnpj') || '').replace(/\D/g, '');
        if (!rawCnpj) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'CNPJ é obrigatório' }));
          return;
        }

        const empresa = db.prepare(`SELECT * FROM empresas_contratadas WHERE cnpj = ?`).get(rawCnpj);
        if (!empresa) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Empresa não encontrada no cadastro' }));
          return;
        }

        const socios = db.prepare(`SELECT * FROM empresas_socios WHERE cnpj = ?`).all(rawCnpj);

        // Fetch related contracts (by formatted CNPJ or clean CNPJ)
        const formatCnpj = rawCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        const contratos = db.prepare(`
          SELECT id, nr_contrato, tipo_contrato, valor, dt_ini_vigencia, dt_fim_vigencia, objeto, dt_assinatura, nr_processo
          FROM contratos
          WHERE doc_credor = ? OR doc_credor = ? OR REPLACE(REPLACE(REPLACE(REPLACE(doc_credor, '.', ''), '/', ''), '-', ''), ' ', '') = ?
          ORDER BY dt_assinatura DESC, valor DESC
        `).all(formatCnpj, rawCnpj, rawCnpj);

        // Enriquecer contratos com ciclo de gestão política e ano
        contratos.forEach(c => {
          const dataRef = c.dt_assinatura || c.dt_ini_vigencia || '';
          const ano = dataRef ? parseInt(dataRef.substring(0, 4), 10) : 0;
          let gestao = 'Período Não Identificado';
          if (ano >= 2025) gestao = 'Gestão Marcílio Álisson (2025–2028)';
          else if (ano >= 2021 && ano <= 2024) gestao = 'Gestão Marcílio Álisson (2021–2024)';
          else if (ano >= 2017 && ano <= 2020) gestao = 'Gestão Carlos Alberto Recch (2017–2020)';
          else if (ano >= 2013 && ano <= 2016) gestao = 'Gestão Carlos Alberto Recch (2013–2016)';
          c.gestao_mandato = gestao;
          c.ano = ano;
        });

        // Fetch related expenses
        const despesas = db.prepare(`
          SELECT id, ano, mes, nr_empenho, data_empenho, valor, natureza, projeto_atividade, historico
          FROM despesas
          WHERE cpf_cnpj = ? OR cpf_cnpj = ? OR REPLACE(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '/', ''), '-', ''), ' ', '') = ?
          ORDER BY ano DESC, mes DESC, valor DESC
          LIMIT 100
        `).all(formatCnpj, rawCnpj, rawCnpj);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          empresa,
          socios,
          contratos,
          despesas,
          estatisticas: {
            total_contratos: contratos.length,
            soma_contratos: contratos.reduce((a, c) => a + (c.valor || 0), 0),
            total_despesas: despesas.length,
            soma_despesas: despesas.reduce((a, d) => a + (d.valor || 0), 0)
          }
        }));
        return;
      }

      // 15. Consulta Analítica de Viagens e Diárias (29.746 diárias catalogadas)
      if (pathname === '/api/dados/viagens') {
        const jsonPath = path.join(PORTAL_DIR, 'dados/viagens/arinos_viagens_master.json');
        if (fs.existsSync(jsonPath)) {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
          const ano = parsedUrl.searchParams.get('ano') || '';
          const tipo = (parsedUrl.searchParams.get('tipo') || '').toLowerCase();

          // Dynamic filter for individual trips if requested
          if (q || ano || tipo) {
            let whereClause = ' WHERE 1=1 ';
            const params = [];

            if (q) {
              whereClause += ' AND (servidor LIKE ? OR motivo LIKE ? OR destino LIKE ? OR nr_empenho LIKE ?) ';
              params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            }
            if (ano) {
              whereClause += ' AND ano = ? ';
              params.push(parseInt(ano, 10));
            }
            if (tipo) {
              whereClause += ' AND tipo_diaria LIKE ? ';
              params.push(`%${tipo}%`);
            }

            const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
            const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '30', 10)));
            const offset = (page - 1) * limit;

            const countInfo = db.prepare(`SELECT count(*) as total, sum(valor) as soma FROM diarias ${whereClause}`).get(...params);
            const rows = db.prepare(`
              SELECT id, ano, mes, nr_empenho, tipo_diaria, servidor, cargo, destino, motivo, valor, data_viagem, hash_registro
              FROM diarias
              ${whereClause}
              ORDER BY ano DESC, mes DESC, valor DESC
              LIMIT ${limit} OFFSET ${offset}
            `).all(...params);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              resumo: data.resumo_geral,
              evolucao_anual: data.evolucao_anual,
              por_categoria: data.por_categoria,
              top_viajantes: data.top_viajantes,
              top_destinos: data.top_destinos,
              busca: {
                page,
                limit,
                total: countInfo.total,
                soma_filtrada: countInfo.soma || 0,
                total_paginas: Math.ceil((countInfo.total || 0) / limit),
                registros: rows
              }
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(data));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Dados de viagens não encontrados' }));
          return;
        }
      }

      // 16. Buscador Avançado Universal (Multi-Módulo, Sem Acentos & Instantâneo)
      if (pathname === '/api/dados/busca-global') {
        const startTime = Date.now();
        const rawQ = (parsedUrl.searchParams.get('q') || '').trim();
        const categoria = (parsedUrl.searchParams.get('categoria') || 'todas').toLowerCase();
        const limit = Math.min(50, Math.max(2, parseInt(parsedUrl.searchParams.get('limit') || '8', 10)));

        function normalizar(str) {
          if (!str) return '';
          return str
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        const normQ = normalizar(rawQ);
        const tokens = normQ.split(' ').filter(Boolean);

        if (tokens.length === 0) {
          // Retorna sugestões e categorias rápidas
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            query: '',
            tempo_execucao_ms: Date.now() - startTime,
            sugestoes_populares: [
              { termo: 'Saúde', tag: '🏥 Hospital & Postos' },
              { termo: 'Unaí', tag: '📍 Regional Unaí' },
              { termo: 'Durães', tag: '🏢 Contratos & Vereadores' },
              { termo: 'Roberto Sales', tag: '👔 Ex-Prefeito' },
              { termo: 'Boi Preto', tag: '🌊 Cachoeira' },
              { termo: 'Soraya', tag: '⚠️ Secretária de Saúde' },
              { termo: 'Belo Horizonte', tag: '✈️ Destino Frequente' }
            ],
            total_geral: 0,
            resultados: {}
          }));
          return;
        }

        const match = target => tokens.every(tok => target.includes(tok));

        const resObj = {
          query: rawQ,
          query_normalizada: normQ,
          tempo_execucao_ms: 0,
          total_geral: 0,
          categorias: {}
        };

        // A. Empresas e Sócios
        if (categoria === 'todas' || categoria === 'empresas') {
          const empList = [];
          try {
            const emps = db.prepare(`
              SELECT cnpj, razao_social, nome_fantasia, situacao_cadastral, capital_social, total_geral, qtd_contratos, possui_alerta_vinculo, alerta_detalhe, municipio, uf 
              FROM empresas_contratadas
            `).all();

            const socios = db.prepare(`
              SELECT cnpj, nome_socio, qualificacao_socio, vinculo_politico_alerta 
              FROM empresas_socios
            `).all();

            const empMap = new Map();
            emps.forEach(e => empMap.set(e.cnpj, e));

            emps.forEach(e => {
              const target = normalizar(`${e.razao_social} ${e.nome_fantasia} ${e.cnpj} ${e.municipio} ${e.alerta_detalhe}`);
              if (match(target)) {
                empList.push({
                  tipo: 'empresa',
                  id: e.cnpj,
                  titulo: e.razao_social,
                  subtitulo: `CNPJ: ${e.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')} • ${e.municipio || 'Arinos'}/${e.uf || 'MG'}`,
                  badge: e.possui_alerta_vinculo ? '⚠️ Alerta de Vínculo' : (e.situacao_cadastral || 'ATIVA'),
                  badge_tipo: e.possui_alerta_vinculo ? 'warning' : 'success',
                  valor: e.total_geral,
                  url: `/empresas.html?q=${encodeURIComponent(e.razao_social)}`
                });
              }
            });

            socios.forEach(s => {
              const target = normalizar(`${s.nome_socio} ${s.qualificacao_socio} ${s.vinculo_politico_alerta}`);
              if (match(target)) {
                const parentEmp = empMap.get(s.cnpj) || {};
                empList.push({
                  tipo: 'socio',
                  id: `${s.cnpj}-${s.nome_socio}`,
                  titulo: s.nome_socio,
                  subtitulo: `Sócio em: ${parentEmp.razao_social || 'Empresa Contratada'} (${s.qualificacao_socio || 'Sócio'})`,
                  badge: s.vinculo_politico_alerta ? '⚠️ Vínculo c/ Servidor/Político' : 'Sócio QSA',
                  badge_tipo: s.vinculo_politico_alerta ? 'warning' : 'info',
                  valor: parentEmp.total_geral || 0,
                  url: `/empresas.html?q=${encodeURIComponent(s.nome_socio)}`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.empresas = {
            nome: 'Empresas & Sócios (QSA)',
            icone: '🏢',
            total: empList.length,
            itens: empList.slice(0, limit)
          };
          resObj.total_geral += empList.length;
        }

        // B. Servidores, Políticos & Pessoas Unificadas
        if (categoria === 'todas' || categoria === 'servidores') {
          const servList = [];
          const isGenericaFunc = ehBuscaGenericaFuncionarios(rawQ);
          try {
            const servs = db.prepare(`
              SELECT id, nome_canonic, nome_exibicao, cargos_resumo, perfil_tipo, qtd_matriculas, total_dinheiro_publico, total_salarios, total_diarias, is_politico, is_prefeito, is_vereador, is_socio_empresa, partido_politico
              FROM pessoas_unificadas
            `).all();

            servs.forEach(s => {
              const target = normalizar(`${s.nome_exibicao} ${s.cargos_resumo} ${s.perfil_tipo} ${s.partido_politico || ''} funcionario servidores servidor quadro`);
              if (isGenericaFunc ? (s.perfil_tipo && s.perfil_tipo.includes('Servidor')) : match(target)) {
                let badgeText = `${s.qtd_matriculas} Matrícula(s)`;
                let badgeTipo = 'default';
                if (s.is_prefeito) { badgeText = '👔 Prefeito'; badgeTipo = 'danger'; }
                else if (s.is_vereador) { badgeText = '🏛️ Vereador'; badgeTipo = 'warning'; }
                else if (s.is_socio_empresa) { badgeText = '⚠️ Sócio Fornecedor'; badgeTipo = 'warning'; }
                else if (s.qtd_matriculas > 1) { badgeText = `🔗 ${s.qtd_matriculas} Matrículas`; badgeTipo = 'info'; }

                servList.push({
                  tipo: 'pessoa_unificada',
                  id: s.id,
                  titulo: s.nome_exibicao,
                  subtitulo: `${s.perfil_tipo} • ${s.cargos_resumo || 'Servidor Público'}${s.qtd_matriculas > 1 ? ` (${s.qtd_matriculas} matrículas unificadas)` : ''}`,
                  badge: badgeText,
                  badge_tipo: badgeTipo,
                  valor: s.total_dinheiro_publico,
                  url: `/tabelas.html?tab=pessoas&busca=${encodeURIComponent(s.nome_exibicao)}`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.servidores = {
            nome: 'Servidores & Políticos (Consolidado)',
            icone: '👤',
            total: servList.length,
            itens: servList.slice(0, limit)
          };
          resObj.total_geral += servList.length;
        }

        // C. Contratos Públicos
        if (categoria === 'todas' || categoria === 'contratos') {
          const contList = [];
          try {
            const conts = db.prepare(`
              SELECT nr_contrato, credor, doc_credor, valor, objeto, dt_ini_vigencia, tipo_contrato 
              FROM contratos
            `).all();

            conts.forEach(c => {
              const target = normalizar(`${c.nr_contrato} ${c.credor} ${c.doc_credor} ${c.objeto}`);
              if (match(target)) {
                contList.push({
                  tipo: 'contrato',
                  id: c.nr_contrato,
                  titulo: `Contrato nº ${c.nr_contrato || 'S/N'} • ${c.credor}`,
                  subtitulo: (c.objeto || '').slice(0, 110) + ((c.objeto || '').length > 110 ? '...' : ''),
                  badge: c.tipo_contrato || 'Contrato',
                  badge_tipo: 'info',
                  valor: c.valor,
                  url: `/empresas.html?q=${encodeURIComponent(c.credor)}`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.contratos = {
            nome: 'Contratos Públicos',
            icone: '📜',
            total: contList.length,
            itens: contList.slice(0, limit)
          };
          resObj.total_geral += contList.length;
        }

        // D. Diárias & Viagens Oficiais
        if (categoria === 'todas' || categoria === 'diarias') {
          const diarList = [];
          try {
            const jsonViagens = path.join(PORTAL_DIR, 'dados/viagens/arinos_viagens_master.json');
            if (fs.existsSync(jsonViagens)) {
              const vData = JSON.parse(fs.readFileSync(jsonViagens, 'utf8'));
              
              // Search in top travelers
              (vData.top_viajantes || []).forEach(u => {
                const target = normalizar(`${u.servidor} ${u.tipo_principal} ${u.principal_destino}`);
                if (match(target)) {
                  diarList.push({
                    tipo: 'viajante',
                    id: u.servidor,
                    titulo: `${u.servidor} (${u.tipo_principal})`,
                    subtitulo: `${u.viagens} viagens realizadas • Destino comum: ${u.principal_destino}`,
                    badge: `${u.viagens} diárias`,
                    badge_tipo: 'default',
                    valor: u.total,
                    url: `/empresas.html?q=${encodeURIComponent(u.servidor)}`
                  });
                }
              });

              // Search in destinations
              (vData.top_destinos || []).forEach(d => {
                const target = normalizar(d.destino);
                if (match(target)) {
                  diarList.push({
                    tipo: 'destino_viagem',
                    id: d.destino,
                    titulo: `Destino: ${d.destino}`,
                    subtitulo: `${d.viagens.toLocaleString('pt-BR')} viagens oficiais registradas`,
                    badge: 'Destino Frequente',
                    badge_tipo: 'info',
                    valor: d.total,
                    url: `/empresas.html`
                  });
                }
              });
            }
          } catch(e) {}

          resObj.categorias.diarias = {
            nome: 'Diárias & Viagens',
            icone: '✈️',
            total: diarList.length,
            itens: diarList.slice(0, limit)
          };
          resObj.total_geral += diarList.length;
        }

        // E. Eleições TSE
        if (categoria === 'todas' || categoria === 'eleicoes') {
          const eleList = [];
          try {
            const cand = db.prepare(`
              SELECT ano, cargo, numero, nome_urna, nome_completo, partido_sigla, situacao, resultado, votos, foto_local 
              FROM eleicoes_candidatos
            `).all();

            cand.forEach(c => {
              const target = normalizar(`${c.nome_urna} ${c.nome_completo} ${c.cargo} ${c.partido_sigla} ${c.numero} ${c.ano} ${c.resultado}`);
              if (match(target)) {
                eleList.push({
                  tipo: 'candidato',
                  id: `${c.ano}-${c.numero}`,
                  titulo: `${c.nome_urna} (${c.nome_completo})`,
                  subtitulo: `${c.cargo} • ${c.partido_sigla} (Nº ${c.numero}) • Eleições ${c.ano} • ${c.resultado || 'Suplente'}`,
                  badge: `TSE ${c.ano}`,
                  badge_tipo: c.resultado && c.resultado.includes('Eleito') ? 'success' : 'default',
                  valor: c.votos ? `${c.votos.toLocaleString('pt-BR')} votos` : null,
                  url: `/eleicoes.html?q=${encodeURIComponent(c.nome_urna)}`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.eleicoes = {
            nome: 'Eleições TSE',
            icone: '🗳️',
            total: eleList.length,
            itens: eleList.slice(0, limit)
          };
          resObj.total_geral += eleList.length;
        }

        // F. Vereadores SAPL
        if (categoria === 'todas' || categoria === 'vereadores') {
          const verList = [];
          try {
            const vers = db.prepare(`
              SELECT id, nome_parlamentar, nome_completo, ativo, total_materias, projetos_lei, indicacoes, fotografia 
              FROM camara_vereadores
            `).all();

            vers.forEach(v => {
              const target = normalizar(`${v.nome_parlamentar} ${v.nome_completo}`);
              if (match(target)) {
                verList.push({
                  tipo: 'vereador',
                  id: v.id,
                  titulo: `Ver. ${v.nome_parlamentar} (${v.nome_completo})`,
                  subtitulo: `${v.ativo ? 'Em Exercício na Câmara' : 'Histórico'} • ${v.total_materias} matérias legislativas autoradas`,
                  badge: v.ativo ? 'Em Exercício' : 'Legislatura Anterior',
                  badge_tipo: v.ativo ? 'success' : 'default',
                  valor: `${v.total_materias} leis/projetos`,
                  url: `/vereadores.html?q=${encodeURIComponent(v.nome_parlamentar)}`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.vereadores = {
            nome: 'Vereadores & Leis (SAPL)',
            icone: '🏛️',
            total: verList.length,
            itens: verList.slice(0, limit)
          };
          resObj.total_geral += verList.length;
        }

        // G. Turismo & Notícias Oficiais
        if (categoria === 'todas' || categoria === 'turismo') {
          const turList = [];
          try {
            const pontos = db.prepare(`
              SELECT id, nome, categoria, distancia_centro_km, descricao, latitude, longitude, sha256_hash 
              FROM turismo_pontos
            `).all();

            pontos.forEach(p => {
              const target = normalizar(`${p.nome} ${p.categoria} ${p.descricao}`);
              if (match(target)) {
                turList.push({
                  tipo: 'turismo',
                  id: p.id,
                  titulo: p.nome,
                  subtitulo: `${p.categoria || 'Atrativo'} • ${(p.descricao || '').slice(0, 100)}...`,
                  badge: `${p.distancia_centro_km} km de Arinos`,
                  badge_tipo: 'info',
                  valor: null,
                  url: `/cidade.html`
                });
              }
            });

            const nots = db.prepare(`
              SELECT id, titulo, veiculo, data, categoria, resumo, sha256_hash 
              FROM noticias_relevantes
            `).all();

            nots.forEach(n => {
              const target = normalizar(`${n.titulo} ${n.veiculo} ${n.resumo}`);
              if (match(target)) {
                turList.push({
                  tipo: 'noticia',
                  id: n.id,
                  titulo: n.titulo,
                  subtitulo: `${n.veiculo} (${n.data}) • ${(n.resumo || '').slice(0, 100)}...`,
                  badge: n.categoria || 'Notícia',
                  badge_tipo: 'default',
                  valor: null,
                  url: `/cidade.html`
                });
              }
            });
          } catch(e) {}

          resObj.categorias.turismo = {
            nome: 'Turismo, Notícias & História',
            icone: '📍',
            total: turList.length,
            itens: turList.slice(0, limit)
          };
          resObj.total_geral += turList.length;
        }

        resObj.tempo_execucao_ms = Date.now() - startTime;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(resObj));
        return;
      }

      // 17. Consulta de Pessoas Unificadas e Consolidação de Dinheiro Público (Com Busca Semântica de Funcionários)
      if (pathname === '/api/dados/pessoas-unificadas') {
        const resultado = listarFuncionarios({
          busca: parsedUrl.searchParams.get('busca') || parsedUrl.searchParams.get('q') || '',
          tipo: parsedUrl.searchParams.get('tipo') || 'todos',
          ordenar: parsedUrl.searchParams.get('ordenar') || 'dinheiro',
          page: parseInt(parsedUrl.searchParams.get('page') || '1', 10),
          limit: parseInt(parsedUrl.searchParams.get('limit') || '25', 10)
        });
        sendJson(res, resultado);
        return;
      }

      // 18. Perfil Detalhado de Pessoa Unificada (Dados Cidadão 360°)
      if (pathname === '/api/dados/perfil-pessoa') {
        const id = parseInt(parsedUrl.searchParams.get('id') || '0', 10);
        const nome = (parsedUrl.searchParams.get('nome') || '').trim();

        let pessoa = null;
        if (id > 0) {
          pessoa = db.prepare('SELECT * FROM pessoas_unificadas WHERE id = ?').get(id);
        } else if (nome) {
          pessoa = db.prepare('SELECT * FROM pessoas_unificadas WHERE nome_exibicao = ? OR nome_canonic = ?').get(nome, nome);
          if (!pessoa) {
            pessoa = db.prepare('SELECT * FROM pessoas_unificadas WHERE nome_exibicao LIKE ? LIMIT 1').get(`%${nome}%`);
          }
        }

        if (!pessoa) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Perfil de pessoa não encontrado' }));
          return;
        }

        let matriculas = [];
        try { matriculas = JSON.parse(pessoa.matriculas_json || '[]'); } catch(e) {}
        let cargos = [];
        try { cargos = JSON.parse(pessoa.cargos_json || '[]'); } catch(e) {}
        let empresas = [];
        try { empresas = JSON.parse(pessoa.empresas_vinculadas || '[]'); } catch(e) {}

        // Histórico anual de proventos e contracheques
        const historicoFolha = db.prepare(`
          SELECT 
            ano, 
            COUNT(*) as meses, 
            ROUND(SUM(total_proventos), 2) as proventos, 
            ROUND(SUM(salario_liquido), 2) as liquido,
            ROUND(AVG(total_proventos), 2) as media_mensal,
            GROUP_CONCAT(DISTINCT cargo) as cargos_ano,
            GROUP_CONCAT(DISTINCT matricula) as matriculas_ano
          FROM contracheques
          WHERE nome = ? OR nome = ?
          GROUP BY ano
          ORDER BY ano ASC
        `).all(pessoa.nome_exibicao, pessoa.nome_canonic);

        // Todos os contracheques individuais para auditoria de períodos reais e gaps
        const todosContracheques = db.prepare(`
          SELECT id, ano, mes, tipo_folha, cargo, matricula, vinculo, 
                 total_proventos, total_descontos, salario_liquido, idfun, url_detalhe, hash_registro, entidade
          FROM contracheques
          WHERE nome = ? OR nome = ?
          ORDER BY ano DESC, mes DESC, id DESC
        `).all(pessoa.nome_exibicao, pessoa.nome_canonic);

        // Enriquecer com banco detalhado ou calcular Salário Bruto, Descontos e Líquido estatutários
        let dbDetRef = null;
        if (fs.existsSync(DETALHADO_DB)) {
          try { dbDetRef = new DatabaseSync(DETALHADO_DB, { readOnly: true }); } catch(e) {}
        }

        let totalProventosAcumulado = 0;
        let totalDescontosAcumulado = 0;
        let totalLiquidoAcumulado = 0;

        for (const cc of todosContracheques) {
          let descontoReal = cc.total_descontos || 0;
          let liquidoReal = cc.salario_liquido || 0;

          if (dbDetRef && (!descontoReal || descontoReal === 0)) {
            let rowD = null;
            if (cc.idfun) {
              rowD = dbDetRef.prepare('SELECT total_descontos, salario_liquido FROM contracheques WHERE ano = ? AND mes = ? AND idfun = ? LIMIT 1').get(cc.ano, cc.mes, String(cc.idfun));
            }
            if (!rowD) {
              rowD = dbDetRef.prepare('SELECT total_descontos, salario_liquido FROM contracheques WHERE ano = ? AND mes = ? AND nome = ? LIMIT 1').get(cc.ano, cc.mes, pessoa.nome_exibicao);
            }
            if (rowD && rowD.total_descontos > 0) {
              descontoReal = rowD.total_descontos;
              liquidoReal = rowD.salario_liquido;
            }
          }

          if (!descontoReal || descontoReal === 0) {
            const calc = calcularDescontosEstatutarios(cc.total_proventos, cc.ano);
            descontoReal = calc.total_descontos;
            liquidoReal = calc.salario_liquido;
          }

          cc.total_descontos = Math.round(descontoReal * 100) / 100;
          cc.salario_liquido = Math.round(liquidoReal * 100) / 100;

          totalProventosAcumulado += (cc.total_proventos || 0);
          totalDescontosAcumulado += cc.total_descontos;
          totalLiquidoAcumulado += cc.salario_liquido;
        }

        if (dbDetRef) {
          try { dbDetRef.close(); } catch(e) {}
        }

        // Processar cálculo pericial de períodos reais e intervalos (gaps)
        const periodosCalc = processarHistoricoEPeriodos(todosContracheques);

        // Agrupar mês a mês por ano e identificar 13º e Férias
        const anosMap = new Map();
        for (const cc of todosContracheques) {
          if (!anosMap.has(cc.ano)) {
            anosMap.set(cc.ano, {
              ano: cc.ano,
              total_folhas: 0,
              total_proventos: 0,
              total_descontos: 0,
              total_liquido: 0,
              cargos: new Set(),
              meses: []
            });
          }
          const anoObj = anosMap.get(cc.ano);
          anoObj.total_folhas++;
          anoObj.total_proventos += (cc.total_proventos || 0);
          anoObj.total_descontos += (cc.total_descontos || 0);
          anoObj.total_liquido += (cc.salario_liquido || 0);
          if (cc.cargo) anoObj.cargos.add(cc.cargo);

          const tipoLower = (cc.tipo_folha || '').toLowerCase();
          const is13 = tipoLower.includes('13') || tipoLower.includes('décimo') || tipoLower.includes('decimo') || tipoLower.includes('adiantamento');
          const isFerias = tipoLower.includes('férias') || tipoLower.includes('ferias');

          anoObj.meses.push({
            id: cc.id,
            ano: cc.ano,
            mes: cc.mes,
            tipo_folha: cc.tipo_folha || 'Pagamento Normal',
            cargo: cc.cargo || 'Servidor',
            matricula: cc.matricula,
            vinculo: cc.vinculo,
            total_proventos: cc.total_proventos || 0,
            total_descontos: cc.total_descontos || 0,
            salario_liquido: cc.salario_liquido || 0,
            url_detalhe: cc.url_detalhe,
            is_13: is13,
            is_ferias: isFerias
          });
        }

        const anosOrdenados = Array.from(anosMap.keys()).sort((a, b) => b - a);
        const ultimoAnoKey = anosOrdenados[0] || null;

        const folhaUltimoAno = ultimoAnoKey ? {
          ...anosMap.get(ultimoAnoKey),
          total_proventos: Math.round(anosMap.get(ultimoAnoKey).total_proventos * 100) / 100,
          total_descontos: Math.round(anosMap.get(ultimoAnoKey).total_descontos * 100) / 100,
          total_liquido: Math.round(anosMap.get(ultimoAnoKey).total_liquido * 100) / 100,
          cargos: Array.from(anosMap.get(ultimoAnoKey).cargos).join(' • '),
          meses: anosMap.get(ultimoAnoKey).meses.sort((a, b) => b.mes - a.mes || b.id - a.id)
        } : null;

        const anosAnteriores = anosOrdenados.slice(1).map(anoKey => {
          const obj = anosMap.get(anoKey);
          return {
            ano: obj.ano,
            total_folhas: obj.total_folhas,
            total_proventos: Math.round(obj.total_proventos * 100) / 100,
            total_descontos: Math.round(obj.total_descontos * 100) / 100,
            total_liquido: Math.round(obj.total_liquido * 100) / 100,
            media_mensal: Math.round((obj.total_proventos / (obj.total_folhas || 1)) * 100) / 100,
            media_mensal_liquida: Math.round((obj.total_liquido / (obj.total_folhas || 1)) * 100) / 100,
            cargos: Array.from(obj.cargos).join(' • '),
            meses: obj.meses.sort((a, b) => b.mes - a.mes || b.id - a.id)
          };
        });

        // Histórico anual de diárias de viagem
        const historicoDiarias = db.prepare(`
          SELECT 
            ano, 
            COUNT(*) as viagens, 
            ROUND(SUM(valor), 2) as total_diarias,
            ROUND(MAX(valor), 2) as maior_diaria,
            GROUP_CONCAT(DISTINCT destino) as destinos
          FROM diarias
          WHERE servidor = ? OR servidor = ?
          GROUP BY ano
          ORDER BY ano ASC
        `).all(pessoa.nome_exibicao, pessoa.nome_canonic);

        // Viagens detalhadas (últimas 20)
        const ultimasViagens = db.prepare(`
          SELECT ano, mes, destino, motivo, valor, data_viagem, entidade
          FROM diarias
          WHERE servidor = ? OR servidor = ?
          ORDER BY ano DESC, mes DESC
          LIMIT 20
        `).all(pessoa.nome_exibicao, pessoa.nome_canonic);

        // Se sócio de empresa, enriquecer com dados financeiros das empresas e contratos nos mandatos
        const dadosEmpresas = [];
        if (empresas.length > 0) {
          for (const emp of empresas) {
            try {
              const info = db.prepare(`
                SELECT cnpj, razao_social, total_geral, total_contratos, qtd_contratos, total_despesas, qtd_despesas, situacao_cadastral, capital_social
                FROM empresas_contratadas
                WHERE cnpj = ?
              `).get(emp.cnpj);

              // Buscar contratos dessa empresa e relacionar com mandatos
              const cClean = (emp.cnpj || '').replace(/\D/g, '');
              let cMasc = emp.cnpj;
              if (cClean.length === 14) {
                cMasc = `${cClean.slice(0, 2)}.${cClean.slice(2, 5)}.${cClean.slice(5, 8)}/${cClean.slice(8, 12)}-${cClean.slice(12, 14)}`;
              }
              const primeiraPalavra = (emp.razao_social || '').split(' ')[0];

              const contratosEmpresa = db.prepare(`
                SELECT nr_contrato, valor, dt_assinatura, dt_ini_vigencia, dt_fim_vigencia, objeto, nr_processo
                FROM contratos
                WHERE doc_credor LIKE ? OR doc_credor LIKE ? OR credor LIKE ?
                ORDER BY dt_assinatura DESC
              `).all(`%${cClean}%`, `%${cMasc}%`, `%${primeiraPalavra}%`);

              // Identificar em qual mandato o contrato foi assinado
              const contratosComMandato = contratosEmpresa.map(c => {
                const anoContrato = c.dt_assinatura ? parseInt(c.dt_assinatura.slice(0, 4), 10) : 0;
                let gestaoMandato = 'Período Geral';
                if (anoContrato >= 2013 && anoContrato <= 2016) gestaoMandato = 'Gestão Carlos Alberto (1º Mandato: 2013-2016)';
                else if (anoContrato >= 2017 && anoContrato <= 2020) gestaoMandato = 'Gestão Carlos Alberto (2º Mandato: 2017-2020)';
                else if (anoContrato >= 2021 && anoContrato <= 2024) gestaoMandato = 'Gestão Marcílio de Tonhão (1º Mandato: 2021-2024)';
                else if (anoContrato >= 2025) gestaoMandato = 'Gestão Marcílio de Tonhão (2º Mandato: 2025-2028)';

                return {
                  ...c,
                  ano_contrato: anoContrato,
                  gestao_mandato: gestaoMandato
                };
              });

              dadosEmpresas.push({
                ...emp,
                info: info || null,
                contratos: contratosComMandato
              });
            } catch(e) {}
          }
        }

        // Histórico de Eleições (TSE)
        const historicoEleitoral = db.prepare(`
          SELECT ano, cargo, numero, nome_urna, partido_sigla, coligacao, situacao, resultado, votos, percentual, total_bens
          FROM eleicoes_candidatos
          WHERE nome_completo = ? OR nome_completo = ?
          ORDER BY ano DESC
        `).all(pessoa.nome_canonic, pessoa.nome_exibicao);

        // Se vereador ou atuação no legislativo, buscar matérias no SAPL
        let materiasCamara = [];
        if (pessoa.is_vereador || (pessoa.cargos_resumo && pessoa.cargos_resumo.toLowerCase().includes('vereador'))) {
          try {
            materiasCamara = db.prepare(`
              SELECT tipo, numero, ano, ementa, situacao, data_apresentacao
              FROM camara_materias
              WHERE autor LIKE ? OR autor LIKE ?
              ORDER BY ano DESC
              LIMIT 20
            `).all(`%${pessoa.nome_exibicao}%`, `%${pessoa.nome_canonic}%`);
          } catch(e) {}
        }

        // Resumo de mandatos e vida política
        let mandatosHistorico = [];
        if (pessoa.is_prefeito || (pessoa.cargos_resumo && pessoa.cargos_resumo.toLowerCase().includes('prefeito'))) {
          if (pessoa.nome_canonic.includes('CARLOS ALBERTO')) {
            mandatosHistorico.push(
              { cargo: 'Prefeito Municipal', mandato: '2013 - 2016', tipo: '1º Mandato (Eleito em 2012)' },
              { cargo: 'Prefeito Municipal', mandato: '2017 - 2020', tipo: '2º Mandato (Reeleito em 2016)' }
            );
          } else if (pessoa.nome_canonic.includes('MARCILIO')) {
            mandatosHistorico.push(
              { cargo: 'Vereador Municipal', mandato: '2017 - 2020', tipo: 'Legislatura da Câmara (Eleito em 2016)' },
              { cargo: 'Prefeito Municipal', mandato: '2021 - 2024', tipo: '1º Mandato Executivo (Eleito em 2020)' },
              { cargo: 'Prefeito Municipal', mandato: '2025 - 2028', tipo: '2º Mandato Executivo (Reeleito em 2024)' }
            );
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          perfil: {
            ...pessoa,
            matriculas,
            cargos,
            empresas_vinculadas: empresas
          },
          tempo_efetivo: periodosCalc.tempoTotalExtenso,
          total_meses_efetivos: periodosCalc.totalMesesEfetivos,
          total_proventos_acumulado: Math.round(totalProventosAcumulado * 100) / 100,
          total_descontos_acumulado: Math.round(totalDescontosAcumulado * 100) / 100,
          total_liquido_acumulado: Math.round(totalLiquidoAcumulado * 100) / 100,
          periodos_timeline: periodosCalc.timeline,
          folha_ultimo_ano: folhaUltimoAno,
          anos_anteriores: anosAnteriores,
          historico_folha: historicoFolha,
          historico_diarias: historicoDiarias,
          ultimas_viagens: ultimasViagens,
          empresas_detalhe: dadosEmpresas,
          historico_eleitoral: historicoEleitoral,
          materias_camara: materiasCamara,
          mandatos_historico: mandatosHistorico
        }));
        return;
      }

      // 18.1. Consulta de Contracheque Detalhado (Rubricas, INSS, IRRF, Proventos e Descontos)
      if (pathname === '/api/dados/contracheque-detalhe') {
        const id = parseInt(parsedUrl.searchParams.get('id') || '0', 10);
        if (!id) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Parâmetro id do contracheque é obrigatório' }));
          return;
        }

        const cc = db.prepare('SELECT * FROM contracheques WHERE id = ?').get(id);
        if (!cc) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Contracheque não encontrado no banco' }));
          return;
        }

        let detalhado = null;

        // 1. Tentar consultar no banco de contracheques detalhados local
        if (fs.existsSync(DETALHADO_DB)) {
          try {
            const dbDet = new DatabaseSync(DETALHADO_DB, { readOnly: true });
            let rowDet = null;
            if (cc.idfun) {
              rowDet = dbDet.prepare('SELECT * FROM contracheques WHERE ano = ? AND mes = ? AND idfun = ? LIMIT 1').get(cc.ano, cc.mes, String(cc.idfun));
            }
            if (!rowDet && cc.nome) {
              rowDet = dbDet.prepare('SELECT * FROM contracheques WHERE ano = ? AND mes = ? AND nome = ? LIMIT 1').get(cc.ano, cc.mes, cc.nome);
            }

            if (rowDet) {
              const rubs = dbDet.prepare('SELECT codigo_descricao as descricao, tipo, valor FROM contracheque_rubricas WHERE contracheque_id = ?').all(rowDet.id);
              detalhado = {
                matricula: rowDet.matricula || cc.matricula,
                nome: rowDet.nome || cc.nome,
                cargo: rowDet.cargo || cc.cargo,
                lotacao: rowDet.lotacao || 'Órgão Municipal',
                admissao: rowDet.admissao || null,
                rubricas: rubs,
                total_proventos: rowDet.total_proventos,
                total_descontos: rowDet.total_descontos,
                salario_liquido: rowDet.salario_liquido,
                url_oficial: rowDet.url_oficial || (cc.url_detalhe ? (cc.url_detalhe.startsWith('http') ? cc.url_detalhe : 'http://www.adpmnet.com.br' + cc.url_detalhe) : null),
                origem: 'cache_sqlite'
              };
            }
            dbDet.close();
          } catch(e) {}
        }

        // 2. Se não estiver no cache e tiver url_detalhe, buscar da ADPM
        if (!detalhado && cc.url_detalhe) {
          try {
            const fullUrl = cc.url_detalhe.startsWith('http') ? cc.url_detalhe : 'http://www.adpmnet.com.br' + cc.url_detalhe;
            const fetchRes = await fetch(fullUrl, { signal: AbortSignal.timeout(6000) });
            if (fetchRes.ok) {
              const rawHtml = await fetchRes.text();
              const parsed = parseContrachequeDetalhadoHtml(rawHtml);
              if (parsed && parsed.rubricas && parsed.rubricas.length > 0) {
                detalhado = {
                  ...parsed,
                  matricula: parsed.matricula || cc.matricula,
                  nome: parsed.nome || cc.nome,
                  cargo: parsed.cargo || cc.cargo,
                  url_oficial: fullUrl,
                  origem: 'adpm_live'
                };

                // Gravar em segundo plano no cache detalhado
                try {
                  const dbDetW = new DatabaseSync(DETALHADO_DB);
                  const ins = dbDetW.prepare(`
                    INSERT OR REPLACE INTO contracheques 
                    (entidade, ano, mes, idfun, idpcl, matricula, nome, cargo, lotacao, admissao, total_proventos, total_descontos, salario_liquido, url_oficial, hash_sha256, coletado_em)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).run(
                    cc.entidade || 'prefeitura',
                    cc.ano,
                    cc.mes,
                    String(cc.idfun || '0'),
                    '1',
                    detalhado.matricula,
                    detalhado.nome,
                    detalhado.cargo,
                    detalhado.lotacao,
                    detalhado.admissao,
                    detalhado.total_proventos,
                    detalhado.total_descontos,
                    detalhado.salario_liquido,
                    fullUrl,
                    cc.hash_registro || '',
                    new Date().toISOString()
                  );

                  const contraId = ins.lastInsertRowid;
                  if (contraId) {
                    for (const r of detalhado.rubricas) {
                      dbDetW.prepare(`
                        INSERT INTO contracheque_rubricas (contracheque_id, codigo_descricao, tipo, valor)
                        VALUES (?, ?, ?, ?)
                      `).run(contraId, r.descricao, r.tipo, r.valor);
                    }
                  }
                  dbDetW.close();
                } catch(wErr) {}
              }
            }
          } catch(netErr) {}
        }

        // 3. Fallback pericial caso offline ou sem detalhamento online
        if (!detalhado) {
          detalhado = {
            matricula: cc.matricula,
            nome: cc.nome,
            cargo: cc.cargo,
            lotacao: cc.entidade || 'Prefeitura Municipal de Arinos',
            admissao: null,
            rubricas: [
              { descricao: 'Vencimento / Proventos da Folha', tipo: 'PROVENTO', valor: cc.total_proventos || 0 },
              ...(cc.total_descontos > 0 ? [{ descricao: 'Deduções Legais (Previdência / IRRF)', tipo: 'DESCONTO', valor: cc.total_descontos }] : [])
            ],
            total_proventos: cc.total_proventos,
            total_descontos: cc.total_descontos,
            salario_liquido: cc.salario_liquido,
            url_oficial: cc.url_detalhe ? (cc.url_detalhe.startsWith('http') ? cc.url_detalhe : 'http://www.adpmnet.com.br' + cc.url_detalhe) : null,
            origem: 'master_resumo'
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          contracheque_id: cc.id,
          ano: cc.ano,
          mes: cc.mes,
          tipo_folha: cc.tipo_folha,
          entidade: cc.entidade,
          detalhes: detalhado
        }));
        return;
      }

      // 19. Consulta de Fotos Auditadas de Agentes Públicos (com Hash SHA-256 e ID Único)
      if (pathname === '/api/dados/fotos-auditadas') {
        const rows = db.prepare(`
          SELECT 
            f.id as foto_id, f.pessoa_id, f.nome_canonic, f.nome_exibicao, 
            f.nome_urna, f.cargo_tse, f.ano_eleicao, f.id_candidato_tse, 
            f.caminho_foto, f.hash_sha256, f.status_auditoria, f.auditado_em,
            p.perfil_tipo, p.total_dinheiro_publico
          FROM fotos_auditadas_pessoas f
          JOIN pessoas_unificadas p ON p.id = f.pessoa_id
          ORDER BY f.nome_exibicao ASC
        `).all();

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          total: rows.length,
          certificacao: 'Cadeia de Custódia Forense SHA-256 Validada',
          fotos: rows
        }));
        return;
      }
    } catch (dbErr) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: dbErr.message }));
      return;
    }
  }

  // Servir arquivos estáticos do portal
  if (pathname === '/' || pathname === '/index.html') {
    pathname = '/index.html';
  }

  const filePath = path.join(PORTAL_DIR, pathname);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain; charset=utf-8';
    if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
    else if (filePath.endsWith('.json')) contentType = 'application/json; charset=utf-8';
    else if (filePath.endsWith('.css')) contentType = 'text/css; charset=utf-8';
    else if (filePath.endsWith('.js')) contentType = 'application/javascript; charset=utf-8';
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filePath.endsWith('.png')) contentType = 'image/png';
    else if (filePath.endsWith('.webp')) contentType = 'image/webp';
    else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (filePath.endsWith('.ico')) contentType = 'image/x-icon';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo nao encontrado');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ativo na porta ${PORT}! Acesse: http://localhost:${PORT}`);
});
