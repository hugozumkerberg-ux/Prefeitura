/**
 * Rota de Auditoria Forense e Rastreamento de Linhagem por Hash, Matrícula ou Nome
 */
const { dbContracheques, dbDiarias } = require('../db');
const { processarHistoricoEPeriodos } = require('../utils/calculos_periodo');
const { obterDadosPoliticos } = require('../utils/politicos');

function normalizarNome(nome) {
  if (!nome) return '';
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function padronizarMatricula(mat) {
  if (!mat) return '';
  let str = String(mat).trim().replace('-', '.');
  if (str.includes('.')) {
    const parts = str.split('.');
    const base = parts[0].replace(/^0+/, '') || '0';
    const digito = parts[1] || '';
    return digito ? `${base}-${digito}` : base;
  }
  return str.replace(/^0+/, '') || '0';
}

function handleRastrear(req, res, query) {
  const termo = (query.termo || query.hash || query.busca || '').trim();

  if (!termo) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ erro: 'Informe um Hash SHA-256, Matrícula ou Nome para rastrear.' }));
  }

  try {
    let documentoAlvo = null;
    let nomeNormalizadoAlvo = null;

    // 1. Busca se for hash exato (64 caracteres)
    if (/^[a-fA-F0-9]{64}$/.test(termo)) {
      documentoAlvo = dbContracheques.prepare(`
        SELECT caminho, ano, mes, matricula, matricula_padronizada, nome, nome_normalizado, cargo, lotacao, 
               salario_base, total_proventos, total_descontos, salario_liquido, tabelas_json, campos_json, sha256, importado_em 
        FROM contracheques 
        WHERE sha256 = ? 
        LIMIT 1
      `).get(termo.toLowerCase());

      if (documentoAlvo) {
        nomeNormalizadoAlvo = documentoAlvo.nome_normalizado;
      }
    }

    // 2. Se não encontrou por hash, busca por Matrícula Padronizada
    if (!nomeNormalizadoAlvo) {
      const matPad = padronizarMatricula(termo);
      const docMat = dbContracheques.prepare(`
        SELECT caminho, ano, mes, matricula, matricula_padronizada, nome, nome_normalizado, cargo, lotacao, 
               salario_base, total_proventos, total_descontos, salario_liquido, tabelas_json, campos_json, sha256, importado_em 
        FROM contracheques 
        WHERE matricula_padronizada = ? OR matricula_padronizada LIKE ?
        ORDER BY ano DESC, mes DESC 
        LIMIT 1
      `).get(matPad, `${matPad}-%`);

      if (docMat) {
        documentoAlvo = docMat;
        nomeNormalizadoAlvo = docMat.nome_normalizado;
      }
    }

    // 3. Se ainda não encontrou, busca por Nome Normalizado
    if (!nomeNormalizadoAlvo) {
      const nomeNormBusca = normalizarNome(termo);
      const docNome = dbContracheques.prepare(`
        SELECT caminho, ano, mes, matricula, matricula_padronizada, nome, nome_normalizado, cargo, lotacao, 
               salario_base, total_proventos, total_descontos, salario_liquido, tabelas_json, campos_json, sha256, importado_em 
        FROM contracheques 
        WHERE nome_normalizado LIKE ? 
        ORDER BY ano DESC, mes DESC 
        LIMIT 1
      `).get(`%${nomeNormBusca}%`);

      if (docNome) {
        documentoAlvo = docNome;
        nomeNormalizadoAlvo = docNome.nome_normalizado;
      }
    }

    if (!nomeNormalizadoAlvo) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ 
        sucesso: false, 
        mensagem: 'Nenhum registro localizado para o identificador fornecido.' 
      }));
    }

    // 4. Busca histórico completo de contracheques da pessoa
    const historicoFolha = dbContracheques.prepare(`
      SELECT ano, mes, matricula_padronizada, cargo, lotacao, salario_base, total_proventos, total_descontos, salario_liquido, tabelas_json, campos_json, sha256, importado_em
      FROM contracheques
      WHERE nome_normalizado = ?
      ORDER BY ano DESC, mes DESC
    `).all(nomeNormalizadoAlvo);

    // 5. Busca histórico completo de diárias da pessoa
    let historicoDiarias = [];
    if (dbDiarias) {
      const diariaKey = nomeNormalizadoAlvo.toLowerCase().replace(/\s+/g, '_');
      historicoDiarias = dbDiarias.prepare(`
        SELECT ano, mes, tipo, valor, fonte, coletado_em
        FROM registros
        WHERE (nome_normalizado = ? OR replace(lower(nome), ' ', '_') = ?) AND valor > 0
        ORDER BY ano DESC, mes DESC
      `).all(diariaKey, diariaKey);
    }

    // 6. Agregações e métricas do servidor
    const totalSalarios = historicoFolha.reduce((acc, h) => acc + (h.total_proventos || 0), 0);
    const totalDiariasValor = historicoDiarias.reduce((acc, d) => acc + (d.valor || 0), 0);
    const cargos = Array.from(new Set(historicoFolha.map(h => h.cargo).filter(Boolean)));
    const matriculas = Array.from(new Set(historicoFolha.map(h => h.matricula_padronizada).filter(Boolean)));

    // 7. Cálculo pericial de períodos reais e intervalos (gaps de início e fim)
    const periodosInfo = processarHistoricoEPeriodos(historicoFolha);

    // 8. Cruzamento com TSE e Câmara (ID Único, Passado Político, Status Eleitoral e Foto)
    const infoPolitica = obterDadosPoliticos(documentoAlvo ? documentoAlvo.nome : (nomeNormalizadoAlvo || termo));

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      sucesso: true,
      servidor: {
        pessoa_id: infoPolitica.pessoa_id,
        nome: documentoAlvo ? documentoAlvo.nome : termo,
        nomeNormalizado: nomeNormalizadoAlvo,
        foto_url: infoPolitica.foto_url,
        passado_politico: infoPolitica,
        matriculas,
        cargos,
        totalContracheques: historicoFolha.length,
        totalSalarios,
        totalDiarias: historicoDiarias.length,
        totalDiariasValor,
        dataInicio: periodosInfo.dataInicio,
        dataFim: periodosInfo.dataFim,
        tempoBruto: periodosInfo.tempoBrutoExtenso,
        totalMesesBruto: periodosInfo.totalMesesBruto,
        tempoEfetivo: periodosInfo.tempoTotalExtenso,
        totalMesesEfetivos: periodosInfo.totalMesesEfetivos,
        totalMesesFeriasRecesso: periodosInfo.totalMesesFeriasRecesso,
        tempoFeriasRecesso: periodosInfo.tempoFeriasRecessoExtenso,
        total13Salarios: periodosInfo.total13Salarios,
        totalIntervalos: periodosInfo.totalIntervalos,
        totalMesesIntervalos: periodosInfo.totalMesesIntervalos,
        tempoIntervalos: periodosInfo.tempoIntervalosExtenso,
        temIntervalos: periodosInfo.temIntervalos,
        periodosTimeline: periodosInfo.timeline
      },
      documentoConsultado: documentoAlvo,
      historicoFolha,
      historicoDiarias
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Falha na auditoria de rastreamento.', detalhes: err.message }));
  }
}

module.exports = { handleRastrear };
