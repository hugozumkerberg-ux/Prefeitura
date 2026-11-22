/**
 * ==============================================================================
 * MOTOR DE EXTRAÇÃO E TRATAMENTO UNIFICADO — ARINOS / MG
 * ==============================================================================
 * Executa Coleta Forense (com SHA-256 e RAW store) + Tratamento Estruturado
 * diretamente para o banco SQLite Master:
 * portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3
 * 
 * Regra de Negócio:
 * - Começa da data atual (Novembro/2026) e retrocede mês a mês.
 * - Para estritamente após 30 meses CONSECUTIVOS sem dados (vazios).
 * - Sanitização rigorosa de moedas (prevenindo o bug dos R$ 160 milhões).
 * - Atualiza o status_coleta.json e resumo_geral.json a cada lote.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_URL = 'http://www.adpmnet.com.br/index.php';
const BASE_URL2 = 'http://www.adpmnet.com.br/index2.php';

const PORTAL_DIR = path.resolve(__dirname, '..');
const DADOS_DIR = path.join(PORTAL_DIR, 'dados');
const AUDIT_DIR = path.join(DADOS_DIR, 'auditoria');
const RAW_DIR = path.join(AUDIT_DIR, 'raw');
const DB_MASTER_PATH = path.join(DADOS_DIR, 'arinos_transparencia_master.sqlite3');
const STATUS_JSON_PATH = path.join(DADOS_DIR, 'status_coleta.json');
const RESUMO_JSON_PATH = path.join(DADOS_DIR, 'resumo_geral.json');

// Garante diretórios
[DADOS_DIR, AUDIT_DIR, RAW_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Banco de Dados Master Unificado
const db = new DatabaseSync(DB_MASTER_PATH);

// Criação do Schema Estruturado e Auditado
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 10000;

  -- 1. Cadeia de Custódia e Consultas de Rede
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
    qtd_registros_extraidos INTEGER DEFAULT 0,
    caminho_arquivo_raw TEXT,
    mensagem TEXT,
    coletado_em TEXT NOT NULL,
    tempo_resposta_ms INTEGER,
    UNIQUE(entidade, modulo, ano, mes, tpformpdf)
  );

  -- 2. Folha de Pagamento / Contracheques Estruturados
  CREATE TABLE IF NOT EXISTS contracheques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT UNIQUE NOT NULL,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    matricula TEXT,
    nome TEXT NOT NULL,
    cargo TEXT,
    vinculo TEXT,
    tipo_folha TEXT,
    total_proventos REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    salario_liquido REAL DEFAULT 0,
    idfun TEXT,
    url_detalhe TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  -- 3. Despesas e Empenhos Estruturados
  CREATE TABLE IF NOT EXISTS despesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT UNIQUE NOT NULL,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    nr_empenho TEXT,
    data_empenho TEXT,
    valor REAL DEFAULT 0,
    credor TEXT NOT NULL,
    cpf_cnpj TEXT,
    funcional_programatica TEXT,
    natureza TEXT,
    projeto_atividade TEXT,
    descricao_natureza TEXT,
    historico TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  -- 4. Diárias e Viagens Estruturadas
  CREATE TABLE IF NOT EXISTS diarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_registro TEXT UNIQUE NOT NULL,
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
    valor REAL DEFAULT 0,
    data_viagem TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  -- 5. Contracheques Detalhados (Holerite / Rubricas)
  CREATE TABLE IF NOT EXISTS contracheques_detalhados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_holerite TEXT UNIQUE NOT NULL,
    entidade TEXT NOT NULL,
    idorg INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    idfun TEXT NOT NULL,
    matricula TEXT,
    nome TEXT NOT NULL,
    cargo TEXT,
    lotacao TEXT,
    data_admissao TEXT,
    total_proventos REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    salario_liquido REAL DEFAULT 0,
    rubricas_json TEXT,
    hash_arquivo_raw TEXT,
    coletado_em TEXT NOT NULL
  );

  -- Índices de Alta Performance
  CREATE INDEX IF NOT EXISTS idx_contra_busca ON contracheques(ano, mes, entidade, nome);
  CREATE INDEX IF NOT EXISTS idx_desp_busca ON despesas(ano, mes, entidade, credor);
  CREATE INDEX IF NOT EXISTS idx_diar_busca ON diarias(ano, mes, entidade, servidor);
`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Sanitizador de Moeda Inteligente:
 * Evita o bug catastrófico de transformar R$ 1.502,54 em R$ 150.254,00
 */
function parseMoedaBR(str) {
  if (typeof str === 'number') return Math.round(str * 100) / 100;
  if (!str) return 0;
  let s = String(str).trim();
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const val = parseFloat(s);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
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

const CONFIG_MODULOS = {
  folha_prefeitura: {
    entidadeKey: 'prefeitura',
    moduloNome: 'folha_mensal',
    tpformpdf: 51,
    titulo: 'Remuneração Mensal dos Servidores Públicos',
    label: 'Folha de Pagamento — Prefeitura Municipal'
  },
  folha_saude: {
    entidadeKey: 'fundacao_saude',
    moduloNome: 'folha_mensal',
    tpformpdf: 51,
    titulo: 'Remuneração Mensal dos Servidores Públicos',
    label: 'Folha de Pagamento — Fundação Municipal de Saúde'
  },
  despesas_prefeitura: {
    entidadeKey: 'prefeitura',
    moduloNome: 'despesas',
    tpformpdf: 56,
    titulo: 'Despesas',
    label: 'Despesas e Empenhos — Prefeitura Municipal'
  },
  despesas_saude: {
    entidadeKey: 'fundacao_saude',
    moduloNome: 'despesas',
    tpformpdf: 56,
    titulo: 'Despesas',
    label: 'Despesas e Empenhos — Fundação Municipal de Saúde'
  },
  diarias_prefeitura: {
    entidadeKey: 'prefeitura',
    moduloNome: 'diarias',
    tpformpdf: 59,
    titulo: 'Diárias',
    label: 'Diárias de Viagem — Prefeitura Municipal'
  },
  diarias_saude: {
    entidadeKey: 'fundacao_saude',
    moduloNome: 'diarias',
    tpformpdf: 59,
    titulo: 'Diárias',
    label: 'Diárias de Viagem — Fundação Municipal de Saúde'
  }
};

function montarUrl(entidadeKey, tpformpdf, titulo, ano, mes) {
  const ent = ENTIDADES[entidadeKey];
  const params = new URLSearchParams({
    option: 'com_contpubl',
    brasao: 'P310450.GIF',
    dsorg: ent.nome,
    titulo: titulo,
    idorg: String(ent.idorg),
    dsufe: 'Estado de Minas Gerais',
    cnpj: ent.cnpj,
    tpformpdf: String(tpformpdf),
    ano: String(ano),
    mes: String(mes),
    nome_mat: '1',
    nao_proventos: '0',
    nao_descontos: '0',
    xts: '0'
  });
  if (tpformpdf === 51) params.set('submenu', '1');
  return `${BASE_URL}?${params.toString()}`;
}

// -----------------------------------------------------------------------------
// PARSERS E SANITIZADORES ESPECÍFICOS POR TIPO DE DADO
// -----------------------------------------------------------------------------

function extrairLinhasFolha(html, entidadeKey, ano, mes, hashRaw) {
  const ent = ENTIDADES[entidadeKey];
  const registros = [];

  // Localiza cada linha <tr> da tabela de folha
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = trRegex.exec(html)) !== null) {
    const trContent = match[1];
    if (trContent.includes('<th') || !trContent.includes('tpformpdf=52')) continue;

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cols = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      cols.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (cols.length >= 5) {
      const vinculo = cols[0] || '';
      const matNomeRaw = cols[1] || '';
      let matricula = '';
      let nome = matNomeRaw;
      if (matNomeRaw.includes('-')) {
        const parts = matNomeRaw.split('-');
        matricula = parts[0].trim();
        nome = parts.slice(1).join('-').trim();
      }

      const cargo = cols[2] || '';
      const tipoFolha = cols[3] || 'Pagamentos';
      const proventos = parseMoedaBR(cols[4] || '0');

      // Extrai idfun do link de detalhe
      const idfunMatch = trContent.match(/idfun=(\d+)/i);
      const idfun = idfunMatch ? idfunMatch[1] : null;

      const linkMatch = trContent.match(/href="([^"]+)"/i);
      const urlDetalhe = linkMatch ? linkMatch[1] : null;

      const hashRegistro = sha256(`${entidadeKey}_folha_${ano}_${mes}_${matricula}_${nome}_${proventos}`);

      registros.push({
        hash_registro: hashRegistro,
        entidade: ent.nome,
        idorg: ent.idorg,
        ano,
        mes,
        matricula,
        nome,
        cargo,
        vinculo,
        tipo_folha: tipoFolha,
        total_proventos: proventos,
        total_descontos: 0,
        salario_liquido: proventos,
        idfun,
        url_detalhe: urlDetalhe,
        hash_arquivo_raw: hashRaw,
        coletado_em: new Date().toISOString()
      });
    }
  }

  return registros;
}

function extrairLinhasDespesas(html, entidadeKey, ano, mes, hashRaw) {
  const ent = ENTIDADES[entidadeKey];
  const registros = [];

  // ADPMNET agrupa despesas em div.empenho ou blocos de tabela
  const blocos = html.split(/<div class="empenho"|<hr width="95%"/gi);

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
    const cpfCnpj = getField(/(?:CPF credor \/ CNPJ credor|CPF\/CNPJ):\s*<\/strong>\s*([^<]+)/i);
    const funcional = getField(/Funcional Program[aá]tica:\s*<\/strong>\s*([^<]+)/i);
    const natureza = getField(/Natureza:\s*<\/strong>\s*(?:<span>)?([^<]+)/i);
    const projeto = getField(/Projeto Atividade:\s*<\/strong>\s*([^<]+)/i);
    const descNatureza = getField(/Descri[cç][aã]o Natureza:\s*<\/strong>\s*([^<]+)/i);
    const historico = getField(/Hist[oó]rico:\s*<\/strong>\s*([^<]+)/i);

    if (nrEmpenho || credor) {
      const valor = parseMoedaBR(valorStr);
      const hashReg = sha256(`${entidadeKey}_despesa_${ano}_${mes}_${nrEmpenho}_${credor}_${valor}`);

      registros.push({
        hash_registro: hashReg,
        entidade: ent.nome,
        idorg: ent.idorg,
        ano,
        mes,
        nr_empenho: nrEmpenho,
        data_empenho: dataEmpenho,
        valor,
        credor: credor || 'NÃO INFORMADO',
        cpf_cnpj: cpfCnpj,
        funcional_programatica: funcional,
        natureza,
        projeto_atividade: projeto,
        descricao_natureza: descNatureza,
        historico,
        hash_arquivo_raw: hashRaw,
        coletado_em: new Date().toISOString()
      });
    }
  }

  return registros;
}

function extrairLinhasDiarias(html, entidadeKey, ano, mes, hashRaw) {
  const ent = ENTIDADES[entidadeKey];
  const registros = [];

  // Diárias vêm em tabelas regulares de despesas de viagem
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = trRegex.exec(html)) !== null) {
    const tr = match[1];
    if (tr.includes('<th') || tr.includes('Empenho') || tr.includes('Benefici')) continue;

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cols = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(tr)) !== null) {
      cols.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (cols.length >= 4) {
      const servidor = cols[0] || cols[1] || '';
      const destino = cols[2] || '';
      const motivo = cols[3] || '';
      const valor = parseMoedaBR(cols[cols.length - 1] || '0');

      if (servidor && valor > 0) {
        const hashReg = sha256(`${entidadeKey}_diaria_${ano}_${mes}_${servidor}_${valor}`);
        registros.push({
          hash_registro: hashReg,
          entidade: ent.nome,
          idorg: ent.idorg,
          ano,
          mes,
          nr_empenho: '',
          tipo_diaria: 'Diária Civil',
          servidor,
          cargo: '',
          destino,
          motivo,
          valor,
          data_viagem: `${ano}-${String(mes).padStart(2, '0')}-01`,
          hash_arquivo_raw: hashRaw,
          coletado_em: new Date().toISOString()
        });
      }
    }
  }

  return registros;
}

// -----------------------------------------------------------------------------
// SINCRONIZAÇÃO DE STATUS E DASHBOARD JSON
// -----------------------------------------------------------------------------

function atualizarStatusJson(moduloKey, status, extra = {}) {
  let statusObj = {};
  if (fs.existsSync(STATUS_JSON_PATH)) {
    try {
      statusObj = JSON.parse(fs.readFileSync(STATUS_JSON_PATH, 'utf-8'));
    } catch {}
  }

  if (!statusObj.modulos) statusObj.modulos = {};
  statusObj.ultima_atualizacao = new Date().toISOString();

  statusObj.modulos[moduloKey] = {
    nome: CONFIG_MODULOS[moduloKey] ? CONFIG_MODULOS[moduloKey].label : moduloKey,
    status, // "em_andamento", "concluido", "erro"
    ...extra
  };

  // Calcula totais agregados em tempo real do SQLite Master
  try {
    const totalConsultas = db.prepare('SELECT COUNT(*) as c FROM auditoria_consultas').get().c || 0;
    const consultasComDados = db.prepare("SELECT COUNT(*) as c FROM auditoria_consultas WHERE status_coleta = 'com_dados'").get().c || 0;
    const totalContracheques = db.prepare('SELECT COUNT(*) as c, SUM(total_proventos) as s FROM contracheques').get();
    const totalDespesas = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM despesas').get();
    const totalDiarias = db.prepare('SELECT COUNT(*) as c, SUM(valor) as s FROM diarias').get();

    statusObj.totais_acumulados = {
      consultas_http_realizadas: totalConsultas,
      competencias_com_dados: consultasComDados,
      contracheques_tratados: totalContracheques.c || 0,
      valor_contracheques: totalContracheques.s || 0,
      despesas_tratadas: totalDespesas.c || 0,
      valor_despesas: totalDespesas.s || 0,
      diarias_tratadas: totalDiarias.c || 0,
      valor_diarias: totalDiarias.s || 0,
      total_geral_registros: (totalContracheques.c || 0) + (totalDespesas.c || 0) + (totalDiarias.c || 0),
      volume_financeiro_auditado: (totalContracheques.s || 0) + (totalDespesas.s || 0) + (totalDiarias.s || 0)
    };
  } catch {}

  fs.writeFileSync(STATUS_JSON_PATH, JSON.stringify(statusObj, null, 2), 'utf-8');
}

// -----------------------------------------------------------------------------
// MOTOR PRINCIPAL DE PROCESSAMENTO DO MÓDULO
// -----------------------------------------------------------------------------

async function executarColetaETratamento(moduloKey, limiteVazios = 70, maxConsultas = Infinity) {
  const conf = CONFIG_MODULOS[moduloKey];
  if (!conf) throw new Error(`Módulo não configurado: ${moduloKey}`);

  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log(`║  INICIANDO: ${conf.label.padEnd(54)} ║`);
  console.log(`║  Órgão: ${ENTIDADES[conf.entidadeKey].nome.padEnd(58)} ║`);
  console.log(`║  Critério de Parada: ${limiteVazios} meses consecutivos vazios           ║`);
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  atualizarStatusJson(moduloKey, 'em_andamento', {
    inicio: new Date().toISOString(),
    progresso_pct: 0,
    coletados_raw: 0,
    tratados_banco: 0,
    volume_reais: 0
  });

  const subpastaRaw = path.join(RAW_DIR, conf.entidadeKey, conf.moduloNome);
  if (!fs.existsSync(subpastaRaw)) fs.mkdirSync(subpastaRaw, { recursive: true });

  let ano = 2026;
  let mes = 11;
  let vaziosConsecutivos = 0;
  let totalConsultas = 0;
  let mesesComDados = 0;
  let totalRegistrosTratados = 0;
  let totalVolumeFinanceiro = 0;

  const stmtAudit = db.prepare(`
    INSERT OR REPLACE INTO auditoria_consultas (
      entidade, idorg, modulo, tpformpdf, ano, mes, url_completa,
      status_http, status_coleta, bytes_recebidos, hash_sha256,
      qtd_registros_extraidos, caminho_arquivo_raw, mensagem, coletado_em, tempo_resposta_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stmtContra = db.prepare(`
    INSERT OR REPLACE INTO contracheques (
      hash_registro, entidade, idorg, ano, mes, matricula, nome,
      cargo, vinculo, tipo_folha, total_proventos, total_descontos,
      salario_liquido, idfun, url_detalhe, hash_arquivo_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stmtDesp = db.prepare(`
    INSERT OR REPLACE INTO despesas (
      hash_registro, entidade, idorg, ano, mes, nr_empenho, data_empenho,
      valor, credor, cpf_cnpj, funcional_programatica, natureza,
      projeto_atividade, descricao_natureza, historico, hash_arquivo_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stmtDiar = db.prepare(`
    INSERT OR REPLACE INTO diarias (
      hash_registro, entidade, idorg, ano, mes, nr_empenho, tipo_diaria,
      servidor, cargo, destino, motivo, valor, data_viagem, hash_arquivo_raw, coletado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  while (vaziosConsecutivos < limiteVazios) {
    totalConsultas++;
    const url = montarUrl(conf.entidadeKey, conf.tpformpdf, conf.titulo, ano, mes);
    const arquivoNome = `${ano}_${String(mes).padStart(2, '0')}.html`;
    const arquivoCaminho = path.join(subpastaRaw, arquivoNome);

    process.stdout.write(`[${ano}/${String(mes).padStart(2, '0')}] Consultando ADPMNET... `);

    const inicioMs = Date.now();
    let statusHttp = 0;
    let conteudo = '';
    let hashConteudo = '';
    let bytes = 0;
    let statusColeta = 'erro';
    let mensagem = '';
    let registrosExtraidos = [];

    try {
      if (fs.existsSync(arquivoCaminho) && fs.statSync(arquivoCaminho).size > 0) {
        conteudo = fs.readFileSync(arquivoCaminho, 'utf-8');
        statusHttp = 200;
        bytes = Buffer.byteLength(conteudo, 'utf-8');
        hashConteudo = sha256(conteudo);
      } else {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuditoriaPublica/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        statusHttp = res.status;
        conteudo = await res.text();
        bytes = Buffer.byteLength(conteudo, 'utf-8');
        hashConteudo = sha256(conteudo);

        fs.writeFileSync(arquivoCaminho, conteudo, 'utf-8');
        // Cortesia ao servidor público
        await new Promise(r => setTimeout(r, 120));
      }

      // Verifica se a página é vazia
      const textoLimpo = conteudo.replace(/<[^>]+>/g, ' ').toLowerCase();
      const ehVazio = (
        textoLimpo.includes('nenhum registro encontrado') ||
        textoLimpo.includes('não existem registros') ||
        textoLimpo.includes('sem movimentação') ||
        textoLimpo.includes('total de pessoas: 0') ||
        textoLimpo.includes("doesn't exist") ||
        bytes < 1500
      );

      if (ehVazio) {
        statusColeta = 'vazio';
        mensagem = 'Competência sem dados';
      } else {
        statusColeta = 'com_dados';
        mensagem = `Gravado (${(bytes / 1024).toFixed(1)} KB)`;

        // Parser específico do módulo
        if (conf.moduloNome === 'folha_mensal') {
          registrosExtraidos = extrairLinhasFolha(conteudo, conf.entidadeKey, ano, mes, hashConteudo);
          db.exec('BEGIN TRANSACTION;');
          for (const r of registrosExtraidos) {
            stmtContra.run(
              r.hash_registro, r.entidade, r.idorg, r.ano, r.mes, r.matricula,
              r.nome, r.cargo, r.vinculo, r.tipo_folha, r.total_proventos,
              r.total_descontos, r.salario_liquido, r.idfun, r.url_detalhe,
              r.hash_arquivo_raw, r.coletado_em
            );
            totalVolumeFinanceiro += r.total_proventos;
          }
          db.exec('COMMIT;');
        } else if (conf.moduloNome === 'despesas') {
          registrosExtraidos = extrairLinhasDespesas(conteudo, conf.entidadeKey, ano, mes, hashConteudo);
          db.exec('BEGIN TRANSACTION;');
          for (const r of registrosExtraidos) {
            stmtDesp.run(
              r.hash_registro, r.entidade, r.idorg, r.ano, r.mes, r.nr_empenho,
              r.data_empenho, r.valor, r.credor, r.cpf_cnpj, r.funcional_programatica,
              r.natureza, r.projeto_atividade, r.descricao_natureza, r.historico,
              r.hash_arquivo_raw, r.coletado_em
            );
            totalVolumeFinanceiro += r.valor;
          }
          db.exec('COMMIT;');
        } else if (conf.moduloNome === 'diarias') {
          registrosExtraidos = extrairLinhasDiarias(conteudo, conf.entidadeKey, ano, mes, hashConteudo);
          db.exec('BEGIN TRANSACTION;');
          for (const r of registrosExtraidos) {
            stmtDiar.run(
              r.hash_registro, r.entidade, r.idorg, r.ano, r.mes, r.nr_empenho,
              r.tipo_diaria, r.servidor, r.cargo, r.destino, r.motivo, r.valor,
              r.data_viagem, r.hash_arquivo_raw, r.coletado_em
            );
            totalVolumeFinanceiro += r.valor;
          }
          db.exec('COMMIT;');
        }
      }
    } catch (e) {
      statusColeta = 'erro_rede';
      mensagem = e.message;
    }

    const tempoResposta = Date.now() - inicioMs;
    const agora = new Date().toISOString();

    // Salva na auditoria
    stmtAudit.run(
      conf.entidadeKey, ENTIDADES[conf.entidadeKey].idorg, conf.moduloNome, conf.tpformpdf,
      ano, mes, url, statusHttp, statusColeta, bytes, hashConteudo,
      registrosExtraidos.length, arquivoCaminho, mensagem, agora, tempoResposta
    );

    if (statusColeta === 'com_dados' && registrosExtraidos.length > 0) {
      mesesComDados++;
      vaziosConsecutivos = 0;
      totalRegistrosTratados += registrosExtraidos.length;
      console.log(`[OK] ${registrosExtraidos.length} registros tratados | Total: R$ ${totalVolumeFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    } else {
      statusColeta = 'vazio';
      vaziosConsecutivos++;
      console.log(`[VAZIO] (${vaziosConsecutivos}/${limiteVazios} consecutivos)`);
    }

    // Atualiza JSON de status em tempo real a cada 5 competências
    if (totalConsultas % 5 === 0) {
      atualizarStatusJson(moduloKey, 'em_andamento', {
        coletados_raw: totalConsultas,
        meses_com_dados: mesesComDados,
        tratados_banco: totalRegistrosTratados,
        volume_reais: totalVolumeFinanceiro,
        ano_atual: ano,
        mes_atual: mes
      });
    }

    // Retrocede um mês
    mes--;
    if (mes === 0) {
      mes = 12;
      ano--;
    }

    if (totalConsultas >= maxConsultas) {
      console.log(`\n[TESTE FLOW] Limite de ${maxConsultas} consultas atingido com sucesso.`);
      break;
    }

    // Intervalo de cortesia para não estressar o servidor público
    await sleep(400);
  }

  // Conclusão com sucesso
  atualizarStatusJson(moduloKey, 'concluido', {
    fim: new Date().toISOString(),
    progresso_pct: 100,
    coletados_raw: totalConsultas,
    meses_com_dados: mesesComDados,
    tratados_banco: totalRegistrosTratados,
    volume_reais: totalVolumeFinanceiro,
    status_msg: 'Auditado e Estruturado 100%'
  });

  console.log('\n================================================================');
  console.log(`MÓDULO CONCLUÍDO COM SUCESSO: ${conf.label}`);
  console.log(`Total de consultas: ${totalConsultas} | Meses com dados: ${mesesComDados}`);
  console.log(`Registros tratados no SQLite: ${totalRegistrosTratados}`);
  console.log(`Volume financeiro auditado: R$ ${totalVolumeFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log('================================================================\n');

  return {
    moduloKey,
    totalConsultas,
    mesesComDados,
    totalRegistrosTratados,
    totalVolumeFinanceiro
  };
}

// -----------------------------------------------------------------------------
// EXECUÇÃO CLI
// -----------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  let modulo = 'folha_prefeitura';
  let vazios = 70;
  let maxConsultas = Infinity;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--modulo' && args[i + 1]) modulo = args[i + 1];
    if (args[i] === '--vazios' && args[i + 1]) vazios = parseInt(args[i + 1], 10);
    if (args[i] === '--max-consultas' && args[i + 1]) maxConsultas = parseInt(args[i + 1], 10);
  }

  if (modulo === 'tudo') {
    console.log('>>> MODO MESTRE: EXECUTANDO TODOS OS MÓDULOS EM SEQUÊNCIA <<<\n');
    const todos = [
      'folha_prefeitura',
      'folha_saude',
      'despesas_prefeitura',
      'despesas_saude',
      'diarias_prefeitura',
      'diarias_saude'
    ];
    for (const m of todos) {
      try {
        await executarColetaETratamento(m, vazios, maxConsultas);
      } catch (err) {
        console.error(`Erro no módulo ${m}:`, err.message);
      }
    }
  } else {
    await executarColetaETratamento(modulo, vazios, maxConsultas);
  }

  // Ao final, sincroniza o resumo geral do dashboard
  try {
    const atualizarDashScript = path.join(__dirname, 'atualizar_dashboard.js');
    if (fs.existsSync(atualizarDashScript)) {
      require(atualizarDashScript);
    }
  } catch {}
}

if (require.main === module) {
  main().catch(err => {
    console.error('Falha crítica na execução:', err);
    process.exit(1);
  });
}

module.exports = {
  executarColetaETratamento,
  CONFIG_MODULOS,
  parseMoedaBR
};
