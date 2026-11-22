/**
 * ==============================================================================
 * GERADOR DE BACKUP FORENSE CERTIFICADO (ZIP + SHA-256) — ARINOS / MG
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(BASE_DIR, 'backups_forenses');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  GERADOR DE BACKUP FORENSE CERTIFICADO — ARINOS / MG               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const dataStr = new Date().toISOString().replace(/[:.]/g, '-');
const zipNome = `backup_arinos_transparencia_${dataStr}.zip`;
const zipPath = path.join(BACKUP_DIR, zipNome);

console.log('1. Compactando banco master e bases de dados...');

const dbMaster = path.join(BASE_DIR, 'dados', 'arinos_transparencia_master.sqlite3');
const resumoJson = path.join(BASE_DIR, 'dados', 'resumo_geral.json');
const statusJson = path.join(BASE_DIR, 'dados', 'status_coleta.json');

const powershellCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${dbMaster}', '${resumoJson}', '${statusJson}' -DestinationPath '${zipPath}' -Force"`;

try {
  execSync(powershellCmd);
  console.log('  ✔ Arquivo compactado com sucesso:', zipNome);

  const zipBytes = fs.readFileSync(zipPath);
  const hashSha256 = crypto.createHash('sha256').update(zipBytes).digest('hex');
  const sizeMB = (zipBytes.length / (1024 * 1024)).toFixed(2);

  console.log(`\n2. Certificado Forense de Custódia:`);
  console.log(`  Arquivo: ${zipNome}`);
  console.log(`  Tamanho: ${sizeMB} MB`);
  console.log(`  SHA-256: ${hashSha256}`);

  // Gravar arquivo de manifesto de integridade
  const manifesto = `MANIFESTO DE CUSTÓDIA FORENSE — PORTAL TRANSPARÊNCIA ARINOS / MG
Data do Backup: ${new Date().toISOString()}
Arquivo ZIP: ${zipNome}
Tamanho: ${sizeMB} MB
Hash SHA-256: ${hashSha256}

Conteúdo:
- arinos_transparencia_master.sqlite3
- resumo_geral.json
- status_coleta.json

Certificação:
Este arquivo garante a prova inalterada de todos os registros auditados da Prefeitura e Fundação de Saúde de Arinos.
`;

  fs.writeFileSync(path.join(BACKUP_DIR, `${zipNome}.sha256.txt`), manifesto, 'utf-8');
  console.log(`  ✔ Manifesto salvo em: ${zipNome}.sha256.txt`);

  console.log('\n================================================================');
  console.log(`BACKUP CONCLUÍDO! Pasta: ${BACKUP_DIR}`);
  console.log('================================================================');
} catch (err) {
  console.error('Erro ao gerar backup:', err.message);
  process.exit(1);
}
