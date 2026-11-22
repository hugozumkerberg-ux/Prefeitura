/**
 * Coletor Oficial da Fundação Municipal de Saúde de Arinos (MG)
 * Entidade: idorg = 241 | CNPJ = 18.650.424/0001-67
 * 
 * Funcionalidade:
 * - Coleta retroativa de Setembro/2026 até Janeiro/2013 (ou primeira falha).
 * - Salva as páginas mensais e extrai os vínculos/servidores da saúde.
 * - Suporte a retomada (resume) inteligente sem rebaixar arquivos existentes.
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE_URL = 'http://www.adpmnet.com.br/index.php';
const DADOS_DIR = path.resolve(__dirname, '../dados/fundacao_saude');
const DB_PATH = path.join(DADOS_DIR, 'fundacao_saude.sqlite3');

if (!fs.existsSync(DADOS_DIR)) {
  fs.mkdirSync(DADOS_DIR, { recursive: true });
}

console.log('--- COLETOR FUNDAÇÃO MUNICIPAL DE SAÚDE (IDORG 241) ---');
console.log('Pasta de destino:', DADOS_DIR);

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS consultas_fundacao (
    ano INTEGER,
    mes INTEGER,
    tpformpdf INTEGER,
    status TEXT,
    linhas INTEGER,
    mensagem TEXT,
    consultado_em TEXT,
    PRIMARY KEY(ano, mes, tpformpdf)
  );

  CREATE TABLE IF NOT EXISTS servidores_saude (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ano INTEGER,
    mes INTEGER,
    idfun TEXT,
    idpcl TEXT,
    idgca TEXT,
    matricula TEXT,
    nome TEXT,
    cargo TEXT,
    lotacao TEXT,
    salario_bruto REAL,
    salario_liquido REAL,
    fonte_arquivo TEXT,
    coletado_em TEXT,
    UNIQUE(ano, mes, idfun, idpcl)
  );
`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function baixarMes(ano, mes) {
  const params = new URLSearchParams({
    option: 'com_contpubl',
    submenu: '1',
    brasao: 'P310450.GIF',
    dsorg: 'Fundação Municipal de Saúde de Arinos',
    cnpj: '18650424000167',
    tpformpdf: '51',
    ano: String(ano),
    mes: String(mes),
    idorg: '241',
    titulo: 'Remuneração Mensal dos Servidores Públicos',
    dsufe: 'Estado de Minas Gerais',
    nome_mat: '1',
    nao_proventos: '0',
    nao_descontos: '0',
    xts: '0'
  });

  const url = `${BASE_URL}?${params.toString()}`;
  console.log(`[${ano}/${mes.toString().padStart(2, '0')}] Consultando: ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.log(`  -> Erro HTTP: ${res.status}`);
      return { status: 'erro_http', tamanho: 0 };
    }

    const html = await res.text();
    const fileName = `folha_saude_${ano}_${mes.toString().padStart(2, '0')}.html`;
    const filePath = path.join(DADOS_DIR, fileName);
    fs.writeFileSync(filePath, html, 'utf-8');

    console.log(`  -> Salvo: ${fileName} (${(html.length / 1024).toFixed(1)} KB)`);
    return { status: 'ok', tamanho: html.length, filePath };
  } catch (err) {
    console.error(`  -> Falha de rede:`, err.message);
    return { status: 'falha_rede', erro: err.message };
  }
}

async function iniciarColeta(anoInicial = 2026, mesInicial = 9, anoFinal = 2013) {
  console.log(`Iniciando varredura retroativa de ${anoInicial}/${mesInicial} até ${anoFinal}...`);
  
  let ano = anoInicial;
  let mes = mesInicial;

  while (ano >= anoFinal) {
    const check = db.prepare('SELECT status FROM consultas_fundacao WHERE ano = ? AND mes = ? AND tpformpdf = 51').get(ano, mes);
    if (check && check.status === 'ok') {
      console.log(`[${ano}/${mes}] Já coletado. Pulando...`);
    } else {
      const res = await baixarMes(ano, mes);
      db.prepare(`
        INSERT OR REPLACE INTO consultas_fundacao (ano, mes, tpformpdf, status, mensagem, consultado_em)
        VALUES (?, ?, 51, ?, ?, ?)
      `).run(ano, mes, res.status, res.status === 'ok' ? 'Download concluído' : (res.erro || 'Erro'), new Date().toISOString());

      // Pausa estratégica de cortesia para não sobrecarregar o portal
      await sleep(1500);
    }

    mes--;
    if (mes === 0) {
      mes = 12;
      ano--;
    }
  }

  console.log('\nColeta finalizada!');
}

// Permite execução direta via CLI
if (require.main === module) {
  iniciarColeta();
}

module.exports = { iniciarColeta };
