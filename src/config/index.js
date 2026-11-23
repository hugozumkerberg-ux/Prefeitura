/**
 * ==============================================================================
 * CONFIGURAÇÃO DE AMBIENTE — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG
 * ==============================================================================
 */

const path = require('node:path');
const fs = require('node:fs');

const ROOT_DIR = path.resolve(__dirname, '../..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

if (fs.existsSync(ENV_FILE)) {
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

module.exports = {
  port: parseInt(process.env.PORT || '8088', 10),
  host: process.env.HOST || '0.0.0.0',
  rootDir: ROOT_DIR,
  dadosDir: path.join(ROOT_DIR, 'dados'),
  publicDir: path.join(ROOT_DIR, 'public'),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'arinos_transparencia',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
  }
};
