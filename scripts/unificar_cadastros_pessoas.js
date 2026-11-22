/**
 * ==============================================================================
 * MOTOR DE CIÊNCIA DE DADOS E RESOLUÇÃO DE ENTIDADES — ARINOS / MG
 * ==============================================================================
 * Papel: Cientista de Dados & DBA
 * 
 * Função:
 * 1. Resolve inconsistências cadastrais (servidores com múltiplas matrículas).
 * 2. Unifica e agrupa por Nome Canônico (normalizado sem acentos).
 * 3. Cruza dados de:
 *    - Contracheques (Folha Prefeitura + Saúde: 2013-2026)
 *    - Diárias de Viagem (Prefeitura + Saúde: 2013-2026)
 *    - Vereadores e Matérias da Câmara Municipal
 *    - Prefeitos e Vice-Prefeitos
 *    - Candidaturas e Patrimônio Declarado (TSE)
 *    - Quadro Societário de Empresas Credoras (Receita Federal)
 * 4. Calcula o montante TOTAL DE DINHEIRO PÚBLICO recebido por cada indivíduo.
 * 5. Cria a tabela relacional 'pessoas_unificadas' com índices de alta velocidade.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const MASTER_DB = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║  UNIFICAÇÃO CADASTRAL E CONSOLIDAÇÃO DE DINHEIRO PÚBLICO — ARINOS / MG       ║');
console.log('║  Skill: Cientista de Dados & DBA                                             ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const db = new DatabaseSync(MASTER_DB);

console.log('1. Preparando Tabela Relacional `pessoas_unificadas`...');

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  DROP TABLE IF EXISTS pessoas_unificadas;

  CREATE TABLE pessoas_unificadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_canonic TEXT UNIQUE NOT NULL,
    nome_exibicao TEXT NOT NULL,
    matriculas_json TEXT NOT NULL,
    qtd_matriculas INTEGER NOT NULL DEFAULT 1,
    cargos_json TEXT NOT NULL,
    cargos_resumo TEXT NOT NULL,
    entidades_json TEXT NOT NULL,
    
    -- Remuneração de Salários / Proventos
    total_salarios REAL NOT NULL DEFAULT 0,
    qtd_contracheques INTEGER NOT NULL DEFAULT 0,
    ano_primeiro_salario INTEGER,
    ano_ultimo_salario INTEGER,
    maior_salario REAL DEFAULT 0,
    
    -- Diárias e Viagens
    total_diarias REAL NOT NULL DEFAULT 0,
    qtd_diarias INTEGER NOT NULL DEFAULT 0,
    ano_primeira_diaria INTEGER,
    ano_ultima_diaria INTEGER,
    maior_diaria REAL DEFAULT 0,
    destinos_frequentes TEXT,
    
    -- Montante Geral de Dinheiro Público Recebido
    total_dinheiro_publico REAL NOT NULL DEFAULT 0,
    
    -- Vínculos Políticos e Institucionais
    is_politico INTEGER NOT NULL DEFAULT 0,
    is_prefeito INTEGER NOT NULL DEFAULT 0,
    is_vereador INTEGER NOT NULL DEFAULT 0,
    is_candidato INTEGER NOT NULL DEFAULT 0,
    perfil_tipo TEXT NOT NULL DEFAULT 'Servidor Público',
    partido_politico TEXT,
    legislaturas_camara TEXT,
    projetos_apresentados INTEGER DEFAULT 0,
    bens_declarados_tse REAL DEFAULT 0,
    
    -- Alerta de Fornecedor / Empresa
    is_socio_empresa INTEGER NOT NULL DEFAULT 0,
    empresas_vinculadas TEXT,
    
    atualizado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pu_dinheiro ON pessoas_unificadas(total_dinheiro_publico DESC);
  CREATE INDEX IF NOT EXISTS idx_pu_salarios ON pessoas_unificadas(total_salarios DESC);
  CREATE INDEX IF NOT EXISTS idx_pu_diarias ON pessoas_unificadas(total_diarias DESC);
  CREATE INDEX IF NOT EXISTS idx_pu_politico ON pessoas_unificadas(is_politico, total_dinheiro_publico DESC);
  CREATE INDEX IF NOT EXISTS idx_pu_prefeito ON pessoas_unificadas(is_prefeito);
  CREATE INDEX IF NOT EXISTS idx_pu_vereador ON pessoas_unificadas(is_vereador);
  CREATE INDEX IF NOT EXISTS idx_pu_nome ON pessoas_unificadas(nome_canonic);
`);

console.log('  ✔ Tabela e índices criados com sucesso.');

// 2. Extrair dados brutos de contracheques
console.log('\n2. Processando contracheques e identificando matrículas múltiplas...');

const pessoasMap = new Map();

function getOrCreatePessoa(nomeOriginal) {
  const canonic = normalizeName(nomeOriginal);
  if (!canonic) return null;

  if (!pessoasMap.has(canonic)) {
    pessoasMap.set(canonic, {
      nome_canonic: canonic,
      nome_exibicao: String(nomeOriginal).trim(),
      matriculas: new Set(),
      cargos: new Set(),
      entidades: new Set(),
      
      total_salarios: 0,
      qtd_contracheques: 0,
      ano_primeiro_salario: null,
      ano_ultimo_salario: null,
      maior_salario: 0,
      
      total_diarias: 0,
      qtd_diarias: 0,
      ano_primeira_diaria: null,
      ano_ultima_diaria: null,
      maior_diaria: 0,
      destinos: new Map(),
      
      is_politico: 0,
      is_prefeito: 0,
      is_vereador: 0,
      is_candidato: 0,
      perfil_tipo: 'Servidor Público',
      partido_politico: null,
      legislaturas_camara: null,
      projetos_apresentados: 0,
      bens_declarados_tse: 0,
      
      is_socio_empresa: 0,
      empresas_vinculadas: []
    });
  }
  return pessoasMap.get(canonic);
}

// Agregar Contracheques
const contrachequesRows = db.prepare(`
  SELECT 
    nome, matricula, cargo, entidade, total_proventos, ano
  FROM contracheques
`).all();

console.log(`  Processando ${contrachequesRows.length.toLocaleString('pt-BR')} registros de folha...`);

for (const r of contrachequesRows) {
  const p = getOrCreatePessoa(r.nome);
  if (!p) continue;

  if (r.matricula && r.matricula.trim() && r.matricula.trim() !== '0') {
    p.matriculas.add(r.matricula.trim());
  }
  if (r.cargo && r.cargo.trim()) {
    p.cargos.add(r.cargo.trim());
  }
  if (r.entidade && r.entidade.trim()) {
    p.entidades.add(r.entidade.trim());
  }

  const prov = Number(r.total_proventos) || 0;
  p.total_salarios += prov;
  p.qtd_contracheques++;

  if (prov > p.maior_salario) p.maior_salario = prov;
  if (!p.ano_primeiro_salario || r.ano < p.ano_primeiro_salario) p.ano_primeiro_salario = r.ano;
  if (!p.ano_ultimo_salario || r.ano > p.ano_ultimo_salario) p.ano_ultimo_salario = r.ano;
}

console.log(`  ✔ Folha agrupada em ${pessoasMap.size.toLocaleString('pt-BR')} pessoas únicas.`);

// 3. Agregar Diárias de Viagem
console.log('\n3. Processando e cruzando diárias de viagem...');
const diariasRows = db.prepare(`
  SELECT servidor, cargo, destino, valor, ano
  FROM diarias
`).all();

console.log(`  Processando ${diariasRows.length.toLocaleString('pt-BR')} diárias...`);

for (const r of diariasRows) {
  const p = getOrCreatePessoa(r.servidor);
  if (!p) continue;

  if (r.cargo && r.cargo.trim()) {
    p.cargos.add(r.cargo.trim());
  }

  const val = Number(r.valor) || 0;
  p.total_diarias += val;
  p.qtd_diarias++;

  if (val > p.maior_diaria) p.maior_diaria = val;
  if (!p.ano_primeira_diaria || r.ano < p.ano_primeira_diaria) p.ano_primeira_diaria = r.ano;
  if (!p.ano_ultima_diaria || r.ano > p.ano_ultima_diaria) p.ano_ultima_diaria = r.ano;

  if (r.destino && r.destino.trim()) {
    const dest = r.destino.trim().toUpperCase();
    p.destinos.set(dest, (p.destinos.get(dest) || 0) + 1);
  }
}

// 4. Cruzamento Político: Vereadores da Câmara
console.log('\n4. Cruzando e marcando Vereadores da Câmara Municipal...');
let vereadoresEncontrados = 0;
try {
  const verRows = db.prepare(`
    SELECT nome_parlamentar, nome_completo, total_materias, projetos_lei, dados_completos
    FROM camara_vereadores
  `).all();

  for (const v of verRows) {
    const p = getOrCreatePessoa(v.nome_completo);
    if (p) {
      p.is_politico = 1;
      p.is_vereador = 1;
      p.perfil_tipo = 'Vereador';
      p.projetos_apresentados = (v.projetos_lei || 0);
      if (v.nome_parlamentar) {
        p.cargos.add(`Vereador (${v.nome_parlamentar})`);
      }
      vereadoresEncontrados++;
    }
  }
} catch (e) {
  console.warn('  ⚠ Aviso ao ler vereadores:', e.message);
}
console.log(`  ✔ ${vereadoresEncontrados} vereadores identificados e vinculados.`);

// 5. Cruzamento Político: Candidatos TSE (Eleições 2020 e 2024)
console.log('\n5. Cruzando com dados eleitorais do TSE (Prefeitos e Candidatos)...');
let candidatosEncontrados = 0;
try {
  const candRows = db.prepare(`
    SELECT nome_completo, nome_urna, cargo, partido_sigla, resultado, total_bens
    FROM eleicoes_candidatos
  `).all();

  for (const c of candRows) {
    const p = getOrCreatePessoa(c.nome_completo);
    if (p) {
      p.is_politico = 1;
      p.is_candidato = 1;
      if (c.partido_sigla) p.partido_politico = c.partido_sigla;
      if (c.total_bens) p.bens_declarados_tse = c.total_bens;

      const cargoNorm = (c.cargo || '').toUpperCase();
      if (cargoNorm.includes('PREFEITO') && !cargoNorm.includes('VICE')) {
        if (c.resultado && c.resultado.toUpperCase().includes('ELEITO')) {
          p.is_prefeito = 1;
          p.perfil_tipo = 'Prefeito Municipal';
        } else {
          if (!p.is_prefeito) p.perfil_tipo = 'Candidato a Prefeito';
        }
      } else if (cargoNorm.includes('VICE')) {
        if (c.resultado && c.resultado.toUpperCase().includes('ELEITO')) {
          p.perfil_tipo = 'Vice-Prefeito';
        }
      } else if (cargoNorm.includes('VEREADOR')) {
        if (!p.is_vereador) {
          p.perfil_tipo = 'Candidato a Vereador';
        }
      }
      candidatosEncontrados++;
    }
  }
} catch (e) {
  console.warn('  ⚠ Aviso ao ler candidatos TSE:', e.message);
}
console.log(`  ✔ ${candidatosEncontrados} candidaturas vinculadas.`);

// Identificar explicitamente Prefeitos pelos cargos históricos
for (const p of pessoasMap.values()) {
  for (const c of p.cargos) {
    const cu = c.toUpperCase();
    if (cu.includes('PREFEITO MUNICIPAL') || cu === 'PREFEITO') {
      p.is_politico = 1;
      p.is_prefeito = 1;
      p.perfil_tipo = 'Prefeito Municipal';
      break;
    }
  }
}

// 6. Cruzamento de Sócios de Empresas Fornecedoras (QSA Receita Federal)
console.log('\n6. Cruzando com Quadro Societário da Receita Federal...');
let sociosEncontrados = 0;
try {
  const sociosRows = db.prepare(`
    SELECT s.nome_socio, s.qualificacao_socio, c.razao_social, c.cnpj
    FROM empresas_socios s
    LEFT JOIN empresas_contratadas c ON s.cnpj = c.cnpj
  `).all();

  for (const s of sociosRows) {
    if (!s.nome_socio) continue;
    const p = getOrCreatePessoa(s.nome_socio);
    if (p) {
      p.is_socio_empresa = 1;
      p.empresas_vinculadas.push({
        cnpj: s.cnpj,
        razao_social: s.razao_social || 'Empresa Fornecedora',
        qualificacao: s.qualificacao_socio || 'Sócio'
      });
      sociosEncontrados++;
    }
  }
} catch (e) {
  console.warn('  ⚠ Aviso ao ler sócios:', e.message);
}
console.log(`  ✔ ${sociosEncontrados} vínculos societários mapeados.`);

// 7. Gravação em Lote na Tabela `pessoas_unificadas`
console.log(`\n7. Gravando ${pessoasMap.size.toLocaleString('pt-BR')} pessoas unificadas no SQLite...`);

const stmtInsert = db.prepare(`
  INSERT INTO pessoas_unificadas (
    nome_canonic, nome_exibicao, matriculas_json, qtd_matriculas,
    cargos_json, cargos_resumo, entidades_json,
    total_salarios, qtd_contracheques, ano_primeiro_salario, ano_ultimo_salario, maior_salario,
    total_diarias, qtd_diarias, ano_primeira_diaria, ano_ultima_diaria, maior_diaria, destinos_frequentes,
    total_dinheiro_publico,
    is_politico, is_prefeito, is_vereador, is_candidato, perfil_tipo, partido_politico,
    legislaturas_camara, projetos_apresentados, bens_declarados_tse,
    is_socio_empresa, empresas_vinculadas, atualizado_em
  ) VALUES (
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?
  )
`);

db.exec('BEGIN TRANSACTION;');

const agora = new Date().toISOString();
let gravados = 0;

for (const p of pessoasMap.values()) {
  const matriculasArr = Array.from(p.matriculas);
  const cargosArr = Array.from(p.cargos);
  const entidadesArr = Array.from(p.entidades);

  // Top 3 destinos mais frequentes
  const sortedDestinos = Array.from(p.destinos.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(d => `${d[0]} (${d[1]}x)`);
  
  const totalGeral = p.total_salarios + p.total_diarias;

  stmtInsert.run(
    p.nome_canonic,
    p.nome_exibicao,
    JSON.stringify(matriculasArr),
    matriculasArr.length,
    JSON.stringify(cargosArr),
    cargosArr.slice(0, 3).join(', ') || 'Não especificado',
    JSON.stringify(entidadesArr),
    
    p.total_salarios,
    p.qtd_contracheques,
    p.ano_primeiro_salario,
    p.ano_ultimo_salario,
    p.maior_salario,
    
    p.total_diarias,
    p.qtd_diarias,
    p.ano_primeira_diaria,
    p.ano_ultima_diaria,
    p.maior_diaria,
    sortedDestinos.join(' • '),
    
    totalGeral,
    
    p.is_politico,
    p.is_prefeito,
    p.is_vereador,
    p.is_candidato,
    p.perfil_tipo,
    p.partido_politico,
    p.legislaturas_camara,
    p.projetos_apresentados,
    p.bens_declarados_tse,
    
    p.is_socio_empresa,
    p.empresas_vinculadas.length > 0 ? JSON.stringify(p.empresas_vinculadas) : null,
    agora
  );
  gravados++;
}

db.exec('COMMIT;');
console.log(`  ✔ ${gravados.toLocaleString('pt-BR')} perfis cadastrais gravados com sucesso!`);

// 8. Relatório dos Maiores Recebedores de Dinheiro Público
console.log('\n================================================================================');
console.log('TOP 10 MAIORES RECEBEDORES DE DINHEIRO PÚBLICO EM ARINOS / MG:');
console.log('================================================================================');

const topGeral = db.prepare(`
  SELECT 
    nome_exibicao, perfil_tipo, cargos_resumo, qtd_matriculas,
    total_salarios, total_diarias, total_dinheiro_publico
  FROM pessoas_unificadas
  ORDER BY total_dinheiro_publico DESC
  LIMIT 10
`).all();

for (let i = 0; i < topGeral.length; i++) {
  const row = topGeral[i];
  console.log(`${String(i + 1).padStart(2, '0')}. ${row.nome_exibicao.padEnd(35)} | ${row.perfil_tipo.padEnd(20)} | Matrículas: ${row.qtd_matriculas}`);
  console.log(`    Salários: R$ ${row.total_salarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Diárias: R$ ${row.total_diarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | TOTAL: R$ ${row.total_dinheiro_publico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

console.log('\n================================================================================');
console.log('PREFEITOS MUNICIPAIS E TOTAL DE DINHEIRO PÚBLICO:');
console.log('================================================================================');

const prefeitosList = db.prepare(`
  SELECT 
    nome_exibicao, perfil_tipo, total_salarios, total_diarias, total_dinheiro_publico, qtd_diarias, qtd_contracheques
  FROM pessoas_unificadas
  WHERE is_prefeito = 1
  ORDER BY total_dinheiro_publico DESC
`).all();

for (const pr of prefeitosList) {
  console.log(`• ${pr.nome_exibicao.padEnd(35)} -> Salários: R$ ${pr.total_salarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pr.qtd_contracheques} folhas) | Diárias: R$ ${pr.total_diarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pr.qtd_diarias} viagens) | TOTAL: R$ ${pr.total_dinheiro_publico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

db.close();

console.log('\n================================================================================');
console.log('UNIFICAÇÃO CADASTRAL CONCLUÍDA COM SUCESSO!');
console.log('================================================================================\n');
