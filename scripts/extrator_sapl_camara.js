const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message} (Status: ${res.statusCode})`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllPages(initialUrl) {
  let results = [];
  let nextUrl = initialUrl;
  let page = 1;
  while (nextUrl) {
    console.log(`[SAPL] Baixando página ${page}: ${nextUrl}`);
    const data = await fetchJson(nextUrl);
    if (data.results && Array.isArray(data.results)) {
      results.push(...data.results);
      nextUrl = data.next;
    } else if (Array.isArray(data)) {
      results.push(...data);
      nextUrl = null;
    } else {
      results.push(data);
      nextUrl = null;
    }
    page++;
    if (page > 30) break; // safety cap
  }
  return results;
}

async function main() {
  console.log('=== EXTRAINDO DADOS DA CÂMARA MUNICIPAL DE ARINOS (SAPL) ===');
  
  // 1. Parlamentares
  console.log('\n--- 1. PARLAMENTARES ---');
  const parlamentares = await fetchAllPages('https://sapl.arinos.mg.leg.br/api/parlamentares/parlamentar/?format=json');
  console.log(`Total de parlamentares encontrados: ${parlamentares.length}`);
  
  // 2. Tipos de matérias
  console.log('\n--- 2. TIPOS DE MATÉRIA LEGISLATIVA ---');
  const tiposMateria = await fetchAllPages('https://sapl.arinos.mg.leg.br/api/materia/tipomaterialegislativa/?format=json');
  const mapTipos = {};
  tiposMateria.forEach(t => { mapTipos[t.id] = t.descricao || t.nome || t.sigla; });
  console.log('Tipos catalogados:', Object.keys(mapTipos).length);

  // 3. Matérias legislativas (Projetos, Indicações, Requerimentos, etc)
  console.log('\n--- 3. MATÉRIAS LEGISLATIVAS (PROJETOS, INDICAÇÕES, LEIS) ---');
  const materias = await fetchAllPages('https://sapl.arinos.mg.leg.br/api/materia/materialegislativa/?format=json');
  console.log(`Total de matérias encontradas: ${materias.length}`);

  // 4. Autoria das matérias
  console.log('\n--- 4. AUTORIA DAS MATÉRIAS ---');
  const autorias = await fetchAllPages('https://sapl.arinos.mg.leg.br/api/materia/autoria/?format=json');
  console.log(`Total de registros de autoria: ${autorias.length}`);

  // 5. Salvar base local bruta
  const outDir = path.join(__dirname, '../dados/camara');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'sapl_parlamentares.json'), JSON.stringify(parlamentares, null, 2));
  fs.writeFileSync(path.join(outDir, 'sapl_tipos_materia.json'), JSON.stringify(tiposMateria, null, 2));
  fs.writeFileSync(path.join(outDir, 'sapl_materias.json'), JSON.stringify(materias, null, 2));
  fs.writeFileSync(path.join(outDir, 'sapl_autorias.json'), JSON.stringify(autorias, null, 2));

  console.log(`\nDados salvos com sucesso em: ${outDir}`);
}

main().catch(console.error);
