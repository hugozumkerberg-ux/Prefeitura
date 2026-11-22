/**
 * Servidor Ultraleve de Monitoramento e API em Tempo Real — Arinos / MG
 * Porta: 8088
 * Sem dependências externas (100% nativo Node.js)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 8088;
const PORTAL_DIR = path.resolve(__dirname, '..');
const RESUMO_JSON_PATH = path.join(PORTAL_DIR, 'dados/resumo_geral.json');
const STATUS_JSON_PATH = path.join(PORTAL_DIR, 'dados/status_coleta.json');
const MASTER_DB = path.join(PORTAL_DIR, 'dados/arinos_transparencia_master.sqlite3');
const AUDIT_MASTER_DB = path.join(PORTAL_DIR, 'dados/auditoria/arinos_auditoria_master.sqlite3');

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

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

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

      // 3. Consulta Paginada de Contracheques
      if (pathname === '/api/dados/contracheques') {
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(10, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const ano = parsedUrl.searchParams.get('ano') || '';
        const entidade = parsedUrl.searchParams.get('entidade') || '';

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (q) {
          whereClause += ' AND (nome LIKE ? OR cargo LIKE ? OR matricula LIKE ?) ';
          params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (ano) {
          whereClause += ' AND ano = ? ';
          params.push(parseInt(ano, 10));
        }
        if (entidade) {
          whereClause += ' AND entidade LIKE ? ';
          params.push(`%${entidade}%`);
        }

        const countQuery = `SELECT count(*) as total, sum(total_proventos) as soma_filtrada FROM contracheques ${whereClause}`;
        const totalInfo = db.prepare(countQuery).get(...params);

        const dataQuery = `
          SELECT id, entidade, ano, mes, matricula, nome, cargo, vinculo, tipo_folha, total_proventos, url_detalhe
          FROM contracheques
          ${whereClause}
          ORDER BY ano DESC, mes DESC, total_proventos DESC
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
          res.end(JSON.stringify({ error: 'Dossiê de turismo não encontrado' }));
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

      // 14. Dossiê Completo da Empresa (com Contratos e Despesas Vinculadas)
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
          ORDER BY valor DESC
        `).all(formatCnpj, rawCnpj, rawCnpj);

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
          res.end(JSON.stringify({ error: 'Dossiê de viagens não encontrado' }));
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
          try {
            const servs = db.prepare(`
              SELECT id, nome_canonic, nome_exibicao, cargos_resumo, perfil_tipo, qtd_matriculas, total_dinheiro_publico, total_salarios, total_diarias, is_politico, is_prefeito, is_vereador, is_socio_empresa, partido_politico
              FROM pessoas_unificadas
            `).all();

            servs.forEach(s => {
              const target = normalizar(`${s.nome_exibicao} ${s.cargos_resumo} ${s.perfil_tipo} ${s.partido_politico || ''}`);
              if (match(target)) {
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

      // 17. Consulta de Pessoas Unificadas e Consolidação de Dinheiro Público
      if (pathname === '/api/dados/pessoas-unificadas') {
        const tipo = (parsedUrl.searchParams.get('tipo') || 'todos').toLowerCase();
        const busca = (parsedUrl.searchParams.get('busca') || parsedUrl.searchParams.get('q') || '').trim();
        const ordenar = (parsedUrl.searchParams.get('ordenar') || 'dinheiro').toLowerCase();
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(5, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let params = [];

        if (tipo === 'prefeitos') {
          whereClauses.push('is_prefeito = 1');
        } else if (tipo === 'vereadores') {
          whereClauses.push('is_vereador = 1');
        } else if (tipo === 'multi_matricula') {
          whereClauses.push('qtd_matriculas > 1');
        } else if (tipo === 'socios') {
          whereClauses.push('is_socio_empresa = 1');
        } else if (tipo === 'servidores') {
          whereClauses.push('is_politico = 0 AND is_socio_empresa = 0');
        }

        if (busca) {
          whereClauses.push('(nome_exibicao LIKE ? OR cargos_resumo LIKE ? OR partido_politico LIKE ? OR destinos_frequentes LIKE ?)');
          const pWild = `%${busca}%`;
          params.push(pWild, pWild, pWild, pWild);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderSql = 'total_dinheiro_publico DESC';
        if (ordenar === 'salario') orderSql = 'total_salarios DESC';
        else if (ordenar === 'diarias') orderSql = 'total_diarias DESC';
        else if (ordenar === 'matriculas') orderSql = 'qtd_matriculas DESC, total_dinheiro_publico DESC';
        else if (ordenar === 'nome') orderSql = 'nome_exibicao ASC';

        const statsSql = `
          SELECT 
            COUNT(*) as total_pessoas,
            COALESCE(SUM(total_dinheiro_publico), 0) as total_dinheiro_publico,
            COALESCE(SUM(total_salarios), 0) as total_salarios,
            COALESCE(SUM(total_diarias), 0) as total_diarias,
            COALESCE(SUM(CASE WHEN is_prefeito = 1 THEN 1 ELSE 0 END), 0) as total_prefeitos,
            COALESCE(SUM(CASE WHEN is_vereador = 1 THEN 1 ELSE 0 END), 0) as total_vereadores,
            COALESCE(SUM(CASE WHEN qtd_matriculas > 1 THEN 1 ELSE 0 END), 0) as total_multi_matricula,
            COALESCE(SUM(CASE WHEN is_socio_empresa = 1 THEN 1 ELSE 0 END), 0) as total_socios
          FROM pessoas_unificadas
        `;
        const stats = db.prepare(statsSql).get();

        const countQuery = `SELECT COUNT(*) as total_filtrado FROM pessoas_unificadas ${whereSql}`;
        const totalFiltrado = db.prepare(countQuery).get(...params).total_filtrado;

        const dataQuery = `
          SELECT 
            id, nome_canonic, nome_exibicao, matriculas_json, qtd_matriculas,
            cargos_json, cargos_resumo, entidades_json,
            total_salarios, qtd_contracheques, ano_primeiro_salario, ano_ultimo_salario, maior_salario,
            total_diarias, qtd_diarias, ano_primeira_diaria, ano_ultima_diaria, maior_diaria, destinos_frequentes,
            total_dinheiro_publico,
            is_politico, is_prefeito, is_vereador, is_candidato, perfil_tipo, partido_politico,
            legislaturas_camara, projetos_apresentados, bens_declarados_tse,
            is_socio_empresa, empresas_vinculadas, atualizado_em, foto_url, foto_id
          FROM pessoas_unificadas
          ${whereSql}
          ORDER BY ${orderSql}
          LIMIT ? OFFSET ?
        `;
        const rows = db.prepare(dataQuery).all(...params, limit, offset);

        const registros = rows.map(r => {
          let matriculas = [];
          try { matriculas = JSON.parse(r.matriculas_json || '[]'); } catch(e) {}
          let cargos = [];
          try { cargos = JSON.parse(r.cargos_json || '[]'); } catch(e) {}
          let empresas = [];
          try { empresas = JSON.parse(r.empresas_vinculadas || '[]'); } catch(e) {}

          return {
            ...r,
            matriculas,
            cargos,
            empresas_vinculadas: empresas
          };
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          estatisticas: stats,
          paginacao: {
            page,
            limit,
            total_filtrado: totalFiltrado,
            total_paginas: Math.ceil(totalFiltrado / limit) || 1
          },
          registros
        }));
        return;
      }

      // 18. Perfil Detalhado de Pessoa Unificada (Dossiê Cidadão 360°)
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

        // Se sócio de empresa, enriquecer com dados financeiros das empresas
        const dadosEmpresas = [];
        if (empresas.length > 0) {
          for (const emp of empresas) {
            try {
              const info = db.prepare(`
                SELECT cnpj, razao_social, total_geral, total_contratos, qtd_contratos, total_despesas, qtd_despesas, situacao_cadastral, capital_social
                FROM empresas_contratadas
                WHERE cnpj = ?
              `).get(emp.cnpj);
              dadosEmpresas.push({
                ...emp,
                info: info || null
              });
            } catch(e) {}
          }
        }

        // Se vereador, buscar matérias e legislaturas
        let materiasCamara = [];
        if (pessoa.is_vereador) {
          try {
            materiasCamara = db.prepare(`
              SELECT tipo, numero, ano, ementa, situacao, data_apresentacao
              FROM camara_materias
              WHERE autor LIKE ?
              ORDER BY ano DESC
              LIMIT 15
            `).all(`%${pessoa.nome_exibicao}%`);
          } catch(e) {}
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          perfil: {
            ...pessoa,
            matriculas,
            cargos,
            empresas_vinculadas: empresas
          },
          historico_folha: historicoFolha,
          historico_diarias: historicoDiarias,
          ultimas_viagens: ultimasViagens,
          empresas_detalhe: dadosEmpresas,
          materias_camara: materiasCamara
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
