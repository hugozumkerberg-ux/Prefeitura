const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath, { readOnly: true });

console.log('--- CONFERENCIA POR ANO NA TABELA CONTRACHEQUES ---');
const contrachequesPorAno = db.prepare(`
  SELECT ano, 
         count(*) as total_contracheques, 
         sum(CASE WHEN detalhado = 1 THEN 1 ELSE 0 END) as detalhados,
         sum(CASE WHEN total_descontos > 0 THEN 1 ELSE 0 END) as com_descontos
  FROM contracheques 
  WHERE ano BETWEEN 2006 AND 2012
  GROUP BY ano 
  ORDER BY ano DESC
`).all();
console.table(contrachequesPorAno);

console.log('--- CONFERENCIA NA TABELA CONTRACHEQUE_RUBRICAS ---');
const rubricasPorAno = db.prepare(`
  SELECT ano, 
         count(*) as total_rubricas,
         sum(CASE WHEN tipo = 'PROVENTO' THEN valor ELSE 0 END) as soma_proventos,
         sum(CASE WHEN tipo = 'DESCONTO' THEN valor ELSE 0 END) as soma_descontos
  FROM contracheque_rubricas 
  WHERE ano BETWEEN 2006 AND 2012
  GROUP BY ano 
  ORDER BY ano DESC
`).all();
console.table(rubricasPorAno);
