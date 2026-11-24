/**
 * ==============================================================================
 * EXTRATOR E ATUALIZADOR DE DADOS HISTÓRICOS ANTERIORES A 2013 — ARINOS / MG
 * ==============================================================================
 * Finalidade: Resgatar dados anteriores a 2013 disponíveis nas fontes oficiais:
 * 1. Contratos Administrativos Históricos (SIAP: 1993 a 2012)
 * 2. Convênios Históricos do Município (SIAP: 1991 a 2012)
 * 3. Incorporação aos catálogos master e banco de dados local com integridade.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE_DIR = path.resolve(__dirname, '..');
const DADOS_DIR = path.join(BASE_DIR, 'dados');
const CONTRATOS_FILE = path.join(DADOS_DIR, 'contratos_master.json');
const CONVENIOS_FILE = path.join(DADOS_DIR, 'convenios_master.json');
const RESUMO_FILE = path.join(DADOS_DIR, 'resumo_geral.json');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  EXTRATOR DE DADOS HISTÓRICOS OFICIAIS (<2013) — ARINOS / MG      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

function sha256(content) {
  return crypto.createHash('sha256').update(String(content)).digest('hex');
}

function carregarJson(caminho, fallback = []) {
  if (fs.existsSync(caminho)) {
    try {
      return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    } catch (e) {
      console.warn(`Aviso ao ler ${caminho}:`, e.message);
    }
  }
  return fallback;
}

function salvarJson(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

async function coletarContratosSiap() {
  console.log('1. Conectando à API de Contratos do SIAP (redemunicipal)...');
  const baseUrl = 'https://contaspublicassiap.redemunicipal.com.br/pub/27/contrato';
  const contratosExistentes = carregarJson(CONTRATOS_FILE, []);
  
  // Mapeia existentes por idccs para deduplicação absoluta
  const mapaContratos = new Map();
  contratosExistentes.forEach(c => {
    const k = c.idccs ? `idccs_${c.idccs}` : `nr_${c.nr_contrato}_${c.ano}_${c.credor}`;
    mapaContratos.set(k, c);
  });

  let novosContratos = 0;
  let pagina = 0;
  let totalPaginas = 1;
  const pageSize = 100;

  try {
    const resInicial = await fetch(`${baseUrl}?page=0&size=${pageSize}`);
    if (!resInicial.ok) {
      throw new Error(`Falha ao conectar no SIAP Contratos: HTTP ${resInicial.status}`);
    }
    const dataInicial = await resInicial.json();
    totalPaginas = (dataInicial.page && dataInicial.page.totalPages) ? dataInicial.page.totalPages : 1;
    const totalRegistros = (dataInicial.page && dataInicial.page.totalElements) ? dataInicial.page.totalElements : 'indeterminado';
    console.log(`   Catálogo SIAP: ${totalRegistros} contratos no total (${totalPaginas} páginas de ${pageSize}).`);

    for (let p = 0; p < totalPaginas; p++) {
      process.stdout.write(`\r   Baixando contratos: página ${p + 1} de ${totalPaginas}...`);
      const res = await fetch(`${baseUrl}?page=${p}&size=${pageSize}`);
      if (!res.ok) continue;
      const data = await res.json();
      const lista = data.content || [];

      for (const item of lista) {
        const idccs = item.idccs;
        const nrContrato = item.nrcontrato || item.nrContrato;
        const k = idccs ? `idccs_${idccs}` : `nr_${nrContrato}_${item.doccrd || ''}`;

        let ano = null;
        if (item.dtassina) ano = parseInt(item.dtassina.slice(0, 4), 10);
        else if (item.dtinivig) ano = parseInt(item.dtinivig.slice(0, 4), 10);
        else if (item.dtprocesso) ano = parseInt(item.dtprocesso.slice(0, 4), 10);

        const registroNormalizado = {
          id: 0, // atribuído ao final
          hash_registro: sha256(`contrato_${idccs}_${nrContrato}`),
          idccs: idccs,
          codcrd: item.codcrd,
          credor: (item.dscrd || '').trim(),
          doc_credor: (item.doccrd || '').trim(),
          tipo_contrato: item.tipocontrato || 'Contrato Administrativo',
          nr_contrato: nrContrato,
          ano: ano,
          valor: Number(item.valor || 0),
          dt_ini_vigencia: item.dtinivig || null,
          dt_fim_vigencia: item.dtfimvig || null,
          dt_assinatura: item.dtassina || null,
          dt_publicacao: item.dtpublic || null,
          local_publicacao: (item.localpub || '').trim(),
          nr_licitacao: item.nrlicitac || null,
          objeto: (item.objeto || '').trim(),
          fundamento: (item.fundamento || '').trim(),
          nr_processo: item.nrprocesso || null,
          dt_processo: item.dtprocesso || null,
          fonte: 'SIAP / MG Cidades (API Oficial)'
        };

        if (!mapaContratos.has(k)) {
          novosContratos++;
        }
        mapaContratos.set(k, registroNormalizado);
      }
    }
    
    const listaFinal = Array.from(mapaContratos.values()).map((c, idx) => ({
      ...c,
      id: idx + 1
    }));

    console.log(`\n   ✔ Coleta de contratos finalizada! Total na base: ${listaFinal.length} (${novosContratos} novos incorporados).`);
    salvarJson(CONTRATOS_FILE, listaFinal);
  } catch (err) {
    console.error('\n   ❌ Erro durante coleta de contratos:', err.message);
  }
}

async function coletarConveniosSiap() {
  console.log('\n2. Conectando à API de Convênios do SIAP...');
  const baseUrl = 'https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio';
  const conveniosExistentes = carregarJson(CONVENIOS_FILE, []);
  const hashesExistentes = new Set(conveniosExistentes.map(c => c.hash_registro || `${c.idcvs}_${c.nr_convenio}`));

  let novosConvenios = 0;
  try {
    const res = await fetch(`${baseUrl}?page=0&size=200`);
    if (res.ok) {
      const data = await res.json();
      const lista = data.content || [];
      console.log(`   Catálogo SIAP: ${lista.length} convênios encontrados.`);

      for (const item of lista) {
        const idcvs = item.idcvs || item.id;
        const nrConvenio = item.nrconvenio || item.nrConvenio;
        const hash = sha256(`convenio_${idcvs}_${nrConvenio}`);

        if (!hashesExistentes.has(hash)) {
          let ano = null;
          if (item.dtassinatura) ano = parseInt(item.dtassinatura.slice(0, 4), 10);
          else if (item.dtinivig) ano = parseInt(item.dtinivig.slice(0, 4), 10);

          conveniosExistentes.push({
            id: conveniosExistentes.length + 1,
            hash_registro: hash,
            idcvs: idcvs,
            nr_convenio: nrConvenio,
            ano: ano,
            concedente: (item.dsconcedente || item.concedente || '').trim(),
            doc_concedente: (item.docconcedente || '').trim(),
            objeto: (item.objeto || '').trim(),
            valor_convenio: Number(item.vlconvenio || item.valor || 0),
            valor_contrapartida: Number(item.vlcontrapartida || 0),
            dt_inicio_vigencia: item.dtinivig || null,
            dt_fim_vigencia: item.dtfimvig || null,
            dt_assinatura: item.dtassinatura || null,
            fonte: 'SIAP / MG Cidades (API Oficial)'
          });

          hashesExistentes.add(hash);
          novosConvenios++;
        }
      }
      console.log(`   ✔ Coleta de convênios finalizada! ${novosConvenios} novos registros incorporados.`);
      salvarJson(CONVENIOS_FILE, conveniosExistentes);
    }
  } catch (err) {
    console.error('   ❌ Erro durante coleta de convênios:', err.message);
  }
}

function gerarRelatorioHistorico() {
  console.log('\n================================================================');
  console.log('RESUMO HISTÓRICO DA BASE ATUALIZADA (ANOS ANTERIORES A 2013):');
  console.log('================================================================');

  const contratos = carregarJson(CONTRATOS_FILE, []);
  const convenios = carregarJson(CONVENIOS_FILE, []);

  const anosContratos = {};
  let totalContratosPre2013 = 0;
  contratos.forEach(c => {
    const a = c.ano || (c.dt_assinatura ? parseInt(c.dt_assinatura.slice(0, 4), 10) : null) || (c.dt_processo ? parseInt(c.dt_processo.slice(0, 4), 10) : null);
    if (a && a < 2013) {
      anosContratos[a] = (anosContratos[a] || 0) + 1;
      totalContratosPre2013++;
    }
  });

  console.log(`Contratos < 2013 catalogados: ${totalContratosPre2013} registros`);
  Object.keys(anosContratos).sort((a,b)=>a-b).forEach(a => {
    console.log(`  • Ano ${a}: ${anosContratos[a]} contratos`);
  });

  const anosConvenios = {};
  let totalConveniosPre2013 = 0;
  convenios.forEach(c => {
    const a = c.ano || (c.dt_assinatura ? parseInt(c.dt_assinatura.slice(0, 4), 10) : null);
    if (a && a < 2013) {
      anosConvenios[a] = (anosConvenios[a] || 0) + 1;
      totalConveniosPre2013++;
    }
  });

  console.log(`\nConvênios < 2013 catalogados: ${totalConveniosPre2013} registros`);
  Object.keys(anosConvenios).sort((a,b)=>a-b).forEach(a => {
    console.log(`  • Ano ${a}: ${anosConvenios[a]} convênios`);
  });
  console.log('================================================================\n');
}

async function main() {
  await coletarContratosSiap();
  await coletarConveniosSiap();
  gerarRelatorioHistorico();
}

main().catch(console.error);
