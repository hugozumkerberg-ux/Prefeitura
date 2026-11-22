const { DatabaseSync } = require('node:sqlite');
for (const p of ['portal_transparencia_arinos/dados/contracheques_detalhados_master.sqlite3', 'portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3']) {
  try {
    const db = new DatabaseSync(p);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(p, '->', tables.map(t => t.name));
    for (const t of tables) {
      if (!t.name.startsWith('sqlite_')) {
        const count = db.prepare(`SELECT count(*) as cnt FROM ${t.name}`).get();
        console.log(`  - ${t.name}: ${count.cnt} rows`);
      }
    }
  } catch(e) {
    console.log(p, 'ERR:', e.message);
  }
}
