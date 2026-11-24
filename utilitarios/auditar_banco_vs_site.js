const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath, { readOnly: true });

async function auditar() {
  console.log('=== AUDITORIA COMPLETA: BANCO LOCAL vs PORTAL MG CIDADES (SIAP) ===\n');

  // 1. Verificar todas as tabelas
  const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(t => t.name);
  console.log('Tabelas encontradas no banco:', tabelas.join(', '));

  // 2. Verificar anos e meses na tabela contracheques
  console.log('\n--- CONTAGEM NA TABELA contracheques (LOCAL) ---');
  const mesesContracheques = db.prepare(`
    SELECT ano, mes, count(*) as total_local
    FROM contracheques
    GROUP BY ano, mes
    ORDER BY ano DESC, mes DESC
  `).all();
  console.log(`Total de competências no banco: ${mesesContracheques.length}`);

  // 3. Vamos amostrar competências de vários anos para comparar com o site oficial (MG Cidades / SIAP)
  // Amostra de anos: 2026, 2024, 2020, 2016, 2013, 2012, 2010, 2008, 2006
  const competenciasAmostra = [
    { ano: 2026, mes: 5 },
    { ano: 2024, mes: 6 },
    { ano: 2020, mes: 3 },
    { ano: 2015, mes: 8 },
    { ano: 2013, mes: 1 },
    { ano: 2012, mes: 12 },
    { ano: 2012, mes: 11 },
    { ano: 2012, mes: 1 },
    { ano: 2011, mes: 12 },
    { ano: 2010, mes: 6 },
    { ano: 2008, mes: 10 },
    { ano: 2006, mes: 1 }
  ];

  console.log('\n--- COMPARATIVO COM A API OFICIAL DO MG CIDADES / SIAP FOLHA ---');
  const resultados = [];

  for (const comp of competenciasAmostra) {
    const url = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha?cnpj=18125120000180&organizacao=310450201&ano=${comp.ano}&mes=${comp.mes}`;
    
    let totalSite = 'Erro/Timeout';
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'AuditoriaTransparencia' } });
      if (res.ok) {
        const dados = await res.json();
        totalSite = Array.isArray(dados) ? dados.length : 0;
      } else {
        totalSite = `HTTP ${res.status}`;
      }
    } catch (e) {
      totalSite = 'Erro rede';
    }

    // Consulta no banco local
    const local = db.prepare(`
      SELECT count(*) as qtd 
      FROM contracheques 
      WHERE ano = ? AND mes = ?
    `).get(comp.ano, comp.mes);

    const qtdLocal = local ? local.qtd : 0;
    const bateu = (typeof totalSite === 'number' && totalSite === qtdLocal);

    resultados.push({
      competencia: `${comp.ano}/${String(comp.mes).padStart(2, '0')}`,
      site_mg_cidades: totalSite,
      banco_local: qtdLocal,
      status: bateu ? '✔ 100% EXATO' : (qtdLocal === 0 ? '○ PENDENTE EXTRAÇÃO' : '⚠ DIVERGÊNCIA')
    });
  }

  console.table(resultados);

  // 4. Resumo Geral por Ano de 2006 a 2012
  console.log('\n--- RESUMO CONSOLIDADO 2006 A 2012 NO BANCO LOCAL ---');
  const anosConsolidados = db.prepare(`
    SELECT ano, count(*) as total_servidores, sum(total_proventos) as total_folha
    FROM contracheques
    WHERE ano BETWEEN 2006 AND 2012
    GROUP BY ano
    ORDER BY ano DESC
  `).all();
  console.table(anosConsolidados);
}

auditar().catch(e => console.error(e));
