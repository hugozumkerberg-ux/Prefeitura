const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/contracheques_detalhados_master.sqlite3');
const row = db.prepare('SELECT id, ano, mes, nome, cargo, total_proventos, total_descontos, salario_liquido, url_oficial FROM contracheques WHERE nome LIKE ? LIMIT 1').get('%Cleomir%');
console.log('Contracheque:', row);
if (row) {
  const rubs = db.prepare('SELECT * FROM contracheque_rubricas WHERE contracheque_id = ?').all(row.id);
  console.log('Rubricas:', rubs);
}
