const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/contracheques_detalhados_master.sqlite3');

const sample = db.prepare('SELECT ano, mes, matricula, nome, cargo, total_proventos, total_descontos, salario_liquido FROM contracheques ORDER BY id DESC LIMIT 5').all();
console.log('--- AMOSTRA DOS ULTIMOS CONTRACHEQUES DETALHADOS SALVOS ---');
console.table(sample);

const zeroCheck = db.prepare('SELECT count(*) as total, sum(CASE WHEN salario_liquido > 0 THEN 1 ELSE 0 END) as com_liquido, sum(CASE WHEN salario_liquido = 0 THEN 1 ELSE 0 END) as zerados FROM contracheques').get();
console.log('--- ESTATÍSTICA DO LÍQUIDO ---');
console.log(zeroCheck);

const rubricasSample = db.prepare('SELECT matricula, nome, tipo, codigo, descricao, valor FROM contracheque_rubricas ORDER BY id DESC LIMIT 10').all();
console.log('--- AMOSTRA DE RUBRICAS SALVAS ---');
console.table(rubricasSample);
