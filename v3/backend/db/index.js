/**
 * Camada de Conexão com os Bancos Oficiais SQLite via node:sqlite nativo
 * Alta performance, zero overhead de driver externo.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function resolveDbPath(relativePath) {
  const candidates = [
    path.resolve(__dirname, '../../../', relativePath),
    path.resolve(__dirname, '../../../../', relativePath),
    path.resolve('C:/Users/Desenvolvimento/Documents/hacks', relativePath),
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), '../', relativePath)
  ];
  return candidates.find(c => fs.existsSync(c)) || candidates[0];
}

const PATH_CONTRACHEQUES = resolveDbPath('BASE DE DADOS/aaaa/contracheques.db');
const PATH_DESPESAS = resolveDbPath('BASE DE DADOS/coletor_despesas_arinos/dados/despesas_arinos_validado.sqlite3');
const PATH_DIARIAS = resolveDbPath('BASE DE DADOS/coletor_diarias_arinos/diarias_arinos.sqlite3');

let dbContracheques = null;
let dbDespesas = null;
let dbDiarias = null;

try {
  dbContracheques = new DatabaseSync(PATH_CONTRACHEQUES, { readOnly: true });
  console.log('✔ Banco Contracheques conectado com sucesso (153k registros).');
} catch (err) {
  console.error('⚠ Erro ao conectar contracheques.db (' + PATH_CONTRACHEQUES + '):', err.message);
}

try {
  dbDespesas = new DatabaseSync(PATH_DESPESAS, { readOnly: true });
  console.log('✔ Banco Despesas conectado com sucesso.');
} catch (err) {
  console.error('⚠ Erro ao conectar despesas_arinos_validado.sqlite3 (' + PATH_DESPESAS + '):', err.message);
}

try {
  dbDiarias = new DatabaseSync(PATH_DIARIAS, { readOnly: true });
  console.log('✔ Banco Diárias conectado com sucesso.');
} catch (err) {
  console.error('⚠ Erro ao conectar diarias_arinos.sqlite3 (' + PATH_DIARIAS + '):', err.message);
}

module.exports = {
  dbContracheques,
  dbDespesas,
  dbDiarias
};
