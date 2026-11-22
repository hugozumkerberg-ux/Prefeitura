const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3');

// Combine CNPJs from contratos and despesas
const sql = `
WITH uniao_cnpjs AS (
  SELECT 
    REPLACE(REPLACE(REPLACE(REPLACE(doc_credor, '.', ''), '/', ''), '-', ''), ' ', '') as cnpj_limpo,
    credor,
    valor,
    'CONTRATO' as origem
  FROM contratos
  WHERE doc_credor IS NOT NULL AND length(REPLACE(REPLACE(REPLACE(REPLACE(doc_credor, '.', ''), '/', ''), '-', ''), ' ', '')) = 14

  UNION ALL

  SELECT 
    REPLACE(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '/', ''), '-', ''), ' ', '') as cnpj_limpo,
    credor,
    valor,
    'DESPESA' as origem
  FROM despesas
  WHERE cpf_cnpj IS NOT NULL AND length(REPLACE(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '/', ''), '-', ''), ' ', '')) = 14
)
SELECT 
  cnpj_limpo,
  MAX(credor) as nome_credor,
  SUM(CASE WHEN origem = 'CONTRATO' THEN valor ELSE 0 END) as total_contratos,
  COUNT(CASE WHEN origem = 'CONTRATO' THEN 1 END) as qtd_contratos,
  SUM(CASE WHEN origem = 'DESPESA' THEN valor ELSE 0 END) as total_despesas,
  COUNT(CASE WHEN origem = 'DESPESA' THEN 1 END) as qtd_despesas,
  SUM(valor) as total_geral
FROM uniao_cnpjs
GROUP BY cnpj_limpo
ORDER BY total_geral DESC;
`;

const empresas = db.prepare(sql).all();
console.log(`Total de CNPJs únicos identificados: ${empresas.length}`);
console.log('\nTop 30 Empresas por Volume Financeiro Total (Contratos + Despesas):');
empresas.slice(0, 30).forEach((e, i) => {
  console.log(`${(i+1).toString().padStart(2, ' ')}. CNPJ: ${e.cnpj_limpo} | ${e.nome_credor.padEnd(45, ' ')} | Total: R$ ${e.total_geral.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (Contratos: R$ ${e.total_contratos.toLocaleString('pt-BR', {minimumFractionDigits: 2})} [${e.qtd_contratos}], Desp: R$ ${e.total_despesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})} [${e.qtd_despesas}])`);
});
