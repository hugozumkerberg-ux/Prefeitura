const { getMasterDb } = require('../lib/db');
const db = getMasterDb();

console.log('--- ANÁLISE DE TODAS AS TABELAS DO BANCO PARA MATRÍCULAS E HÍFEN ---\n');

const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas existentes no banco:');
tabelas.forEach(t => console.log(' • ' + t.name));
console.log('');

// Verificar colunas de cada tabela
for (const t of tabelas) {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  const temMatricula = cols.some(c => c.name.toLowerCase().includes('matricula'));
  if (temMatricula) {
    console.log(`Tabela com matrícula: ${t.name}`);
    const colName = cols.find(c => c.name.toLowerCase().includes('matricula')).name;
    const stats = db.prepare(`
      SELECT 
        count(*) as total,
        count(CASE WHEN ${colName} LIKE '0%' THEN 1 END) as com_zero,
        count(CASE WHEN ${colName} LIKE '%-%' THEN 1 END) as com_hifen,
        count(CASE WHEN ${colName} LIKE '%.%' THEN 1 END) as com_ponto
      FROM ${t.name}
    `).get();
    console.log(`   Total: ${stats.total} | Zeros: ${stats.com_zero} | Hífen: ${stats.com_hifen} | Ponto: ${stats.com_ponto}`);
    
    // Exemplos
    const amostras = db.prepare(`SELECT ${colName} as mat FROM ${t.name} WHERE ${colName} IS NOT NULL LIMIT 5`).all();
    console.log('   Exemplos: ' + amostras.map(a => `"${a.mat}"`).join(', '));
    console.log('');
  }
}

// Analisar padrão dos caracteres nas matrículas de contracheques
const padroes = db.prepare(`
  SELECT 
    length(matricula) as tam,
    count(*) as qtd,
    min(matricula) as exemplo_min,
    max(matricula) as exemplo_max
  FROM contracheques
  GROUP BY length(matricula)
  ORDER BY qtd DESC
`).all();

console.log('Distribuição por tamanho da matrícula:');
padroes.forEach(p => console.log(` • Tamanho ${p.tam} chars: ${p.qtd.toLocaleString('pt-BR')} registros (Ex: "${p.exemplo_min}" a "${p.exemplo_max}")`));
