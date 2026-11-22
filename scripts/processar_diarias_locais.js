/**
 * ==============================================================================
 * INGESTÃO ULTRA-RÁPIDA DE DIÁRIAS LOCAIS (DIRECT-TO-SQLITE)
 * ==============================================================================
 * Processa todos os 514 arquivos RAW já baixados no disco sem bater na internet.
 * Extrai Servidor, Empenho, Data, Valor, CPF, Destino e Motivo da Viagem.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  INGESTÃO FORENSE DE DIÁRIAS DE VIAGEM (514 MESES RAW LOCAIS)      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 10000;

  CREATE TABLE IF NOT EXISTS diarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT NOT NULL UNIQUE,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    nr_empenho TEXT,
    tipo_diaria TEXT,
    servidor TEXT NOT NULL,
    cargo TEXT,
    destino TEXT,
    motivo TEXT,
    valor REAL NOT NULL,
    data_viagem TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_diar_busca ON diarias(ano, mes, entidade, servidor);
  CREATE INDEX IF NOT EXISTS idx_diar_servidor ON diarias(servidor);
`);

function parseMoedaBR(str) {
  if (!str) return 0;
  let s = String(str).trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(s);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const PASTAS = [
  {
    nome: 'Prefeitura Municipal de Arinos',
    idorg: 236,
    dir: path.join(BASE_DIR, 'dados/auditoria/raw/prefeitura/diarias')
  },
  {
    nome: 'Fundação Municipal de Saúde de Arinos',
    idorg: 241,
    dir: path.join(BASE_DIR, 'dados/auditoria/raw/fundacao_saude/diarias')
  }
];

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO diarias (
    hash_registro, entidade, idorg, ano, mes, nr_empenho, tipo_diaria,
    servidor, cargo, destino, motivo, valor, data_viagem, hash_arquivo_raw, coletado_em
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalDiarias = 0;
let totalValor = 0;

for (const p of PASTAS) {
  if (!fs.existsSync(p.dir)) {
    console.log(`Pasta não encontrada: ${p.dir}`);
    continue;
  }

  const arquivos = fs.readdirSync(p.dir).filter(f => f.endsWith('.html')).sort();
  console.log(`\nProcessando ${arquivos.length} meses da ${p.nome}...`);

  for (const arq of arquivos) {
    const fullPath = path.join(p.dir, arq);
    const html = fs.readFileSync(fullPath, 'latin1');
    const hashRaw = sha256(html);

    const [ano, mes] = arq.replace('.html', '').split('_').map(Number);
    if (!ano || !mes) continue;

    const blocos = html.split(/<div class="empenho"|<hr width="95%"/gi);
    const registrosMes = [];

    for (const bloco of blocos) {
      if (!bloco.includes('Número do empenho:') && !bloco.includes('N&uacute;mero do empenho:')) continue;

      const getField = (re) => {
        const m = bloco.match(re);
        return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
      };

      const nrEmpenho = getField(/(?:Número|N&uacute;mero) do empenho:\s*<\/strong>\s*([^<]+)/i);
      const dataEmpenho = getField(/Data:\s*<\/strong>\s*([^<]+)/i);
      const valorStr = getField(/Valor:\s*<\/strong>\s*([^<]+)/i);
      const credor = getField(/Credor:\s*<\/strong>\s*([^<]+)/i);
      const historico = getField(/Hist(?:[oó]|&oacute;)rico:\s*<\/strong>\s*([^<]+)/i);
      const natureza = getField(/Descri(?:[cç]|&ccedil;)(?:[aã]|&atilde;)o Natureza:\s*<\/strong>\s*([^<]+)/i);
      const valor = parseMoedaBR(valorStr);

      if (credor && valor > 0) {
        const hashReg = sha256(`${p.idorg}_diaria_${ano}_${mes}_${nrEmpenho}_${credor}_${valor}`);
        registrosMes.push({
          hash_registro: hashReg,
          entidade: p.nome,
          idorg: p.idorg,
          ano,
          mes,
          nr_empenho: nrEmpenho,
          tipo_diaria: natureza || 'Diária de Viagem',
          servidor: credor,
          cargo: '',
          destino: historico,
          motivo: historico,
          valor,
          data_viagem: dataEmpenho || `${ano}-${String(mes).padStart(2, '0')}-01`,
          hash_arquivo_raw: hashRaw,
          coletado_em: new Date().toISOString()
        });
      }
    }

    if (registrosMes.length > 0) {
      db.exec('BEGIN TRANSACTION;');
      for (const r of registrosMes) {
        insertStmt.run(
          r.hash_registro, r.entidade, r.idorg, r.ano, r.mes, r.nr_empenho,
          r.tipo_diaria, r.servidor, r.cargo, r.destino, r.motivo, r.valor,
          r.data_viagem, r.hash_arquivo_raw, r.coletado_em
        );
        totalDiarias++;
        totalValor += r.valor;
      }
      db.exec('COMMIT;');
      process.stdout.write(`  [${ano}/${String(mes).padStart(2, '0')}] ${registrosMes.length} diárias inseridas.\r`);
    }
  }
}

console.log('\n\n================================================================');
console.log('INGESTÃO DE DIÁRIAS CONCLUÍDA COM SUCESSO!');
console.log(`Total de Diárias Processadas: ${totalDiarias}`);
console.log(`Volume Financeiro Total em Diárias: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
console.log('================================================================');

db.close();
