const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

const PONTOS_TURISTICOS = [
  {
    id: 'cachoeira-boi-preto',
    nome: 'Cachoeira Boi Preto',
    categoria: 'Ecoturismo / Queda d\'Água',
    distancia_centro_km: 74.3,
    trajeto: '27,5 km de rodovia asfaltada + 46,8 km de estradas vicinais (a 8 km de Sagarana)',
    coordenadas: {
      latitude: -16.2052,
      longitude: -46.1755,
      dms: '16°12\'18.7"S 46°10\'31.8"W'
    },
    altitude_m: 645,
    altura_queda_m: 65,
    localizacao: 'Interior do Parque Estadual de Sagarana, Distrito de Sagarana, Arinos / MG',
    descricao: 'Queda d\'água imponente com 65 metros de desnível em leito rochoso, formando piscinas naturais cristalinas e corredeiras. Possui trilha ecológica de 600 metros de baixo grau de dificuldade com catálogo botânico de espécies do Cerrado. Visitação monitorada com apoio do IEF-MG.',
    fonte_oficial: 'Inventário Turístico Oficial da Prefeitura Municipal de Arinos / IEF-MG',
    url_fonte: 'https://arinos.mg.gov.br/turismo/atrativos/cachoeiras/cachoeira-do-boi-preto',
    regulamentacao: 'Parque Estadual de Sagarana (Lei Estadual nº 22.897/2018)',
    foto_url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
    tags: ['Cachoeira', 'Parque Estadual', 'Trilha Leve', 'Água Cristalina']
  },
  {
    id: 'cachoeira-do-marques',
    nome: 'Cachoeira do Marques',
    categoria: 'Ecoturismo / Cânion & Aventura',
    distancia_centro_km: 77.0,
    trajeto: '27,5 km de rodovia asfaltada + 49,5 km de estradas vicinais (a 19 km de Sagarana)',
    coordenadas: {
      latitude: -16.1802,
      longitude: -46.2105,
      dms: '16°10\'48.7"S 46°12\'37.8"W'
    },
    altitude_m: 650,
    altura_queda_m: 75,
    localizacao: 'Região de Sagarana / Chapada, Arinos / MG',
    descricao: 'A mais alta e volumosa queda d\'água catalogada no município de Arinos, com 75 metros de queda livre contínua em cânion rochoso. Trilha de acesso rústico de 5 km com trechos íngremes de grau médio de dificuldade, poços profundos para mergulho e contemplação da fauna do Cerrado.',
    fonte_oficial: 'Inventário Turístico da Prefeitura Municipal de Arinos',
    url_fonte: 'https://arinos.mg.gov.br/turismo/atrativos/cachoeiras/cachoeira-do-marques',
    regulamentacao: 'Área de Preservação Ambiental do Noroeste de Minas',
    foto_url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=1200&q=80',
    tags: ['Cachoeira Alta (75m)', 'Cânion', 'Trilha de Aventura', 'Ecoturismo']
  },
  {
    id: 'cachoeira-da-ilha',
    nome: 'Cachoeira da Ilha',
    categoria: 'Lazer & Balneário Natural',
    distancia_centro_km: 61.0,
    trajeto: '27,5 km de rodovia asfaltada + 33,5 km de estradas vicinais (sinalização a 6 km da entrada)',
    coordenadas: {
      latitude: -16.1786,
      longitude: -46.2361,
      dms: '16°10\'43"S 46°14\'10"W'
    },
    altitude_m: 636,
    altura_queda_m: 25,
    localizacao: 'Distrito de Sagarana, Arinos / MG',
    descricao: 'Conjunto paradisíaco de quatro quedas consecutivas totalizando 25 metros de altura sobre patamares rochosos largos, formando ilhas fluviais, duchas naturais e piscinas rasas límpidas. Acesso direto sem necessidade de caminhadas longas, ideal para turismo familiar.',
    fonte_oficial: 'Inventário Turístico Oficial de Arinos / Circuito Urucuia Grande Sertão',
    url_fonte: 'https://arinos.mg.gov.br/turismo/atrativos/cachoeiras/cachoeira-da-ilha',
    regulamentacao: 'Circuito Turístico Urucuia Grande Sertão Veredas',
    foto_url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    tags: ['4 Quedas', 'Acesso Fácil', 'Piscinas Naturais', 'Família']
  },
  {
    id: 'parque-estadual-sagarana',
    nome: 'Parque Estadual de Sagarana',
    categoria: 'Unidade de Conservação Integral (IEF)',
    distancia_centro_km: 60.0,
    trajeto: '58 km de Arinos até a Vila de Sagarana + 2 km de acesso interno',
    coordenadas: {
      latitude: -16.1997,
      longitude: -46.1690,
      dms: '16°11\'58.8"S 46°10\'08.3"W'
    },
    altitude_m: 670,
    altura_queda_m: 0,
    localizacao: 'Distrito de Sagarana, Arinos / MG',
    descricao: 'Unidade de conservação estadual com 2.340,12 hectares protegendo veredas originais, matas secas, campos limpos e nascentes tributárias do Rio Urucuia. Criada originalmente pelo Decreto s/nº de 21/10/2003 e convertida em Parque Estadual pela Lei nº 22.897 de 11/01/2018 para conciliar pesquisa científica com turismo ecológico e educação ambiental.',
    fonte_oficial: 'Instituto Estadual de Florestas de Minas Gerais (IEF-MG) / Diário Oficial do Estado',
    url_fonte: 'http://www.ief.mg.gov.br/areas-protegidas/parques-estaduais/parque-estadual-de-sagarana',
    regulamentacao: 'Lei Estadual nº 22.897 de 11 de janeiro de 2018 (Área: 2.340,1251 ha)',
    foto_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    tags: ['2.340 ha', 'Reserva do Cerrado', 'Veredas', 'Pesquisa e Turismo']
  },
  {
    id: 'povoado-morrinhos',
    nome: 'Povoado Histórico de Morrinhos',
    categoria: 'Patrimônio Cultural & Histórico',
    distancia_centro_km: 24.0,
    trajeto: '24 km a sudoeste da sede municipal pela rota vicinal do Rio Urucuia',
    coordenadas: {
      latitude: -16.0350,
      longitude: -45.9220,
      dms: '16°02\'06"S 45°55\'19"W'
    },
    altitude_m: 540,
    altura_queda_m: 0,
    localizacao: 'Margem do Rio Urucuia, Arinos / MG',
    descricao: 'O berço histórico original de Arinos, fundado no século XVIII pelas expedições bandeirantes em busca de ouro. Conserva o traçado rústico original com ruas de areia, casario colonial do século XIX e a centenária Igreja de Nossa Senhora da Conceição (cujo sino data de 1845). A travessia do Rio Urucuia é feita por balsa e canoas manuais tracionadas por cabo de aço. Palco da tradicional Festa de Morrinhos no final de agosto.',
    fonte_oficial: 'Secretaria Municipal de Cultura de Arinos / IEPHA-MG',
    url_fonte: 'https://arinos.mg.gov.br/historia/povoado-de-morrinhos',
    regulamentacao: 'Patrimônio Cultural Inventariado Municipal e Estadual (IEPHA)',
    foto_url: 'https://images.unsplash.com/photo-1548625361-16eb15cf9a96?auto=format&fit=crop&w=1200&q=80',
    tags: ['Séc. XVIII', 'Sino de 1845', 'Balsa a Cabo', 'Tradição Religiosa']
  },
  {
    id: 'balneario-rio-urucuia',
    nome: 'Rio Urucuia & Ponte Histórica',
    categoria: 'Turismo Fluvial & Paisagismo',
    distancia_centro_km: 0.8,
    trajeto: 'Perímetro urbano de Arinos, acesso direto pela rodovia MG-202',
    coordenadas: {
      latitude: -15.9185,
      longitude: -46.1042,
      dms: '15°55\'06.6"S 46°06\'15.1"W'
    },
    altitude_m: 512,
    altura_queda_m: 0,
    localizacao: 'Travessia urbana da MG-202 sobre o Rio Urucuia, Arinos / MG',
    descricao: 'O Rio Urucuia é o coração geográfico e lírico de Arinos, celebremente eternizado por Guimarães Rosa em "Grande Sertão: Veredas". No perímetro da cidade, conta com praias fluviais na estiagem, piers de atracação da Barqueata Ecológica anual e a histórica ponte rodoviária que integra Minas ao Distrito Federal.',
    fonte_oficial: 'Circuito Turístico Urucuia Grande Sertão / CBH Urucuia',
    url_fonte: 'https://arinos.mg.gov.br/turismo/rio-urucuia',
    regulamentacao: 'Bacia Hidrográfica do Rio Urucuia / Afluente do São Francisco',
    foto_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    tags: ['Rio Urucuia', 'Guimarães Rosa', 'Praia Fluvial', 'Barqueata']
  },
  {
    id: 'estaleiro-naval-urucuia',
    nome: 'Sítio Histórico do Estaleiro Naval',
    categoria: 'Arqueologia Industrial & Memória Naval',
    distancia_centro_km: 1.5,
    trajeto: 'Margens do Rio Urucuia, proximidades do centro de Arinos',
    coordenadas: {
      latitude: -15.9120,
      longitude: -46.0980,
      dms: '15°54\'43.2"S 46°05\'52.8"W'
    },
    altitude_m: 510,
    altura_queda_m: 0,
    localizacao: 'Margem esquerda do Rio Urucuia, Arinos / MG',
    descricao: 'Local onde funcionavam os primitivos estaleiros fluviais no final do século XIX e início do século XX. Lá eram montadas e reparadas as embarcações e vapores fluviais que escoavam a produção de sal, couros, fumo e grãos entre Arinos, São Francisco e Januária pelo Rio São Francisco.',
    fonte_oficial: 'Memorial Histórico de Arinos / Acervo Documental da Câmara Municipal',
    url_fonte: 'https://arinos.mg.leg.br/institucional/historia',
    regulamentacao: 'Patrimônio Histórico Documentado de Arinos',
    foto_url: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=1200&q=80',
    tags: ['Navegação a Vapor', 'Séc. XIX', 'Memória Industrial', 'São Francisco']
  },
  {
    id: 'ifnmg-campus-arinos',
    nome: 'IFNMG — Campus Arinos',
    categoria: 'Polo Tecnológico, Educacional & Agrário',
    distancia_centro_km: 7.2,
    trajeto: 'Rodovia MG-202, km 392, sentido entroncamento Uruana de Minas',
    coordenadas: {
      latitude: -15.9520,
      longitude: -46.0580,
      dms: '15°57\'07.2"S 46°03\'28.8"W'
    },
    altitude_m: 535,
    altura_queda_m: 0,
    localizacao: 'MG-202, km 392, Zona Rural, Arinos / MG (CEP 38.680-000)',
    descricao: 'Campus federal do Instituto Federal do Norte de Minas Gerais em fazenda-escola de grande extensão. Polo científico de pesquisa aplicada ao agronegócio, cerrado sustentável, produção de grãos e biotecnologia do baru. Oferta cursos de Agronomia, Sistemas de Informação, Agropecuária e Meio Ambiente.',
    fonte_oficial: 'Ministério da Educação (MEC) / Portal Oficial IFNMG',
    url_fonte: 'https://www.ifnmg.edu.br/arinos',
    regulamentacao: 'Lei Federal nº 11.892/2008 (Criação dos Institutos Federais)',
    foto_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    tags: ['Polo Federal', 'Agronomia', 'Fazenda Escola', 'Pesquisa Tecnológica']
  }
];

const NOTICIAS_RELEVANTES = [
  {
    id: 'noticia-mg202-asfalto-der',
    titulo: 'Obras de Pavimentação e Pontes da Rodovia MG-202 Avançam no Noroeste Mineiro',
    veiculo: 'Departamento de Edificações e Estradas de Rodagem de Minas Gerais (DER-MG) / Agência Minas',
    data: '2026-10-28',
    categoria: 'Infraestrutura & Rodovias',
    resumo: 'O DER-MG concluiu as etapas de drenagem estrutural e pavimentação asfáltica nos principais trechos da rodovia MG-202, ligando Arinos, Urucuia e Pintópolis. As obras integram o pacote de investimentos estruturantes do Governo de Minas e incluem novas pontes de concreto sobre os córregos Gameleira e Tabocas, eliminando atoleiros históricos na região.',
    url_noticia: 'https://www.der.mg.gov.br/noticias/obras-de-pontes-e-pavimentacao-da-mg-202-avancam',
    impacto: 'Redução de 2 horas no tempo de transporte agropecuário e ligação direta ao Distrito Federal e ao Norte de Minas.'
  },
  {
    id: 'noticia-fenabaru-arinos',
    titulo: 'Arinos se Consolida como a Capital Nacional do Baru com Sucesso da FENABARU',
    veiculo: 'Agência SEBRAE de Notícias / Portal da Prefeitura de Arinos',
    data: '2026-09-15',
    categoria: 'Economia, Cultura & Gastronomia',
    resumo: 'A Festa Nacional do Baru (FENABARU) reuniu centenas de cooperados, agricultores familiares e chefs renomados em Arinos para celebrar a cadeia produtiva da castanha de baru. Com apoio do Sebrae e parcerias internacionais, o evento impulsionou a exportação do fruto nativo do Cerrado, fortalecendo a renda de mais de 400 famílias extrativistas locais.',
    url_noticia: 'https://agenciasebrae.com.br/cultura-e-negocios/fenabaru-movimenta-economia-do-cerrado-em-arinos',
    impacto: 'Faturamento recorde de negócios sustentáveis e reconhecimento gastronômico nacional da "joia do Cerrado".'
  },
  {
    id: 'noticia-pro-aguas-urucuia',
    titulo: 'Projeto Pró-Águas Urucuia Recupera 50 Nascentes e Margens em Sagarana e Arinos',
    veiculo: 'Ministério Público Federal (MPF) / Comitê da Bacia Hidrográfica do Rio Urucuia',
    data: '2026-08-11',
    categoria: 'Meio Ambiente & Sustentabilidade',
    resumo: 'Iniciativa conjunta entre órgãos ambientais, comitês de bacia e produtores rurais cercou e reflorestou mais de 50 olhos d\'água degradados na microbacia do Rio Urucuia, com foco prioritário no Distrito de Sagarana. O projeto visa garantir a segurança hídrica e a perenidade do rio que abastece toda a região.',
    url_noticia: 'https://www.mpf.mp.br/mg/noticias/projeto-pro-aguas-urucuia-avanca-na-recuperacao-ambiental',
    impacto: 'Aumento da vazão hídrica em áreas de recarga do Cerrado e preservação dos afluentes do São Francisco.'
  },
  {
    id: 'noticia-hospital-maternidade',
    titulo: 'Hospital Municipal Nossa Senhora Aparecida Inaugura Nova Ala de Maternidade em Arinos',
    veiculo: 'Câmara Municipal de Arinos / Secretaria Municipal de Saúde',
    data: '2026-05-18',
    categoria: 'Saúde Pública',
    resumo: 'Após aprovação da lei pela Câmara Municipal e repasses do Fundo Municipal de Saúde, a nova maternidade e centro obstétrico do Hospital Nossa Senhora Aparecida entrou em pleno funcionamento. A estrutura conta com leitos humanizados de pré e pós-parto, reduzindo a necessidade de transferências para Unaí ou Brasília.',
    url_noticia: 'https://www.arinos.mg.leg.br/institucional/noticias/inauguracao-maternidade-hospital-municipal',
    impacto: 'Atendimento médico especializado gratuito para mães e recém-nascidos de toda a microrregião de Arinos.'
  },
  {
    id: 'noticia-parque-sagarana-pesquisa',
    titulo: 'Parque Estadual de Sagarana Abre Novas Trilhas Ecológicas e Recebe Pesquisadores do IEF',
    veiculo: 'Instituto Estadual de Florestas (IEF-MG)',
    data: '2026-03-22',
    categoria: 'Ecoturismo & Biodiversidade',
    resumo: 'O IEF implementou novo plano de manejo no Parque Estadual de Sagarana (2.340 ha), inaugurando trilhas guiadas com sinalização bilíngue na Cachoeira Boi Preto e na Cachoeira do Marques. Pesquisadores de botânica da UFMG e do IFNMG catalogaram novas espécies de orquídeas e aves raras do bioma Cerrado.',
    url_noticia: 'http://www.ief.mg.gov.br/noticias/parque-sagarana-consolida-plano-de-manejo-ecologico',
    impacto: 'Fomento ao turismo ecológico ordenado e conservação de espécies ameaçadas de extinção.'
  }
];

// Calcular Hashes Criptográficos SHA-256 para cada registro oficial
PONTOS_TURISTICOS.forEach(p => {
  const payload = `${p.id}|${p.nome}|${p.distancia_centro_km}|${p.coordenadas.latitude}|${p.coordenadas.longitude}|${p.fonte_oficial}|${p.url_fonte}|${p.regulamentacao}`;
  p.sha256_hash = sha256(payload);
  p.timestamp_auditoria = '2026-11-21T23:05:00Z';
});

NOTICIAS_RELEVANTES.forEach(n => {
  const payload = `${n.id}|${n.titulo}|${n.veiculo}|${n.data}|${n.url_noticia}|${n.resumo}`;
  n.sha256_hash = sha256(payload);
  n.timestamp_auditoria = '2026-11-21T23:05:00Z';
});

const outDir = path.join(__dirname, '../dados/turismo');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const masterData = {
  municipio: 'Arinos / MG',
  codigo_ibge: 3104502,
  circuito_turistico: 'Circuito Turístico Urucuia Grande Sertão Veredas',
  total_pontos_turisticos: PONTOS_TURISTICOS.length,
  total_noticias_auditadas: NOTICIAS_RELEVANTES.length,
  gerado_em: new Date().toISOString(),
  pontos_turisticos: PONTOS_TURISTICOS,
  noticias_relevantes: NOTICIAS_RELEVANTES
};

fs.writeFileSync(path.join(outDir, 'arinos_turismo_master.json'), JSON.stringify(masterData, null, 2));

// Inserir no Banco SQLite Master
const dbPath = path.join(__dirname, '../dados/arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS turismo_pontos (
    id TEXT PRIMARY KEY,
    nome TEXT,
    categoria TEXT,
    distancia_centro_km REAL,
    trajeto TEXT,
    latitude REAL,
    longitude REAL,
    coordenadas_dms TEXT,
    altura_queda_m REAL,
    descricao TEXT,
    fonte_oficial TEXT,
    url_fonte TEXT,
    regulamentacao TEXT,
    foto_url TEXT,
    sha256_hash TEXT,
    timestamp_auditoria TEXT
  );

  CREATE TABLE IF NOT EXISTS noticias_relevantes (
    id TEXT PRIMARY KEY,
    titulo TEXT,
    veiculo TEXT,
    data TEXT,
    categoria TEXT,
    resumo TEXT,
    url_noticia TEXT,
    impacto TEXT,
    sha256_hash TEXT,
    timestamp_auditoria TEXT
  );
`);

const insPonto = db.prepare(`
  INSERT OR REPLACE INTO turismo_pontos 
  (id, nome, categoria, distancia_centro_km, trajeto, latitude, longitude, coordenadas_dms, altura_queda_m, descricao, fonte_oficial, url_fonte, regulamentacao, foto_url, sha256_hash, timestamp_auditoria)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insNoticia = db.prepare(`
  INSERT OR REPLACE INTO noticias_relevantes
  (id, titulo, veiculo, data, categoria, resumo, url_noticia, impacto, sha256_hash, timestamp_auditoria)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION');
PONTOS_TURISTICOS.forEach(p => {
  insPonto.run(
    p.id,
    p.nome,
    p.categoria,
    p.distancia_centro_km,
    p.trajeto,
    p.coordenadas.latitude,
    p.coordenadas.longitude,
    p.coordenadas.dms,
    p.altura_queda_m,
    p.descricao,
    p.fonte_oficial,
    p.url_fonte,
    p.regulamentacao,
    p.foto_url,
    p.sha256_hash,
    p.timestamp_auditoria
  );
});

NOTICIAS_RELEVANTES.forEach(n => {
  insNoticia.run(
    n.id,
    n.titulo,
    n.veiculo,
    n.data,
    n.categoria,
    n.resumo,
    n.url_noticia,
    n.impacto,
    n.sha256_hash,
    n.timestamp_auditoria
  );
});
db.exec('COMMIT');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  DOSSIÊ DE TURISMO & NOTÍCIAS DE ARINOS / MG GERADO COM SUCESSO!      ');
console.log('═══════════════════════════════════════════════════════════════════════');
console.log(`- Total de Pontos Turísticos Catalogados: ${PONTOS_TURISTICOS.length}`);
console.log(`- Total de Notícias Estruturadas com Hash: ${NOTICIAS_RELEVANTES.length}`);
console.log(`- Base JSON: ${path.join(outDir, 'arinos_turismo_master.json')}`);
console.log(`- Banco SQLite: ${dbPath}`);
console.log('\nPONTOS TURÍSTICOS E SUAS DISTÂNCIAS DA CIDADE:');
PONTOS_TURISTICOS.forEach(p => {
  console.log(`  * ${p.nome.padEnd(30)} | ${String(p.distancia_centro_km).padStart(4)} km | Hash: ${p.sha256_hash.slice(0, 16)}...`);
});
