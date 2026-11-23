/**
 * Script de Diagnóstico e Ciência de Dados: Padrões de Matrículas e Nomes — Arinos/MG
 */
const { getMasterDb } = require('../lib/db');
const db = getMasterDb();

console.log('--- INICIANDO DIAGNÓSTICO ANALÍTICO DE MATRÍCULAS E NOMES ---\n');

// 1. Total de registros e matrículas distintas
const totalGeral = db.prepare('SELECT count(*) as total FROM contracheques').get().total;
const matriculasDistintas = db.prepare('SELECT count(DISTINCT matricula) as total FROM contracheques').get().total;
const nomesDistintos = db.prepare('SELECT count(DISTINCT nome) as total FROM contracheques').get().total;

console.log(`1. Visão Geral:`);
console.log(`   - Total de Contracheques: ${totalGeral.toLocaleString('pt-BR')}`);
console.log(`   - Matrículas Distintas: ${matriculasDistintas.toLocaleString('pt-BR')}`);
console.log(`   - Nomes Distintos: ${nomesDistintos.toLocaleString('pt-BR')}\n`);

// 2. Análise de Zeros à Esquerda
const zerosEsquerda = db.prepare(`
  SELECT count(*) as qtd, count(DISTINCT matricula) as qtd_mat
  FROM contracheques
  WHERE matricula LIKE '0%'
`).get();

console.log(`2. Padrão: Zeros à Esquerda:`);
console.log(`   - Contracheques com matrícula iniciando em 0: ${zerosEsquerda.qtd.toLocaleString('pt-BR')}`);
console.log(`   - Matrículas distintas com zeros: ${zerosEsquerda.qtd_mat.toLocaleString('pt-BR')}`);

const exemplosZeros = db.prepare(`
  SELECT matricula, nome, cargo, count(*) as ocorrencias
  FROM contracheques
  WHERE matricula LIKE '0%'
  GROUP BY matricula, nome
  ORDER BY ocorrencias DESC
  LIMIT 5
`).all();
console.log('   - Exemplos reais com zeros à esquerda:');
exemplosZeros.forEach(e => console.log(`     • Matrícula: "${e.matricula}" | Nome: ${e.nome} | Cargo: ${e.cargo} (${e.ocorrencias} folhas)`));
console.log('');

// 3. Análise de Padrão com Hífen (-)
const comHifen = db.prepare(`
  SELECT count(*) as qtd, count(DISTINCT matricula) as qtd_mat
  FROM contracheques
  WHERE matricula LIKE '%-%'
`).get();

console.log(`3. Padrão: Matrículas com Hífen (-):`);
console.log(`   - Contracheques com hífen: ${comHifen.qtd.toLocaleString('pt-BR')}`);
console.log(`   - Matrículas distintas com hífen: ${comHifen.qtd_mat.toLocaleString('pt-BR')}`);

const exemplosHifen = db.prepare(`
  SELECT matricula, nome, cargo, count(*) as ocorrencias
  FROM contracheques
  WHERE matricula LIKE '%-%'
  GROUP BY matricula, nome
  ORDER BY ocorrencias DESC
  LIMIT 8
`).all();
console.log('   - Exemplos reais com hífen:');
exemplosHifen.forEach(e => console.log(`     • Matrícula: "${e.matricula}" | Nome: ${e.nome} | Cargo: ${e.cargo} (${e.ocorrencias} folhas)`));
console.log('');

// 4. Distribuição de Sufixos após o Hífen
const sufixos = db.prepare(`
  SELECT 
    CASE 
      WHEN matricula LIKE '%-%' THEN substr(matricula, instr(matricula, '-') + 1)
      ELSE 'SEM_HIFEN'
    END as sufixo,
    count(*) as qtd,
    count(DISTINCT matricula) as mats_distintas
  FROM contracheques
  GROUP BY sufixo
  ORDER BY qtd DESC
  LIMIT 15
`).all();

console.log(`4. Distribuição dos Dígitos/Sufixos após o Hífen:`);
sufixos.forEach(s => console.log(`   • Sufixo: "${s.sufixo}" -> ${s.qtd.toLocaleString('pt-BR')} contracheques (${s.mats_distintas} matrículas distintas)`));
console.log('');

// 5. Casos de Mesmo Nome com Matrículas Diferentes (Agrupamento por Nome)
const multiMatriculaPorNome = db.prepare(`
  SELECT nome, count(DISTINCT matricula) as qtd_mats, min(ano) as min_ano, max(ano) as max_ano, count(*) as total_folhas, sum(total_proventos) as total_bruto
  FROM contracheques
  GROUP BY nome
  HAVING count(DISTINCT matricula) > 1
  ORDER BY qtd_mats DESC, total_folhas DESC
  LIMIT 10
`).all();

console.log(`5. Casos de Mesmo Nome com Múltiplas Matrículas (Exemplos Críticos):`);
multiMatriculaPorNome.forEach(m => {
  const mats = db.prepare('SELECT DISTINCT matricula, cargo, vinculo FROM contracheques WHERE nome = ?').all(m.nome);
  console.log(`   • Nome: ${m.nome} (${m.qtd_mats} matrículas diferentes, ${m.total_folhas} folhas, R$ ${Number(m.total_bruto).toLocaleString('pt-BR', {minimumFractionDigits: 2})})`);
  mats.forEach(mat => console.log(`       -> Matrícula: "${mat.matricula}" | Cargo: ${mat.cargo} | Vínculo: ${mat.vinculo}`));
});

// 6. Inconsistências de Nomes (Variações de Espaçamento, Acentuação ou Homônimos Potenciais)
const totalPessoasUnificadas = db.prepare('SELECT count(*) as total FROM pessoas_unificadas').get().total;
console.log(`\n6. Base de Pessoas Unificadas Atual:`);
console.log(`   - Total de Perfis Consolidados em pessoas_unificadas: ${totalPessoasUnificadas.toLocaleString('pt-BR')}`);

db.close();
console.log('\n--- DIAGNÓSTICO CONCLUÍDO ---');
