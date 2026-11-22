/**
 * ==============================================================================
 * EXTRATOR FORENSE DO NOVO PORTAL SIAP / MG CIDADES — ARINOS / MG
 * ==============================================================================
 * Fonte Oficial: https://mgcidades.redemunicipal.com.br/27/310450201
 * APIs Consumidas:
 *   - Contratos & Aditivos: https://contaspublicassiap.redemunicipal.com.br/pub/27/contrato
 *   - Receitas Públicas: https://contaspublicassiap.redemunicipal.com.br/pub/27/receita
 *   - Convênios: https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio
 * Banco Destino: dados/arinos_transparencia_master.sqlite3 (Direct-to-SQLite)
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');
const RAW_DIR_CONTRATOS = path.join(BASE_DIR, 'dados/auditoria/raw/novo_portal_siap/contratos');
const RAW_DIR_RECEITAS = path.join(BASE_DIR, 'dados/auditoria/raw/novo_portal_siap/receitas');
const RAW_DIR_CONVENIOS = path.join(BASE_DIR, 'dados/auditoria/raw/novo_portal_siap/convenios');

fs.mkdirSync(RAW_DIR_CONTRATOS, { recursive: true });
fs.mkdirSync(RAW_DIR_RECEITAS, { recursive: true });
fs.mkdirSync(RAW_DIR_CONVENIOS, { recursive: true });

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  EXTRATOR DO NOVO PORTAL SIAP / MG CIDADES — ARINOS / MG           ║');
console.log('║  Módulos: Contratos Administrativos, Receitas e Convênios         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const db = new DatabaseSync(DB_PATH);

// Configuração do SQLite e Criação das Tabelas
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 15000;

  CREATE TABLE IF NOT EXISTS contratos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT NOT NULL UNIQUE,
    idccs INTEGER,
    codcrd INTEGER,
    credor TEXT NOT NULL,
    doc_credor TEXT,
    tipo_contrato TEXT,
    nr_contrato INTEGER,
    valor REAL NOT NULL DEFAULT 0,
    dt_ini_vigencia TEXT,
    dt_fim_vigencia TEXT,
    dt_assinatura TEXT,
    dt_publicacao TEXT,
    local_publicacao TEXT,
    nr_licitacao INTEGER,
    dt_licitacao TEXT,
    objeto TEXT,
    fundamento TEXT,
    nr_processo INTEGER,
    dt_processo TEXT,
    hash_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS receitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT NOT NULL UNIQUE,
    idror INTEGER,
    ano INTEGER NOT NULL,
    nr_conhecimento INTEGER,
    nr_item INTEGER,
    data_receita TEXT,
    valor REAL NOT NULL DEFAULT 0,
    descricao_receita TEXT,
    mascara_receita TEXT,
    agencia TEXT,
    conta TEXT,
    descricao_conta TEXT,
    hash_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS convenios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT NOT NULL UNIQUE,
    idcnv INTEGER,
    codigo INTEGER,
    nr_convenio TEXT,
    descricao TEXT,
    objeto TEXT,
    valor_convenio REAL NOT NULL DEFAULT 0,
    valor_contrapartida REAL NOT NULL DEFAULT 0,
    dt_convenio TEXT,
    dt_inicio TEXT,
    dt_final TEXT,
    dt_tce TEXT,
    parcelas INTEGER,
    tipo INTEGER,
    usuario TEXT,
    hash_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_contratos_credor ON contratos(credor);
  CREATE INDEX IF NOT EXISTS idx_contratos_valor ON contratos(valor);
  CREATE INDEX IF NOT EXISTS idx_receitas_ano ON receitas(ano, data_receita);
  CREATE INDEX IF NOT EXISTS idx_receitas_valor ON receitas(valor);
  CREATE INDEX IF NOT EXISTS idx_convenios_nr ON convenios(nr_convenio);
  CREATE INDEX IF NOT EXISTS idx_convenios_valor ON convenios(valor_convenio);
`);

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 5, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AuditoriaPublicaArinos/1.0' },
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(backoff * (i + 1));
    }
  }
}

// 1. EXTRAÇÃO DE CONTRATOS ADMINISTRATIVOS
async function extrairContratos() {
  console.log('--- 1. VERIFICANDO CONTRATOS & ADITIVOS ---');
  const countRow = db.prepare('SELECT count(*) as c FROM contratos').get();
  if (countRow.c >= 2400) {
    console.log(`  ✔ Contratos já extraídos anteriormente: ${countRow.c} registros salvos no banco. Pulando...\n`);
    return;
  }

  const insertContratoStmt = db.prepare(`
    INSERT OR REPLACE INTO contratos (
      hash_registro, idccs, codcrd, credor, doc_credor, tipo_contrato,
      nr_contrato, valor, dt_ini_vigencia, dt_fim_vigencia, dt_assinatura,
      dt_publicacao, local_publicacao, nr_licitacao, dt_licitacao, objeto,
      fundamento, nr_processo, dt_processo, hash_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialText = await fetchWithRetry('https://contaspublicassiap.redemunicipal.com.br/pub/27/contrato?page=0&size=100');
  const initialData = JSON.parse(initialText);
  const totalPages = initialData.page?.totalPages || 1;

  let contratosSalvos = 0;
  let volumeTotalContratos = 0;

  for (let page = 0; page < totalPages; page++) {
    try {
      const rawFile = path.join(RAW_DIR_CONTRATOS, `contratos_page_${String(page).padStart(3, '0')}.json`);
      let textData;
      if (fs.existsSync(rawFile)) {
        textData = fs.readFileSync(rawFile, 'utf-8');
      } else {
        textData = await fetchWithRetry(`https://contaspublicassiap.redemunicipal.com.br/pub/27/contrato?page=${page}&size=100`);
        fs.writeFileSync(rawFile, textData, 'utf-8');
      }

      const hashRaw = sha256(textData);
      const data = JSON.parse(textData);
      const items = data.content || [];

      db.exec('BEGIN TRANSACTION;');
      for (const c of items) {
        const credor = (c.dscrd || 'NÃO INFORMADO').trim();
        const valor = parseFloat(c.valor) || 0;
        const hashReg = sha256(`contrato_${c.idccs}_${c.nrcontrato}_${credor}_${valor}`);

        insertContratoStmt.run(
          hashReg, c.idccs || null, c.codcrd || null, credor, (c.doccrd || '').trim(),
          c.tipocontrato || '', c.nrcontrato || null, valor, c.dtinivig || null,
          c.dtfimvig || null, c.dtassina || null, c.dtpublic || null,
          (c.localpub || '').trim(), c.nrlicitac || null, c.dtlicitac || null,
          (c.objeto || '').trim(), (c.fundamento || '').trim(), c.nrprocesso || null,
          c.dtprocesso || null, hashRaw, new Date().toISOString()
        );

        contratosSalvos++;
        volumeTotalContratos += valor;
      }
      db.exec('COMMIT;');
      process.stdout.write(`  [Página ${page + 1}/${totalPages}] ${contratosSalvos} contratos salvos | R$ ${volumeTotalContratos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\r`);
      await sleep(50);
    } catch (err) {
      console.error(`\nErro na página de contratos ${page}:`, err.message);
    }
  }
  console.log(`\n  ✔ Extração de Contratos concluída: ${contratosSalvos} contratos salvos.\n`);
}

// 2. EXTRAÇÃO DE CONVÊNIOS
async function extrairConvenios() {
  console.log('--- 2. INICIANDO EXTRAÇÃO DE CONVÊNIOS ---');
  const countRow = db.prepare('SELECT count(*) as c FROM convenios').get();
  if (countRow.c >= 90) {
    console.log(`  ✔ Convênios já extraídos anteriormente: ${countRow.c} registros salvos no banco. Pulando...\n`);
    return;
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO convenios (
      hash_registro, idcnv, codigo, nr_convenio, descricao, objeto,
      valor_convenio, valor_contrapartida, dt_convenio, dt_inicio,
      dt_final, dt_tce, parcelas, tipo, usuario, hash_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initText = await fetchWithRetry('https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio?page=0&size=50');
  const initData = JSON.parse(initText);
  const totalPages = initData.page?.totalPages || 1;

  let totalSalvos = 0;
  let volumeTotal = 0;
  let contrapartidaTotal = 0;

  for (let page = 0; page < totalPages; page++) {
    const rawFile = path.join(RAW_DIR_CONVENIOS, `convenios_page_${String(page).padStart(3, '0')}.json`);
    let textData;
    if (fs.existsSync(rawFile)) {
      textData = fs.readFileSync(rawFile, 'utf-8');
    } else {
      textData = await fetchWithRetry(`https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio?page=${page}&size=50`);
      fs.writeFileSync(rawFile, textData, 'utf-8');
    }

    const hashRaw = sha256(textData);
    const data = JSON.parse(textData);
    const items = data.content || [];

    db.exec('BEGIN TRANSACTION;');
    for (const c of items) {
      const vlConv = parseFloat(c.vlconvenio) || 0;
      const vlCpart = parseFloat(c.vlcpartida) || 0;
      const nrConv = (c.nrconvenio || '').trim();
      const hashReg = sha256(`convenio_${c.idcnv}_${c.codigo}_${nrConv}_${vlConv}`);

      insertStmt.run(
        hashReg, c.idcnv || null, c.codigo || null, nrConv,
        (c.descricao || '').trim(), (c.objeto || '').trim(),
        vlConv, vlCpart, c.dtconvenio || null, c.dtinicio || null,
        c.dtfinal || c.dtfim || null, c.dttce || null,
        c.parcelas || 0, c.tipo || null, (c.usuario || '').trim(),
        hashRaw, new Date().toISOString()
      );

      totalSalvos++;
      volumeTotal += vlConv;
      contrapartidaTotal += vlCpart;
    }
    db.exec('COMMIT;');
    await sleep(50);
  }

  console.log(`  ✔ Extração de Convênios concluída: ${totalSalvos} convênios salvos.`);
  console.log(`  Volume Total em Convênios: R$ ${volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);
}

// 3. EXTRAÇÃO DE RECEITAS PÚBLICAS (2026, 2025, 2024)
async function extrairReceitas() {
  console.log('--- 3. INICIANDO EXTRAÇÃO DE RECEITAS PÚBLICAS (2026, 2025, 2024) ---');
  const insertReceitaStmt = db.prepare(`
    INSERT OR REPLACE INTO receitas (
      hash_registro, idror, ano, nr_conhecimento, nr_item, data_receita,
      valor, descricao_receita, mascara_receita, agencia, conta,
      descricao_conta, hash_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalReceitasSalvas = 0;
  let volumeTotalReceitas = 0;

  for (const ano of [2026, 2025, 2024]) {
    try {
      const existCount = db.prepare('SELECT count(*) as c FROM receitas WHERE ano = ?').get(ano);
      if (existCount && existCount.c > 5000) {
        console.log(`\n  ✔ Ano ${ano} já coletado anteriormente: ${existCount.c} receitas no banco. Pulando...`);
        continue;
      }

      console.log(`\nIniciando Arrecadação de ${ano}...`);
      const initText = await fetchWithRetry(`https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?ano=${ano}&page=0&size=100`);
      const initData = JSON.parse(initText);
      const totalPages = Math.min(initData.page?.totalPages || 1, 160);
      const totalElements = initData.page?.totalElements || 0;

      console.log(`Ano ${ano}: ${totalElements} registros disponíveis no SIAP (${totalPages} páginas de 100)...`);

      for (let page = 0; page < totalPages; page++) {
        const rawFile = path.join(RAW_DIR_RECEITAS, `receitas_${ano}_page_${String(page).padStart(3, '0')}.json`);
        let textData;
        if (fs.existsSync(rawFile)) {
          textData = fs.readFileSync(rawFile, 'utf-8');
        } else {
          textData = await fetchWithRetry(`https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?ano=${ano}&page=${page}&size=100`);
          fs.writeFileSync(rawFile, textData, 'utf-8');
        }

        const hashRaw = sha256(textData);
        const data = JSON.parse(textData);
        const items = data.content || [];

        db.exec('BEGIN TRANSACTION;');
        for (const r of items) {
          const valor = parseFloat(r.vlReceita) || 0;
          const hashReg = sha256(`receita_${r.idror}_${r.ano}_${r.nrconhec}_${r.nritem}_${valor}`);

          insertReceitaStmt.run(
            hashReg, r.idror || null, r.ano || ano, r.nrconhec || null,
            r.nritem || null, r.dtreceita || null, valor,
            (r.dsNre || '').trim(), (r.cdNreMask || '').trim(),
            r.agencia || null, r.nconta || null, r.descricaoconta || null,
            hashRaw, new Date().toISOString()
          );

          totalReceitasSalvas++;
          volumeTotalReceitas += valor;
        }
        db.exec('COMMIT;');

        process.stdout.write(`  [${ano} - Pág ${page + 1}/${totalPages}] ${totalReceitasSalvas} receitas | R$ ${volumeTotalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\r`);
        await sleep(60);
      }
      console.log(`\n  ✔ Ano ${ano} concluído com sucesso.`);
    } catch (e) {
      console.error(`\nErro persistente no ano ${ano}:`, e.message);
    }
  }

  console.log(`\n================================================================`);
  console.log(`COLETA DE RECEITAS FINALIZADA!`);
  console.log(`Total de Lançamentos de Receita: ${totalReceitasSalvas}`);
  console.log(`Arrecadação Total Auditada: R$ ${volumeTotalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`================================================================\n`);
}

async function main() {
  await extrairContratos();
  await extrairConvenios();
  await extrairReceitas();
  db.close();
}

main().catch(console.error);
