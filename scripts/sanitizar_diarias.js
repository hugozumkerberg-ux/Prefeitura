/**
 * ==============================================================================
 * SCRIPT FORENSE DE SANITIZAÇÃO DE DIÁRIAS — PORTAL DA TRANSPARÊNCIA DE ARINOS/MG
 * ==============================================================================
 * 1. Higieniza caracteres especiais e mojibake (UTF-8 corrompido).
 * 2. Desacopla e identifica com precisão:
 *    - Destino geográfico oficial da viagem (Cidade - UF).
 *    - Motivo / Justificativa detalhada do interesse público.
 * 3. Regenera o catálogo master oficial: dados/viagens/arinos_viagens_master.json.
 * 4. Gera dados/diarias_master.json para busca ultra-rápida na API REST.
 * 5. Atualiza o dump MySQL oficial database/arinos_transparencia_mysql.sql.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const crypto = require('node:crypto');

const BASE_DIR = path.resolve(__dirname, '..');
const DUMP_FILE = path.join(BASE_DIR, 'database', 'arinos_transparencia_mysql.sql');
const DUMP_TMP = path.join(BASE_DIR, 'database', 'arinos_transparencia_mysql.tmp.sql');
const VIAGENS_MASTER_FILE = path.join(BASE_DIR, 'dados', 'viagens', 'arinos_viagens_master.json');
const DIARIAS_MASTER_FILE = path.join(BASE_DIR, 'dados', 'diarias_master.json');

// Mapeamento abrangente de Mojibake UTF-8 / Windows-1252
function limparMojibake(texto) {
  if (!texto) return '';
  return texto
    // Correção de double-encoded UTF-8 bytes específicos
    .replace(/Á\x81/g, 'Á')
    .replace(/Á\x82/g, 'Â')
    .replace(/Á\x83/g, 'Ã')
    .replace(/Á\x87/g, 'Ç')
    .replace(/Á\x89/g, 'É')
    .replace(/Á\x8A/g, 'Ê')
    .replace(/Á\x8D/g, 'Í')
    .replace(/Á\x93/g, 'Ó')
    .replace(/Á\x94/g, 'Ô')
    .replace(/Á\x95/g, 'Õ')
    .replace(/Á\x9A/g, 'Ú')
    .replace(/Á£/g, 'Ã')
    .replace(/Á¡/g, 'Á')
    .replace(/ÁŠ/g, 'Ê')
    .replace(/Áƒ/g, 'Ã')
    .replace(/DiÃ¡rias/g, 'Diárias')
    .replace(/Di\?rias/g, 'Diárias')
    .replace(/DIÁ\s*RIA/g, 'DIÁRIA')
    .replace(/SecretÃ¡rios/g, 'Secretários')
    .replace(/Secret\?rios/g, 'Secretários')
    .replace(/CONCEI[ÃAÁ\x81\x87\?]+O\b/g, 'CONCEIÇÃO')
    .replace(/CONCEIÇAO/g, 'CONCEIÇÃO')
    .replace(/CONCEIÇÁO/g, 'CONCEIÇÃO')
    .replace(/ÇÁO/g, 'ÇÃO')
    .replace(/CONCEICAO/g, 'CONCEIÇÃO')
    .replace(/SEBASTIAO/g, 'SEBASTIÃO')
    .replace(/LBERAÃ‡ÃƒO/g, 'LIBERAÇÃO')
    .replace(/LIBERAÃ‡ÃƒO/g, 'LIBERAÇÃO')
    .replace(/LIBERACAO/g, 'LIBERAÇÃO')
    .replace(/SOLICITAÃ‡ÃƒO/g, 'SOLICITAÇÃO')
    .replace(/SOLICITACAO/g, 'SOLICITAÇÃO')
    .replace(/CAPACITAÃ‡ÃƒO/g, 'CAPACITAÇÃO')
    .replace(/CAPACITACAO/g, 'CAPACITAÇÃO')
    .replace(/PARTICIPAÃ‡ÃƒO/g, 'PARTICIPAÇÃO')
    .replace(/PARTICIPACAO/g, 'PARTICIPAÇÃO')
    .replace(/AQUISICAO/g, 'AQUISIÇÃO')
    .replace(/AQUISIÃ‡ÃƒO/g, 'AQUISIÇÃO')
    .replace(/DECORRENCIA/g, 'DECORRÊNCIA')
    .replace(/DECORRÃŠNCIA/g, 'DECORRÊNCIA')
    .replace(/EMERGÁŠNCIA/g, 'EMERGÊNCIA')
    .replace(/EMERGÃŠNCIA/g, 'EMERGÊNCIA')
    .replace(/REVISÁƒO/g, 'REVISÃO')
    .replace(/REVISÃƒO/g, 'REVISÃO')
    .replace(/MUNICIPIO/g, 'MUNICÍPIO')
    .replace(/MUNICÃ\x8DPIO/g, 'MUNICÍPIO')
    .replace(/MINISTERIO/g, 'MINISTÉRIO')
    .replace(/MINISTÃ‰RIO/g, 'MINISTÉRIO')
    .replace(/PREGAO/g, 'PREGÃO')
    .replace(/PREGÃƒO/g, 'PREGÃO')
    .replace(/Ã‡/g, 'Ç')
    .replace(/Ãƒ/g, 'Ã')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ãª/g, 'ê')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrator de Destino de Alta Precisão (Evita falsos "CIDADE DE", etc.)
function extrairDestino(texto) {
  if (!texto) return 'Outros Destinos / Não Especificado';
  const limpo = limparMojibake(texto);
  const upper = limpo.toUpperCase();

  if (upper.includes('BELO HORIZONTE') || upper.includes('BH/MG') || upper.includes('B.HORIZONTE') || upper.includes('BH - MG')) return 'Belo Horizonte - MG';
  if (upper.includes('BRASILIA') || upper.includes('BRASÍLIA') || upper.includes('BSB') || upper.includes('DF')) return 'Brasília - DF';
  if (upper.includes('UNAI') || upper.includes('UNAÍ')) return 'Unaí - MG';
  if (upper.includes('MONTES CLAROS') || upper.includes('MOC')) return 'Montes Claros - MG';
  if (upper.includes('PARACATU')) return 'Paracatu - MG';
  if (upper.includes('PATOS DE MINAS')) return 'Patos de Minas - MG';
  if (upper.includes('JANUARIA') || upper.includes('JANUÁRIA')) return 'Januária - MG';
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
  if (upper.includes('UBERABA')) return 'Uberaba - MG';
  if (upper.includes('BARRETOS')) return 'Barretos - SP';
  if (upper.includes('MANGA')) return 'Manga - MG';
  if (upper.includes('ARAXA') || upper.includes('ARAXÁ')) return 'Araxá - MG';
  if (upper.includes('GOIANIA') || upper.includes('GOIÂNIA')) return 'Goiânia - GO';
  if (upper.includes('VAZANTE')) return 'Vazante - MG';
  if (upper.includes('FORMOSA')) return 'Formosa - GO';
  if (upper.includes('JOAO PINHEIRO') || upper.includes('JOÃO PINHEIRO')) return 'João Pinheiro - MG';
  if (upper.includes('PATROCINIO') || upper.includes('PATROCÍNIO')) return 'Patrocínio - MG';
  if (upper.includes('ARINOS') && (upper.includes('RURAL') || upper.includes('DISTRITO') || upper.includes('COMUNIDADE'))) return 'Zona Rural / Distritos de Arinos';
  if (upper.includes('ASSENTAMENTO') || upper.includes('SAGRADA FAMILIA') || upper.includes('VILA BOA') || upper.includes('MORRO AGUDO')) return 'Zona Rural / Distritos de Arinos';

  // Fallback regex refinado (desconsidera "CIDADE DE", "MUNICÍPIO DE", etc.)
  const regex = /VIAGEM\s+(?:A|PARA|ATÉ|ATE)\s+(?:A\s+)?(?:CIDADE\s+DE\s+|MUNICÍPIO\s+DE\s+|MUNICIPIO\s+DE\s+)?([A-ZÀ-Ú\s\-\/]{3,25})(?:,|\.|\s+DIA|\s+NO\s+DIA|\s+CONF|\s+EM|\s+PARTICIPAR|\s+-|\s+A\s+FIM)/i;
  const match = upper.match(regex);
  if (match && match[1]) {
    let raw = match[1].trim();
    raw = raw.replace(/^(CIDADE\s+DE|MUNICIPIO\s+DE|MUNICÍPIO\s+DE|NO|NA|DO|DA|A)\b\s*/i, '').replace(/[\,\.]/g, '').trim();
    if (raw === 'CIDADE DE' || raw.startsWith('CIDADE DE') || raw === 'MUNICIPIO DE' || raw === 'MUNICÍPIO DE' || raw.length < 3) {
      return 'Outros Destinos / Não Especificado';
    }
    if (raw.length > 3 && !raw.includes('PELA') && !raw.includes('DESPESA') && !raw.includes('SOLICITA') && !raw.includes('SERVIDOR') && !raw.includes('PACIENTE')) {
      if (raw.endsWith('-MG') || raw.endsWith('-DF') || raw.endsWith('-GO') || raw.endsWith('-SP')) {
        return raw;
      }
      return raw + ' - MG';
    }
  }

  return 'Outros Destinos / Não Especificado';
}

// Extrator do Motivo / Justificativa Limpa
function extrairMotivo(texto, destino) {
  if (!texto) return `Viagem oficial a ${destino} a serviço do município.`;
  let limpo = limparMojibake(texto);

  // Remover preâmbulo burocrático repetitivo
  limpo = limpo.replace(/^PELA DESPESA EMPENHADA\s*,?\s*/i, '');
  limpo = limpo.replace(/^VALOR QUE SE EMPENHA\s*,?\s*/i, '');
  limpo = limpo.replace(/^REF\.?\s*(REEMBOLSO\s*DE\s*)?(SOLICITAÇÃO|LIBERAÇÃO|LBERAÇÃO)?\s*(DE)?\s*DIÁRIA(S)?\s*(DE\s*VIAGEM)?\s*(AO|A|AOS|AS)?\s*(SERVIDOR(A)?|MOTORISTA|ENFERMEIRA|TEC\.?\s*ENFERMAGEM)?\s*(\([^\)]+\))?,?\s*/i, '');
  limpo = limpo.replace(/^EM\s*VIAGEM\s*A\s*(A\s*)?(CIDADE\s*DE)?\s*([A-ZÀ-Ú\s\-\/]+)?,?\s*(NO\s*DIA|DIA|DIAS)?\s*[\d\.\/\sEa-z\-]*,?\s*/i, '');
  limpo = limpo.replace(/^PARA\s*DESPESAS\s*DE\s*VIAGEM\s*/i, '');
  limpo = limpo.replace(/^A\s+([A-ZÀ-Ú\s\-\/]+?),\s*(DIA|DIAS)\s*[\d\.\/\sEa-z\-]+,\s*/i, '');
  limpo = limpo.replace(/^A\s+([A-ZÀ-Ú\s\-\/]+?)\s*-\s*(DIA|DIAS)\s*[\d\.\/\sEa-z\-]+,\s*/i, '');
  limpo = limpo.replace(/^A\s*,\s*CONF\.\s*PROCESSO.*/i, 'Despesas de viagem institucional / Processo administrativo');

  // Ajustar pontuação
  limpo = limpo.trim();
  while (limpo.startsWith(',') || limpo.startsWith('.') || limpo.startsWith('-')) {
    limpo = limpo.slice(1).trim();
  }

  // Se o motivo resultante for muito curto ou vago
  if (limpo.length < 5 || limpo.toUpperCase() === 'CONF. PROCESSO' || limpo.toUpperCase() === 'CONF. SOLICITAÇÃO.') {
    limpo = `Viagem oficial a ${destino} para cumprimento de atividades do cargo.`;
  } else {
    // Colocar em formato Sentença (Primeira letra maiúscula, restante natural)
    limpo = limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }

  return limpo;
}

// Parser de linha SQL de INSERT
function parseSqlLine(line) {
  // Exemplo de linha: (1, 'hash', 'entidade', 236, 2013, 1, '472', 'DiÃ¡rias...', 'ROBERTO SALES', '', 'DESTINO...', 'MOTIVO...', 390, '31/01/2013', 'hash_raw', 'data'),
  const trimmed = line.trim();
  if (!trimmed.startsWith('(')) return null;

  // Usa regex para separar valores entre parênteses respeitando strings escapadas
  const endIdx = trimmed.lastIndexOf(')');
  if (endIdx === -1) return null;

  const content = trimmed.substring(1, endIdx);
  // Split com máquina de estados para respeitar aspas
  const tokens = [];
  let cur = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (escape) {
      cur += ch;
      escape = false;
    } else if (ch === '\\') {
      cur += ch;
      escape = true;
    } else if (ch === "'") {
      inString = !inString;
      cur += ch;
    } else if (ch === ',' && !inString) {
      tokens.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) tokens.push(cur.trim());

  if (tokens.length < 16) return null;

  const unquote = (val) => {
    if (val === 'NULL') return null;
    if (val.startsWith("'") && val.endsWith("'")) {
      return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }
    return val;
  };

  return {
    id: Number(tokens[0]),
    hash_registro: unquote(tokens[1]),
    entidade: unquote(tokens[2]),
    idorg: Number(tokens[3]),
    ano: Number(tokens[4]),
    mes: Number(tokens[5]),
    nr_empenho: unquote(tokens[6]),
    tipo_diaria: unquote(tokens[7]),
    servidor: unquote(tokens[8]),
    cargo: unquote(tokens[9]),
    destino: unquote(tokens[10]),
    motivo: unquote(tokens[11]),
    valor: Number(tokens[12]),
    data_viagem: unquote(tokens[13]),
    hash_arquivo_raw: unquote(tokens[14]),
    coletado_em: unquote(tokens[15])
  };
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${str}'`;
}

async function processarSanitizacao() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        SANITIZAÇÃO FORENSE DE DIÁRIAS & RECONCILIAÇÃO DE DESTINOS / MOTIVOS  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  if (!fs.existsSync(DUMP_FILE)) {
    console.error('❌ Arquivo MySQL de dump não encontrado:', DUMP_FILE);
    process.exit(1);
  }

  console.log('1. Lendo dump MySQL e filtrando tabela de diárias...');
  const inStream = fs.createReadStream(DUMP_FILE, { encoding: 'utf-8' });
  const outStream = fs.createWriteStream(DUMP_TMP, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: inStream, crlfDelay: Infinity });

  let inDiarias = false;
  let totalProcessadas = 0;
  const todasDiarias = [];

  // Estatísticas agregadas
  let totalGasto = 0;
  const porAno = {};
  const porTipo = {};
  const porViajante = {};
  const porDestino = {};
  const ultimasViagens = [];

  for await (const line of rl) {
    if (line.includes('-- Dados da tabela: diarias')) {
      inDiarias = true;
      outStream.write(line + '\n');
      continue;
    }

    if (inDiarias && line.includes('-- Dados da tabela:')) {
      inDiarias = false;
      outStream.write(line + '\n');
      continue;
    }

    if (!inDiarias) {
      outStream.write(line + '\n');
      continue;
    }

    // Se estamos dentro do bloco de diárias
    if (line.trim().startsWith('(')) {
      const parsed = parseSqlLine(line);
      if (parsed) {
        totalProcessadas++;

        // 1. Sanitizar tipo de diária
        let tipoLimpo = limparMojibake(parsed.tipo_diaria || 'Diárias de Servidores');
        if (tipoLimpo.toLowerCase().includes('prefeito')) tipoLimpo = 'Diárias de Prefeito';
        else if (tipoLimpo.toLowerCase().includes('secret')) tipoLimpo = 'Diárias de Secretários';
        else if (tipoLimpo.toLowerCase().includes('vereador')) tipoLimpo = 'Diárias de Vereadores';
        else tipoLimpo = 'Diárias de Servidores';

        // 2. Sanitizar servidor
        const servidorLimpo = limparMojibake(parsed.servidor || 'NÃO INFORMADO').toUpperCase();

        // 3. Sanitizar destino e motivo
        const textoOriginal = parsed.motivo || parsed.destino || '';
        const destinoLimpo = extrairDestino(textoOriginal);
        const motivoLimpo = extrairMotivo(textoOriginal, destinoLimpo);

        parsed.tipo_diaria = tipoLimpo;
        parsed.servidor = servidorLimpo;
        parsed.destino = destinoLimpo;
        parsed.motivo = motivoLimpo;

        const val = Number(parsed.valor) || 0;
        totalGasto += val;

        // Agregar estatísticas
        const ano = parsed.ano || 2026;
        if (!porAno[ano]) porAno[ano] = { ano, viagens: 0, total: 0 };
        porAno[ano].viagens++;
        porAno[ano].total += val;

        if (!porTipo[tipoLimpo]) porTipo[tipoLimpo] = { tipo: tipoLimpo, viagens: 0, total: 0 };
        porTipo[tipoLimpo].viagens++;
        porTipo[tipoLimpo].total += val;

        if (!porViajante[servidorLimpo]) {
          porViajante[servidorLimpo] = {
            servidor: servidorLimpo,
            tipo_principal: tipoLimpo,
            viagens: 0,
            total: 0,
            destinos: {},
            anos: {}
          };
        }
        porViajante[servidorLimpo].viagens++;
        porViajante[servidorLimpo].total += val;
        if (!porViajante[servidorLimpo].anos[ano]) porViajante[servidorLimpo].anos[ano] = 0;
        porViajante[servidorLimpo].anos[ano] += val;
        if (!porViajante[servidorLimpo].destinos[destinoLimpo]) porViajante[servidorLimpo].destinos[destinoLimpo] = 0;
        porViajante[servidorLimpo].destinos[destinoLimpo]++;

        if (!porDestino[destinoLimpo]) porDestino[destinoLimpo] = { destino: destinoLimpo, viagens: 0, total: 0 };
        porDestino[destinoLimpo].viagens++;
        porDestino[destinoLimpo].total += val;

        if (ultimasViagens.length < 100) {
          ultimasViagens.push({
            id: parsed.id,
            ano: parsed.ano,
            mes: parsed.mes,
            data_viagem: parsed.data_viagem,
            nr_empenho: parsed.nr_empenho,
            servidor: servidorLimpo,
            tipo: tipoLimpo,
            destino_cidade: destinoLimpo,
            motivo_limpo: motivoLimpo.slice(0, 160),
            valor: val,
            hash_registro: parsed.hash_registro
          });
        }

        // Armazenar versão enxuta para diárias master
        todasDiarias.push({
          id: parsed.id,
          ano: parsed.ano,
          mes: parsed.mes,
          data_viagem: parsed.data_viagem,
          nr_empenho: parsed.nr_empenho,
          tipo_diaria: tipoLimpo,
          servidor: servidorLimpo,
          cargo: parsed.cargo || '',
          destino: destinoLimpo,
          motivo: motivoLimpo,
          valor: val,
          hash_registro: parsed.hash_registro
        });

        // Montar linha SQL reescrita
        const isLastInBatch = line.trim().endsWith(';');
        const newLine = `(${parsed.id}, ${escapeSql(parsed.hash_registro)}, ${escapeSql(parsed.entidade)}, ${parsed.idorg}, ${parsed.ano}, ${parsed.mes}, ${escapeSql(parsed.nr_empenho)}, ${escapeSql(tipoLimpo)}, ${escapeSql(servidorLimpo)}, ${escapeSql(parsed.cargo)}, ${escapeSql(destinoLimpo)}, ${escapeSql(motivoLimpo)}, ${parsed.valor}, ${escapeSql(parsed.data_viagem)}, ${escapeSql(parsed.hash_arquivo_raw)}, ${escapeSql(parsed.coletado_em)})${isLastInBatch ? ';' : ','}\n`;
        outStream.write(newLine);
        continue;
      }
    }

    outStream.write(line + '\n');
  }

  outStream.end();
  await new Promise(resolve => outStream.on('finish', resolve));

  console.log(`2. Total de diárias sanitizadas com sucesso: ${totalProcessadas.toLocaleString('pt-BR')}`);

  // Substitui arquivo MySQL
  fs.renameSync(DUMP_TMP, DUMP_FILE);
  console.log('3. Dump MySQL database/arinos_transparencia_mysql.sql atualizado com sucesso.');

  // Formatar Top Viajantes
  const topViajantesList = Object.values(porViajante)
    .sort((a, b) => b.total - a.total)
    .slice(0, 50)
    .map(v => {
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

  const destinosList = Object.values(porDestino).sort((a, b) => b.total - a.total);
  const anosList = Object.values(porAno).sort((a, b) => b.ano - a.ano);
  const tiposList = Object.values(porTipo).sort((a, b) => b.total - a.total);

  const masterViagens = {
    municipio: 'Arinos',
    uf: 'MG',
    fonte_oficial: 'Portal da Transparência de Arinos / SIAP ADPMNET',
    gerado_em: new Date().toISOString(),
    resumo_geral: {
      total_viagens: totalProcessadas,
      total_gasto: totalGasto,
      ticket_medio: totalGasto / (totalProcessadas || 1),
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
  masterViagens.hash_forense_sha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');

  fs.writeFileSync(VIAGENS_MASTER_FILE, JSON.stringify(masterViagens, null, 2), 'utf-8');
  console.log('4. Catálogo Master de Viagens gravado em:', VIAGENS_MASTER_FILE);

  // Salvar diárias completas para API
  fs.writeFileSync(DIARIAS_MASTER_FILE, JSON.stringify(todasDiarias), 'utf-8');
  console.log(`5. Banco Master de Diárias (dados/diarias_master.json) gravado com ${todasDiarias.length.toLocaleString('pt-BR')} registros.`);

  console.log(`\n✔ Destinos limpos destacados:`);
  destinosList.slice(0, 10).forEach((d, idx) => {
    console.log(`   ${idx + 1}. ${d.destino} (${d.viagens.toLocaleString('pt-BR')} viagens • R$ ${d.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
  });

  console.log(`\n✅ Sanitização de Diárias Concluída com Perfeição!\n`);
}

processarSanitizacao().catch(err => {
  console.error('❌ Erro na sanitização:', err);
  process.exit(1);
});
