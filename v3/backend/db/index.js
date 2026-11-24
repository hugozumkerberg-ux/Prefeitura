/**
 * Camada de Conexão com os Bancos Oficiais SQLite via node:sqlite nativo
 * Alta performance, zero overhead de driver externo.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const PATH_CONTRACHEQUES = path.resolve(__dirname, '../../../BASE DE DADOS/aaaa/contracheques.db');
const PATH_DESPESAS = path.resolve(__dirname, '../../../BASE DE DADOS/coletor_despesas_arinos/dados/despesas_arinos_validado.sqlite3');
const PATH_DIARIAS = path.resolve(__dirname, '../../../BASE DE DADOS/coletor_diarias_arinos/diarias_arinos.sqlite3');

let dbContracheques = null;
let dbDespesas = null;
let dbDiarias = null;

try {
  dbContracheques = new DatabaseSync(PATH_CONTRACHEQUES, { readOnly: true });
  console.log('✔ Banco Contracheques conectado com sucesso (153k registros).');
} catch (err) {
  console.error('⚠ Erro ao conectar contracheques.db:', err.message);
}

try {
  dbDespesas = new DatabaseSync(PATH_DESPESAS, { readOnly: true });
  console.log('✔ Banco Despesas conectado com sucesso.');
} catch (err) {
  console.error('⚠ Erro ao conectar despesas_arinos_validado.sqlite3:', err.message);
}

try {
  dbDiarias = new DatabaseSync(PATH_DIARIAS, { readOnly: true });
  console.log('✔ Banco Diárias conectado com sucesso.');
} catch (err) {
  console.error('⚠ Erro ao conectar diarias_arinos.sqlite3:', err.message);
}

module.exports = {
  dbContracheques,
  dbDespesas,
  dbDiarias
};
