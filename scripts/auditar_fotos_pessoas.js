/**
 * ==============================================================================
 * SISTEMA PERICIAL DE AUDITORIA DE FOTOS, GERAÇÃO DE ID E VINCULAÇÃO A PESSOAS
 * ==============================================================================
 * 1. Audita todas as fotos locais de candidatos/agentes públicos da Justiça Eleitoral.
 * 2. Gera hash criptográfico SHA-256 para cadeia de custódia forense.
 * 3. Cria IDs únicos de foto e mapeia com os cadastros de pessoas_unificadas.
 * 4. Atualiza o banco SQLite Master e exporta o catálogo auditado JSON.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const MASTER_DB = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');
const ELEICOES_JSON = path.join(BASE_DIR, 'dados/eleicoes/eleicoes_master.json');
const FOTOS_DIR = path.join(BASE_DIR, 'dados/eleicoes/fotos');
const CATALOGO_EXPORT_JSON = path.join(BASE_DIR, 'dados/eleicoes/catalogo_fotos_auditadas.json');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║       AUDITORIA PERICIAL DE FOTOS E MAPEAMENTO DE IDENTIDADE — ARINOS/MG     ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function calcularSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function auditarFotos() {
  if (!fs.existsSync(MASTER_DB)) {
    console.error('❌ Banco SQLite Master não encontrado:', MASTER_DB);
    process.exit(1);
  }

  const db = new DatabaseSync(MASTER_DB);

  // 1. Criar tabela de fotos auditadas se não existir
  console.log('1. Estruturando tabela de fotos auditadas no SQLite Master...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS fotos_auditadas_pessoas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pessoa_id INTEGER NOT NULL,
      nome_canonic TEXT NOT NULL,
      nome_exibicao TEXT NOT NULL,
      nome_urna TEXT,
      cargo_tse TEXT,
      ano_eleicao INTEGER,
      id_candidato_tse TEXT,
      caminho_foto TEXT NOT NULL,
      hash_sha256 TEXT NOT NULL,
      status_auditoria TEXT NOT NULL DEFAULT 'aprovado_tse',
      auditado_em TEXT NOT NULL,
      FOREIGN KEY (pessoa_id) REFERENCES pessoas_unificadas(id)
    );

    CREATE INDEX IF NOT EXISTS idx_fotos_pessoa_id ON fotos_auditadas_pessoas(pessoa_id);
    CREATE INDEX IF NOT EXISTS idx_fotos_hash ON fotos_auditadas_pessoas(hash_sha256);
  `);

  // 2. Adicionar colunas foto_url e foto_id na tabela pessoas_unificadas se ausentes
  const cols = db.prepare('PRAGMA table_info(pessoas_unificadas)').all();
  const colNames = cols.map(c => c.name);

  if (!colNames.includes('foto_url')) {
    console.log('  ✔ Adicionando coluna foto_url em pessoas_unificadas...');
    db.exec('ALTER TABLE pessoas_unificadas ADD COLUMN foto_url TEXT;');
  }
  if (!colNames.includes('foto_id')) {
    console.log('  ✔ Adicionando coluna foto_id em pessoas_unificadas...');
    db.exec('ALTER TABLE pessoas_unificadas ADD COLUMN foto_id INTEGER;');
  }

  // 3. Ler candidatos do JSON Master
  console.log('2. Lendo acervo fotográfico de candidatos do TSE...');
  const eleicoesData = JSON.parse(fs.readFileSync(ELEICOES_JSON, 'utf8'));
  const candidatos = eleicoesData.candidatos || [];

  // Ler todas as pessoas do banco para mapeamento
  const pessoas = db.prepare('SELECT id, nome_canonic, nome_exibicao FROM pessoas_unificadas').all();
  const mapaPessoas = new Map();
  pessoas.forEach(p => {
    mapaPessoas.set(normalize(p.nome_canonic), p);
    mapaPessoas.set(normalize(p.nome_exibicao), p);
  });

  // Limpar auditoria anterior para regenerar registros atualizados
  db.exec('DELETE FROM fotos_auditadas_pessoas;');

  const insertFotoStmt = db.prepare(`
    INSERT INTO fotos_auditadas_pessoas (
      pessoa_id, nome_canonic, nome_exibicao, nome_urna, cargo_tse, 
      ano_eleicao, id_candidato_tse, caminho_foto, hash_sha256, status_auditoria, auditado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprovado_tse', ?)
  `);

  const updatePessoaStmt = db.prepare(`
    UPDATE pessoas_unificadas 
    SET foto_url = ?, foto_id = ? 
    WHERE id = ?
  `);

  let totalFotosAuditadas = 0;
  const catalogoAuditado = [];
  const nowIso = new Date().toISOString();

  // Ordenar candidatos para que 2024 prevaleça sobre 2020 na atribuição primária
  const candidatosOrdenados = [...candidatos].sort((a, b) => (b.ano || 0) - (a.ano || 0));

  for (const c of candidatosOrdenados) {
    if (!c.foto_local) continue;

    const fullFotoPath = path.join(BASE_DIR, c.foto_local.replace(/^\//, ''));
    if (!fs.existsSync(fullFotoPath)) {
      console.warn(`  ⚠️ Foto não encontrada no disco: ${c.foto_local}`);
      continue;
    }

    const sha256 = calcularSha256(fullFotoPath);
    const normNome = normalize(c.nome_completo);
    const pessoa = mapaPessoas.get(normNome);

    if (!pessoa) {
      console.warn(`  ⚠️ Candidato sem match em pessoas_unificadas: ${c.nome_completo}`);
      continue;
    }

    // Inserir registro na tabela de auditoria
    const res = insertFotoStmt.run(
      pessoa.id,
      pessoa.nome_canonic,
      pessoa.nome_exibicao,
      c.nome_urna,
      c.cargo,
      c.ano,
      c.id_candidato,
      c.foto_local,
      sha256,
      nowIso
    );

    const fotoId = Number(res.lastInsertRowid);

    // Atualizar pessoas_unificadas com a foto mais recente
    updatePessoaStmt.run(c.foto_local, fotoId, pessoa.id);

    totalFotosAuditadas++;
    catalogoAuditado.push({
      foto_id: fotoId,
      pessoa_id: pessoa.id,
      nome_oficial: pessoa.nome_exibicao,
      nome_urna: c.nome_urna,
      cargo: c.cargo,
      ano: c.ano,
      caminho_foto: c.foto_local,
      hash_sha256: sha256,
      status: 'auditado_e_certificado'
    });
  }

  // 4. Salvar catálogo JSON exportado
  fs.writeFileSync(CATALOGO_EXPORT_JSON, JSON.stringify(catalogoAuditado, null, 2), 'utf8');

  console.log('\n================================================================================');
  console.log(`✔ TOTAL DE FOTOS AUDITADAS E VINCULADAS: ${totalFotosAuditadas}`);
  console.log(`✔ Catálogo forense exportado em: ${CATALOGO_EXPORT_JSON}`);
  console.log('================================================================================\n');

  // Amostra de verificação
  const sample = db.prepare(`
    SELECT p.id, p.nome_exibicao, p.foto_id, p.foto_url, f.nome_urna, f.cargo_tse, f.hash_sha256
    FROM pessoas_unificadas p
    JOIN fotos_auditadas_pessoas f ON f.id = p.foto_id
    LIMIT 5
  `).all();

  console.log('Amostra de Pessoas com Foto Auditada:');
  sample.forEach(s => {
    console.log(`- [ID Foto #${s.foto_id}] ${s.nome_exibicao} (${s.nome_urna} - ${s.cargo_tse}) -> ${s.foto_url}`);
    console.log(`  SHA-256: ${s.hash_sha256.substring(0, 32)}...`);
  });

  db.close();
}

auditarFotos().catch(err => {
  console.error('❌ Erro na auditoria de fotos:', err);
  process.exit(1);
});
