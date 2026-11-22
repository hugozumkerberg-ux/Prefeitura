const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados', 'arinos_transparencia_master.sqlite3');
const CACHE_DIR = path.join(BASE_DIR, 'dados', 'empresas');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// 1. Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS empresas_contratadas (
    cnpj TEXT PRIMARY KEY,
    razao_social TEXT,
    nome_fantasia TEXT,
    situacao_cadastral TEXT,
    data_situacao_cadastral TEXT,
    capital_social REAL,
    cnae_principal_codigo TEXT,
    cnae_principal_descricao TEXT,
    natureza_juridica TEXT,
    porte TEXT,
    data_abertura TEXT,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    municipio TEXT,
    uf TEXT,
    cep TEXT,
    email TEXT,
    telefone TEXT,
    total_contratos REAL DEFAULT 0,
    qtd_contratos INTEGER DEFAULT 0,
    total_despesas REAL DEFAULT 0,
    qtd_despesas INTEGER DEFAULT 0,
    total_geral REAL DEFAULT 0,
    qtd_socios INTEGER DEFAULT 0,
    possui_alerta_vinculo INTEGER DEFAULT 0,
    alerta_detalhe TEXT,
    dados_json TEXT,
    hash_forense TEXT,
    atualizado_em TEXT
  );

  CREATE TABLE IF NOT EXISTS empresas_socios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT,
    nome_socio TEXT,
    cpf_mascarado TEXT,
    qualificacao_socio TEXT,
    faixa_etaria TEXT,
    data_entrada TEXT,
    pais TEXT,
    vinculo_politico_alerta TEXT,
    hash_forense TEXT,
    atualizado_em TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_empresas_socios_cnpj ON empresas_socios(cnpj);
  CREATE INDEX IF NOT EXISTS idx_empresas_socios_nome ON empresas_socios(nome_socio);
`);

// 2. Load Political and Servant Names for Cross-referencing
console.log('[+] Carregando banco de nomes para cruzamento de vínculos...');

// Candidates
const candidatos = db.prepare(`
  SELECT DISTINCT nome_completo, nome_urna, cargo, partido_sigla, ano, situacao 
  FROM eleicoes_candidatos 
  WHERE nome_completo IS NOT NULL AND nome_completo != ''
`).all();

// Councilors (Camara)
const vereadores = db.prepare(`
  SELECT DISTINCT nome_completo, nome_parlamentar, ativo 
  FROM camara_vereadores 
  WHERE nome_completo IS NOT NULL AND nome_completo != ''
`).all();

// Servants (Contracheques) - Get distinct high-level or prominent positions or sample
const servidores = db.prepare(`
  SELECT DISTINCT nome, cargo, vinculo 
  FROM contracheques 
  WHERE nome IS NOT NULL AND nome != ''
  GROUP BY nome
`).all();

console.log(`[+] Base de cruzamento carregada: ${candidatos.length} candidatos, ${vereadores.length} vereadores, ${servidores.length} servidores distintos.`);

function normalizar(txt) {
  if (!txt) return '';
  return txt
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z\s]/g, '')
    .trim();
}

// Build map for quick lookup
const candidatosMap = new Map();
candidatos.forEach(c => {
  const norm = normalizar(c.nome_completo);
  if (norm.length > 5) {
    candidatosMap.set(norm, `${c.cargo} (${c.partido_sigla} - ${c.ano}) - ${c.situacao || ''}`);
  }
});

const vereadoresMap = new Map();
vereadores.forEach(v => {
  const norm = normalizar(v.nome_completo);
  if (norm.length > 5) {
    vereadoresMap.set(norm, `Vereador da Câmara Municipal (${v.ativo ? 'Em Exercício' : 'Histórico'})`);
  }
});

const servidoresMap = new Map();
servidores.forEach(s => {
  const norm = normalizar(s.nome);
  if (norm.length > 5) {
    servidoresMap.set(norm, `Servidor Municipal: ${s.cargo || 'Cargo não especificado'} (${s.vinculo || ''})`);
  }
});

function checarVinculos(nomeSocio) {
  const norm = normalizar(nomeSocio);
  if (!norm || norm.length < 6) return null;

  const alertas = [];
  if (vereadoresMap.has(norm)) {
    alertas.push(`[ALERTA CÂMARA] ${vereadoresMap.get(norm)}`);
  }
  if (candidatosMap.has(norm)) {
    alertas.push(`[ALERTA ELEIÇÕES] Candidato(a) ${candidatosMap.get(norm)}`);
  }
  if (servidoresMap.has(norm)) {
    alertas.push(`[ALERTA SERVIDOR] ${servidoresMap.get(norm)}`);
  }

  return alertas.length > 0 ? alertas.join(' | ') : null;
}

// 3. Get Top CNPJs by volume
console.log('[+] Mapeando CNPJs mais representativos de contratos e despesas...');
const rankingSql = `
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
ORDER BY total_geral DESC
LIMIT 120;
`;

const topEmpresas = db.prepare(rankingSql).all();
console.log(`[+] Total de empresas selecionadas para enriquecimento profundo: ${topEmpresas.length}`);

// 4. Fetch Function with fallback
async function fetchCNPJ(cnpj) {
  const cacheFile = path.join(CACHE_DIR, `${cnpj}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return { data, fromCache: true };
    } catch (e) {}
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  // Try MinhaReceita first (very stable & detailed)
  try {
    const res = await fetch(`https://minhareceita.org/${cnpj}`, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
      return { data, fromCache: false, source: 'MinhaReceita' };
    }
  } catch (err) {}

  // Try BrasilAPI as fallback
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
      return { data, fromCache: false, source: 'BrasilAPI' };
    }
  } catch (err) {}

  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const insertEmpresa = db.prepare(`
    INSERT INTO empresas_contratadas (
      cnpj, razao_social, nome_fantasia, situacao_cadastral, data_situacao_cadastral,
      capital_social, cnae_principal_codigo, cnae_principal_descricao, natureza_juridica,
      porte, data_abertura, logradouro, numero, bairro, municipio, uf, cep, email, telefone,
      total_contratos, qtd_contratos, total_despesas, qtd_despesas, total_geral,
      qtd_socios, possui_alerta_vinculo, alerta_detalhe, dados_json, hash_forense, atualizado_em
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(cnpj) DO UPDATE SET
      razao_social=excluded.razao_social,
      nome_fantasia=excluded.nome_fantasia,
      situacao_cadastral=excluded.situacao_cadastral,
      data_situacao_cadastral=excluded.data_situacao_cadastral,
      capital_social=excluded.capital_social,
      cnae_principal_codigo=excluded.cnae_principal_codigo,
      cnae_principal_descricao=excluded.cnae_principal_descricao,
      natureza_juridica=excluded.natureza_juridica,
      porte=excluded.porte,
      data_abertura=excluded.data_abertura,
      logradouro=excluded.logradouro,
      numero=excluded.numero,
      bairro=excluded.bairro,
      municipio=excluded.municipio,
      uf=excluded.uf,
      cep=excluded.cep,
      email=excluded.email,
      telefone=excluded.telefone,
      total_contratos=excluded.total_contratos,
      qtd_contratos=excluded.qtd_contratos,
      total_despesas=excluded.total_despesas,
      qtd_despesas=excluded.qtd_despesas,
      total_geral=excluded.total_geral,
      qtd_socios=excluded.qtd_socios,
      possui_alerta_vinculo=excluded.possui_alerta_vinculo,
      alerta_detalhe=excluded.alerta_detalhe,
      dados_json=excluded.dados_json,
      hash_forense=excluded.hash_forense,
      atualizado_em=excluded.atualizado_em
  `);

  const deleteSocios = db.prepare(`DELETE FROM empresas_socios WHERE cnpj = ?`);
  const insertSocio = db.prepare(`
    INSERT INTO empresas_socios (
      cnpj, nome_socio, cpf_mascarado, qualificacao_socio, faixa_etaria,
      data_entrada, pais, vinculo_politico_alerta, hash_forense, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let sucessos = 0;
  let erros = 0;
  let alertasDetectados = 0;

  console.log('\n============================================================');
  console.log(' INICIANDO COLETA FORENSE DE CNPJ, SÓCIOS E AUDITORIA');
  console.log('============================================================\n');

  for (let i = 0; i < topEmpresas.length; i++) {
    const item = topEmpresas[i];
    const cnpj = item.cnpj_limpo;
    process.stdout.write(`[${i + 1}/${topEmpresas.length}] CNPJ: ${cnpj} (${item.nome_credor.slice(0, 30)}) ... `);

    try {
      const result = await fetchCNPJ(cnpj);
      if (!result || !result.data) {
        console.log('❌ FALHA (Não encontrado ou timeout)');
        erros++;
        continue;
      }

      const d = result.data;
      const rawJson = JSON.stringify(d);
      const hashForense = crypto.createHash('sha256').update(rawJson).digest('hex');
      const now = new Date().toISOString();

      const qsa = Array.isArray(d.qsa) ? d.qsa : [];
      deleteSocios.run(cnpj);

      const alertasEmpresa = [];

      for (const s of qsa) {
        const nomeSocio = s.nome_socio || s.nome || '';
        const vinculo = checarVinculos(nomeSocio);
        if (vinculo) {
          alertasEmpresa.push(`${nomeSocio}: ${vinculo}`);
          alertasDetectados++;
        }

        const socioHash = crypto.createHash('sha256').update(`${cnpj}|${nomeSocio}|${s.cnpj_cpf_do_socio || ''}`).digest('hex');

        insertSocio.run(
          cnpj,
          nomeSocio,
          s.cnpj_cpf_do_socio || '',
          s.qualificacao_socio || s.qualificacao_representante_legal || 'Sócio',
          s.faixa_etaria || '',
          s.data_entrada_sociedade || s.data_entrada || '',
          s.pais || '',
          vinculo || null,
          socioHash,
          now
        );
      }

      const temAlerta = alertasEmpresa.length > 0 ? 1 : 0;
      const alertaDetalhe = alertasEmpresa.join('\n');

      const tel = d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0,2)}) ${d.ddd_telefone_1.slice(2)}` : (d.telefone || '');

      insertEmpresa.run(
        cnpj,
        d.razao_social || item.nome_credor,
        d.nome_fantasia || '',
        d.descricao_situacao_cadastral || (d.situacao_cadastral === 2 ? 'ATIVA' : 'OUTRA'),
        d.data_situacao_cadastral || '',
        typeof d.capital_social === 'number' ? d.capital_social : parseFloat(d.capital_social || 0),
        String(d.cnae_fiscal || ''),
        d.cnae_fiscal_descricao || '',
        d.natureza_juridica || '',
        d.porte || '',
        d.data_inicio_atividade || '',
        d.logradouro || '',
        d.numero || '',
        d.bairro || '',
        d.municipio || '',
        d.uf || '',
        d.cep || '',
        d.email || '',
        tel,
        item.total_contratos,
        item.qtd_contratos,
        item.total_despesas,
        item.qtd_despesas,
        item.total_geral,
        qsa.length,
        temAlerta,
        alertaDetalhe,
        rawJson,
        hashForense,
        now
      );

      sucessos++;
      const tagOrigem = result.fromCache ? 'CACHE' : result.source;
      const alertaTag = temAlerta ? '⚠️ ALERTA VÍNCULO' : 'OK';
      console.log(`✅ [${tagOrigem}] ${d.razao_social ? d.razao_social.slice(0, 25) : ''} | Sócios: ${qsa.length} | ${alertaTag}`);

      // Small pause if fetched from network to be polite
      if (!result.fromCache) {
        await sleep(350);
      }
    } catch (err) {
      console.log(`❌ ERRO: ${err.message}`);
      erros++;
    }
  }

  console.log('\n============================================================');
  console.log(` FINALIZADO: ${sucessos} empresas enriquecidas, ${erros} falhas.`);
  console.log(` Vínculos com Vereadores/Candidatos/Servidores detectados: ${alertasDetectados}`);
  console.log('============================================================\n');
}

main();
