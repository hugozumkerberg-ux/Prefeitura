const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(BASE_DIR, 'dados', 'arinos_transparencia_master.sqlite3');
const OUT_DIR = path.join(BASE_DIR, 'dados', 'viagens');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

function fixEncoding(str) {
  if (!str) return '';
  return str
    .replace(/DiÃ¡rias/g, 'Diárias')
    .replace(/SecretÃ¡rios/g, 'Secretários')
    .replace(/CONCEIÃ‡AO/g, 'CONCEIÇÃO')
    .replace(/CONCEIÃ‡ÃƒO/g, 'CONCEIÇÃO')
    .replace(/LBERAÃ‡ÃƒO/g, 'LIBERAÇÃO')
    .replace(/LIBERAÃ‡ÃƒO/g, 'LIBERAÇÃO')
    .replace(/CAPACITAÃ‡ÃƒO/g, 'CAPACITAÇÃO')
    .replace(/SOLICITAÃ‡ÃƒO/g, 'SOLICITAÇÃO')
    .replace(/PARTICIPAÃ‡ÃƒO/g, 'PARTICIPAÇÃO')
    .replace(/AQUISICAO/g, 'AQUISIÇÃO')
    .replace(/Ã‡/g, 'Ç')
    .replace(/Ãƒ/g, 'Ã')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã/g, 'Á')
    .trim();
}

function extractCity(text) {
  if (!text) return 'NÃO IDENTIFICADO';
  const upper = text.toUpperCase();

  if (upper.includes('BELO HORIZONTE') || upper.includes('BH/MG') || upper.includes('B.HORIZONTE')) return 'Belo Horizonte - MG';
  if (upper.includes('BRASILIA') || upper.includes('BRASÍLIA') || upper.includes('BSB') || upper.includes('DF')) return 'Brasília - DF';
  if (upper.includes('UNAI') || upper.includes('UNAÍ')) return 'Unaí - MG';
  if (upper.includes('MONTES CLAROS') || upper.includes('MOC')) return 'Montes Claros - MG';
  if (upper.includes('PARACATU')) return 'Paracatu - MG';
  if (upper.includes('JANUARIA') || upper.includes('JANUÁRIA')) return 'Januária - MG';
  if (upper.includes('GOIANIA') || upper.includes('GOIÂNIA')) return 'Goiânia - GO';
  if (upper.includes('PATOS DE MINAS')) return 'Patos de Minas - MG';
  if (upper.includes('BURITIS')) return 'Buritis - MG';
  if (upper.includes('BONFINOPOLIS') || upper.includes('BONFINÓPOLIS')) return 'Bonfinópolis de Minas - MG';
  if (upper.includes('URUCUIA')) return 'Urucuia - MG';
  if (upper.includes('CHAPADA GAUCHA') || upper.includes('CHAPADA GAÚCHA')) return 'Chapada Gaúcha - MG';
  if (upper.includes('PIRAPORA')) return 'Pirapora - MG';
  if (upper.includes('DIAMANTINA')) return 'Diamantina - MG';
  if (upper.includes('SAO FRANCISCO') || upper.includes('SÃO FRANCISCO')) return 'São Francisco - MG';
  if (upper.includes('CURVELO')) return 'Curvelo - MG';
  if (upper.includes('SETE LAGOAS')) return 'Sete Lagoas - MG';
  if (upper.includes('UBERLANDIA') || upper.includes('UBERLÂNDIA')) return 'Uberlândia - MG';
  if (upper.includes('ARAXA') || upper.includes('ARAXÁ')) return 'Araxá - MG';
  if (upper.includes('RURAL') || upper.includes('ZONA RURAL') || upper.includes('ASSENTAMENTO') || upper.includes('COMUNIDADE')) return 'Zona Rural / Distritos de Arinos';

  // Fallback regex for "VIAGEM A [CIDADE]"
  const match = upper.match(/VIAGEM\s+(?:A|PARA|ATE)\s+([A-Z\s\-\/]{3,20})(?:,|\.|\s+DIA|\s+CONF|\s+EM|\s+PARTICIPAR)/);
  if (match && match[1]) {
    const raw = match[1].trim();
    if (raw.length > 2 && !raw.includes('PELA') && !raw.includes('DESPESA')) {
      return raw;
    }
  }

  return 'Outros Destinos / Não Especificado';
}

console.log('[+] Lendo todas as diárias do banco de dados...');
const rows = db.prepare(`
  SELECT id, ano, mes, nr_empenho, tipo_diaria, servidor, cargo, destino, motivo, valor, data_viagem, hash_registro
  FROM diarias
  ORDER BY ano DESC, mes DESC
`).all();

console.log(`[+] Total de registros carregados: ${rows.length}`);

let totalGasto = 0;
const porAno = {};
const porTipo = {};
const porViajante = {};
const porDestino = {};
const ultimasViagens = [];

rows.forEach(r => {
  const val = typeof r.valor === 'number' ? r.valor : parseFloat(r.valor || 0);
  totalGasto += val;

  const ano = r.ano || 'Desconhecido';
  if (!porAno[ano]) {
    porAno[ano] = { ano, viagens: 0, total: 0 };
  }
  porAno[ano].viagens++;
  porAno[ano].total += val;

  let tipoNorm = fixEncoding(r.tipo_diaria || 'Outros Servidores');
  if (tipoNorm.toLowerCase().includes('prefeito')) tipoNorm = 'Diárias de Prefeito';
  else if (tipoNorm.toLowerCase().includes('secret')) tipoNorm = 'Diárias de Secretários';
  else if (tipoNorm.toLowerCase().includes('vereador')) tipoNorm = 'Diárias de Vereadores';
  else tipoNorm = 'Diárias de Servidores';

  if (!porTipo[tipoNorm]) {
    porTipo[tipoNorm] = { tipo: tipoNorm, viagens: 0, total: 0 };
  }
  porTipo[tipoNorm].viagens++;
  porTipo[tipoNorm].total += val;

  const servidorNorm = (r.servidor || 'NÃO INFORMADO').trim().toUpperCase();
  if (!porViajante[servidorNorm]) {
    porViajante[servidorNorm] = {
      servidor: servidorNorm,
      tipo_principal: tipoNorm,
      viagens: 0,
      total: 0,
      destinos: {},
      anos: {}
    };
  }
  porViajante[servidorNorm].viagens++;
  porViajante[servidorNorm].total += val;
  if (!porViajante[servidorNorm].anos[ano]) porViajante[servidorNorm].anos[ano] = 0;
  porViajante[servidorNorm].anos[ano] += val;

  const cidade = extractCity(r.motivo || r.destino);
  if (!porDestino[cidade]) {
    porDestino[cidade] = { destino: cidade, viagens: 0, total: 0 };
  }
  porDestino[cidade].viagens++;
  porDestino[cidade].total += val;

  if (!porViajante[servidorNorm].destinos[cidade]) porViajante[servidorNorm].destinos[cidade] = 0;
  porViajante[servidorNorm].destinos[cidade]++;

  if (ultimasViagens.length < 100) {
    ultimasViagens.push({
      id: r.id,
      ano: r.ano,
      mes: r.mes,
      data_viagem: r.data_viagem,
      nr_empenho: r.nr_empenho,
      servidor: servidorNorm,
      tipo: tipoNorm,
      destino_cidade: cidade,
      motivo_limpo: fixEncoding(r.motivo || r.destino || '').slice(0, 150),
      valor: val,
      hash_registro: r.hash_registro
    });
  }
});

// Format top travelers
const topViajantesList = Object.values(porViajante)
  .sort((a, b) => b.total - a.total)
  .slice(0, 50)
  .map(v => {
    // Find top destination for this person
    const topDest = Object.entries(v.destinos).sort((a, b) => b[1] - a[1])[0];
    return {
      servidor: v.servidor,
      tipo_principal: v.tipo_principal,
      viagens: v.viagens,
      total: v.total,
      ticket_medio: v.total / v.viagens,
      principal_destino: topDest ? topDest[0] : 'N/A',
      destinos_count: Object.keys(v.destinos).length,
      anos: v.anos
    };
  });

// Format destinations list
const destinosList = Object.values(porDestino)
  .sort((a, b) => b.total - a.total);

// Format annual evolution
const anosList = Object.values(porAno).sort((a, b) => b.ano - a.ano);

// Format per diem types
const tiposList = Object.values(porTipo).sort((a, b) => b.total - a.total);

const masterViagens = {
  municipio: 'Arinos',
  uf: 'MG',
  fonte_oficial: 'Portal da Transparência de Arinos / SIAP ADPMNET',
  gerado_em: new Date().toISOString(),
  resumo_geral: {
    total_viagens: rows.length,
    total_gasto: totalGasto,
    ticket_medio: totalGasto / rows.length,
    anos_cobertos: anosList.length,
    primeiro_ano: anosList[anosList.length - 1]?.ano,
    ultimo_ano: anosList[0]?.ano,
    total_viajantes_distintos: Object.keys(porViajante).length,
    total_destinos_catalogados: destinosList.length
  },
  evolucao_anual: anosList,
  por_categoria: tiposList,
  top_viajantes: topViajantesList,
  top_destinos: destinosList,
  ultimas_viagens: ultimasViagens
};

const jsonStr = JSON.stringify(masterViagens, null, 2);
const sha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');
masterViagens.hash_forense_sha256 = sha256;

const outPath = path.join(OUT_DIR, 'arinos_viagens_master.json');
fs.writeFileSync(outPath, JSON.stringify(masterViagens, null, 2), 'utf8');

console.log(`[+] Análise concluída com sucesso!`);
console.log(`[+] Total Gasto em Diárias: R$ ${totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
console.log(`[+] Total de Viagens: ${rows.length.toLocaleString('pt-BR')}`);
console.log(`[+] Arquivo gravado em: ${outPath}`);
console.log(`[+] Hash Forense SHA-256: ${sha256}`);
