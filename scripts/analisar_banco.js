const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath, { readOnly: true });

console.log('=== TABELAS DO BANCO MASTER ===');
const tables = db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
for (const t of tables) {
  try {
    const count = db.prepare(`SELECT count(*) as c FROM "${t.name}"`).get().c;
    console.log(`- ${t.type.toUpperCase()}: ${t.name} (${count.toLocaleString('pt-BR')} registros)`);
  } catch(e) {
    console.log(`- ${t.type.toUpperCase()}: ${t.name} (erro: ${e.message})`);
  }
}

console.log('\n=== ÍNDICES ATUAIS ===');
const indexes = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name").all();
for (const idx of indexes) {
  console.log(`- ${idx.name} ON ${idx.tbl_name}: ${idx.sql}`);
}

console.log('\n=== ESTRUTURA DE PESSOAS_UNIFICADAS ===');
const colsPessoas = db.prepare("PRAGMA table_info(pessoas_unificadas)").all();
colsPessoas.forEach(c => console.log(`  ${c.cid}: ${c.name} (${c.type})`));

console.log('\n=== ESTRUTURA DE CONTRACHEQUES ===');
const colsContracheques = db.prepare("PRAGMA table_info(contracheques)").all();
colsContracheques.forEach(c => console.log(`  ${c.cid}: ${c.name} (${c.type})`));

db.close();
