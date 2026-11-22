const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3');

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function testSearch(query) {
  const normQ = normalize(query);
  const terms = normQ.split(/\s+/).filter(Boolean);
  console.log(`\n================ BUSCA: "${query}" (termos: ${JSON.stringify(terms)}) ================`);

  const results = {
    servidores: [],
    empresas: [],
    contratos: [],
    diarias: [],
    politicos: [],
    turismo: []
  };

  // 1. Empresas & Sócios
  try {
    const empresas = db.prepare(`
      SELECT cnpj, razao_social, nome_fantasia, total_geral, possui_alerta_vinculo, alerta_detalhe 
      FROM empresas_contratadas
    `).all();
    const socios = db.prepare(`SELECT cnpj, nome_socio, qualificacao_socio, vinculo_politico_alerta FROM empresas_socios`).all();

    const empMap = new Map();
    empresas.forEach(e => empMap.set(e.cnpj, e));

    empresas.forEach(e => {
      const target = normalize(`${e.razao_social} ${e.nome_fantasia} ${e.cnpj}`);
      if (terms.every(t => target.includes(t))) {
        results.empresas.push({ ...e, tipo: 'EMPRESA' });
      }
    });

    socios.forEach(s => {
      const target = normalize(`${s.nome_socio} ${s.qualificacao_socio} ${s.vinculo_politico_alerta || ''}`);
      if (terms.every(t => target.includes(t))) {
        const emp = empMap.get(s.cnpj) || {};
        results.empresas.push({
          cnpj: s.cnpj,
          razao_social: emp.razao_social || 'Empresa Vinculada',
          nome_socio: s.nome_socio,
          alerta: s.vinculo_politico_alerta,
          tipo: 'SÓCIO'
        });
      }
    });
  } catch (e) { console.error('Err emp:', e.message); }

  // 2. Servidores / Contracheques
  try {
    const servidores = db.prepare(`
      SELECT nome, cargo, vinculo, MAX(total_proventos) as maior_salario, COUNT(*) as meses_folha
      FROM contracheques
      GROUP BY nome
    `).all();

    servidores.forEach(s => {
      const target = normalize(`${s.nome} ${s.cargo} ${s.vinculo}`);
      if (terms.every(t => target.includes(t))) {
        results.servidores.push(s);
      }
    });
  } catch (e) { console.error('Err serv:', e.message); }

  // 3. Contratos
  try {
    const contratos = db.prepare(`
      SELECT nr_contrato, credor, doc_credor, valor, objeto, dt_ini_vigencia
      FROM contratos
    `).all();

    contratos.forEach(c => {
      const target = normalize(`${c.nr_contrato} ${c.credor} ${c.doc_credor} ${c.objeto}`);
      if (terms.every(t => target.includes(t))) {
        results.contratos.push(c);
      }
    });
  } catch (e) { console.error('Err contratos:', e.message); }

  // 4. Diárias
  try {
    const diarias = db.prepare(`
      SELECT id, servidor, tipo_diaria, destino, motivo, valor, ano
      FROM diarias
      LIMIT 1000
    `).all();

    diarias.forEach(d => {
      const target = normalize(`${d.servidor} ${d.tipo_diaria} ${d.destino} ${d.motivo}`);
      if (terms.every(t => target.includes(t))) {
        results.diarias.push(d);
      }
    });
  } catch (e) { console.error('Err diarias:', e.message); }

  console.log(`Encontrados: ${results.empresas.length} empresas/sócios, ${results.servidores.length} servidores, ${results.contratos.length} contratos, ${results.diarias.length} diárias (amostra).`);
  if (results.empresas.length > 0) console.log('Top empresa/sócio:', results.empresas[0]);
  if (results.servidores.length > 0) console.log('Top servidor:', results.servidores[0]);
}

testSearch('saude');
testSearch('unai');
testSearch('soraya');
testSearch('roberto sales');
