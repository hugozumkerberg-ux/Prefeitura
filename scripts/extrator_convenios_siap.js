/**
 * ==============================================================================
 * EXTRATOR DE CONVÊNIOS PÚBLICOS — NOVO PORTAL SIAP (ARINOS / MG)
 * ==============================================================================
 * Fonte Oficial: https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio
 * Banco Destino: dados/arinos_transparencia_master.sqlite3
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');
const RAW_DIR = path.join(BASE_DIR, 'dados/auditoria/raw/novo_portal_siap/convenios');

fs.mkdirSync(RAW_DIR, { recursive: true });

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  EXTRATOR DE CONVÊNIOS — NOVO PORTAL SIAP (ARINOS / MG)             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 10000;

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

    CREATE INDEX IF NOT EXISTS idx_convenios_nr ON convenios(nr_convenio);
    CREATE INDEX IF NOT EXISTS idx_convenios_valor ON convenios(valor_convenio);
    CREATE INDEX IF NOT EXISTS idx_convenios_data ON convenios(dt_convenio);
  `);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO convenios (
      hash_registro, idcnv, codigo, nr_convenio, descricao, objeto,
      valor_convenio, valor_contrapartida, dt_convenio, dt_inicio,
      dt_final, dt_tce, parcelas, tipo, usuario, hash_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initRes = await fetch('https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio?page=0&size=50');
  const initData = await initRes.json();
  const totalElements = initData.page?.totalElements || 0;
  const totalPages = initData.page?.totalPages || 1;

  console.log(`Total de Convênios Oficiais encontrados: ${totalElements} (${totalPages} páginas)\n`);

  let totalSalvos = 0;
  let volumeTotal = 0;
  let contrapartidaTotal = 0;

  for (let page = 0; page < totalPages; page++) {
    const url = `https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio?page=${page}&size=50`;
    const res = await fetch(url);
    const textData = await res.text();
    const hashRaw = sha256(textData);

    fs.writeFileSync(path.join(RAW_DIR, `convenios_page_${String(page).padStart(3, '0')}.json`), textData, 'utf-8');

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
    console.log(`  [Página ${page + 1}/${totalPages}] ${totalSalvos} convênios salvos | Total: R$ ${volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    await sleep(80);
  }

  console.log('\n================================================================');
  console.log(`EXTRAÇÃO DE CONVÊNIOS CONCLUÍDA COM SUCESSO!`);
  console.log(`Total de Convênios: ${totalSalvos}`);
  console.log(`Valor Total dos Convênios: R$ ${volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Contrapartida Municipal: R$ ${contrapartidaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log('================================================================\n');

  db.close();
}

main().catch(console.error);
