const { getMasterDb } = require('../lib/db');
const db = getMasterDb();
const v = db.prepare(`
  SELECT ano, nome_urna, cargo, foto_local 
  FROM eleicoes_candidatos 
  WHERE nome_urna LIKE '%VALTER%'
`).all();
console.log(JSON.stringify(v, null, 2));


