/**
 * ==============================================================================
 * OTIMIZAÇÃO ESTRUTURAL DO BANCO DE DADOS MASTER — ARINOS / MG
 * Criação de índices estratégicos de alta performance e View Relacional de Funcionários
 * ==============================================================================
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath);

console.log('Iniciando otimização do banco de dados SQLite...');

// 1. Configurar WAL mode para concorrência de alta velocidade
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA cache_size = -64000;'); // 64MB de cache em memória
db.exec('PRAGMA temp_store = MEMORY;');

// 2. Criar índices para acelerar busca em contracheques (154k registros)
console.log('Criando índices em contracheques...');
db.exec('CREATE INDEX IF NOT EXISTS idx_contra_nome_nocase ON contracheques(nome COLLATE NOCASE);');
db.exec('CREATE INDEX IF NOT EXISTS idx_contra_cargo_nocase ON contracheques(cargo COLLATE NOCASE);');
db.exec('CREATE INDEX IF NOT EXISTS idx_contra_matricula ON contracheques(matricula);');
db.exec('CREATE INDEX IF NOT EXISTS idx_contra_vinculo ON contracheques(vinculo);');

// 3. Criar índices para acelerar busca em pessoas_unificadas (2.865 registros)
console.log('Criando índices em pessoas_unificadas...');
db.exec('CREATE INDEX IF NOT EXISTS idx_pu_nome_exibicao_nocase ON pessoas_unificadas(nome_exibicao COLLATE NOCASE);');
db.exec('CREATE INDEX IF NOT EXISTS idx_pu_cargos_nocase ON pessoas_unificadas(cargos_resumo COLLATE NOCASE);');
db.exec('CREATE INDEX IF NOT EXISTS idx_pu_perfil_tipo ON pessoas_unificadas(perfil_tipo);');
db.exec('CREATE INDEX IF NOT EXISTS idx_pu_is_politico ON pessoas_unificadas(is_politico);');

// 4. Criar View Relacional Especializada de Funcionários e Servidores Públicos
console.log('Criando View Relacional vw_funcionarios_servidores...');
db.exec(`
  DROP VIEW IF EXISTS vw_funcionarios_servidores;
  CREATE VIEW vw_funcionarios_servidores AS
  SELECT 
    id,
    nome_canonic,
    nome_exibicao,
    perfil_tipo,
    cargos_resumo,
    qtd_matriculas,
    matriculas_json,
    total_salarios,
    qtd_contracheques,
    ano_primeiro_salario,
    ano_ultimo_salario,
    maior_salario,
    total_diarias,
    qtd_diarias,
    destinos_frequentes,
    total_dinheiro_publico,
    is_politico,
    is_prefeito,
    is_vereador,
    is_socio_empresa,
    partido_politico,
    foto_url,
    foto_id
  FROM pessoas_unificadas;
`);

// 5. Executar ANALYZE para atualizar estatísticas do otimizador de consultas
console.log('Executando ANALYZE no SQLite...');
db.exec('ANALYZE;');

console.log('Otimização concluída com sucesso!');
db.close();
