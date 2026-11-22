const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3');

console.log('=== Analisando CNPJs em Contratos ===');
// Clean document: digits only
const contratos = db.prepare(`
  SELECT 
    doc_credor, 
    credor, 
    SUM(valor) as total_valor, 
    COUNT(*) as qtd_contratos
  FROM contratos 
  WHERE doc_credor IS NOT NULL AND doc_credor != ''
  GROUP BY doc_credor, credor
  ORDER BY total_valor DESC
`).all();

const cnpjContratos = contratos.filter(c => {
  const digits = (c.doc_credor || '').replace(/\D/g, '');
  return digits.length === 14;
});

console.log(`Total grupos de credor em contratos: ${contratos.length}`);
console.log(`Total com CNPJ válido (14 dígitos): ${cnpjContratos.length}`);
console.log('\nTop 15 Empresas em Contratos por Valor:');
cnpjContratos.slice(0, 15).forEach((c, i) => {
  console.log(`${i+1}. [${c.doc_credor}] ${c.credor} - Total: R$ ${c.total_valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${c.qtd_contratos} contratos)`);
});

console.log('\n=== Analisando CNPJs em Despesas ===');
const despesas = db.prepare(`
  SELECT 
    cpf_cnpj, 
    credor, 
    SUM(valor) as total_valor, 
    COUNT(*) as qtd_despesas
  FROM despesas 
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != ''
  GROUP BY cpf_cnpj, credor
  ORDER BY total_valor DESC
`).all();

const cnpjDespesas = despesas.filter(d => {
  const digits = (d.cpf_cnpj || '').replace(/\D/g, '');
  return digits.length === 14;
});

console.log(`Total grupos de credor em despesas: ${despesas.length}`);
console.log(`Total com CNPJ válido (14 dígitos): ${cnpjDespesas.length}`);
console.log('\nTop 15 Empresas em Despesas por Valor:');
cnpjDespesas.slice(0, 15).forEach((d, i) => {
  console.log(`${i+1}. [${d.cpf_cnpj}] ${d.credor} - Total: R$ ${d.total_valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${d.qtd_despesas} despesas)`);
});

console.log('\n=== Analisando Diárias ===');
const diariasTotal = db.prepare('SELECT COUNT(*) as cnt, SUM(valor) as total_gasto FROM diarias').get();
console.log(`Total diárias: ${diariasTotal.cnt}, Total gasto: R$ ${diariasTotal.total_gasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);

const topViajantes = db.prepare(`
  SELECT servidor, tipo_diaria, COUNT(*) as viagens, SUM(valor) as total
  FROM diarias
  GROUP BY servidor
  ORDER BY total DESC
  LIMIT 10
`).all();
console.log('\nTop 10 Viajantes / Servidores com mais Diárias:');
topViajantes.forEach((v, i) => {
  console.log(`${i+1}. ${v.servidor} (${v.tipo_diaria}) - ${v.viagens} viagens - R$ ${v.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
});
