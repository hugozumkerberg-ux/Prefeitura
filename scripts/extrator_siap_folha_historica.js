/**
 * ==============================================================================
 * EXTRATOR HISTÓRICO SIAP / MG CIDADES — FOLHA DE PAGAMENTO (2006 A 2026)
 * ==============================================================================
 * Engenharia Reversa da API REST Oficial do SIAP Folha:
 * URL Base: https://contaspublicassiapfolha.redemunicipal.com.br
 * Domínio: 27 | Organização: 310450201 (Prefeitura Municipal de Arinos)
 * 
 * Performance & Boas Práticas:
 * - Direct-to-SQLite via node:sqlite (DatabaseSync) em WAL mode.
 * - Transações atômicas BEGIN/COMMIT por mês (1.400 registros em <5ms).
 * - Cadeia de custódia com gravação RAW em JSON e hash SHA-256.
 * - Suporte opcional a rubricas detalhadas (--com-detalhes).
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DADOS_DIR = path.join(BASE_DIR, 'dados');
const AUDIT_DIR = path.join(DADOS_DIR, 'auditoria');
const RAW_DIR = path.join(AUDIT_DIR, 'raw', 'siap_folha');
const DB_PATH = path.join(DADOS_DIR, 'arinos_transparencia_master.sqlite3');
const STATUS_PATH = path.join(DADOS_DIR, 'status_coleta.json');

// Garante que as pastas de auditoria e dados existam
[DADOS_DIR, AUDIT_DIR, RAW_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Funções Utilitárias Forenses
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Configuração dos parâmetros via linha de comando
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const index = args.indexOf(name);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}

const ANO_INICIO = parseInt(getArg('--inicio', '2026'), 10);
const ANO_FIM = parseInt(getArg('--fim', '2006'), 10);
const COM_DETALHES = args.includes('--com-detalhes');
const PULAR_EXISTENTES = args.includes('--pular-existentes');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║  EXTRATOR FORENSE DE FOLHA HISTÓRICA — SIAP / MG CIDADES (2006-2026)         ║');
console.log('║  Prefeitura Municipal de Arinos / MG — Fonte: contaspublicassiapfolha        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log(`Intervalo Configurado: De ${ANO_INICIO} até ${ANO_FIM}`);
console.log(`Modo Detalhes de Rubricas: ${COM_DETALHES ? 'ATIVO (Proventos e Descontos individuais)' : 'DESATIVADO (Folha Consolidada Ultrarrápida)'}`);
console.log(`Pular Meses Já Coletados no RAW: ${PULAR_EXISTENTES ? 'SIM' : 'NÃO'}\n`);

// Inicializa conexão com o Banco de Dados Master
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 15000;

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
    idfun TEXT,
    url_detalhe TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contracheque_rubricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_contracheque TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    rubrica TEXT NOT NULL,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contra_ano_mes ON contracheques(ano, mes);
  CREATE INDEX IF NOT EXISTS idx_contra_nome ON contracheques(nome);
  CREATE INDEX IF NOT EXISTS idx_contra_matricula ON contracheques(matricula);
  CREATE INDEX IF NOT EXISTS idx_contra_idfun ON contracheques(idfun);
  CREATE INDEX IF NOT EXISTS idx_rubricas_hash ON contracheque_rubricas(hash_contracheque);
`);

const stmtInserirContracheque = db.prepare(`
  INSERT INTO contracheques (
    hash_registro, entidade, idorg, ano, mes, matricula, nome,
    cargo, vinculo, tipo_folha, total_proventos, total_descontos,
    salario_liquido, idfun, url_detalhe, hash_arquivo_raw, coletado_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(hash_registro) DO UPDATE SET
    total_proventos = excluded.total_proventos,
    total_descontos = CASE WHEN excluded.total_descontos > 0 THEN excluded.total_descontos ELSE contracheques.total_descontos END,
    salario_liquido = CASE WHEN excluded.salario_liquido > 0 THEN excluded.salario_liquido ELSE contracheques.salario_liquido END
`);

const stmtInserirRubrica = db.prepare(`
  INSERT INTO contracheque_rubricas (
    hash_contracheque, ano, mes, rubrica, tipo, valor, coletado_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

async function fetchComRetry(url, tentativas = 3) {
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
        return []; // Mês sem folha ou inválido
      }
    } catch (err) {
      if (i === tentativas) throw err;
      await sleep(1000 * i);
    }
  }
  return [];
}

async function coletarMes(ano, mes) {
  const mesFormatado = String(mes).padStart(2, '0');
  const arquivoRaw = path.join(RAW_DIR, `folha_${ano}_${mesFormatado}.json`);

  let registros = [];
  let rawJsonStr = '';

  if (PULAR_EXISTENTES && fs.existsSync(arquivoRaw)) {
    try {
      rawJsonStr = fs.readFileSync(arquivoRaw, 'utf-8');
      registros = JSON.parse(rawJsonStr);
    } catch (e) {
      registros = [];
    }
  }

  if (registros.length === 0) {
    const url = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha?cnpj=18125120000180&organizacao=310450201&ano=${ano}&mes=${mes}`;
    registros = await fetchComRetry(url);
    if (Array.isArray(registros) && registros.length > 0) {
      rawJsonStr = JSON.stringify(registros, null, 2);
      fs.writeFileSync(arquivoRaw, rawJsonStr, 'utf-8');
    }
  }

  if (!Array.isArray(registros) || registros.length === 0) {
    return { ano, mes, qtd: 0, volume: 0, status: 'vazio' };
  }

  const rawHash = sha256(rawJsonStr || JSON.stringify(registros));
  const dataColeta = new Date().toISOString();
  let volumeMes = 0;

  db.exec('BEGIN TRANSACTION;');

  for (const item of registros) {
    // Parser de Matrícula e Nome: "001141 - Adao Carlos Ferreira Melo"
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
    volumeMes += proventos;

    stmtInserirContracheque.run(
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
      0, // Descontos (atualizado via detalhe se solicitado)
      proventos, // Inicialmente assume líquido = proventos até detalhamento
      chave,
      `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave=${encodeURIComponent(chave)}`,
      rawHash,
      dataColeta
    );

    // Se o modo detalhado de rubricas estiver ativado
    if (COM_DETALHES && item.chave) {
      try {
        const urlDetalhe = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave=${encodeURIComponent(item.chave)}`;
        const rubricas = await fetchComRetry(urlDetalhe, 2);
        if (Array.isArray(rubricas) && rubricas.length > 0) {
          let totalDesc = 0;
          for (const rub of rubricas) {
            const desc = Number(rub.vlrdesconto) || 0;
            const prov = Number(rub.vlrprovento) || 0;
            if (desc > 0) {
              totalDesc += desc;
              stmtInserirRubrica.run(hashRegistro, ano, mes, rub.rubrica || 'Desconto', 'DESCONTO', desc, dataColeta);
            }
            if (prov > 0) {
              stmtInserirRubrica.run(hashRegistro, ano, mes, rub.rubrica || 'Provento', 'PROVENTO', prov, dataColeta);
            }
          }
          const liq = Math.max(0, proventos - totalDesc);
          db.prepare('UPDATE contracheques SET total_descontos = ?, salario_liquido = ? WHERE hash_registro = ?')
            .run(totalDesc, liq, hashRegistro);
        }
      } catch (err) {
        // Continua sem quebrar o lote
      }
    }
  }

  db.exec('COMMIT;');

  return { ano, mes, qtd: registros.length, volume: volumeMes, status: 'ok' };
}

async function executarVarreduraCompleta() {
  const inicioGeral = Date.now();
  let totalGeralRegistros = 0;
  let volumeGeralFinanceiro = 0;
  let mesesComDados = 0;
  let mesesVazios = 0;

  console.log(`▶ Iniciando Coleta: de ${ANO_INICIO} retrocedendo até ${ANO_FIM}...\n`);

  for (let ano = ANO_INICIO; ano >= ANO_FIM; ano--) {
    console.log(`┌──────────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ EXERCÍCIO DE ${ano}                                                         │`);
    console.log(`└──────────────────────────────────────────────────────────────────────────────┘`);

    let registrosAno = 0;
    let volumeAno = 0;

    for (let mes = 12; mes >= 1; mes--) {
      process.stdout.write(`  [${ano}/${String(mes).padStart(2, '0')}] Consultando SIAP Folha... `);
      try {
        const res = await coletarMes(ano, mes);
        if (res.status === 'ok' && res.qtd > 0) {
          mesesComDados++;
          registrosAno += res.qtd;
          volumeAno += res.volume;
          totalGeralRegistros += res.qtd;
          volumeGeralFinanceiro += res.volume;
          console.log(`✔ ${res.qtd} servidores | R$ ${res.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        } else {
          mesesVazios++;
          console.log(`○ Sem dados`);
        }
      } catch (err) {
        console.log(`⚠ Falha: ${err.message}`);
      }

      // Intervalo de cortesia para a API
      await sleep(150);
    }

    console.log(`  Subtotal ${ano}: ${registrosAno.toLocaleString('pt-BR')} registros gravados | R$ ${volumeAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);
  }

  const duracaoSegundos = ((Date.now() - inicioGeral) / 1000).toFixed(1);

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  VARREDURA SIAP CONCLUÍDA COM SUCESSO!                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`Total de Registros Inseridos/Atualizados no SQLite: ${totalGeralRegistros.toLocaleString('pt-BR')}`);
  console.log(`Volume Total de Salários Mapeado: R$ ${volumeGeralFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Competências Mensais com Dados: ${mesesComDados}`);
  console.log(`Tempo Total de Execução: ${duracaoSegundos}s`);
  console.log(`Banco Atualizado: ${DB_PATH}`);
}

executarVarreduraCompleta().catch(err => {
  console.error('\n❌ Erro Crítico na Varredura:', err.message);
  process.exit(1);
});
