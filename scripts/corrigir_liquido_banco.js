const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '../dados/contracheques_detalhados_master.sqlite3');
const db = new DatabaseSync(DB_PATH);

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  CORRETOR DE TOTAIS E LÍQUIDO VIA RUBRICAS — ARINOS / MG           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

db.exec(`
  PRAGMA busy_timeout = 10000;
  
  UPDATE contracheques
  SET 
    total_proventos = (
      SELECT round(coalesce(sum(valor), 0), 2)
      FROM contracheque_rubricas
      WHERE contracheque_id = contracheques.id AND tipo = 'PROVENTO'
    ),
    total_descontos = (
      SELECT round(coalesce(sum(valor), 0), 2)
      FROM contracheque_rubricas
      WHERE contracheque_id = contracheques.id AND tipo = 'DESCONTO'
    ),
    salario_liquido = (
      SELECT round(
        coalesce(sum(CASE WHEN tipo = 'PROVENTO' THEN valor ELSE 0 END), 0) -
        coalesce(sum(CASE WHEN tipo = 'DESCONTO' THEN valor ELSE 0 END), 0),
        2
      )
      FROM contracheque_rubricas
      WHERE contracheque_id = contracheques.id
    )
  WHERE (total_proventos IS NULL OR salario_liquido IS NULL OR total_proventos = 0)
    AND EXISTS (SELECT 1 FROM contracheque_rubricas WHERE contracheque_id = contracheques.id);
`);

const stats = db.prepare(`
  SELECT 
    count(*) as total,
    sum(CASE WHEN salario_liquido > 0 THEN 1 ELSE 0 END) as com_liquido_positivo,
    sum(CASE WHEN total_proventos > 0 THEN 1 ELSE 0 END) as com_proventos,
    sum(CASE WHEN total_descontos > 0 THEN 1 ELSE 0 END) as com_descontos,
    sum(total_proventos) as volume_bruto,
    sum(salario_liquido) as volume_liquido
  FROM contracheques
`).get();

console.log('--- ESTATÍSTICA ATUALIZADA DO BANCO DE CONTRACHEQUES DETALHADOS ---');
console.log(`Total de Registros: ${stats.total}`);
console.log(`Com Líquido Válido: ${stats.com_liquido_positivo} / ${stats.total} (${((stats.com_liquido_positivo/stats.total)*100).toFixed(1)}%)`);
console.log(`Volume Bruto Auditado: R$ ${stats.volume_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
console.log(`Volume Líquido Auditado: R$ ${stats.volume_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

db.close();
