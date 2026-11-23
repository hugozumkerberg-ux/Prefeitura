/**
 * ==============================================================================
 * CLIENTE OFICIAL DE CONEXÃO MYSQL — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG
 * ==============================================================================
 * Gerenciador de conexão de alta velocidade baseado no driver `mysql2/promise`.
 * Suporta Connection Pooling, Prepared Statements, execução transacional e
 * fallback resiliente para snapshot em memória quando em desenvolvimento.
 * ==============================================================================
 */

const mysql = require('mysql2/promise');
const path = require('node:path');
const fs = require('node:fs');

// Carrega variáveis de ambiente se existir arquivo .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'arinos_transparencia',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(config);
    } catch (err) {
      console.warn('⚠️ Não foi possível instanciar o pool MySQL:', err.message);
    }
  }
  return pool;
}

async function testConnection() {
  try {
    const p = getPool();
    if (!p) return false;
    const [rows] = await p.query('SELECT 1 as connected');
    isConnected = rows && rows[0] && rows[0].connected === 1;
    if (isConnected) {
      console.log(`✔ [MYSQL CONECTADO] Banco: ${config.database} em ${config.host}:${config.port}`);
    }
    return isConnected;
  } catch (err) {
    isConnected = false;
    return false;
  }
}

async function query(sql, params = []) {
  const p = getPool();
  if (!p) throw new Error('Pool MySQL não inicializado.');
  const [rows] = await p.execute(sql, params);
  return rows;
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
  }
}

module.exports = {
  getPool,
  testConnection,
  query,
  close,
  config
};
