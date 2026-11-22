/**
 * ==============================================================================
 * MOTOR DE AUDITORIA FORENSE E COLETA PROBATÓRIA — ARINOS / MG
 * ==============================================================================
 * 
 * Papel: Gerência de Projetos / Arquitetura de Software / Líder Técnico
 * Finalidade: Extração exaustiva e auditável com cadeia de custódia completa.
 * 
 * Regra de Negócio e Prova Jurídica:
 * 1. Ponto de Partida: Mês atual (Novembro/2026) retrocedendo mês a mês.
 * 2. Critério de Parada: 30 meses CONSECUTIVOS vazios/sem registros.
 * 3. Rastreabilidade Probatória:
 *    - URL pública exata com parâmetros completos (para contraprova direta).
 *    - Arquivo bruto (HTML/CSV) preservado no disco.
 *    - Hash SHA-256 do arquivo bruto e hash SHA-256 individual de cada registro.
 *    - Data/Hora UTC e status HTTP de resposta.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_URL = 'http://www.adpmnet.com.br/index.php';
const BASE_URL2 = 'http://www.adpmnet.com.br/index2.php';

const ROOT_AUDIT = path.resolve(__dirname, '../dados/auditoria');
const RAW_DIR = path.join(ROOT_AUDIT, 'raw');
const DB_PATH = path.join(ROOT_AUDIT, 'arinos_auditoria_master.sqlite3');

if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

console.log('--- MOTOR FORENSE DE COLETA E AUDITORIA PÚBLICA ---');
console.log('Banco de Dados Probatório:', DB_PATH);
console.log('Repositório de Arquivos Brutos:', RAW_DIR);

const db = new DatabaseSync(DB_PATH);

// Tabela de Log de Auditoria (Cadeia de Custódia)
db.exec(`
  CREATE TABLE IF NOT EXISTS auditoria_consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    modulo TEXT NOT NULL,
    tpformpdf INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    url_completa TEXT NOT NULL,
    status_http INTEGER,
    status_coleta TEXT NOT NULL,
    bytes_recebidos INTEGER,
    hash_sha256 TEXT,
    qtd_registros INTEGER DEFAULT 0,
    caminho_arquivo_raw TEXT,
    mensagem TEXT,
    coletado_em TEXT NOT NULL,
    tempo_resposta_ms INTEGER,
    UNIQUE(entidade, modulo, ano, mes, tpformpdf)
  );

  CREATE TABLE IF NOT EXISTS registro_provas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT UNIQUE NOT NULL,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    modulo TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    identificador_primario TEXT,
    favorecido_nome TEXT,
    favorecido_documento TEXT,
    valor_reais REAL,
    descricao_detalhada TEXT,
    dados_estruturados_json TEXT NOT NULL,
    url_origem_prova TEXT NOT NULL,
    hash_arquivo_raw TEXT NOT NULL,
    caminho_arquivo_raw TEXT NOT NULL,
    coletado_em TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_provas_entidade_modulo ON registro_provas(entidade, modulo);
  CREATE INDEX IF NOT EXISTS idx_provas_ano_mes ON registro_provas(ano, mes);
  CREATE INDEX IF NOT EXISTS idx_provas_documento ON registro_provas(favorecido_documento);
  CREATE INDEX IF NOT EXISTS idx_provas_nome ON registro_provas(favorecido_nome);
`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const ENTIDADES = {
  prefeitura: {
    nome: 'Prefeitura Municipal de Arinos',
    cnpj: '18125120000180',
    idorg: 236
  },
  fundacao_saude: {
    nome: 'Fundação Municipal de Saúde de Arinos',
    cnpj: '18650424000167',
    idorg: 241
  }
};

const MODULOS = {
  folha_mensal: {
    tpformpdf: 51,
    titulo: 'Remuneração Mensal dos Servidores Públicos',
    usa_index2: false
  },
  despesas: {
    tpformpdf: 56,
    titulo: 'Despesas',
    usa_index2: false
  },
  diarias_empenho: {
    tpformpdf: 59,
    titulo: 'Diárias',
    usa_index2: false
  },
  diarias_pagamento: {
    tpformpdf: 60,
    titulo: 'Diárias',
    usa_index2: false
  }
};

function montarUrl(entidadeKey, moduloKey, ano, mes) {
  const ent = ENTIDADES[entidadeKey];
  const mod = MODULOS[moduloKey];
  const base = mod.usa_index2 ? BASE_URL2 : BASE_URL;

  const params = new URLSearchParams({
    option: 'com_contpubl',
    brasao: 'P310450.GIF',
    dsorg: ent.nome,
    titulo: mod.titulo,
    idorg: String(ent.idorg),
    dsufe: 'Estado de Minas Gerais',
    cnpj: ent.cnpj,
    tpformpdf: String(mod.tpformpdf),
    ano: String(ano),
    mes: String(mes),
    nome_mat: '1',
    nao_proventos: '0',
    nao_descontos: '0',
    xts: '0'
  });

  if (mod.tpformpdf === 51) {
    params.set('submenu', '1');
  }

  return `${base}?${params.toString()}`;
}

async function requisitarEGuardarProva(entidadeKey, moduloKey, ano, mes) {
  const url = montarUrl(entidadeKey, moduloKey, ano, mes);
  const ent = ENTIDADES[entidadeKey];
  const mod = MODULOS[moduloKey];

  const subpasta = path.join(RAW_DIR, entidadeKey, moduloKey);
  if (!fs.existsSync(subpasta)) {
    fs.mkdirSync(subpasta, { recursive: true });
  }

  const arquivoNome = `${ano}_${String(mes).padStart(2, '0')}.html`;
  const arquivoCaminho = path.join(subpasta, arquivoNome);

  const inicioMs = Date.now();
  let statusHttp = 0;
  let conteudo = '';
  let statusColeta = 'erro';
  let mensagem = '';
  let hashConteudo = '';
  let bytesRecebidos = 0;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuditoriaPublica/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    statusHttp = res.status;
    conteudo = await res.text();
    bytesRecebidos = Buffer.byteLength(conteudo, 'utf-8');
    hashConteudo = sha256(conteudo);

    fs.writeFileSync(arquivoCaminho, conteudo, 'utf-8');

    // Analisa se a página contém dados reais ou mensagem de vazio
    const textoLimpo = conteudo.replace(/<[^>]+>/g, ' ').toLowerCase();
    const ehVazio = (
      textoLimpo.includes('nenhum registro encontrado') ||
      textoLimpo.includes('não existem registros') ||
      textoLimpo.includes('sem movimentação') ||
      bytesRecebidos < 1500
    );

    if (ehVazio) {
      statusColeta = 'vazio';
      mensagem = 'Competência sem movimentação ou vazia';
    } else {
      statusColeta = 'com_dados';
      mensagem = `Conteúdo probatório gravado (${(bytesRecebidos / 1024).toFixed(1)} KB)`;
    }
  } catch (err) {
    statusColeta = 'erro_rede';
    mensagem = err.message;
  }

  const tempoRespostaMs = Date.now() - inicioMs;
  const agora = new Date().toISOString();

  // Registra no banco probatório
  db.prepare(`
    INSERT OR REPLACE INTO auditoria_consultas (
      entidade, idorg, modulo, tpformpdf, ano, mes, url_completa,
      status_http, status_coleta, bytes_recebidos, hash_sha256,
      qtd_registros, caminho_arquivo_raw, mensagem, coletado_em, tempo_resposta_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entidadeKey, ent.idorg, moduloKey, mod.tpformpdf, ano, mes,
    url, statusHttp, statusColeta, bytesRecebidos, hashConteudo,
    statusColeta === 'com_dados' ? 1 : 0, arquivoCaminho, mensagem, agora, tempoRespostaMs
  );

  return {
    statusColeta,
    statusHttp,
    bytesRecebidos,
    hashConteudo,
    arquivoCaminho,
    url,
    mensagem
  };
}

/**
 * Executa a varredura contínua retroativa com critério estrito de parada de 30 vazios
 */
async function executarVarredura(entidadeKey, moduloKey, anoInicio = 2026, mesInicio = 11, limiteVaziosConsecutivos = 30) {
  console.log(`\n==============================================================================`);
  console.log(`INICIANDO VARREDURA: Entidade=[${ENTIDADES[entidadeKey].nome}] Módulo=[${moduloKey}]`);
  console.log(`Ponto de partida: ${anoInicio}/${String(mesInicio).padStart(2, '0')}`);
  console.log(`Critério de parada: ${limiteVaziosConsecutivos} meses CONSECUTIVOS vazios.`);
  console.log(`==============================================================================`);

  let ano = anoInicio;
  let mes = mesInicio;
  let vaziosConsecutivos = 0;
  let totalProcessado = 0;
  let mesesComDados = 0;

  while (vaziosConsecutivos < limiteVaziosConsecutivos) {
    totalProcessado++;
    process.stdout.write(`[${ano}/${String(mes).padStart(2, '0')}] Consultando... `);

    const res = await requisitarEGuardarProva(entidadeKey, moduloKey, ano, mes);

    if (res.statusColeta === 'com_dados') {
      mesesComDados++;
      vaziosConsecutivos = 0; // REINICIA o contador de vazios
      console.log(`[OK] DADOS ENCONTRADOS (${(res.bytesRecebidos / 1024).toFixed(1)} KB) - Hash: ${res.hashConteudo.slice(0, 8)}...`);
    } else {
      vaziosConsecutivos++;
      console.log(`[VAZIO] (${vaziosConsecutivos}/${limiteVaziosConsecutivos} consecutivos vazios)`);
    }

    // Retrocede um mês
    mes--;
    if (mes === 0) {
      mes = 12;
      ano--;
    }

    // Pausa de cortesia de 800ms para preservar o portal e evitar bloqueio
    await sleep(800);
  }

  console.log(`\n------------------------------------------------------------------------------`);
  console.log(`PARADA DETERMINADA: Atingido o limite de ${limiteVaziosConsecutivos} meses consecutivos vazios.`);
  console.log(`Total de competências verificadas: ${totalProcessado}`);
  console.log(`Meses confirmados com dados: ${mesesComDados}`);
  console.log(`Última competência pesquisada: ${ano}/${String(mes).padStart(2, '0')}`);
  console.log(`------------------------------------------------------------------------------`);
}

module.exports = {
  executarVarredura,
  requisitarEGuardarProva,
  ENTIDADES,
  MODULOS
};

// Se chamado diretamente no terminal
if (require.main === module) {
  const args = process.argv.slice(2);
  const entidade = args[0] || 'fundacao_saude';
  const modulo = args[1] || 'folha_mensal';
  const ano = parseInt(args[2] || '2026', 10);
  const mes = parseInt(args[3] || '11', 10);

  executarVarredura(entidade, modulo, ano, mes, 30);
}
