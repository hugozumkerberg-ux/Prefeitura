const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('portal_transparencia_arinos/dados/arinos_transparencia_master.sqlite3');

console.time('Load Index');
function normalize(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Servidores Index
const servidores = db.prepare(`
  SELECT nome, cargo, vinculo, MAX(total_proventos) as maior_salario, COUNT(*) as meses_folha, MAX(ano) as ultimo_ano
  FROM contracheques
  GROUP BY nome
`).all().map(s => ({
  ...s,
  _search: normalize(`${s.nome} ${s.cargo} ${s.vinculo}`)
}));

// 2. Empresas & Socios Index
const empresas = db.prepare(`
  SELECT cnpj, razao_social, nome_fantasia, situacao_cadastral, capital_social, total_geral, qtd_contratos, possui_alerta_vinculo, alerta_detalhe, municipio, uf 
  FROM empresas_contratadas
`).all().map(e => ({
  ...e,
  _search: normalize(`${e.razao_social} ${e.nome_fantasia} ${e.cnpj} ${e.municipio} ${e.alerta_detalhe}`)
}));

const socios = db.prepare(`
  SELECT cnpj, nome_socio, qualificacao_socio, vinculo_politico_alerta 
  FROM empresas_socios
`).all().map(s => ({
  ...s,
  _search: normalize(`${s.nome_socio} ${s.qualificacao_socio} ${s.vinculo_politico_alerta}`)
}));

// 3. Eleições Index
const eleicoes = db.prepare(`
  SELECT ano, cargo, numero, nome_urna, nome_completo, partido_sigla, situacao, resultado, votos, foto_local 
  FROM eleicoes_candidatos
`).all().map(c => ({
  ...c,
  _search: normalize(`${c.nome_urna} ${c.nome_completo} ${c.cargo} ${c.partido_sigla} ${c.numero} ${c.ano} ${c.resultado}`)
}));

// 4. Vereadores Index
const vereadores = db.prepare(`
  SELECT id, nome_parlamentar, nome_completo, ativo, total_materias, projetos_lei, indicacoes, fotografia 
  FROM camara_vereadores
`).all().map(v => ({
  ...v,
  _search: normalize(`${v.nome_parlamentar} ${v.nome_completo}`)
}));

// 5. Contratos Index
const contratos = db.prepare(`
  SELECT nr_contrato, credor, doc_credor, valor, objeto, dt_ini_vigencia, tipo_contrato 
  FROM contratos
`).all().map(c => ({
  ...c,
  _search: normalize(`${c.nr_contrato} ${c.credor} ${c.doc_credor} ${c.objeto}`)
}));

// 6. Turismo Index
const turismo = db.prepare(`
  SELECT id, nome, categoria, distancia_centro_km, descricao 
  FROM turismo_pontos
`).all().map(t => ({
  ...t,
  _search: normalize(`${t.nome} ${t.categoria} ${t.descricao}`)
}));

console.timeEnd('Load Index');

function searchGlobal(query) {
  console.time(`Search "${query}"`);
  const norm = normalize(query);
  const tokens = norm.split(' ').filter(Boolean);

  const match = item => tokens.every(t => item._search.includes(t));

  const res = {
    servidores: servidores.filter(match).slice(0, 6),
    empresas: empresas.filter(match).slice(0, 6),
    socios: socios.filter(match).slice(0, 6),
    eleicoes: eleicoes.filter(match).slice(0, 6),
    vereadores: vereadores.filter(match).slice(0, 6),
    contratos: contratos.filter(match).slice(0, 6),
    turismo: turismo.filter(match).slice(0, 6),
  };
  console.timeEnd(`Search "${query}"`);
  console.log(`Results count: serv=${res.servidores.length}, emp=${res.empresas.length}, soc=${res.socios.length}, ele=${res.eleicoes.length}, ver=${res.vereadores.length}, cont=${res.contratos.length}, tur=${res.turismo.length}`);
}

searchGlobal('saude');
searchGlobal('unai');
searchGlobal('duraes');
searchGlobal('boi preto');
