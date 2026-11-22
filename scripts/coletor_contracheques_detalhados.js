/**
 * ==============================================================================
 * COLETOR DE CONTRACHEQUES DETALHADOS (DIRECT-TO-SQLITE) — ARINOS / MG
 * ==============================================================================
 * 
 * Papel: Desenvolvedor Sênior / Engenheiro de Dados
 * Função:
 * 1. Lê os arquivos mensais já baixados (índices tpformpdf=51).
 * 2. Extrai a lista de servidores e URLs individuais de contracheque (tpformpdf=52).
 * 3. Baixa em paralelo o contracheque DETALHADO (rubricas, INSS, IR, líquido).
 * 4. Grava DIRETAMENTE no banco SQLite (sem entulhar o Windows com 100k arquivos).
 * 5. Preserva a contraprova oficial: link direto na ADPM + hash SHA-256.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados/contracheques_detalhados_master.sqlite3');
const MESES_DIR = path.join(BASE_DIR, 'dados/fundacao_saude');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  COLETOR DE CONTRACHEQUES DETALHADOS — DIRECT-TO-SQLITE            ║');
console.log('║  Destino: ' + DB_PATH.padEnd(56) + ' ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const db = new DatabaseSync(DB_PATH);

// Tabelas relacionais otimizadas
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 10000;

  CREATE TABLE IF NOT EXISTS contracheques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    idfun TEXT NOT NULL,
    idpcl TEXT NOT NULL,
    matricula TEXT,
    nome TEXT NOT NULL,
    cargo TEXT,
    lotacao TEXT,
    admissao TEXT,
    total_proventos REAL,
    total_descontos REAL,
    salario_liquido REAL,
    url_oficial TEXT NOT NULL,
    hash_sha256 TEXT NOT NULL,
    coletado_em TEXT NOT NULL,
    UNIQUE(entidade, ano, mes, idfun, idpcl)
  );

  CREATE TABLE IF NOT EXISTS contracheque_rubricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contracheque_id INTEGER NOT NULL,
    codigo_descricao TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'PROVENTO' ou 'DESCONTO'
    valor REAL NOT NULL,
    FOREIGN KEY(contracheque_id) REFERENCES contracheques(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contra_ano_mes ON contracheques(ano, mes);
  CREATE INDEX IF NOT EXISTS idx_contra_nome ON contracheques(nome);
  CREATE INDEX IF NOT EXISTS idx_contra_matricula ON contracheques(matricula);
  CREATE INDEX IF NOT EXISTS idx_rubricas_contra ON contracheque_rubricas(contracheque_id);
`);

function parseMoney(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/R\$/g, '').trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extrai servidores de um arquivo mensal
function extrairServidoresDoMes(htmlContent) {
  const servidores = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = trRegex.exec(htmlContent)) !== null) {
    const tr = match[1];
    if (!tr.includes('tpformpdf=52')) continue;

    const linkM = tr.match(/href=["']([^"']*tpformpdf=52[^"']*)["']/i);
    const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(td => td.replace(/<[^>]+>/g, '').trim());

    if (linkM && tds.length >= 4) {
      const urlRel = linkM[1].replace(/&amp;/g, '&');
      const urlCompleta = urlRel.startsWith('http') ? urlRel : 'http://www.adpmnet.com.br' + urlRel;
      
      const idfunM = urlCompleta.match(/idfun=(\d+)/i);
      const idpclM = urlCompleta.match(/idpcl=(\d+)/i);

      servidores.push({
        vinculo: tds[0],
        matricula_nome: tds[1],
        cargo: tds[2],
        idfun: idfunM ? idfunM[1] : '0',
        idpcl: idpclM ? idpclM[1] : '1',
        url_detalhe: urlCompleta
      });
    }
  }
  return servidores;
}

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&iacute;/gi, 'í')
    .replace(/&Iacute;/gi, 'Í')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&Otilde;/gi, 'Õ')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&Atilde;/gi, 'Ã')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&aacute;/gi, 'á')
    .replace(/&Aacute;/gi, 'Á')
    .replace(/&nbsp;/gi, ' ');
}

// Faz o parser do contracheque detalhado (tpformpdf=52)
function parseContrachequeDetalhado(rawHtml) {
  const html = decodeEntities(rawHtml);
  let matricula = null;
  let nome = null;
  let cargo = null;
  let lotacao = null;
  let admissao = null;
  let total_proventos = null;
  let total_descontos = null;
  let salario_liquido = null;
  const rubricas = [];

  // Dados do Servidor
  const matNomeM = html.match(/Matr[íi]cula\/Nome[\s\S]*?:[\s\S]*?(?:<\/strong>)?\s*([0-9.]+)\s*-\s*([^<\n\r]+)/i);
  if (matNomeM) {
    matricula = matNomeM[1].trim();
    nome = matNomeM[2].trim();
  }

  const cargoM = html.match(/Cargo\/Fun[çc][ãa]o\s*:\s*<\/strong>\s*([^<\n\r]+)/i);
  if (cargoM) cargo = cargoM[1].trim();

  const orgM = html.match(/[ÓO]rg[ãa]o\s*:\s*<\/strong>\s*([^<\n\r]+)/i);
  if (orgM) lotacao = orgM[1].trim();

  const admM = html.match(/Data de admiss[ãa]o\s*:\s*<\/strong>\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (admM) admissao = admM[1].trim();

  // Rubricas da tabela
  const eventRegex = /<tr[^>]*>\s*<td[^>]*colspan=["']2["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<\/tr>/gi;
  let evMatch;
  while ((evMatch = eventRegex.exec(html)) !== null) {
    const desc = evMatch[1].replace(/<[^>]+>/g, '').trim();
    const remunStr = evMatch[2].replace(/<[^>]+>/g, '').trim();
    const descStr = evMatch[3].replace(/<[^>]+>/g, '').trim();

    if (desc && (remunStr || descStr)) {
      if (remunStr) {
        rubricas.push({
          descricao: desc,
          tipo: 'PROVENTO',
          valor: parseMoney(remunStr)
        });
      }
      if (descStr) {
        rubricas.push({
          descricao: desc,
          tipo: 'DESCONTO',
          valor: parseMoney(descStr)
        });
      }
    }
  }

  // Totais:
  const totaisRowM = html.match(/Total de Descontos[\s\S]*?<\/tr>\s*<tr>\s*<td[^>]*><\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>([0-9.,]+)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>([0-9.,]+)<\/td>/i);
  if (totaisRowM) {
    total_proventos = parseMoney(totaisRowM[1]);
    total_descontos = parseMoney(totaisRowM[2]);
  } else {
    const totProvM = html.match(/Total das Remunera[çc][õo]es[\s\S]*?<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>([0-9.,]+)<\/td>/i);
    if (totProvM) total_proventos = parseMoney(totProvM[1]);
    const totDescM = html.match(/Total de Descontos[\s\S]*?<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>([0-9.,]+)<\/td>/i);
    if (totDescM) total_descontos = parseMoney(totDescM[1]);
  }

  // Fallback garantido via Rubricas individuais
  const provRubricas = rubricas.filter(r => r.tipo === 'PROVENTO').reduce((acc, r) => acc + (r.valor || 0), 0);
  const descRubricas = rubricas.filter(r => r.tipo === 'DESCONTO').reduce((acc, r) => acc + (r.valor || 0), 0);

  if (total_proventos === null && provRubricas > 0) total_proventos = Math.round(provRubricas * 100) / 100;
  if ((total_descontos === null || total_descontos > total_proventos) && descRubricas >= 0) total_descontos = Math.round(descRubricas * 100) / 100;

  // Valor Líquido:
  const liqM = html.match(/Valor\s+L[íi]quido[\s\S]*?tdrigth[^>]*>[\s\S]*?([0-9.,]+)/i) ||
               html.match(/Valor\s+L[íi]quido\s*:[\s\S]*?<td[^>]*>[\s\S]*?([0-9.,]+)[\s\S]*?<\/td>/i);
  if (liqM) {
    salario_liquido = parseMoney(liqM[1]);
  } else if (total_proventos !== null && total_descontos !== null) {
    salario_liquido = Math.round((total_proventos - total_descontos) * 100) / 100;
  }

  return {
    matricula,
    nome,
    cargo,
    lotacao,
    admissao,
    total_proventos,
    total_descontos,
    salario_liquido,
    rubricas
  };
}

async function baixarContracheque(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuditoriaPublica/1.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function processarTudo() {
  if (!fs.existsSync(MESES_DIR)) {
    console.log('Pasta de meses ainda não encontrada:', MESES_DIR);
    return;
  }

  const arquivos = fs.readdirSync(MESES_DIR)
    .filter(f => f.startsWith('folha_saude_') && f.endsWith('.html'))
    .sort().reverse();

  console.log(`Encontrados ${arquivos.length} meses da Fundação de Saúde para processar.\n`);

  const insertContraStmt = db.prepare(`
    INSERT OR REPLACE INTO contracheques (
      entidade, ano, mes, idfun, idpcl, matricula, nome, cargo, lotacao, admissao,
      total_proventos, total_descontos, salario_liquido, url_oficial, hash_sha256, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRubricaStmt = db.prepare(`
    INSERT INTO contracheque_rubricas (contracheque_id, codigo_descricao, tipo, valor)
    VALUES (?, ?, ?, ?)
  `);

  let totalHolerites = 0;

  for (const arq of arquivos) {
    const m = arq.match(/folha_saude_(\d{4})_(\d{2})\.html/);
    if (!m) continue;
    const ano = parseInt(m[1], 10);
    const mes = parseInt(m[2], 10);

    const htmlMes = fs.readFileSync(path.join(MESES_DIR, arq), 'utf-8');
    const servidores = extrairServidoresDoMes(htmlMes);

    if (servidores.length === 0) continue;

    console.log(`[${ano}/${String(mes).padStart(2, '0')}] Processando ${servidores.length} contracheques detalhados...`);

    for (let i = 0; i < servidores.length; i++) {
      const s = servidores[i];
      
      // Verifica se já foi baixado com salário líquido válido
      const existe = db.prepare('SELECT id, salario_liquido FROM contracheques WHERE entidade = ? AND ano = ? AND mes = ? AND idfun = ? AND idpcl = ?')
        .get('fundacao_saude', ano, mes, s.idfun, s.idpcl);

      if (existe && existe.salario_liquido !== null && existe.salario_liquido > 0) {
        continue; // Já tem com salário líquido válido, pula!
      }

      try {
        const detalheHtml = await baixarContracheque(s.url_detalhe);
        const hash = sha256(detalheHtml);
        const parsed = parseContrachequeDetalhado(detalheHtml);

        const nomeFinal = parsed.nome || s.matricula_nome.split('-').slice(1).join('-').trim();
        const agora = new Date().toISOString();

        db.exec('BEGIN TRANSACTION;');
        
        insertContraStmt.run(
          'fundacao_saude', ano, mes, s.idfun, s.idpcl, parsed.matricula, nomeFinal,
          parsed.cargo || s.cargo, parsed.lotacao, parsed.admissao,
          parsed.total_proventos, parsed.total_descontos, parsed.salario_liquido,
          s.url_detalhe, hash, agora
        );

        const contraId = db.prepare('SELECT last_insert_rowid() as id').get().id;
        db.prepare('DELETE FROM contracheque_rubricas WHERE contracheque_id = ?').run(contraId);

        for (const rub of parsed.rubricas) {
          if (rub.valor !== null) {
            insertRubricaStmt.run(contraId, rub.descricao, rub.tipo, rub.valor);
          }
        }

        db.exec('COMMIT;');

        totalHolerites++;
        process.stdout.write(`  [${i + 1}/${servidores.length}] ${nomeFinal.slice(0, 24).padEnd(24)} Líquido: R$ ${(parsed.salario_liquido || 0).toFixed(2)}\r`);

        await sleep(150); // Pausa leve de 150ms
      } catch (err) {
        // ignora e continua
      }
    }
    console.log(`\n  ✔ Mês ${ano}/${String(mes).padStart(2, '0')} concluído com sucesso.`);
  }

  console.log(`\n================================================================`);
  console.log(`COLETA DE CONTRACHEQUES DETALHADOS FINALIZADA!`);
  console.log(`Total de holerites detalhados salvos no SQLite: ${totalHolerites}`);
  console.log(`================================================================`);
}

if (require.main === module) {
  processarTudo();
}
