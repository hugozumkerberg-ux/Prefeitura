const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    // Ensure https
    const targetUrl = url.replace('http://sapl.arinos.mg.leg.br', 'https://sapl.arinos.mg.leg.br');
    const client = targetUrl.startsWith('https') ? https : http;
    client.get(targetUrl, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Erro JSON (${res.statusCode}) em ${targetUrl}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllEndpoint(endpointPath) {
  const results = [];
  let nextUrl = `https://sapl.arinos.mg.leg.br/api/${endpointPath}?format=json&page_size=100`;
  let page = 1;
  while (nextUrl) {
    process.stdout.write(`  -> [${endpointPath}] pág ${page}... `);
    const data = await fetchJson(nextUrl);
    if (data.results && Array.isArray(data.results)) {
      results.push(...data.results);
      if (data.pagination && data.pagination.links && data.pagination.links.next) {
        nextUrl = data.pagination.links.next;
        page++;
      } else {
        nextUrl = null;
      }
    } else if (Array.isArray(data)) {
      results.push(...data);
      nextUrl = null;
    } else {
      nextUrl = null;
    }
  }
  console.log(`Concluído (${results.length} itens)`);
  return results;
}

function normalizeName(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  EXTRAÇÃO COMPLETA: CÂMARA MUNICIPAL DE ARINOS / MG (SAPL)            ');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const outDir = path.join(__dirname, '../dados/camara');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('[1/7] Baixando Parlamentares...');
  const parlamentares = await fetchAllEndpoint('parlamentares/parlamentar/');

  console.log('[2/7] Baixando Autores & Mapeamento...');
  const autores = await fetchAllEndpoint('base/autor/');

  console.log('[3/7] Baixando Tipos de Matéria...');
  const tiposMateria = await fetchAllEndpoint('materia/tipomaterialegislativa/');
  const mapTipos = {};
  tiposMateria.forEach(t => { mapTipos[t.id] = t.descricao || t.nome || t.sigla || `Tipo ${t.id}`; });

  console.log('[4/7] Baixando Status de Tramitação...');
  const statusTramitacao = await fetchAllEndpoint('materia/statustramitacao/');
  const mapStatus = {};
  statusTramitacao.forEach(s => { mapStatus[s.id] = s.descricao || s.sigla || `Status ${s.id}`; });

  console.log('[5/7] Baixando Matérias Legislativas (Projetos, Indicações, Requerimentos)...');
  const materias = await fetchAllEndpoint('materia/materialegislativa/');

  console.log('[6/7] Baixando Registros de Autoria...');
  const autorias = await fetchAllEndpoint('materia/autoria/');

  console.log('[7/7] Baixando Mandatos & Cargos na Mesa Diretora...');
  const mandatos = await fetchAllEndpoint('parlamentares/mandato/');
  const composicaoMesa = await fetchAllEndpoint('parlamentares/composicaomesa/');
  const cargosMesa = await fetchAllEndpoint('parlamentares/cargomesa/');
  const mapCargosMesa = {};
  cargosMesa.forEach(c => { mapCargosMesa[c.id] = c.descricao || c.cargo || `Cargo ${c.id}`; });

  console.log('\nCruzando e estruturando os dados...');

  // Map autor ID -> parlamentar ID
  const mapAutorToParlamentar = {};
  const mapAutorToNome = {};
  autores.forEach(a => {
    mapAutorToNome[a.id] = a.nome;
    if (a.object_id) {
      mapAutorToParlamentar[a.id] = a.object_id;
    }
  });

  // Map materia ID -> materia info
  const mapMaterias = {};
  materias.forEach(m => {
    mapMaterias[m.id] = {
      id: m.id,
      tipo_id: m.tipo,
      tipo: mapTipos[m.tipo] || 'Matéria Legislativa',
      numero: m.numero,
      ano: m.ano,
      titulo: m.__str__,
      ementa: m.ementa || '',
      indexacao: m.indexacao || '',
      data_apresentacao: m.data_apresentacao,
      texto_original: m.texto_original ? m.texto_original.replace('http://', 'https://') : null,
      em_tramitacao: m.em_tramitacao,
      autores: m.autores || []
    };
  });

  // Organizar produções legislativas por parlamentar ID
  const materiasPorParlamentar = {};
  parlamentares.forEach(p => {
    materiasPorParlamentar[p.id] = [];
  });

  // 1. Pelo campo autoria
  autorias.forEach(aut => {
    const parlId = mapAutorToParlamentar[aut.autor];
    const mat = mapMaterias[aut.materia];
    if (parlId && mat) {
      if (!materiasPorParlamentar[parlId]) materiasPorParlamentar[parlId] = [];
      if (!materiasPorParlamentar[parlId].some(x => x.id === mat.id)) {
        materiasPorParlamentar[parlId].push({
          ...mat,
          primeiro_autor: aut.primeiro_autor
        });
      }
    }
  });

  // 2. Pelo array m.autores caso faltou na tabela autoria
  materias.forEach(m => {
    if (Array.isArray(m.autores)) {
      m.autores.forEach(autId => {
        const parlId = mapAutorToParlamentar[autId];
        if (parlId) {
          if (!materiasPorParlamentar[parlId]) materiasPorParlamentar[parlId] = [];
          if (!materiasPorParlamentar[parlId].some(x => x.id === m.id)) {
            materiasPorParlamentar[parlId].push({
              ...mapMaterias[m.id],
              primeiro_autor: true
            });
          }
        }
      });
    }
  });

  // Organizar cargos de mesa por parlamentar
  const cargosPorParlamentar = {};
  composicaoMesa.forEach(cm => {
    const parlId = cm.parlamentar;
    if (parlId) {
      if (!cargosPorParlamentar[parlId]) cargosPorParlamentar[parlId] = [];
      cargosPorParlamentar[parlId].push({
        cargo: mapCargosMesa[cm.cargo] || 'Membro da Mesa',
        periodo: cm.periodo || cm.sessao_legislativa || 'Legislatura'
      });
    }
  });

  // Organizar mandatos por parlamentar
  const mandatosPorParlamentar = {};
  mandatos.forEach(mand => {
    const parlId = mand.parlamentar;
    if (parlId) {
      if (!mandatosPorParlamentar[parlId]) mandatosPorParlamentar[parlId] = [];
      mandatosPorParlamentar[parlId].push({
        legislatura: mand.legislatura,
        numero_legislatura: mand.num_legislatura,
        tipo_causa_fim: mand.tipo_causa_fim_mandato
      });
    }
  });

  // Classificar e resumir vereadores
  const vereadoresConsolidados = parlamentares.map(p => {
    const mats = materiasPorParlamentar[p.id] || [];
    
    // Contagem por tipo
    const porTipo = {};
    const porAno = {};
    let projetosLei = 0;
    let indicacoes = 0;
    let requerimentos = 0;
    let mocoes = 0;

    mats.forEach(m => {
      porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
      if (m.ano) porAno[m.ano] = (porAno[m.ano] || 0) + 1;

      const tLow = (m.tipo || '').toLowerCase();
      if (tLow.includes('lei')) projetosLei++;
      else if (tLow.includes('indica')) indicacoes++;
      else if (tLow.includes('requer')) requerimentos++;
      else if (tLow.includes('mo')) mocoes++;
    });

    // Detectar principais temas
    const temas = {
      'Saúde': 0,
      'Educação': 0,
      'Infraestrutura & Obras': 0,
      'Zona Rural & Agricultura': 0,
      'Água & Saneamento': 0,
      'Esporte & Juventude': 0,
      'Social & Comunidade': 0,
      'Iluminação Pública': 0
    };

    mats.forEach(m => {
      const text = `${m.ementa} ${m.indexacao}`.toLowerCase();
      if (text.match(/saude|hospital|posto|medico|remedio|ubs|upa|enferm/)) temas['Saúde']++;
      if (text.match(/escola|educa|professor|creche|aluno|transporte escolar/)) temas['Educação']++;
      if (text.match(/asfalto|paviment|calcamento|ponte|estrada|bueiro|reforma|prac|obra/)) temas['Infraestrutura & Obras']++;
      if (text.match(/rural|assentamento|comunidade|agricult|produtor|poco|trator/)) temas['Zona Rural & Agricultura']++;
      if (text.match(/agua|esgoto|saneamento|copasa|caixa d'agua/)) temas['Água & Saneamento']++;
      if (text.match(/esporte|campo|quadra|futebol|lazer|torneio/)) temas['Esporte & Juventude']++;
      if (text.match(/social|cesta|idoso|crianca|moradia|habitacao/)) temas['Social & Comunidade']++;
      if (text.match(/ilumina|lampada|poste|luz/)) temas['Iluminação Pública']++;
    });

    const topTemas = Object.entries(temas)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([tema, count]) => ({ tema, count }));

    return {
      id: p.id,
      nome_parlamentar: p.nome_parlamentar || p.nome_completo,
      nome_completo: p.nome_completo,
      ativo: p.ativo,
      sexo: p.sexo,
      telefone_celular: p.telefone_celular || '',
      email: p.email || '',
      locais_atuacao: p.locais_atuacao || 'Câmara Municipal de Arinos',
      fotografia: p.fotografia ? p.fotografia.replace('http://', 'https://') : null,
      total_materias: mats.length,
      projetos_lei: projetosLei,
      indicacoes: indicacoes,
      requerimentos: requerimentos,
      mocoes: mocoes,
      materias_por_tipo: porTipo,
      materias_por_ano: porAno,
      top_temas: topTemas,
      cargos_mesa: cargosPorParlamentar[p.id] || [],
      mandatos: mandatosPorParlamentar[p.id] || [],
      materias: mats.sort((a, b) => (b.ano || 0) - (a.ano || 0) || (b.numero || 0) - (a.numero || 0))
    };
  });

  // Ordenar por total de matérias e atividade recente
  vereadoresConsolidados.sort((a, b) => b.total_materias - a.total_materias);

  const stats = {
    total_parlamentares: vereadoresConsolidados.length,
    parlamentares_com_materias: vereadoresConsolidados.filter(v => v.total_materias > 0).length,
    total_materias: materias.length,
    total_autorias: autorias.length,
    tipos_materia: mapTipos,
    ranking_proposicoes: vereadoresConsolidados.map(v => ({
      id: v.id,
      nome: v.nome_parlamentar,
      ativo: v.ativo,
      total: v.total_materias,
      pls: v.projetos_lei,
      ind: v.indicacoes,
      req: v.requerimentos
    }))
  };

  fs.writeFileSync(path.join(outDir, 'arinos_camara_master.json'), JSON.stringify(vereadoresConsolidados, null, 2));
  fs.writeFileSync(path.join(outDir, 'arinos_camara_stats.json'), JSON.stringify(stats, null, 2));

  // Inserir no SQLite arinos_transparencia_master.sqlite3
  const dbPath = path.join(__dirname, '../dados/arinos_transparencia_master.sqlite3');
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS camara_vereadores (
      id INTEGER PRIMARY KEY,
      nome_parlamentar TEXT,
      nome_completo TEXT,
      ativo INTEGER,
      sexo TEXT,
      telefone TEXT,
      email TEXT,
      fotografia TEXT,
      total_materias INTEGER,
      projetos_lei INTEGER,
      indicacoes INTEGER,
      requerimentos INTEGER,
      mocoes INTEGER,
      top_temas TEXT,
      dados_completos TEXT
    );

    CREATE TABLE IF NOT EXISTS camara_materias (
      id INTEGER PRIMARY KEY,
      tipo TEXT,
      numero INTEGER,
      ano INTEGER,
      titulo TEXT,
      ementa TEXT,
      indexacao TEXT,
      data_apresentacao TEXT,
      texto_original TEXT,
      em_tramitacao INTEGER,
      autores_ids TEXT,
      parlamentar_principal_id INTEGER
    );
  `);

  const insVer = db.prepare(`
    INSERT OR REPLACE INTO camara_vereadores 
    (id, nome_parlamentar, nome_completo, ativo, sexo, telefone, email, fotografia, total_materias, projetos_lei, indicacoes, requerimentos, mocoes, top_temas, dados_completos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insMat = db.prepare(`
    INSERT OR REPLACE INTO camara_materias
    (id, tipo, numero, ano, titulo, ementa, indexacao, data_apresentacao, texto_original, em_tramitacao, autores_ids, parlamentar_principal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  vereadoresConsolidados.forEach(v => {
    insVer.run(
      v.id,
      v.nome_parlamentar,
      v.nome_completo,
      v.ativo ? 1 : 0,
      v.sexo,
      v.telefone_celular,
      v.email,
      v.fotografia,
      v.total_materias,
      v.projetos_lei,
      v.indicacoes,
      v.requerimentos,
      v.mocoes,
      JSON.stringify(v.top_temas),
      JSON.stringify(v)
    );
  });

  materias.forEach(m => {
    const auts = m.autores || [];
    const parlId = auts.length > 0 ? (mapAutorToParlamentar[auts[0]] || null) : null;
    insMat.run(
      m.id,
      mapTipos[m.tipo] || 'Matéria Legislativa',
      m.numero || 0,
      m.ano || 0,
      m.__str__ || '',
      m.ementa || '',
      m.indexacao || '',
      m.data_apresentacao || '',
      m.texto_original ? m.texto_original.replace('http://', 'https://') : '',
      m.em_tramitacao ? 1 : 0,
      JSON.stringify(auts),
      parlId
    );
  });
  db.exec('COMMIT');

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  RELATÓRIO DE SUCESSO: ATIVIDADE PARLAMENTAR DE ARINOS / MG           ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`- Total de Parlamentares Catalogados: ${stats.total_parlamentares}`);
  console.log(`- Parlamentares com Proposições Vinculadas: ${stats.parlamentares_com_materias}`);
  console.log(`- Total de Matérias Legislativas Extraídas: ${stats.total_materias}`);
  console.log(`- Base SQLite Atualizada com Sucesso: ${dbPath}`);
  console.log('\nTOP 10 VEREADORES COM MAIS PROPOSIÇÕES NA HISTÓRIA RECENTE:');
  stats.ranking_proposicoes.slice(0, 10).forEach((r, idx) => {
    console.log(`  ${idx+1}. ${r.nome.padEnd(25)} | Total: ${String(r.total).padStart(3)} (PLs: ${r.pls}, Indicações: ${r.ind}, Requerimentos: ${r.req})`);
  });
}

main().catch(console.error);
