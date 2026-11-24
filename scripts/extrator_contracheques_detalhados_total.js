/**
 * ==============================================================================
 * MOTOR DE EXTRAÇÃO FORENSE TOTAL — CONTRACHEQUES DETALHADOS COM RUBRICAS
 * SIAP / MG CIDADES — PREFEITURA MUNICIPAL DE ARINOS / MG (2006 A 2026)
 * ==============================================================================
 * Extrai linha a linha cada provento, desconto e holerite individual:
 * 1. Folha Mensal: https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha
 * 2. Rubricas Detalhadas: https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave={chave}
 * 
 * Alta Performance & Governança de Dados:
 * - Direct-to-SQLite nativo via node:sqlite (DatabaseSync) em WAL mode.
 * - Pool Concorrente de Alta Velocidade (8 workers simultâneos).
 * - Totalmente Retomável: Pula contracheques que já possuem rubricas detalhadas.
 * - Transações Atômicas em Lote para máxima taxa de escrita em disco.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DADOS_DIR = path.join(BASE_DIR, 'dados');
const AUDIT_DIR = path.join(DADOS_DIR, 'auditoria');
const RAW_DIR = path.join(AUDIT_DIR, 'raw', 'siap_folha_detalhes');
const DB_PATH = path.join(DADOS_DIR, 'arinos_transparencia_master.sqlite3');

[DADOS_DIR, AUDIT_DIR, RAW_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Argumentos de Linha de Comando
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}

const ANO_INICIO = parseInt(getArg('--inicio', '2026'), 10);
const ANO_FIM = parseInt(getArg('--fim', '2006'), 10);
const MES_FILTRO = getArg('--mes', null) ? parseInt(getArg('--mes', null), 10) : null;
const CONCORRENCIA = parseInt(getArg('--workers', '10'), 10);
const APENAS_PENDENTES = !args.includes('--forcar-tudo');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║  EXTRATOR TOTAL DE CONTRACHEQUES DETALHADOS COM RUBRICAS (2006-2026)         ║');
console.log('║  Prefeitura Municipal de Arinos / MG — SIAP Folha / MG Cidades               ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log(`Intervalo: De ${ANO_INICIO} até ${ANO_FIM} (Ordem Decrescente)${MES_FILTRO ? ` [Apenas Mês ${MES_FILTRO}]` : ''}`);
console.log(`Workers Paralelos Concorrentes: ${CONCORRENCIA} requisições simultâneas`);
console.log(`Modo Retomável: ${APENAS_PENDENTES ? 'ATIVO (Pula servidores já detalhados)' : 'FORÇAR ATUALIZAÇÃO GERAL'}`);
console.log(`Banco SQLite Destino: ${DB_PATH}\n`);

// Banco de Dados SQLite em WAL Mode
const db = new DatabaseSync(DB_PATH);
// Adiciona coluna 'detalhado' se tabela já existia sem ela
try {
  db.exec('ALTER TABLE contracheques ADD COLUMN detalhado INTEGER DEFAULT 0;');
} catch (e) {}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 20000;
  PRAGMA cache_size = -64000; -- 64MB Cache

  CREATE TABLE IF NOT EXISTS contracheques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT UNIQUE NOT NULL,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    matricula TEXT,
    nome TEXT NOT NULL,
    cargo TEXT,
    vinculo TEXT,
    tipo_folha TEXT,
    total_proventos REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    salario_liquido REAL DEFAULT 0,
    detalhado INTEGER DEFAULT 0,
    idfun TEXT,
    url_detalhe TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contracheque_rubricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_contracheque TEXT NOT NULL,
    chave_servidor TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    codigo_rubrica TEXT,
    descricao_rubrica TEXT NOT NULL,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contra_ano_mes ON contracheques(ano, mes);
  CREATE INDEX IF NOT EXISTS idx_contra_detalhado ON contracheques(detalhado, ano, mes);
  CREATE INDEX IF NOT EXISTS idx_contra_nome ON contracheques(nome);
  CREATE INDEX IF NOT EXISTS idx_contra_matricula ON contracheques(matricula);
  CREATE INDEX IF NOT EXISTS idx_contra_idfun ON contracheques(idfun);
  CREATE INDEX IF NOT EXISTS idx_rubricas_hash ON contracheque_rubricas(hash_contracheque);
  CREATE INDEX IF NOT EXISTS idx_rubricas_ano_mes ON contracheque_rubricas(ano, mes);
`);

// Prepared Statements
const stmtInserirHeader = db.prepare(`
  INSERT INTO contracheques (
    hash_registro, entidade, idorg, ano, mes, matricula, nome,
    cargo, vinculo, tipo_folha, total_proventos, total_descontos,
    salario_liquido, detalhado, idfun, url_detalhe, hash_arquivo_raw, coletado_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(hash_registro) DO UPDATE SET
    cargo = COALESCE(excluded.cargo, contracheques.cargo),
    vinculo = COALESCE(excluded.vinculo, contracheques.vinculo),
    idfun = COALESCE(excluded.idfun, contracheques.idfun),
    url_detalhe = COALESCE(excluded.url_detalhe, contracheques.url_detalhe)
`);

const stmtAtualizarHeaderComDetalhe = db.prepare(`
  UPDATE contracheques SET
    total_proventos = ?,
    total_descontos = ?,
    salario_liquido = ?,
    detalhado = 1,
    coletado_em = ?
  WHERE hash_registro = ?
`);

const stmtDeletarRubricasAntigas = db.prepare(`
  DELETE FROM contracheque_rubricas WHERE hash_contracheque = ?
`);

const stmtInserirRubrica = db.prepare(`
  INSERT INTO contracheque_rubricas (
    hash_contracheque, chave_servidor, ano, mes, codigo_rubrica,
    descricao_rubrica, tipo, valor, coletado_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

async function fetchJsonComRetry(url, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuditoriaTransparenciaArinos/2.0'
        },
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404 || res.status === 400) {
        return [];
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      if (i === tentativas) throw err;
      await sleep(350 * i);
    }
  }
  return [];
}

async function coletarFolhaMensalComDetalhes(ano, mes) {
  const mesFormatado = String(mes).padStart(2, '0');
  const urlFolha = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha?cnpj=18125120000180&organizacao=310450201&ano=${ano}&mes=${mes}`;

  // 1. Obter Lista de Servidores do Mês
  const servidores = await fetchJsonComRetry(urlFolha);
  if (!Array.isArray(servidores) || servidores.length === 0) {
    return { ano, mes, qtd: 0, status: 'vazio' };
  }

  const rawHash = sha256(JSON.stringify(servidores));
  const dataAgora = new Date().toISOString();

  // 2. Garantir Cabeçalhos no SQLite
  db.exec('BEGIN TRANSACTION;');
  for (const item of servidores) {
    let matricula = '';
    let nome = item.matriculanome || '';
    if (item.matriculanome && item.matriculanome.includes(' - ')) {
      const parts = item.matriculanome.split(' - ');
      matricula = parts[0].trim();
      nome = parts.slice(1).join(' - ').trim();
    }
    const chave = item.chave || `${matricula}_${ano}${mesFormatado}`;
    const hashRegistro = sha256(`siap_prefeitura_${ano}_${mesFormatado}_${chave}`);
    const proventos = Number(item.proventototal) || 0;

    stmtInserirHeader.run(
      hashRegistro,
      'prefeitura',
      310450201,
      ano,
      mes,
      matricula,
      nome,
      item.funcaocargo || null,
      item.vinculo || null,
      item.tipo || 'Pagamento',
      proventos,
      0,
      proventos,
      0, // inicializa com detalhado = 0
      chave,
      `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave=${encodeURIComponent(chave)}`,
      rawHash,
      dataAgora
    );
  }
  db.exec('COMMIT;');

  // 3. Identificar quais servidores precisam do detalhe
  let pendentes = [];
  if (APENAS_PENDENTES) {
    const existentes = db.prepare(`
      SELECT hash_registro, idfun as chave
      FROM contracheques
      WHERE ano = ? AND mes = ? AND detalhado = 1
    `).all(ano, mes);
    const setDetalhado = new Set(existentes.map(e => e.chave));

    pendentes = servidores.filter(s => s.chave && !setDetalhado.has(s.chave));
  } else {
    pendentes = servidores.filter(s => !!s.chave);
  }

  const jaDetalhadoQtd = servidores.length - pendentes.length;
  process.stdout.write(`  [${ano}/${mesFormatado}] ${servidores.length} servidores (${jaDetalhadoQtd} já detalhados, ${pendentes.length} pendentes)... `);

  if (pendentes.length === 0) {
    console.log(`✔ 100% Completo (Pulado)`);
    return { ano, mes, qtd: servidores.length, detalhados: servidores.length, rubricasTotal: 0, status: 'ok' };
  }

  // 4. Pool Concorrente de Download de Rubricas
  let idx = 0;
  let rubricasTotalMes = 0;
  let proventosTotalMes = 0;
  let descontosTotalMes = 0;
  let concluidos = 0;

  // Processa em lotes transacionais de CONCORRENCIA servidores para atomicidade e performance
  const tamanhoLote = Math.max(1, Math.min(CONCORRENCIA, 25));
  for (let i = 0; i < pendentes.length; i += tamanhoLote) {
    const fatia = pendentes.slice(i, i + tamanhoLote);

    const resultadosLote = await Promise.all(
      fatia.map(async s => {
        const urlDetalhe = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave=${encodeURIComponent(s.chave)}`;
        try {
          const rubricas = await fetchJsonComRetry(urlDetalhe, 3);
          return { servidor: s, rubricas: Array.isArray(rubricas) ? rubricas : [] };
        } catch (e) {
          return { servidor: s, rubricas: [], erro: e.message };
        }
      })
    );

    db.exec('BEGIN TRANSACTION;');
    for (const res of resultadosLote) {
      if (res.erro) {
        // Falha transitória de rede: mantém pendente para re-tentativa futura
        continue;
      }

      const s = res.servidor;
      const rubricas = res.rubricas;
      const chave = s.chave;
      const hashRegistro = sha256(`siap_prefeitura_${ano}_${mesFormatado}_${chave}`);
      const proventoInicial = Number(s.proventototal) || 0;

      if (rubricas.length > 0) {
        stmtDeletarRubricasAntigas.run(hashRegistro);

        let sumProv = 0;
        let sumDesc = 0;

        for (const r of rubricas) {
          const desc = Number(r.vlrdesconto) || 0;
          const prov = Number(r.vlrprovento) || 0;
          let codigo = null;
          let descricao = r.rubrica || '';

          if (descricao.includes(' - ')) {
            const p = descricao.split(' - ');
            codigo = p[0].trim();
            descricao = p.slice(1).join(' - ').trim();
          }

          if (desc > 0) {
            sumDesc += desc;
            stmtInserirRubrica.run(hashRegistro, chave, ano, mes, codigo, descricao, 'DESCONTO', desc, dataAgora);
            rubricasTotalMes++;
          }
          if (prov > 0) {
            sumProv += prov;
            stmtInserirRubrica.run(hashRegistro, chave, ano, mes, codigo, descricao, 'PROVENTO', prov, dataAgora);
            rubricasTotalMes++;
          }
        }

        const brutoFinal = sumProv > 0 ? sumProv : proventoInicial;
        const liquidoFinal = Math.max(0, brutoFinal - sumDesc);

        stmtAtualizarHeaderComDetalhe.run(brutoFinal, sumDesc, liquidoFinal, dataAgora, hashRegistro);
        proventosTotalMes += brutoFinal;
        descontosTotalMes += sumDesc;
      } else {
        // Se a API não tiver rubricas para esta chave antiga, marca como analisado
        stmtAtualizarHeaderComDetalhe.run(proventoInicial, 0, proventoInicial, dataAgora, hashRegistro);
        proventosTotalMes += proventoInicial;
      }
      concluidos++;
    }
    db.exec('COMMIT;');

    const perc = Math.round((concluidos / pendentes.length) * 100);
    process.stdout.write(`\r  [${ano}/${mesFormatado}] Progresso: ${perc}% (${concluidos}/${pendentes.length}) | Rubricas: ${rubricasTotalMes.toLocaleString('pt-BR')}   `);

    // Pequeno intervalo de alívio na conexão
    await sleep(60);
  }

  console.log(`\r  [${ano}/${mesFormatado}] ✔ Concluído (${concluidos} holerites detalhados, ${rubricasTotalMes.toLocaleString('pt-BR')} rubricas extraídas)                    `);
  return {
    ano,
    mes,
    qtd: servidores.length,
    detalhados: concluidos,
    rubricasTotal: rubricasTotalMes,
    volumeBruto: proventosTotalMes,
    volumeDescontos: descontosTotalMes,
    status: 'ok'
  };
}

async function iniciarExtracaoTotal() {
  const inicio = Date.now();
  let totalHolerites = 0;
  let totalRubricas = 0;

  console.log(`▶ Iniciando Esteira Forense Completa de Contracheques Detalhados...\n`);

  for (let ano = ANO_INICIO; ano >= ANO_FIM; ano--) {
    console.log(`┌──────────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ ANO DE ${ano} — HOLERITES E RUBRICAS DETALHADAS                              │`);
    console.log(`└──────────────────────────────────────────────────────────────────────────────┘`);

    let rubricasAno = 0;
    let servidoresAno = 0;

    const meses = MES_FILTRO ? [MES_FILTRO] : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    for (const mes of meses) {
      try {
        const res = await coletarFolhaMensalComDetalhes(ano, mes);
        if (res.status === 'ok') {
          servidoresAno += res.qtd;
          rubricasAno += res.rubricasTotal;
          totalHolerites += res.qtd;
          totalRubricas += res.rubricasTotal;
        } else {
          console.log(`  [${ano}/${String(mes).padStart(2, '0')}] ○ Sem dados na competência`);
        }
      } catch (err) {
        console.log(`  [${ano}/${String(mes).padStart(2, '0')}] ⚠ Erro no mês: ${err.message}`);
      }
    }

    console.log(`  Subtotal ${ano}: ${servidoresAno.toLocaleString('pt-BR')} holerites processados | ${rubricasAno.toLocaleString('pt-BR')} rubricas auditadas\n`);
  }

  const tempoTotal = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  AUDITORIA FORENSE DE CONTRACHEQUES CONCLUÍDA COM SUCESSO!                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`Total de Holerites Auditados: ${totalHolerites.toLocaleString('pt-BR')}`);
  console.log(`Total de Rubricas Detalhadas Extraídas: ${totalRubricas.toLocaleString('pt-BR')}`);
  console.log(`Tempo Total de Execução: ${tempoTotal}s`);
  console.log(`Banco SQLite Atualizado: ${DB_PATH}`);
}

iniciarExtracaoTotal().catch(err => {
  console.error('\n❌ Erro Crítico na Extração:', err.message);
  process.exit(1);
});
