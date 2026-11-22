const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3');

function inspectTable(tableName) {
  console.log(`\n=================== ${tableName} ===================`);
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  console.log('Columns:', cols.map(c => `${c.name} (${c.type})`).join(', '));
  const samples = db.prepare(`SELECT * FROM ${tableName} LIMIT 2`).all();
  console.log('Sample rows:', JSON.stringify(samples, null, 2));
}

inspectTable('contratos');
inspectTable('despesas');
inspectTable('diarias');
inspectTable('convenios');
