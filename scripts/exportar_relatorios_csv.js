/**
 * ==============================================================================
 * EXPORTADOR EXECUTIVO DE RELATÓRIOS AUDITADOS (EXCEL / CSV) — ARINOS / MG
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');
const OUT_DIR = path.join(BASE_DIR, 'relatorios_exportados');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  EXPORTADOR DE RELATÓRIOS EXECUTIVOS PARA EXCEL (CSV UTF-8)        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const db = new DatabaseSync(DB_PATH, { readOnly: true });

function exportarCsv(nomeArquivo, cabecalhos, linhas) {
  const caminho = path.join(OUT_DIR, nomeArquivo);
  const BOM = '\uFEFF'; // Permite acentuação perfeita no Excel do Windows
  let csv = BOM + cabecalhos.join(';') + '\r\n';

  for (const l of linhas) {
    const row = l.map(val => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    });
    csv += row.join(';') + '\r\n';
  }

  fs.writeFileSync(caminho, csv, 'utf-8');
  console.log(`  ✔ Exportado com sucesso: ${nomeArquivo} (${linhas.length} linhas)`);
}

// 1. Ranking de Maiores Salários (Histórico Geral)
console.log('Gerando Ranking de Maiores Salários...');
const topSalarios = db.prepare(`
  SELECT entidade, ano, mes, matricula, nome, cargo, vinculo, tipo_folha, total_proventos
  FROM contracheques
  ORDER BY total_proventos DESC
  LIMIT 500
`).all();

exportarCsv(
  '1_ranking_500_maiores_salarios.csv',
  ['Entidade', 'Ano', 'Mes', 'Matricula', 'Nome do Servidor', 'Cargo', 'Vinculo', 'Tipo Folha', 'Total Proventos (R$)'],
  topSalarios.map(r => [
    r.entidade, r.ano, r.mes, r.matricula, r.nome, r.cargo, r.vinculo, r.tipo_folha,
    r.total_proventos ? r.total_proventos.toFixed(2).replace('.', ',') : '0,00'
  ])
);

// 2. Ranking de Maiores Credores de Despesas
console.log('Gerando Ranking de Maiores Credores de Despesas...');
const topCredores = db.prepare(`
  SELECT credor, count(*) as total_empenhos, sum(valor) as volume_total, min(ano) as de_ano, max(ano) as ate_ano
  FROM despesas
  GROUP BY credor
  ORDER BY volume_total DESC
  LIMIT 500
`).all();

exportarCsv(
  '2_ranking_maiores_credores_despesas.csv',
  ['Credor / Empresa', 'Qtd Empenhos', 'Volume Total (R$)', 'Ano Inicial', 'Ano Final'],
  topCredores.map(r => [
    r.credor, r.total_empenhos,
    r.volume_total ? r.volume_total.toFixed(2).replace('.', ',') : '0,00',
    r.de_ano, r.ate_ano
  ])
);

// 3. Ranking de Maiores Recebedores de Diárias
console.log('Gerando Ranking de Maiores Recebedores de Diárias...');
const topDiarias = db.prepare(`
  SELECT servidor, count(*) as total_diarias, sum(valor) as volume_total, min(ano) as de_ano, max(ano) as ate_ano
  FROM diarias
  GROUP BY servidor
  ORDER BY volume_total DESC
  LIMIT 500
`).all();

exportarCsv(
  '3_ranking_maiores_recebedores_diarias.csv',
  ['Servidor Beneficiário', 'Qtd Diárias', 'Valor Total Acumulado (R$)', 'Ano Inicial', 'Ano Final'],
  topDiarias.map(r => [
    r.servidor, r.total_diarias,
    r.volume_total ? r.volume_total.toFixed(2).replace('.', ',') : '0,00',
    r.de_ano, r.ate_ano
  ])
);

// 4. Resumo Financeiro Anual
console.log('Gerando Resumo Consolidado Anual...');
const anos = db.prepare(`
  SELECT 
    ano,
    (SELECT sum(total_proventos) FROM contracheques WHERE ano = c.ano) as total_folha,
    (SELECT sum(valor) FROM despesas WHERE ano = c.ano) as total_despesas,
    (SELECT sum(valor) FROM diarias WHERE ano = c.ano) as total_diarias
  FROM (SELECT DISTINCT ano FROM contracheques UNION SELECT DISTINCT ano FROM despesas) c
  ORDER BY ano DESC
`).all();

exportarCsv(
  '4_resumo_anual_consolidado.csv',
  ['Ano', 'Total Folha (R$)', 'Total Despesas (R$)', 'Total Diarias (R$)', 'Total Global (R$)'],
  anos.map(r => {
    const folha = r.total_folha || 0;
    const desp = r.total_despesas || 0;
    const diar = r.total_diarias || 0;
    const global = folha + desp + diar;
    return [
      r.ano,
      folha.toFixed(2).replace('.', ','),
      desp.toFixed(2).replace('.', ','),
      diar.toFixed(2).replace('.', ','),
      global.toFixed(2).replace('.', ',')
    ];
  })
);

// 5. Ranking de Maiores Contratos (Novo Portal SIAP)
console.log('Gerando Ranking de Maiores Contratos...');
try {
  const topContratos = db.prepare(`
    SELECT nr_contrato, tipo_contrato, credor, doc_credor, dt_assinatura, dt_ini_vigencia, dt_fim_vigencia, valor, objeto
    FROM contratos
    ORDER BY valor DESC
    LIMIT 500
  `).all();
  exportarCsv(
    '5_ranking_maiores_contratos_arinos.csv',
    ['Nº Contrato', 'Tipo Contrato', 'Contratado / Credor', 'CPF / CNPJ', 'Data Assinatura', 'Início Vigência', 'Fim Vigência', 'Valor Contratado (R$)', 'Objeto'],
    topContratos.map(r => [
      r.nr_contrato, r.tipo_contrato, r.credor, r.doc_credor, r.dt_assinatura, r.dt_ini_vigencia, r.dt_fim_vigencia,
      r.valor ? r.valor.toFixed(2).replace('.', ',') : '0,00', r.objeto
    ])
  );
} catch (e) {}

// 6. Convênios Públicos e Repasses (Novo Portal SIAP)
console.log('Gerando Relação de Convênios Públicos...');
try {
  const convList = db.prepare(`
    SELECT nr_convenio, descricao, dt_convenio, dt_inicio, dt_final, valor_contrapartida, valor_convenio, objeto
    FROM convenios
    ORDER BY valor_convenio DESC
  `).all();
  exportarCsv(
    '6_convenios_publicos_repasses_arinos.csv',
    ['Nº Convênio', 'Descrição', 'Data Convênio', 'Início Vigência', 'Fim Vigência', 'Contrapartida Municipal (R$)', 'Valor Total Convênio (R$)', 'Objeto'],
    convList.map(r => [
      r.nr_convenio, r.descricao, r.dt_convenio, r.dt_inicio, r.dt_final,
      r.valor_contrapartida ? r.valor_contrapartida.toFixed(2).replace('.', ',') : '0,00',
      r.valor_convenio ? r.valor_convenio.toFixed(2).replace('.', ',') : '0,00',
      r.objeto
    ])
  );
} catch (e) {}

console.log('\n================================================================');
console.log(`RELATÓRIOS EXPORTADOS COM SUCESSO PARA A PASTA:\n  ${OUT_DIR}`);
console.log('================================================================');

db.close();
