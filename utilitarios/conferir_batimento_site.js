const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath, { readOnly: true });

async function conferir() {
  console.log('=== BATIMENTO: BANCO LOCAL vs PORTAL OFICIAL SIAP / MG CIDADES ===\n');

  // 1. Comparar Mês 2012/11
  const ano = 2012;
  const mes = 11;
  const urlFolha = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha?cnpj=18125120000180&organizacao=310450201&ano=${ano}&mes=${mes}`;

  const resApi = await fetch(urlFolha, {
    headers: { 'User-Agent': 'Mozilla/5.0 Auditoria/2.0' }
  });
  const dadosApi = await resApi.json();

  const totalServidoresApi = dadosApi.length;
  let somaBrutoApi = 0;
  for (const s of dadosApi) {
    somaBrutoApi += Number(s.proventototal) || 0;
  }

  // Consulta no Banco Local
  const dadosLocal = db.prepare(`
    SELECT count(*) as total_servidores, 
           sum(total_proventos) as soma_bruto,
           min(total_proventos) as min_salario,
           max(total_proventos) as max_salario
    FROM contracheques 
    WHERE ano = ? AND mes = ?
  `).get(ano, mes);

  console.log(`[Competência 2012/11]`);
  console.log(`- Portal Oficial (API SIAP): ${totalServidoresApi} servidores | R$ ${somaBrutoApi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`- Banco Local SQLite:        ${dadosLocal.total_servidores} servidores | R$ ${dadosLocal.soma_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`- Diferença Servidores:      ${dadosLocal.total_servidores - totalServidoresApi}`);
  console.log(`- Diferença Financeira:      R$ ${(dadosLocal.soma_bruto - somaBrutoApi).toFixed(2)}`);

  const bate100Folha = (dadosLocal.total_servidores === totalServidoresApi && Math.abs(dadosLocal.soma_bruto - somaBrutoApi) < 0.01);
  console.log(`- Batimento da Folha:        ${bate100Folha ? '✔ 100% IDÊNTICO (BATIMENTO EXATO AO CENTAVO)' : '❌ Divergência'}\n`);

  // 2. Comparar Rubricas Detalhadas de um Servidor Específico
  console.log(`[Batimento Detalhado de Rubricas - Servidor Amostral]`);
  const servidorAmostra = db.prepare(`
    SELECT c.id, c.hash_registro, c.nome, c.cargo, c.matricula, c.total_proventos, c.total_descontos, c.salario_liquido, c.idfun
    FROM contracheques c
    WHERE c.ano = 2012 AND c.mes = 12 AND c.detalhado = 1
    LIMIT 1
  `).get();

  if (servidorAmostra && servidorAmostra.idfun) {
    console.log(`Servidor: ${servidorAmostra.nome} (${servidorAmostra.cargo})`);
    console.log(`Chave SIAP: ${servidorAmostra.idfun}`);

    const urlDetalhe = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha/detalhe?chave=${encodeURIComponent(servidorAmostra.idfun)}`;
    const resDetalhe = await fetch(urlDetalhe);
    const rubricasApi = await resDetalhe.json();

    const rubricasLocal = db.prepare(`
      SELECT tipo, codigo_rubrica, descricao_rubrica, valor
      FROM contracheque_rubricas
      WHERE hash_contracheque = ?
      ORDER BY tipo DESC, valor DESC
    `).all(servidorAmostra.hash_registro);

    console.log(`\nRubricas no Portal Oficial (${rubricasApi.length} itens):`);
    console.table(rubricasApi);

    console.log(`Rubricas no Banco Local SQLite (${rubricasLocal.length} itens):`);
    console.table(rubricasLocal);

    let somaProvApi = 0;
    let somaDescApi = 0;
    for (const r of rubricasApi) {
      somaProvApi += Number(r.vlrprovento) || 0;
      somaDescApi += Number(r.vlrdesconto) || 0;
    }

    console.log(`Comparativo do Holerite:`);
    console.log(`- Proventos: Portal = R$ ${somaProvApi.toFixed(2)} | Banco = R$ ${servidorAmostra.total_proventos.toFixed(2)}`);
    console.log(`- Descontos: Portal = R$ ${somaDescApi.toFixed(2)} | Banco = R$ ${servidorAmostra.total_descontos.toFixed(2)}`);
    console.log(`- Líquido:   Portal = R$ ${(somaProvApi - somaDescApi).toFixed(2)} | Banco = R$ ${servidorAmostra.salario_liquido.toFixed(2)}`);
    
    const bateDetalhe = (Math.abs(somaProvApi - servidorAmostra.total_proventos) < 0.01 && Math.abs(somaDescApi - servidorAmostra.total_descontos) < 0.01);
    console.log(`- Batimento das Rubricas:    ${bateDetalhe ? '✔ 100% IDÊNTICO (CENTAVO POR CENTAVO)' : '❌ Divergência'}`);
  }
}

conferir().catch(err => console.error(err));
