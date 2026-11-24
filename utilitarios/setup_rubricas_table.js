const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath);

db.exec(`
  DROP TABLE IF EXISTS contracheque_rubricas;

  CREATE TABLE contracheque_rubricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_contracheque TEXT NOT NULL,
    chave_servidor TEXT,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    codigo_rubrica TEXT,
    descricao_rubrica TEXT NOT NULL,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_rubricas_hash ON contracheque_rubricas(hash_contracheque);
  CREATE INDEX IF NOT EXISTS idx_rubricas_ano_mes ON contracheque_rubricas(ano, mes);
  CREATE INDEX IF NOT EXISTS idx_rubricas_tipo ON contracheque_rubricas(tipo);
  CREATE INDEX IF NOT EXISTS idx_rubricas_desc ON contracheque_rubricas(descricao_rubrica);
`);

console.log('Tabela contracheque_rubricas recriada com sucesso!');
