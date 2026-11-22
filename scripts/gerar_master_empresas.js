const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados', 'arinos_transparencia_master.sqlite3');
const OUT_PATH = path.join(BASE_DIR, 'dados', 'empresas', 'arinos_empresas_master.json');

const db = new DatabaseSync(DB_PATH);

console.log('[+] Gerando arquivo mestre consolidado de empresas e sócios...');

const empresas = db.prepare(`
  SELECT 
    cnpj, razao_social, nome_fantasia, situacao_cadastral, data_situacao_cadastral,
    capital_social, cnae_principal_codigo, cnae_principal_descricao, natureza_juridica,
    porte, data_abertura, logradouro, numero, bairro, municipio, uf, cep, email, telefone,
    total_contratos, qtd_contratos, total_despesas, qtd_despesas, total_geral,
    qtd_socios, possui_alerta_vinculo, alerta_detalhe, hash_forense, atualizado_em
  FROM empresas_contratadas
  ORDER BY total_geral DESC
`).all();

const sociosStmt = db.prepare(`
  SELECT id, cnpj, nome_socio, cpf_mascarado, qualificacao_socio, faixa_etaria, data_entrada, pais, vinculo_politico_alerta, hash_forense
  FROM empresas_socios
  WHERE cnpj = ?
`);

const listaCompleta = empresas.map(emp => {
  const socios = sociosStmt.all(emp.cnpj);
  return {
    ...emp,
    socios
  };
});

// Summary Stats
const totalVolume = listaCompleta.reduce((acc, e) => acc + (e.total_geral || 0), 0);
const totalContratos = listaCompleta.reduce((acc, e) => acc + (e.total_contratos || 0), 0);
const totalDespesas = listaCompleta.reduce((acc, e) => acc + (e.total_despesas || 0), 0);
const totalSocios = db.prepare('SELECT count(*) as c FROM empresas_socios').get().c;
const totalAlertas = listaCompleta.filter(e => e.possui_alerta_vinculo === 1).length;

const master = {
  municipio: 'Arinos',
  uf: 'MG',
  fonte_oficial: 'Receita Federal do Brasil / MinhaReceita / BrasilAPI & Portal da Transparência de Arinos',
  gerado_em: new Date().toISOString(),
  resumo_geral: {
    total_empresas_catalogadas: listaCompleta.length,
    volume_financeiro_total: totalVolume,
    volume_contratos: totalContratos,
    volume_despesas: totalDespesas,
    total_socios_mapeados: totalSocios,
    empresas_com_alerta_vinculo: totalAlertas,
    empresas_ativas: listaCompleta.filter(e => e.situacao_cadastral === 'ATIVA').length
  },
  empresas: listaCompleta
};

const jsonStr = JSON.stringify(master, null, 2);
const sha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');
master.hash_forense_sha256 = sha256;

fs.writeFileSync(OUT_PATH, JSON.stringify(master, null, 2), 'utf8');

console.log(`[+] Mestre gravado: ${OUT_PATH}`);
console.log(`[+] Total empresas: ${listaCompleta.length} | Volume: R$ ${totalVolume.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
console.log(`[+] Sócios mapeados: ${totalSocios} | Empresas com Alerta: ${totalAlertas}`);
console.log(`[+] Hash Forense SHA-256: ${sha256}`);
