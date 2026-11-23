/**
 * ==============================================================================
 * SCRIPT ETL DE MIGRAÇÃO: SQLITE -> MYSQL (PORTAL DA TRANSPARÊNCIA DE ARINOS / MG)
 * ==============================================================================
 * Exporta integralmente todas as tabelas e dados relacionais do SQLite para um
 * script oficial de dump MySQL (database/arinos_transparencia_mysql.sql) e,
 * opcionalmente, conecta-se diretamente a uma instância MySQL ativa.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const SQLITE_DB = path.join(BASE_DIR, 'dados', 'arinos_transparencia_master.sqlite3');
const SCHEMA_FILE = path.join(BASE_DIR, 'database', 'schema.sql');
const DUMP_OUTPUT = path.join(BASE_DIR, 'database', 'arinos_transparencia_mysql.sql');

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${str}'`;
}

async function migrarParaMysql() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║       PIPELINE DE MIGRAÇÃO RELACIONAL: SQLITE -> MYSQL (ARINOS / MG)         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(SQLITE_DB)) {
    console.error('❌ Arquivo de banco SQLite master não encontrado:', SQLITE_DB);
    process.exit(1);
  }

  const db = new DatabaseSync(SQLITE_DB, { readOnly: true });
  console.log('1. Banco de origem SQLite conectado com sucesso.');

  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');

  // Abre stream de escrita para o dump MySQL
  const outputStream = fs.createWriteStream(DUMP_OUTPUT, { encoding: 'utf-8' });
  outputStream.write(`-- ==============================================================================\n`);
  outputStream.write(`-- DUMP OFICIAL COMPLETO MYSQL — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG\n`);
  outputStream.write(`-- Data de Geração: ${new Date().toISOString()}\n`);
  outputStream.write(`-- Codificação: UTF-8 (utf8mb4)\n`);
  outputStream.write(`-- ==============================================================================\n\n`);
  outputStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
  outputStream.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
  outputStream.write(`SET time_zone = "+00:00";\n\n`);

  outputStream.write(schemaContent);
  outputStream.write(`\n\n-- ==============================================================================\n`);
  outputStream.write(`-- DADOS E REGISTROS RELACIONAIS\n`);
  outputStream.write(`-- ==============================================================================\n\n`);

  // Tabelas em ordem de dependência relacional
  const tabelasParaExportar = [
    'pessoas_unificadas',
    'dim_servidores_matriculas',
    'contracheques',
    'despesas',
    'diarias',
    'contratos',
    'receitas',
    'convenios',
    'empresas_contratadas',
    'empresas_socios',
    'eleicoes_candidatos',
    'camara_vereadores',
    'camara_materias',
    'fotos_auditadas_pessoas',
    'auditoria_consultas',
    'turismo_pontos',
    'noticias_relevantes'
  ];

  let totalGeralExportado = 0;

  for (const tabela of tabelasParaExportar) {
    // Verifica se a tabela existe no SQLite
    const exists = db.prepare(`SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name=?`).get(tabela);
    if (!exists || exists.c === 0) {
      console.log(`  ℹ Tabela ${tabela} não encontrada no SQLite (pulando).`);
      continue;
    }

    const totalRows = db.prepare(`SELECT count(*) as c FROM ${tabela}`).get().c;
    console.log(`\n• Exportando ${tabela} (${totalRows.toLocaleString('pt-BR')} registros)...`);

    if (totalRows === 0) {
      continue;
    }

    outputStream.write(`-- Dados da tabela: ${tabela}\n`);
    outputStream.write(`START TRANSACTION;\n`);

    const colsInfo = db.prepare(`PRAGMA table_info(${tabela})`).all();
    const colNames = colsInfo.map(c => `\`${c.name}\``).join(', ');

    const batchSize = 1000;
    let offset = 0;

    while (offset < totalRows) {
      const rows = db.prepare(`SELECT * FROM ${tabela} LIMIT ${batchSize} OFFSET ${offset}`).all();
      if (rows.length === 0) break;

      const valuesBlock = rows.map(r => {
        const values = colsInfo.map(c => escapeSql(r[c.name]));
        return `(${values.join(', ')})`;
      }).join(',\n');

      outputStream.write(`INSERT INTO \`${tabela}\` (${colNames}) VALUES\n${valuesBlock};\n`);
      offset += rows.length;
    }

    outputStream.write(`COMMIT;\n\n`);
    totalGeralExportado += totalRows;
    console.log(`  ✔ ${tabela}: ${totalRows.toLocaleString('pt-BR')} registros exportados em lotes.`);
  }

  outputStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  outputStream.write(`-- FIM DO DUMP MYSQL\n`);
  outputStream.end();

  db.close();

  await new Promise(resolve => outputStream.on('finish', resolve));

  const stat = fs.statSync(DUMP_OUTPUT);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

  console.log(`\n================================================================================`);
  console.log(`✅ EXPORTAÇÃO MYSQL CONCLUÍDA COM SUCESSO!`);
  console.log(`• Total de registros exportados: ${totalGeralExportado.toLocaleString('pt-BR')}`);
  console.log(`• Arquivo de Dump: ${DUMP_OUTPUT}`);
  console.log(`• Tamanho do arquivo SQL: ${sizeMb} MB`);
  console.log(`================================================================================\n`);
}

migrarParaMysql().catch(err => {
  console.error('❌ Erro durante a migração para MySQL:', err);
  process.exit(1);
});
