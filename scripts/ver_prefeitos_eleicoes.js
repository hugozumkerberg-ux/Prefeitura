const { getMasterDb } = require('../lib/db');
const db = getMasterDb();
const prefeitos = db.prepare(`
  SELECT ano, cargo, numero, nome_urna, nome_completo, partido_sigla, coligacao, situacao, resultado, votos, percentual, vice_nome, vice_partido, vice_foto, cor_primaria, cor_secundaria, foto_local
  FROM eleicoes_candidatos
  WHERE cargo LIKE '%PREFEITO%'
  ORDER BY ano DESC, votos DESC
`).all();
console.log(JSON.stringify(prefeitos, null, 2));

