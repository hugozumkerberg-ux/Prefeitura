/**
 * ==============================================================================
 * SCRIPT DE MIGRAÇÃO RELACIONAL, SANITIZAÇÃO DE DADOS & AUDITORIA DBA — ARINOS/MG
 * Skill DBA + Cientista de Dados
 * ==============================================================================
 */

const { getMasterDb } = require('../lib/db');
const { normalizarTexto } = require('../lib/normalizador');
const db = getMasterDb();

console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log('║  MIGRAÇÃO RELACIONAL E SANITIZAÇÃO DE DADOS — PORTAL ARINOS/MG         ║');
console.log('║  Governança de Dados, Remoção de Zeros, Análise Hífen e 3FN            ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

/**
 * Função pericial de extração e higienização de matrícula pública
 * @param {string} mat Matrícula bruta
 * @returns {object} Dados decompostos da matrícula
 */
function decomporMatricula(mat) {
  if (!mat) {
    return {
      original: '',
      limpa: '',
      base: null,
      digito: null,
      separador: null,
      tem_contrato: false,
      padrao: 'VAZIO'
    };
  }

  const raw = String(mat).trim();
  
  // Padrão comum em Arinos e MG: zeros opcionais + número base + separador (. ou -) + dígito/contrato
  const match = raw.match(/^0*([0-9]+)(?:([.\-])([0-9A-Za-z]+))?$/);
  if (match) {
    const base = parseInt(match[1], 10);
    const separador = match[2] || null;
    const digito = match[3] !== undefined ? match[3] : null;
    // Padroniza no formato nacional canônico com hífen: "832-7" ou apenas "832"
    const limpa = digito !== null ? `${base}-${digito}` : String(base);
    return {
      original: raw,
      limpa,
      base,
      digito,
      separador,
      tem_contrato: digito !== null,
      padrao: digito !== null ? 'BASE_COM_DIGITO' : 'APENAS_BASE'
    };
  }

  // Fallback para outros formatos
  const limpa = raw.replace(/^0+/, '') || '0';
  return {
    original: raw,
    limpa,
    base: parseInt(limpa, 10) || null,
    digito: null,
    separador: null,
    tem_contrato: false,
    padrao: 'NAO_PADRAO'
  };
}

// 1. Configurar Pragma e Transações
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA journal_mode = WAL;');

// 2. Adicionar novas colunas na tabela contracheques (se não existirem)
console.log('1. Verificando e estendendo estrutura da tabela contracheques...');
const colunasExistentes = db.prepare('PRAGMA table_info(contracheques)').all().map(c => c.name);

function adicionarColunaSeNaoExiste(tabela, coluna, definicao) {
  if (!colunasExistentes.includes(coluna)) {
    console.log(`   -> Adicionando coluna ${coluna} em ${tabela}...`);
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao};`);
  }
}

adicionarColunaSeNaoExiste('contracheques', 'pessoa_id', 'INTEGER');
adicionarColunaSeNaoExiste('contracheques', 'matricula_limpa', 'TEXT');
adicionarColunaSeNaoExiste('contracheques', 'matricula_base', 'INTEGER');
adicionarColunaSeNaoExiste('contracheques', 'matricula_digito', 'TEXT');
adicionarColunaSeNaoExiste('contracheques', 'nome_normalizado', 'TEXT');

// 3. Criar tabela normalizada dim_servidores_matriculas (3FN)
console.log('\n2. Criando tabela relacional dim_servidores_matriculas...');
db.exec(`
  CREATE TABLE IF NOT EXISTS dim_servidores_matriculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id INTEGER NOT NULL REFERENCES pessoas_unificadas(id) ON DELETE CASCADE,
    matricula_original TEXT NOT NULL,
    matricula_limpa TEXT NOT NULL,
    matricula_base INTEGER NOT NULL,
    matricula_digito TEXT,
    separador_original TEXT,
    cargos_exercidos TEXT,
    vinculos_exercidos TEXT,
    entidades TEXT,
    qtd_folhas INTEGER NOT NULL DEFAULT 0,
    primeiro_ano INTEGER,
    ultimo_ano INTEGER,
    total_recebido REAL NOT NULL DEFAULT 0.0,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pessoa_id, matricula_original)
  );
`);

// 4. Criar tabela de auditoria analise_inconsistencias_cadastrais
console.log('3. Criando tabela analise_inconsistencias_cadastrais...');
db.exec(`
  CREATE TABLE IF NOT EXISTS analise_inconsistencias_cadastrais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL,
    gravidade TEXT NOT NULL,
    descricao TEXT NOT NULL,
    total_ocorrencias INTEGER NOT NULL DEFAULT 0,
    detalhes_json TEXT,
    analisado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// 5. Mapear pessoas_unificadas em memória para resolução veloz (<1s)
console.log('\n4. Carregando catálogo de pessoas_unificadas para resolução de entidades...');
const pessoas = db.prepare(`
  SELECT id, nome_canonic, nome_exibicao, matriculas_json
  FROM pessoas_unificadas
`).all();

const mapaPessoasPorNome = new Map();
const mapaPessoasPorMatricula = new Map();

pessoas.forEach(p => {
  const normCanonic = normalizarTexto(p.nome_canonic);
  const normExib = normalizarTexto(p.nome_exibicao);
  mapaPessoasPorNome.set(normCanonic, p.id);
  mapaPessoasPorNome.set(normExib, p.id);

  try {
    const mats = JSON.parse(p.matriculas_json || '[]');
    mats.forEach(m => {
      const dec = decomporMatricula(m);
      mapaPessoasPorMatricula.set(dec.original, p.id);
      mapaPessoasPorMatricula.set(dec.limpa, p.id);
      if (dec.base) mapaPessoasPorMatricula.set(String(dec.base), p.id);
    });
  } catch(e) {}
});

console.log(`   -> ${pessoas.length.toLocaleString('pt-BR')} perfis carregados no índice em memória.`);

// 6. Atualizar a tabela contracheques com sanitização completa
console.log('\n5. Higienizando 153.938 contracheques (removendo zeros, isolando base/dígito e associando pessoa_id)...');

const t0 = Date.now();

// Atualização estruturada em lotes para altíssimo desempenho SQLite
const linhas = db.prepare(`
  SELECT id, matricula, nome
  FROM contracheques
`).all();

console.log(`   -> Registros lidos em ${Date.now() - t0}ms. Iniciando transação em massa...`);

const stmtUpdate = db.prepare(`
  UPDATE contracheques
  SET 
    pessoa_id = ?,
    matricula_limpa = ?,
    matricula_base = ?,
    matricula_digito = ?,
    nome_normalizado = ?
  WHERE id = ?
`);

db.exec('BEGIN TRANSACTION;');

let alteradosCount = 0;
let comZeroCount = 0;
let comDigitoCount = 0;
let pessoaVinculadaCount = 0;

for (let i = 0; i < linhas.length; i++) {
  const row = linhas[i];
  const dec = decomporMatricula(row.matricula);
  const normNome = normalizarTexto(row.nome);

  // Vincular pessoa_id (por nome exato normalizado ou matrícula)
  let pId = mapaPessoasPorNome.get(normNome) || mapaPessoasPorMatricula.get(row.matricula) || null;

  if (row.matricula && row.matricula.startsWith('0')) comZeroCount++;
  if (dec.tem_contrato) comDigitoCount++;
  if (pId) pessoaVinculadaCount++;

  stmtUpdate.run(
    pId,
    dec.limpa,
    dec.base,
    dec.digito,
    normNome,
    row.id
  );

  alteradosCount++;
  if (alteradosCount % 30000 === 0) {
    console.log(`      ... ${alteradosCount.toLocaleString('pt-BR')} registros processados (${Math.round((alteradosCount/linhas.length)*100)}%)`);
  }
}

db.exec('COMMIT;');
console.log(`   ✔ Atualização concluída com sucesso em ${Date.now() - t0}ms!`);
console.log(`     • Total de contracheques higienizados: ${alteradosCount.toLocaleString('pt-BR')}`);
console.log(`     • Matrículas com zeros à esquerda corrigidas: ${comZeroCount.toLocaleString('pt-BR')}`);
console.log(`     • Matrículas com dígito/contrato isoladas: ${comDigitoCount.toLocaleString('pt-BR')}`);
console.log(`     • Contracheques com pessoa_id associado: ${pessoaVinculadaCount.toLocaleString('pt-BR')} (${Math.round((pessoaVinculadaCount/alteradosCount)*100)}%)`);

// 7. Popular a tabela relacional dim_servidores_matriculas
console.log('\n6. Populando tabela dim_servidores_matriculas (Agrupamento por Pessoa e Matrícula)...');

db.exec(`DELETE FROM dim_servidores_matriculas;`);

const stmtInsertMat = db.prepare(`
  INSERT INTO dim_servidores_matriculas (
    pessoa_id, matricula_original, matricula_limpa, matricula_base, matricula_digito,
    separador_original, cargos_exercidos, vinculos_exercidos, entidades,
    qtd_folhas, primeiro_ano, ultimo_ano, total_recebido
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const agregados = db.prepare(`
  SELECT 
    pessoa_id,
    matricula as matricula_original,
    matricula_limpa,
    matricula_base,
    matricula_digito,
    GROUP_CONCAT(DISTINCT cargo) as cargos,
    GROUP_CONCAT(DISTINCT vinculo) as vinculos,
    GROUP_CONCAT(DISTINCT entidade) as entidades,
    COUNT(*) as qtd_folhas,
    MIN(ano) as primeiro_ano,
    MAX(ano) as ultimo_ano,
    SUM(total_proventos) as total_recebido
  FROM contracheques
  WHERE pessoa_id IS NOT NULL AND matricula IS NOT NULL
  GROUP BY pessoa_id, matricula
`).all();

db.exec('BEGIN TRANSACTION;');
for (const a of agregados) {
  const dec = decomporMatricula(a.matricula_original);
  stmtInsertMat.run(
    a.pessoa_id,
    a.matricula_original,
    a.matricula_limpa,
    a.matricula_base,
    a.matricula_digito,
    dec.separador,
    a.cargos || '',
    a.vinculos || '',
    a.entidades || '',
    a.qtd_folhas,
    a.primeiro_ano,
    a.ultimo_ano,
    a.total_recebido || 0
  );
}
db.exec('COMMIT;');

const totalMatsDim = db.prepare('SELECT count(*) as total FROM dim_servidores_matriculas').get().total;
console.log(`   ✔ ${totalMatsDim.toLocaleString('pt-BR')} matrículas dimensionais registradas com integridade referencial.`);

// 8. Análise Pericial de Inconsistências (Ciência de Dados & Governança)
console.log('\n7. Registrando Diagnóstico de Inconsistências Cadastrais...');

db.exec('DELETE FROM analise_inconsistencias_cadastrais;');

const stmtIncons = db.prepare(`
  INSERT INTO analise_inconsistencias_cadastrais (
    categoria, tipo, gravidade, descricao, total_ocorrencias, detalhes_json
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

// A. Zeros à Esquerda
stmtIncons.run(
  'MATRICULA',
  'ZEROS_A_ESQUERDA',
  'CORRIGIDO',
  'Matrículas públicas da ADPM armazenadas com preenchimento de zeros à esquerda (ex: 000832.7). Padronizadas para o formato canônico sem zeros (832-7).',
  comZeroCount,
  JSON.stringify({ formato_original: '00XXXX.D', formato_canico: 'XXXX-D', total_linhas: comZeroCount })
);

// B. Sufixo de Contrato / Dígito Verificador
stmtIncons.run(
  'MATRICULA',
  'DIGITO_CONTRATO_HIFEN_PONTO',
  'INFORMATIVO',
  'Uso do separador decimal (.) no sistema ADPM de Arinos indicando o número do vínculo/contrato do servidor (ex: 832.7). O dígito pós separador identifica o contrato ou cargo em exercício.',
  comDigitoCount,
  JSON.stringify({ separador_adpm: '.', separador_padrao_nacional: '-', ocorrencias: comDigitoCount })
);

// C. Múltiplas Matrículas por Pessoa (Servidores com acumulação lícita, novo concurso ou comissão)
const multiMat = db.prepare(`
  SELECT pessoa_id, COUNT(DISTINCT matricula_limpa) as qtd_mats
  FROM contracheques
  WHERE pessoa_id IS NOT NULL
  GROUP BY pessoa_id
  HAVING COUNT(DISTINCT matricula_limpa) > 1
`).all();

const multiMatDetalhes = db.prepare(`
  SELECT p.nome_exibicao, COUNT(DISTINCT c.matricula_limpa) as mats, GROUP_CONCAT(DISTINCT c.matricula_limpa) as lista_mats
  FROM contracheques c
  JOIN pessoas_unificadas p ON p.id = c.pessoa_id
  GROUP BY p.id
  HAVING mats > 1
  ORDER BY mats DESC, p.nome_exibicao ASC
  LIMIT 20
`).all();

stmtIncons.run(
  'SERVIDOR',
  'MULTIPLAS_MATRICULAS_MESMA_PESSOA',
  'ALERTA',
  'Servidores que possuem 2 ou mais matrículas distintas no histórico da Prefeitura (mudança de vínculo, novo concurso, contrato administrativo renovado ou cargo em comissão).',
  multiMat.length,
  JSON.stringify({ total_servidores_afetados: multiMat.length, amostra_top20: multiMatDetalhes })
);

// D. Nomes com Variações de Acentuação e Espaços
const variacoesNomes = db.prepare(`
  SELECT nome_normalizado, COUNT(DISTINCT nome) as variantes, GROUP_CONCAT(DISTINCT nome) as nomes
  FROM contracheques
  GROUP BY nome_normalizado
  HAVING COUNT(DISTINCT nome) > 1
`).all();

stmtIncons.run(
  'NOMES',
  'DIVERGENCIA_GRAFIA_ACENTUACAO',
  'CORRIGIDO',
  'Variações de acentuação, caixa alta/baixa ou espaçamento no mesmo nome civil entre diferentes folhas de pagamento. Resolvido via chave canônica normalizada.',
  variacoesNomes.length,
  JSON.stringify({ total_agrupamentos_com_variacoes: variacoesNomes.length, amostra_10: variacoesNomes.slice(0, 10) })
);

console.log('   ✔ 4 categorias de inconsistências catalogadas com sucesso.');

// 9. Criar Índices de Cobertura de Alta Performance (DBA)
console.log('\n8. Criando índices de cobertura de alta performance...');

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_contra_pessoa_id ON contracheques(pessoa_id);
  CREATE INDEX IF NOT EXISTS idx_contra_mat_limpa ON contracheques(matricula_limpa);
  CREATE INDEX IF NOT EXISTS idx_contra_mat_base ON contracheques(matricula_base);
  CREATE INDEX IF NOT EXISTS idx_contra_nome_norm ON contracheques(nome_normalizado);
  
  CREATE INDEX IF NOT EXISTS idx_serv_mat_pessoa ON dim_servidores_matriculas(pessoa_id);
  CREATE INDEX IF NOT EXISTS idx_serv_mat_limpa ON dim_servidores_matriculas(matricula_limpa);
  CREATE INDEX IF NOT EXISTS idx_serv_mat_base ON dim_servidores_matriculas(matricula_base);
`);

// 10. Criar Views Relacionais Estruturadas
console.log('9. Criando views relacionais estruturadas...');

db.exec(`
  DROP VIEW IF EXISTS vw_servidores_agrupados;
  CREATE VIEW vw_servidores_agrupados AS
  SELECT 
    p.id as pessoa_id,
    p.nome_exibicao,
    p.nome_canonic,
    p.perfil_tipo,
    p.cargos_resumo,
    COUNT(DISTINCT sm.matricula_limpa) as qtd_matriculas_unicas,
    GROUP_CONCAT(DISTINCT sm.matricula_limpa) as matriculas_formatadas,
    p.total_salarios,
    p.qtd_contracheques,
    p.total_diarias,
    p.total_dinheiro_publico,
    p.is_politico,
    p.is_prefeito,
    p.is_vereador,
    p.is_socio_empresa
  FROM pessoas_unificadas p
  LEFT JOIN dim_servidores_matriculas sm ON sm.pessoa_id = p.id
  GROUP BY p.id;
`);

db.exec(`
  DROP VIEW IF EXISTS vw_contracheques_higienizados;
  CREATE VIEW vw_contracheques_higienizados AS
  SELECT 
    c.id,
    c.pessoa_id,
    c.ano,
    c.mes,
    c.entidade,
    c.matricula as matricula_original,
    c.matricula_limpa,
    c.matricula_base,
    c.matricula_digito,
    c.nome,
    c.cargo,
    c.vinculo,
    c.tipo_folha,
    c.total_proventos as salario_bruto,
    c.total_descontos,
    c.salario_liquido,
    p.perfil_tipo
  FROM contracheques c
  LEFT JOIN pessoas_unificadas p ON p.id = c.pessoa_id;
`);

console.log('10. Otimizando estatísticas de consulta (ANALYZE)...');
db.exec('ANALYZE;');

console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║  MIGRAÇÃO RELACIONAL E SANITIZAÇÃO CONCLUÍDAS COM 100% DE SUCESSO!     ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
