const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '..', 'dados', 'arinos_transparencia_master.sqlite3');
const db = new DatabaseSync(dbPath, { readOnly: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testarMeses() {
  for (const item of [{ ano: 2012, mes: 1 }, { ano: 2011, mes: 12 }, { ano: 2026, mes: 5 }]) {
    await sleep(600);
    const url = `https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/portal-transparencia/folha?cnpj=18125120000180&organizacao=310450201&ano=${item.ano}&mes=${item.mes}`;
    const res = await fetch(url);
    const d = await res.json();
    const local = db.prepare('SELECT count(*) as c FROM contracheques WHERE ano=? AND mes=?').get(item.ano, item.mes);
    console.log(`${item.ano}/${item.mes} -> Site: ${d.length} | Local: ${local ? local.c : 0} | Bateu? ${d.length === (local ? local.c : 0)}`);
  }
}

testarMeses();
