/**
 * ==============================================================================
 * Módulo de Inteligência Política e Cruzamento TSE / Câmara — V3
 * Identificação canônica de pessoas físicas, ID unificado, passado político,
 * status de vitória eleitoral (Eleito vs Não Eleito) e vínculo de foto única.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { normalizarNome } = require('./padronizacao');

// Cache em memória
let indicePessoasPorNome = null;
let indicePessoasPorId = null;
let proximoIdSequencial = 3000;

/**
 * Determina com precisão pericial se a situação eleitoral representa vitória no pleito
 * Cuidado crítico: 'não eleito' contém o termo 'eleito', portanto deve ser estritamente filtrado.
 */
function ehEleito(resultadoStr) {
  if (!resultadoStr) return false;
  const s = String(resultadoStr)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    s.includes('nao eleito') ||
    s.includes('suplente') ||
    s.includes('indeferido') ||
    s.includes('cancelado') ||
    s.includes('renuncia') ||
    s.includes('concorrendo')
  ) {
    return false;
  }
  return s.includes('eleito');
}

function resolverCaminhoArquivo(nomeRelativo) {
  const caminhosPossiveis = [
    path.resolve(__dirname, '../../..', nomeRelativo),
    path.resolve(__dirname, '../../../portal_transparencia_arinos', nomeRelativo),
    path.resolve(__dirname, '../../', nomeRelativo),
    path.resolve(process.cwd(), nomeRelativo),
    path.resolve(process.cwd(), 'portal_transparencia_arinos', nomeRelativo)
  ];

  for (const c of caminhosPossiveis) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

function inicializarBasePoliticos() {
  if (indicePessoasPorNome && indicePessoasPorId) {
    return;
  }

  indicePessoasPorNome = new Map();
  indicePessoasPorId = new Map();

  // 1. Carregar base de Pessoas Unificadas Master
  const caminhoPessoas = resolverCaminhoArquivo('dados/pessoas_unificadas_master.json');
  let pessoasMaster = [];
  if (caminhoPessoas) {
    try {
      pessoasMaster = JSON.parse(fs.readFileSync(caminhoPessoas, 'utf8'));
    } catch (e) {
      console.error('Aviso: Erro ao carregar pessoas_unificadas_master.json', e.message);
    }
  }

  // 2. Carregar Eleições Master (TSE 2024 e 2020)
  const caminhoEleicoes = resolverCaminhoArquivo('dados/eleicoes/eleicoes_master.json');
  let candidatosEleicoes = [];
  if (caminhoEleicoes) {
    try {
      const elData = JSON.parse(fs.readFileSync(caminhoEleicoes, 'utf8'));
      candidatosEleicoes = elData.candidatos || [];
    } catch (e) {
      console.error('Aviso: Erro ao carregar eleicoes_master.json', e.message);
    }
  }

  // 3. Carregar TSE Completos (Prefeitos, Vices, Vereadores com bens)
  const caminhoTSE = resolverCaminhoArquivo('dados_tse_completos_arinos.json');
  let tseCompletos = [];
  if (caminhoTSE) {
    try {
      tseCompletos = JSON.parse(fs.readFileSync(caminhoTSE, 'utf8'));
    } catch (e) {
      console.error('Aviso: Erro ao carregar dados_tse_completos_arinos.json', e.message);
    }
  }

  // 4. Carregar Câmara Master (Parlamentares, Vereadores e Projetos)
  const caminhoCamara = resolverCaminhoArquivo('dados/camara/arinos_camara_master.json');
  let parlamentaresCamara = [];
  if (caminhoCamara) {
    try {
      parlamentaresCamara = JSON.parse(fs.readFileSync(caminhoCamara, 'utf8'));
    } catch (e) {
      console.error('Aviso: Erro ao carregar arinos_camara_master.json', e.message);
    }
  }

  let maiorId = 0;

  // Registrar todas as pessoas do pessoas_unificadas_master.json
  pessoasMaster.forEach(p => {
    const id = parseInt(p.id, 10) || ++maiorId;
    if (id > maiorId) maiorId = id;

    const norm = normalizarNome(p.nome_canonic || p.nome_exibicao);
    const temPerfilCandidato = p.perfil_tipo && p.perfil_tipo.toLowerCase().includes('candidato');
    const venceuMandato = Boolean((p.is_prefeito === 1 || p.is_vereador === 1) && !temPerfilCandidato);

    const pessoaObj = {
      pessoa_id: id,
      nome_canonic: p.nome_canonic || norm,
      nome_exibicao: p.nome_exibicao || p.nome_canonic || norm,
      foto_url: p.foto_url || null,
      is_politico: p.is_politico ? 1 : 0,
      is_prefeito: p.is_prefeito ? 1 : 0,
      is_vereador: p.is_vereador ? 1 : 0,
      is_candidato: p.is_candidato ? 1 : 0,
      perfil_tipo: p.perfil_tipo || null,
      partido_politico: p.partido_politico || null,
      bens_declarados_tse: p.bens_declarados_tse || 0,
      tem_passado_politico: Boolean(p.is_politico || p.is_candidato || p.is_vereador || p.is_prefeito),
      venceu: venceuMandato,
      status_eleicao: venceuMandato ? 'Eleito' : (p.is_candidato ? 'Não Eleito' : null),
      cargo_politico: p.is_prefeito ? 'Prefeito' : (p.is_vereador ? 'Vereador' : null),
      historico_disputas: [],
      mandatos_camara: []
    };

    indicePessoasPorNome.set(norm, pessoaObj);
    indicePessoasPorId.set(id, pessoaObj);
  });

  proximoIdSequencial = maiorId + 1;

  // Enriquecer com dados de Candidatos do Eleições Master
  candidatosEleicoes.forEach(cand => {
    const norm = normalizarNome(cand.nome_completo || cand.nome_urna);
    let pessoa = indicePessoasPorNome.get(norm);

    if (!pessoa) {
      const id = proximoIdSequencial++;
      pessoa = {
        pessoa_id: id,
        nome_canonic: cand.nome_completo,
        nome_exibicao: cand.nome_completo,
        foto_url: null,
        is_politico: 1,
        is_prefeito: cand.cargo === 'Prefeito' ? 1 : 0,
        is_vereador: cand.cargo === 'Vereador' ? 1 : 0,
        is_candidato: 1,
        perfil_tipo: cand.cargo,
        partido_politico: cand.partido_sigla,
        bens_declarados_tse: cand.total_bens || 0,
        tem_passado_politico: true,
        venceu: false,
        status_eleicao: cand.resultado,
        cargo_politico: cand.cargo,
        historico_disputas: [],
        mandatos_camara: []
      };
      indicePessoasPorNome.set(norm, pessoa);
      indicePessoasPorId.set(id, pessoa);
    }

    // Regra da Foto Única: se ainda não tiver foto, vincula exatamente uma foto oficial
    if (!pessoa.foto_url && cand.foto_local) {
      pessoa.foto_url = cand.foto_local;
    }

    // Identificar com precisão vitória eleitoral
    const eleito = ehEleito(cand.resultado);
    if (eleito) {
      pessoa.venceu = true;
      pessoa.status_eleicao = cand.resultado || 'Eleito';
      if (cand.cargo === 'Prefeito') pessoa.is_prefeito = 1;
      if (cand.cargo === 'Vereador') pessoa.is_vereador = 1;
    } else if (!pessoa.venceu) {
      pessoa.status_eleicao = cand.resultado || 'Não Eleito';
    }

    pessoa.tem_passado_politico = true;
    pessoa.is_politico = 1;
    pessoa.is_candidato = 1;
    if (cand.cargo && !pessoa.cargo_politico) {
      pessoa.cargo_politico = cand.cargo;
    }
    if (cand.partido_sigla && !pessoa.partido_politico) {
      pessoa.partido_politico = cand.partido_sigla;
    }
    if (cand.total_bens && cand.total_bens > (pessoa.bens_declarados_tse || 0)) {
      pessoa.bens_declarados_tse = cand.total_bens;
    }

    pessoa.historico_disputas.push({
      ano: cand.ano,
      cargo: cand.cargo,
      partido: cand.partido_sigla,
      numero: cand.numero,
      nome_urna: cand.nome_urna,
      resultado: cand.resultado,
      votos: cand.votos,
      percentual: cand.percentual,
      eleito: eleito,
      coligacao: cand.coligacao,
      bens: cand.total_bens
    });
  });

  // Enriquecer com dados de TSE Completos
  tseCompletos.forEach(tse => {
    const norm = normalizarNome(tse.nomeCompleto || tse.nomeUrna);
    let pessoa = indicePessoasPorNome.get(norm);
    if (!pessoa) {
      const id = proximoIdSequencial++;
      pessoa = {
        pessoa_id: id,
        nome_canonic: tse.nomeCompleto,
        nome_exibicao: tse.nomeCompleto,
        foto_url: null,
        is_politico: 1,
        is_prefeito: tse.cargo === 'Prefeito' ? 1 : 0,
        is_vereador: tse.cargo === 'Vereador' ? 1 : 0,
        is_candidato: 1,
        perfil_tipo: tse.cargo,
        partido_politico: tse.partido,
        bens_declarados_tse: tse.totalBensDeclarados || 0,
        tem_passado_politico: true,
        venceu: false,
        status_eleicao: tse.resultadoEleicao,
        cargo_politico: tse.cargo,
        historico_disputas: [],
        mandatos_camara: []
      };
      indicePessoasPorNome.set(norm, pessoa);
      indicePessoasPorId.set(id, pessoa);
    }

    const eleito = ehEleito(tse.resultadoEleicao);
    if (eleito) {
      pessoa.venceu = true;
      pessoa.status_eleicao = tse.resultadoEleicao || 'Eleito';
      if (tse.cargo === 'Prefeito') pessoa.is_prefeito = 1;
      if (tse.cargo === 'Vereador') pessoa.is_vereador = 1;
    }

    pessoa.tem_passado_politico = true;
    pessoa.is_politico = 1;
    pessoa.is_candidato = 1;
    if (tse.cargo && !pessoa.cargo_politico) pessoa.cargo_politico = tse.cargo;
    if (tse.partido && !pessoa.partido_politico) pessoa.partido_politico = tse.partido;
    if (tse.totalBensDeclarados && tse.totalBensDeclarados > (pessoa.bens_declarados_tse || 0)) {
      pessoa.bens_declarados_tse = tse.totalBensDeclarados;
    }

    const jaTem = pessoa.historico_disputas.some(h => h.ano === tse.anoEleicao && h.cargo === tse.cargo);
    if (!jaTem) {
      pessoa.historico_disputas.push({
        ano: tse.anoEleicao,
        cargo: tse.cargo,
        partido: tse.partido,
        numero: tse.numero,
        nome_urna: tse.nomeUrna,
        resultado: tse.resultadoEleicao,
        eleito: eleito,
        coligacao: tse.coligacao,
        bens: tse.totalBensDeclarados
      });
    }
  });

  // Enriquecer com dados dos Vereadores / Parlamentares da Câmara
  parlamentaresCamara.forEach(parl => {
    const norm = normalizarNome(parl.nome_completo || parl.nome_parlamentar);
    let pessoa = indicePessoasPorNome.get(norm);

    if (!pessoa) {
      const id = proximoIdSequencial++;
      pessoa = {
        pessoa_id: id,
        nome_canonic: parl.nome_completo,
        nome_exibicao: parl.nome_completo,
        foto_url: parl.fotografia || null,
        is_politico: 1,
        is_prefeito: 0,
        is_vereador: 1,
        is_candidato: 0,
        perfil_tipo: 'Vereador',
        partido_politico: null,
        bens_declarados_tse: 0,
        tem_passado_politico: true,
        venceu: true,
        status_eleicao: 'Eleito',
        cargo_politico: 'Vereador',
        historico_disputas: [],
        mandatos_camara: []
      };
      indicePessoasPorNome.set(norm, pessoa);
      indicePessoasPorId.set(id, pessoa);
    } else {
      pessoa.tem_passado_politico = true;
      pessoa.is_politico = 1;
      pessoa.is_vereador = 1;
      pessoa.venceu = true;
      pessoa.status_eleicao = 'Eleito';
      pessoa.cargo_politico = 'Vereador';

      // Regra de Foto Única: se ainda não tiver foto, vincula a fotografia da câmara
      if (!pessoa.foto_url && parl.fotografia) {
        pessoa.foto_url = parl.fotografia;
      }
    }

    if (Array.isArray(parl.mandatos) && parl.mandatos.length > 0) {
      pessoa.mandatos_camara = parl.mandatos;
    }
  });

  // Gerar TAGs canônicas e padronizadas para cada pessoa
  for (const pessoa of indicePessoasPorNome.values()) {
    if (pessoa.tem_passado_politico) {
      const cargo = pessoa.cargo_politico || (pessoa.is_prefeito ? 'Prefeito' : (pessoa.is_vereador ? 'Vereador' : 'Candidato'));
      const partido = pessoa.partido_politico ? ` • ${pessoa.partido_politico}` : '';

      // Obter a eleição mais recente
      let anoDisputa = '';
      if (pessoa.historico_disputas.length > 0) {
        pessoa.historico_disputas.sort((a, b) => (b.ano || 0) - (a.ano || 0));
        anoDisputa = pessoa.historico_disputas[0].ano ? ` ${pessoa.historico_disputas[0].ano}` : '';
      }

      if (pessoa.venceu) {
        const disputaVencedora = pessoa.historico_disputas.find(d => d.eleito);
        const anoVitoria = disputaVencedora ? ` ${disputaVencedora.ano}` : (anoDisputa || '');
        const partidoVitoria = (disputaVencedora && disputaVencedora.partido) ? ` • ${disputaVencedora.partido}` : partido;
        pessoa.tag_texto = `🏛️ Cargo Político: ${cargo} (Eleito${anoVitoria}${partidoVitoria})`;
        pessoa.tag_tipo = 'eleito';
        pessoa.tag_badge_html = `<span class="badge-politico badge-eleito" title="Mandato Político Oficial Conquistado">${pessoa.tag_texto}</span>`;
      } else {
        const status = pessoa.status_eleicao || 'Não Eleito';
        pessoa.tag_texto = `🗳️ Passado Político: ${cargo} (${status}${anoDisputa}${partido})`;
        pessoa.tag_tipo = 'nao_eleito';
        pessoa.tag_badge_html = `<span class="badge-politico badge-nao-eleito" title="Registro Eleitoral Oficial TSE">${pessoa.tag_texto}</span>`;
      }
    }
  }
}

/**
 * Consulta as informações políticas, identificador canônico e foto de uma pessoa
 * @param {string} nome - Nome do servidor ou munícipe
 * @returns {object} Dados enriquecidos da pessoa
 */
function obterDadosPoliticos(nome) {
  if (!indicePessoasPorNome) {
    inicializarBasePoliticos();
  }

  const norm = normalizarNome(nome);
  const info = indicePessoasPorNome.get(norm);

  if (info) {
    return {
      pessoa_id: info.pessoa_id,
      nome_canonic: info.nome_canonic,
      nome_exibicao: info.nome_exibicao,
      foto_url: info.foto_url || null,
      tem_passado_politico: Boolean(info.tem_passado_politico),
      venceu: Boolean(info.venceu),
      status_eleicao: info.status_eleicao || null,
      cargo_politico: info.cargo_politico || null,
      partido_politico: info.partido_politico || null,
      bens_declarados_tse: info.bens_declarados_tse || 0,
      tag_texto: info.tag_texto || null,
      tag_tipo: info.tag_tipo || null,
      tag_badge_html: info.tag_badge_html || null,
      is_politico: info.is_politico || 0,
      is_prefeito: info.is_prefeito || 0,
      is_vereador: info.is_vereador || 0,
      is_candidato: info.is_candidato || 0,
      historico_disputas: info.historico_disputas || [],
      mandatos_camara: info.mandatos_camara || []
    };
  }

  // Se não encontrada na base, gera identificador determinístico baseado no hash do nome
  let hashVal = 0;
  for (let i = 0; i < norm.length; i++) {
    hashVal = (hashVal * 31 + norm.charCodeAt(i)) >>> 0;
  }
  const idFallback = 5000 + (hashVal % 9000);

  return {
    pessoa_id: idFallback,
    nome_canonic: norm,
    nome_exibicao: nome,
    foto_url: null,
    tem_passado_politico: false,
    venceu: false,
    status_eleicao: null,
    cargo_politico: null,
    partido_politico: null,
    bens_declarados_tse: 0,
    tag_texto: null,
    tag_tipo: null,
    tag_badge_html: null,
    is_politico: 0,
    is_prefeito: 0,
    is_vereador: 0,
    is_candidato: 0,
    historico_disputas: [],
    mandatos_camara: []
  };
}

/**
 * Consulta pessoa por ID canônico
 * @param {number} id 
 */
function obterPessoaPorId(id) {
  if (!indicePessoasPorId) {
    inicializarBasePoliticos();
  }
  return indicePessoasPorId.get(parseInt(id, 10)) || null;
}

module.exports = {
  ehEleito,
  inicializarBasePoliticos,
  obterDadosPoliticos,
  obterPessoaPorId
};
