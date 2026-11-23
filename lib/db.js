/**
 * ==============================================================================
 * GERENCIADOR DE BANCO DE DADOS RELACIONAL — ARINOS / MG
 * Singleton de conexão SQLite nativa (node:sqlite DatabaseSync), WAL mode e cache
 * ==============================================================================
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DADOS_DIR = path.join(__dirname, '..', 'dados');
const MASTER_DB_PATH = path.join(DADOS_DIR, 'arinos_transparencia_master.sqlite3');
const DETALHADO_DB_PATH = path.join(DADOS_DIR, 'contracheques_detalhados_adpm.sqlite3');

let masterDbInstance = null;
let detalhadoDbInstance = null;

/**
 * Obtém a instância Singleton do Banco Master
 * @returns {DatabaseSync} Conexão SQLite ativa
 */
function getMasterDb() {
  if (!masterDbInstance) {
    if (!fs.existsSync(MASTER_DB_PATH)) {
      throw new Error(`Banco master não encontrado em: ${MASTER_DB_PATH}`);
    }
    masterDbInstance = new DatabaseSync(MASTER_DB_PATH);
    masterDbInstance.exec('PRAGMA journal_mode = WAL;');
    masterDbInstance.exec('PRAGMA synchronous = NORMAL;');
    masterDbInstance.exec('PRAGMA cache_size = -64000;'); // 64MB cache
    masterDbInstance.exec('PRAGMA temp_store = MEMORY;');
  }
  return masterDbInstance;
}

/**
 * Obtém a instância Singleton do Banco de Contracheques Detalhados
 * @returns {DatabaseSync|null} Conexão SQLite ou null se não existir
 */
function getDetalhadoDb() {
  if (!detalhadoDbInstance) {
    if (fs.existsSync(DETALHADO_DB_PATH)) {
      try {
        detalhadoDbInstance = new DatabaseSync(DETALHADO_DB_PATH, { readOnly: true });
        detalhadoDbInstance.exec('PRAGMA journal_mode = WAL;');
        detalhadoDbInstance.exec('PRAGMA cache_size = -32000;');
      } catch (e) {
        console.warn('Aviso: Não foi possível abrir o banco detalhado:', e.message);
        detalhadoDbInstance = null;
      }
    }
  }
  return detalhadoDbInstance;
}

/**
 * Encerra as conexões com segurança
 */
function fecharConexoes() {
  if (masterDbInstance) {
    try { masterDbInstance.close(); } catch(e) {}
    masterDbInstance = null;
  }
  if (detalhadoDbInstance) {
    try { detalhadoDbInstance.close(); } catch(e) {}
    detalhadoDbInstance = null;
  }
}

// Fechamento limpo ao terminar o processo
process.on('SIGINT', () => { fecharConexoes(); process.exit(0); });
process.on('SIGTERM', () => { fecharConexoes(); process.exit(0); });

module.exports = {
  getMasterDb,
  getDetalhadoDb,
  fecharConexoes,
  MASTER_DB_PATH,
  DETALHADO_DB_PATH
};
